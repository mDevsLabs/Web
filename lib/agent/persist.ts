import "server-only";

import { generateTitleFromConversation } from "@/app/(chat)/actions";
import { getAgentRunById } from "@/lib/db/agent-queries";
import {
  deleteMessagesAfterMessageId,
  saveMessages,
  updateChatTitleById,
  updateMessage,
} from "@/lib/db/queries";
import type { ChatMessage } from "@/lib/types";
import { getTextFromMessage } from "@/lib/utils";

// Persistance de la conversation Agent. Les runs, steps et exécutions d'outils
// sont enregistrés séparément ; ce module ne gère que les messages affichés,
// afin que la reprise après refresh restitue exactement la conversation.

export function isMeaningfulAgentMessage(message: ChatMessage): boolean {
  if (message.role !== "assistant") {
    return true;
  }
  const parts = message.parts ?? [];
  return parts.some((part) => {
    if (part.type === "text") {
      return Boolean(part.text?.trim());
    }
    if (part.type === "reasoning") {
      return Boolean((part as { text?: string }).text?.trim());
    }
    if (part.type === "file") {
      return true;
    }
    if (
      typeof part.type === "string" &&
      (part.type.startsWith("tool-") || part.type === "dynamic-tool")
    ) {
      return true;
    }
    return false;
  });
}

export async function persistAgentRunMessages(params: {
  chatId: string;
  executionOwner?: string | null;
  existingMessages: ChatMessage[];
  finishedMessages: ChatMessage[];
  firstUserMessageForTitle: ChatMessage | null;
  isContinuation: boolean;
  modelId?: string;
  outcomeStatus?: string;
  runId?: string;
  sessionToken?: string | null;
  shouldRenameAfterFirst: boolean;
  titleAlreadyGenerated?: boolean;
  truncateAfterMessageId?: string | null;
  userId?: string;
}): Promise<void> {
  if (params.runId && params.executionOwner && params.userId) {
    const run = await getAgentRunById({
      id: params.runId,
      userId: params.userId,
    }).catch(() => null);
    if (!run || run.executionOwner !== params.executionOwner) {
      return;
    }
  }

  const nonEmptyMessages = params.finishedMessages.filter(
    isMeaningfulAgentMessage
  );
  if (nonEmptyMessages.length === 0) {
    return;
  }

  if (params.isContinuation) {
    await Promise.all(
      nonEmptyMessages.map(async (finishedMessage) => {
        const existing = params.existingMessages.find(
          (message) => message.id === finishedMessage.id
        );
        if (existing) {
          await updateMessage({
            id: finishedMessage.id,
            parts: finishedMessage.parts,
          });
          return;
        }
        await saveMessages({
          messages: [
            {
              attachments: [],
              chatId: params.chatId,
              createdAt: new Date(),
              id: finishedMessage.id,
              parts: finishedMessage.parts,
              role: finishedMessage.role,
            },
          ],
        });
      })
    );
  } else {
    await saveMessages({
      messages: nonEmptyMessages.map((message) => ({
        attachments: [],
        chatId: params.chatId,
        createdAt: new Date(),
        id: message.id,
        parts: message.parts,
        role: message.role,
      })),
    });
  }

  if (
    params.truncateAfterMessageId &&
    (!params.outcomeStatus || params.outcomeStatus === "completed")
  ) {
    await deleteMessagesAfterMessageId({
      chatId: params.chatId,
      keepIds: nonEmptyMessages.map((m) => m.id),
      messageId: params.truncateAfterMessageId,
    }).catch((err) => {
      console.error("Erreur troncature après régénération Agent :", err);
    });
  }

  if (
    params.titleAlreadyGenerated ||
    (params.outcomeStatus && params.outcomeStatus !== "completed") ||
    !(params.shouldRenameAfterFirst && params.firstUserMessageForTitle)
  ) {
    return;
  }

  try {
    const assistantMessage = [...nonEmptyMessages]
      .reverse()
      .find((message) => message.role === "assistant");
    const assistantText = assistantMessage
      ? (getTextFromMessage(assistantMessage) || "").slice(0, 500).trim()
      : "";
    if (!assistantText) {
      return;
    }
    const userText = getTextFromMessage(params.firstUserMessageForTitle);
    const title = await generateTitleFromConversation({
      assistantText,
      modelId: params.modelId,
      sessionToken: params.sessionToken,
      userId: params.userId,
      userText,
    });
    if (title && title !== "Nouvelle discussion") {
      await updateChatTitleById({ chatId: params.chatId, title });
    }
  } catch (error) {
    console.error("Erreur renommage conversation Agent :", error);
  }
}
