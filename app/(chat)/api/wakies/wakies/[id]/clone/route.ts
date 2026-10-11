import { z } from "zod";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import { getWakiesQuota } from "@/lib/plans/tier-limits";
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
  clonerWakiePublic,
  findWakie,
  trouverWakiePublic,
  WakiesQuotaError,
} from "@/lib/wakies/queries";

/**
 * POST /api/wakies/wakies/:id/clone — copie un Wakie PUBLIC chez moi.
 *
 * Pourquoi un espace de destination est exigé : un Wakie vit dans un espace
 * de travail (`WakiesWakie.spaceId`), et le clone est un Wakie à part
 * entière. Deviner l'espace « par défaut » du clone serait un choix produit
 * arbitraire ; le client le demande, comme pour toute création.
 *
 * Quota : le clone crée un Wakie, donc il consomme le quota `wakies` du
 * forfait, compté ET inséré dans la même transaction (d'où le 429, jamais un
 * 400 : la demande est valide, c'est la limite qui refuse).
 */

const schema = z
  .object({
    name: z.string().trim().min(1).max(40).optional(),
    spaceId: z.string().min(1),
  })
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
      message: zodIssuesMessage(parsed.error),
    });
  }
  const { id } = await params;
  if (await findWakie(identite.userId, id)) {
    return errorResponse("invalid_request", {
      message:
        "Ce Wakie vous appartient déjà : il n'y a rien à cloner. Renommez-le ou modifiez-le directement.",
    });
  }
  if (!(await trouverWakiePublic(id))) {
    return notFound("Wakie public introuvable.");
  }
  try {
    const wakie = await clonerWakiePublic(
      identite.userId,
      id,
      parsed.data,
      getWakiesQuota(identite.tier, "wakies")
    );
    return json({ wakie }, { status: 201 });
  } catch (erreur) {
    if (erreur instanceof WakiesQuotaError) {
      return errorResponse("quota_exceeded", {
        details: {
          limit: "wakies",
          quota: erreur.limite,
          used: erreur.utilise,
        },
        message: `Limite de ${erreur.limite} Wakies atteinte pour ce forfait. Supprimez-en un avant d'en cloner un nouveau.`,
      });
    }
    return erreur instanceof Error
      ? badRequest(erreur.message)
      : toErrorResponse(erreur);
  }
}
