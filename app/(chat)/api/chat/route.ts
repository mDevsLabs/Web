import { getLanguageModel } from "@/lib/ai/providers";
import { errorResponse } from "@/lib/api/error-response";
import { isPaidTier } from "@/lib/auth/plan";
import { getMaiUser } from "@/lib/auth/session";
import {
  authenticateChatRequest,
  enforceChatRateLimit,
  weeklyQuotaExceeded,
} from "@/lib/chat/auth";
import { buildChatContext } from "@/lib/chat/context";
import { loadMcpContext } from "@/lib/chat/mcp";
import { buildMemoryContext } from "@/lib/chat/memory";
import { buildPromptAddendum } from "@/lib/chat/prompt";
import { createChatStream, createChatStreamResponse } from "@/lib/chat/stream";
import { createChatTools } from "@/lib/chat/tools";
import {
  deleteChatById,
  getChatById,
  getPluginInstallationsByUserId,
} from "@/lib/db/queries";
import {
  createPluginTools,
  getToolIdsForPluginIds,
  isKnownPluginToolId,
} from "@/lib/plugins/server";
import { ChatbotError } from "@/lib/errors";
import { type PostRequestBody, postRequestBodySchema } from "./schema";

export const maxDuration = 300;

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch {
    return new ChatbotError("bad_request:api").toResponse();
  }

  try {
    const body = requestBody as PostRequestBody & {
      projectId?: string | null;
      skillId?: string | null;
      skillParams?: Record<string, string> | null;
      pendingPrompt?: { commandId?: string; text: string } | null;
      tags?: string[];
      customInstructions?: string;
      temperatureOverride?: number | null;
      enabledTools?: string[];
      isGhostMode?: boolean;
    };

    const { auth, error } = await authenticateChatRequest();

    if (error === "forbidden") {
      return new ChatbotError("forbidden:api").toResponse();
    }

    if (error === "unauthorized" || !auth) {
      return new ChatbotError("unauthorized:chat").toResponse();
    }

    // 1. Vérification du quota hebdomadaire
    if (weeklyQuotaExceeded(auth.maiUser)) {
      return errorResponse("quota_exceeded", {
        details: {
          limit: auth.maiUser.limit,
          resetAt: auth.maiUser.resetAt,
          used: auth.maiUser.tokensUsed,
        },
        message:
          "Votre limite hebdomadaire de tokens est atteinte. Veuillez mettre à niveau votre forfait sur https://mai-devs.vercel.app pour continuer.",
      });
    }

    await enforceChatRateLimit(request, auth.userId);

    // 2. Résolution du contexte (chat, projet, skill, agent, mémoire utilisateur)
    const ctx = await buildChatContext(request, auth, {
      agentId: (body as any).agentId ?? null,
      customInstructions: body.customInstructions,
      enabledTools: body.enabledTools,
      id: body.id,
      isGhostMode: body.isGhostMode ?? false,
      message: (body.message as any) ?? null,
      messages: (body.messages as any) ?? null,
      pendingPrompt: body.pendingPrompt,
      projectId: body.projectId,
      selectedAgentId: (body as any).selectedAgentId ?? null,
      selectedChatMode: body.selectedChatMode,
      selectedChatModel: (body as any).selectedChatModel ?? "",
      selectedVisibilityType: body.selectedVisibilityType,
      skillId: body.skillId,
      skillParams: body.skillParams,
      tags: body.tags,
      temperatureOverride: body.temperatureOverride,
    });

    // 3. Mémoire personnalisée (globale ou spécifique agent + projet)
    const memoryCtx = await buildMemoryContext({
      effectiveAgentId: ctx.effectiveAgentId,
      effectiveProjectId: ctx.effectiveProjectId ?? null,
      isGhostMode: ctx.isGhostMode,
      tier: ctx.maiUser.tier,
      userId: ctx.userId,
    });

    // 4. Plugins installés et activés pour l'utilisateur : seuls leurs outils
    // peuvent être instanciés, même si le client les mentionne. Les plugins
    // sont réservés aux forfaits payants : la vérification du forfait est
    // refaite ici, indépendamment de l'état d'installation.
    const pluginsAllowed = isPaidTier(ctx.maiUser.tier);
    const pluginInstallations =
      ctx.isGhostMode || !pluginsAllowed
        ? []
        : await getPluginInstallationsByUserId({ userId: ctx.userId });
    const enabledPluginIds = pluginInstallations
      .filter((installation) => installation.isEnabled)
      .map((installation) => installation.pluginId);
    const installedPluginToolIds = getToolIdsForPluginIds(enabledPluginIds);

    // 5. Addendum de prompt (instructions, mémoire, outils, commande)
    const { effectiveAddendum, requestedTools } = await buildPromptAddendum(
      ctx,
      memoryCtx,
      { availablePluginToolIds: installedPluginToolIds }
    );

    // 5. Température effective: chat override > agent > user default (plus de mode)
    const effectiveTemperature =
      ctx.chatTempOverride ??
      ctx.agentTemperature ??
      ctx.userDefaultTemp ??
      undefined;
    const effectiveTopP = ctx.agentTopP ?? ctx.userDefaultTopP ?? undefined;
    const effectiveMaxTokens = ctx.agentMaxTokens ?? undefined;

    // 6. Initialiser le modèle de langage mAI
    const model = getLanguageModel(ctx.chatModel, {
      apiKey: ctx.userApiKey,
      sessionToken: ctx.sessionToken,
      userId: ctx.maiUser.id,
    });

    // 6. Flux : MCP + outils + streamText (préparés à l'intérieur du stream)
    const stream = createChatStream({
      ctx,
      effectiveMaxTokens,
      effectiveTemperature,
      effectiveTopP,
      model,
      prepareTools: async (dataStream) => {
        const mcpCtx = await loadMcpContext({
          chatId: ctx.id,
          isToolApprovalFlow: ctx.isToolApprovalFlow,
          messages: ctx.messages as any,
          requestedTools,
          skillMcpServerIds: ctx.skillMcpServerIds,
          skillMcpToolFilter: ctx.skillMcpToolFilter,
          userId: ctx.userId,
        });

        // Outils actifs : statiques demandés + outils de plugins installés +
        // clés MCP. Un outil de plugin demandé mais non installé/activé est
        // ignoré (garde serveur, le client ne fait pas autorité).
        const activePluginToolIds = requestedTools.filter(
          (t) =>
            isKnownPluginToolId(t) && installedPluginToolIds.includes(t)
        );
        const activeToolsList: string[] = [
          ...requestedTools.filter(
            (t) =>
              !isKnownPluginToolId(t) &&
              !t.startsWith("mcp_") &&
              t !== "mcp" &&
              !t.startsWith("mcp:")
          ),
          ...activePluginToolIds,
          ...(mcpCtx.hasMcpEnabled
            ? mcpCtx.mcpToolKeys
            : requestedTools.filter((t) => mcpCtx.mcpToolKeys.includes(t))),
        ];

        const finalEffectiveAddendum = mcpCtx.mcpAddendum
          ? `${effectiveAddendum ? `${effectiveAddendum}\n\n` : ""}${mcpCtx.mcpAddendum}`
          : effectiveAddendum;

        const pluginTools = createPluginTools(
          {
            chatModel: ctx.chatModel,
            dataStream,
            isGhostMode: ctx.isGhostMode,
            session: {
              token: ctx.sessionToken,
              user: ctx.isGhostMode
                ? null
                : { email: ctx.userEmail, id: ctx.userId },
            },
          },
          enabledPluginIds
        );

        const tools = createChatTools(
          {
            chatModel: ctx.chatModel,
            dataStream,
            effectiveAgentId: ctx.effectiveAgentId,
            isGhostMode: ctx.isGhostMode,
            maiUser: ctx.maiUser,
            memoryActive: memoryCtx.memoryActive,
            memoryAllowAdd: memoryCtx.memoryAllowAdd,
            memoryLimit: memoryCtx.memoryLimit,
            sessionToken: ctx.sessionToken,
            userEmail: ctx.userEmail,
            userId: ctx.userId,
          },
          mcpCtx.mcpTools,
          pluginTools
        );

        return {
          activeToolsList,
          effectiveAddendum: finalEffectiveAddendum,
          tools,
        };
      },
    });

    return createChatStreamResponse({
      chatId: ctx.id,
      isGhostMode: ctx.isGhostMode,
      stream,
    });
  } catch (error) {
    if (error instanceof ChatbotError) {
      return error.toResponse();
    }
    console.error("Unhandled error in chat API:", error);
    return new ChatbotError("offline:chat").toResponse();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new ChatbotError("bad_request:api").toResponse();
  }

  const maiUser = await getMaiUser();
  if (!maiUser) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  const chat = await getChatById({ id });
  if (!chat) {
    return new ChatbotError("not_found:chat").toResponse();
  }

  const userId = maiUser.id || maiUser.email;
  if (chat.userId !== userId && chat.userId !== maiUser.email) {
    return new ChatbotError("forbidden:chat").toResponse();
  }

  const deletedChat = await deleteChatById({ id });
  return Response.json(deletedChat, { status: 200 });
}
