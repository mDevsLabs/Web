import type { Hono } from "npm:hono@4";
import { clientIp, rateLimit } from "./config.ts";

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

const WEB_FETCH_TIMEOUT_MS = 8_000;
const MAX_WEB_RESPONSE_BYTES = 1_000_000;
const MAX_SEARCH_RESULTS = 10;
const MAX_SEARCH_QUERY_CHARS = 500;
const MAX_ERROR_CHARS = 300;

function webClientKey(c: any): string {
  try {
    return clientIp(c);
  } catch {
    return "unknown";
  }
}

function clampSearchCount(value: unknown, fallback = 5): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.min(MAX_SEARCH_RESULTS, Math.floor(parsed)));
}

function cleanText(value: unknown, maxChars: number): string {
  return String(value ?? "")
    // oxlint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxChars);
}

function cleanExternalUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (url.username || url.password) return null;
    return url.toString().slice(0, 2_048);
  } catch {
    return null;
  }
}

async function readResponseTextLimited(response: Response, maxBytes = MAX_WEB_RESPONSE_BYTES): Promise<string> {
  const contentLength = Number(response.headers?.get?.("content-length") || 0);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new Error("Réponse web trop volumineuse.");
  }
  if (!response.body) {
    if (typeof (response as any).arrayBuffer !== "function" && typeof (response as any).text === "function") {
      return String(await (response as any).text()).slice(0, maxBytes);
    }
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > maxBytes) throw new Error("Réponse web trop volumineuse.");
    return new TextDecoder().decode(buffer);
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      const chunk = next.value instanceof Uint8Array ? next.value : new Uint8Array(next.value);
      total += chunk.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => {});
        throw new Error("Réponse web trop volumineuse.");
      }
      chunks.push(chunk);
    }
  } finally {
    try { reader.releaseLock(); } catch {}
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

/** Fetch borné : une réponse non-OK est une erreur, jamais une donnée de fallback. */
async function requestText(
  input: string,
  init: RequestInit = {},
  maxBytes = MAX_WEB_RESPONSE_BYTES,
  timeoutMs = WEB_FETCH_TIMEOUT_MS
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.max(250, timeoutMs));
  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    const text = await readResponseTextLimited(response, maxBytes);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${cleanText(text, MAX_ERROR_CHARS)}`);
    }
    return text;
  } catch (err: any) {
    if (err?.name === "AbortError") throw new Error("Délai réseau dépassé.");
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeSearchResult(raw: any): { title: string; url: string; snippet: string } | null {
  const url = cleanExternalUrl(raw?.url || raw?.link);
  if (!url) return null;
  const title = cleanText(raw?.title || raw?.name || "Sans titre", 200);
  let snippet = raw?.description || raw?.snippet || raw?.text || "";
  if (raw?.contents?.markdown) snippet = raw.contents.markdown;
  else if (Array.isArray(raw?.snippets)) snippet = raw.snippets.join(" ... ");
  return { title, url, snippet: cleanText(snippet, 500) };
}

/**
 * Récupère les clés You.com configurées pour le triple fallback.
 */
function getYouApiKeys(): string[] {
  const keys: string[] = [];
  const getEnv = (name: string): string | undefined => {
    const runtimeDeno = (globalThis as any).Deno;
    if (runtimeDeno?.env) {
      return runtimeDeno.env.get(name);
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
    if (k && k.trim() && !keys.includes(k.trim())) {
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
  count = 5,
  timeoutMs = WEB_FETCH_TIMEOUT_MS
): Promise<Array<{ title: string; url: string; snippet: string }>> {
  const results: Array<{ title: string; url: string; snippet: string }> = [];

  // 1. Essai Google News RSS (Ultra-rapide, mondial, temps réel, aucune clé requise)
  try {
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=fr&gl=FR&ceid=FR:fr`;
    const xml = await requestText(rssUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "application/rss+xml, text/xml, */*",
      },
    }, MAX_WEB_RESPONSE_BYTES, timeoutMs);

    {
      const items = xml.split("<item>");
      for (let i = 1; i < items.length && results.length < count; i++) {
        const block = items[i].split("</item>")[0];
        const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/i);
        const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/i) || block.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i);
        const descMatch = block.match(/<description>([\s\S]*?)<\/description>/i);

        let title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/gi, "$1").replace(/<[^>]+>/g, "").trim() : "";
        let link = linkMatch ? linkMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/gi, "$1").trim() : "";
        let snippet = descMatch ? descMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/gi, "$1").replace(/<[^>]+>/g, "").trim() : title;
        const normalized = normalizeSearchResult({ title, url: link, snippet });
        if (normalized) results.push(normalized);
      }

      if (results.length > 0) return results;
    }
  } catch (err) {
    console.warn("[WebSearch] Fallback Google News RSS failed:", err);
  }

  // 2. Essai Bing News RSS (Fallback de secours)
  try {
    const bingRssUrl = `https://www.bing.com/news/search?q=${encodeURIComponent(query)}&format=rss`;
    const xml = await requestText(bingRssUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/rss+xml, text/xml, */*",
      },
    }, MAX_WEB_RESPONSE_BYTES, timeoutMs);

    {
      const items = xml.split("<item>");
      for (let i = 1; i < items.length && results.length < count; i++) {
        const block = items[i].split("</item>")[0];
        const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/i);
        const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/i);
        const descMatch = block.match(/<description>([\s\S]*?)<\/description>/i);

        const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : "";
        const link = linkMatch ? linkMatch[1].trim() : "";
        const snippet = descMatch ? descMatch[1].replace(/<[^>]+>/g, "").trim() : title;
        const normalized = normalizeSearchResult({ title, url: link, snippet });
        if (normalized) results.push(normalized);
      }

      if (results.length > 0) return results;
    }
  } catch (err) {
    console.warn("[WebSearch] Fallback Bing RSS failed:", err);
  }

  // 3. Essai Wikipedia API
  try {
    const lang = /[éèàùçâêîôû]/i.test(query) ? "fr" : "en";
    const wikiUrl = `https://${lang}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=${count}&namespace=0&format=json`;
    const wikiText = await requestText(wikiUrl, {
      headers: {
        "User-Agent": "mAI-WebSearch-Agent/1.0 (https://m-ai.fr; contact@m-ai.fr)",
      },
    }, MAX_WEB_RESPONSE_BYTES, timeoutMs);
    {
      const data = JSON.parse(wikiText);
      const titles = data[1] || [];
      const descriptions = data[2] || [];
      const urls = data[3] || [];
      for (let i = 0; i < titles.length && results.length < count; i++) {
        const normalized = normalizeSearchResult({
          title: titles[i],
          url: urls[i],
          snippet: descriptions[i] || `Article Wikipedia sur ${titles[i]}`,
        });
        if (normalized) results.push(normalized);
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
 */
export async function executeWebSearch(
  query: string,
  count = 5
): Promise<{
  success: boolean;
  query: string;
  results: Array<{ title: string; url: string; snippet: string }>;
  provider: string;
  error?: string;
}> {
  const rawQuery = typeof query === "string" ? query.trim() : "";
  const trimmedQuery = rawQuery.slice(0, MAX_SEARCH_QUERY_CHARS);
  const safeCount = clampSearchCount(count);
  const deadline = Date.now() + 15_000;
  const remaining = () => Math.max(250, deadline - Date.now());
  if (!trimmedQuery) {
    return {
      error: "La requête de recherche est vide.",
      provider: "you.com",
      query: "",
      results: [],
      success: false,
    };
  }
  if (rawQuery.length > MAX_SEARCH_QUERY_CHARS) {
    return {
      error: `La requête est trop longue (${MAX_SEARCH_QUERY_CHARS} caractères maximum).`,
      provider: "you.com",
      query: trimmedQuery,
      results: [],
      success: false,
    };
  }

  const keys = getYouApiKeys();
  let lastError: any = null;

  // 1. Tentative avec les clés You.com (POST https://ydc-index.io/v1/search conforme à l'API You.com)
  if (keys.length > 0) {
    const endpoints = [
      "https://ydc-index.io/v1/search",
      "https://api.ydc-index.io/v1/search",
      "https://api.ydc-index.io/search",
    ];

    for (let i = 0; i < keys.length; i++) {
      if (Date.now() >= deadline) break;
      const key = keys[i];

      for (const endpointUrl of endpoints) {
        if (Date.now() >= deadline) break;
        try {
          const responseText = await requestText(endpointUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-API-Key": key,
              "Accept": "application/json",
              "User-Agent": "mAI-WebSearch/1.0",
            },
            body: JSON.stringify({
              query: trimmedQuery,
              count: safeCount,
            }),
          }, MAX_WEB_RESPONSE_BYTES, remaining());
          const data: any = JSON.parse(responseText);
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
                if (Array.isArray(data.results.web)) rawHits.push(...data.results.web);
                if (Array.isArray(data.results.news)) rawHits.push(...data.results.news);
              }
            } else if (Array.isArray(data.hits)) {
              rawHits = data.hits;
            } else if (Array.isArray(data.web?.results)) {
              rawHits = data.web.results;
            }

            const formattedResults = rawHits
              .slice(0, safeCount)
              .map((hit: any) => normalizeSearchResult(hit))
              .filter((item: any): item is { title: string; url: string; snippet: string } => item !== null);

            if (formattedResults.length > 0) {
              return {
                provider: "you.com",
                query: trimmedQuery,
                results: formattedResults,
                success: true,
              };
            }
            lastError = new Error("Réponse You.com sans résultat exploitable.");
          } else {
            lastError = new Error("Réponse You.com vide.");
          }
        } catch (err: any) {
          lastError = err;
        }
      }
    }
  }

  // 2. Fallback automatique multi-moteurs (DDG Lite / Instant / Wikipedia)
  const fallbackResults = await fallbackWebSearch(trimmedQuery, safeCount, remaining());
  if (fallbackResults.length > 0) {
    return {
      provider: "duckduckgo (fallback)",
      query: trimmedQuery,
      results: fallbackResults,
      success: true,
    };
  }

  return {
    error: keys.length === 0
      ? "Aucune clé You.com configurée et les services de fallback sont temporairement inaccessibles."
      : `Échec de la recherche (${cleanText(lastError?.message || "Erreur", MAX_ERROR_CHARS)}).`,
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
          maxLength: MAX_SEARCH_QUERY_CHARS,
          minLength: 1,
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
  // POST /v1/web/search
  app.post("/v1/web/search", async (c: any) => {
    try {
      if (!rateLimit(`web-search:${webClientKey(c)}`, 30, 60_000)) {
        return c.json({ error: "Trop de recherches Web. Réessayez dans une minute." }, 429);
      }
      const body = await c.req.json().catch(() => ({}));
      const query = body?.query || body?.q;
      const count = typeof body?.count === "number" ? body.count : 5;

      if (!query || typeof query !== "string") {
        return c.json({ error: "Le paramètre 'query' est obligatoire." }, 400);
      }
      if (query.length > MAX_SEARCH_QUERY_CHARS) {
        return c.json({ error: `La requête est trop longue (${MAX_SEARCH_QUERY_CHARS} caractères maximum).` }, 400);
      }

      const searchResult = await executeWebSearch(query, count);
      return c.json(searchResult, searchResult.success ? 200 : 502);
    } catch (err: any) {
      console.error("[web] search route error:", err?.message || err);
      return c.json({ error: "Erreur serveur lors de la recherche Web." }, 500);
    }
  });

  // GET /v1/web/search
  app.get("/v1/web/search", async (c: any) => {
    try {
      if (!rateLimit(`web-search:${webClientKey(c)}`, 30, 60_000)) {
        return c.json({ error: "Trop de recherches Web. Réessayez dans une minute." }, 429);
      }
      const query = c.req.query("q") || c.req.query("query");
      const countParam = c.req.query("count");
      const count = countParam ? Number.parseInt(countParam, 10) : 5;

      if (!query) {
        return c.json({ error: "Paramètre 'q' ou 'query' manquant." }, 400);
      }
      if (query.length > MAX_SEARCH_QUERY_CHARS) {
        return c.json({ error: `La requête est trop longue (${MAX_SEARCH_QUERY_CHARS} caractères maximum).` }, 400);
      }

      const searchResult = await executeWebSearch(
        query,
        isNaN(count) ? 5 : count
      );
      return c.json(searchResult, searchResult.success ? 200 : 502);
    } catch (err: any) {
      console.error("[web] search route error:", err?.message || err);
      return c.json({ error: "Erreur serveur lors de la recherche Web." }, 500);
    }
  });
}

