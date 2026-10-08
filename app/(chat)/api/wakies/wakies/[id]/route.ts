import { z } from "zod";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import {
  badRequest,
  isResponse,
  json,
  notFound,
  requireWakiesUser,
  toErrorResponse,
} from "@/lib/wakies/http";
import { deleteWakie, updateWakie } from "@/lib/wakies/queries";
import { WAKIE_AVATARS } from "@/lib/wakies/shared/avatars";

/**
 * PUT    /api/wakies/wakies/:id — mise à jour d'un Wakie du compte courant.
 * DELETE /api/wakies/wakies/:id — suppression du Wakie et de ses conversations.
 *
 * `params` est une Promise dans l'App Router : l'attendre explicitement évite
 * un `undefined` silencieux dans l'identifiant.
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
    memoryAllowed: z.boolean(),
    model: z.string().trim().min(1).max(200).nullable().optional(),
    name: z.string().trim().min(1).max(40),
    researchAllowed: z.boolean(),
    skillDeliveryEnabled: z.boolean().optional(),
    spaceId: z.string().min(1).optional(),
    spaceIds: z.array(z.string().min(1)).min(1).max(100).optional(),
  })
  .strict();

export async function PUT(
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
