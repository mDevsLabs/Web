import { errorResponse } from "@/lib/api/error-response";
import {
  badRequest,
  isResponse,
  json,
  notFound,
  rejectCrossOriginMutation,
  requireWakiesUser,
  toErrorResponse,
} from "@/lib/wakies/http";
import { pagePatch } from "@/lib/wakies/pages";
import { findPage, updatePage } from "@/lib/wakies/queries";

/**
 * GET   /api/wakies/pages/:id — lecture.
 * PATCH /api/wakies/pages/:id — écriture sous contrôle de révision.
 *
 * Le 409 sur révision périmée est le contrat du gabarit, et il compte : deux
 * onglets ouverts sur la même page, ou une régénération par un Wakie pendant
 * que l'utilisateur écrit, NE DOIVENT PAS s'écraser. Le second perd sa
 * sauvegarde et recharge ; il n'y a pas de fusion silencieuse.
 */

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const identite = await requireWakiesUser();
  if (isResponse(identite)) {
    return identite;
  }
  const { id } = await params;
  const page = await findPage(identite.userId, id);
  return page ? json(page) : notFound("Page introuvable.");
}

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
  const parsed = pagePatch.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("invalid_request", {
      message:
        "Enregistrement invalide : un numéro de révision attendu est obligatoire.",
    });
  }
  try {
    const page = await updatePage(identite.userId, id, parsed.data);
    if (!page) {
      const existant = await findPage(identite.userId, id);
      if (!existant) {
        return notFound("Page introuvable.");
      }
      return errorResponse("conflict", {
        message:
          "Cette page a changé. Rechargez la dernière révision avant d'enregistrer votre brouillon.",
      });
    }
    return json(page);
  } catch (erreur) {
    return erreur instanceof Error
      ? badRequest(erreur.message)
      : toErrorResponse(erreur);
  }
}
