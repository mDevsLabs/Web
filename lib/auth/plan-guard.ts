import { getMaiUser, type MaiUser } from "@/lib/auth/session";
import { MAI_UPGRADE_URL } from "@/lib/constants";
import { getPersistedTier } from "@/lib/db/users";
import {
  type CanonicalTier,
  type PaidTier,
  type PlanGuardResult,
  planGuardResponse,
  tierAtLeast,
} from "./plan";

export { planGuardResponse };

// Résolution de l'identité et du forfait persisté, commune aux deux gardes.
//
// Le distinction des trois motifs d'échec de `getPersistedTier` est volontaire :
//   - `missing` / `invalid` (compte sans forfait, ou valeur hors `free|plus|pro|max`)
//     retombe sur `free`. Doctrine AGENTS.md §5 : un tier illisible ne doit jamais
//     accorder de privilège — retomber sur le forfait le plus faible en accorde
//     moins, jamais plus. Refuser dans ce cas enfermerait hors de l'application un
//     abonné dont la colonne est simplement vide (piège du §9).
//   - `unavailable` (base injoignable) reste un échec ferme : `lib/db/users.ts` le
//     documente comme tel, et aucune décision d'accès ne doit se replier sur une
//     autre source. Un refus ici est cohérent, les requêtes qui suivent échoueraient
//     de toute façon contre la même base.
type TierLoad =
  | { status: "anonymous" }
  | { status: "tier_unavailable" }
  | { status: "ok"; tier: CanonicalTier; user: MaiUser };

async function loadAuthenticatedTier(): Promise<TierLoad> {
  const user = await getMaiUser();
  if (!user) {
    return { status: "anonymous" };
  }

  const persisted = await getPersistedTier({ userId: user.id || user.email });
  if (persisted.ok) {
    return { status: "ok", tier: persisted.tier, user };
  }
  if (persisted.reason === "unavailable") {
    return { status: "tier_unavailable" };
  }
  return { status: "ok", tier: "free", user };
}

// `users.tier` est persisté en minuscules canoniques ; l'interface affiche les
// étiquettes de forfait capitalisées (« Free », « Plus », …).
function withDisplayTier(user: MaiUser, tier: CanonicalTier): MaiUser {
  const displayTier = `${tier[0]?.toUpperCase() ?? ""}${tier.slice(1)}`;
  return { ...user, tier: displayTier };
}

/**
 * Garde « payant à partir de `minimum` ». À réserver aux fonctionnalités qui sont
 * réellement une contrepartie de l'abonnement (mode Agent, Wakies).
 *
 * Pour une fonction ouverte à tous les forfaits, avec un simple quota chiffré par
 * tier, utiliser `requireAuthenticatedTier()` : `tierAtLeast` est typé `PaidTier`
 * et ne peut donc pas exprimer un seuil « free ».
 */
export async function requirePaidPlan(
  minimum: PaidTier = "plus"
): Promise<PlanGuardResult> {
  const loaded = await loadAuthenticatedTier();

  if (loaded.status === "anonymous") {
    return {
      allowed: false,
      reason: "unauthorized",
      upgradeUrl: MAI_UPGRADE_URL,
    };
  }
  if (loaded.status === "tier_unavailable") {
    return {
      allowed: false,
      reason: "plan_required",
      upgradeUrl: MAI_UPGRADE_URL,
    };
  }
  if (!tierAtLeast(loaded.tier, minimum)) {
    return {
      allowed: false,
      reason: "plan_required",
      upgradeUrl: MAI_UPGRADE_URL,
    };
  }

  return {
    allowed: true,
    tier: loaded.tier,
    user: withDisplayTier(loaded.user, loaded.tier),
  };
}

/**
 * Garde « connecté, n'importe quel forfait ». Le tier résolu est renvoyé pour que
 * l'appelant applique lui-même la limite de son forfait via `lib/plans/tier-limits.ts`
 * (ex. les bots : `getTierAgentLimit`). Ne refuse jamais pour un motif de forfait :
 * ce qui borne un Free ici est un quota, pas une interdiction.
 */
export async function requireAuthenticatedTier(): Promise<PlanGuardResult> {
  const loaded = await loadAuthenticatedTier();

  if (loaded.status === "anonymous") {
    return {
      allowed: false,
      reason: "unauthorized",
      upgradeUrl: MAI_UPGRADE_URL,
    };
  }
  if (loaded.status === "tier_unavailable") {
    return {
      allowed: false,
      reason: "plan_required",
      upgradeUrl: MAI_UPGRADE_URL,
    };
  }

  return {
    allowed: true,
    tier: loaded.tier,
    user: withDisplayTier(loaded.user, loaded.tier),
  };
}
