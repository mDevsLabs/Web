import "server-only";

import { generateTitleFromConversation } from "@/app/(chat)/actions";
import { getAgentRunById } from "@/lib/db/agent-queries";
import {
  saveMessages,
  updateChatTitleById,
  updateMessage,
} from "@/lib/db/queries";
import type { ChatMessage } from "@/lib/types";
import { getTextFromMessage } from "@/lib/utils";

// Persistance de la conversation Agent. Les runs, steps et exécutions d'outils
// sont enregistrés séparément ; ce module ne gère que les messages affichés,
// afin que la reprise après refresh restitue exactement la conversation.

export async function persistAgentRunMessages(params: {
  chatId: string;
  executionOwner?: string | null;
  existingMessages: ChatMessage[];
  finishedMessages: ChatMessage[];
  firstUserMessageForTitle: ChatMessage | null;
  isContinuation: boolean;
  runId?: string;
  shouldRenameAfterFirst: boolean;
  userId?: string;
}): Promise<void> {
  if (params.runId && params.executionOwner && params.userId) {
    const run = await getAgentRunById({
      id: params.runId,
      userId: params.userId,
    }).catch(() => null);
    if (!run || run.executionOwner !== params.executionOwner) return;
  }
  if (params.finishedMessages.length === 0) {
    return;
  }

  if (params.isContinuation) {
    await Promise.all(
      params.finishedMessages.map(async (finishedMessage) => {
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
      messages: params.finishedMessages.map((message) => ({
        attachments: [],
        chatId: params.chatId,
        createdAt: new Date(),
        id: message.id,
        parts: message.parts,
        role: message.role,
      })),
    });
  }

  if (!(params.shouldRenameAfterFirst && params.firstUserMessageForTitle)) {
    return;
  }

  try {
    const assistantMessage = [...params.finishedMessages]
      .reverse()
      .find((message) => message.role === "assistant");
    const assistantText = assistantMessage
      ? (getTextFromMessage(assistantMessage) || "").slice(0, 500).trim()
      : "";
    const userText = getTextFromMessage(params.firstUserMessageForTitle);
    const title = await generateTitleFromConversation({
      assistantText,
      userText,
    });
    if (title && title !== "Nouvelle discussion") {
      await updateChatTitleById({ chatId: params.chatId, title });
    }
  } catch (error) {
    console.error("Erreur renommage conversation Agent :", error);
  }
}
