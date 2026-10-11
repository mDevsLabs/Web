import { z } from "zod";
import { errorResponse } from "@/lib/api/error-response";
import {
  isResponse,
  json,
  notFound,
  rejectCrossOriginMutation,
  requireWakiesUser,
} from "@/lib/wakies/http";
import { transfererMessage } from "@/lib/wakies/queries";

/**
 * POST /api/wakies/messages/:id/forward {conversationId} — transfère un message.
 *
 * Le transfert est une COPIE dans une autre conversation DU MÊME COMPTE :
 * l'original reste intact, et la copie porte une part `data-wakies-forward`
 * (conversation d'origine, identifiant d'origine) plutôt qu'un texte
 * fabriqué. Un identifiant d'une conversation étrangère répond 404 sans
 * distinguer « inexistante » de « pas à moi » — la source comme la cible sont
 * filtrées par `userId` dans la requête.
 *
 * Aucun texte n'est réécrit : c'est ce qui rend le transfert fidèle, et c'est
 * aussi pourquoi les pièces jointes survivent — le `pathname` est recopié tel
 * quel, re-signé à la lecture pour le même compte.
 */

const schema = z.object({ conversationId: z.string().uuid() }).strict();

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
      message: "Conversation de destination invalide.",
    });
  }
  const { id } = await params;
  const copie = await transfererMessage(
    identite.userId,
    id,
    parsed.data.conversationId
  );
  if (!copie) {
    return notFound("Message ou conversation introuvable sur ce compte.");
  }
  return json({ message: copie }, { status: 201 });
}
