import "server-only";

import {
  buildFaviconUrl,
  buildFaviconUrlForDomain,
  WIKIPEDIA_FAVICON_URL,
} from "./favicon";
import {
  MAI_SEARCH_RESULT_COUNT_MAX,
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

// Le service d'icônes est défini dans `lib/search/favicon.ts` : il est
// également consommé par l'interface (client), qui doit produire exactement la
// même URL que le moteur.
export { buildFaviconUrl, WIKIPEDIA_FAVICON_URL };

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
 * Service d'icônes : voir `lib/search/favicon.ts`.
 *
 * Le calcul de l'URL vit dans un module client-safe, et non ici : le moteur
 * (serveur) et l'interface (client) doivent produire exactement la même URL,
 * et une seule des deux doit être autorisée par la CSP `img-src`.
 */

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
  /** La recherche a-t-elle été menée en mode approfondi ? */
  deep?: boolean;
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
  /**
   * `true` quand au moins une source a rendu moins de liens que demandé.
   *
   * Le moteur tronque, et certaines sources sont muettes : l'interface doit
   * alors dire ce qu'elle a obtenu, plutôt que de laisser croire à une
   * recherche exhaustive.
   */
  truncated?: boolean;
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
 * Nombre de liens demandés au moteur par UNE requête.
 *
 * Le moteur n'est pas garanti de rendre ce qu'on lui demande : au-delà d'un
 * certain volume, il tronque. La valeur retenue est celle qui fonctionne
 * aujourd'hui de façon fiable — c'est le rythme d'un tour de complément.
 */
const YOU_MAX_PER_REQUEST = 25;

/**
 * Nombre de tours de COMPLÉMENT possibles.
 *
 * Le premier tour demande la cible entière. Si le moteur rend moins que
 * demandé, on relance en répartissant le manque sur les autres clés, en
 * parallèle. La borne existe pour qu'un compte Max ne déclenche pas une
 * avalanche de requêtes : le moteur, lui, a ses propres limites.
 */
const YOU_MAX_FILL_ROUNDS = 4;

/**
 * Une requête au moteur, avec UNE clé et UN point d'entrée.
 */
async function fetchYouWebOnce(
  query: string,
  count: number,
  key: string,
  endpoint: string
): Promise<{
  hits: SearchWebHit[];
  images: SearchImageHit[];
  news: SearchNewsHit[];
} | null> {
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
    /**
     * Actualités rendues par le MÊME appel que le Web.
     *
     * Elles étaient déjà présentes dans `results.news`, mais fondues dans la
     * liste web : un titre d'actualité s'affichait alors dans l'onglet
     * « Tous » sans jamais alimenter l'onglet « Actualités ». Les garder à
     * part permet de nourrir les deux, sans seconde requête ni délai
     * supplémentaire.
     */
    const youNews: SearchNewsHit[] = [];

    const rawNews = Array.isArray(data.results?.news)
      ? (data.results.news as Record<string, unknown>[])
      : Array.isArray(data.news?.results)
        ? (data.news.results as Record<string, unknown>[])
        : [];
    for (const item of rawNews) {
      const title = String(item.title ?? item.name ?? "").trim();
      const url = String(item.url ?? item.link ?? "").trim();
      if (!title || !url) {
        continue;
      }
      const snippet = String(
        item.description ?? item.snippet ?? item.text ?? ""
      ).trim();
      youNews.push({
        favicon_url: buildFaviconUrl(url),
        page_age:
          typeof item.page_age === "string"
            ? item.page_age
            : typeof item.published_at === "string"
              ? item.published_at
              : undefined,
        snippet: snippet.slice(0, 400),
        source:
          typeof item.source === "string"
            ? item.source
            : (() => {
                try {
                  return new URL(url).hostname;
                } catch {}
              })(),
        title,
        url,
      });
    }

    let rawHits: any[] = [];
    if (data.results && typeof data.results === "object") {
      if (Array.isArray(data.results)) {
        rawHits = data.results;
      } else {
        if (Array.isArray(data.results.web)) rawHits.push(...data.results.web);
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
          // L'icône est TOUJOURS reconstruite depuis l'URL du résultat, jamais
          // reprise du moteur : You.com rend des URL du service S2 de Google,
          // déprécié, qui répond 404 et n'est plus autorisé par la CSP. Les
          // reprendre affichait des favicons cassés que le repli local ne
          // pouvait pas rattraper, puisque l'URL semblait valide.
          favicon_url: url ? buildFaviconUrl(url) : undefined,
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
    // tentative qui rendrait des liens. Une réponse qui ne porte QUE des
    // actualités reste une réussite pour l'onglet éponyme.
    return hits.length > 0 || youNews.length > 0
      ? { hits, images, news: youNews }
      : null;
  } catch {
    // Erreur ou timeout : un autre tour (ou une autre clé) prendra le
    // relais.
    return null;
  }
}

/**
 * Recherche Web via You.com (ydc-index.io)
 *
 * Le volume demandé peut aller jusqu'à 200 liens par source. Le moteur ne
 * rend pas toujours tout ce qu'on lui demande : la stratégie est donc
 * « un tour large, puis des tours de complément ».
 *
 * - Premier tour : la cible ENTIÈRE est demandée, les clés essayées en
 *   parallèle (comportement historique — la première qui répond gagne).
 * - Tours de complément : seulement si le premier tour est revenu court. Le
 *   manque est réparti sur les autres clés, et les requêtes partent EN
 *   PARALLÈLE : le délai reste celui de la plus lente, pas leur somme.
 *
 * Le résultat est tronqué quand même : la réponse porte alors
 * `truncated`, et l'interface dit ce qu'elle a obtenu.
 */
async function fetchYouWeb(
  query: string,
  count = 10
): Promise<{
  hits: SearchWebHit[];
  images: SearchImageHit[];
  news: SearchNewsHit[];
}> {
  const keys = getYouApiKeys();
  if (keys.length === 0) return { hits: [], images: [], news: [] };

  const cible = Math.max(1, Math.min(count, MAI_SEARCH_RESULT_COUNT_MAX));

  /**
   * Un tour = un point d'entrée, essayé avec TOUTES les clés en parallèle.
   *
   * Les clés sont réparties sur les tours, et non clonées : une seule clé
   * qui échoue ne fait pas échouer le tour. Le tour suivant n'est tenté
   * que si le premier a entièrement échoué.
   */
  const hits: SearchWebHit[] = [];
  const images: SearchImageHit[] = [];
  const news: SearchNewsHit[] = [];

  for (const endpoint of YOU_SEARCH_ENDPOINTS) {
    const resultat = await raceFirst(
      keys.map(
        (key) => async () => fetchYouWebOnce(query, cible, key, endpoint)
      )
    );
    if (resultat) {
      hits.push(...resultat.hits);
      images.push(...resultat.images);
      news.push(...resultat.news);
      break;
    }
  }

  // Le moteur a rendu moins que demandé : on complète, en répartissant le
  // manque sur les clés disponibles.
  for (let tour = 1; tour <= YOU_MAX_FILL_ROUNDS; tour++) {
    const manque = cible - hits.length;
    if (manque <= 0) {
      break;
    }
    // Rotation des clés : chaque tour commence par une clé différente, pour
    // ne pas marteler la même.
    const decalage = tour % keys.length;
    const clesDuTour = [
      ...keys.slice(decalage),
      ...keys.slice(0, decalage),
    ].slice(0, keys.length);
    const parRequete = Math.max(
      1,
      Math.min(YOU_MAX_PER_REQUEST, Math.ceil(manque / clesDuTour.length))
    );

    const complement = await Promise.allSettled(
      clesDuTour.map((cle) =>
        fetchYouWebOnce(query, parRequete, cle, YOU_SEARCH_ENDPOINTS[0])
      )
    );
    for (const resultat of complement) {
      if (resultat.status === "fulfilled" && resultat.value) {
        hits.push(...resultat.value.hits);
        images.push(...resultat.value.images);
        news.push(...resultat.value.news);
      }
    }
  }

  // Les tours de complément redemandent au moteur une partie de ce qu'il a
  // déjà rendu : sans déduplication, le même lien reviendrait autant de fois
  // qu'il y a eu de tours, et la liste compterait des doublons.
  const uniques = dedupeByUrl(hits);

  return {
    hits: uniques.slice(0, cible),
    images,
    news: dedupeNews(news).slice(0, cible),
  };
}

/**
 * Déduplique les actualités par URL, en gardant la première occurrence.
 *
 * Trois flux peuvent rendre le même article (You.com, Google News, GDELT) :
 * sans cette passe, l'onglet « Actualités » afficherait trois fois le même
 * titre et l'utilisateur croirait à une redondance du moteur.
 */
function dedupeNews(hits: SearchNewsHit[]): SearchNewsHit[] {
  const seen = new Set<string>();
  return hits.filter((hit) => {
    const key = hit.url.trim();
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * GDELT — actualités mondiales, sans clé.
 *
 * Le flux Google News est le chemin principal, mais il est muet pour certaines
 * requêtes (marques, événements très récents, langues peu couvertes) et il est
 * hébergé par un service qui peut limiter. GDELT indexe la presse mondiale et
 * répond en JSON ouvert : c'est le second regard, pas le remplaçant.
 *
 * `timespan` est borné à une semaine : une « actualité » de trois mois n'en est
 * plus une, et le tri par date n'a de sens que sur une fenêtre courte.
 */
const GDELT_LANGUAGE: Record<MaiSearchLanguage, string> = {
  de: "german",
  en: "english",
  es: "spanish",
  fr: "french",
  it: "italian",
};

async function fetchGdeltNews(
  query: string,
  limit = 15,
  lang: MaiSearchLanguage = "fr"
): Promise<SearchNewsHit[]> {
  try {
    const url = new URL("https://api.gdeltproject.org/api/v2/doc/doc");
    url.searchParams.set(
      "query",
      `${query} sourcelang:${GDELT_LANGUAGE[lang]}`
    );
    url.searchParams.set("mode", "artlist");
    url.searchParams.set("format", "json");
    url.searchParams.set("maxrecords", String(Math.min(limit, 75)));
    url.searchParams.set("sort", "datedesc");
    url.searchParams.set("timespan", "1week");
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "mAI-Search/1.0" },
      signal: AbortSignal.timeout(3500),
    });
    if (!res.ok) {
      return [];
    }
    const data: unknown = await res.json().catch(() => null);
    const record =
      data && typeof data === "object" ? (data as { articles?: unknown }) : {};
    const articles = Array.isArray(record.articles)
      ? (record.articles as Record<string, unknown>[])
      : [];
    return articles
      .map((article): SearchNewsHit | null => {
        const title = String(article.title ?? "").trim();
        const link = String(article.url ?? "").trim();
        if (!title || !link) {
          return null;
        }
        const domain = String(article.domain ?? "").trim();
        return {
          favicon_url: buildFaviconUrl(link),
          page_age:
            typeof article.seendate === "string" ? article.seendate : undefined,
          snippet: domain ? `Article publié par ${domain}.` : title,
          source: domain || undefined,
          thumbnail_url:
            typeof article.socialimage === "string"
              ? article.socialimage
              : undefined,
          title,
          url: link,
        } satisfies SearchNewsHit;
      })
      .filter((hit): hit is SearchNewsHit => hit !== null)
      .slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * Variantes d'une recherche approfondie.
 *
 * Une seule formulation laisse hors champ ce que l'utilisateur n'a pas pensé
 * à nommer. Deux reformulations suffisent : demander « explication » et
 * « guide » ramène les pages de fond que la requête nue classe derrière des
 * actualités. Au-delà, on paierait trois fois le même résultat.
 */
const DEEP_SUFFIXES: Record<MaiSearchLanguage, readonly string[]> = {
  de: ["erklärt", "vollständiger Leitfaden"],
  en: ["explained in depth", "complete guide"],
  es: ["explicación detallada", "guía completa"],
  fr: ["explication détaillée", "guide complet"],
  it: ["spiegazione dettagliata", "guida completa"],
};

async function fetchDeepVariants(
  query: string,
  count: number,
  lang: MaiSearchLanguage
): Promise<{
  hits: SearchWebHit[];
  images: SearchImageHit[];
  news: SearchNewsHit[];
}> {
  const parVariante = Math.max(5, Math.ceil(count / 2));
  const resultats = await Promise.allSettled(
    DEEP_SUFFIXES[lang].map((suffix) =>
      fetchYouWeb(`${query} ${suffix}`, parVariante)
    )
  );
  const hits: SearchWebHit[] = [];
  const images: SearchImageHit[] = [];
  const news: SearchNewsHit[] = [];
  for (const resultat of resultats) {
    if (resultat.status === "fulfilled") {
      hits.push(...resultat.value.hits);
      images.push(...resultat.value.images);
      news.push(...resultat.value.news);
    }
  }
  return { hits: dedupeByUrl(hits), images, news: dedupeNews(news) };
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
              favicon_url: buildFaviconUrl(link),
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
          favicon_url: buildFaviconUrlForDomain("youtube.com"),
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
  /**
   * Recherche approfondie : deux reformulations de la requête partent en
   * parallèle, et leurs résultats rejoignent la liste commune.
   *
   * C'est un MODE, pas une source : il ne change pas ce que l'utilisateur a
   * activé, seulement l'effort consacré à le trouver. Il coûte deux appels de
   * plus au moteur, d'où le choix explicite.
   */
  deep?: boolean;
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
  const wantVideos = sources.includes("videos");
  const wantWikipedia = sources.includes("wikipedia");

  const count = Math.max(
    1,
    Math.min(params.count || 20, MAI_SEARCH_RESULT_COUNT_MAX)
  );

  /**
   * La clé de cache porte le VOLUME, en seaux.
   *
   * Sans elle, la première recherche venue fixerait la longueur du cache pour
   * toutes les autres : un compte gratuit demandant 50 résultats aurait
   * laissé dans le cache un tableau de 50, qu'un compte Max aurait reçu en
   * attendant 200. Le seau évite l'explosion du cache (une entrée par tranche
   * de 25, pas par valeur exacte) tout en gardant les volumes séparés.
   */
  const countBucket = Math.ceil(count / 25) * 25;
  const deep = params.deep === true;
  const cacheKey = `${sources.join(",")}:${lang}:${safetyLevel}:${deep ? "deep" : "std"}:${countBucket}:${trimmed.toLowerCase()}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

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
    gdeltResult,
    deepResult,
  ] = await Promise.allSettled([
    wantWeb
      ? fetchYouWeb(trimmed, count)
      : Promise.resolve({ hits: [], images: [], news: [] }),
    // Les sources suivent le volume demandé, et chacune à son propre rythme :
    // le flux d'actualité rend au mieux une quincaine de titres, YouTube une
    // dizaine de vidéos. Le plafond du compte s'applique donc PAR SOURCE —
    // une source muette n'en prive pas les autres.
    wantImages
      ? fetchYouImages(trimmed, Math.min(count, 60))
      : Promise.resolve([]),
    wantNews
      ? fetchGoogleNews(trimmed, Math.min(count, 30), lang)
      : Promise.resolve([]),
    wantWikipedia
      ? fetchWikipediaWeb(trimmed, count, lang)
      : Promise.resolve([] as SearchWebHit[]),
    // Repli web : Wikipédia en recherche ouverte, puis le flux d'actualité.
    wantWeb
      ? fallbackSearch(trimmed, lang)
      : Promise.resolve([] as SearchWebHit[]),
    // Repli images : les vignettes de l'encyclopédie.
    wantImages
      ? fetchWikiImages(trimmed, Math.min(count, 12), lang)
      : Promise.resolve([]),
    // Repli vidéos : la recherche YouTube, quand les liens web n'en
    // contiennent aucun.
    wantVideos
      ? fetchYouTubeVideos(trimmed)
      : Promise.resolve([] as SearchVideoHit[]),
    // Second regard sur l'actualité, en parallèle : il ne coûte pas de
    // délai, seulement une requête.
    wantNews
      ? fetchGdeltNews(trimmed, Math.min(count, 30), lang)
      : Promise.resolve([] as SearchNewsHit[]),
    // Reformulations de la recherche approfondie (mode explicite).
    deep && wantWeb
      ? fetchDeepVariants(trimmed, count, lang)
      : Promise.resolve({
          hits: [] as SearchWebHit[],
          images: [] as SearchImageHit[],
          news: [] as SearchNewsHit[],
        }),
  ]);

  const webData =
    webResult.status === "fulfilled"
      ? webResult.value
      : { hits: [], images: [], news: [] };
  const dedicatedImages =
    imagesResult.status === "fulfilled" ? imagesResult.value : [];
  // Fusion des trois regards sur l'actualité : You.com (rendu avec le Web),
  // Google News, puis GDELT. L'ordre est celui de la fraîcheur et de la
  // qualité d'extrait ; la déduplication retire les recouvrements.
  const newsHits = dedupeNews([
    ...webData.news,
    ...(newsResult.status === "fulfilled" ? newsResult.value : []),
    ...(gdeltResult.status === "fulfilled" ? gdeltResult.value : []),
  ]);
  const wikiHits = wikiResult.status === "fulfilled" ? wikiResult.value : [];
  const fallbackHits =
    fallbackResult.status === "fulfilled" ? fallbackResult.value : [];
  const wikiImages =
    wikiImagesResult.status === "fulfilled" ? wikiImagesResult.value : [];
  const youtubeVideos =
    youtubeResult.status === "fulfilled" ? youtubeResult.value : [];

  const deepData =
    deepResult.status === "fulfilled"
      ? deepResult.value
      : { hits: [], images: [], news: [] };

  let results = webData.hits;
  if (deep && deepData.hits.length > 0) {
    results = dedupeByUrl([...results, ...deepData.hits]);
  }
  let allImages = [...dedicatedImages, ...webData.images, ...deepData.images];

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
  // Une actualité trouvée par un flux de presse est un résultat You.com du
  // point de vue de l'utilisation : c'est `/v1/search` qui l'a rendue, ou une
  // source de remplacement assumée, pas une panne du moteur.
  if (newsHits.length > 0) {
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
  if (videos.length === 0 && wantVideos) {
    videos = youtubeVideos;
  }

  // S'assurer que chaque hit a un favicon garanti
  results = results.map((r) => ({
    ...r,
    favicon_url: buildFaviconUrl(r.url),
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

  /**
   * La demande n'a-t-elle pas été satisfaite ?
   *
   * Vrai quand une source a rendu moins de liens que demandé — le moteur
   * tronque, ou la source est simplement muette. L'interface le dit alors :
   * une recherche qui rend 40 liens sur 200 demandés ne doit pas se faire
   * passer pour exhaustive.
   */
  const truncated =
    (wantWeb && webResults.length < count) ||
    (wantNews && newsLimited.length < count) ||
    (wantImages && imagesLimited.length < count) ||
    (wantVideos && videosLimited.length < count);

  const provider: SearchResponse["provider"] =
    providers.size > 1
      ? "mixed"
      : providers.size === 1
        ? ([...providers][0] as SearchResponse["provider"])
        : "you.com";

  const response: SearchResponse = {
    deep,
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
    truncated,
    videos: videosLimited,
    wikiFirst,
  };

  if (response.success) {
    setInCache(cacheKey, response);
  }

  return response;
}
