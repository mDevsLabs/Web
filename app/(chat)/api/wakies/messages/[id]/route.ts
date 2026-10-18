import { z } from "zod";
import { errorResponse } from "@/lib/api/error-response";
import {
  isResponse,
  json,
  rejectCrossOriginMutation,
  requireWakiesUser,
} from "@/lib/wakies/http";
import { updateOwnMessageText } from "@/lib/wakies/queries";

/**
 * PATCH { text } — modifie le texte d'un message du compte.
 *
 * La propriété et le rôle sont revérifiés dans la requête SQL : une réponse de
 * Wakie reste un témoignage du modèle, jamais une ligne réécrite par l'humain.
 * Le serveur est l'autorité, l'interface ne fait que demander.
 */

const schema = z.object({
  text: z.string().trim().min(1).max(8000),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;
  const identite = await requireWakiesUser();
  if (isResponse(identite)) return identite;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("invalid_request", {
      message: "Le message doit contenir entre 1 et 8000 caractères.",
    });
  }

  const { id } = await params;
  if (!id) {
    return errorResponse("invalid_request", {
      message: "Identifiant de message requis.",
    });
  }

  const modifie = await updateOwnMessageText(
    identite.userId,
    id,
    parsed.data.text
  );
  if (!modifie) {
    return errorResponse("not_found", {
      message: "Message introuvable, ou réponse de Wakie non modifiable.",
    });
  }
  return json({ ok: true });
}
