import "server-only";

import { ipAddress } from "@vercel/functions";
import { errorResponse } from "@/lib/api/error-response";
import { type ApiRateLimitAction, checkApiRateLimit } from "@/lib/ratelimit";

/**
 * Limite une route API coûteuse et renvoie la réponse 429 si le budget est
 * dépassé.
 *
 * Renvoie `null` quand la requête est autorisée, pour que l'appelant continue
 * avec `if (limited) return limited;`. Le refus porte un en-tête `Retry-After`
 * exploitable par le client, ce que ne faisait pas `checkIpRateLimit`.
 */
export async function enforceApiRateLimit(params: {
  action: ApiRateLimitAction;
  request: Request;
  userId?: string | null;
}): Promise<Response | null> {
  const result = await checkApiRateLimit({
    action: params.action,
    ip: ipAddress(params.request),
    userId: params.userId ?? null,
  });
  if (result.allowed) {
    return null;
  }
  return errorResponse("rate_limited", {
    details: { retryAfterSeconds: result.retryAfterSeconds },
    headers: { "Retry-After": String(result.retryAfterSeconds) },
    message:
      "Trop de requêtes. Réessayez dans quelques minutes, la limite est relevée chaque heure.",
  });
}
