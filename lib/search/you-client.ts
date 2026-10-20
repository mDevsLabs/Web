import "server-only";

import {
  type MaiSearchLanguage,
  type MaiSearchSafetyLevel,
  type MaiSearchSourceKey,
  normalizeMaiSearchLanguage,
  normalizeMaiSearchSafetyLevel,
  normalizeMaiSearchSources,
} from "./sources";
import {
  fetchWikipediaImages,
  searchWikipediaWithSummaries,
} from "./wikipedia";

export interface SearchWebHit {
  favicon_url?: string;
  /**
   * Le résultat est-il une page de DÉSAMBIGUÏSATION ?
   *
   * Une page de désambiguïsation est un index d'homonymes, pas un article :
   * elle est repoussée en fin de liste, et l'interface peut le signaler.
   */
  isDisambiguation?: boolean;
  /**
   * Origine du résultat.
   *
   * `wikipedia` distingue un article d'encyclopédie d'une page web
   * ordinaire : l'interface l'affiche avec un badge, et la synthèse cite
   * la source correcte.
   */
  origin?: SearchResultOrigin;
  page_age?: string;
  snippet: string;
  thumbnail_url?: string;
  title: string;
  url: string;
}

/** Origines possibles d'un résultat de recherche. */
export type SearchResultOrigin = "wikipedia" | "you.com";

/**
 * Favicon de l'encyclopédie.
 *
 * Constante partagée : le même chemin était écrit en dur à deux endroits
 * (repli historique et source à part entière), et une divergence afficherait
 * deux pastilles différentes pour la même source.
 */
export const WIKIPEDIA_FAVICON_URL =
  "https://wikipedia.org/static/favicon/wikipedia.ico";

export interface SearchImageHit {
  image_url: string;
  page_url: string;
  thumbnail: string;
  title: string;
}

export interface SearchNewsHit {
  favicon_url?: string;
  page_age?: string;
  snippet: string;
  source?: string;
  thumbnail_url?: string;
  title: string;
  url: string;
}

export interface SearchVideoHit {
  duration?: string;
  favicon_url?: string;
  page_url: string;
  platform?: string;
  thumbnail?: string;
  title: string;
}

export interface SearchResponse {
  cached?: boolean;
  images: SearchImageHit[];
  news: SearchNewsHit[];
  /**
   * Moteurs qui ont répondu.
   *
   * `mixed` quand plusieurs sources ont produit des résultats : c'est le
   * cas normal depuis que Wikipédia est une source à part entière. La
   * valeur reste une chaîne pour ne pas casser les consommateurs
   * existants, qui l'affichaient telle quelle.
   */
  provider: "fallback" | "mixed" | "wikipedia" | "you.com";
  query: string;
  results: SearchWebHit[];
  success: boolean;
  videos: SearchVideoHit[];
  /**
   * `true` quand la requête ressemble à une recherche factuelle et que les
   * articles d'encyclopédie sont remontés en tête de liste.
   */
  wikiFirst?: boolean;
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

// ─────────────────────────────────────────────
// Filtre de sécurité
// ─────────────────────────────────────────────
/**
 * Région et identifiant de flux du Google News RSS, par langue.
 *
 * Le flux se règle sur un couple région / langue : `hl=fr&gl=FR` et
 * `hl=en&gl=US` ne rendent pas les mêmes titres. Une recherche en anglais
 * sur un flux français perdait la moitié de ses résultats.
 */
const GOOGLE_NEWS_REGION: Record<MaiSearchLanguage, string> = {
  de: "DE",
  en: "US",
  es: "ES",
  fr: "FR",
  it: "IT",
};

const GOOGLE_NEWS_CEID: Record<MaiSearchLanguage, string> = {
  de: "DE:de",
  en: "US:en",
  es: "ES:es",
  fr: "FR:fr",
  it: "IT:it",
};

/**
 * Termes qui signalent un contenu sensible.
 *
 * Le filtre est LÉXICAL et non contextuel : c'est le seul moyen fiable
 * quand le moteur de recherche ne fournit aucun signalement structuré.
 * Une liste courte et explicite vaut mieux qu'une heuristique floue — le
 * mode « strict » doit retirer ce qui est manifestement sensible, pas
 *ombrer les résultats d'une recherche technique.
 */
const TERMES_SENSIBLES = [
  "porn",
  "porno",
  "xxx",
  "sex cam",
  "nude",
  "nudes",
  "onlyfans",
  "escort",
  "hentai",
  "nsfw",
  "suicide",
  "self-harm",
  "self harm",
  "kill yourself",
  "how to make a bomb",
  "fabricate bomb",
  "child abuse",
  "csam",
];

/**
 * Retire les résultats dont le titre ou l'extrait contient un terme
 * sensible.
 *
 * `low` (aucun) ne retire rien. `medium` retire les occurrences multiples —
 * un terme isolé dans un extrait peut être une mentioneze innocente
 * (« le film X Rated » dans un article de cinéma). `strict` retire toute
 * occurrence.
 */
export function filterBySafety(
  hits: SearchWebHit[],
  level: MaiSearchSafetyLevel
): SearchWebHit[] {
  const niveau = normalizeMaiSearchSafetyLevel(level);
  if (niveau === "low") {
    return hits;
  }
  const seuil = niveau === "strict" ? 1 : 2;
  return hits.filter((hit) => {
    const texte = `${hit.title} ${hit.snippet}`.toLowerCase();
    let occurrences = 0;
    for (const terme of TERMES_SENSIBLES) {
      if (texte.includes(terme)) {
        occurrences += 1;
      }
    }
    return occurrences < seuil;
  });
}

/**
 * Une requête « factuelle » ressemble à une question sur un sujet
 * documenté : Wikipédia doit alors passer en tête des résultats.
 *
 * Heuristique volontairement simple : la présence d'un mot interrogatif
 * ou d'un nom propre majuscule signale une recherche encyclopédique.
 */
export function looksFactual(query: string): boolean {
  const texte = query.trim();
  if (!texte) {
    return false;
  }
  if (
    /\b(qui|quoi|quel|quelle|quels|quelles|comment|quand|où|ou|pourquoi|combien|est-ce|definition|définition|origine|histoire)\b/i.test(
      texte
    )
  ) {
    return true;
  }
  // Un nom propre en tête de requête (« Ada Lovelace », « Tour Eiffel »).
  return /^[A-ZÀ-Ý][\w'’-]+(\s+[A-ZÀ-Ý][\w'’-]+)+/.test(texte);
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

/**
 * Renvoie la première tentative qui aboutit, les autres étant abandonnées.
 *
 * C'est le cœur de la rapidité de mAI Search. Les tentatives étaient
 * SÉQUENTIELLES : trois clés et trois points d'entrée, c'est neuf requêtes
 * les unes après les autres, chacune bornée à quatre secondes. Une clé
 * expirée suffisait donc à faire attendre l'utilisateur plus de trente
 * secondes pour un résultat qui était disponible sur la clé suivante.
 *
 * Ici, les tentatives d'un même tour partent EN PARALLÈLE et la première
 * réponse exploitable gagne. Le délai maximal d'un tour passe de « clés ×
 * points d'entrée × 4 s » à « 4 s », et les tours restants ne sont tentés que
 * si le tour courant échoue — donc jamais dans le cas courant.
 */
async function raceFirst<T>(
  tentatives: Array<() => Promise<T | null>>
): Promise<T | null> {
  if (tentatives.length === 0) {
    return null;
  }
  // `Promise.any` rejette dès que TOUTES les tentatives ont échoué : on veut
  // exactement ce comportement, et on récupère la première qui RÉUSSIT.
  try {
    return await Promise.any(tentatives.map((tentative) => tentative()));
  } catch {
    return null;
  }
}

/** Points d'entrée du moteur, par ordre de préférence. */
const YOU_SEARCH_ENDPOINTS = [
  "https://ydc-index.io/v1/search",
  "https://api.ydc-index.io/v1/search",
  "https://api.ydc-index.io/search",
];

/**
 * Recherche Web via You.com (ydc-index.io)
 */
async function fetchYouWeb(
  query: string,
  count = 10
): Promise<{ hits: SearchWebHit[]; images: SearchImageHit[] }> {
  const keys = getYouApiKeys();
  if (keys.length === 0) return { hits: [], images: [] };

  /**
   * Un tour = un point d'entrée, essayé avec TOUTES les clés en parallèle.
   *
   * Les clés sont réparties sur les tours, et non clonées : une seule clé
   * qui échoue ne fait pas échouer le tour. Le tour suivant n'est tenté
   * que si le premier a entièrement échoué.
   */
  for (const endpoint of YOU_SEARCH_ENDPOINTS) {
    const resultat = await raceFirst(
      keys.map((key) => async () => {
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

          if (!res.ok) {
            return null;
          }
          const data: any = await res.json().catch(() => null);
          if (!data) {
            return null;
          }
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
            } else if (Array.isArray(hit.snippets) && hit.snippets.length > 0) {
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

          // Un résultat VIDE n'est pas une réussite : on préfère une autre
          // tentative qui rendrait des liens.
          return hits.length > 0 ? { hits, images } : null;
        } catch {
          // Erreur ou timeout : un autre tour (ou une autre clé) prendra le
          // relais.
          return null;
        }
      })
    );
    if (resultat) {
      return resultat;
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

  // Les clés sont essayées EN PARALLÈLE : une clé expirée ne doit pas
  // retarder une clé valide de quatre secondes. Voir `raceFirst`.
  const resultat = await raceFirst(
    keys.map((key) => async () => {
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

        if (!res.ok) {
          return null;
        }
        const data: any = await res.json().catch(() => null);
        const results = data?.images?.results || data?.results || [];
        if (!Array.isArray(results) || results.length === 0) {
          return null;
        }
        return results
          .map((item: any) => ({
            image_url: item.image_url || item.thumbnail || "",
            page_url: item.page_url || "",
            thumbnail:
              item.thumbnail || item.large_thumbnail || item.image_url || "",
            title: item.title || query,
          }))
          .filter((img: SearchImageHit) => img.image_url);
      } catch {
        return null;
      }
    })
  );

  return resultat ?? [];
}

/**
 * Repli multi-sources (Wikipédia, Google News RSS)
 *
 * La langue est celle de l'appelant — celle de la préférence du compte.
 * La détection automatique par accents (l'ancien comportement) n'était
 * qu'un pis-aller : un utilisateur qui a choisi l'anglais veut de l'anglais,
 * même sur une requête accentuée.
 *
 * Wikipédia passe par `lib/search/wikipedia.ts`, comme le chemin principal :
 * le repli interrogeait l'API `opensearch` à côté, avec son propre
 * User-Agent, son propre délai et son propre nettoyage de balisage. Deux
 * chemins pour la même source, c'est deux comportements : le repli perdait
 * les résumés, donc l'interface n'affichait qu'un titre.
 */
async function fallbackSearch(
  query: string,
  lang: MaiSearchLanguage = "fr"
): Promise<SearchWebHit[]> {
  const results: SearchWebHit[] = [];

  // 1. Wikipédia — même module, mêmes résumés, même cache.
  const wikiHits = await fetchWikipediaWeb(query, 6, lang);
  results.push(...wikiHits);

  // 2. Google News RSS
  if (results.length < 5) {
    try {
      // Le flux suit la langue demandée : une recherche en anglais sur des
      // sources françaises ne renvoyait que des titres français, tronqués
      // par le décalage de région.
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=${lang}&gl=${GOOGLE_NEWS_REGION[lang]}&ceid=${GOOGLE_NEWS_CEID[lang]}`;
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

export function buildFaviconUrl(urlStr: string): string {
  try {
    const domain = new URL(urlStr).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return "";
  }
}

async function fetchGoogleNews(
  query: string,
  limit = 15,
  lang: MaiSearchLanguage = "fr"
): Promise<SearchNewsHit[]> {
  try {
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=${lang}&gl=${GOOGLE_NEWS_REGION[lang]}&ceid=${GOOGLE_NEWS_CEID[lang]}`;
    const res = await fetch(rssUrl, {
      headers: {
        Accept: "application/rss+xml, text/xml, */*",
        "User-Agent": "Mozilla/5.0",
      },
      signal: AbortSignal.timeout(3500),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const items = xml.split("<item>");
    const newsHits: SearchNewsHit[] = [];

    for (let i = 1; i < items.length && newsHits.length < limit; i++) {
      const block = items[i].split("</item>")[0];
      const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/i);
      const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/i);
      const descMatch = block.match(/<description>([\s\S]*?)<\/description>/i);
      const pubDateMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
      const sourceMatch = block.match(/<source[^>]*>([\s\S]*?)<\/source>/i);

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
      const source = sourceMatch ? sourceMatch[1].trim() : undefined;
      const page_age = pubDateMatch ? pubDateMatch[1].trim() : undefined;

      if (title && link) {
        newsHits.push({
          favicon_url: buildFaviconUrl(link),
          page_age,
          snippet,
          source,
          title,
          url: link,
        });
      }
    }
    return newsHits;
  } catch {
    return [];
  }
}

function extractVideos(hits: SearchWebHit[]): SearchVideoHit[] {
  const videos: SearchVideoHit[] = [];
  const seen = new Set<string>();

  for (const h of hits) {
    const isVideoSite =
      h.url.includes("youtube.com") ||
      h.url.includes("youtu.be") ||
      h.url.includes("dailymotion.com") ||
      h.url.includes("vimeo.com") ||
      h.url.includes("tiktok.com");

    if (isVideoSite && !seen.has(h.url)) {
      seen.add(h.url);
      let platform = "Vidéo Web";
      if (h.url.includes("youtube.com") || h.url.includes("youtu.be")) {
        platform = "YouTube";
      } else if (h.url.includes("dailymotion.com")) {
        platform = "Dailymotion";
      } else if (h.url.includes("vimeo.com")) {
        platform = "Vimeo";
      } else if (h.url.includes("tiktok.com")) {
        platform = "TikTok";
      }

      let thumbnail = h.thumbnail_url;
      if (
        !thumbnail &&
        (h.url.includes("youtube.com/watch?v=") || h.url.includes("youtu.be/"))
      ) {
        const idMatch = h.url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        if (idMatch) {
          thumbnail = `https://img.youtube.com/vi/${idMatch[1]}/hqdefault.jpg`;
        }
      }

      videos.push({
        duration: undefined,
        favicon_url: buildFaviconUrl(h.url),
        page_url: h.url,
        platform,
        thumbnail,
        title: h.title,
      });
    }
  }

  return videos;
}

async function fetchYouTubeVideos(
  query: string,
  limit = 9
): Promise<SearchVideoHit[]> {
  try {
    const res = await fetch(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      {
        headers: {
          "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(3500),
      }
    );
    if (!res.ok) return [];
    const html = await res.text();
    const videos: SearchVideoHit[] = [];
    const seen = new Set<string>();

    const regex =
      /"videoRenderer":\{"videoId":"([a-zA-Z0-9_-]{11})".*?"title":\{"runs":\[\{"text":"(.*?)"/g;
    let match: RegExpExecArray | null = null;
    while ((match = regex.exec(html)) !== null && videos.length < limit) {
      const id = match[1];
      const rawTitle = match[2];
      if (id && rawTitle && !seen.has(id)) {
        seen.add(id);
        const title = rawTitle.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
          String.fromCharCode(Number.parseInt(hex, 16))
        );
        videos.push({
          duration: undefined,
          favicon_url:
            "https://www.google.com/s2/favicons?domain=youtube.com&sz=32",
          page_url: `https://www.youtube.com/watch?v=${id}`,
          platform: "YouTube",
          thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
          title,
        });
      }
    }
    return videos;
  } catch {
    return [];
  }
}

async function fetchWikiImages(
  query: string,
  limit = 12,
  lang: MaiSearchLanguage = "fr"
): Promise<SearchImageHit[]> {
  const images = await fetchWikipediaImages(query, { lang, limit });
  return images.map((image) => ({
    image_url: image.image_url,
    page_url: image.page_url,
    thumbnail: image.thumbnail,
    title: image.title,
  }));
}

/**
 * Articles d'encyclopédie, convertis dans la forme des résultats de recherche.
 *
 * Le résumé de l'article est l'extrait affiché : l'extrait de recherche de
 * MediaWiki est trop court pour être informatif, et le résumé du premier
 * paragraphe est exactement ce qu'un lecteur attend d'un résultat.
 *
 * Les pages de DÉSAMBIGUÏSATION sont repoussées en fin de liste : ce sont
 * des index d'homonymes, pas des articles. Une recherche factuelle les
 * placerait en tête, et la synthèse en tirerait une liste de liens.
 */
async function fetchWikipediaWeb(
  query: string,
  count: number,
  lang: MaiSearchLanguage
): Promise<SearchWebHit[]> {
  const articles = await searchWikipediaWithSummaries(query, {
    lang,
    limit: count,
    withSummaries: Math.min(3, count),
  });
  const hits = articles.map((article) => ({
    favicon_url: WIKIPEDIA_FAVICON_URL,
    isDisambiguation: article.isDisambiguation === true,
    origin: "wikipedia" as const,
    snippet: article.summary || article.extract,
    thumbnail_url: article.thumbnail,
    title: article.title,
    url: article.url,
  }));
  return [
    ...hits.filter((hit) => !hit.isDisambiguation),
    ...hits.filter((hit) => hit.isDisambiguation),
  ];
}

/**
 * Déduplique les résultats par URL canonique.
 *
 * Un article d'encyclopédie peut être déjà remonté par You.com : le
 * conserver une seule fois, en gardant l'ORIGINE de la première
 * occurrence. L'inverse (Wikipédia d'abord) donnerait le badge à un
 * résultat qui n'est pas un article d'encyclopédie.
 */
function dedupeByUrl(hits: SearchWebHit[]): SearchWebHit[] {
  const vues = new Set<string>();
  return hits.filter((hit) => {
    if (!hit.url) {
      return false;
    }
    let cle = hit.url;
    try {
      const url = new URL(hit.url);
      // Wikipédia encode les espaces en `_` : on normalise pour que
      // « Ada_Lovelace » et « Ada%20Lovelace » ne soient pas deux entrées.
      cle = `${url.hostname}${url.pathname.replace(/_/g, " ").toLowerCase()}`;
    } catch {
      cle = hit.url;
    }
    if (vues.has(cle)) {
      return false;
    }
    vues.add(cle);
    return true;
  });
}

/**
 * Exécute une recherche complète optimisée (Web, Images, Actualités, Vidéos en parallèle)
 */
export async function executeMaiSearch(params: {
  count?: number;
  lang?: MaiSearchLanguage;
  query: string;
  safetyLevel?: MaiSearchSafetyLevel;
  sources?: MaiSearchSourceKey[];
  type?: "web" | "images" | "news" | "videos" | "all";
}): Promise<SearchResponse> {
  const trimmed = params.query.trim();
  if (!trimmed) {
    return {
      images: [],
      news: [],
      provider: "you.com",
      query: "",
      results: [],
      success: false,
      videos: [],
    };
  }

  const lang = normalizeMaiSearchLanguage(params.lang);
  const safetyLevel = normalizeMaiSearchSafetyLevel(params.safetyLevel);
  // Les sources demandées par l'appelant, ou le type historique. `type`
  // reste lu pour les appelants anciens (l'API publique, le chat).
  const sources = params.sources
    ? normalizeMaiSearchSources(params.sources)
    : normalizeMaiSearchSources(
        params.type === "images"
          ? ["images"]
          : params.type === "news"
            ? ["news"]
            : params.type === "videos"
              ? ["videos"]
              : params.type === "web"
                ? ["web"]
                : undefined
      );

  const wantWeb = sources.includes("web");
  const wantImages = sources.includes("images");
  const wantNews = sources.includes("news");
  const wantWikipedia = sources.includes("wikipedia");

  const cacheKey = `${sources.join(",")}:${lang}:${safetyLevel}:${trimmed.toLowerCase()}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const count = params.count || 20;

  /**
   * Les replis partent EN MÊME TEMPS que les sources principales.
   *
   * Avant, les repli n'étaient pas des replis mais des ÉTAPES : les images
   * attendaient l'échec du moteur, le web attendait l'échec de You.com, les
   * vidéos attendaient l'échec du web. Sur une source lente ou absente, la
   * recherche prenait la somme des délais au lieu du maximum.
   *
   * Les replis sont donc lancés en parallèle et ne sont retenus QUE s'ils
   * apportent quelque chose que les sources principales n'ont pas donné. Le
   * coût est nul quand les sources principales répondent, et le gain est la
   * somme des délais quand elles échouent.
   */
  const [
    webResult,
    imagesResult,
    newsResult,
    wikiResult,
    fallbackResult,
    wikiImagesResult,
    youtubeResult,
  ] = await Promise.allSettled([
    wantWeb
      ? fetchYouWeb(trimmed, count)
      : Promise.resolve({ hits: [], images: [] }),
    wantImages ? fetchYouImages(trimmed, 20) : Promise.resolve([]),
    wantNews ? fetchGoogleNews(trimmed, 15, lang) : Promise.resolve([]),
    wantWikipedia
      ? fetchWikipediaWeb(trimmed, count, lang)
      : Promise.resolve([] as SearchWebHit[]),
    // Repli web : Wikipédia en recherche ouverte, puis le flux d'actualité.
    wantWeb
      ? fallbackSearch(trimmed, lang)
      : Promise.resolve([] as SearchWebHit[]),
    // Repli images : les vignettes de l'encyclopédie.
    wantImages ? fetchWikiImages(trimmed, 12, lang) : Promise.resolve([]),
    // Repli vidéos : la recherche YouTube, quand les liens web n'en
    // contiennent aucun.
    sources.includes("videos")
      ? fetchYouTubeVideos(trimmed)
      : Promise.resolve([] as SearchVideoHit[]),
  ]);

  const webData =
    webResult.status === "fulfilled"
      ? webResult.value
      : { hits: [], images: [] };
  const dedicatedImages =
    imagesResult.status === "fulfilled" ? imagesResult.value : [];
  const newsHits = newsResult.status === "fulfilled" ? newsResult.value : [];
  const wikiHits = wikiResult.status === "fulfilled" ? wikiResult.value : [];
  const fallbackHits =
    fallbackResult.status === "fulfilled" ? fallbackResult.value : [];
  const wikiImages =
    wikiImagesResult.status === "fulfilled" ? wikiImagesResult.value : [];
  const youtubeVideos =
    youtubeResult.status === "fulfilled" ? youtubeResult.value : [];

  let results = webData.hits;
  let allImages = [...dedicatedImages, ...webData.images];

  // Si aucune image reçue, retenir le repli Wikipédia.
  if (allImages.length === 0 && wantImages) {
    allImages.push(...wikiImages);
  }

  // Dédupliquer les images par image_url
  const seenImages = new Set<string>();
  allImages = allImages.filter((img) => {
    if (!img.image_url || seenImages.has(img.image_url)) return false;
    seenImages.add(img.image_url);
    return true;
  });

  const providers = new Set<SearchResponse["provider"]>();
  if (results.length > 0) {
    providers.add("you.com");
  }
  if (wikiHits.length > 0) {
    providers.add("wikipedia");
  }

  // Si aucun résultat Web (ou pas de clé), retenir le repli.
  if (results.length === 0 && wantWeb && fallbackHits.length > 0) {
    results = fallbackHits;
    // Le repli puise désormais le MÊME module Wikipédia que la source à
    // part entière : ses résultats portent donc l'origine « wikipedia ». On
    // ne déclare « fallback » que s'il a bringué quelque chose d'AUTRE que
    // l'encyclopédie (le flux d'actualité) — sinon l'interface afficherait
    // « Mode dégradé » pour des articles d'encyclopédie parfaitement
    // normaux.
    const horsWiki = fallbackHits.some((hit) => hit.origin !== "wikipedia");
    if (horsWiki) {
      providers.add("fallback");
    } else {
      providers.add("wikipedia");
    }
  }

  // Wikipédia est une source à part entière : ses articles viennent
  // s'ajouter aux résultats web, dédupliqués par URL.
  if (wikiHits.length > 0) {
    results = dedupeByUrl([...results, ...wikiHits]);
  }

  // Filtre de sécurité : appliqué APRÈS l'assemblage, donc il retire aussi
  // bien un résultat web sensible qu'un article d'encyclopédie.
  results = filterBySafety(results, safetyLevel);

  // Une requête factuelle sert mieux avec l'encyclopédie en tête : l'article
  // de référence avant les pages qui en parlent.
  const wikiFirst = looksFactual(trimmed) && wikiHits.length > 0;
  if (wikiFirst) {
    results = [
      ...results.filter((hit) => hit.origin === "wikipedia"),
      ...results.filter((hit) => hit.origin !== "wikipedia"),
    ];
  }

  // Les pages de DÉSAMBIGUÏSATION sont des index d'homonymes, pas des
  // articles : elles passent en fin de liste, quel que soit leur rang.
  // Une recherche factuelle les placerait sinon en tête, et la synthèse en
  // tirerait une liste de liens.
  if (results.some((hit) => hit.isDisambiguation)) {
    results = [
      ...results.filter((hit) => !hit.isDisambiguation),
      ...results.filter((hit) => hit.isDisambiguation),
    ];
  }

  // Extraire les vidéos à partir des résultats web.
  let videos = extractVideos(results);

  // Si aucune vidéo trouvée dans les liens web, retenir la recherche
  // YouTube — déjà lancée en parallèle, donc sans délai supplémentaire.
  if (videos.length === 0 && sources.includes("videos")) {
    videos = youtubeVideos;
  }

  // S'assurer que chaque hit a un favicon garanti
  results = results.map((r) => ({
    ...r,
    favicon_url: r.favicon_url || buildFaviconUrl(r.url),
  }));

  /**
   * Le nombre de résultats est borne PAR SOURCE, pas au total.
   *
   * `count` est la quantité de liens d'une source que l'interface affiche :
   * c'est la lecture en diagonale qui compte, pas la longueur de la liste.
   * Borner le total aurait vidé l'onglet « Actualités » dès qu'un onglet Web
   * était plein, alors que l'utilisateur n'en demandait pas moins.
   */
  const webResults = results.slice(0, count);
  const newsLimited = newsHits.slice(0, count);
  const imagesLimited = allImages.slice(0, count);
  const videosLimited = videos.slice(0, count);

  const provider: SearchResponse["provider"] =
    providers.size > 1
      ? "mixed"
      : providers.size === 1
        ? ([...providers][0] as SearchResponse["provider"])
        : "you.com";

  const response: SearchResponse = {
    images: imagesLimited,
    news: newsLimited,
    provider,
    query: trimmed,
    results: webResults,
    success:
      webResults.length > 0 ||
      imagesLimited.length > 0 ||
      newsLimited.length > 0 ||
      videosLimited.length > 0,
    videos: videosLimited,
    wikiFirst,
  };

  if (response.success) {
    setInCache(cacheKey, response);
  }

  return response;
}
