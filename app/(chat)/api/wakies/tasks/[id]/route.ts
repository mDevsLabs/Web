import {
  isResponse,
  json,
  notFound,
  requireWakiesUser,
} from "@/lib/wakies/http";
import { taskDetail } from "@/lib/wakies/queries";

/**
 * GET /api/wakies/tasks/:id — tâche, exécutions et journal d'avancement.
 *
 * La forme `{ task, runs, events }` est celle du gabarit (`Detail`), pour que
 * le panneau d'activité porté n'ait pas à être réécrit.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const identite = await requireWakiesUser();
  if (isResponse(identite)) {
    return identite;
  }
  const { id } = await params;
  const detail = await taskDetail(identite.userId, id);
  return detail ? json(detail) : notFound("Tâche introuvable.");
}
