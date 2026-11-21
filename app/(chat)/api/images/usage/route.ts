import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/error-response";
import { getMaiSessionToken, getMaiUser } from "@/lib/auth/session";
import { countTodayImageGenerations } from "@/lib/db/queries/generations";
import { getTierLimits } from "@/lib/plans/tier-limits";

export async function GET() {
  const token = await getMaiSessionToken();
  if (!token) {
    return errorResponse("auth_required", { message: "Non authentifié." });
  }

  const user = await getMaiUser(token);
  if (!user?.id) {
    return errorResponse("auth_required", { message: "Non authentifié." });
  }

  const tier = user.tier || "Free";
  const dailyLimit = getTierLimits(tier).imagesPerDay;
  const usedToday = await countTodayImageGenerations(user.id);
  const remaining = Math.max(0, dailyLimit - usedToday);

  const now = new Date();
  const resetAt = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0
    )
  ).toISOString();

  return NextResponse.json({
    dailyLimit,
    plan: tier,
    remaining,
    resetAt,
    usedToday,
  });
}
