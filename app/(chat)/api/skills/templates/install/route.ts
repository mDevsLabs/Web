// Installation d'un modèle de Skill statique (lib/skill-templates) : crée le
// skill via la couche d'accès existante (createSkill) avec les instructions,
// outils et liaisons MCP définis par le template.

import { z } from "zod";
import { errorResponse } from "@/lib/api/error-response";
import { requireUser, unauthorizedResponse } from "@/lib/auth/require-user";
import { getSkillTemplate } from "@/lib/skill-templates/catalog";

export async function POST(request: Request) {
  const session = await requireUser();
  if (!session) {
    return errorResponse("auth_required");
  }
  const { userId } = session;
  if (!userId) {
    return unauthorizedResponse();
  }

  const json = await request.json().catch(() => ({}));
  const parsed = z.object({ templateId: z.string().min(1) }).safeParse(json);
  if (!parsed.success) {
    return errorResponse("invalid_request", {
      message: "Identifiant de modèle invalide.",
    });
  }

  const template = getSkillTemplate(parsed.data.templateId);
  if (!template) {
    return errorResponse("not_found", {
      message: "Modèle de skill introuvable.",
    });
  }

  const { createSkill } = await import("@/lib/db/queries");
  const created = await createSkill({
    color: template.color,
    description: template.description,
    icon: template.icon.name.toLowerCase(),
    instructions: template.instructions,
    mcpServerIds: [],
    name: template.name,
    parameters: template.parameters,
    tags: template.tags,
    tools: template.tools,
    userId,
  });

  return Response.json(
    {
      message: `Skill "${template.name}" installé`,
      skill: created,
    },
    { status: 201 }
  );
}
