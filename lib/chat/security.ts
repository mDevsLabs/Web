import "server-only";

import { chatOwnerMatches } from "@/lib/agent/channel";
import { getChatSecurity } from "@/lib/db/queries/chat-security";
import { ChatbotError } from "@/lib/errors";
import { isChatUnlockCookieValid } from "./unlock-cookie";

export type ChatLockState = {
  isSecure: boolean;
  isOwner: boolean;
  locked: boolean;
  pinUpdatedAt: number | null;
};

// État de verrouillage d'une conversation pour un spectateur donné. Le
// propriétaire n'est PAS exempté : le PIN protège la conversation à chaque
// nouvelle session navigateur, y compris pour lui.
export async function getChatLockState(params: {
  chat: { id: string; userId: string };
  email?: string | null;
  userId: string;
  username?: string | null;
}): Promise<ChatLockState> {
  const isOwner = chatOwnerMatches({
    chatUserId: params.chat.userId,
    email: params.email,
    userId: params.userId,
    username: params.username,
  });
  const security = await getChatSecurity({ chatId: params.chat.id });
  if (!security) {
    return { isOwner, isSecure: false, locked: false, pinUpdatedAt: null };
  }

  const pinUpdatedAt = security.pinUpdatedAt.getTime();
  const unlocked = await isChatUnlockCookieValid({
    chatId: params.chat.id,
    pinUpdatedAt,
    userId: params.userId,
  });

  return {
    isOwner,
    isSecure: true,
    locked: !unlocked,
    pinUpdatedAt,
  };
}

// Variante « booléen » pour les routes qui n'ont pas besoin de distinguer
// propriétaire et visiteur : une conversation non sécurisée est toujours
// lisible, une conversation sécurisée exige un cookie valide. Le propriétaire
// et les membres de projet passent par le même contrôle.
export async function isChatUnlockedForUser({
  chatId,
  userId,
}: {
  chatId: string;
  userId: string;
}): Promise<boolean> {
  const security = await getChatSecurity({ chatId });
  if (!security) {
    return true;
  }
  return isChatUnlockCookieValid({
    chatId,
    pinUpdatedAt: security.pinUpdatedAt.getTime(),
    userId,
  });
}

export async function assertChatUnlocked({
  chatId,
  userId,
}: {
  chatId: string;
  userId: string;
}): Promise<void> {
  if (!(await isChatUnlockedForUser({ chatId, userId }))) {
    throw new ChatbotError("forbidden:chat", undefined, {
      messageOverride:
        "Déverrouillez la conversation avec son code PIN pour continuer.",
    });
  }
}
