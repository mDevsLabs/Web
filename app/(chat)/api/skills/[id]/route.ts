import { z } from "zod";
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
  name: z.string().min(1).max(100).optional(),
  parameters: z
    .array(
      z.object({
        defaultValue: z.string().optional(),
        description: z.string().optional(),
        name: z.string(),
        required: z.boolean().optional(),
        type: z.string().optional(),
      })
    )
    .optional(),
  pinned: z.boolean().optional(),
  shareId: z.string().nullable().optional(),
  tags: z.array(z.string().max(50)).optional(),
  tools: z.array(z.string()).optional(),
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
    return Response.json({ error: "Skill introuvable" }, { status: 404 });
  }

  return Response.json(found);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getMaiUser();
  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const userId = user.id || user.email;
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
      return Response.json({ error: "Skill introuvable" }, { status: 404 });
    }

    return Response.json(updated);
  } catch (err: any) {
    return Response.json(
      { error: err.message ?? "Erreur lors de la mise à jour" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getMaiUser();
  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const userId = user.id || user.email;
  const { id } = await params;

  const deleted = await deleteSkill({ id, userId });
  if (!deleted) {
    return Response.json({ error: "Skill introuvable" }, { status: 404 });
  }

  return Response.json({
    message: "Skill supprimé avec succès",
    success: true,
  });
}
