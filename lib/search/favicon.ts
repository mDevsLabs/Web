// Service d'icônes de sites — source unique, utilisable par le client.
//
// NE PAS CONFONDRE avec `lib/search/you-client.ts` (moteur, `server-only`)
// ni avec `lib/search/sources.ts` (vocabulaire des sources). Ce module ne
// fait qu'une chose: construire l'URL de l'icône d'un site.
//
// Client-safe volontairement: le moteur (serveur) et l'interface (client)
// doivent produire EXACTEMENT la même URL. Deux implémentations
// divergeraient sur le format de la requête, et une seule des deux serait
// autorisée par la CSP `img-src` — l'icône s'afficherait chez l'un et pas
// chez l'autre.

/**
 * Hôte du service d'icônes.
 *
 * Le service S2 de Google (`www.google.com/s2/favicons`) est déprécié: il
 * répond désormais 404 pour un domaine dépourvu de favicon et expire sur
 * certains appels — les icônes de résultats de recherche apparaissaient alors
 * cassées. Ce service répond TOUJOURS par une image réelle (globe ou
 * monogramme de repli compris), ce qui rend l'icône de repli du côté moteur
 * inutile.
 *
 * Un seul hôte distant à autoriser dans la CSP `img-src`: c'est aussi ce qui
 * évite d'avoir à y ajouter l'encyclopédie pour sa propre favicon.
 */
export const FAVICON_SERVICE_HOST = "https://favicon.im";

/**
 * URL d'icône pour un nom de domaine.
 *
 * Un domaine vide rend une chaîne vide: l'appelant affiche alors son icône
 * de repli locale, plutôt que de demander une image qui ne peut pas exister.
 */
export function buildFaviconUrlForDomain(domain: string): string {
  const propre = domain.trim().toLowerCase();
  if (!propre) {
    return "";
  }
  return `${FAVICON_SERVICE_HOST}/${encodeURIComponent(propre)}`;
}

/** URL d'icône pour une adresse de page. */
export function buildFaviconUrl(urlStr: string): string {
  try {
    return buildFaviconUrlForDomain(new URL(urlStr).hostname);
  } catch {
    return "";
  }
}

/**
 * Favicon de l'encyclopédie.
 *
 * Constante partagée: le même chemin était écrit en dur à deux endroits
 * (repli historique et source à part entière), et une divergence afficherait
 * deux pastilles différentes pour la même source.
 */
export const WIKIPEDIA_FAVICON_URL = buildFaviconUrlForDomain("wikipedia.org");
