import { z } from "zod";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import { getWakiesQuota } from "@/lib/plans/tier-limits";
import { pathnameDuCompte, signerBlobDuProprietaire } from "@/lib/wakies/blob";
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
  ajouterImageWakie,
  findWakie,
  listerImagesWakie,
  proprietaireWakiePublic,
  supprimerImageWakie,
  type WakieImageRow,
  WakiesImageQuotaError,
} from "@/lib/wakies/queries";

/**
 * GET  /api/wakies/wakies/:id/images — galerie du profil social.
 * POST /api/wakies/wakies/:id/images {blobPathname, alt} — ajout (propriétaire).
 *
 * Quota volumétrique par Wakie : Plus 10, Pro 50, Max illimité. Le refus est
 * un 429 avec le compteur relevé en transaction, pas une erreur de saisie.
 *
 * LECTURE DES IMAGES
 *
 * Les blobs sont PRIVÉS : un `pathname` stocké n'est pas une URL, et le
 * rendre tel quel donnerait une galerie de liens morts. La route re-signe
 * donc chaque image — avec l'espace du PROPRIÉTAIRE, parce qu'une fiche
 * publique montre les images d'un autre compte. Le chemin signé est toujours
 * celui relu en base, jamais un chemin fourni par le client : sans cette
 * règle, cette route serait un oracle de signature.
 *
 * QUOTA SERVI AVEC LA GALERIE
 *
 * La réponse porte la limite du forfait (`quota`, `null` = illimité) : la
 * fiche affiche donc « 3 / 10 » sans que le client ait à connaître les
 * forfaits, et sans qu'un dépassement ne se découvre au moment de l'envoi.
 * Le quota reste APPLIQUÉ côté serveur (`getWakiesQuota` au POST) : la valeur
 * affichée est la même que celle qui refuse.
 */

/** Ajoute l'URL signée à chaque image, avec l'espace du propriétaire. */
async function avecUrl(
  images: WakieImageRow[],
  proprietaire: string
): Promise<Array<WakieImageRow & { url: string | null }>> {
  return Promise.all(
    images.map(async (image) => ({
      ...image,
      url: await signerBlobDuProprietaire(proprietaire, image.blobPathname),
    }))
  );
}

const schema = z
  .object({
    alt: z.string().trim().max(140).optional(),
    blobPathname: z.string().trim().min(1).max(500),
  })
  .strict();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const identite = await requireWakiesUser();
  if (isResponse(identite)) return identite;
  const { id } = await params;
  const quota = getWakiesQuota(identite.tier, "wakieProfileImages");
  if (await findWakie(identite.userId, id)) {
    return json({
      images: await avecUrl(
        await listerImagesWakie(id, { userId: identite.userId }),
        identite.userId
      ),
      quota,
    });
  }
  const proprietaire = await proprietaireWakiePublic(id);
  if (!proprietaire) return notFound("Wakie introuvable.");
  return json({
    images: await avecUrl(
      await listerImagesWakie(id, { publicSeulement: true }),
      proprietaire
    ),
    quota,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const origine = rejectCrossOriginMutation(request);
  if (origine) return origine;
  const identite = await requireWakiesUser();
  if (isResponse(identite)) return identite;
  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return errorResponse("invalid_request", {
      message: zodIssuesMessage(parsed.error),
    });
  // Un chemin hors de `uploads/<moi>/` ne sera JAMAIS signable : le refuser à
  // l'écriture évite une galerie de vignettes mortes, et rappelle que le
  // chemin vient de l'upload du compte, pas d'une URL devinée.
  if (!pathnameDuCompte(identite.userId, parsed.data.blobPathname))
    return badRequest("Ce fichier n'appartient pas à ce compte.");
  try {
    const image = await ajouterImageWakie(
      identite.userId,
      id,
      parsed.data,
      getWakiesQuota(identite.tier, "wakieProfileImages")
    );
    return json({ image }, { status: 201 });
  } catch (erreur) {
    if (erreur instanceof WakiesImageQuotaError)
      return errorResponse("quota_exceeded", {
        details: {
          limit: "wakieProfileImages",
          quota: erreur.limite,
          used: erreur.utilise,
        },
        message: `Limite de ${erreur.limite} images de profil atteinte pour ce forfait. Supprimez-en une avant d'en ajouter une nouvelle.`,
      });
    const message = erreur instanceof Error ? erreur.message : "";
    if (message.includes("introuvable")) return notFound("Wakie introuvable.");
    return erreur instanceof Error
      ? badRequest(message)
      : toErrorResponse(erreur);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const origine = rejectCrossOriginMutation(request);
  if (origine) return origine;
  const identite = await requireWakiesUser();
  if (isResponse(identite)) return identite;
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const imageId = searchParams.get("imageId") ?? "";
  if (!imageId) return badRequest("Image introuvable.");
  const supprimee = await supprimerImageWakie(identite.userId, id, imageId);
  if (!supprimee) return notFound("Image introuvable.");
  return json({ ok: true });
}
