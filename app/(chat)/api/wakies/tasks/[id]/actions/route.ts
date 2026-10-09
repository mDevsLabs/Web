import { z } from "zod";
import { errorResponse } from "@/lib/api/error-response";
import {
  isResponse,
  json,
  notFound,
  rejectCrossOriginMutation,
  requireWakiesUser,
} from "@/lib/wakies/http";
import { actionTask, ensureSettings } from "@/lib/wakies/queries";

/** POST /api/wakies/tasks/:id/actions — run | pause | cancel. */

const schema = z
  .object({ action: z.enum(["run", "pause", "cancel"]) })
  .strict();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;
  const identite = await requireWakiesUser();
  if (isResponse(identite)) {
    return identite;
  }
  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("invalid_request", { message: "Action inconnue." });
  }
  if (parsed.data.action === "run") {
    const reglage = await ensureSettings(identite.userId);
    if (!reglage.researchAllowed) {
      return errorResponse("access_denied", {
        message: "La recherche est désactivée dans les réglages.",
      });
    }
  }
  const task = await actionTask(identite.userId, id, parsed.data.action);
  return task ? json(task) : notFound("Tâche introuvable.");
}
