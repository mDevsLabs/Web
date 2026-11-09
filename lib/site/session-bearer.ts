import type { NextRequest } from "next/server";
import { getMaiSessionToken } from "@/lib/auth/session";

/**
 * Résolution du `Authorization` sortant d'un relais de route (issue #10).
 *
 * Deux sources possibles, dans cet ordre :
 * 1. un Bearer fourni par le client — les clients externes de l'API (clé
 *    d'API) continuent d'authentifier leurs propres appels ;
 * 2. sinon le cookie httpOnly `mai_session_token` — les pages du Site ne
 *    détiennent plus de jeton, le relais le lit côté serveur.
 */
export async function resolveAuthorizationHeader(
  req: NextRequest
): Promise<string> {
  const header = (
    req.headers.get("authorization") ||
    req.headers.get("Authorization") ||
    ""
  ).trim();
  if (header) return header;
  const token = await getMaiSessionToken();
  return token ? `Bearer ${token}` : "";
}
