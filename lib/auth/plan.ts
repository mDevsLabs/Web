import { API_ERROR_STATUS } from "@/lib/api/error-codes";
import { DEFAULT_MESSAGES_FR } from "@/lib/api/error-messages";
import type { MaiUser } from "@/lib/auth/session";
import { getTierMemoryEntries } from "@/lib/plans/tier-limits";

export const PAID_TIERS = ["plus", "pro", "max"] as const;
export type PaidTier = (typeof PAID_TIERS)[number];

// Tiers canoniques réellement écrits dans la colonne users.tier (backend mAI :
// config.ts Tier = "Free" | "Plus" | "Pro" | "Max"). La comparaison est
// insensible à la casse ; toute autre valeur est INVALIDE et ne doit jamais
// retomber silencieusement sur Free avec des privilèges implicites.
export const CANONICAL_TIERS = ["free", "plus", "pro", "max"] as const;
export type CanonicalTier = (typeof CANONICAL_TIERS)[number];

// Normalise une valeur de tier persistée vers sa forme canonique minuscule.
// Renvoie null si la valeur est absente, vide ou inconnue : l'appelant décide
// du refus explicite (jamais de privilège par défaut).
export function parseCanonicalTier(
  tier: string | null | undefined
): CanonicalTier | null {
  if (typeof tier !== "string") {
    return null;
  }
  const normalized = tier.trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  return (CANONICAL_TIERS as readonly string[]).includes(normalized)
    ? (normalized as CanonicalTier)
    : null;
}

export function normalizeTier(tier?: string | null): string {
  return (tier || "Free").toLowerCase().trim();
}

export function isPaidTier(tier?: string | null): boolean {
  return PAID_TIERS.includes(normalizeTier(tier) as PaidTier);
}

export function getPaidTierRank(tier?: string | null): number {
  const t = normalizeTier(tier);
  if (t === "plus") {
    return 1;
  }
  if (t === "pro") {
    return 2;
  }
  if (t === "max") {
    return 3;
  }
  return 0;
}

export function tierAtLeast(
  tier: string | null | undefined,
  minimum: PaidTier
): boolean {
  const min = getPaidTierRank(minimum);
  const cur = getPaidTierRank(tier);
  return cur >= min;
}

export function isSkillMcpEligible(tier?: string | null): boolean {
  return isPaidTier(tier);
}

export function memoryLimitForTier(tier?: string | null): number {
  return getTierMemoryEntries(tier);
}

export type PlanGuardResult =
  | { allowed: true; user: MaiUser; tier: string }
  | {
      allowed: false;
      reason: "unauthorized" | "plan_required";
      upgradeUrl: string;
      user?: undefined;
      tier?: undefined;
    };

export function planGuardResponse(guard: PlanGuardResult): Response | null {
  if (guard.allowed) {
    return null;
  }
  const body =
    guard.reason === "unauthorized"
      ? {
          code: "auth_required" as const,
          message: DEFAULT_MESSAGES_FR.auth_required,
          status: API_ERROR_STATUS.auth_required,
        }
      : {
          code: "plan_required" as const,
          details: { upgradeUrl: guard.upgradeUrl },
          message: DEFAULT_MESSAGES_FR.plan_required,
          status: API_ERROR_STATUS.plan_required,
        };
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status: body.status,
  });
}
