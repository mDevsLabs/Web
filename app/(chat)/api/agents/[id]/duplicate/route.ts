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
    return Response.json(
      { error: "Limite 10 agents atteinte" },
      { status: 403 }
    );
  }
  const { id } = await params;
  const dup = await duplicateAgent({ id, userId });
  if (!dup) {
    return Response.json({ error: "Agent introuvable" }, { status: 404 });
  }
  return Response.json(dup, { status: 201 });
}
