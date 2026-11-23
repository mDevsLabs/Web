// Client commun des API publiques des plugins. Les outils construisent leurs
// URL depuis des domaines constants; ce garde-fou refuse tout autre hôte,
// toute redirection et toute réponse trop volumineuse.
import {
  type BoundedFetchFailureKind,
  type BoundedFetchOptions,
  boundedFetch,
  boundedFetchJson,
  DEFAULT_MAX_BYTES,
  DEFAULT_TIMEOUT_MS,
} from "./bounded-fetch";

export const PUBLIC_API_TIMEOUT_MS = DEFAULT_TIMEOUT_MS;
export const PUBLIC_API_MAX_BYTES = DEFAULT_MAX_BYTES;

/**
 * Un JSON-stat Eurostat complet et un catalogue de produits dépassent
 * facilement le mégoctet par défaut : ces connecteurs lèvent leur plafond,
 * les autres gardent celui du module partagé.
 */
export const PUBLIC_API_LARGE_MAX_BYTES = 4_000_000;

export type PublicApiResult<T> =
  | { data: T; ok: true; url: string }
  | { error: string; ok: false; url: string };

const ALLOWED_HOSTS = new Set([
  "api.github.com",
  "world.openfoodfacts.org",
  "search.openfoodfacts.org",
  "openlibrary.org",
  "api.crossref.org",
  "api.worldbank.org",
  "date.nager.at",
  "nagerholidays.com",
  "api.tvmaze.com",
  "www.wikidata.org",
  "gitlab.com",
  "ec.europa.eu",
  "api.openalex.org",
  "export.arxiv.org",
  "fr.wikipedia.org",
  "en.wikipedia.org",
  "es.wikipedia.org",
  "de.wikipedia.org",
  "it.wikipedia.org",
]);

function safeStatusMessage(status: number, retryAfterMs?: number): string {
  if (status === 400) {
    return "Requête rejetée par la source (HTTP 400) : vérifiez les identifiants ou les filtres.";
  }
  if (status === 401) {
    return "Authentification requise par la source (HTTP 401).";
  }
  if (status === 403) {
    return "Accès refusé par la source (HTTP 403) : ressource privée ou non exposée publiquement.";
  }
  if (status === 404) {
    return "Aucun résultat trouvé (HTTP 404).";
  }
  if (status === 422) {
    return "Paramètres refusés par la source (HTTP 422) : corrigez la requête.";
  }
  if (status === 429) {
    const retry =
      retryAfterMs === undefined
        ? ""
        : `; réessayez dans ${Math.ceil(retryAfterMs / 1000)} secondes`;
    return `Limite de requêtes atteinte (HTTP 429)${retry}.`;
  }
  if (status >= 500) {
    return `Service indisponible (HTTP ${status}).`;
  }
  return `Requête refusée (HTTP ${status}).`;
}

export function describeFailure(
  failure: {
    kind: BoundedFetchFailureKind | "json";
    status?: number;
    retryAfterMs?: number;
  },
  timeoutMs: number
): string {
  switch (failure.kind) {
    case "http":
      return safeStatusMessage(failure.status ?? 0, failure.retryAfterMs);
    case "too_large":
      return "Réponse trop volumineuse; résultat refusé.";
    case "body":
      return "Réponse vide ou illisible.";
    case "timeout":
      return `Délai dépassé (${Math.round(timeoutMs / 1000)}s).`;
    case "aborted":
      return "Requête annulée avant son terme.";
    case "redirect":
      return "Redirection de la source refusée.";
    case "json":
    case "network":
      return "Erreur réseau ou réponse JSON invalide.";
  }
}

export type PublicApiOptions = Pick<
  BoundedFetchOptions,
  "maxBytes" | "retries" | "signal" | "timeoutMs"
>;

function validatePublicUrl(
  rawUrl: string
): { ok: true; url: URL } | { error: string; ok: false } {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { error: "Adresse de source invalide.", ok: false };
  }
  if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.hostname)) {
    return { error: "Domaine de source non autorisé.", ok: false };
  }
  return { ok: true, url };
}

export async function fetchPublicJson<T>(
  rawUrl: string,
  headers: Record<string, string> = {},
  options: PublicApiOptions = {}
): Promise<PublicApiResult<T>> {
  const checked = validatePublicUrl(rawUrl);
  if (!checked.ok) {
    return { error: checked.error, ok: false, url: "" };
  }

  const timeoutMs = options.timeoutMs ?? PUBLIC_API_TIMEOUT_MS;
  const result = await boundedFetchJson<T>(checked.url, {
    ...options,
    headers,
    timeoutMs,
  });
  if (!result.ok) {
    return {
      error: describeFailure(result, timeoutMs),
      ok: false,
      url: checked.url.href,
    };
  }
  return { data: result.data, ok: true, url: checked.url.href };
}

export async function fetchPublicText(
  rawUrl: string,
  headers: Record<string, string> = {},
  options: PublicApiOptions = {}
): Promise<PublicApiResult<string>> {
  const checked = validatePublicUrl(rawUrl);
  if (!checked.ok) {
    return { error: checked.error, ok: false, url: "" };
  }

  const timeoutMs = options.timeoutMs ?? PUBLIC_API_TIMEOUT_MS;
  const result = await boundedFetch(checked.url, {
    ...options,
    headers: {
      Accept: "application/atom+xml, application/xml, text/plain",
      ...headers,
    },
    timeoutMs,
  });
  if (!result.ok) {
    return {
      error: describeFailure(result, timeoutMs),
      ok: false,
      url: checked.url.href,
    };
  }
  return {
    data: new TextDecoder("utf-8").decode(result.bytes),
    ok: true,
    url: checked.url.href,
  };
}

export function sourceRef(url: string, title: string) {
  return { title, url };
}

export function contactHeaders(appName: string): Record<string, string> {
  const email = process.env.PUBLIC_API_CONTACT_EMAIL?.trim();
  return email
    ? { "User-Agent": `${appName}/1.0 (${email})` }
    : { "User-Agent": `${appName}/1.0` };
}

export function truncateText(value: unknown, max = 2000): string | null {
  return typeof value === "string" ? value.slice(0, max) : null;
}
