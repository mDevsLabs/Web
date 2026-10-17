import { json, requireWakiesUser } from "@/lib/wakies/http";
import {
  listCalls,
  listConversations,
  listSpaces,
  listWakies,
} from "@/lib/wakies/queries";
import { wakiesSetupStatus } from "@/lib/wakies/setup";

/**
 * GET /api/wakies/workspace — spaces, Wakies, conversations, configuration.
 *
 * Remplace `/api/workspace` du gabarit. La forme est conservée à l'identique :
 * `dots` y est devenu `wakies` (le renommage OpenDots/Dot → Wakies/Wakie est
 * appliqué jusque dans le contrat d'API), et `setup` décrit ce qui est
 * réellement branché côté hôte — plus aucune variable d'environnement à saisir.
 */
export async function GET() {
  const identite = await requireWakiesUser();
  if (identite instanceof Response) {
    return identite;
  }
  const userId = identite.userId;
  // La lecture du workspace ne crée aucune donnée : un nouveau compte démarre
  // avec zéro Espace et zéro Wakie, jusqu'à une création explicite.
  const [spaces, wakies, conversations, calls, setup] = await Promise.all([
    listSpaces(userId),
    listWakies(userId),
    listConversations(userId),
    listCalls(userId),
    wakiesSetupStatus(),
  ]);

  return json(
    { calls, conversations, setup, spaces, wakies },
    { headers: { "Cache-Control": "no-store" } }
  );
}
