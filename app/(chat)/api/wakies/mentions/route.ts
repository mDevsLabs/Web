import { z } from "zod";
import {
  badRequest,
  isResponse,
  json,
  requireWakiesUser,
} from "@/lib/wakies/http";
import { suggestMentions } from "@/lib/wakies/mentions";

/**
 * GET /api/wakies/mentions?q=&conversationId=
 *
 * Ce que le composeur peut proposer comme `@jeton`, groupé par section.
 *
 * La liste vient du SERVEUR et non d'une copie côté client : un plugin non
 * installé, un serveur MCP désactivé ou une compétence d'un autre compte ne
 * doivent jamais apparaître comme mentionnables. Ce que l'interface montre est
 * donc exactement ce que la résolution accepterait — à l'exception des motifs
 * d'indisponibilité, affichés plutôt que masqués, pour que l'utilisateur sache
 * POURQUOI une ligne est là et grisée.
 *
 * `conversationId` est accepté pour plus tard (ne pas proposer le Wakie déjà
 * répondant du fil) : il n'entre dans AUCUNE autorisation.
 */

const query = z.object({
  conversationId: z.string().uuid().optional(),
  q: z.string().trim().max(40).default(""),
});

export async function GET(request: Request) {
  const identite = await requireWakiesUser();
  if (isResponse(identite)) {
    return identite;
  }
  const parsed = query.safeParse(
    Object.fromEntries(new URL(request.url).searchParams)
  );
  if (!parsed.success) {
    return badRequest("Recherche de mentions invalide.");
  }
  const suggestions = await suggestMentions({
    q: parsed.data.q,
    tier: identite.tier,
    userEmail: identite.user.email ?? undefined,
    userId: identite.userId,
  });
  // Une seule réponse, déjà ordonnée : le composeur groupe par section sans
  // rien recompter ni re-trier (règle du dépôt : le client ne recalcule pas).
  return json(
    { suggestions },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
