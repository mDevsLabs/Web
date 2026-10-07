import { json, requireWakiesUser } from "@/lib/wakies/http";
import { ensureSettings, listMemories, listTasks } from "@/lib/wakies/queries";
import { wakiesSetupStatus } from "@/lib/wakies/setup";

/**
 * GET /api/wakies/state — état global de l'application pour le compte courant.
 *
 * Remplace `/api/state` du gabarit (Hono + SQLite). La réponse garde la même
 * forme que celle attendue par l'interface portée, y compris `mode` et
 * `configured`, afin que le port n'ait pas à réécrire le chargement initial.
 */
export async function GET() {
  const identite = await requireWakiesUser();
  if (identite instanceof Response) {
    return identite;
  }
  const userId = identite.userId;
  const [settings, tasks, memories, setup] = await Promise.all([
    ensureSettings(userId),
    listTasks(userId),
    listMemories(userId),
    wakiesSetupStatus(),
  ]);

  return json(
    {
      configured: setup.missing.length === 0,
      memories,
      mode: "live",
      settings,
      tasks,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
