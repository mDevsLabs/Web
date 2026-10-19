import { z } from "zod";
import { errorResponse } from "@/lib/api/error-response";
import {
  isResponse,
  json,
  rejectCrossOriginMutation,
  requireWakiesUser,
} from "@/lib/wakies/http";
import { marquerConversationLue } from "@/lib/wakies/queries";

/**
 * POST /api/wakies/conversations/:id/read {seq} — marque la conversation lue.
 *
 * `seq` est le dernier message RÉELLEMENT vu par le client, jamais un
 * horodatage : deux messages d'une même salve partagent leur `createdAt`, et
 * un curseur daté laisserait l'un des deux éternellement non lu.
 *
 * Le curseur ne recule pas (voir `marquerConversationLue`) : rouvrir une page
 * ancienne ne ressuscite pas des non-lus déjà lus. Une conversation d'un autre
 * compte n'est pas marquée — la requête filtre sur `userId`, donc rien ne se
 * passe et la réponse reste un succès idempotent.
 */

const schema = z
  .object({ seq: z.number().int().nonnegative().max(2_147_483_647) })
  .strict();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const origine = rejectCrossOriginMutation(request);
  if (origine) return origine;
  const identite = await requireWakiesUser();
  if (isResponse(identite)) {
    return identite;
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("invalid_request", {
      message: "Curseur de lecture invalide.",
    });
  }
  const { id } = await params;
  const lastReadSeq = await marquerConversationLue(
    identite.userId,
    id,
    parsed.data.seq
  );
  return json({ lastReadSeq });
}
