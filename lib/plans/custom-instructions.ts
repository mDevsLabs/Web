import { z } from "zod";
import { MAI_UPGRADE_URL } from "@/lib/constants";
import {
  CUSTOM_INSTRUCTIONS_HARD_CAP,
  exceedsCustomInstructionsProductLimit,
  getCustomInstructionsEffectiveMax,
  getTierCustomInstructionsMax,
  getTierLimits,
} from "@/lib/plans/tier-limits";

/**
 * Instructions personnalisées — limites et validation par forfait.
 *
 * Avant ce module, la limite 4000 était écrite en dur dans 7 schémas Zod et
 * 2 endroits d'interface, sans constante partagée : changer de limite
 * imposait de ne pas oublier un site, et le serveur ne pouvait pas proposer
 * une mise à niveau cohérente avec l'affichage.
 *
 * Ce module est volontairement SANS `server-only` : il alimente aussi bien
 * les route handlers que l'interface (compteur, mention d'appui). La
 * fabrication de la Response reste dans les routes, via errorResponse().
 *
 * Le plafond est dérivé du forfait (lib/plans/tier-limits.ts) :
 * `buildCustomInstructionsSchema` est donc une FABRIQUE, pas un schéma
 * constant — la limite dépend de l'utilisateur connecté.
 */

/** Espace fine insécable : un compteur lisible qui ne casse pas la ligne. */
const NNBSP = " ";

export function formatCharCount(value: number): string {
  return value.toLocaleString("fr-FR").replaceAll(",", NNBSP);
}

/**
 * Schéma Zod du champ `customInstructions` pour un forfait, NON nullable.
 * `undefined` = champ absent, donc « ne pas modifier ».
 *
 * Utilisé par les créations et les routes dont le champ ne peut pas être
 * effacé (POST /api/user/preferences, POST /api/projects,
 * POST /api/planning, POST /api/chat).
 */
export function buildCustomInstructionsSchema(
  tier?: string | null
): z.ZodType<string | undefined> {
  return z
    .string()
    .max(getCustomInstructionsEffectiveMax(tier))
    .optional() as z.ZodType<string | undefined>;
}

/**
 * Variante NULLABLE, pour les routes PATCH.
 *
 * Y remettre `null` efface la valeur existante : c'est un comportement voulu
 * (réinitialiser les instructions d'une conversation, d'un projet, d'une tâche
 * planifiée), distinct de « champ absent » qui ne doit rien modifier.
 */
export function buildNullableCustomInstructionsSchema(
  tier?: string | null
): z.ZodType<string | null | undefined> {
  return z
    .string()
    .max(getCustomInstructionsEffectiveMax(tier))
    .nullable()
    .optional() as z.ZodType<string | null | undefined>;
}

export type CustomInstructionsLimitPayload = {
  details: Record<string, unknown>;
  message: string;
};

/**
 * Charge utile d'erreur adaptée à la cause réelle du dépassement.
 * Retourne `null` si la longueur est acceptable.
 *
 * Deux cas distincts, à ne pas confondre :
 * - le forfait est trop petit -> proposer une mise à niveau ;
 * - le garde-fou technique est atteint (Max) -> aucun upgrade n'y changerait
 *   rien, en proposer un serait trompeur.
 *
 * Usage dans une route :
 * ```ts
 * const payload = customInstructionsLimitPayload(user.tier, value.length);
 * if (payload) return errorResponse("invalid_request", payload);
 * ```
 */
export function customInstructionsLimitPayload(
  tier: string | null | undefined,
  length: number
): CustomInstructionsLimitPayload | null {
  if (length <= getCustomInstructionsEffectiveMax(tier)) {
    return null;
  }
  if (exceedsCustomInstructionsProductLimit(tier, length)) {
    const productMax = getTierCustomInstructionsMax(tier) ?? 0;
    return {
      details: {
        length,
        limit: productMax,
        reason: "plan_limit",
        upgradeUrl: MAI_UPGRADE_URL,
      },
      message:
        "Vos instructions personnalisées dépassent la limite du forfait " +
        `${getTierLimits(tier).label} (${formatCharCount(productMax)} caractères). ` +
        "Passez à un forfait supérieur ou raccourcissez le texte.",
    };
  }
  return {
    details: {
      hardCap: CUSTOM_INSTRUCTIONS_HARD_CAP,
      length,
      reason: "hard_cap",
    },
    message:
      "Les instructions personnalisées ne peuvent pas dépasser " +
      `${formatCharCount(CUSTOM_INSTRUCTIONS_HARD_CAP)} caractères.`,
  };
}

/** Libellé du compteur affiché sous le champ. */
export function customInstructionsCounterLabel(
  tier: string | null | undefined,
  length: number
): string {
  const productMax = getTierCustomInstructionsMax(tier);
  if (productMax === null) {
    return `${formatCharCount(length)} / ∞`;
  }
  return `${formatCharCount(length)} / ${formatCharCount(productMax)}`;
}

/** Mention d'appui sous le champ, uniquement pour les forfaits sans plafond. */
export function customInstructionsHint(
  tier: string | null | undefined
): string {
  if (getTierCustomInstructionsMax(tier) !== null) {
    return "";
  }
  return (
    `Illimité avec le forfait ${getTierLimits(tier).label} ` +
    `(plafond technique : ${formatCharCount(CUSTOM_INSTRUCTIONS_HARD_CAP)} caractères).`
  );
}
