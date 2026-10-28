import type { Hono } from "npm:hono@4";
import { clientIp, rateLimitShared } from "./config.ts";
import {
  clampWebSearchCount,
  normalizeWebSearchQuery,
  WEB_SEARCH_MAX_PROVIDER_ATTEMPTS,
  webSearchBudget,
} from "./web-search-limits.ts";

export interface YouSearchHit {
  description?: string;
  page_age?: string;
  snippets?: string[];
  title?: string;
  url?: string;
}

export interface YouSearchResponse {
  hits?: YouSearchHit[];
  results?: Array<{
    title: string;
    url: string;
    description: string;
    snippets?: string[];
  }>;
}

/**
 * Récupère les clés You.com configurées pour le triple fallback.
 */
function getYouApiKeys(): string[] {
  const keys: string[] = [];
  const getEnv = (name: string): string | undefined => {
    if (typeof Deno !== "undefined" && Deno.env) {
      return Deno.env.get(name);
    }
    if (typeof process !== "undefined" && process.env) {
      return process.env[name];
    }
  };

  const candidateKeys = [
    getEnv("YOU_API_KEY"),
    getEnv("YOU_API_KEY_1"),
    getEnv("YOU_API_KEY_2"),
    getEnv("YOU_API_KEY_3"),
    getEnv("YDC_API_KEY"),
  ];

  for (const k of candidateKeys) {
    if (k?.trim() && !keys.includes(k.trim())) {
      keys.push(k.trim());
    }
  }

  return keys;
}

/**
 * Fallback Web Universel (Google News RSS, Bing News RSS, Wikipedia & DDG)
 */
async function fallbackWebSearch(
  query: string,
  count = 5
): Promise<Array<{ title: string; url: string; snippet: string }>> {
  const results: Array<{ title: string; url: string; snippet: string }> = [];

  // 1. Essai Google News RSS (Ultra-rapide, mondial, temps réel, aucune clé requise)
  try {
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(
      query
    )}&hl=fr&gl=FR&ceid=FR:fr`;
    const res = await fetch(rssUrl, {
      headers: {
        Accept: "application/rss+xml, text/xml, */*",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
      // Une source lente ne doit pas retenir la requête ni les suivantes.
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const xml = await res.text();
      const items = xml.split("<item>");
      for (let i = 1; i < items.length && results.length < count; i++) {
        const block = items[i].split("</item>")[0];
        const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/i);
        const linkMatch =
          block.match(/<link>([\s\S]*?)<\/link>/i) ||
          block.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i);
        const descMatch = block.match(
          /<description>([\s\S]*?)<\/description>/i
        );

        const title = titleMatch
          ? titleMatch[1]
              .replace(/<!\[CDATA\[(.*?)\]\]>/gi, "$1")
              .replace(/<[^>]+>/g, "")
              .trim()
          : "";
        const link = linkMatch
          ? linkMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/gi, "$1").trim()
          : "";
        const snippet = descMatch
          ? descMatch[1]
              .replace(/<!\[CDATA\[(.*?)\]\]>/gi, "$1")
              .replace(/<[^>]+>/g, "")
              .trim()
          : title;

        if (title && link) {
          results.push({
            snippet: snippet || title,
            title,
            url: link,
          });
        }
      }

      if (results.length > 0) return results;
    }
  } catch (err) {
    console.warn("[WebSearch] Fallback Google News RSS failed:", err);
  }

  // 2. Essai Bing News RSS (Fallback de secours)
  try {
    const bingRssUrl = `https://www.bing.com/news/search?q=${encodeURIComponent(query)}&format=rss`;
    const res = await fetch(bingRssUrl, {
      headers: {
        Accept: "application/rss+xml, text/xml, */*",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const xml = await res.text();
      const items = xml.split("<item>");
      for (let i = 1; i < items.length && results.length < count; i++) {
        const block = items[i].split("</item>")[0];
        const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/i);
        const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/i);
        const descMatch = block.match(
          /<description>([\s\S]*?)<\/description>/i
        );

        const title = titleMatch
          ? titleMatch[1].replace(/<[^>]+>/g, "").trim()
          : "";
        const link = linkMatch ? linkMatch[1].trim() : "";
        const snippet = descMatch
          ? descMatch[1].replace(/<[^>]+>/g, "").trim()
          : title;

        if (title && link) {
          results.push({
            snippet: snippet || title,
            title,
            url: link,
          });
        }
      }

      if (results.length > 0) return results;
    }
  } catch (err) {
    console.warn("[WebSearch] Fallback Bing RSS failed:", err);
  }

  // 3. Essai Wikipedia API
  try {
    const lang = /[éèàùçâêîôû]/i.test(query) ? "fr" : "en";
    const wikiUrl = `https://${lang}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(
      query
    )}&limit=${count}&namespace=0&format=json`;
    const res = await fetch(wikiUrl, {
      headers: {
        "User-Agent":
          "mAI-WebSearch-Agent/1.0 (https://m-ai.fr; contact@m-ai.fr)",
      },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      const titles = data[1] || [];
      const descriptions = data[2] || [];
      const urls = data[3] || [];
      for (let i = 0; i < titles.length && results.length < count; i++) {
        if (urls[i]) {
          results.push({
            snippet: descriptions[i] || `Article Wikipedia sur ${titles[i]}`,
            title: titles[i],
            url: urls[i],
          });
        }
      }
      if (results.length > 0) return results;
    }
  } catch (err) {
    console.warn("[WebSearch] Fallback Wikipedia failed:", err);
  }

  return results;
}

/**
 * Exécute une recherche Web via l'API You.com avec triple fallback automatique et fallback multi-sources.
 *
 * La concurrence est bornée par isolate : un pic d'appels anonymes ne peut pas
 * ouvrir un nombre illimité de requêtes fournisseur simultanées.
 */
type WebSearchResult = {
  success: boolean;
  query: string;
  results: Array<{ title: string; url: string; snippet: string }>;
  provider: string;
  error?: string;
};

const MAX_CONCURRENT_WEB_SEARCHES = 6;
let inFlightWebSearches = 0;

export async function executeWebSearch(
  query: string,
  count = 5
): Promise<WebSearchResult> {
  const trimmedQuery = normalizeWebSearchQuery(query);
  if (!trimmedQuery) {
    return {
      error:
        typeof query === "string" && query.trim().length > 500
          ? "La requête de recherche dépasse 500 caractères."
          : "La requête de recherche est vide.",
      provider: "you.com",
      query: typeof query === "string" ? query.slice(0, 500) : "",
      results: [],
      success: false,
    };
  }

  if (inFlightWebSearches >= MAX_CONCURRENT_WEB_SEARCHES) {
    return {
      error:
        "Trop de recherches simultanées. Réessayez dans quelques instants.",
      provider: "you.com",
      query: trimmedQuery,
      results: [],
      success: false,
    };
  }

  inFlightWebSearches += 1;
  try {
    return await runWebSearch(trimmedQuery, clampWebSearchCount(count));
  } finally {
    inFlightWebSearches -= 1;
  }
}

async function runWebSearch(
  trimmedQuery: string,
  count: number
): Promise<WebSearchResult> {
  const keys = getYouApiKeys();
  let lastError: any = null;
  let providerAttempts = 0;

  // 1. Tentative avec les clés You.com (POST https://ydc-index.io/v1/search conforme à l'API You.com)
  if (keys.length > 0) {
    const endpoints = [
      "https://ydc-index.io/v1/search",
      "https://api.ydc-index.io/v1/search",
      "https://api.ydc-index.io/search",
    ];

    for (const key of keys) {
      for (const endpointUrl of endpoints) {
        // Un appel ne peut pas multiplier indéfiniment les tentatives
        // fournisseur (clés × points d'entrée) : quatre au maximum.
        if (providerAttempts >= WEB_SEARCH_MAX_PROVIDER_ATTEMPTS) {
          break;
        }
        providerAttempts += 1;
        try {
          const res = await fetch(endpointUrl, {
            body: JSON.stringify({
              count,
              query: trimmedQuery,
            }),
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              "User-Agent": "mAI-WebSearch/1.0",
              "X-API-Key": key,
            },
            method: "POST",
            signal: AbortSignal.timeout(6000),
          });

          if (res.ok) {
            const data: any = await res.json().catch(() => null);
            if (data) {
              // Support complet des structures You.com v1 :
              // 1. data.results.web & data.results.news (Format officiel v1)
              // 2. data.results (Array direct)
              // 3. data.hits / data.web.results
              let rawHits: any[] = [];
              if (data.results && typeof data.results === "object") {
                if (Array.isArray(data.results)) {
                  rawHits = data.results;
                } else {
                  if (Array.isArray(data.results.web)) {
                    rawHits.push(...data.results.web);
                  }
                  if (Array.isArray(data.results.news)) {
                    rawHits.push(...data.results.news);
                  }
                }
              } else if (Array.isArray(data.hits)) {
                rawHits = data.hits;
              } else if (Array.isArray(data.web?.results)) {
                rawHits = data.web.results;
              }

              const formattedResults = rawHits
                .map((hit: any) => {
                  let snippet = "";
                  if (hit.contents?.markdown) {
                    snippet = hit.contents.markdown.slice(0, 300);
                  } else if (
                    hit.snippets &&
                    Array.isArray(hit.snippets) &&
                    hit.snippets.length > 0
                  ) {
                    snippet = hit.snippets.join(" ... ");
                  } else {
                    snippet = hit.description || hit.snippet || hit.text || "";
                  }

                  return {
                    snippet: snippet.trim(),
                    title: hit.title || hit.name || "Sans titre",
                    url: hit.url || hit.link || "",
                  };
                })
                .filter((item: any) => item.title && item.url);

              if (formattedResults.length > 0) {
                return {
                  provider: "you.com",
                  query: trimmedQuery,
                  results: formattedResults,
                  success: true,
                };
              }
            }
          }

          const status = res.status;
          const errBody = await res.text().catch(() => "");
          lastError = new Error(`HTTP ${status}: ${errBody}`);
        } catch (err: any) {
          lastError = err;
        }
      }
    }
  }

  // 2. Fallback automatique multi-moteurs (DDG Lite / Instant / Wikipedia)
  const fallbackResults = await fallbackWebSearch(trimmedQuery, count);
  if (fallbackResults.length > 0) {
    return {
      provider: "duckduckgo (fallback)",
      query: trimmedQuery,
      results: fallbackResults,
      success: true,
    };
  }

  return {
    error:
      keys.length === 0
        ? "Aucune clé You.com configurée et les services de fallback sont temporairement inaccessibles."
        : `Échec de la recherche (${lastError?.message || "Erreur"}).`,
    provider: "you.com",
    query: trimmedQuery,
    results: [],
    success: false,
  };
}

/**
 * Définition standard de l'outil web_search pour les IA compatibles Tool Calling.
 */
export const WEB_SEARCH_TOOL = {
  function: {
    description:
      "Recherche sur le Web des informations récentes et actualisées en temps réel via You.com.",
    name: "web_search",
    parameters: {
      properties: {
        query: {
          description: "La requête de recherche textuelle complète et précise.",
          type: "string",
        },
      },
      required: ["query"],
      type: "object",
    },
  },
  type: "function" as const,
};

/**
 * Vérifie si la recherche web doit être activée ou désactivée sur un appel API.
 */
export function isWebSearchEnabled(body: any, reqHeaders?: Headers): boolean {
  if (body && (body.web_search === false || body.enable_web_search === false)) {
    return false;
  }
  if (reqHeaders) {
    const headerVal =
      reqHeaders.get("x-web-search") || reqHeaders.get("X-Web-Search");
    if (headerVal && headerVal.toLowerCase() === "false") {
      return false;
    }
    const disableHeader =
      reqHeaders.get("x-disable-web-search") ||
      reqHeaders.get("X-Disable-Web-Search");
    if (
      disableHeader &&
      (disableHeader.toLowerCase() === "true" || disableHeader === "1")
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Enregistrement des routes de recherche Web dans Hono.
 */
export function registerWebRoutes(app: Hono) {
  // La route est publique (catalogue `requiresAuth: false`), mais une requête
  // anonyme ne doit jamais engager sans borne les clés You.com de la
  // plateforme : budget partagé par IP ou par compte, taille de requête et
  // nombre de résultats bornés. Le CORS ne protège rien ici (appel direct
  // possible), la décision est prise dans le handler.
  async function enforceSearchBudget(c: any): Promise<{
    allowed: boolean;
    retryAfterSec: number;
  }> {
    const userId = (c as any).get?.("userId") as string | null;
    const budget = webSearchBudget({ ip: clientIp(c), userId });
    const allowed = await rateLimitShared(
      budget.key,
      budget.limit,
      budget.windowMs
    );
    return {
      allowed,
      retryAfterSec: Math.ceil(budget.windowMs / 1000),
    };
  }

  function bodyTooLarge(c: any): boolean {
    const length = Number(c.req.header("content-length") || 0);
    return Number.isFinite(length) && length > 16_384;
  }

  function rateLimitResponse(c: any, retryAfterSec: number) {
    c.header("Retry-After", String(retryAfterSec));
    return c.json(
      {
        error: `Trop de recherches. Réessayez dans ${retryAfterSec} secondes.`,
      },
      429
    );
  }

  // POST /v1/web/search
  app.post("/v1/web/search", async (c) => {
    try {
      if (bodyTooLarge(c)) {
        return c.json({ error: "Corps de requête trop volumineux." }, 413);
      }
      const budget = await enforceSearchBudget(c);
      if (!budget.allowed) {
        return rateLimitResponse(c, budget.retryAfterSec);
      }

      const body = await c.req.json().catch(() => ({}));
      const query = normalizeWebSearchQuery(body.query || body.q);
      const count = clampWebSearchCount(body.count);

      if (!query) {
        return c.json(
          {
            error:
              "Le paramètre 'query' est obligatoire et limité à 500 caractères.",
          },
          400
        );
      }

      const searchResult = await executeWebSearch(query, count);
      return c.json(searchResult, 200);
    } catch (err: any) {
      return c.json(
        {
          details: err?.message,
          error: "Erreur serveur lors de la recherche Web.",
        },
        500
      );
    }
  });

  // GET /v1/web/search
  app.get("/v1/web/search", async (c) => {
    try {
      const budget = await enforceSearchBudget(c);
      if (!budget.allowed) {
        return rateLimitResponse(c, budget.retryAfterSec);
      }

      const query = normalizeWebSearchQuery(
        c.req.query("q") || c.req.query("query")
      );
      const count = clampWebSearchCount(c.req.query("count"));

      if (!query) {
        return c.json(
          {
            error:
              "Paramètre 'q' ou 'query' manquant, ou supérieur à 500 caractères.",
          },
          400
        );
      }

      const searchResult = await executeWebSearch(query, count);
      return c.json(searchResult, 200);
    } catch (err: any) {
      return c.json(
        {
          details: err?.message,
          error: "Erreur serveur lors de la recherche Web.",
        },
        500
      );
    }
  });
}
