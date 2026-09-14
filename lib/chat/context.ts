import { geolocation } from "@vercel/functions";
import { convertToModelMessages, type ModelMessage } from "ai";
import { chatOwnerMatches } from "@/lib/agent/channel";
import { DEFAULT_CHAT_MODEL, getModelCapabilities } from "@/lib/ai/models";
import type { RequestHints } from "@/lib/ai/prompts";
import { substituteSkillParams } from "@/lib/ai/skill-params";
import type { ChatAuth } from "@/lib/chat/auth";
import { getUserApiKey } from "@/lib/db/api-keys";
import {
  getAgentById,
  getChatById,
  getMessagesByChatId,
  getProjectById,
  getSkillById,
  getUserModelPreferences,
  saveChat,
  saveMessages,
  trackSkillUsage,
  updateChatProjectById,
} from "@/lib/db/queries";
import type { Chat, DBMessage } from "@/lib/db/schema";
import { ChatbotError } from "@/lib/errors";
import type { ChatMessage } from "@/lib/types";
import { convertToUIMessages } from "@/lib/utils";

export type ChatRequestBodyShape = {
  id: string;
  message: ChatMessage | null;
  messages: ChatMessage[] | null;
  agentId: string | null;
  selectedAgentId: string | null;
  selectedChatModel: string;
  selectedChatMode?: string | null;
  selectedVisibilityType: "public" | "private";
  projectId?: string | null;
  skillId?: string | null;
  skillParams?: Record<string, string> | null;
  pendingPrompt?: { commandId?: string; text: string } | null;
  tags?: string[];
  customInstructions?: string;
  temperatureOverride?: number | null;
  enabledTools?: string[];
  isGhostMode: boolean;
  // Mode de la conversation créée : « chat » (défaut) ou « agent ».
  mode?: "chat" | "agent";
};

export type ChatRequestContext = {
  // Requête brute
  id: string;
  message: ChatMessage | null;
  messages: ChatMessage[] | null;
  selectedChatMode?: string | null;
  selectedVisibilityType: "public" | "private";
  projectId?: string | null;
  tags?: string[];
  customInstructions?: string;
  temperatureOverride?: number | null;
  isGhostMode: boolean;

  // Auth (lib/chat/auth)
  sessionToken: string;
  maiUser: ChatAuth["maiUser"];
  userId: string;
  userEmail: string;
  isFreeUser: boolean;

  // Résolutions projet / skill / agent / modèle
  chat: Chat | null;
  effectiveProjectId: string | null | undefined;
  effectiveSkillId: string | null;
  effectiveAgentId: string | null;
  skillInstructions: string | null;
  skillTools: string[];
  skillMcpServerIds: string[];
  skillMcpToolFilter: Record<string, string[] | null> | null;
  agentInstructions: string | null;
  agentSkillIds: string[];
  agentTemperature: number | null;
  agentTopP: number | null;
  agentMaxTokens: number | null;
  chatModel: string;

  // Flux
  isToolApprovalFlow: boolean;
  userApiKey: string | null;
  shouldRenameAfterFirst: boolean;
  firstUserMessageForTitle: ChatMessage | null;
  uiMessages: ChatMessage[];
  requestHints: RequestHints;
  modelMessages: ModelMessage[];

  // Préférences utilisateur (table users)
  userCustomInstructions: string | null;
  userCustomEnabled: boolean;
  userDefaultTemp: number | null;
  userDefaultTopP: number | null;

  // Overrides au niveau chat
  chatCustomInstructions: string | null;
  chatTempOverride: number | null;

  // Extraits pour prompt.ts
  projectCustomInstructions: string | null;
  enabledTools?: string[];
  pendingPrompt?: { commandId?: string; text: string } | null;
};

export async function buildChatContext(
  request: Request,
  auth: ChatAuth,
  body: ChatRequestBodyShape
): Promise<ChatRequestContext> {
  const {
    id,
    message,
    messages,
    selectedChatMode,
    selectedVisibilityType,
    projectId: projectIdInput,
    skillId,
    skillParams,
    tags,
    customInstructions,
    temperatureOverride,
    isGhostMode,
    mode,
  } = body;
  const { maiUser, sessionToken, userId, isFreeUser } = auth;

  // projectId est réassignable : un projet périmé côté client est neutralisé
  // (voir plus bas) au lieu de faire échouer toute la requête.
  let projectId: string | null | undefined = projectIdInput;

  const chat = await getChatById({ id });
  // Borne d'accès au projet rattaché à la conversation : un chat stocké avec
  // un projet supprimé ou transféré ne doit pas faire échouer la requête — le
  // contexte projet est simplement neutralisé (garde stricte conservée pour la
  // création et le déplacement explicites plus bas).
  const effectiveProjectId = (chat as any)?.projectId || projectId;
  if (effectiveProjectId) {
    const projectOwned = await getProjectById({
      id: effectiveProjectId,
      userEmail: maiUser.email,
      userId,
    }).catch(() => null);
    if (!projectOwned) {
      console.warn(
        `[chat-access] project_context_unavailable mode=${mode ?? "chat"} action=skip_project_context`
      );
      projectId = null;
    }
  }
  let projectCustomInstructions: string | null = null;
  let projectDefaultModel: string | null = null;

  if (effectiveProjectId) {
    try {
      const proj = await getProjectById({
        id: effectiveProjectId,
        userEmail: maiUser.email,
        userId,
      });
      if (proj?.customInstructions) {
        projectCustomInstructions = proj.customInstructions;
      }
      if (proj?.defaultModel) {
        projectDefaultModel = proj.defaultModel;
      }
    } catch {}
  }

  // Les Skills sont ouverts à tous les forfaits, y compris Free. En revanche,
  // les serveurs MCP intégrés à un skill restent réservés aux forfaits payants.
  const effectiveSkillId = (chat as any)?.skillId || skillId;
  let skillInstructions: string | null = null;
  let skillTools: string[] = [];
  let skillMcpServerIds: string[] = [];
  let skillMcpToolFilter: Record<string, string[] | null> | null = null;

  if (effectiveSkillId) {
    try {
      const activeSkill = await getSkillById({
        id: effectiveSkillId,
        userId,
      });
      if (activeSkill) {
        skillInstructions = substituteSkillParams(
          activeSkill.instructions,
          skillParams
        );
        if (Array.isArray(activeSkill.tools)) {
          skillTools = activeSkill.tools as string[];
        }
        if (!isFreeUser && Array.isArray(activeSkill.mcpServerIds)) {
          skillMcpServerIds = activeSkill.mcpServerIds as string[];
        }
        if (
          !isFreeUser &&
          activeSkill.mcpToolFilter &&
          typeof activeSkill.mcpToolFilter === "object"
        ) {
          skillMcpToolFilter = activeSkill.mcpToolFilter as Record<
            string,
            string[] | null
          >;
        }
        trackSkillUsage({ skillId: activeSkill.id, userId }).catch(() => {});
      }
    } catch {}
  }

  // Agent remplace Mode IA — agentId envoyé par use-active-chat (cookie + DB)
  const agentIdFromBody: string | null = isFreeUser
    ? null
    : (body.agentId ?? body.selectedAgentId ?? null);
  const chatModelFromAgent: string | null =
    !isFreeUser && body.selectedChatModel ? body.selectedChatModel : null;
  // Si un agent est actif, son modèle par défaut prime (global cookie déjà mis à jour côté client)
  let agentInstructions: string | null = null;
  let agentDefaultModel: string | null = null;
  let agentSkillIds: string[] = [];
  let agentTemperature: number | null = null;
  let agentTopP: number | null = null;
  let agentMaxTokens: number | null = null;
  const effectiveAgentId = isFreeUser
    ? null
    : (chat as any)?.agentId || agentIdFromBody || null;
  if (effectiveAgentId) {
    try {
      const ag = await getAgentById({ id: effectiveAgentId, userId });
      if (ag) {
        agentInstructions = ag.instructions || null;
        agentDefaultModel = ag.defaultModelId || null;
        agentTemperature = (ag as any).temperature ?? null;
        agentTopP = (ag as any).topP ?? null;
        agentMaxTokens = (ag as any).maxTokens ?? null;
        if (Array.isArray(ag.skillIds)) {
          agentSkillIds = ag.skillIds as string[];
        }
      }
    } catch {}
  }
  const chatModel =
    chatModelFromAgent ||
    agentDefaultModel ||
    projectDefaultModel ||
    DEFAULT_CHAT_MODEL;
  const isToolApprovalFlow = Boolean(messages);

  // Règle: bloquer l'envoi de fichiers si le modèle ne supporte pas vision/file
  if (message?.parts) {
    const hasFilePart = message.parts.some((p: any) => p.type === "file");
    if (hasFilePart) {
      const caps = getModelCapabilities(chatModel);
      if (!caps.vision) {
        throw new ChatbotError(
          "bad_request:api",
          "Ce modèle ne prend pas en charge les fichiers/images. Changez de modèle ou retirez les pièces jointes."
        );
      }
    }
  }

  // Récupérer la clé API Neon du compte
  const userApiKey = maiUser.id ? await getUserApiKey(maiUser.id) : null;

  let messagesFromDb: DBMessage[] = [];
  let shouldRenameAfterFirst = false;
  let firstUserMessageForTitle: ChatMessage | null = null;

  if (chat) {
    // Identité canonique : chat.userId peut avoir été enregistré avec l'id,
    // l'email ou le username (créations historiques). Le contrôle d'écriture
    // passe par la garde partagée chatOwnerMatches (lib/agent/channel.ts), en
    // cohérence avec le chemin de lecture (/api/messages).
    const ownerMatches = chatOwnerMatches({
      chatUserId: chat.userId,
      email: maiUser.email,
      userId,
      username: maiUser.username,
    });
    if (!ownerMatches) {
      // Journal structuré sans donnée sensible : variante d'identité et état,
      // pour distinguer une conversation étrangère d'un décalage d'identité.
      const ownerVariant =
        chat.userId === maiUser.email
          ? "email"
          : chat.userId === maiUser.username
            ? "username"
            : "other";
      console.warn(
        `[chat-access] chat_ownership_mismatch mode=${mode ?? "chat"} ownerVariant=${ownerVariant} canonicalIsEmail=${userId === maiUser.email}`
      );
      throw new ChatbotError("forbidden:chat");
    }
    messagesFromDb = await getMessagesByChatId({ id });
    // Renommer seulement si c'est la première interaction (pas de messages en DB)
    if (
      !isGhostMode &&
      messagesFromDb.length === 0 &&
      message?.role === "user" &&
      chat.title === "Nouvelle discussion"
    ) {
      shouldRenameAfterFirst = true;
      firstUserMessageForTitle = message;
    }
  } else if (message?.role === "user" && !isGhostMode) {
    if (projectId) {
      // Le client ne fait pas autorité : un projectId périmé (supprimé ou
      // inaccessible) ne doit pas bloquer l'envoi. La conversation part sans
      // projet ; la borne d'accès au projet reste stricte pour les usages
      // réels (contexte projet, déplacement de conversations existantes).
      const proj = await getProjectById({
        id: projectId,
        userEmail: maiUser.email,
        userId,
      }).catch(() => null);
      if (!proj) {
        console.warn(
          `[chat-access] project_not_found mode=${mode ?? "chat"} action=fallback_no_project`
        );
        projectId = null;
      }
    }
    await saveChat({
      agentId: effectiveAgentId ?? null,
      customInstructions: customInstructions ?? null,
      id,
      mode: mode ?? "chat",
      modeId: selectedChatMode ?? undefined,
      projectId: projectId ?? null,
      skillId: effectiveSkillId ?? null,
      tags: tags ?? [],
      temperatureOverride: temperatureOverride ?? null,
      title: "Nouvelle discussion",
      userId,
      visibility: selectedVisibilityType,
    });
    shouldRenameAfterFirst = true;
    firstUserMessageForTitle = message;
  } else if (chat && projectId !== undefined && !isGhostMode) {
    // Update project association on existing chat if explicitly passed
    try {
      await updateChatProjectById({
        chatId: id,
        email: maiUser.email,
        projectId: projectId ?? null,
        userId,
      });
    } catch {}
  }

  let uiMessages: ChatMessage[];

  if (isToolApprovalFlow && messages) {
    const dbMessages = convertToUIMessages(messagesFromDb);
    const toolUpdates = new Map(
      messages.flatMap(
        (m) =>
          m.parts
            ?.filter(
              (p: Record<string, unknown>) =>
                p.state === "approval-responded" ||
                p.state === "output-denied" ||
                p.state === "output-available"
            )
            .map((p: Record<string, unknown>) => [
              String(p.toolCallId ?? ""),
              p,
            ]) ?? []
      )
    );
    uiMessages = dbMessages.map((msg) => ({
      ...msg,
      parts: msg.parts.map((part) => {
        if ("toolCallId" in part && toolUpdates.has(String(part.toolCallId))) {
          return { ...part, ...toolUpdates.get(String(part.toolCallId)) };
        }
        return part;
      }),
    })) as ChatMessage[];
  } else {
    uiMessages = [
      ...convertToUIMessages(messagesFromDb),
      message as ChatMessage,
    ];
  }

  const { longitude, latitude, city, country } = geolocation(request);

  const requestHints: RequestHints = {
    city,
    country,
    latitude,
    longitude,
  };

  if (message?.role === "user" && !isGhostMode) {
    await saveMessages({
      messages: [
        {
          attachments: [],
          chatId: id,
          createdAt: new Date(),
          id: message.id,
          parts: message.parts,
          role: "user",
        },
      ],
    });
  }

  const modelMessages = await convertToModelMessages(uiMessages);

  // Récupérer custom instructions utilisateur + chat
  const userPrefs = await getUserModelPreferences(userId);

  // Chat-level overrides (persisted in Chat table)
  const chatCustomInstructions =
    (chat as any)?.customInstructions ?? customInstructions ?? null;
  const chatTempOverride =
    (chat as any)?.temperatureOverride ?? temperatureOverride ?? null;

  return {
    agentInstructions,
    agentMaxTokens,
    agentSkillIds,
    agentTemperature,
    agentTopP,

    chat,

    chatCustomInstructions,
    chatModel,
    chatTempOverride,
    customInstructions,
    effectiveAgentId,
    effectiveProjectId,
    effectiveSkillId,
    enabledTools: body.enabledTools,
    firstUserMessageForTitle,
    id,
    isFreeUser,
    isGhostMode,

    isToolApprovalFlow,
    maiUser,
    message,
    messages,
    modelMessages,
    pendingPrompt: body.pendingPrompt,

    projectCustomInstructions,
    projectId,
    requestHints,
    selectedChatMode,
    selectedVisibilityType,

    sessionToken,
    shouldRenameAfterFirst,
    skillInstructions,
    skillMcpServerIds,
    skillMcpToolFilter,
    skillTools,
    tags,
    temperatureOverride,
    uiMessages,
    userApiKey,
    userCustomEnabled: userPrefs.customInstructionsEnabled,

    userCustomInstructions: userPrefs.customInstructions,
    userDefaultTemp: userPrefs.defaultTemperature,
    userDefaultTopP: userPrefs.defaultTopP,
    userEmail: maiUser.email,
    userId,
  };
}
