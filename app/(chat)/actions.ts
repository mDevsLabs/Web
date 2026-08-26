"use server";

import { generateText, type UIMessage } from "ai";
import { cookies } from "next/headers";
import { auth } from "@/app/(auth)/auth";
import type { VisibilityType } from "@/components/chat/visibility-selector";
import { titlePrompt } from "@/lib/ai/prompts";
import { getTitleModel } from "@/lib/ai/providers";
import {
  deleteMessagesByChatIdAfterTimestamp,
  getChatById,
  getMessageById,
  updateChatVisibilityById,
} from "@/lib/db/queries";
import { getTextFromMessage } from "@/lib/utils";

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set("chat-model", model);
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: UIMessage;
}) {
  const text = getTextFromMessage(message);
  return generateTitleFromConversation({ assistantText: "", userText: text });
}

export async function generateTitleFromConversation({
  userText,
  assistantText,
}: {
  userText: string;
  assistantText: string;
}) {
  try {
    const { getMaiSessionToken, getMaiUser } = await import(
      "@/lib/auth/session"
    );
    const [token, user] = await Promise.all([
      getMaiSessionToken(),
      getMaiUser(),
    ]);

    const fallbackTitle =
      userText.replace(/^[#*"\s]+/, "").slice(0, 60).trim() ||
      "Nouvelle discussion";

    // Si pas de session valide ou si le quota est atteint, repli immédiat sans requête IA
    if (!token || !user || (user.limit > 0 && user.tokensUsed >= user.limit)) {
      return fallbackTitle;
    }

    // Construire le prompt avec user + 500 chars de l'IA si disponible
    const combined = assistantText
      ? `User: ${userText}\nAssistant (début): ${assistantText}`
      : userText;
    const { text } = await generateText({
      instructions: titlePrompt,
      model: getTitleModel({ sessionToken: token, userId: user?.id }),
      prompt: combined.slice(0, 2000),
    });
    const cleaned = text
      .replace(/^[#*"\s]+/, "")
      .replace(/["]+$/, "")
      .trim();
    // Garde-fou: titre trop long ou vide
    if (!cleaned || cleaned.length > 60) {
      return cleaned.slice(0, 60).trim() || fallbackTitle;
    }
    return cleaned;
  } catch (err) {
    console.error("Erreur génération titre:", err);
    return (
      userText.replace(/^[#*"\s]+/, "").slice(0, 60).trim() ||
      "Nouvelle discussion"
    );
  }
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const [message] = await getMessageById({ id });
  if (!message) {
    throw new Error("Message not found");
  }

  const chat = await getChatById({ id: message.chatId });
  if (!chat || chat.userId !== session.user.id) {
    throw new Error("Unauthorized");
  }

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt,
  });
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const chat = await getChatById({ id: chatId });
  if (!chat || chat.userId !== session.user.id) {
    throw new Error("Unauthorized");
  }

  await updateChatVisibilityById({ chatId, visibility });
}
