/**
 * Bornes de la recherche Web publique, partagées par le backend Val Town et
 * testables sans réseau. Une requête anonyme ne doit jamais engager un nombre
 * illimité d'appels fournisseur ni une taille de requête arbitraire.
 */

export const WEB_SEARCH_DEFAULT_COUNT = 5;
export const WEB_SEARCH_MIN_COUNT = 1;
export const WEB_SEARCH_MAX_COUNT = 10;
export const WEB_SEARCH_MAX_QUERY_LENGTH = 500;
export const WEB_SEARCH_MAX_PROVIDER_ATTEMPTS = 4;

/** Ramène le count demandé dans [1, 10] ; une valeur illisible vaut 5. */
export function clampWebSearchCount(value: unknown): number {
  const parsed =
    typeof value === "number"
      ? value
      : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) {
    return WEB_SEARCH_DEFAULT_COUNT;
  }
  return Math.min(
    WEB_SEARCH_MAX_COUNT,
    Math.max(WEB_SEARCH_MIN_COUNT, Math.floor(parsed))
  );
}

/**
 * Normalise la requête : chaîne non vide, 500 caractères au plus. Renvoie null
 * si elle doit être refusée (vide, type inattendu, trop longue).
 */
export function normalizeWebSearchQuery(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > WEB_SEARCH_MAX_QUERY_LENGTH) {
    return null;
  }
  return trimmed;
}

export type WebSearchBudget = {
  key: string;
  limit: number;
  windowMs: number;
};

/**
 * Budget public / privé de la route `web/search`.
 * - anonyme : budget serré par adresse réseau (30/min, comme la route Site) ;
 * - authentifié : budget par compte, plus large mais toujours borné.
 */
export function webSearchBudget(params: {
  ip: string;
  userId?: string | null;
}): WebSearchBudget {
  if (params.userId) {
    return {
      key: `web-search:user:${params.userId}`,
      limit: 60,
      windowMs: 60_000,
    };
  }
  return {
    key: `web-search:ip:${params.ip || "unknown"}`,
    limit: 30,
    windowMs: 60_000,
  };
}
