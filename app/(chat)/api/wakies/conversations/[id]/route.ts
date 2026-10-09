import { z } from "zod";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import {
  isResponse,
  json,
  notFound,
  rejectCrossOriginMutation,
  requireWakiesUser,
  toErrorResponse,
} from "@/lib/wakies/http";
import { validateWakiesModel } from "@/lib/wakies/model-access";
import {
  deleteConversation,
  findConversation,
  updateConversation,
} from "@/lib/wakies/queries";

/**
 * PATCH  /api/wakies/conversations/:id — titre, modèle et sélection d'outils.
 * DELETE /api/wakies/conversations/:id — suppression (messages inclus, en cascade).
 *
 * La distinction `undefined` / `null` porte sur TOUS les champs :
 *
 *   - champ absent → conserver la valeur actuelle ;
 *   - `null`       → revenir au réglage du Wakie (ou effacer le choix) ;
 *   - `[]`         → choix explicite de ne rien utiliser.
 *
 * Le formulaire doit donc écrire le champ même quand il veut « revenir au
 * Wakie » : envoyer `{ model: "" }` ne reviendrait pas au modèle du Wakie, ça
 * serait refusé (`z.string().trim().min(1)`).
 *
 * Les identifiants envoyés ne sont PAS validés ici comme appartenant au
 * compte : un Skill d'un autre compte échouerait plus tard, à l'usage, avec un
 * message (« cette compétence n'existe pas sur ce compte ») au lieu d'un refus
 * clair. Enregistrer l'intention et la revalider au moment du tour est le même
 * mécanisme que celui des Plugins et des serveurs MCP.
 */

/** Liste d'identifiants : vide = choix explicite « aucun ». */
const liste = z.array(z.string().min(1).max(64)).max(60).nullable().optional();

const schema = z
  .object({
    mcpServerIds: liste,
    model: z.string().trim().min(1).max(200).nullable().optional(),
    pluginIds: liste,
    skillIds: liste,
    skillParams: z
      .record(
        z.string().min(1).max(64),
        z.record(z.string(), z.string().max(2000))
      )
      .nullable()
      .optional(),
    title: z.string().trim().min(1).max(120).optional(),
    toolIds: liste,
  })
  .strict()
  .refine(
    (value) =>
      value.title !== undefined ||
      value.model !== undefined ||
      value.skillIds !== undefined ||
      value.pluginIds !== undefined ||
      value.mcpServerIds !== undefined ||
      value.toolIds !== undefined ||
      value.skillParams !== undefined,
    {
      message:
        "Rien à modifier : précisez un titre, un modèle ou une sélection.",
    }
  );

export async function PATCH(
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
    return errorResponse("invalid_request", {
      message: zodIssuesMessage(parsed.error),
    });
  }
  const modelError = await validateWakiesModel(
    parsed.data.model,
    identite.tier
  );
  if (modelError) return modelError;
  const row = await updateConversation(identite.userId, id, parsed.data);
  if (!row) {
    return notFound("Conversation introuvable.");
  }
  return json(row);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const originError = rejectCrossOriginMutation(_request);
  if (originError) return originError;
  const identite = await requireWakiesUser();
  if (isResponse(identite)) {
    return identite;
  }
  const { id } = await params;
  const supprime = await deleteConversation(identite.userId, id);
  if (!supprime) {
    return notFound("Conversation introuvable.");
  }
  // Messages, appels, captures et pages liées partent en cascade : les clés
  // étrangères sont « on delete cascade », rien à nettoyer à la main.
  return json({ ok: true });
}
