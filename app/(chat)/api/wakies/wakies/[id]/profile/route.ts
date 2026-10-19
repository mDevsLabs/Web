import { z } from "zod";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
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
import { lireFicheWakiePartagee } from "@/lib/wakies/public-profile";
import {
  ensureProfilWakie,
  findWakie,
  listerImagesWakie,
  mettreAJourProfilWakie,
  type WakieImageRow,
  type WakieProfilRow,
} from "@/lib/wakies/queries";

/**
 * GET   /api/wakies/wakies/:id/profile — fiche sociale (propriétaire ou publique).
 * PATCH /api/wakies/wakies/:id/profile — bio, liens, persona publiée, visibilité.
 *
 * CE QUI SORT, SELON QUI DEMANDE
 *
 *   - le propriétaire : sa fiche complète, images comprises ;
 *   - un autre compte : la fiche PUBLIQUE — nom, pseudo, bio, liens, persona
 *     publiée et galerie. Jamais `instructions`, capacités, mémoires ni
 *     conversations : `trouverWakiePublic` ne les sélectionne même pas.
 *
 * LES IMAGES SONT SIGNÉES ICI
 *
 * Les blobs sont privés et rangés sous `uploads/<propriétaire>/` : la fiche
 * re-signe donc chaque chemin avec l'espace du PROPRIÉTAIRE (le mien, ou
 * celui de l'auteur quand la fiche est publique). Le propriétaire n'est
 * jamais renvoyé au client : il sert uniquement à signer.
 */

const patchSchema = z
  .object({
    avatarPath: z.string().trim().min(1).max(500).nullable().optional(),
    bannerPath: z.string().trim().min(1).max(500).nullable().optional(),
    bio: z.string().trim().max(500).optional(),
    handle: z.string().trim().min(1).max(33).nullable().optional(),
    isPublic: z.boolean().optional(),
    links: z.array(z.string().trim().max(500)).max(5).optional(),
    publicPersona: z.string().trim().max(2000).optional(),
  })
  .strict();

async function ficheAffichee(input: {
  proprietaire: string;
  profil: WakieProfilRow | null;
  images: WakieImageRow[];
  meta: {
    accent?: string | null;
    avatar?: string | null;
    bio?: string;
    handle: string | null;
    isPublic: boolean;
    name: string;
    personaPubliee?: string;
  };
}) {
  const [avatarUrl, bannerUrl, images] = await Promise.all([
    input.profil?.avatarPath
      ? signerBlobDuProprietaire(input.proprietaire, input.profil.avatarPath)
      : Promise.resolve(null),
    input.profil?.bannerPath
      ? signerBlobDuProprietaire(input.proprietaire, input.profil.bannerPath)
      : Promise.resolve(null),
    Promise.all(
      input.images.map(async (image) => ({
        ...image,
        url: await signerBlobDuProprietaire(
          input.proprietaire,
          image.blobPathname
        ),
      }))
    ),
  ]);
  return {
    images,
    profil: {
      ...(input.profil ?? {}),
      avatarUrl,
      bannerUrl,
      handle: input.meta.handle,
      isPublic: input.meta.isPublic,
      name: input.meta.name,
      ...(input.meta.accent === undefined ? {} : { accent: input.meta.accent }),
      ...(input.meta.avatar === undefined ? {} : { avatar: input.meta.avatar }),
      ...(input.meta.bio === undefined ? {} : { bio: input.meta.bio }),
      ...(input.meta.personaPubliee === undefined
        ? {}
        : { personaPubliee: input.meta.personaPubliee }),
    },
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const identite = await requireWakiesUser();
  if (isResponse(identite)) return identite;
  const { id } = await params;
  const mien = await findWakie(identite.userId, id);
  if (mien) {
    return json(
      await ficheAffichee({
        images: await listerImagesWakie(id, { userId: identite.userId }),
        meta: {
          avatar: mien.avatar ?? null,
          handle: mien.handle ?? null,
          isPublic: mien.isPublic ?? false,
          name: mien.name,
        },
        profil: await ensureProfilWakie(identite.userId, id),
        proprietaire: identite.userId,
      })
    );
  }
  const publique = await lireFicheWakiePartagee(id);
  if (!publique) return notFound("Wakie introuvable.");
  // Seuls les champs publiés sortent : les chemins de stockage contiennent le propriétaire.
  return json({
    images: publique.images,
    profil: { ...publique.profil, avatar: publique.avatar },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const origine = rejectCrossOriginMutation(request);
  if (origine) return origine;
  const identite = await requireWakiesUser();
  if (isResponse(identite)) return identite;
  const { id } = await params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return errorResponse("invalid_request", {
      message: zodIssuesMessage(parsed.error),
    });
  // Un chemin hors de `uploads/<moi>/` ne serait jamais signable : le refuser
  // à l'écriture évite une bannière morte, et rappelle que le chemin vient de
  // l'upload du compte, jamais d'une URL fournie telle quelle.
  for (const chemin of [parsed.data.avatarPath, parsed.data.bannerPath]) {
    if (chemin && !pathnameDuCompte(identite.userId, chemin)) {
      return badRequest("Cette image n'appartient pas à ce compte.");
    }
  }
  try {
    const wakie = await mettreAJourProfilWakie(
      identite.userId,
      id,
      parsed.data
    );
    const profil = await ensureProfilWakie(identite.userId, id);
    return json({
      profil: {
        ...profil,
        handle: wakie.handle ?? null,
        isPublic: wakie.isPublic ?? false,
        name: wakie.name,
      },
      wakie,
    });
  } catch (erreur) {
    const message = erreur instanceof Error ? erreur.message : "";
    if (message.includes("introuvable")) return notFound("Wakie introuvable.");
    if (message.includes("UNIQUE") || message.includes("handle_key"))
      return badRequest("Ce pseudo est déjà pris.");
    return erreur instanceof Error
      ? badRequest(message)
      : toErrorResponse(erreur);
  }
}
