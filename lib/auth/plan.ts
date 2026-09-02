import type { MaiUser } from "@/lib/auth/session";

export const PAID_TIERS = ["plus", "pro", "max"] as const;
export type PaidTier = (typeof PAID_TIERS)[number];

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
  const t = normalizeTier(tier);
  if (t === "plus") {
    return 75;
  }
  if (t === "pro") {
    return 100;
  }
  if (t === "max") {
    return 150;
  }
  return 50;
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
  if (guard.reason === "unauthorized") {
    return new Response(
      JSON.stringify({ code: "auth_required", error: "unauthorized" }),
      { headers: { "Content-Type": "application/json" }, status: 401 }
    );
  }
  return new Response(
    JSON.stringify({
      code: "plan_required",
      error: "Cette fonctionnalité nécessite un forfait Plus, Pro ou Max.",
      upgradeUrl: guard.upgradeUrl,
    }),
    { headers: { "Content-Type": "application/json" }, status: 403 }
  );
}
