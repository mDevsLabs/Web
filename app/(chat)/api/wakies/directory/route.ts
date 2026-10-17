import { isResponse, json, requireWakiesUser } from "@/lib/wakies/http";
import { listerAnnuaire } from "@/lib/wakies/queries";

/**
 * GET /api/wakies/directory?q= — recherche GLOBALE des Wakies publics.
 *
 * Ce que la recherche expose, et rien d'autre : le contenu PUBLIÉ (persona
 * publiée, bio, mascotte, accent) et des états calculés pour CE compte
 * (`estMien`, `estAmi`). Ni `userId` d'un auteur, ni instructions privées,
 * ni capacités : l'annuaire est une vitrine, pas une porte dérobée.
 *
 * Seuil de deux caractères : en dessous, la requête `ILIKE` ramènerait tout
 * l'annuaire public, ce qui n'est ni une recherche ni une information utile.
 * La réponse n'est jamais mise en cache (elle dépend du compte appelant :
 * `estAmi` change d'un utilisateur à l'autre).
 */

const LONGUEUR_MINIMALE = 2;
const MAX_RESULTATS = 20;

export async function GET(request: Request) {
  const identite = await requireWakiesUser();
  if (isResponse(identite)) {
    return identite;
  }
  const url = new URL(request.url);
  const requete = (url.searchParams.get("q") ?? "").trim();
  if (requete.length < LONGUEUR_MINIMALE) {
    return json(
      {
        message: `Saisissez au moins ${LONGUEUR_MINIMALE} caractères.`,
        resultats: [],
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
  const resultats = await listerAnnuaire(
    identite.userId,
    requete,
    MAX_RESULTATS
  );
  return json({ resultats }, { headers: { "Cache-Control": "no-store" } });
}
