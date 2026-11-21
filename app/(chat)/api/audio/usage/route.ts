import { NextResponse } from "next/server";
import { errorResponse, logError } from "@/lib/api/error-response";
import { getMaiUser } from "@/lib/auth/session";
import {
  getUtcWeekStart,
  getWeeklySpeechUsage,
} from "@/lib/db/queries/generations";
import { getTierSpeechWeeklyLimit } from "@/lib/plans/tier-limits";

export async function GET() {
  const user = await getMaiUser();
  if (!user) {
    return errorResponse("auth_required", { message: "Non authentifié." });
  }

  const tier = user.tier ?? "Free";
  const weeklyLimit = getTierSpeechWeeklyLimit(tier);
  const nextMonday = new Date(getUtcWeekStart().getTime() + 7 * 86_400_000);

  let tokensUsed = 0;
  let requestsCount = 0;

  try {
    // Somme sur les trois clés historiques (identifiant, e-mail, nom
    // d'utilisateur) : lire la seule première ligne sous-estimait l'usage.
    const usage = await getWeeklySpeechUsage([
      user.id,
      user.email,
      user.username,
    ]);
    tokensUsed = usage.tokensUsed;
    requestsCount = usage.requestsCount;
  } catch (error) {
    logError("Erreur API audio/usage", error);
  }

  return NextResponse.json({
    plan: tier,
    requestsCount,
    resetAt: nextMonday.toISOString(),
    tokensUsed,
    weeklyLimit,
  });
}
