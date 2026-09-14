import { getPaidTierRank, type PaidTier } from "@/lib/auth/plan";

// Source serveur unique des capacités d'abonnement utilisées par Agent, les
// modèles, les quotas et le frontend. Le client ne recalcule rien : il lit
// (via les routes serveur) ce que cette couche décide.

// Limite produit GLOBALE de durée d'un AgentRun, par forfait. Indépendante des
// timeouts techniques de l'hébergement (par appel modèle / outil / réseau) :
// un run Plus peut durer une heure réelle, quitte à être avancé par plusieurs
// invocations successives (checkpoints + ticks).
export const TIER_RUN_LIMIT_MS: Record<PaidTier, number | null> = {
  max: null, // aucune limite produit globale
  plus: 60 * 60 * 1000, // 1 heure
  pro: 3 * 60 * 60 * 1000, // 3 heures
};

// Timeouts TECHNIQUES, identiques pour tous les forfaits : ils protègent les
// ressources (modèle, outils, réseau), pas le produit.
export const TECHNICAL_TIMEOUTS_MS = {
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
