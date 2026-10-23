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

// `cli` n'est pas une application web : c'est une entrée du « Menu favori »
// qui ouvre le terminal local de l'application de bureau. Elle vit donc dans
// le catalogue (clé persistée) sans entrer dans APP_ORDER (menu du logo).
export const APP_KEYS = [
  "mai",
  "site",
  "vibe",
  "code",
  "blackline",
  "cli",
] as const;
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
  /**
   * Préfixes d'URL supplémentaires appartenant à la même application.
   * Sert aux alias produits : `/code` est réécrit vers `/coder` par
   * next.config.ts et RESTE VISIBLE dans l'URL (une rewrite, pas une
   * redirection) — sans ces alias, l'application courante serait prise pour
   * mAI sur cette page.
   */
  pathAliases?: string[];
};

export const APP_CATALOG: Record<AppKey, AppCatalogEntry> = {
  blackline: {
    description: "Détendez-vous en attendant votre agent !",
    key: "blackline",
    label: "Blackline",
    // Jeu 3D embarqué : la page hôte monte le bundle statique du jeu.
    path: "/blackline",
    pathPrefix: "/blackline",
  },
  cli: {
    description: "mAI dans un terminal local (application de bureau)",
    key: "cli",
    label: "CLI",
    // Aucune route web : la redirection post-login ouvre le terminal puis
    // retombe sur mAI si la fonction n'est pas disponible.
    path: "/",
    pathPrefix: "/",
  },
  code: {
    description: "L'outil de codage pour IA",
    key: "code",
    label: "Coder",
    // La route réelle est /coder ; l'alias /code est réécrit par
    // next.config.ts. Le menu pointe vers la route canonique.
    path: "/coder",
    pathAliases: ["/code"],
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
  APP_CATALOG.blackline,
];

/**
 * Entrée du menu des applications.
 *
 * Le menu n'affiche pas que des applications web : le CLI s'y glisse entre
 * Coder et Blackline. Modéliser ce cas ici, plutôt que dans chaque composant
 * qui rend le menu, évite que les trois rendus (le sélecteur commun, le logo
 * de la barre latérale et le nom « mAI ») divergent.
 */
export type AppMenuEntry =
  | { entry: AppCatalogEntry; kind: "app" }
  | { kind: "cli" };

/**
 * Ordre d'affichage du MENU des applications : mAI, Site, Vibe, Coder, CLI,
 * Blackline.
 *
 * Le CLI est une entrée de menu, pas une application web : il ouvre le
 * terminal local de l'application de bureau, et il n'a pas de route.
 *
 * Blackline passe APRÈS lui. Le jeu est une distraction — c'est exactement ce
 * pour quoi il a été retiré de la liste de navigation de la barre latérale,
 * où il était redondant avec le menu des applications.
 */
export const APP_MENU_ORDER: AppMenuEntry[] = [
  { entry: APP_CATALOG.mai, kind: "app" },
  { entry: APP_CATALOG.site, kind: "app" },
  { entry: APP_CATALOG.vibe, kind: "app" },
  { entry: APP_CATALOG.code, kind: "app" },
  { kind: "cli" },
  { entry: APP_CATALOG.blackline, kind: "app" },
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
  const candidates = prefixed
    .flatMap((entry) =>
      [entry.pathPrefix, ...(entry.pathAliases ?? [])].map((prefix) => ({
        entry,
        prefix,
      }))
    )
    .filter(({ prefix }) => pathname.startsWith(prefix))
    .sort((a, b) => b.prefix.length - a.prefix.length);
  return candidates[0]?.entry.key ?? DEFAULT_APP_KEY;
}

/** Clé de cache localStorage du « menu favori » (miroir de la base). */
export const FAVORITE_APP_STORAGE_KEY = "mai.favorite-app";
