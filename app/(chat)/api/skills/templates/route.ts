import { errorResponse } from "@/lib/api/error-response";
import { planGuardResponse, requirePaidPlan } from "@/lib/auth/plan-guard";
import { getMaiUser } from "@/lib/auth/session";
import { getSkillTemplates } from "@/lib/db/queries";

export async function GET() {
  const user = await getMaiUser();
  if (!user) {
    return errorResponse("auth_required");
  }
  const guard = await requirePaidPlan("plus");
  if (!guard.allowed) {
    return planGuardResponse(guard)!;
  }

  const templates = await getSkillTemplates();
  return Response.json({ templates });
}

export async function POST(request: Request) {
  const guard = await requirePaidPlan("plus");
  if (!guard.allowed) {
    return planGuardResponse(guard)!;
  }
  const user = guard.user;
  const userId = user.id || user.email;
  const json = await request.json();
  const { getSkillTemplates, createSkill } = await import("@/lib/db/queries");
  const templates = await getSkillTemplates();
  const tpl: any = templates.find((t: any) => t.id === json.templateId) ?? null;
  if (!tpl) {
    return errorResponse("not_found", {
      message: "Template introuvable.",
    });
  }
  const created = await createSkill({
    color: tpl.color ?? "#6366f1",
    description: tpl.description ?? "",
    icon: tpl.icon ?? "sparkles",
    instructions: tpl.instructions ?? "",
    name: tpl.name,
    parameters: (tpl.parameters as any) ?? [],
    tags: (tpl.tags as any) ?? [],
    templateId: tpl.id,
    tools: (tpl.tools as any) ?? [],
    userId,
  });
  return Response.json(
    { message: `Skill "${tpl.name}" installé`, skill: created },
    { status: 201 }
  );
}
