import { isResponse, json, requireWakiesUser } from "@/lib/wakies/http";
import { chercherDansWakies } from "@/lib/wakies/queries";

/**
 * GET /api/wakies/search?q= — recherche dans les conversations et les messages.
 *
 * Deux surfaces, parce qu'on ne cherche pas la même chose : un TITRE (on sait
 * de quel fil on parle) ou un EXTRAIT (on se souvient d'une phrase). Les
 * messages sont cherchés dans les 100 derniers de chaque conversation et
 * l'opération est bornée à 200 lignes : c'est une recherche de reprise, pas
 * une indexation — la borne est appliquée côté requête, pas promise côté
 * interface.
 *
 * Seuil de deux caractères, identique à l'annuaire : en dessous, le résultat
 * ne serait pas une recherche.
 */

const LONGUEUR_MINIMALE = 2;

export async function GET(request: Request) {
  const identite = await requireWakiesUser();
  if (isResponse(identite)) {
    return identite;
  }
  const requete = (new URL(request.url).searchParams.get("q") ?? "").trim();
  if (requete.length < LONGUEUR_MINIMALE) {
    return json(
      {
        conversations: [],
        message: `Saisissez au moins ${LONGUEUR_MINIMALE} caractères.`,
        messages: [],
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
  const resultats = await chercherDansWakies(identite.userId, requete);
  return json(resultats, { headers: { "Cache-Control": "no-store" } });
}
