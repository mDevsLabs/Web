import { z } from "zod";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import {
  isResponse,
  json,
  notFound,
  requireWakiesUser,
  toErrorResponse,
} from "@/lib/wakies/http";
import {
  deleteConversation,
  findConversation,
  updateConversation,
} from "@/lib/wakies/queries";

/**
 * PATCH  /api/wakies/conversations/:id — renommage et modèle IA.
 * DELETE /api/wakies/conversations/:id — suppression (messages inclus, en cascade).
 *
 * Le modèle se choisit dans l'en-tête du chat, comme dans le Chat principal :
 * `null` est un choix explicite (« revenir au modèle du Wakie »), pas une
 * absence de valeur — d'où un schéma qui distingue `undefined` de `null`.
 */

const schema = z
  .object({
    model: z.string().trim().min(1).max(200).nullable().optional(),
    title: z.string().trim().min(1).max(120).optional(),
  })
  .strict()
  .refine((value) => value.title !== undefined || value.model !== undefined, {
    message: "Rien à modifier : précisez un titre ou un modèle.",
  });

export async function PATCH(
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
      message: zodIssuesMessage(parsed.error),
    });
  }
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
