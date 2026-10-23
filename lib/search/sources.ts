// Les sources de recherche de mAI Search — le vocabulaire que partagent
// le moteur, la route API et l'interface des paramètres.
//
// NE PAS CONFONDRE avec `lib/search/types.ts`, qui porte le même nom de
// constante pour l'index de recherche INTERNE (16 clés: `chat`, `message`,
// `skill`…). Ce sont deux vocabulaires disjoints: celui-ci décrit ce que
// mAI Search va chercher SUR LE WEB, l'autre ce que la recherche du compte
// va chercher DANS le compte.
//
// Client-safe: aucun import serveur ici. Le module est lu par des
// composants « use client» (paramètres) et par des routes.

import { getTierSearchResultsMax } from "@/lib/plans/tier-limits";

/**
 * Sources activables par l'utilisateur.
 *
 * `wikipedia` est une source de plein droit depuis qu'elle a été ajoutée:
 * les articles trouvés sont des résultats à part entière, distingués par
 * leur origine, pas un repli silencieux quand le moteur principal échoue.
 */
export const MAI_SEARCH_SOURCE_KEYS = [
  "images",
  "news",
  "videos",
  "web",
  "wikipedia",
] as const;

export type MaiSearchSourceKey = (typeof MAI_SEARCH_SOURCE_KEYS)[number];

export function isMaiSearchSourceKey(
  value: unknown
): value is MaiSearchSourceKey {
  return (
    typeof value === "string" &&
    (MAI_SEARCH_SOURCE_KEYS as readonly string[]).includes(value)
  );
}

/**
 * Normalisation fail-safe d'une liste de sources.
 *
 * Une liste VIDE ne veut pas dire « ne rien chercher»: elle signifie
 * « la valeur est illisible». Le repli est donc TOUTES les sources — sinon
 * une préférence corrompue ferait que mAI Search ne plus rien remonter, et
 * l'utilisateur n'aurait aucun moyen de s'en apercevoir.
 */
export function normalizeMaiSearchSources(
  value: unknown
): MaiSearchSourceKey[] {
  if (!Array.isArray(value)) {
    return [...MAI_SEARCH_SOURCE_KEYS];
  }
  const valides = value.filter(isMaiSearchSourceKey);
  const uniques = Array.from(new Set(valides)) as MaiSearchSourceKey[];
  return uniques.length > 0 ? uniques : [...MAI_SEARCH_SOURCE_KEYS];
}

/** Libellés affichés dans les paramètres. */
export const MAI_SEARCH_SOURCE_LABELS: Record<MaiSearchSourceKey, string> = {
  images: "Images",
  news: "Actualités",
  videos: "Vidéos",
  web: "Web",
  wikipedia: "Wikipédia",
};

/**
 * Description d'une source, affichée sous les réglages.
 *
 * Wikipédia n'a pas besoin d'être présentée comme les autres: c'est une
 * encyclopédie, pas un moteur de recherche, et l'utilisateur doit comprendre
 * ce qu'il obtient — des ARTICLES DE RÉFÉRENCE, pas des pages qui en
 * parlent.
 */
export const MAI_SEARCH_SOURCE_DESCRIPTIONS: Record<
  MaiSearchSourceKey,
  string
> = {
  images: "Illustrations et photographies trouvées sur le Web.",
  news: "Actualités récentes, issues du flux Google News.",
  videos: "Vidéos publiées sur les principales plateformes.",
  web: "Pages web indexées par le moteur de recherche principal.",
  wikipedia:
    "Articles de l'encyclopédie: une source de référence, signalée par un badge et utilisée par la synthèse.",
};

/**
 * Langues de recherche acceptées.
 *
 * `fr` par défaut: l'interface est monolingue français, et les replis
 * existants (`you-client.ts`) choisissent déjà `fr`/`en` par détection.
 */
export const MAI_SEARCH_LANGUAGES = ["fr", "en", "de", "es", "it"] as const;

export type MaiSearchLanguage = (typeof MAI_SEARCH_LANGUAGES)[number];

export const MAI_SEARCH_LANGUAGE_LABELS: Record<MaiSearchLanguage, string> = {
  de: "Allemand",
  en: "Anglais",
  es: "Espagnol",
  fr: "Français",
  it: "Italien",
};

export function isMaiSearchLanguage(
  value: unknown
): value is MaiSearchLanguage {
  return (
    typeof value === "string" &&
    (MAI_SEARCH_LANGUAGES as readonly string[]).includes(value)
  );
}

/** Une langue illisible vaut « français» — jamais « undefined». */
export function normalizeMaiSearchLanguage(value: unknown): MaiSearchLanguage {
  return isMaiSearchLanguage(value) ? value : "fr";
}

/**
 * Niveaux de filtrage de sécurité.
 *
 * Les mêmes trois niveaux que le filtre de contenu de Vibe
 * (`content_filter_level`: low / medium / strict): c'est le vocabulaire
 * que l'utilisateur connaît déjà, et il n'y a pas de raison d'en inventer
 * un second.
 */
export const MAI_SEARCH_SAFETY_LEVELS = ["low", "medium", "strict"] as const;

export type MaiSearchSafetyLevel = (typeof MAI_SEARCH_SAFETY_LEVELS)[number];

export const MAI_SEARCH_SAFETY_LABELS: Record<MaiSearchSafetyLevel, string> = {
  low: "Aucun",
  medium: "Modéré",
  strict: "Strict",
};

export function isMaiSearchSafetyLevel(
  value: unknown
): value is MaiSearchSafetyLevel {
  return (
    typeof value === "string" &&
    (MAI_SEARCH_SAFETY_LEVELS as readonly string[]).includes(value)
  );
}

/** Un niveau illisible vaut « modéré»: le filet de sécurité par défaut. */
export function normalizeMaiSearchSafetyLevel(
  value: unknown
): MaiSearchSafetyLevel {
  return isMaiSearchSafetyLevel(value) ? value : "medium";
}

/**
 * Bornes du nombre de résultats renvoyés par une recherche, PAR SOURCE.
 *
 * La borne haute est celle du forfait le plus généreux (Max): c'est le
 * plafond ABSOLU du produit, au-delà duquel aucun compte ne peut monter.
 * Le plafond réel d'un compte est celui de SON forfait — voir
 * `getTierSearchResultsMax` (`lib/plans/tier-limits.ts`) et
 * `resolveMaiSearchResultCount` ci-dessous.
 *
 * La borne basse est à 1: une recherche d'une seule source est un usage
 * légitime (vérifier une URL, comparer deux prix), et refusée par le moteur
 * pour un simple motif de volume, elle ressemblerait à une panne.
 */
export const MAI_SEARCH_RESULT_COUNT_MIN = 1;
export const MAI_SEARCH_RESULT_COUNT_MAX = 200;
export const MAI_SEARCH_RESULT_COUNT_DEFAULT = 10;

/** Un nombre illisible ou hors bornes retombe sur la valeur par défaut. */
export function normalizeMaiSearchResultCount(value: unknown): number {
  const nombre = typeof value === "number" ? value : Number.NaN;
  if (!Number.isFinite(nombre)) {
    return MAI_SEARCH_RESULT_COUNT_DEFAULT;
  }
  const arrondi = Math.round(nombre);
  if (arrondi < MAI_SEARCH_RESULT_COUNT_MIN) {
    return MAI_SEARCH_RESULT_COUNT_MIN;
  }
  if (arrondi > MAI_SEARCH_RESULT_COUNT_MAX) {
    return MAI_SEARCH_RESULT_COUNT_MAX;
  }
  return arrondi;
}

/**
 * Nombre de résultats EFFECTIF d'une recherche.
 *
 * Trois bornes se superposent, et la plus stricte gagne:
 *
 * 1. la demande du client (le nombre tapé dans la requête);
 * 2. la préférence du compte (le réglage « Résultats par recherche»);
 * 3. le plafond du forfait.
 *
 * La préférence est un PLAFOND, pas une valeur: le client peut demander
 * moins (c'est ce qui rend l'onglet « Images» possible), jamais plus. Et le
 * plafond du forfait est fail-safe: un tier illisible vaut « Free», donc la
 * limite se réduit au lieu de s'étendre.
 */
export function resolveMaiSearchResultCount(params: {
  /** Nombre demandé par l'appelant. Absent = la préférence s'applique. */
  requested?: number | null;
  /** Préférence enregistrée du compte. */
  preferred?: number | null;
  /** Forfait du compte. Illisible ⇒ Free. */
  tier?: string | null;
}): number {
  const plafondForfait = getTierSearchResultsMax(params.tier);
  const prefere = normalizeMaiSearchResultCount(
    params.preferred ?? MAI_SEARCH_RESULT_COUNT_DEFAULT
  );
  // Sans demande explicite, c'est la PRÉFÉRENCE qui fait le volume: un
  // appelant qui ne dit rien obtient ce que le compte a réglé, pas la
  // valeur par défaut.
  const demande =
    params.requested === undefined || params.requested === null
      ? prefere
      : normalizeMaiSearchResultCount(params.requested);
  return Math.max(
    MAI_SEARCH_RESULT_COUNT_MIN,
    Math.min(demande, prefere, plafondForfait, MAI_SEARCH_RESULT_COUNT_MAX)
  );
}
