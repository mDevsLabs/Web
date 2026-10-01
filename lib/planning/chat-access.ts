import "server-only";

import { chatOwnerMatches } from "@/lib/agent/channel";
import { errorResponse } from "@/lib/api/error-response";
import { getChatById } from "@/lib/db/queries";
import type { Chat } from "@/lib/db/schema";

type PlanningUser = {
  email?: string | null;
  id?: string;
  username?: string | null;
};

type OwnedChatResult =
  | { chat: Chat; response?: never }
  | { chat?: never; response: Response };

/** Vérifie qu'une planification ne peut cibler qu'une conversation canonique. */
export async function requireOwnedPlanningChat(params: {
  chatId: string;
  user: PlanningUser;
}): Promise<OwnedChatResult> {
  const chat = await getChatById({ id: params.chatId });
  if (!chat) {
    return {
      response: errorResponse("not_found", {
        message: "Conversation introuvable ou supprimée.",
      }),
    };
  }

  if (
    !params.user.id ||
    !chatOwnerMatches({
      chatUserId: chat.userId,
      email: params.user.email,
      userId: params.user.id,
      username: params.user.username,
    })
  ) {
    return { response: errorResponse("access_denied") };
  }

  return { chat };
}
