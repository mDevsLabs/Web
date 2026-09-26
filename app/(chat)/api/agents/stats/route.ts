import { errorResponse, logError } from "@/lib/api/error-response";
import { planGuardResponse, requirePaidPlan } from "@/lib/auth/plan-guard";
import { getAgentStatsByUserId } from "@/lib/db/queries";
import { getTierAgentLimit } from "@/lib/plans/tier-limits";

export async function GET() {
  const guard = await requirePaidPlan("plus");
  if (!guard.allowed) {
    return planGuardResponse(guard)!;
  }
  const user = guard.user;
  const userId = user.id || user.email;

  try {
    const stats = await getAgentStatsByUserId({ userId });
    return Response.json({
      ...stats,
      // null = forfait Max, quota d'agents illimité.
      agentLimit: getTierAgentLimit(user.tier),
    });
  } catch (err) {
    logError("Erreur récupération stats agents", err);
    return errorResponse("internal_error", {
      message: "Erreur lors de la récupération des statistiques.",
    });
  }
}
