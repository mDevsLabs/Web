import { errorResponse } from "@/lib/api/error-response";
import { getMaiUser } from "@/lib/auth/session";
import { getAgentRunById, updateAgentRunStatus } from "@/lib/db/agent-queries";

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

  if (run.status === "completed" || run.status === "failed") {
    return Response.json({ run, status: run.status });
  }

  await updateAgentRunStatus({
    completedAt: new Date(),
    error: null,
    id,
    status: "cancelled",
  });

  return Response.json({ id, status: "cancelled" });
}
