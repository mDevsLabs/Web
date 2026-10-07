// Catalogue des applications de la suite mAI.
//
// Pourquoi ce module : le menu du logo, la barre latérale, le réglage
// « Menu favori » des paramètres et la redirection post-login décrivent tous
// les quatre mêmes applications. Sans source unique, chaque écran réécrivait
// ses chemins et ses libellés, et un renommage ferait diverger l'affichage de
// la préférence persistée.
//
// Client-safe volontairement : ce module est importé par des composants
// « use client » (menu du logo, paramètres, login) comme par des tests
// unitaires. Aucun import server-only ici — la logique est pure, les chemins
// sont des constantes statiques.

export const APP_KEYS = ["mai", "site", "vibe", "code"] as const;
export type AppKey = (typeof APP_KEYS)[number];

export type AppCatalogEntry = {
  key: AppKey;
  /** Nom affiché dans le menu du logo et le réglage des paramètres. */
  label: string;
  /** Description affichée sous le nom, comme dans le menu du logo. */
  description: string;
  /** Chemin d'entrée de l'application dans l'hôte Next. */
  path: string;
  /** Préfixe d'URL qui identifie l'application dans location.pathname. */
  pathPrefix: string;
};

export const APP_CATALOG: Record<AppKey, AppCatalogEntry> = {
  code: {
    description: "L'outil de codage pour IA",
    key: "code",
    label: "Coder",
    // La route réelle est /coder ; l'alias /code est couvert par une
    // redirection next.config.ts. Le menu pointe vers la route canonique.
    path: "/coder",
    pathPrefix: "/coder",
  },
  mai: {
    description: "L'application de conversations et travail",
    key: "mai",
    label: "mAI",
    path: "/",
    pathPrefix: "/",
  },
  site: {
    description: "Site web d'mAI avec la plateforme mAI et modèles",
    key: "site",
    label: "Site",
    path: "/site",
    pathPrefix: "/site",
  },
  vibe: {
    description: "Votre plateforme de divertissement",
    key: "vibe",
    label: "Vibe",
    path: "/vibe",
    pathPrefix: "/vibe",
  },
};

/** Ordre d'affichage canonique (menu du logo, réglage, redirection). */
export const APP_ORDER: AppCatalogEntry[] = [
  APP_CATALOG.mai,
  APP_CATALOG.site,
  APP_CATALOG.vibe,
  APP_CATALOG.code,
];

// Fail-safe maison : un tier illisible vaut « free » — une préférence d'app
// illisible vaut « mAI ». Jamais de valeur inconnue persistée puis rejouée.
export const DEFAULT_APP_KEY: AppKey = "mai";

export function isAppKey(value: unknown): value is AppKey {
  return (
    typeof value === "string" && (APP_KEYS as readonly string[]).includes(value)
  );
}

export function normalizeAppKey(value: unknown): AppKey {
  if (value === "coder") {
    return "code";
  }
  return isAppKey(value) ? value : DEFAULT_APP_KEY;
}

/** Chemin d'entrée de l'application favorite, préfixe base path compris. */
export function favoriteAppToPath(key: unknown): string {
  const entry = APP_CATALOG[normalizeAppKey(key)];
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return `${base}${entry.path}`;
}

/**
 * Application identifiée par un chemin d'URL. Le plus long préfixe gagne :
 * /site/… et /vibe/… sont sans ambiguïté, tout le reste (/, /chat/…,
 * /settings…) appartient à mAI.
 */
export function appKeyFromPath(pathname: string | null | undefined): AppKey {
  if (!pathname) {
    return DEFAULT_APP_KEY;
  }
  const prefixed = APP_ORDER.filter((entry) => entry.pathPrefix !== "/");
  const match = prefixed
    .filter((entry) => pathname.startsWith(entry.pathPrefix))
    .sort((a, b) => b.pathPrefix.length - a.pathPrefix.length)[0];
  return match?.key ?? DEFAULT_APP_KEY;
}

/** Clé de cache localStorage du « menu favori » (miroir de la base). */
export const FAVORITE_APP_STORAGE_KEY = "mai.favorite-app";
