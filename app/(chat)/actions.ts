"use server";

import type { UIMessage } from "ai";
import { cookies } from "next/headers";
import { auth } from "@/app/(auth)/auth";
import type { VisibilityType } from "@/components/chat/visibility-selector";
import { chatOwnerMatches } from "@/lib/agent/channel";
import { titlePrompt } from "@/lib/ai/prompts";
import { getLanguageModel } from "@/lib/ai/providers";
import {
  buildFallbackTitleFromUserText,
  generateConversationTitleWithModel,
} from "@/lib/ai/title-generator";
import { isChatUnlockedForUser } from "@/lib/chat/security";
import {
  deleteMessagesByChatIdAfterTimestamp,
  getChatById,
  getMessageById,
  updateChatVisibilityById,
} from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";
import { getTextFromMessage } from "@/lib/utils";

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set("chat-model", model);
}

export async function generateTitleFromUserMessage({
  message,
  modelId,
}: {
  message: UIMessage;
  modelId?: string;
}) {
  const text = getTextFromMessage(message);
  return generateTitleFromConversation({
    assistantText: "",
    modelId,
    userText: text,
  });
}

export async function generateTitleFromConversation({
  assistantText,
  modelId,
  sessionToken,
  userId,
  userText,
}: {
  assistantText: string;
  modelId?: string;
  sessionToken?: string | null;
  userId?: string | null;
  userText: string;
}) {
  try {
    const { getMaiSessionToken, getMaiUser } = await import(
      "@/lib/auth/session"
    );
    const resolvedToken = sessionToken ?? (await getMaiSessionToken());
    const user = await getMaiUser(resolvedToken ?? undefined);

    const fallbackTitle = buildFallbackTitleFromUserText(userText);

    // Si pas de session valide ou si le quota est atteint, repli immédiat sans requête IA
    if (
      !resolvedToken ||
      !user ||
      (user.limit > 0 && user.tokensUsed >= user.limit)
    ) {
      return fallbackTitle;
    }

    const resolvedUserId = userId ?? user.id;
    return await generateConversationTitleWithModel({
      assistantText,
      instructions: titlePrompt,
      modelId,
      resolveModel: (targetModelId) =>
        getLanguageModel(targetModelId, {
          sessionToken: resolvedToken,
          userId: resolvedUserId,
        }),
      userText,
    });
  } catch (err) {
    console.error("Erreur génération titre:", err);
    return buildFallbackTitleFromUserText(userText);
  }
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new ChatbotError("unauthorized:chat");
  }

  const [message] = await getMessageById({ id });
  if (!message) {
    throw new ChatbotError("not_found:chat", undefined, {
      messageOverride: "Le message demandé est introuvable.",
    });
  }

  const chat = await getChatById({ id: message.chatId });
  if (
    !chat ||
    !chatOwnerMatches({
      chatUserId: chat.userId,
      email: session.user.email,
      userId: session.user.id,
    })
  ) {
    throw new ChatbotError("unauthorized:chat");
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
    throw new ChatbotError("unauthorized:chat");
  }

  const chat = await getChatById({ id: chatId });
  if (
    !chat ||
    !chatOwnerMatches({
      chatUserId: chat.userId,
      email: session.user.email,
      userId: session.user.id,
    })
  ) {
    throw new ChatbotError("unauthorized:chat");
  }

  // Le passage en privé supprime le PIN (invariant ChatSecurity). Il exige
  // donc un déverrouillage préalable : sans cela, un navigateur laissé ouvert
  // retirerait la protection sans connaître le code.
  if (visibility === "private") {
    const unlocked = await isChatUnlockedForUser({
      chatId,
      userId: session.user.id,
    });
    if (!unlocked) {
      throw new ChatbotError("forbidden:chat", undefined, {
        messageOverride:
          "Déverrouillez la conversation avec son code PIN pour changer sa visibilité.",
      });
    }
  }

  await updateChatVisibilityById({ chatId, visibility });
}
