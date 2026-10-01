import { getMaiUser } from "@/lib/auth/session";
import { MAI_UPGRADE_URL } from "@/lib/constants";
import { getPersistedTier } from "@/lib/db/users";
import {
  type PaidTier,
  type PlanGuardResult,
  planGuardResponse,
  tierAtLeast,
} from "./plan";

export { planGuardResponse };

export async function requirePaidPlan(
  minimum: PaidTier = "plus"
): Promise<PlanGuardResult> {
  const user = await getMaiUser();
  if (!user) {
    return {
      allowed: false,
      reason: "unauthorized",
      upgradeUrl: MAI_UPGRADE_URL,
    };
  }
  const persisted = await getPersistedTier({
    userId: user.id || user.email,
  });
  if (!persisted.ok || !tierAtLeast(persisted.tier, minimum)) {
    return {
      allowed: false,
      reason: "plan_required",
      upgradeUrl: MAI_UPGRADE_URL,
    };
  }
  const displayTier = `${persisted.tier[0]?.toUpperCase() ?? ""}${persisted.tier.slice(1)}`;
  return {
    allowed: true,
    tier: persisted.tier,
    user: { ...user, tier: displayTier },
  };
}
