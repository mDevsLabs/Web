/**
 * Analyse d'une saisie de recherche mAI Search.
 *
 * Ce module est PUR et client-safe : il ne touche ni la base, ni le réseau,
 * ni aucun secret. Il existe pour que le serveur et l'interface parlent de la
 * MÊME chose quand ils analysent une requête.
 *
 * ── Pourquoi un module à part ──────────────────────────────────────────────
 *
 * La recherche mAI Search a deux alarmes que rien ne partageait :
 *
 * - le serveur, qui découpe la saisie en jetons (`you-client.ts`) ;
 * - l'interface, qui devait décider de la longueur minimale, de la
 *   normalisation de la casse et de ce qui ressemble à une URL.
 *
 * Deux implémentations, deux comportements : l'interface autorisait une
 * recherche d'un caractère pendant que le moteur en exigeait deux, et la
 * détection d'URL n'existait que d'un côté. Toute la logique de lecture d'une
 * saisie est donc ici, et elle est TESTÉE.
 *
 * ── Les accents ne sont pas effacés ────────────────────────────────────────
 *
 * « Noël » et « Noel » ne sont pas la même recherche, et la normalisation NFD
 * retirerait le « œ » comme un accent composable alors que c'est une lettre.
 * On conserve donc la forme écrite : les moteurs et l'encyclopédie gèrent
 * l'accent eux-mêmes, et l'utilisateur voit ce qu'il a tapé.
 */

/** Longueur minimale d'une requête exploitable. */
export const MAI_SEARCH_MIN_QUERY_LENGTH = 2;

/** Longueur maximale acceptée par l'API (alignée sur le schéma de la route). */
export const MAI_SEARCH_MAX_QUERY_LENGTH = 500;

/**
 * Découpe une saisie en jetons de recherche.
 *
 * Les jetons vides sont retirés, les doublons écartés, et l'ORDRE est
 * conservé : c'est lui qui départage des résultats de pertinence égale. La
 * casse est mise à part : les jetons servent à comparer, pas à afficher.
 */
export function tokenizeQuery(query: string): string[] {
  const vus = new Set<string>();
  const jetons: string[] = [];
  for (const brut of query.split(/\s+/u)) {
    const jeton = brut.trim();
    if (!jeton) {
      continue;
    }
    const cle = jeton.toLowerCase();
    if (vus.has(cle)) {
      continue;
    }
    vus.add(cle);
    jetons.push(jeton);
  }
  return jetons;
}

/**
 * La saisie est-elle exploitable ?
 *
 * Deux caractères minimum : en dessous, la requête ne distingue rien, et le
 * moteur comme l'interface refusent de répondre. La comparaison se fait sur la
 * longueur BRUTE : « a b » fait deux caractères et cherche quelque chose.
 */
export function isSearchableQuery(query: string): boolean {
  return query.trim().length >= MAI_SEARCH_MIN_QUERY_LENGTH;
}

/**
 * Les TLD (domaines de premier niveau) les plus courants.
 *
 * La liste est CE QUI DISTINGUE « exemple.fr » d'une extension de fichier.
 * Sans elle, « node.js » et « index.html » passeraient pour des adresses :
 * or « node.js » est un MOT, et chercher « node.js » dans un moteur est
 * exactement ce que l'utilisateur veut.
 *
 * La liste est volontairement courte et stable : elle ne cherche pas à
 * couvrir tous les TLD du monde, mais à couvrir ceux qu'un francophone
 * rencontre. Un TLD absent fait retomber la saisie sur une recherche
 * normale — ce qui est le comportement le moins mauvais.
 */
const TLD_COURANTS = new Set([
  "ai",
  "app",
  "be",
  "biz",
  "blog",
  "ch",
  "cloud",
  "club",
  "co",
  "com",
  "dev",
  "edu",
  "fr",
  "gg",
  "gov",
  "info",
  "io",
  "it",
  "me",
  "net",
  "news",
  "nl",
  "online",
  "org",
  "page",
  "pro",
  "shop",
  "site",
  "software",
  "store",
  "tech",
  "tv",
  "uk",
  "us",
  "website",
  "wiki",
  "xyz",
]);

/**
 * La saisie ressemble-t-elle à une adresse web ?
 *
 * Une URL n'est pas une question : la chercher dans un moteur renvoie des
 * pages qui « parlent » de l'URL. La reconnaître permet de proposer
 * directement la page — et, surtout, d'éviter une requête inutile.
 *
 * Le test est volontairement strict :
 *
 * - il faut un schéma, OU un nom d'hôte dont le dernier segment est un TLD
 *   connu. C'est ce qui distingue « exemple.fr » (une adresse) de
 *   « node.js » (un mot) ;
 * - une phrase n'est jamais une adresse.
 */
export function looksLikeUrl(query: string): boolean {
  const texte = query.trim();
  if (!texte || /\s/u.test(texte)) {
    return false;
  }
  if (/^https?:\/\//iu.test(texte)) {
    return true;
  }
  // « exemple.fr », « docs.exemple.fr/chemin » : le dernier segment doit
  // être un TLD connu.
  const sansChemin = texte.split("/")[0].split(":")[0];
  const segments = sansChemin.split(".");
  if (segments.length < 2) {
    return false;
  }
  const tld = segments.at(-1)?.toLowerCase() ?? "";
  return TLD_COURANTS.has(tld);
}

/**
 * Normalise une saisie pour l'affichage et la comparaison.
 *
 * Espaces normalisés, casse basse. Aucun accent n'est retiré : c'est un choix
 * conscient, voir l'en-tête du module.
 */
export function normalizeSearchText(query: string): string {
  return query.trim().replace(/\s+/gu, " ").toLowerCase();
}

/**
 * Extrait l'URL d'une saisie qui en est une, ou `null`.
 *
 * Une saisie sans schéma reçoit `https://` : c'est le schéma par défaut du
 * web, et l'utilisateur n'a pas à l'écrire.
 */
export function extractUrl(query: string): string | null {
  const texte = query.trim();
  if (!texte) {
    return null;
  }
  if (!looksLikeUrl(texte)) {
    return null;
  }
  const avecScheme = /^https?:\/\//iu.test(texte) ? texte : `https://${texte}`;
  try {
    const url = new URL(avecScheme);
    // Une URL sans nom d'hôte n'est pas une URL : « https:// » seul ne
    // désigne rien.
    if (!url.hostname) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}
