import { getMaiUser } from "@/lib/auth/session";
import { MAI_UPGRADE_URL } from "@/lib/constants";
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
  if (!tierAtLeast(user.tier, minimum)) {
    return {
      allowed: false,
      reason: "plan_required",
      upgradeUrl: MAI_UPGRADE_URL,
    };
  }
  return { allowed: true, tier: user.tier, user };
}
