import "server-only";

export interface SearchWebHit {
  favicon_url?: string;
  page_age?: string;
  snippet: string;
  thumbnail_url?: string;
  title: string;
  url: string;
}

export interface SearchImageHit {
  image_url: string;
  page_url: string;
  thumbnail: string;
  title: string;
}

export interface SearchResponse {
  cached?: boolean;
  images: SearchImageHit[];
  provider: "you.com" | "fallback";
  query: string;
  results: SearchWebHit[];
  success: boolean;
}

// ─────────────────────────────────────────────
// Cache mémoire court (TTL = 5 minutes)
// ─────────────────────────────────────────────
interface CacheEntry {
  expiresAt: number;
  response: SearchResponse;
}

const SEARCH_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

function getFromCache(key: string): SearchResponse | null {
  const entry = SEARCH_CACHE.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    SEARCH_CACHE.delete(key);
    return null;
  }
  return { ...entry.response, cached: true };
}

function setInCache(key: string, response: SearchResponse) {
  // Limiter la taille du cache à 200 entrées max
  if (SEARCH_CACHE.size > 200) {
    const oldestKey = SEARCH_CACHE.keys().next().value;
    if (oldestKey) SEARCH_CACHE.delete(oldestKey);
  }
  SEARCH_CACHE.set(key, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    response,
  });
}

/**
 * Récupère les clés You.com disponibles dans l'environnement.
 */
export function getYouApiKeys(): string[] {
  const keys: string[] = [];
  const candidateKeys = [
    process.env.YOU_API_KEY_1,
    process.env.YOU_API_KEY_2,
    process.env.YOU_API_KEY_3,
    process.env.YOU_API_KEY,
    process.env.YDC_API_KEY,
  ];

  for (const k of candidateKeys) {
    const clean = k?.trim();
    if (clean && !keys.includes(clean)) {
      keys.push(clean);
    }
  }

  return keys;
}

// Pointeur pour rotation round-robin des clés
let currentKeyIndex = 0;

function getNextKey(keys: string[]): string {
  if (keys.length === 0) return "";
  const key = keys[currentKeyIndex % keys.length];
  currentKeyIndex = (currentKeyIndex + 1) % keys.length;
  return key;
}

/**
 * Recherche Web via You.com (ydc-index.io)
 */
async function fetchYouWeb(
  query: string,
  count = 10
): Promise<{ hits: SearchWebHit[]; images: SearchImageHit[] }> {
  const keys = getYouApiKeys();
  if (keys.length === 0) return { hits: [], images: [] };

  const endpoints = [
    "https://ydc-index.io/v1/search",
    "https://api.ydc-index.io/v1/search",
    "https://api.ydc-index.io/search",
  ];

  // Tentative sur les clés disponibles avec rotation
  for (const _attempt of keys) {
    const key = getNextKey(keys);
    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint, {
          body: JSON.stringify({ count, query }),
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "User-Agent": "mAI-Search/1.0",
            "X-API-Key": key,
          },
          method: "POST",
          signal: AbortSignal.timeout(4000),
        });

        if (res.ok) {
          const data: any = await res.json().catch(() => null);
          if (data) {
            const hits: SearchWebHit[] = [];
            const images: SearchImageHit[] = [];

            let rawHits: any[] = [];
            if (data.results && typeof data.results === "object") {
              if (Array.isArray(data.results)) {
                rawHits = data.results;
              } else {
                if (Array.isArray(data.results.web))
                  rawHits.push(...data.results.web);
                if (Array.isArray(data.results.news))
                  rawHits.push(...data.results.news);
              }
            } else if (Array.isArray(data.hits)) {
              rawHits = data.hits;
            } else if (Array.isArray(data.web?.results)) {
              rawHits = data.web.results;
            }

            for (const hit of rawHits) {
              let snippet = "";
              if (hit.contents?.markdown) {
                snippet = hit.contents.markdown.slice(0, 300);
              } else if (
                Array.isArray(hit.snippets) &&
                hit.snippets.length > 0
              ) {
                snippet = hit.snippets.join(" ... ");
              } else {
                snippet = hit.description || hit.snippet || hit.text || "";
              }

              const title = hit.title || hit.name || "";
              const url = hit.url || hit.link || "";

              if (title && url) {
                hits.push({
                  favicon_url:
                    hit.favicon_url ||
                    (url
                      ? `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`
                      : undefined),
                  page_age: hit.page_age,
                  snippet: snippet.trim(),
                  thumbnail_url: hit.thumbnail_url || hit.image_url,
                  title,
                  url,
                });
              }

              // Extraire les images/thumbnails s'il y en a
              if (hit.thumbnail_url || hit.image_url) {
                images.push({
                  image_url: hit.image_url || hit.thumbnail_url,
                  page_url: url,
                  thumbnail: hit.thumbnail_url || hit.image_url,
                  title: title || query,
                });
              }
            }

            if (hits.length > 0) {
              return { hits, images };
            }
          }
        }
      } catch {
        // En cas d'erreur ou timeout, tester le endpoint ou clé suivante
      }
    }
  }

  return { hits: [], images: [] };
}

/**
 * Recherche Images dédiée via You.com
 */
async function fetchYouImages(
  query: string,
  count = 12
): Promise<SearchImageHit[]> {
  const keys = getYouApiKeys();
  if (keys.length === 0) return [];

  for (const _attempt of keys) {
    const key = getNextKey(keys);
    try {
      const url = `https://api.you.com/v1/images?q=${encodeURIComponent(query)}&count=${count}`;
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "X-API-Key": key,
        },
        method: "GET",
        signal: AbortSignal.timeout(4000),
      });

      if (res.ok) {
        const data: any = await res.json().catch(() => null);
        const results = data?.images?.results || data?.results || [];
        if (Array.isArray(results) && results.length > 0) {
          return results
            .map((item: any) => ({
              image_url: item.image_url || item.thumbnail || "",
              page_url: item.page_url || "",
              thumbnail:
                item.thumbnail || item.large_thumbnail || item.image_url || "",
              title: item.title || query,
            }))
            .filter((img: SearchImageHit) => img.image_url);
        }
      }
    } catch {
      // Clé suivante
    }
  }

  return [];
}

/**
 * Fallback multi-sources (Google News RSS, Wikipedia, DuckDuckGo)
 */
async function fallbackSearch(query: string): Promise<SearchWebHit[]> {
  const results: SearchWebHit[] = [];

  // 1. Wikipedia
  try {
    const lang = /[éèàùçâêîôû]/i.test(query) ? "fr" : "en";
    const wikiUrl = `https://${lang}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=6&namespace=0&format=json`;
    const res = await fetch(wikiUrl, {
      headers: { "User-Agent": "mAI-Search-Fallback/1.0" },
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      const titles = data[1] || [];
      const descriptions = data[2] || [];
      const urls = data[3] || [];
      for (let i = 0; i < titles.length; i++) {
        if (urls[i]) {
          results.push({
            favicon_url: "https://wikipedia.org/static/favicon/wikipedia.ico",
            snippet: descriptions[i] || `Article Wikipedia sur ${titles[i]}`,
            title: titles[i],
            url: urls[i],
          });
        }
      }
    }
  } catch {
    // Continue
  }

  // 2. Google News RSS
  if (results.length < 5) {
    try {
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=fr&gl=FR&ceid=FR:fr`;
      const res = await fetch(rssUrl, {
        headers: {
          Accept: "application/rss+xml, text/xml, */*",
          "User-Agent": "Mozilla/5.0",
        },
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const xml = await res.text();
        const items = xml.split("<item>");
        for (let i = 1; i < items.length && results.length < 10; i++) {
          const block = items[i].split("</item>")[0];
          const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/i);
          const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/i);
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
              favicon_url: `https://www.google.com/s2/favicons?domain=${new URL(link).hostname}&sz=32`,
              snippet,
              title,
              url: link,
            });
          }
        }
      }
    } catch {
      // Continue
    }
  }

  return results;
}

/**
 * Exécute une recherche complète optimisée (Web + Images en parallèle)
 */
export async function executeMaiSearch(params: {
  count?: number;
  query: string;
  type?: "web" | "images" | "all";
}): Promise<SearchResponse> {
  const trimmed = params.query.trim();
  if (!trimmed) {
    return {
      images: [],
      provider: "you.com",
      query: "",
      results: [],
      success: false,
    };
  }

  const cacheKey = `${params.type || "all"}:${trimmed.toLowerCase()}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const count = params.count || 10;
  const wantImages = params.type === "images" || params.type === "all";
  const wantWeb = params.type === "web" || params.type === "all";

  // Appels parallèles pour réduire la latence au minimum
  const promises: [
    Promise<{ hits: SearchWebHit[]; images: SearchImageHit[] }>,
    Promise<SearchImageHit[]>,
  ] = [
    wantWeb
      ? fetchYouWeb(trimmed, count)
      : Promise.resolve({ hits: [], images: [] }),
    wantImages ? fetchYouImages(trimmed, 12) : Promise.resolve([]),
  ];

  const [webResult, imagesResult] = await Promise.allSettled(promises);

  const webData =
    webResult.status === "fulfilled"
      ? webResult.value
      : { hits: [], images: [] };
  const dedicatedImages =
    imagesResult.status === "fulfilled" ? imagesResult.value : [];

  let results = webData.hits;
  let allImages = [...dedicatedImages, ...webData.images];

  // Dédupliquer les images par image_url
  const seenImages = new Set<string>();
  allImages = allImages.filter((img) => {
    if (!img.image_url || seenImages.has(img.image_url)) return false;
    seenImages.add(img.image_url);
    return true;
  });

  let provider: "you.com" | "fallback" = "you.com";

  // Si You.com n'a renvoyé aucun résultat Web (ou pas de clé), repli automatique
  if (results.length === 0 && wantWeb) {
    results = await fallbackSearch(trimmed);
    provider = "fallback";
  }

  const response: SearchResponse = {
    images: allImages,
    provider,
    query: trimmed,
    results,
    success: results.length > 0 || allImages.length > 0,
  };

  if (response.success) {
    setInCache(cacheKey, response);
  }

  return response;
}
