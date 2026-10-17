import { lireProfilVibe } from "@/lib/vibe/server/profil";
import {
  isResponse,
  json,
  notFound,
  requireWakiesUser,
} from "@/lib/wakies/http";

/**
 * GET /api/wakies/me/profile — profil Vibe de l'utilisateur, en LECTURE.
 *
 * Carte « Mon profil » de Wakies : elle montre qui l'utilisateur est pour ses
 * Wakies, et renvoie vers Vibe pour modifier. Aucune écriture dans ce sens —
 * Vibe fait foi, et une route Wakies qui écrirait dans le profil social
 * ferait diverger deux interfaces pour la même donnée.
 *
 * Ce que la route NE sert pas : l'email, le forfait, les compteurs privés.
 * Le lecteur ne les sélectionne même pas.
 *
 * `null` du lecteur (pas de table Vibe, profil absent) ⇒ 404 avec un message
 * franc, plutôt qu'un objet vide que la carte afficherait comme un profil
 * sans nom.
 */

export async function GET() {
  const identite = await requireWakiesUser();
  if (isResponse(identite)) {
    return identite;
  }
  const profil = await lireProfilVibe();
  if (!profil) {
    return notFound(
      "Votre profil Vibe est indisponible pour l’instant. Réessayez plus tard."
    );
  }
  return json(profil, { headers: { "Cache-Control": "no-store" } });
}
