import { isResponse, json, requireWakiesUser } from "@/lib/wakies/http";
import {
  chercherDansWakiesMessages,
  searchWakiesMemories,
  searchWakiesTasks,
  searchWakiesWorkspace,
} from "@/lib/wakies/queries";

/**
 * GET /api/wakies/search?q= — recherche dans l'espace de travail.
 *
 * DEUX SURFACES, POUR DEUX BESOINS
 *
 * 1. `?q=` renvoie la recherche UNIFIÉE : conversations, messages, pages,
 *    Espaces et Wakies, en une requête. C'est ce que consomme la barre de
 *    recherche du rail, et c'est ce qui a mis fin à la reconstruction
 *    côté navigateur.
 *
 * 2. `?q=&messages=1` renvoie l'historique seul, au format historique
 *    (`{ conversations, messages }`). Ce contrat a des appelants et des
 *    tests : il est conservé tel quel, mais son filtre des messages passe
 *    désormais en base — donc « I love » trouve enfin « I love this ».
 *
 * POURQUOI UNE RECHERCHE UNIFIÉE
 *
 * Le rail filtrait en JavaScript ce qu'il avait déjà chargé, et allait
 * chercher les pages ESPACE PAR ESPACE à chaque frappe. Un compte avec huit
 * Espaces déclenchait huit requêtes pour un mot tapé. Ici, une seule requête
 * interroge la base, et le coût ne dépend plus du nombre d'Espaces.
 *
 * SEUIL DE DEUX CARACTÈRES
 *
 * Identique à l'annuaire : en dessous, le résultat ne serait pas une
 * recherche.
 */

const LONGUEUR_MINIMALE = 2;

/** Le paramètre qui demande l'historique seul, au format historique. */
const PARAM_HISTORIQUE = "messages";

export async function GET(request: Request) {
  const identite = await requireWakiesUser();
  if (isResponse(identite)) {
    return identite;
  }
  const params = new URL(request.url).searchParams;
  const requete = (params.get("q") ?? "").trim();
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

  /**
   * L'HISTORIQUE SEUL, au format historique.
   *
   * Le paramètre est explicite : sans lui, la réponse est la recherche
   * unifiée. Deux contrats distincts ne doivent pas se recouvrir — sinon
   * l'ajout d'une surface casserait le premier.
   */
  if (params.get(PARAM_HISTORIQUE) === "1") {
    const resultats = await chercherDansWakiesMessages(
      identite.userId,
      requete
    );
    return json(resultats, { headers: { "Cache-Control": "no-store" } });
  }

  /**
   * LA RECHERCHE UNIFIÉE.
   *
   * Les cinq surfaces sont lues EN PARALLÈLE : le délai est celui de la
   * source la plus lente, pas leur somme. Les mémoires et les tâches sont
   * lues à part, parce qu'elles n'ont pas le même contrat de présentation.
   */
  const [espace, memoires, taches] = await Promise.all([
    searchWakiesWorkspace(identite.userId, requete),
    searchWakiesMemories(identite.userId, requete),
    searchWakiesTasks(identite.userId, requete),
  ]);

  const hits = [
    ...espace.hits,
    ...memoires.map((memoire) => ({
      href: "/wakies/#/memories",
      id: `memory-${memoire.id}`,
      kind: "memory" as const,
      meta: memoire.createdAt.toISOString(),
      subtitle: memoire.text.slice(0, 160),
      title: "Mémoire",
    })),
    ...taches.map((tache) => ({
      href: "/wakies/#/tasks",
      id: `task-${tache.id}`,
      kind: "task" as const,
      meta: tache.status,
      subtitle: tache.prompt.slice(0, 160),
      title: "Tâche planifiée",
    })),
  ];

  return json(
    {
      counts: {
        ...espace.counts,
        memory: memoires.length,
        task: taches.length,
      },
      hits,
      total: hits.length,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
