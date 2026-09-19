import { z } from "zod";
import { errorResponse, logError } from "@/lib/api/error-response";
import { requireUser, unauthorizedResponse } from "@/lib/auth/require-user";
import { getMaiUser } from "@/lib/auth/session";
import {
  deleteSkill,
  getSkillById,
  togglePinSkill,
  updateSkill,
} from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";

const updateSkillSchema = z.object({
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  description: z.string().max(1000).optional(),
  icon: z.string().max(50).optional(),
  instructions: z.string().min(1).max(20_000).optional(),
  isPublic: z.boolean().optional(),
  lastUsedAt: z.string().nullable().optional(),
  mcpServerIds: z.array(z.string().uuid()).max(20).optional(),
  mcpToolFilter: z
    .record(z.string(), z.array(z.string()).nullable())
    .optional(),
  name: z.string().min(1).max(100).optional(),
  parameters: z
    .array(
      z.object({
        defaultValue: z.string().optional(),
        description: z.string().optional(),
        enumValues: z.array(z.string()).optional(),
        name: z.string().min(1).max(50),
        required: z.boolean().optional(),
        type: z.enum(["string", "number", "boolean", "enum"]).optional(),
      })
    )
    .optional(),
  pinned: z.boolean().optional(),
  shareId: z.string().nullable().optional(),
  tags: z.array(z.string().max(50)).optional(),
  templateId: z.string().min(1).max(64).nullable().optional(),
  tools: z.array(z.string()).optional(),
  usageCount: z.number().int().min(0).optional(),
  version: z.string().max(20).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getMaiUser();
  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const userId = user.id || user.email;
  const { id } = await params;

  const found = await getSkillById({ id, userId });
  if (!found) {
    return errorResponse("not_found", { message: "Skill introuvable." });
  }

  return Response.json(found);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireUser();
  if (!session) {
    return unauthorizedResponse();
  }
  const { userId } = session;
  const { id } = await params;

  try {
    const json = await request.json();

    // Cas spécial: bascule rapide d'épinglage
    if (json.togglePin) {
      const updated = await togglePinSkill({ id, userId });
      return Response.json(updated);
    }

    const parsed = updateSkillSchema.parse(json);
    const updated = await updateSkill({
      data: parsed,
      id,
      userId,
    });

    if (!updated) {
      return errorResponse("not_found", { message: "Skill introuvable." });
    }

    return Response.json(updated);
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      const issues = err.issues
        .map((e) => `${e.path.join(".") || "champ"}: ${e.message}`)
        .join(" • ");
      return errorResponse("invalid_request", {
        message: `Données invalides : ${issues}`,
      });
    }
    logError("Erreur mise à jour skill", err);
    return errorResponse("internal_error", {
      message: "Erreur lors de la mise à jour du skill.",
    });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireUser();
  if (!session) {
    return unauthorizedResponse();
  }
  const { userId } = session;
  const { id } = await params;

  const deleted = await deleteSkill({ id, userId });
  if (!deleted) {
    return errorResponse("not_found", { message: "Skill introuvable." });
  }

  return Response.json({
    message: "Skill supprimé avec succès",
    success: true,
  });
}
