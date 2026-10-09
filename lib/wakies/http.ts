import "server-only";

/**
 * Utilitaires communs aux routes BFF de Wakies (`app/(chat)/api/wakies/**`).
 *
 * Le gabarit `apps/wakies` avait une pile Hono et un middleware maison : jeton
 * porteur `OWNER_TOKEN`, vérification d'origine, limite de corps, contrôle
 * `sec-fetch-site`. Intégré à l'hôte, TOUT cela disparaît au profit de
 * l'existant : la session mAI (cookie httpOnly `mai_session_token`) remplace le
 * jeton, `proxy.ts` protège déjà `/api/*`, et les quotas viennent de
 * `lib/plans/tier-limits.ts`.
 *
 * Ce module subsiste parce que trois choses doivent être identiques dans
 * toutes les routes : l'IDENTITÉ (un compte mAI, jamais un identifiant fourni
 * par le client), la TRADUCTION DES ERREURS (enveloppe unifiée de l'hôte) et
 * le FORFAIT (les quotas Wakies sont lus, jamais recalculés).
 */

import { errorResponse, toErrorResponse } from "@/lib/api/error-response";
import { isPaidTier } from "@/lib/auth/plan";
import type { MaiUser } from "@/lib/auth/session";
import { getMaiUser } from "@/lib/auth/session";
import { MAI_UPGRADE_URL } from "@/lib/constants";
import {
  getWakiesQuota,
  normalizeTierKey,
  type TierKey,
  type WakiesQuotaKey,
  wakiesQuotaMessage,
} from "@/lib/plans/tier-limits";
import { versClient } from "@/lib/wakies/serialize";
import { trustedWakiesOrigin } from "@/lib/wakies/shared/origin";

export type WakiesIdentity = {
  tier: TierKey;
  user: MaiUser;
  userId: string;
};

/**
 * Identité de la requête, ou la réponse 401/403 correspondante.
 *
 * Wakies est réservé aux forfaits payants (Plus, Pro, Max). Un utilisateur
 * Free reçoit un code `plan_required` (403), identique aux bots ou au mode
 * Agent.
 *
 * `userId` est `id || email` comme partout ailleurs dans l'hôte : `users.id`
 * est une colonne texte libre et certains comptes n'ont qu'un email.
 */
export async function requireWakiesUser(): Promise<WakiesIdentity | Response> {
  const user = await getMaiUser();
  if (!user) {
    return errorResponse("auth_required");
  }
  if (!isPaidTier(user.tier)) {
    return errorResponse("plan_required", {
      details: { upgradeUrl: MAI_UPGRADE_URL },
      message: "Wakies est disponible avec les forfaits mAI Plus, Pro et Max.",
    });
  }
  return {
    tier: normalizeTierKey(user.tier),
    user,
    userId: user.id || user.email,
  };
}

export function isResponse(value: unknown): value is Response {
  return value instanceof Response;
}

/** Réponse d'erreur métier en français, dans l'enveloppe de l'hôte. */
export function badRequest(message: string): Response {
  return errorResponse("invalid_request", { message });
}

export function notFound(message = "Introuvable."): Response {
  return errorResponse("not_found", { message });
}

export function forbidden(message = "Accès refusé."): Response {
  return errorResponse("access_denied", { message });
}

/**
 * Réponse JSON de l'API Wakies.
 *
 * Elle passe par `versClient` : les `Date` de PostgreSQL deviennent des
 * millisecondes, comme l'attendait l'interface (voir lib/wakies/serialize.ts).
 * Passer par cette fonction plutôt que par `Response.json` évite d'avoir à y
 * penser route par route — et une route oubliée resterait correcte.
 */
export function json(data: unknown, init?: ResponseInit): Response {
  return Response.json(versClient(data), init);
}

/**
 * Applique un quota VOLUMÉTRIQUE avant une création.
 *
 * `used` est fourni par la route : chaque ressource a sa propre requête de
 * comptage, et les écrire ici imposerait à ce module de connaître les tables.
 * Un quota `null` (forfait Max) court-circuite : compter pour rien coûte un
 * aller-retour base par création.
 */
export async function enforceWakiesLimit(params: {
  limit: WakiesQuotaKey;
  tier: WakiesIdentity["tier"];
  used: number;
}): Promise<Response | null> {
  const quota = getWakiesQuota(params.tier, params.limit);
  if (quota === null || params.used < quota) {
    return null;
  }
  return errorResponse("quota_exceeded", {
    details: { limit: params.limit, quota, used: params.used },
    message: wakiesQuotaMessage(params.limit, quota),
  });
}

export { toErrorResponse };

export function rejectCrossOriginMutation(request: Request): Response | null {
  return trustedWakiesOrigin(request)
    ? null
    : forbidden("Origine de la requête non autorisée.");
}
