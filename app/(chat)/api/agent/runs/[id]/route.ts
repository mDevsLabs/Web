import { z } from "zod";
import { getAgentFlags } from "@/lib/agent/flags";
import { errorResponse } from "@/lib/api/error-response";
import { getMaiUser } from "@/lib/auth/session";
import {
  getAgentRunById,
  setAgentRunFeedback,
  updateAgentRunStatus,
} from "@/lib/db/agent-queries";

const feedbackSchema = z
  .object({
    goalReached: z.boolean().optional(),
    useful: z.boolean().optional(),
  })
  .refine(
    (value) => value.useful !== undefined || value.goalReached !== undefined
  );

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getMaiUser();
  if (!user) return errorResponse("auth_required");
  if (!getAgentFlags()["agent.activity"])
    return errorResponse("service_unavailable");
  const body = feedbackSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return errorResponse("invalid_request");
  const { id } = await params;
  const run = await setAgentRunFeedback({
    id,
    userId: user.id || user.email,
    ...body.data,
  });
  if (!run) return errorResponse("not_found");
  return Response.json(
    { goalReached: run.goalReached, useful: run.useful },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}

// Stop : le client annule d'abord le flux (abort), puis confirme ici pour que
// le run soit marqué « cancelled » même si le serveur n'a pas vu la
// déconnexion. Les étapes déjà réalisées sont conservées telles quelles.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = await getMaiUser();
  if (!user) {
    return errorResponse("auth_required");
  }
  const userId = user.id || user.email;

  const run = await getAgentRunById({ id, userId });
  if (!run) {
    return errorResponse("not_found", { message: "Run introuvable." });
  }

  if (["completed", "failed", "cancelled", "timed_out"].includes(run.status)) {
    return Response.json({ run, status: run.status });
  }

  await updateAgentRunStatus({
    completedAt: new Date(),
    error: null,
    id,
    onlyIfActive: true,
    status: "cancelled",
    stopReason: "user_stopped",
  });

  return Response.json({ id, status: "cancelled" });
}
