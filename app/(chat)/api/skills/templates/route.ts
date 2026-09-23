import { z } from "zod";
import { errorResponse } from "@/lib/api/error-response";
import { requireUser, unauthorizedResponse } from "@/lib/auth/require-user";
import { getSkillsByUserId } from "@/lib/db/queries";
import {
  buildSkillTemplateEntries,
  SKILL_CATEGORIES,
} from "@/lib/skill-templates/catalog";
import {
  installSkillTemplate,
  uninstallSkillTemplate,
} from "@/lib/skill-templates/install";

// Catalogue de Skills de la page /skills.
//
// Source de vérité unique : le catalogue statique `lib/skill-templates`
// (les tables SkillTemplate/McpTemplate alimentées par d'anciens fichiers de
// seed ne sont plus lues). La réponse expose les manifestes enrichis de l'état
// d'installation de l'utilisateur courant : plus aucun catalogue concurrent.

const templateIdSchema = z.object({ templateId: z.string().min(1) });

export async function GET() {
  const session = await requireUser();
  if (!session) {
    return errorResponse("auth_required");
  }

  const skills = await getSkillsByUserId({ userId: session.userId }).catch(
    () => []
  );
  const templates = buildSkillTemplateEntries(skills);

  return Response.json({ categories: SKILL_CATEGORIES, templates });
}

export async function POST(request: Request) {
  const session = await requireUser();
  if (!session) {
    return unauthorizedResponse();
  }

  const json = await request.json().catch(() => ({}));
  const parsed = templateIdSchema.safeParse(json);
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

export async function DELETE(request: Request) {
  const session = await requireUser();
  if (!session) {
    return unauthorizedResponse();
  }

  const json = await request.json().catch(() => ({}));
  const parsed = templateIdSchema.safeParse(json);
  if (!parsed.success) {
    return errorResponse("invalid_request", {
      message: "Identifiant de modèle invalide.",
    });
  }

  const result = await uninstallSkillTemplate({
    templateId: parsed.data.templateId,
    userId: session.userId,
  });

  if (!result.ok) {
    return errorResponse(result.code, { message: result.message });
  }

  return Response.json({ message: result.message, removed: result.removed });
}
