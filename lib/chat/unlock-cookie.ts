import "server-only";

import { cookies } from "next/headers";
import { createChatUnlockToken, verifyChatUnlockToken } from "./unlock-token";

const UNLOCK_COOKIE_PREFIX = "mai_chat_unlock_";

export function chatUnlockCookieName(chatId: string): string {
  return `${UNLOCK_COOKIE_PREFIX}${chatId}`;
}

export async function readChatUnlockToken(
  chatId: string
): Promise<string | null> {
  try {
    const store = await cookies();
    return store.get(chatUnlockCookieName(chatId))?.value ?? null;
  } catch {
    return null;
  }
}

// Cookie de SESSION (aucun maxAge/expires) : le PIN est redemandé à chaque
// nouvelle session navigateur. Le JWT conserve une expiration de 12 h comme
// garde-fou pour les navigateurs qui restaurent les cookies de session.
export async function setChatUnlockCookie({
  chatId,
  userId,
  pinUpdatedAt,
}: {
  chatId: string;
  userId: string;
  pinUpdatedAt: number;
}): Promise<boolean> {
  const token = await createChatUnlockToken({ chatId, pinUpdatedAt, userId });
  if (!token) {
    return false;
  }
  const store = await cookies();
  store.set(chatUnlockCookieName(chatId), token, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return true;
}

export async function clearChatUnlockCookie(chatId: string): Promise<void> {
  try {
    const store = await cookies();
    store.delete(chatUnlockCookieName(chatId));
  } catch {
    // Hors Route Handler / Server Action, l'écriture de cookie n'est pas
    // permise. La lecture reste protégée : le jeton expirera de lui-même.
  }
}

export async function isChatUnlockCookieValid({
  chatId,
  userId,
  pinUpdatedAt,
}: {
  chatId: string;
  userId: string;
  pinUpdatedAt: number;
}): Promise<boolean> {
  const token = await readChatUnlockToken(chatId);
  return verifyChatUnlockToken({ chatId, pinUpdatedAt, token, userId });
}
