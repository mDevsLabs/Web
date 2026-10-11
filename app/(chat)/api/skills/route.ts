import { z } from "zod";
import { valeurParametreAcceptable } from "@/lib/ai/skill-params";
import {
  errorResponse,
  logError,
  zodIssuesMessage,
} from "@/lib/api/error-response";
import { requireUser, unauthorizedResponse } from "@/lib/auth/require-user";
import { createSkill, getSkillsByUserId } from "@/lib/db/queries";

/**
 * Garde d'homogénéité des contenus APPLIQUÉE à l'écriture — et non seulement
 * à la substitution au tour. Un Skill importé (fichier JSON, copié/collé puis
 * POST) entre en base avec ses valeurs de paramètres d'exemple : la garde de
 * `lib/ai/skill-params.ts` ne le verrait qu'au premier tour, après un comptage
 * d'usage déjà débité. Le contrôle se fait donc AUSSI à l'écriture.
 */
const valeurParametreSure = z
  .string()
  .refine((valeur) => valeurParametreAcceptable(valeur) === null, {
    message:
      "valeur de paramètre refusée : elle usurpe un marqueur du prompt système ou dépasse la borne de taille",
  });

const parametersImportes = z.array(
  z.object({
    defaultValue: valeurParametreSure.optional(),
    description: z.string().max(500).optional(),
    enumValues: z.array(valeurParametreSure).optional(),
    name: z.string().min(1).max(50),
    required: z.boolean().optional(),
    type: z.enum(["string", "number", "integer", "boolean", "enum"]).optional(),
  })
);

const createSkillSchema = z.object({
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  description: z.string().max(1000).optional(),
  icon: z.string().max(50).optional(),
  instructions: z.string().min(1).max(20_000),
  isPublic: z.boolean().optional(),
  mcpServerIds: z.array(z.string().uuid()).max(20).optional(),
  mcpToolFilter: z
    .record(z.string(), z.array(z.string()).nullable())
    .optional(),
  name: z.string().min(1).max(100),
  parameters: parametersImportes.optional(),
  pinned: z.boolean().optional(),
  tags: z.array(z.string().max(50)).optional(),
  templateId: z.string().min(1).max(64).nullable().optional(),
  tools: z.array(z.string()).optional(),
});

export async function GET() {
  // Skills ouverts à tous les forfaits, y compris Free.
  const session = await requireUser();
  if (!session) {
    return unauthorizedResponse();
  }
  const { userId } = session;

  const skills = await getSkillsByUserId({ userId });
  return Response.json(skills);
}

export async function POST(request: Request) {
  const session = await requireUser();
  if (!session) {
    return unauthorizedResponse();
  }
  const { userId } = session;

  try {
    const json = await request.json();
    const parsed = createSkillSchema.parse(json);

    const created = await createSkill({
      ...parsed,
      userId,
    });

    return Response.json(created, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return errorResponse("invalid_request", {
        message: zodIssuesMessage(err),
      });
    }
    logError("Erreur création skill", err);
    return errorResponse("internal_error", {
      message: "Erreur lors de la création du skill.",
    });
  }
}
