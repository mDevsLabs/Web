import "server-only";

import { jwtVerify, SignJWT } from "jose";

// Jeton séparé de la session mAI. Il n'utilise PAS `sub` : le vérificateur de
// session (`lib/auth/session.ts`) accepte tout payload signé portant `email`
// ou `sub`, donc un jeton de déverrouillage avec `sub` pourrait être rejoué
// comme cookie de session. L'identité passe par le claim `uid`, et l'audience
// borne le jeton au déverrouillage de conversation.
const UNLOCK_AUDIENCE = "mai-chat-unlock";
const UNLOCK_TTL = "12h";

function getUnlockSecret(): Uint8Array | null {
  const secret = process.env.MAI_JWT_SECRET || process.env.JWT_SECRET || "";
  return secret ? new TextEncoder().encode(secret) : null;
}

export function isChatUnlockConfigured(): boolean {
  return getUnlockSecret() !== null;
}

export async function createChatUnlockToken({
  chatId,
  userId,
  pinUpdatedAt,
}: {
  chatId: string;
  userId: string;
  pinUpdatedAt: number;
}): Promise<string | null> {
  const secret = getUnlockSecret();
  if (!secret) {
    return null;
  }
  return await new SignJWT({ cid: chatId, pv: pinUpdatedAt, uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience(UNLOCK_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(UNLOCK_TTL)
    .sign(secret);
}

export async function verifyChatUnlockToken({
  token,
  chatId,
  userId,
  pinUpdatedAt,
}: {
  token: string | null | undefined;
  chatId: string;
  userId: string;
  pinUpdatedAt: number;
}): Promise<boolean> {
  if (!token) {
    return false;
  }
  const secret = getUnlockSecret();
  if (!secret) {
    return false;
  }
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
      audience: UNLOCK_AUDIENCE,
      requiredClaims: ["exp"],
    });
    return (
      payload.cid === chatId &&
      payload.uid === userId &&
      payload.pv === pinUpdatedAt
    );
  } catch {
    return false;
  }
}
