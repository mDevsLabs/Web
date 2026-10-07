import { json, requireWakiesUser } from "@/lib/wakies/http";
import { ensureStarterWorkspace } from "@/lib/wakies/onboarding";
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
  // Premier passage : l'espace et le Wakie de départ. Sans eux, l'interface
  // n'a aucun Wakie à afficher et resterait sur son écran de chargement.
  await ensureStarterWorkspace(userId);
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
