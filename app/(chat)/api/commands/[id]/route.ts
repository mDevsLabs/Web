import { z } from "zod";
import {
  errorResponse,
  logError,
  zodIssuesMessage,
} from "@/lib/api/error-response";
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
      return errorResponse("not_found", {
        message: "Commande introuvable.",
      });
    }
    return Response.json(updated);
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return errorResponse("invalid_request", {
        message: zodIssuesMessage(err),
      });
    }
    logError("Erreur mise à jour commande", err);
    return errorResponse("internal_error", {
      message: "Erreur lors de la mise à jour de la commande.",
    });
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
    return errorResponse("not_found", { message: "Commande introuvable." });
  }

  return Response.json({
    message: "Commande supprimée avec succès",
    success: true,
  });
}
