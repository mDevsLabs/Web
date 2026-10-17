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
import {
  compterPagesEspace,
  definirEspaceEpingle,
  findSpace,
  renommerEspace,
  supprimerEspace,
} from "@/lib/wakies/queries";

/**
 * GET    /api/wakies/spaces/:spaceId — l'Espace et le nombre de pages qu'il
 *        contient, en une lecture.
 * PATCH  /api/wakies/spaces/:spaceId — renommage, description, épingle.
 * DELETE /api/wakies/spaces/:spaceId — suppression de l'Espace et de ses pages.
 *
 * Le `pageCount` du GET n'est pas un détail : c'est la valeur que le dialogue
 * de suppression annonce avant de détruire. Le rail, lui, ne charge les pages
 * que quand son arrow est déroulé — compter côté client annoncerait « 0 page »
 * à un Espace plein.
 */

const schema = z
  .object({
    description: z.string().max(500).optional(),
    // `varchar(60)` : la limite du schéma, pas une convenance. Au-delà,
    // PostgreSQL répond `22001 value too long` — une erreur interne là où
    // l'utilisateur a juste écrit un titre trop long.
    name: z.string().trim().min(1).max(60).optional(),
    pinned: z.boolean().optional(),
  })
  .strict()
  .refine(
    (value) =>
      value.description !== undefined ||
      value.name !== undefined ||
      value.pinned !== undefined,
    { message: "Aucune modification demandée." }
  );

/** Un identifiant qui n'est pas un UUID ne doit pas atteindre la base. */
const identifiant = z.string().uuid();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  const identite = await requireWakiesUser();
  if (isResponse(identite)) {
    return identite;
  }
  const { spaceId } = await params;
  if (!identifiant.safeParse(spaceId).success) {
    return notFound("Espace introuvable.");
  }
  const espace = await findSpace(identite.userId, spaceId);
  if (!espace) {
    return notFound("Espace introuvable.");
  }
  return json({
    espace,
    pageCount: await compterPagesEspace(identite.userId, spaceId),
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;
  const identite = await requireWakiesUser();
  if (isResponse(identite)) {
    return identite;
  }
  const { spaceId } = await params;
  if (!identifiant.safeParse(spaceId).success) {
    return notFound("Espace introuvable.");
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("invalid_request", {
      message: zodIssuesMessage(parsed.error),
    });
  }
  try {
    if (parsed.data.pinned !== undefined) {
      const epingle = await definirEspaceEpingle(
        identite.userId,
        spaceId,
        parsed.data.pinned
      );
      if (!epingle) {
        return notFound("Espace introuvable.");
      }
    }
    const renaming =
      parsed.data.name !== undefined || parsed.data.description !== undefined;
    const espace = renaming
      ? await renommerEspace(identite.userId, spaceId, {
          description: parsed.data.description,
          name: parsed.data.name,
        })
      : await findSpace(identite.userId, spaceId);
    if (!espace) {
      return notFound("Espace introuvable.");
    }
    return json(espace);
  } catch (erreur) {
    return erreur instanceof Error
      ? badRequest(erreur.message)
      : toErrorResponse(erreur);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;
  const identite = await requireWakiesUser();
  if (isResponse(identite)) {
    return identite;
  }
  const { spaceId } = await params;
  if (!identifiant.safeParse(spaceId).success) {
    return notFound("Espace introuvable.");
  }
  try {
    const resultat = await supprimerEspace(identite.userId, spaceId);
    if (!resultat) {
      return notFound("Espace introuvable.");
    }
    // Les compteurs sont renvoyés pour que l'interface puisse dire ce qui est
    // parti — et que les Wakies détachés, eux, sont toujours là.
    return json(resultat);
  } catch (erreur) {
    return erreur instanceof Error
      ? badRequest(erreur.message)
      : toErrorResponse(erreur);
  }
}
