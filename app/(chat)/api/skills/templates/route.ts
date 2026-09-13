import { errorResponse } from "@/lib/api/error-response";
import { requireUser, unauthorizedResponse } from "@/lib/auth/require-user";
import { getSkillTemplates } from "@/lib/db/queries";

export async function GET() {
  const session = await requireUser();
  if (!session) {
    return errorResponse("auth_required");
  }

  const templates = await getSkillTemplates();
  return Response.json({ templates });
}

export async function POST(request: Request) {
  const session = await requireUser();
  if (!session) {
    return unauthorizedResponse();
  }
  const { userId } = session;
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
