// ─────────────────────────────────────────────
// Moteur de calcul d'usage en pourcentage par forfait.
//
// Remplace le comptage des tokens par message par un pourcentage d'usage
// normalisé selon le forfait de l'utilisateur :
//
// Usage (%) = min(100, round((Consommation Normalisée / Capacité du Forfait) * 100))
//
// Capacités relatives des forfaits :
// - Free : 100 unités
// - Plus : 200 unités
// - Pro  : 400 unités
// - Max  : 1 000 unités
// ─────────────────────────────────────────────

import { normalizeTierKey, type TierKey } from "./tier-limits";

export const TIER_USAGE_CAPACITIES: Record<TierKey, number> = {
  free: 100,
  max: 1000,
  plus: 200,
  pro: 400,
};

/**
 * Calcule le pourcentage d'usage selon la formule contractuelle.
 */
export function computeTierUsagePercent(params: {
  consumed: number;
  tier?: string | null;
  capacityOverride?: number;
}): number {
  const normTier = normalizeTierKey(params.tier);
  const capacity =
    params.capacityOverride !== undefined && params.capacityOverride > 0
      ? params.capacityOverride
      : TIER_USAGE_CAPACITIES[normTier];

  if (capacity <= 0) return 100;
  const consumed = Math.max(
    0,
    Number.isFinite(params.consumed) ? params.consumed : 0
  );
  if (consumed >= capacity) return 100;
  const raw = (consumed / capacity) * 100;
  return Math.min(99, Math.max(0, Math.round(raw)));
}

/**
 * Détermine si le quota hebdomadaire d'usage est dépassé (consommation >= capacité).
 */
export function isTierUsageExceeded(params: {
  consumed: number;
  tier?: string | null;
  capacityOverride?: number;
}): boolean {
  const normTier = normalizeTierKey(params.tier);
  const capacity =
    params.capacityOverride !== undefined && params.capacityOverride > 0
      ? params.capacityOverride
      : TIER_USAGE_CAPACITIES[normTier];

  if (capacity <= 0) return true;
  const consumed = Math.max(
    0,
    Number.isFinite(params.consumed) ? params.consumed : 0
  );
  return consumed >= capacity;
}

export type UsageDisplayInfo = {
  percent: number;
  label: string;
  isWarning: boolean;
  isExceeded: boolean;
  tierLabel: string;
};

/**
 * Formate l'usage pour l'interface : produit le pourcentage et les drapeaux
 * d'état, sans exposer le décompte brut de tokens par message.
 */
export function formatUsageDisplay(params: {
  consumed: number;
  tier?: string | null;
}): UsageDisplayInfo {
  const tierKey = normalizeTierKey(params.tier);
  const percent = computeTierUsagePercent(params);
  const isExceeded = isTierUsageExceeded(params);
  const tierLabels: Record<TierKey, string> = {
    free: "Free",
    max: "Max",
    plus: "Plus",
    pro: "Pro",
  };

  return {
    isExceeded,
    isWarning: percent >= 80 && !isExceeded,
    label: `${percent}%`,
    percent,
    tierLabel: tierLabels[tierKey],
  };
}

/**
 * Calcule l'instant de la prochaine réinitialisation hebdomadaire (lundi 00:00 UTC).
 */
export function getWeeklyResetDate(now: Date = new Date()): Date {
  const d = new Date(now);
  const day = d.getUTCDay(); // 0 = dimanche, 1 = lundi, etc.
  const daysUntilNextMonday = (8 - day) % 7 || 7;
  d.setUTCDate(d.getUTCDate() + daysUntilNextMonday);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}
