import { z } from "zod";
import { planGuardResponse, requirePaidPlan } from "@/lib/auth/plan-guard";
import { commandPayloadSchema } from "@/lib/commands/types";
import { deleteCustomCommand, updateCustomCommand } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";

const updateCommandSchema = z.object({
  actionType: z
    .enum(["mcp", "agent", "skill", "prompt", "tools", "navigation"])
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  description: z.string().max(500).optional(),
  enabled: z.boolean().optional(),
  icon: z.string().max(50).optional(),
  name: z.string().min(1).max(100).optional(),
  payload: commandPayloadSchema.optional(),
  pinned: z.boolean().optional(),
  trigger: z
    .string()
    .regex(/^[a-z0-9_-]{1,32}$/)
    .optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requirePaidPlan("plus");
  if (!guard.allowed) {
    return planGuardResponse(guard)!;
  }
  const user = guard.user;
  const userId = user.id || user.email;
  const { id } = await params;

  try {
    const parsed = updateCommandSchema.parse(await request.json());
    const updated = await updateCustomCommand({
      data: parsed,
      id,
      userId,
    });
    if (!updated) {
      return Response.json({ error: "Commande introuvable" }, { status: 404 });
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
  const guard = await requirePaidPlan("plus");
  if (!guard.allowed) {
    return planGuardResponse(guard)!;
  }
  const user = guard.user;
  const userId = user.id || user.email;
  const { id } = await params;

  const deleted = await deleteCustomCommand({ id, userId });
  if (!deleted) {
    return Response.json({ error: "Commande introuvable" }, { status: 404 });
  }

  return Response.json({
    message: "Commande supprimée avec succès",
    success: true,
  });
}
