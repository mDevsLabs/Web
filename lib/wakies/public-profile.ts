import "server-only";

/** La fiche partagée sélectionne explicitement ses champs publics. Les chemins de blobs et le propriétaire restent côté serveur. */
import { cache } from "react";
import { signerBlobDuProprietaire } from "@/lib/wakies/blob";
import {
  extraitPersonaPublique,
  lireProfilPublic,
  listerImagesWakie,
  proprietaireWakiePublic,
  trouverWakiePublic,
} from "@/lib/wakies/queries";
import {
  type FicheWakiePartagee,
  WAKIE_ID_PATTERN,
} from "@/lib/wakies/shared/sharing";

function liensPublicsHttp(links: unknown): string[] {
  if (!Array.isArray(links)) return [];
  return links.filter((link): link is string => {
    if (typeof link !== "string") return false;
    try {
      const url = new URL(link);
      return (
        (url.protocol === "https:" || url.protocol === "http:") &&
        !url.username &&
        !url.password
      );
    } catch {
      return false;
    }
  });
}

// React déduplique seulement la lecture du rendu courant (page et métadonnées).
// Aucun cache persistant ne prolonge une publication qui vient d’être retirée.
export const lireFicheWakiePartagee = cache(
  async (id: string): Promise<FicheWakiePartagee | null> => {
    if (!WAKIE_ID_PATTERN.test(id)) return null;
    const publique = await trouverWakiePublic(id);
    if (!publique) return null;
    const [proprietaire, profil, galerie] = await Promise.all([
      proprietaireWakiePublic(id),
      lireProfilPublic(id),
      listerImagesWakie(id, { publicSeulement: true }),
    ]);
    if (!proprietaire) return null;
    const [avatarUrl, bannerUrl, images] = await Promise.all([
      profil?.avatarPath
        ? signerBlobDuProprietaire(proprietaire, profil.avatarPath)
        : null,
      profil?.bannerPath
        ? signerBlobDuProprietaire(proprietaire, profil.bannerPath)
        : null,
      Promise.all(
        galerie.map(async (image) => ({
          alt: image.alt ?? "",
          id: image.id,
          url: await signerBlobDuProprietaire(proprietaire, image.blobPathname),
        }))
      ),
    ]);
    // Une fiche retirée durant la lecture ne doit pas être rendue publique.
    if (!(await trouverWakiePublic(id))) return null;
    return {
      avatar: publique.avatar ?? null,
      id,
      images,
      profil: {
        avatarUrl,
        bannerUrl,
        bio: profil?.bio ?? publique.bio ?? "",
        handle: publique.handle ?? null,
        isPublic: true,
        links: liensPublicsHttp(profil?.links),
        name: publique.name,
        personaPubliee: extraitPersonaPublique(publique, 2000),
      },
    };
  }
);
