// Installation d'un modèle de Skill statique (lib/skill-templates).
// Toute la logique vit dans `lib/skill-templates/install.ts`, partagée avec
// `/api/skills/templates` : application réelle du forfait, idempotence par
// (utilisateur, modèle), résolution des serveurs MCP installés et vérification
// en base avant de répondre.

import { z } from "zod";
import { errorResponse } from "@/lib/api/error-response";
import { requireUser, unauthorizedResponse } from "@/lib/auth/require-user";
import { installSkillTemplate } from "@/lib/skill-templates/install";

export async function POST(request: Request) {
  const session = await requireUser();
  if (!session) {
    return unauthorizedResponse();
  }

  const json = await request.json().catch(() => ({}));
  const parsed = z.object({ templateId: z.string().min(1) }).safeParse(json);
  if (!parsed.success) {
    return errorResponse("invalid_request", {
      message: "Identifiant de modèle invalide.",
    });
  }

  const result = await installSkillTemplate({
    templateId: parsed.data.templateId,
    tier: session.user.tier,
    userId: session.userId,
  });

  if (!result.ok) {
    return errorResponse(result.code, { message: result.message });
  }

  return Response.json(
    {
      alreadyInstalled: result.alreadyInstalled,
      message: result.message,
      skill: result.skill,
      unresolvedMcpServerNames: result.unresolvedMcpServerNames,
    },
    { status: result.alreadyInstalled ? 200 : 201 }
  );
}
