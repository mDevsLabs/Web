/**
 * ============================================================================
 * WIKIPÉDIA — SOURCE DE RECHERCHE mAI Search (lib/search/wikipedia.ts)
 * ============================================================================
 *
 * PAS DE `server-only`
 *
 * Ce module ne lit aucun secret et ne touche aucune base : il ne fait que
 * lire l'API publique de Wikipédia. Il est donc importable des deux côtés.
 * `server-only` l'interdirait, alors que `lib/ai/tools/web-search.ts` — qui
 * l'utilise comme dernier repli — est lui-même référencé par
 * `lib/types.ts` pour le typage côté client.
 *
 * POURQUOI CE MODULE
 *
 * Wikipédia n'était qu'un REPLI : quand You.com échouait ou qu'aucune clé
 * n'était configurée, `fallbackSearch()` (`you-client.ts`) interrogeait
 * l'API `opensearch` et rendait six titres sans grand contenu. Une encyclopédie
 * libre, gratuite, sans clé, multilingue et mise à jour en continu ne devrait
 * pas être un lot de consolation : c'est une SOURCE à part entière, dont les
 * résultats sont distingués des autres par leur origine.
 *
 * L'API publique MediaWiki n'exige aucune clé, mais elle EXIGE un
 * `User-Agent` identifiant : sans lui, Wikimedia rejette la requête. Le
 * format est celui déjà employé par `lib/site/web-search.ts`.
 *
 * ── Trois règles non négociables ───────────────────────────────────────────
 *
 * 1. AUCUNE CLÉ, AUCUN SECRET. Ce module ne lit aucun secret : l'API
 *    publique de Wikipédia n'en demande pas, et en demander un serait
 *    s'exposer à le faire apparaître dans un journal.
 *
 * 2. L'URL N'EST JAMAIS FOURNIE PAR L'APPELANT. Elle est construite ici,
 *    à partir d'une langue validée par liste blanche et d'une requête
 *    encodée en paramètre. Le risque SSRF de `lib/web/safe-fetch.ts` ne
 *    s'applique donc pas : l'hôte est toujours `*.wikipedia.org`. Ce qui
 *    est conservé — délai borné et plafond de taille — est implémenté
 *    ci-dessous, sur un `fetch` direct.
 *
 * 3. AUCUN DDL, AUCUNE ÉCRITURE. Ce module LIT l'encyclopédie ; il ne
 *    touche à aucune base.
 */

import { type MaiSearchLanguage, normalizeMaiSearchLanguage } from "./sources";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

/** Un article Wikipédia, normalisé dans la forme des résultats de recherche. */
export interface WikipediaHit {
  /** Extrait en texte brut (le premier paragraphe de l'article). */
  extract: string;
  /**
   * La page est-elle une page de DÉSAMBIGUÏSATION ?
   *
   * Une page de désambiguïsation liste des homonymes : c'est un index, pas un
   * article. La remonter en tête d'une recherche factuelle — « Ada Lovelace »
   * — donnerait une liste de liens comme réponse. Le moteur la repère donc
   * ici et la repousse en fin de liste.
   */
  isDisambiguation?: boolean;
  /** Vignette de l'article, si l'article en a une. */
  thumbnail?: string;
  /** Titre de l'article, dans sa forme canonique (redirections résolues). */
  title: string;
  /** Horodatage de la dernière modification, en ISO 8601. */
  updatedAt?: string;
  /** URL publique de l'article. */
  url: string;
}

/** Un article avec son résumé — c'est ce que la recherche renvoie. */
export interface WikipediaArticle extends WikipediaHit {
  /** Résumé en clair (premiers paragraphes, sans balisage). */
  summary: string;
}

// ─────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────

/**
 * User-Agent identifiant : Wikimedia rejette les requêtes qui ne
 * s'identifient pas. Format : outil/version (contact).
 */
export const WIKIPEDIA_USER_AGENT =
  "mAI-Search/1.0 (https://m-ai.fr; contact@m-ai.fr)";

/** Délai maximal d'une interrogation de l'encyclopédie. */
export const WIKIPEDIA_TIMEOUT_MS = 3500;

/**
 * Plafond de résultats par appel.
 *
 * L'API MediaWiki refuse `srlimit` au-delà de 500, mais l'API publique
 * applique en pratique une limite bien plus basse sur les requêtes non
 * authentifiées : on reste bas, la pagination n'est pas un besoin ici.
 */
export const WIKIPEDIA_MAX_RESULTS = 10;

/** Taille maximale de la réponse lue : une recherche ne pèse pas plus. */
const WIKIPEDIA_MAX_BYTES = 1_000_000;

/** En-tête `Accept` — l'API Action renvoie du JSON. */
const JSON_ACCEPT = "application/json";

// ─────────────────────────────────────────────
// Cache mémoire
// ─────────────────────────────────────────────

/**
 * Durée de vie d'une entrée du cache.
 *
 * L'encyclopédie bouge lentement : une entrée de cinq minutes ne sert
 * jamais une information périmée, et elle absorbe les rafales de requêtes
 * identiques (recherche + résumé d'un article, puis relecture de l'onglet).
 */
const WIKIPEDIA_CACHE_TTL_MS = 5 * 60 * 1000;

/** Nombre maximal d'entrées conservées. */
const WIKIPEDIA_CACHE_MAX = 200;

type CacheEntry<T> = { expiresAt: number; value: T };

const ARTICLE_CACHE = new Map<string, CacheEntry<WikipediaArticle | null>>();
const SEARCH_CACHE = new Map<string, CacheEntry<WikipediaHit[]>>();

function readCache<T>(
  store: Map<string, CacheEntry<T>>,
  key: string
): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

function writeCache<T>(
  store: Map<string, CacheEntry<T>>,
  key: string,
  value: T
): void {
  if (store.size >= WIKIPEDIA_CACHE_MAX) {
    const oldest = store.keys().next().value;
    if (oldest) store.delete(oldest);
  }
  store.set(key, { expiresAt: Date.now() + WIKIPEDIA_CACHE_TTL_MS, value });
}

/**
 * Vide le cache de l'encyclopédie.
 *
 * Exposé pour les tests : un cache entre deux cas d'essai rendrait le
 * résultat dépendant de l'ordre d'exécution.
 */
export function clearWikipediaCache(): void {
  ARTICLE_CACHE.clear();
  SEARCH_CACHE.clear();
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Base de l'API pour une langue donnée. */
function apiBase(lang: MaiSearchLanguage): string {
  return `https://${lang}.wikipedia.org/w/api.php`;
}

/** URL canonique d'un article, en texte lisible. */
export function wikipediaArticleUrl(
  title: string,
  lang: MaiSearchLanguage
): string {
  return `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(
    title.replace(/ /g, "_")
  )}`;
}

/**
 * Une URL est-elle un article d'encyclopédie ?
 *
 * Le moteur principal renvoie parfois la page Wikipédia sans en marquer
 * l'origine. Sans cette reconnaissance, le badge et l'onglet restent vides
 * alors que l'article est bien dans la liste : le clic n'a rien à montrer.
 */
export function isWikipediaArticleUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host === "wikipedia.org" || host.endsWith(".wikipedia.org");
  } catch {
    return false;
  }
}

/**
 * Le titre est la clé de recherche : on retire les artefacts de saisie qui
 * feraient échouer l'API (`[[...]]`, espaces multiples, préfixe de catégorie).
 */
export function normalizeWikiTitle(raw: string): string {
  return raw
    .replace(/^\[\[|\]\]$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Ce titre est-il celui d'une page de désambiguïsation ?
 *
 * MediaWiki signale ces pages par leur contenu (« Cette page porte sur
 * plusieurs personnes appelées… »), pas par un marqueur dans le titre : le
 * titre peut s'appeler n'importe quoi. On combine donc deux indices :
 *
 * 1. le contenu renvoyé par l'API — seule source fiable ;
 * 2. le titre lui-même, en dernier recours (pages de catégorie comme
 *    « Homonymie »), quand l'extrait est vide.
 *
 * L'API `list=search` ne renvoyant pas de contenu d'article, c'est la
 * variante `prop=extracts` qui tranche : `fetchWikipediaArticle` marque donc
 * l'article, et `searchWikipedia` se rabat sur le titre.
 */
export function isDisambiguationTitle(title: string): boolean {
  const normalized = normalizeWikiTitle(title).toLowerCase();
  return (
    normalized.startsWith("homonymie") ||
    normalized.startsWith("désambiguïsation") ||
    normalized.startsWith("désambiguisation")
  );
}

/**
 * L'extrait d'un article est-il celui d'une page de désambiguïsation ?
 *
 * MediaWiki ouvre ses pages de désambiguïsation par une formule
 * reconnaissable. La liste est courte et explicite : mieux vaut une
 * heuristique lisible qu'un motif exhaustif fragile.
 */
export function looksLikeDisambiguation(extract: string): boolean {
  const texte = extract.toLowerCase();
  return (
    texte.includes("porte sur plusieurs") ||
    texte.includes("désambiguïsation") ||
    texte.includes("désambiguisation") ||
    texte.includes("homonymie") ||
    texte.includes("peut désigner") ||
    texte.includes("désigne plusieurs")
  );
}

/**
 * Interroge l'API Action et renvoie le JSON, ou `null` si la source est
 * injoignable.
 *
 * `null` plutôt qu'une exception : l'appelant enchaîne des sources, et une
 * encyclopédie muette ne doit jamais faire échouer une recherche entière.
 *
 * Le corps est lu avec un plafond d'octets : sans lui, un serveur qui
 * répondrait massivement ferait allouer sa réponse en mémoire.
 */
async function callMediaWiki(
  params: Record<string, string>,
  lang: MaiSearchLanguage
): Promise<any | null> {
  const query = new URLSearchParams({
    ...params,
    format: "json",
    formatversion: "2",
  });
  const url = `${apiBase(lang)}?${query.toString()}`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: JSON_ACCEPT,
        "User-Agent": WIKIPEDIA_USER_AGENT,
      },
      signal: AbortSignal.timeout(WIKIPEDIA_TIMEOUT_MS),
    });
    if (!res.ok) {
      return null;
    }
    const texte = await readCapped(res);
    if (texte === null) {
      return null;
    }
    return JSON.parse(texte);
  } catch {
    return null;
  }
}

/**
 * Lit le corps d'une réponse en le plafonnant.
 *
 * `null` quand le plafond est dépassé : la réponse est abandonnée plutôt
 * que tronquée au milieu d'un JSON — un fragment ne serait pas analysable.
 */
async function readCapped(res: Response): Promise<string | null> {
  const reader = res.body?.getReader();
  if (!reader) {
    return res.text().catch(() => null);
  }
  const decoder = new TextDecoder();
  let total = 0;
  let texte = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      total += value.byteLength;
      if (total > WIKIPEDIA_MAX_BYTES) {
        await reader.cancel().catch(() => {});
        return null;
      }
      texte += decoder.decode(value, { stream: true });
    }
    texte += decoder.decode();
    return texte;
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}

// ─────────────────────────────────────────────
// Recherche
// ─────────────────────────────────────────────

/**
 * Recherche des articles correspondant à une requête.
 *
 * `list=search` renvoie titre, extrait court et horodatage de modification —
 * de quoi alimenter une liste de résultats sans requête supplémentaire
 * par article.
 */
export async function searchWikipedia(
  query: string,
  options: {
    lang?: MaiSearchLanguage;
    limit?: number;
    offset?: number;
  } = {}
): Promise<WikipediaHit[]> {
  const lang = normalizeMaiSearchLanguage(options.lang);
  const recherche = query.trim();
  if (!recherche) {
    return [];
  }
  const limit = Math.min(
    Math.max(options.limit ?? WIKIPEDIA_MAX_RESULTS, 1),
    WIKIPEDIA_MAX_RESULTS
  );
  const offset = Math.max(options.offset ?? 0, 0);

  const cacheKey = `${lang}:${limit}:${offset}:${recherche.toLowerCase()}`;
  const cached = readCache(SEARCH_CACHE, cacheKey);
  if (cached) {
    return cached;
  }

  const data = await callMediaWiki(
    {
      action: "query",
      formatversion: "2",
      list: "search",
      srlimit: String(limit),
      srnamespace: "0",
      sroffset: String(offset),
      srprop: "snippet|timestamp",
      srsearch: recherche,
    },
    lang
  );

  const pages = data?.query?.search;
  if (!Array.isArray(pages)) {
    return [];
  }

  const hits: WikipediaHit[] = [];
  for (const page of pages) {
    const title = normalizeWikiTitle(String(page?.title ?? ""));
    if (!title) {
      continue;
    }
    hits.push({
      extract: stripHtml(String(page?.snippet ?? "")),
      isDisambiguation: isDisambiguationTitle(title),
      thumbnail: undefined,
      title,
      updatedAt: page?.timestamp ? String(page.timestamp) : undefined,
      url: wikipediaArticleUrl(title, lang),
    });
  }
  writeCache(SEARCH_CACHE, cacheKey, hits);
  return hits;
}

/**
 * Résumé et informations d'un article (vignette, URL canonique).
 *
 * `prop=extracts|pageimages` avec `exintro` : le résumé est le premier
 * paragraphe, ce qui suffit à un résultat de recherche et évite de
 * télécharger l'article entier.
 */
export async function fetchWikipediaArticle(
  title: string,
  options: { lang?: MaiSearchLanguage } = {}
): Promise<WikipediaArticle | null> {
  const lang = normalizeMaiSearchLanguage(options.lang);
  const titre = normalizeWikiTitle(title);
  if (!titre) {
    return null;
  }

  const cacheKey = `${lang}:${titre}`;
  const cached = readCache(ARTICLE_CACHE, cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const data = await callMediaWiki(
    {
      action: "query",
      exintro: "1",
      explaintext: "1",
      formatversion: "2",
      piprop: "thumbnail",
      pithumbsize: "600",
      prop: "extracts|pageimages|info",
      redirects: "1",
      titles: titre,
    },
    lang
  );

  const pages = data?.query?.pages;
  const page = Array.isArray(pages) ? pages[0] : null;
  if (!page || page.missing) {
    // Un article absent est mis en cache comme « absent » : le renvoyer
    // `null` à chaque appel ferait repasser l'API pour rien.
    writeCache(ARTICLE_CACHE, cacheKey, null);
    return null;
  }

  const resolvedTitle = normalizeWikiTitle(String(page.title ?? titre));
  const thumbnail = page?.thumbnail?.source
    ? String(page.thumbnail.source)
    : undefined;
  const extract = String(page.extract ?? "").trim();

  const article: WikipediaArticle = {
    extract,
    // Le contenu de l'article est la source fiable : une page de
    // désambiguïsation s'annonce dans son propre texte.
    isDisambiguation:
      looksLikeDisambiguation(extract) || isDisambiguationTitle(resolvedTitle),
    summary: extract,
    thumbnail,
    title: resolvedTitle,
    updatedAt: page?.touched ? String(page.touched) : undefined,
    url: page?.fullurl
      ? String(page.fullurl)
      : wikipediaArticleUrl(resolvedTitle, lang),
  };
  writeCache(ARTICLE_CACHE, cacheKey, article);
  return article;
}

/**
 * Recherche d'articles ET leur résumé, en une passe.
 *
 * L'API `list=search` ne donne qu'un extrait de recherche : trop court pour
 * une fiche, trop long pour être lu. On combine donc les deux appels — la
 * recherche d'abord, puis le résumé des premiers articles seulement, pour
 * ne pas multiplier les requêtes.
 */
export async function searchWikipediaWithSummaries(
  query: string,
  options: {
    lang?: MaiSearchLanguage;
    limit?: number;
    withSummaries?: number;
  } = {}
): Promise<WikipediaArticle[]> {
  const lang = normalizeMaiSearchLanguage(options.lang);
  const hits = await searchWikipedia(query, { ...options, lang });
  if (hits.length === 0) {
    return [];
  }
  // On ne résume qu'une poignée d'articles : au-delà, la recherche devient
  // plus lente que l'ensemble de la page de résultats.
  const aResumer = Math.min(options.withSummaries ?? 3, hits.length);
  const articles = await Promise.all(
    hits.slice(0, aResumer).map(async (hit) => {
      const article = await fetchWikipediaArticle(hit.title, { lang });
      if (!article) {
        return { ...hit, summary: hit.extract } satisfies WikipediaArticle;
      }
      return article;
    })
  );
  const restants = hits
    .slice(aResumer)
    .map(
      (hit) => ({ ...hit, summary: hit.extract }) satisfies WikipediaArticle
    );
  return [...articles, ...restants];
}

/**
 * Vignettes d'articles, pour la section « Images » de mAI Search.
 *
 * `generator=search` + `prop=pageimages` : une seule requête pour N
 * vignettes, au lieu d'une par article.
 */
export async function fetchWikipediaImages(
  query: string,
  options: { lang?: MaiSearchLanguage; limit?: number } = {}
): Promise<
  Array<{
    image_url: string;
    page_url: string;
    thumbnail: string;
    title: string;
  }>
> {
  const lang = normalizeMaiSearchLanguage(options.lang);
  const recherche = query.trim();
  if (!recherche) {
    return [];
  }
  const limit = Math.min(
    Math.max(options.limit ?? WIKIPEDIA_MAX_RESULTS, 1),
    WIKIPEDIA_MAX_RESULTS
  );

  const data = await callMediaWiki(
    {
      action: "query",
      formatversion: "2",
      generator: "search",
      gsrlimit: String(limit),
      gsrnamespace: "0",
      gsrsearch: recherche,
      pithumbsize: "600",
      prop: "pageimages",
    },
    lang
  );

  const pages = data?.query?.pages;
  if (!Array.isArray(pages)) {
    return [];
  }

  return pages
    .filter((page: any) => page?.thumbnail?.source)
    .map((page: any) => {
      const title = normalizeWikiTitle(String(page.title ?? ""));
      return {
        image_url: String(page.thumbnail.source),
        page_url: page.fullurl
          ? String(page.fullurl)
          : wikipediaArticleUrl(title, lang),
        thumbnail: String(page.thumbnail.source),
        title,
      };
    });
}

/**
 * Nettoie le HTML que `list=search` renvoie dans ses extraits.
 *
 * MediaWiki insère des balises `<span class="searchmatch">` autour des
 * termes recherchés : sans nettoyage, le texte affiché à l'utilisateur
 * afficherait du balisage brut.
 *
 * Les entités décodées sont celles que l'API produit réellement. La liste
 * NAMÉES d'abord (`&amp;` avant `&lt;` : décoder `&lt;` en premier
 * produirait `&amp;lt;` sur une double substitution), puis les entités
 * numériques, qui n'ont pas de liste possible.
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "’")
    .replace(/&lsquo;/g, "‘")
    .replace(/&ldquo;/g, "“")
    .replace(/&rdquo;/g, "”")
    .replace(/&hellip;/g, "…")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&eacute;/g, "é")
    .replace(/&egrave;/g, "è")
    .replace(/&agrave;/g, "à")
    .replace(/&ccedil;/g, "ç")
    .replace(/&ugrave;/g, "ù")
    .replace(/&#(\d+);/g, (_match, code: string) => {
      const point = Number.parseInt(code, 10);
      return Number.isFinite(point) ? String.fromCodePoint(point) : "";
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_match, code: string) => {
      const point = Number.parseInt(code, 16);
      return Number.isFinite(point) ? String.fromCodePoint(point) : "";
    })
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}
