import { getPaidTierRank, type PaidTier } from "@/lib/auth/plan";

// Source serveur UNIQUE des capacités d'abonnement utilisées par Agent, les
// modèles, les quotas et le frontend. Le client ne recalcule rien : il lit
// (via les routes serveur) ce que cette couche décide. Aucune autre constante
// de durée (produit ou technique) ne doit exister ailleurs : une seconde table
// parallèle ferait diverger l'accès, le quota et l'expérience affichée.

// Limite produit GLOBALE de durée d'un AgentRun, par forfait. Indépendante des
// timeouts techniques de l'hébergement (par appel modèle / outil / réseau) :
// un run Plus peut durer une heure réelle, quitte à être avancé par plusieurs
// invocations successives (checkpoints + ticks).
export const TIER_RUN_LIMIT_MS: Record<PaidTier, number | null> = {
  max: null, // aucune limite produit globale
  plus: 60 * 60 * 1000, // 1 heure
  pro: 3 * 60 * 60 * 1000, // 3 heures
};

// Libellés d'affichage : une seule formulation, lue par l'API et l'interface.
export const TIER_RUN_LIMIT_LABELS: Record<PaidTier, string> = {
  max: "Aucune limite globale",
  plus: "1 heure",
  pro: "3 heures",
};

// Timeouts TECHNIQUES, identiques pour tous les forfaits : ils protègent les
// ressources (modèle, outils, réseau) et bornent UNE invocation, pas le
// produit. `invocation` est le plafond d'une exécution HTTP complète (la route
// Agent déclare maxDuration = 300 s ; le budget interne garde une marge pour
// finaliser proprement et persister l'état).
export const TECHNICAL_TIMEOUTS_MS = {
  invocation: 240_000,
  modelCall: 120_000,
  network: 30_000,
  toolExecution: 45_000,
} as const;

export type TierRunLimit = {
  limitMs: number | null;
  tier: PaidTier;
};

export function tierRunLimit(tier: string | null | undefined): TierRunLimit {
  const normalized =
    tier === "plus" || tier === "pro" || tier === "max" ? tier : null;
  if (!normalized) {
    // Forfait non payant : Agent est de toute façon refusé par la garde ; on
    // applique le plancher le plus strict pour rester fail-safe.
    return { limitMs: TIER_RUN_LIMIT_MS.plus, tier: "plus" };
  }
  return { limitMs: TIER_RUN_LIMIT_MS[normalized], tier: normalized };
}

export function hasGlobalRunLimit(tier: string | null | undefined): boolean {
  return tierRunLimit(tier).limitMs !== null;
}

export function tierNameFromRank(rank: number): PaidTier | null {
  if (rank === getPaidTierRank("plus")) return "plus";
  if (rank === getPaidTierRank("pro")) return "pro";
  if (rank === getPaidTierRank("max")) return "max";
  return null;
}

// Surface publique destinée à l'interface : le frontend affiche exactement ce
// que le serveur applique (aucun recalcul, aucune table parallèle côté client).
export type TierCapabilities = {
  isPaid: boolean;
  productRunLimitLabel: string;
  productRunLimitMs: number | null;
  technicalTimeoutsMs: typeof TECHNICAL_TIMEOUTS_MS;
  tier: PaidTier;
};

export function tierCapabilities(
  tier: string | null | undefined
): TierCapabilities {
  const limit = tierRunLimit(tier);
  return {
    isPaid: getPaidTierRank(tier) > 0,
    productRunLimitLabel: TIER_RUN_LIMIT_LABELS[limit.tier],
    productRunLimitMs: limit.limitMs,
    technicalTimeoutsMs: TECHNICAL_TIMEOUTS_MS,
    tier: limit.tier,
  };
}
