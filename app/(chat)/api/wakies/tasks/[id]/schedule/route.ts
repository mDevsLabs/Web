import { z } from "zod";
import { errorResponse } from "@/lib/api/error-response";
import {
  isResponse,
  json,
  notFound,
  requireWakiesUser,
} from "@/lib/wakies/http";
import { scheduleTask } from "@/lib/wakies/queries";

/**
 * PUT /api/wakies/tasks/:id/schedule — intervalle de répétition.
 *
 * `null` supprime la répétition. La borne basse (60 s) est celle du gabarit :
 * en dessous, la tâche est une boucle, pas une planification.
 */

const schema = z
  .object({
    intervalSeconds: z.number().int().min(60).max(31_536_000).nullable(),
  })
  .strict();

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const identite = await requireWakiesUser();
  if (isResponse(identite)) {
    return identite;
  }
  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("invalid_request", {
      message:
        "L'intervalle de répétition va de 60 secondes à un an, ou null pour l'arrêter.",
    });
  }
  const task = await scheduleTask(
    identite.userId,
    id,
    parsed.data.intervalSeconds
  );
  return task ? json(task) : notFound("Tâche introuvable.");
}
