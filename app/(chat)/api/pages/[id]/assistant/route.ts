import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { fetchUserModels } from "@/lib/ai/models.server";
import { getLanguageModel } from "@/lib/ai/providers";
import { createReasoningDetailsSink } from "@/lib/ai/reasoning-details";
import { createReasoningChunkWriter } from "@/lib/ai/reasoning-stream";
import { getModelCapabilitiesFor } from "@/lib/ai/registry";
import { resolveReasoningEffort } from "@/lib/ai/registry/capabilities";
import { resolveReasoningProviderOptions } from "@/lib/ai/registry/reasoning";
import { isModelAllowedForTier } from "@/lib/ai/registry/tiers";
import { errorResponse } from "@/lib/api/error-response";
import { getMaiSessionToken } from "@/lib/auth/session";
import { enforceChatRateLimit, weeklyQuotaExceeded } from "@/lib/chat/auth";
import { replacePageMessages } from "@/lib/db/queries/pages";
import { getUserPreferences } from "@/lib/db/queries/users";
import { getPageAccess } from "@/lib/pages/access";
import { pageErrorResponse, requirePageSession } from "@/lib/pages/http";
import { PAGE_MESSAGE_KEEP } from "@/lib/pages/limits";
import { canUsePageAssistant } from "@/lib/pages/permissions";
import { memoryBlockForPage } from "@/lib/pages/personal";
import { createPageTools } from "@/lib/pages/tools";
import { recordPageTokenUsage } from "@/lib/pages/usage";
import { buildPageSystemPrompt } from "@/lib/prompts/pages";
import { generateUUID } from "@/lib/utils";

export const maxDuration = 60;

type Params = { params: Promise<{ id: string }> };

const messageSchema = z.object({
  id: z.string().min(1).max(128),
  parts: z.array(z.unknown()).max(80),
  role: z.enum(["user", "assistant", "system"]),
});

const bodySchema = z.object({
  intent: z.enum(["edit", "propose"]).optional(),
  messages: z.array(messageSchema).min(1).max(PAGE_MESSAGE_KEEP),
  modelId: z.string().max(120).optional(),
  selection: z.string().max(8000).optional(),
});

async function resolveModel(params: {
  requested?: string;
  tier: string;
  userId: string;
}) {
  const [catalogue, prefs] = await Promise.all([
    fetchUserModels().catch(() => []),
    getUserPreferences(params.userId).catch(() => null),
  ]);
  const preferred = prefs?.defaultChatModel;
  const fallback =
    preferred && isModelAllowedForTier(preferred, params.tier)
      ? preferred
      : DEFAULT_CHAT_MODEL;
  const requested = params.requested?.trim();
  if (!requested) {
    return { catalogue, modelId: fallback, prefs };
  }
  const known = catalogue.some((model) => model.id === requested);
  const allowed = isModelAllowedForTier(requested, params.tier);
  return {
    catalogue,
    modelId: known && allowed ? requested : fallback,
    prefs,
  };
}

export async function POST(request: Request, { params }: Params) {
  try {
    const auth = await requirePageSession();
    if ("error" in auth) {
      return auth.error;
    }
    if (weeklyQuotaExceeded(auth.session.user)) {
      return errorResponse("quota_exceeded", {
        details: {
          limit: auth.session.user.limit,
          resetAt: auth.session.user.resetAt,
          used: auth.session.user.tokensUsed,
        },
        message:
          "Votre limite hebdomadaire de tokens est atteinte. Consultez la page des forfaits mAI pour continuer.",
      });
    }
    await enforceChatRateLimit(request, auth.userId);
    const { id } = await params;
    const access = await getPageAccess({
      pageId: id,
      userEmail: auth.email,
      userId: auth.userId,
    });
    if (!access || !canUsePageAssistant(access.role)) {
      return errorResponse("not_found", { message: "Page introuvable." });
    }
    const body = bodySchema.parse(await request.json().catch(() => ({})));
    const incoming = body.messages.slice(-PAGE_MESSAGE_KEEP);
    const last = incoming.at(-1);
    if (last?.role !== "user") {
      return errorResponse("invalid_request", {
        message: "Le dernier message doit venir de vous.",
      });
    }
    const requestedModel = body.modelId || access.page.modelId || undefined;
    const { catalogue, modelId, prefs } = await resolveModel({
      requested: requestedModel,
      tier: auth.session.user.tier,
      userId: auth.userId,
    });
    const capabilities = getModelCapabilitiesFor(
      modelId,
      catalogue.length > 0 ? catalogue : undefined
    );
    const effort = resolveReasoningEffort({
      capabilities,
      preferred: prefs?.reasoningLevel,
    });
    const providerOptions = effort.effort
      ? resolveReasoningProviderOptions(effort.effort)
      : undefined;
    const memoryBlock = await memoryBlockForPage({
      projectId: access.page.projectId ?? null,
      tier: auth.session.user.tier,
      userId: auth.userId,
    });
    const system = buildPageSystemPrompt({
      accountEnabled: Boolean(prefs?.enabled),
      accountInstructions: prefs?.customInstructions ?? null,
      intent: body.intent ?? "propose",
      memoryBlock,
      pagePrompt: access.page.customPrompt,
      projectInstructions: access.projectInstructions,
      selection: body.selection ?? null,
    });
    const storedUserId = access.page.userId;
    const pageId = access.page.id;
    const projectId = access.page.projectId;
    await replacePageMessages({
      messages: incoming.map((message) => ({
        id: message.id,
        parts: message.parts,
        role: message.role,
      })),
      pageId,
      userId: storedUserId,
    });

    const usageEventKey = generateUUID();
    const sessionToken = await getMaiSessionToken();
    const uiMessages = incoming as unknown as UIMessage[];
    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        const reasoningSink = createReasoningDetailsSink();
        const reasoningWriter = createReasoningChunkWriter(
          writer,
          `reasoning-${pageId}`
        );
        reasoningSink.onDelta = (text) => reasoningWriter.push(text);
        const model = getLanguageModel(modelId, {
          reasoningSink,
          sessionToken,
          userId: auth.userId,
        });
        const result = streamText({
          abortSignal: request.signal,
          ...(providerOptions ? { providerOptions } : {}),
          messages: await convertToModelMessages(uiMessages),
          model,
          onAbort() {
            reasoningWriter.finish();
          },
          onEnd: async ({ totalUsage }) => {
            reasoningWriter.finish();
            const usage = totalUsage as {
              completionTokens?: number;
              inputTokens?: number;
              outputTokens?: number;
              promptTokens?: number;
              totalTokens?: number;
            };
            try {
              await recordPageTokenUsage({
                model: modelId,
                projectId,
                sessionToken,
                usage,
                usageEventKey,
                userEmail: auth.email,
                userId: auth.userId,
              });
            } catch (error) {
              console.error("[pages] décompte", error);
            }
          },
          onError() {
            reasoningWriter.finish();
          },
          stopWhen: stepCountIs(8),
          system,
          tools: createPageTools({
            pageId,
            userId: storedUserId,
            writer,
          }),
        });
        writer.merge(result.toUIMessageStream({ sendReasoning: true }));
      },
      generateId: () => generateUUID(),
      onEnd: async ({ responseMessage }) => {
        const thread = [...incoming];
        if (responseMessage?.id && responseMessage.parts.length > 0) {
          const index = thread.findIndex(
            (message) => message.id === responseMessage.id
          );
          const next = {
            id: responseMessage.id,
            parts: responseMessage.parts,
            role: responseMessage.role as "assistant" | "system" | "user",
          };
          if (index >= 0) {
            thread[index] = next;
          } else if (
            next.role === "assistant" ||
            next.role === "user" ||
            next.role === "system"
          ) {
            thread.push(next);
          }
        }
        await replacePageMessages({
          messages: thread.flatMap((message) => {
            if (
              message.role !== "user" &&
              message.role !== "assistant" &&
              message.role !== "system"
            ) {
              return [];
            }
            return [
              {
                id: message.id,
                parts: message.parts,
                role: message.role,
              },
            ];
          }),
          pageId,
          userId: storedUserId,
        });
      },
      originalMessages: uiMessages,
    });
    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    return pageErrorResponse(error);
  }
}
