import { errorResponse } from "@/lib/api/error-response";
import { planGuardResponse, requirePaidPlan } from "@/lib/auth/plan-guard";
import { duplicateAgent, getAgentsByUserId } from "@/lib/db/queries";
import { agentQuotaMessage, getTierAgentLimit } from "@/lib/plans/tier-limits";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requirePaidPlan("plus");
  if (!guard.allowed) {
    return planGuardResponse(guard)!;
  }
  const user = guard.user;
  const userId = user.id || user.email;
  const existing = await getAgentsByUserId({ userId });
  // Quota d'agents : Plus 15 / Pro 25 / Max illimité (null = pas de contrôle).
  const agentLimit = getTierAgentLimit(user.tier);
  if (agentLimit !== null && existing.length >= agentLimit) {
    return errorResponse("quota_exceeded", {
      details: { limit: agentLimit, used: existing.length },
      message: agentQuotaMessage(agentLimit),
      status: 403,
    });
  }
  const { id } = await params;
  const dup = await duplicateAgent({ id, userId });
  if (!dup) {
    return errorResponse("not_found", { message: "Agent introuvable." });
  }
  return Response.json(dup, { status: 201 });
}
