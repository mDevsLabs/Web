import { geolocation } from "@vercel/functions";
import { convertToModelMessages, type ModelMessage } from "ai";
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
    projectId,
    skillId,
    skillParams,
    tags,
    customInstructions,
    temperatureOverride,
    isGhostMode,
  } = body;
  const { maiUser, sessionToken, userId, isFreeUser } = auth;

  const chat = await getChatById({ id });
  const effectiveProjectId = (chat as any)?.projectId || projectId;
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
    if (chat.userId !== userId && chat.userId !== maiUser.email) {
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
      const proj = await getProjectById({ id: projectId, userId });
      if (!proj) {
        throw new ChatbotError("not_found:database", "Projet introuvable");
      }
    }
    await saveChat({
      agentId: effectiveAgentId ?? null,
      customInstructions: customInstructions ?? null,
      id,
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
