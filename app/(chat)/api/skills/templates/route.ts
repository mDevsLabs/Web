import { getMaiUser } from "@/lib/auth/session";
import { planGuardResponse, requirePaidPlan } from "@/lib/auth/plan-guard";
import { getSkillTemplates } from "@/lib/db/queries";

export async function GET() {
  const user = await getMaiUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }
  const guard = await requirePaidPlan("plus");
  if (!guard.allowed) {
    return planGuardResponse(guard)!;
  }

  const templates = await getSkillTemplates();
  return Response.json({ templates });
}

