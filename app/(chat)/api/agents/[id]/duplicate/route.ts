import { errorResponse } from "@/lib/api/error-response";
import { planGuardResponse, requirePaidPlan } from "@/lib/auth/plan-guard";
import { duplicateAgent, getAgentsByUserId } from "@/lib/db/queries";

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
  if (existing.length >= 10) {
    return errorResponse("quota_exceeded", {
      details: { limit: 10, used: existing.length },
      message: "Limite de 10 agents atteinte.",
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
