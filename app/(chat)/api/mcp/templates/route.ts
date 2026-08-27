import { getMaiUser } from "@/lib/auth/session";
import { planGuardResponse, requirePaidPlan } from "@/lib/auth/plan-guard";
import { getMcpTemplateById, getMcpTemplates } from "@/lib/db/queries";

export async function GET() {
  const user = await getMaiUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }
  const guard = await requirePaidPlan("plus");
  if (!guard.allowed) {
    return planGuardResponse(guard)!;
  }

  const templates = await getMcpTemplates();
  return Response.json({ templates });
}

export async function POST(request: Request) {
  const guard = await requirePaidPlan("plus");
  if (!guard.allowed) {
    return planGuardResponse(guard)!;
  }

  const json = await request.json();
  const tpl = await getMcpTemplateById(json.templateId);
  if (!tpl) {
    return Response.json({ error: "Template not found" }, { status: 404 });
  }

  return Response.json(
    { message: "Installed from template", template: tpl.name },
    { status: 201 }
  );
}

