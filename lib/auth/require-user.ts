import "server-only";

import type { MaiUser } from "@/lib/auth/session";
import { getMaiUser } from "@/lib/auth/session";
import { ChatbotError } from "@/lib/errors";

// Garde d'authentification seule, sans contrainte de forfait : utilisée par
// les fonctionnalités ouvertes à tous (ex. Skills depuis le forfait Free).
export async function requireUser(
  forceRefresh = false
): Promise<{
  userId: string;
  user: MaiUser;
} | null> {
  const user = await getMaiUser(null, { forceRefresh });
  if (!user) {
    return null;
  }
  return { user, userId: user.id || user.email };
}

export function unauthorizedResponse(): Response {
  return new ChatbotError("unauthorized:chat").toResponse();
}
