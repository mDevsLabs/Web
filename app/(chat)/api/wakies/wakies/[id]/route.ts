import { z } from "zod";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import {
  badRequest,
  isResponse,
  json,
  notFound,
  rejectCrossOriginMutation,
  requireWakiesUser,
  toErrorResponse,
} from "@/lib/wakies/http";
import { validateWakiesModel } from "@/lib/wakies/model-access";
import { deleteWakie, updateWakie } from "@/lib/wakies/queries";
import { WAKIE_AVATARS } from "@/lib/wakies/shared/avatars";

/**
 * PUT    /api/wakies/wakies/:id — mise à jour d'un Wakie du compte courant.
 * DELETE /api/wakies/wakies/:id — suppression du Wakie et de ses conversations.
 *
 * `params` est une Promise dans l'App Router : l'attendre explicitement évite
 * un `undefined` silencieux dans l'identifiant.
 */

/** Liste d'identifiants : vide = choix explicite « aucun », `null` = effacer. */
const liste = z.array(z.string().min(1).max(64)).max(60).nullable().optional();

/**
 * `PUT` est un remplacement COMPLET, pas un `PATCH` : `name`, `instructions`,
 * `memoryAllowed` et `researchAllowed` restent obligatoires. Un formulaire
 * d'édition partielle doit donc reconstruire sa charge utile à partir du
 * profil déjà chargé — c'est fait côté client, et c'est la seule façon
 * d'éviter d'effacer silencieusement un champ non présenté.
 *
 * Les colonnes de sélection, elles, sont facultatives et suivent la sémantique
 * `absent`/`null`/`[]` — voir le commentaire de la route PATCH des
 * conversations.
 */
const schema = z
  .object({
    avatar: z.enum(WAKIE_AVATARS).nullable().optional(),
    instructions: z.string().trim().min(3).max(2000),
    learningContainerId: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .nullable()
      .optional(),
    mcpServerIds: liste,
    memoryAllowed: z.boolean(),
    model: z.string().trim().min(1).max(200).nullable().optional(),
    name: z.string().trim().min(1).max(40),
    pluginIds: liste,
    researchAllowed: z.boolean(),
    skillDeliveryEnabled: z.boolean().optional(),
    skillIds: liste,
    skillParams: z
      .record(
        z.string().min(1).max(64),
        z.record(z.string(), z.string().max(2000))
      )
      .nullable()
      .optional(),
    spaceId: z.string().min(1).optional(),
    spaceIds: z.array(z.string().min(1)).min(1).max(100).optional(),
    toolIds: liste,
  })
  .strict();

export async function PUT(
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
  try {
    const wakie = await updateWakie(identite.userId, id, parsed.data);
    return json(wakie);
  } catch (erreur) {
    const message = erreur instanceof Error ? erreur.message : "";
    if (message.includes("introuvable")) {
      return notFound("Wakie introuvable.");
    }
    return erreur instanceof Error
      ? badRequest(erreur.message)
      : toErrorResponse(erreur);
  }
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
  const supprime = await deleteWakie(identite.userId, id);
  if (!supprime) {
    return notFound("Wakie introuvable.");
  }
  // Conversations, messages, appels, captures et accès aux espaces partent en
  // cascade (clés étrangères `on delete cascade`) : rien à nettoyer ici.
  return json({ ok: true });
}
