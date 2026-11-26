/**
 * Types et libellés du moteur de recherche.
 *
 * Module sans dépendance Node : il est importé par les composants clients
 * (palette de recherche, barres par page) tandis que l'index lui-même vit
 * dans `lib/search-index.ts` (serveur uniquement).
 */

export type SearchType =
  | "page"
  | "news"
  | "model"
  | "project"
  | "download"
  | "changelog";

export type SearchEntry = {
  type: SearchType;
  title: string;
  description: string;
  href: string;
  /** Libellé secondaire affiché dans les résultats (catégorie, version…). */
  meta?: string;
  /** Extrait de contenu, non renvoyé par l'API. */
  content?: string;
  score?: number;
};

export const SEARCH_TYPE_LABELS: Record<SearchType, string> = {
  changelog: "Notes de version",
  download: "Téléchargements",
  model: "Modèles",
  news: "Actualités",
  page: "Pages",
  project: "Projets",
};

/** Ordre d'affichage des groupes de résultats. */
export const SEARCH_TYPE_ORDER: SearchType[] = [
  "page",
  "model",
  "news",
  "project",
  "download",
  "changelog",
];
