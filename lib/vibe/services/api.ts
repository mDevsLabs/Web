/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — API CLIENT (src/services/api.ts)
 * Centralized API calls to https://mai.val.run with JWT Bearer token
 * Uses standard /v1/ prefixes
 * ============================================================================
 */

import { MAI_API_URL } from "@/lib/constants";
import { AppStorage } from "@/lib/vibe/services/storageAdapter";
import type {
  BookComment,
  Comment,
  DirectMessage,
  DMConversation,
  MAIConversationSummary,
  MAIQuotas,
  MaiToolCall,
  NotificationItem,
  Poll,
  Post,
  Profile,
  ProfileListUser,
  ServerDraft,
  UnifiedSearchResult,
  User,
  UserSettings,
  VibeBook,
  VibeBookMember,
  VibeBookPost,
} from "@/lib/vibe/types/vibe";

/**
 * Base des appels Vibe.
 *
 * La version Vite lisait `import.meta.env.VITE_API_URL` : ce globals n'existe
 * pas sous Next, la valeur était donc TOUJOURS le repli `https://mai.val.run`.
 * On lit donc directement la constante de l'hôte (`MAI_API_URL`), qui suit
 * `NEXT_PUBLIC_MAI_API_URL` et pointe sur le même backend — une seule source de
 * vérité, plus de divergence possible entre les deux applications.
 *
 * Le préfixe localhost qui renvoyait une chaîne vide (laisser le proxy Vite
 * relayer vers le backend) n'a plus cours : sous Next, les appels Vibe sont
 * directs, comme tous les autres appels de l'application.
 */
export const API_BASE = MAI_API_URL;

// ─────────────────────────────────────────────
// TRADUCTION (DeepL) — langues cibles & résolution de la langue utilisateur
// ─────────────────────────────────────────────
/** Résultat de POST /v1/translate (DeepL, repli mAI côté serveur). */
export interface TranslateResult {
  cached?: boolean;
  detected_language: string;
  /** Moteur réellement utilisé : 'deepl' ou 'mai' (repli). */
  provider?: "deepl" | "mai";
  /** true si le contenu source est déjà dans la langue cible. */
  same_language?: boolean;
  success: boolean;
  target_lang?: string;
  translation: string;
}

/** Périodes supportées par les endpoints stats (?period=). */
export type StatsPeriod = "7d" | "30d" | "90d" | "12m";

/** Point quotidien d'une série stats créateur. */
export interface CreatorSeriesPoint {
  day: string;
  likes: number;
  profile_views: number;
  replies: number;
  reposts: number;
  views: number;
}

/** Statistiques créateur agrégées (champs historiques + séries à période). */
export interface CreatorStats {
  /** Jour le plus vu (événement vues) de la période. */
  best_day?: { day: string; views: number } | null;
  /** Jour de publication le plus performant. */
  best_publish_day?: { day: string; views: number; posts: number } | null;
  daily: Array<{ day: string; views: number; posts: number }>;
  /** Taux d'engagement global (%). */
  engagement_rate?: number;
  /** Répartition horaire des vues (0-23). */
  hourly?: Array<{ hour: number; views: number }>;
  period?: string;
  posts_count: number;
  /** Fréquence de publication (posts/semaine). */
  posts_per_week?: number;
  /** Période précédente (comparaison de croissance). */
  previous_period?: {
    total_views: number;
    total_likes: number;
    total_reposts: number;
    total_replies: number;
    posts_count: number;
  } | null;
  profile_views?: number;
  series?: CreatorSeriesPoint[];
  sources?: Array<{ source: string; views: number }>;
  top_post: Post | null;
  /** Top 5 des publications les plus engageantes. */
  top_posts?: Array<Post & { engagement?: number }>;
  total_likes: number;
  total_replies: number;
  total_reposts: number;
  total_views: number;
}

/** Statistiques d'un post (auteur uniquement). */
export interface PostStats {
  bookmarks: number;
  engagement_rate: number;
  likes: number;
  period?: string;
  reach?: Array<{ day: string; views: number }>;
  reach_7d: Array<{ day: string; views: number }>;
  replies: number;
  reposts: number;
  top_referrers: unknown[];
  views: number;
}

/** Langues cibles supportées par DeepL (libellés français). */
export const TRANSLATION_LANGUAGES: Array<{ code: string; label: string }> = [
  { code: "AR", label: "Arabe" },
  { code: "BG", label: "Bulgare" },
  { code: "CS", label: "Tchèque" },
  { code: "DA", label: "Danois" },
  { code: "DE", label: "Allemand" },
  { code: "EL", label: "Grec" },
  { code: "EN-US", label: "Anglais (États-Unis)" },
  { code: "EN-GB", label: "Anglais (Royaume-Uni)" },
  { code: "ES", label: "Espagnol" },
  { code: "ET", label: "Estonien" },
  { code: "FI", label: "Finnois" },
  { code: "FR", label: "Français" },
  { code: "HE", label: "Hébreu" },
  { code: "HU", label: "Hongrois" },
  { code: "ID", label: "Indonésien" },
  { code: "IT", label: "Italien" },
  { code: "JA", label: "Japonais" },
  { code: "KO", label: "Coréen" },
  { code: "LT", label: "Lituanien" },
  { code: "LV", label: "Letton" },
  { code: "NB", label: "Norvégien" },
  { code: "NL", label: "Néerlandais" },
  { code: "PL", label: "Polonais" },
  { code: "PT-BR", label: "Portugais (Brésil)" },
  { code: "PT-PT", label: "Portugais (Portugal)" },
  { code: "RO", label: "Roumain" },
  { code: "RU", label: "Russe" },
  { code: "SK", label: "Slovaque" },
  { code: "SL", label: "Slovène" },
  { code: "SV", label: "Suédois" },
  { code: "TR", label: "Turc" },
  { code: "UK", label: "Ukrainien" },
  { code: "VI", label: "Vietnamien" },
  { code: "ZH", label: "Chinois" },
];

/** Convertit une langue de navigateur (« fr-FR ») en code DeepL (« FR »). */
export function browserToDeepLCode(tag: string): string {
  const lower = String(tag || "")
    .trim()
    .toLowerCase();
  if (!lower) return "EN-US";
  const region = (lower.split("-")[1] || "").toUpperCase();
  const base = lower.slice(0, 2);
  if (base === "en") return region === "GB" ? "EN-GB" : "EN-US";
  if (base === "pt") return region === "BR" ? "PT-BR" : "PT-PT";
  const generic = TRANSLATION_LANGUAGES.find(
    (l) => l.code.toLowerCase() === base
  );
  return generic ? generic.code : "EN-US";
}

// ─────────────────────────────────────────────
// CACHE GET (TTL court) + dédoublonnage des requêtes en vol.
// Réduit fortement les latences perçues (feed, profils, DMs…).
// Toute écriture invalide le cache pour rester cohérent.
// ─────────────────────────────────────────────
const GET_CACHE_TTL = 15_000;
const OFFLINE_FEED_KEYS = [
  "vibe_offline_feed_for_you",
  "vibe_offline_feed_stream",
  "vibe_offline_feed_trending",
] as const;

interface CacheEntry {
  data: any;
  ts: number;
}

/* biome-ignore lint/complexity/noStaticOnlyClass: espace de noms du client API — quatre états privés (cache, requêtes en vol, générations) sont encapsulés par la classe et partagés par 146 appels statiques ; un objet littéral les remonterait au niveau du module sans bénéfice. */
export class ApiService {
  private static cache = new Map<string, CacheEntry>();
  private static inflight = new Map<string, Promise<any>>();
  // Une réponse déjà partie en vol ne doit pas repeupler le cache après une purge.
  private static cacheGeneration = 0;
  private static sessionGeneration = 0;

  private static cacheGet<T>(
    endpoint: string,
    ttlMs: number = GET_CACHE_TTL
  ): Promise<T> | null {
    const hit = ApiService.cache.get(endpoint);
    if (hit && Date.now() - hit.ts < ttlMs)
      return Promise.resolve(hit.data as T);
    return null;
  }

  private static async cachedRequest<T>(
    endpoint: string,
    ttlMs: number = GET_CACHE_TTL
  ): Promise<T> {
    const cached = ApiService.cacheGet<T>(endpoint, ttlMs);
    if (cached) return cached;

    const pending = ApiService.inflight.get(endpoint);
    if (pending) return pending as Promise<T>;

    const generation = ApiService.cacheGeneration;
    const p: Promise<T> = ApiService.request<T>(endpoint)
      .then((data) => {
        if (generation === ApiService.cacheGeneration) {
          ApiService.cache.set(endpoint, { data, ts: Date.now() });
        }
        return data;
      })
      .finally(() => {
        // Ne pas supprimer une requête plus récente lancée après une invalidation.
        if (ApiService.inflight.get(endpoint) === p)
          ApiService.inflight.delete(endpoint);
      });

    ApiService.inflight.set(endpoint, p);
    return p;
  }

  /**
   * Purge complète du cache mémoire, y compris les dédoublonnages en vol.
   * Les réponses déjà lancées ne peuvent plus réinjecter leurs données.
   * TEST: invalider puis résoudre une promesse GET ne doit pas recréer une entrée.
   */
  static clearCache(): void {
    ApiService.cacheGeneration += 1;
    ApiService.cache.clear();
    ApiService.inflight.clear();
  }

  /** Invalide tout ou partie du cache GET (préfixe d'endpoint, ex. '/v1/dms'). */
  static invalidateCache(prefix?: string) {
    if (!prefix) {
      ApiService.clearCache();
      return;
    }

    ApiService.cacheGeneration += 1;
    for (const key of Array.from(ApiService.cache.keys())) {
      if (key.includes(prefix)) ApiService.cache.delete(key);
    }
    for (const key of Array.from(ApiService.inflight.keys())) {
      if (key.includes(prefix)) ApiService.inflight.delete(key);
    }
  }

  /** Supprime les seuls snapshots explicitement enregistrés pour le mode hors-ligne. */
  static clearOfflineData(): void {
    for (const key of OFFLINE_FEED_KEYS) AppStorage.removeItem(key);
    // Couvre aussi une clé offline future, sans toucher aux préférences de thème
    // ou aux brouillons explicitement gérés par une autre couche.
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        for (const key of Object.keys(window.localStorage)) {
          if (key.startsWith("vibe_offline_")) AppStorage.removeItem(key);
        }
      }
    } catch {}
  }

  /** Précharge les profils auteurs d'un flux pour un affichage instantané des pages profil. */
  static prefetchProfiles(
    posts: Array<{ username?: string; author_id?: string }>
  ): void {
    const usernames = Array.from(
      new Set(
        posts.map((p) => p.username).filter((u): u is string => Boolean(u))
      )
    ).slice(0, 8);
    for (const u of usernames) ApiService.prefetchProfile(u);
  }

  /** Précharge en arrière-plan le profil + ses posts (sans bloquer l'UI). */
  static prefetchProfile(username: string): void {
    const cleanUser = username.trim().replace(/^@/, "");
    const endpoint = `/v1/profiles/${encodeURIComponent(cleanUser)}`;
    ApiService.cachedRequest(endpoint, 60_000).catch(() => {});
  }
  static getToken(): string | null {
    return AppStorage.getItem("vibe_jwt_token");
  }

  static setToken(token: string) {
    const previousToken = ApiService.getToken();
    if (previousToken && previousToken !== token) {
      ApiService.sessionGeneration += 1;
      ApiService.clearCache();
      ApiService.clearOfflineData();
      AppStorage.removeItem("vibe_user_data");
    }
    AppStorage.setItem("vibe_jwt_token", token);
  }

  static removeToken() {
    // Une déconnexion est une frontière de session : ni cache mémoire, ni snapshot
    // hors-ligne, ni réponse GET déjà en vol ne doit conserver l'identité précédente.
    ApiService.sessionGeneration += 1;
    ApiService.clearCache();
    AppStorage.removeItem("vibe_jwt_token");
    AppStorage.removeItem("vibe_user_data");
    ApiService.clearOfflineData();
  }

  /** Révoque le token courant côté serveur sans bloquer la fermeture locale. */
  static async revokeSession(
    token: string | null = ApiService.getToken()
  ): Promise<void> {
    if (!token) return;
    try {
      await fetch(`${API_BASE}/v1/logout`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        method: "POST",
      });
    } catch {
      // La purge locale restePrioritaire même si le réseau est indisponible.
    }
  }

  /** Langue cible de traduction : réglage utilisateur (miroir local), sinon langue du navigateur. */
  static resolveTargetLanguage(): string {
    const stored = String(AppStorage.getItem("vibe_ui_language") || "")
      .trim()
      .toUpperCase();
    if (stored && TRANSLATION_LANGUAGES.some((l) => l.code === stored))
      return stored;
    return browserToDeepLCode(
      typeof navigator === "undefined" ? "" : navigator.language
    );
  }

  /** Miroir local de la langue de traduction (évite un appel settings à chaque traduction). */
  static setUiLanguageMirror(lang: string) {
    AppStorage.setItem("vibe_ui_language", lang);
  }

  /**
   * `/api/vibe/...` est l'alias de routage historique de `/v1/...`.
   * 404/405 prouvent que la route primaire n'existe pas ; aucun autre statut ne
   * doit déclencher une seconde écriture (401/403/429/5xx/réseau compris).
   * TEST: primary=404|405 => un alias ; primary=autre erreur/network => un seul fetch.
   */
  private static shouldRetryVibeAlias(error: any): boolean {
    return error?.status === 404 || error?.status === 405;
  }

  private static toVibeAliasEndpoint(endpoint: string): string | null {
    if (
      typeof endpoint !== "string" ||
      (endpoint !== "/v1" && !endpoint.startsWith("/v1/"))
    )
      return null;
    return `/api/vibe${endpoint.slice("/v1".length)}`;
  }

  /** Un seul essai réseau/HTTP. La politique d'alias est centralisée dans request(). */
  private static async executeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = ApiService.getToken();
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const url = endpoint.startsWith("http")
      ? endpoint
      : `${API_BASE}${endpoint}`;
    const method = (options.method || "GET").toUpperCase();
    const isReadRequest = method === "GET" || method === "HEAD";

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
      });
    } catch (networkErr: any) {
      // Le repli proxy local n'est sûr que pour une lecture. Répéter une écriture
      // après « Failed to fetch » pourrait dupliquer une mutation déjà arrivée au serveur.
      const isLocalhost =
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1");

      if (
        isReadRequest &&
        url.startsWith("https://mai.val.run") &&
        isLocalhost
      ) {
        try {
          response = await fetch(endpoint, {
            ...options,
            headers,
          });
        } catch {
          throw networkErr;
        }
      } else {
        throw networkErr;
      }
    }

    if (!response.ok) {
      const errJson = (await response.json().catch(() => ({}))) || {};
      const err = new Error(
        errJson.error || `Erreur (${response.status})`
      ) as any;
      err.status = response.status;
      // Code machine optionnel renvoyé par le backend (ex. 'PIN_LIMIT')
      if (errJson.code) err.code = errJson.code;
      err.body = errJson;
      throw err;
    }

    // Les GET sont déjà couverts par !isReadRequest. Exclure aussi les trackers
    // de vue POST : une visite simple ne doit pas créer elle-même un usage API.
    // TEST: viewPost/trackProfileView => aucun POST /v1/usage/log.
    const SKIP_LOG_PATTERNS = [
      "/usage/log",
      "/like",
      "/repost",
      "/bookmark",
      "/notifications/read",
      "/models",
    ];
    const isViewEvent = /\/view\/?(?:\?|$)/.test(endpoint);
    const shouldLog =
      !isReadRequest &&
      !isViewEvent &&
      !SKIP_LOG_PATTERNS.some((p) => endpoint.includes(p));

    if (shouldLog) {
      ApiService.logUsage(endpoint).catch(() => {});
    }

    const json = await response.json();

    if (!isReadRequest) {
      ApiService.invalidateCache();
    }

    return json;
  }

  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const aliasEndpoint = ApiService.toVibeAliasEndpoint(endpoint);
    const sessionGeneration = ApiService.sessionGeneration;
    try {
      return await ApiService.executeRequest<T>(endpoint, options);
    } catch (error) {
      // Si la session a changé entre les deux essais, ne jamais porter une
      // mutation vers le compte suivant.
      if (sessionGeneration !== ApiService.sessionGeneration) throw error;
      if (!aliasEndpoint || !ApiService.shouldRetryVibeAlias(error))
        throw error;
      return ApiService.executeRequest<T>(aliasEndpoint, options);
    }
  }

  /**
   * Upload séparé de request() afin de laisser le navigateur gérer le boundary
   * multipart. Chaque fetch construit son propre FormData : un FormData déjà
   * consommé par le premier essai ne doit jamais être renvoyé au fallback.
   * TEST: primary 404/405 => deux instances FormData ; 401/429/500/réseau => une seule.
   */
  private static async uploadWithFallback<T>(
    primaryEndpoint: string,
    fallbackEndpoint: string,
    field: string,
    file: File,
    errorMessage: string
  ): Promise<T> {
    const send = async (endpoint: string): Promise<Response> => {
      const formData = new FormData();
      formData.append(field, file);
      const token = ApiService.getToken();
      const headers: Record<string, string> = { Accept: "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      // Une exception réseau est propagée telle quelle : aucune écriture n'est rejouée.
      return fetch(`${API_BASE}${endpoint}`, {
        body: formData,
        headers,
        method: "POST",
      });
    };

    const toError = async (response: Response): Promise<any> => {
      const body = (await response.json().catch(() => ({}))) || {};
      const error = new Error(body.error || errorMessage) as any;
      error.status = response.status;
      error.body = body;
      return error;
    };

    const sessionGeneration = ApiService.sessionGeneration;
    let response: Response = await send(primaryEndpoint);

    if (!response.ok) {
      const error = await toError(response);
      if (
        !ApiService.shouldRetryVibeAlias(error) ||
        sessionGeneration !== ApiService.sessionGeneration
      )
        throw error;
      // send() recrée le FormData et relit le jeton courant.
      response = await send(fallbackEndpoint);
      if (!response.ok) throw await toError(response);
    }

    return response.json() as Promise<T>;
  }

  // ─────────────────────────────────────────────
  // AUTHENTICATION & CURRENT USER
  // ─────────────────────────────────────────────
  static async register(email: string, username: string, password: string) {
    return ApiService.request<{
      success: boolean;
      email: string;
      status: string;
    }>("/register", {
      body: JSON.stringify({ email, password, username }),
      method: "POST",
    });
  }

  static async verifyRegister(
    email: string,
    username: string,
    password: string,
    code: string
  ) {
    const res = await ApiService.request<{
      success: boolean;
      token: string;
      tier: string;
    }>("/verify-register", {
      body: JSON.stringify({ code, email, password, username }),
      method: "POST",
    });
    if (res.token) {
      ApiService.setToken(res.token);
    }
    return res;
  }

  static async login(identifier: string, password: string) {
    return ApiService.request<{
      success: boolean;
      email: string;
      status: string;
    }>("/login", {
      body: JSON.stringify({ identifier, password }),
      method: "POST",
    });
  }

  static async verifyLogin(email: string, code: string) {
    const res = await ApiService.request<{
      success: boolean;
      token: string;
      tier: string;
    }>("/verify-login", {
      body: JSON.stringify({ code, email }),
      method: "POST",
    });
    if (res.token) {
      ApiService.setToken(res.token);
    }
    return res;
  }

  static async resendCode(email: string, action = "login") {
    return ApiService.request<{ success: boolean; error?: string }>(
      "/resend-code",
      {
        body: JSON.stringify({ action, email }),
        method: "POST",
      }
    );
  }

  static async getCurrentUser(): Promise<{
    user: User;
    profile: Profile;
    quotas: MAIQuotas;
  }> {
    return ApiService.request<{
      user: User;
      profile: Profile;
      quotas: MAIQuotas;
    }>("/v1/me");
  }

  static async getSuggestedUsers(): Promise<{
    users: Array<{
      id: string | number;
      username: string;
      display_name?: string;
      avatar_url?: string;
      bio?: string;
    }>;
  }> {
    return ApiService.request("/v1/users/suggested");
  }

  // ─────────────────────────────────────────────
  // FEEDS & POSTS & TRENDS
  // ─────────────────────────────────────────────
  static async getFeed(
    type: "for_you" | "stream" | "trending" = "for_you",
    tag?: string,
    cursor?: string
  ): Promise<{
    posts: Post[];
    mode: string;
    title: string;
    nextCursor?: string | null;
  }> {
    const queryParams = new URLSearchParams({ type });
    if (tag) queryParams.append("tag", tag);
    if (cursor) queryParams.append("cursor", cursor);
    const sessionGeneration = ApiService.sessionGeneration;
    const cacheGeneration = ApiService.cacheGeneration;

    try {
      const res = await ApiService.request<{
        posts: Post[];
        mode: string;
        title: string;
        nextCursor?: string | null;
      }>(`/v1/feed?${queryParams.toString()}`);

      // Ne pas recréer un snapshot après un logout ou une écriture survenu pendant le fetch.
      if (
        !cursor &&
        !tag &&
        res?.posts &&
        res.posts.length > 0 &&
        sessionGeneration === ApiService.sessionGeneration &&
        cacheGeneration === ApiService.cacheGeneration
      ) {
        AppStorage.setJSON(`vibe_offline_feed_${type}`, res);
      }
      return res;
    } catch (networkErr) {
      // Fallback gracieux en mode hors-ligne : récupérer le dernier flux en cache local.
      const cached =
        sessionGeneration === ApiService.sessionGeneration &&
        cacheGeneration === ApiService.cacheGeneration
          ? AppStorage.getJSON<{
              posts: Post[];
              mode: string;
              title: string;
            } | null>(`vibe_offline_feed_${type}`, null)
          : null;
      if (cached?.posts && cached.posts.length > 0) {
        return {
          ...cached,
          nextCursor: null,
          title: `${cached.title || "Flux"} (Hors-ligne)`,
        };
      }
      throw networkErr;
    }
  }

  static async getTrends(): Promise<{
    success: boolean;
    trends: Array<{
      tag: string;
      category?: string;
      posts: string;
      post_count?: number;
    }>;
  }> {
    try {
      return await ApiService.cachedRequest("/v1/trends", 60_000);
    } catch {
      // Aucun fallback statique — retourner une liste vide si le backend est inaccessible
      return { success: false, trends: [] };
    }
  }

  /** Top Vibe — meilleures publications des N derniers jours (Explorer). */
  static async getTopPosts(
    limit = 5,
    days = 30
  ): Promise<{ success: boolean; posts: Post[] }> {
    const qs = `?limit=${limit}&days=${days}`;
    try {
      return await ApiService.cachedRequest(`/v1/posts/top${qs}`, 60_000);
    } catch {
      return { posts: [], success: false };
    }
  }

  /** Top Vibers — comptes les plus suivis (Explorer). */
  static async getTopVibers(limit = 5): Promise<{
    users: Array<{
      id: number;
      username: string;
      display_name?: string;
      avatar_url?: string;
      is_verified?: boolean;
      followers_count?: number;
      bio?: string;
      is_following?: boolean;
    }>;
  }> {
    const qs = `?limit=${limit}`;
    try {
      return await ApiService.cachedRequest(`/v1/users/top${qs}`, 60_000);
    } catch {
      return { users: [] };
    }
  }

  static async searchUsers(q: string): Promise<{
    users: Array<{
      id: number;
      username: string;
      display_name?: string;
      avatar_url?: string;
      is_verified?: boolean;
      followers_count?: number;
    }>;
  }> {
    try {
      return await ApiService.request(
        `/v1/search/users?q=${encodeURIComponent(q)}`
      );
    } catch (error: any) {
      // Le troisième endpoint est une ancienne route métier, pas l'alias /api/vibe.
      // On ne l'essaie que si les deux routes de recherche ont réellement disparu.
      if (!ApiService.shouldRetryVibeAlias(error)) return { users: [] };
      try {
        return await ApiService.request(
          `/v1/dms/users?q=${encodeURIComponent(q)}`
        );
      } catch {
        return { users: [] };
      }
    }
  }

  static async searchPosts(
    q: string,
    limit = 20,
    offset = 0
  ): Promise<{ posts: Post[]; count: number }> {
    try {
      return await ApiService.request(
        `/v1/search/posts?q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}`
      );
    } catch {
      return { count: 0, posts: [] };
    }
  }

  /** Recherche globale unifiée : posts + utilisateurs + livres + DMs (limit/section). */
  static async searchUnified(
    q: string,
    limit = 5
  ): Promise<UnifiedSearchResult> {
    try {
      return await ApiService.cachedRequest<UnifiedSearchResult>(
        `/v1/search/unified?q=${encodeURIComponent(q)}&limit=${limit}`,
        15_000
      );
    } catch {
      return { books: [], messages: [], posts: [], total: 0, users: [] };
    }
  }

  /** Vote (modifiable) à un sondage de post. */
  static async votePoll(
    postId: string,
    optionId: string
  ): Promise<{ success: boolean; poll: Poll }> {
    ApiService.invalidateCache("/v1/posts/");
    return ApiService.request(`/v1/posts/${postId}/poll/vote`, {
      body: JSON.stringify({ option_id: optionId }),
      method: "POST",
    });
  }

  /** Statistiques créateur d'un post (auteur uniquement). */
  static async getPostStats(
    postId: string,
    period: StatsPeriod = "7d"
  ): Promise<PostStats> {
    return ApiService.cachedRequest(
      `/v1/posts/${postId}/stats?period=${period}`,
      30_000
    );
  }

  /** Statistiques créateur agrégées (?period=7d|30d|90d|12m, défaut 30d). */
  static async getCreatorStats(
    period: StatsPeriod = "30d"
  ): Promise<CreatorStats> {
    return ApiService.cachedRequest(
      `/v1/users/me/creator-stats?period=${period}`,
      60_000
    );
  }

  /** Visites profil agrégées (?period=7d|30d|90d|12m, défaut 30d, soi-même uniquement). */
  static async getProfileViews(period: StatsPeriod = "30d"): Promise<{
    period: string;
    total: number;
    series: Array<{ day: string; views: number }>;
  }> {
    return ApiService.cachedRequest(
      `/v1/users/me/profile-views?period=${period}`,
      60_000
    );
  }

  /** Track une visite profil (fire-and-forget, anti-spam serveur 1/24h, pas d'auto-comptage). */
  static async trackProfileView(
    username: string,
    source = "profile"
  ): Promise<{ success: boolean; counted?: boolean }> {
    const clean = username.replace(/^@/, "");
    if (!clean) return { success: false };
    const body = JSON.stringify({ source });
    try {
      return await ApiService.request(
        `/v1/profiles/${encodeURIComponent(clean)}/view`,
        { body, method: "POST" }
      );
    } catch {
      return { success: false };
    }
  }

  /** Traduction d'un texte brut (ex : message DM) via /v1/ai/translate. */
  static async translateText(
    text: string,
    targetLang: string
  ): Promise<TranslateResult> {
    return ApiService.request("/v1/ai/translate", {
      body: JSON.stringify({ target_lang: targetLang, text }),
      method: "POST",
    });
  }

  /** Suggestions de comptes pour l'onboarding (10 populaires non suivis). */
  static async getOnboardingSuggestions(): Promise<{
    users: Array<{
      id: number;
      username: string;
      display_name?: string;
      avatar_url?: string;
      is_verified?: boolean;
      followers_count?: number;
      bio?: string;
    }>;
  }> {
    try {
      return await ApiService.cachedRequest(
        "/v1/onboarding/suggestions",
        60_000
      );
    } catch {
      return { users: [] };
    }
  }

  /** Marque l'onboarding comme terminé. */
  static async completeOnboarding(): Promise<{ success: boolean }> {
    return ApiService.request("/v1/onboarding/complete", { method: "POST" });
  }

  /** Épingle un message dans une conversation (max 3, adressage partnerId). */
  static async pinMessage(
    partnerId: string | number,
    messageId: string
  ): Promise<{ success: boolean; pinned: boolean }> {
    ApiService.invalidateCache("/dms/");
    return ApiService.request(`/v1/dms/conversations/${partnerId}/pin`, {
      body: JSON.stringify({ message_id: messageId }),
      method: "POST",
    });
  }

  /** Désépingle un message d'une conversation. */
  static async unpinMessage(
    partnerId: string | number,
    messageId: string
  ): Promise<{ success: boolean; pinned: boolean }> {
    ApiService.invalidateCache("/dms/");
    return ApiService.request(
      `/v1/dms/conversations/${partnerId}/pin/${messageId}`,
      { method: "DELETE" }
    );
  }

  /** Recherche plein texte dans une conversation DM. */
  static async searchDMMessages(
    partnerId: string | number,
    q: string
  ): Promise<{ messages: DirectMessage[] }> {
    try {
      return await ApiService.request(
        `/v1/dms/messages/${partnerId}/search?q=${encodeURIComponent(q)}`
      );
    } catch {
      return { messages: [] };
    }
  }

  /** Marque manuellement une conversation comme non lue. */
  static async markConversationUnread(
    partnerId: string | number
  ): Promise<{ success: boolean }> {
    ApiService.invalidateCache("/dms/");
    return ApiService.request(
      `/v1/dms/conversations/${partnerId}/mark-unread`,
      { method: "POST" }
    );
  }

  /** Posts programmés de l'utilisateur courant (tri scheduled_at ASC). */
  static async getScheduledPosts(): Promise<{ posts: Post[] }> {
    try {
      return await ApiService.cachedRequest<{ posts: Post[] }>(
        "/v1/posts/scheduled",
        15_000
      );
    } catch {
      return { posts: [] };
    }
  }

  /** Replanifie un post (scheduled_at=null → publie aussitôt). */
  static async reschedulePost(
    postId: string,
    scheduledAt: string | null
  ): Promise<{ success: boolean; status?: string; scheduled_at?: string }> {
    ApiService.invalidateCache("/v1/posts/");
    return ApiService.request(`/v1/posts/${postId}/reschedule`, {
      body: JSON.stringify({ scheduled_at: scheduledAt }),
      method: "PATCH",
    });
  }

  /** Brouillons serveur (multi-appareils). */
  static async getDrafts(): Promise<{ drafts: ServerDraft[] }> {
    try {
      return await ApiService.cachedRequest<{ drafts: ServerDraft[] }>(
        "/v1/drafts",
        15_000
      );
    } catch {
      return { drafts: [] };
    }
  }

  static async saveDraft(draft: {
    id?: string;
    html: string;
    text: string;
    visibility?: string;
    scheduled_at?: string | null;
    ai_generated?: boolean;
    media_assets?: Array<{
      url: string;
      media_type?: string;
      size?: number;
      alt_text?: string;
    }>;
  }): Promise<{ success: boolean; id: string }> {
    if (draft.id) {
      return ApiService.request(`/v1/drafts/${draft.id}`, {
        body: JSON.stringify(draft),
        method: "PUT",
      });
    }
    return ApiService.request("/v1/drafts", {
      body: JSON.stringify(draft),
      method: "POST",
    });
  }

  static async deleteDraft(id: string): Promise<{ success: boolean }> {
    return ApiService.request(`/v1/drafts/${id}`, { method: "DELETE" });
  }

  /** Répond à une invitation de co-signature. */
  static async respondToCollab(
    postId: string,
    accept: boolean
  ): Promise<{ success: boolean; status: string }> {
    ApiService.invalidateCache("/v1/posts/");
    const action = accept ? "accept" : "decline";
    return ApiService.request(`/v1/posts/${postId}/collaborate/${action}`, {
      method: "POST",
    });
  }

  static async getUserLikedPosts(username: string): Promise<{ posts: Post[] }> {
    const cleanUser = username.trim().replace(/^@/, "");
    try {
      return await ApiService.cachedRequest<{ posts: Post[] }>(
        `/v1/profiles/${encodeURIComponent(cleanUser)}/likes`,
        15_000
      );
    } catch {
      return { posts: [] };
    }
  }

  static async createPost(
    content: string,
    media_url?: string,
    media_assets?: Array<{
      url: string;
      media_type: string;
      size?: number;
      alt_text?: string;
    }>,
    options?: {
      aiGenerated?: boolean;
      quotedPostId?: string;
      scheduledAt?: string | null;
      visibility?: "public" | "followers" | "circle" | "private";
      poll?: { question?: string; options: string[]; duration_hours: number };
      collaboratorUsername?: string;
      mediaPositions?: number[];
    }
  ): Promise<{ success: boolean; post: Post }> {
    const payload = {
      ai_generated: options?.aiGenerated,
      collaborator_username: options?.collaboratorUsername,
      content,
      media_assets,
      media_positions: options?.mediaPositions,
      media_url,
      poll: options?.poll,
      quoted_post_id: options?.quotedPostId,
      scheduled_at: options?.scheduledAt || undefined,
      visibility: options?.visibility || "public",
    };
    return ApiService.request("/v1/posts", {
      body: JSON.stringify(payload),
      method: "POST",
    });
  }

  /** Met à jour une Vibe existante (auteur uniquement). */
  static async updatePost(
    id: string,
    content: string,
    media_assets?: Array<{
      url: string;
      media_type: string;
      size?: number;
      alt_text?: string;
    }>,
    options?: {
      scheduledAt?: string | null;
      visibility?: "public" | "followers" | "circle" | "private";
      mediaPositions?: number[];
    }
  ): Promise<{ success: boolean; post: Post }> {
    const payload = {
      content,
      media_assets,
      media_positions: options?.mediaPositions,
      scheduled_at: options?.scheduledAt,
      visibility: options?.visibility,
    };
    return ApiService.request(`/v1/posts/${id}`, {
      body: JSON.stringify(payload),
      method: "PATCH",
    });
  }

  static async getPost(id: string): Promise<{ post: Post }> {
    return ApiService.request(`/v1/posts/${id}`);
  }

  static async deletePost(id: string): Promise<{ success: boolean }> {
    return ApiService.request(`/v1/posts/${id}`, { method: "DELETE" });
  }

  static async toggleLike(
    id: string
  ): Promise<{ success: boolean; liked: boolean }> {
    return ApiService.request(`/v1/posts/${id}/like`, { method: "POST" });
  }

  static async toggleRepost(
    id: string
  ): Promise<{ success: boolean; reposted: boolean }> {
    return ApiService.request(`/v1/posts/${id}/repost`, { method: "POST" });
  }

  static async toggleBookmark(
    id: string
  ): Promise<{ success: boolean; bookmarked: boolean }> {
    return ApiService.request(`/v1/posts/${id}/bookmark`, { method: "POST" });
  }

  // ─────────────────────────────────────────────
  // LIVRES — collections de « Vibe préférées » (max 5 possédés par compte, collaboratifs)
  // ─────────────────────────────────────────────
  static async getBooks(postId?: string): Promise<{
    success: boolean;
    books: VibeBook[];
    maxBooks: number;
    ownedCount: number;
  }> {
    const qs = postId ? `?post_id=${encodeURIComponent(postId)}` : "";
    return ApiService.request(`/v1/books${qs}`);
  }

  static async createBook(
    title: string,
    icon: string,
    isPublic = false
  ): Promise<{ success: boolean; book: VibeBook }> {
    // La conversation Messages du Livre est créée côté serveur : rafraîchir la liste DM
    ApiService.invalidateCache("/dms/");
    const body = JSON.stringify({ icon, is_public: isPublic, title });
    return ApiService.request("/v1/books", { body, method: "POST" });
  }

  /** Recherche les Livres publics par titre (mention @livre / attachement dans un post). */
  static async searchPublicBooks(q: string): Promise<{
    success: boolean;
    books: Array<{
      id: string;
      title: string;
      icon?: string;
      owner_username?: string;
      owner_display_name?: string;
      members_count?: number;
      items_count?: number;
    }>;
  }> {
    const qs = `?q=${encodeURIComponent(q)}`;
    return ApiService.request(`/v1/books/public${qs}`);
  }

  static async updateBook(
    bookId: string,
    data: { title?: string; icon?: string; is_public?: boolean }
  ): Promise<{ success: boolean; book: VibeBook }> {
    const body = JSON.stringify(data);
    return ApiService.request(`/v1/books/${bookId}/update`, {
      body,
      method: "POST",
    });
  }

  static async deleteBook(bookId: string): Promise<{ success: boolean }> {
    ApiService.invalidateCache("/dms/");
    return ApiService.request(`/v1/books/${bookId}`, { method: "DELETE" });
  }

  /** Enregistre / retire une Vibe d'un Livre (toggle). */
  static async toggleBookItem(
    bookId: string,
    postId: string
  ): Promise<{ success: boolean; saved: boolean }> {
    return ApiService.request(`/v1/books/${bookId}/posts/${postId}`, {
      method: "POST",
    });
  }

  /** Contenu d'un Livre : Vibe partagées + membres. */
  static async getBookPosts(bookId: string): Promise<{
    success: boolean;
    book: VibeBook;
    members: VibeBookMember[];
    posts: VibeBookPost[];
  }> {
    return ApiService.request(`/v1/books/${bookId}/posts`);
  }

  /** Rejoint un Livre par code (ou URL de partage) — adhésion immédiate. */
  static async joinBook(
    code: string
  ): Promise<{ success: boolean; book: VibeBook; already_member?: boolean }> {
    ApiService.invalidateCache("/dms/");
    const body = JSON.stringify({ code });
    return ApiService.request("/v1/books/join", { body, method: "POST" });
  }

  /** Membres d'un Livre (qui a rejoint). */
  static async getBookMembers(
    bookId: string
  ): Promise<{ success: boolean; members: VibeBookMember[] }> {
    return ApiService.request(`/v1/books/${bookId}/members`);
  }

  /** Quitte un Livre collaboratif (membres non créateurs). */
  static async leaveBook(bookId: string): Promise<{ success: boolean }> {
    ApiService.invalidateCache("/dms/");
    return ApiService.request(`/v1/books/${bookId}/leave`, { method: "POST" });
  }

  /** Régénère le code de partage d'un Livre (créateur uniquement). */
  static async regenerateBookCode(
    bookId: string
  ): Promise<{ success: boolean; join_code: string }> {
    return ApiService.request(`/v1/books/${bookId}/regenerate-code`, {
      method: "POST",
    });
  }

  /** Livres (du compte courant) contenant un post donné — badge PostCard. */
  static async getBooksForPost(
    postId: string
  ): Promise<{ success: boolean; book_ids: string[] }> {
    return ApiService.request(`/v1/books/for-post/${postId}`);
  }

  /** Épingle / désépingle une Vibe dans un Livre (max 3, membres autorisés). */
  static async pinBookPost(
    bookId: string,
    postId: string,
    pinned: boolean
  ): Promise<{ success: boolean; pinned: boolean }> {
    return ApiService.request(`/v1/books/${bookId}/posts/${postId}/pin`, {
      body: JSON.stringify({ pinned }),
      method: "POST",
    });
  }

  /** Exclut un membre d'un Livre (créateur uniquement). */
  static async kickBookMember(
    bookId: string,
    userId: string | number
  ): Promise<{ success: boolean; removed: number }> {
    ApiService.invalidateCache("/dms/");
    return ApiService.request(`/v1/books/${bookId}/members/${userId}`, {
      method: "DELETE",
    });
  }

  /** Transfère la propriété d'un Livre à un membre (créateur uniquement). */
  static async transferBookOwnership(
    bookId: string,
    userId: string | number
  ): Promise<{ success: boolean; new_owner: number }> {
    ApiService.invalidateCache("/dms/");
    return ApiService.request(
      `/v1/books/${bookId}/members/${userId}/transfer-ownership`,
      { method: "POST" }
    );
  }

  /** Discussion du Livre : liste des commentaires (pagée). */
  static async getBookComments(
    bookId: string,
    limit = 50,
    offset = 0
  ): Promise<{ success: boolean; comments: BookComment[] }> {
    return ApiService.request(
      `/v1/books/${bookId}/comments?limit=${limit}&offset=${offset}`
    );
  }

  /** Ajoute un commentaire à la discussion du Livre (réponse citée optionnelle). */
  static async addBookComment(
    bookId: string,
    content: string,
    replyToId?: string | null
  ): Promise<{ success: boolean; comment: BookComment }> {
    return ApiService.request(`/v1/books/${bookId}/comments`, {
      body: JSON.stringify({
        content,
        ...(replyToId ? { reply_to_id: replyToId } : {}),
      }),
      method: "POST",
    });
  }

  /** Supprime un commentaire de la discussion (auteur ou créateur du Livre). */
  static async deleteBookComment(
    bookId: string,
    commentId: string
  ): Promise<{ success: boolean }> {
    return ApiService.request(`/v1/books/${bookId}/comments/${commentId}`, {
      method: "DELETE",
    });
  }

  /** Réagit à un message de la discussion du Livre (toggle emoji). */
  static async reactBookComment(
    bookId: string,
    commentId: string,
    emoji: string
  ): Promise<{
    success: boolean;
    reacted: boolean;
    reactions: { emoji: string; count: number; mine: boolean }[];
  }> {
    return ApiService.request(
      `/v1/books/${bookId}/comments/${commentId}/react`,
      {
        body: JSON.stringify({ emoji }),
        method: "POST",
      }
    );
  }

  /** Abonnés d'un profil (liste paginée, avec état « je suis »). */
  static async getProfileFollowers(
    username: string,
    limit = 20,
    offset = 0
  ): Promise<{ users: ProfileListUser[]; has_more: boolean }> {
    return ApiService.request(
      `/v1/profiles/${username}/followers?limit=${limit}&offset=${offset}`
    );
  }

  /** Abonnements d'un profil (liste paginée, avec état « je suis »). */
  static async getProfileFollowing(
    username: string,
    limit = 20,
    offset = 0
  ): Promise<{ users: ProfileListUser[]; has_more: boolean }> {
    return ApiService.request(
      `/v1/profiles/${username}/following?limit=${limit}&offset=${offset}`
    );
  }

  /** Retour d'algorithme sur un post : 'more' | 'less' | null (désactive). */
  static async sendPostFeedback(
    id: string,
    value: "more" | "less" | null
  ): Promise<{ success: boolean; my_feedback: "more" | "less" | null }> {
    return ApiService.request(`/v1/posts/${id}/feedback`, {
      body: JSON.stringify({ value }),
      method: "POST",
    });
  }

  /**
   * Incrémente le compteur d'impressions d'un post. Appelé fire-and-forget
   * par le tracking de vues (IntersectionObserver). Le compteur est
   * volontairement approximatif côté affichage.
   * Accepte le temps passé pour le profil temporel (post_views).
   */
  static async viewPost(
    id: string,
    opts?: {
      duration_ms?: number;
      dwell_ms?: number;
      visible_ratio?: number;
      source?: string;
    }
  ): Promise<{ success: boolean; views_count: number | null }> {
    const body = opts
      ? JSON.stringify({
          duration_ms: opts.duration_ms,
          dwell_ms: opts.dwell_ms,
          source: opts.source,
          visible_ratio: opts.visible_ratio,
        })
      : undefined;
    return ApiService.request(`/v1/posts/${id}/view`, {
      method: "POST",
      ...(body ? { body } : {}),
    });
  }

  /** Épingler / désépingler un post sur son profil (max 2, contrôlé serveur). */
  static async setPostPinned(
    id: string,
    pinned: boolean
  ): Promise<{
    success: boolean;
    pinned: boolean;
    pinned_count?: number;
    code?: string;
    error?: string;
  }> {
    // La politique d'alias est dans request() : PIN_LIMIT et les autres erreurs
    // métier remontent directement, sans une seconde mutation.
    return ApiService.request(`/v1/posts/${id}/pin`, {
      body: JSON.stringify({ pinned }),
      method: "POST",
    });
  }

  /** Épingler / retirer de son profil un post d'un autre compte (max 2 au total, contrôlé serveur). */
  static async setPostProfilePinned(
    id: string,
    pinned: boolean
  ): Promise<{
    success: boolean;
    pinned: boolean;
    pinned_count?: number;
    code?: string;
    error?: string;
  }> {
    return ApiService.request(`/v1/posts/${id}/profile-pin`, {
      body: JSON.stringify({ pinned }),
      method: "POST",
    });
  }

  // ─────────────────────────────────────────────
  // COMMENTS
  // ─────────────────────────────────────────────
  static async getComments(
    postId: string
  ): Promise<{ comments: Comment[]; aiDigest: string | null; count: number }> {
    return ApiService.cachedRequest(`/v1/posts/${postId}/comments`, 10_000);
  }

  static async addComment(
    postId: string,
    content: string,
    parent_comment_id?: string,
    media_assets?: Array<{ url: string; media_type: string; alt_text?: string }>
  ): Promise<{ success: boolean; comment: Comment; ai_pending?: boolean }> {
    const payload = { content, media_assets, parent_comment_id };
    return ApiService.request(`/v1/posts/${postId}/comments`, {
      body: JSON.stringify(payload),
      method: "POST",
    });
  }

  static async likeComment(
    postId: string,
    commentId: string
  ): Promise<{ success: boolean; liked: boolean; likes_count: number }> {
    return ApiService.request(
      `/v1/posts/${postId}/comments/${commentId}/like`,
      { method: "POST" }
    );
  }

  // ─────────────────────────────────────────────
  // DIRECT MESSAGES (DMs)
  // ─────────────────────────────────────────────
  static async getConversations(): Promise<{
    conversations: DMConversation[];
  }> {
    return ApiService.cachedRequest("/v1/dms/conversations", 8000);
  }

  static async getMessages(
    partnerId: string | number
  ): Promise<{ messages: DirectMessage[]; pinned_messages?: DirectMessage[] }> {
    return ApiService.cachedRequest(`/v1/dms/messages/${partnerId}`, 5000);
  }

  static async sendMessage(
    recipient_id: string | number,
    content: string,
    reply_to_id?: string,
    send_at?: string,
    conversation_id?: string,
    forwarded_from?: { message_id: string } | null,
    attached_post_id?: string
  ): Promise<{
    success: boolean;
    message: DirectMessage;
    scheduled?: boolean;
  }> {
    ApiService.invalidateCache("/dms/");
    const body = JSON.stringify({
      attached_post_id,
      content,
      conversation_id,
      forwarded_from,
      recipient_id,
      reply_to_id,
      send_at,
    });
    return ApiService.request("/v1/dms/messages", { body, method: "POST" });
  }

  // ─────────────────────────────────────────────
  // MESSAGES DE GROUPE (migration 019)
  // ─────────────────────────────────────────────
  /** Crée un groupe dont le créateur devient admin. */
  static async createGroup(
    name: string,
    memberIds: Array<string | number>
  ): Promise<{
    success: boolean;
    conversation_id: string;
    name: string;
    member_count: number;
  }> {
    ApiService.invalidateCache("/dms/");
    return ApiService.request("/v1/dms/groups", {
      body: JSON.stringify({ member_ids: memberIds, name }),
      method: "POST",
    });
  }

  /** Ajoute des membres (admin) — les ajoutés récupèrent tout l'historique. */
  static async addGroupMembers(
    groupId: string,
    memberIds: Array<string | number>
  ): Promise<{ success: boolean; added: number }> {
    ApiService.invalidateCache("/dms/");
    return ApiService.request(`/v1/dms/groups/${groupId}/members`, {
      body: JSON.stringify({ member_ids: memberIds }),
      method: "POST",
    });
  }

  /** Retire un membre (admin) ou quitte le groupe soi-même. */
  static async removeGroupMember(
    groupId: string,
    userId: string | number
  ): Promise<{ success: boolean }> {
    ApiService.invalidateCache("/dms/");
    return ApiService.request(`/v1/dms/groups/${groupId}/members/${userId}`, {
      method: "DELETE",
    });
  }

  /** Détails d'un groupe (nom, membres, rôle admin). */
  static async getGroup(groupId: string): Promise<{
    group: {
      id: string;
      group_name: string;
      group_avatar_url?: string;
      created_by: string;
      is_admin: boolean;
      members: Array<{
        user_id: string;
        username: string;
        display_name?: string;
        avatar_url?: string;
        role: string;
        joined_at: string;
      }>;
    };
  }> {
    return ApiService.request(`/v1/dms/groups/${groupId}`);
  }

  /** Met à jour le groupe (admin) : nom et/ou photo. */
  static async updateGroup(
    groupId: string,
    data: { name?: string; avatar_url?: string | null }
  ): Promise<{
    success: boolean;
    group?: { group_name: string; group_avatar_url: string | null };
  }> {
    ApiService.invalidateCache("/dms/");
    return ApiService.request(`/v1/dms/groups/${groupId}`, {
      body: JSON.stringify(data),
      method: "POST",
    });
  }

  /** Supprime définitivement le groupe (admin). */
  static async deleteGroup(groupId: string): Promise<{ success: boolean }> {
    ApiService.invalidateCache("/dms/");
    return ApiService.request(`/v1/dms/groups/${groupId}`, {
      method: "DELETE",
    });
  }

  /** Transfère le rôle d'administrateur du groupe à un membre. */
  static async transferGroupAdmin(
    groupId: string,
    userId: string | number
  ): Promise<{ success: boolean; new_admin: number }> {
    ApiService.invalidateCache("/dms/");
    return ApiService.request(
      `/v1/dms/groups/${groupId}/members/${userId}/transfer-admin`,
      { method: "POST" }
    );
  }

  /** Masque un message pour soi uniquement (« supprimer pour moi »). */
  static async hideMessage(
    messageId: string
  ): Promise<{ success: boolean; hidden: boolean }> {
    ApiService.invalidateCache("/dms/");
    return ApiService.request(`/v1/dms/messages/${messageId}/hide`, {
      method: "POST",
    });
  }

  /** Mémorise côté serveur une traduction de message (max 3 langues). */
  static async saveMessageTranslation(
    messageId: string,
    lang: string,
    text: string,
    detected?: string | null
  ): Promise<{
    success: boolean;
    translations: Record<
      string,
      { text: string; detected?: string | null; at?: string }
    >;
  }> {
    return ApiService.request(`/v1/dms/messages/${messageId}/translations`, {
      body: JSON.stringify({ detected, lang, text }),
      method: "POST",
    });
  }

  /** Catalogue des outils mAI (lib/tools/index.json, filtré par réglages). */
  static async getMAITools(): Promise<{
    tools: Array<{
      id: string;
      name: string;
      slash_command: string;
      mention_tag: string;
      description: string;
      icon_name: string;
      category: string;
      sensitive: boolean;
    }>;
  }> {
    return ApiService.request("/v1/mai/tools");
  }

  /** Enregistre la liste des outils mAI activés (Paramètres → Outils mAI). */
  static async updateMAITools(
    enabledToolIds: string[]
  ): Promise<{ success: boolean; enabled_tool_ids: string[] }> {
    return ApiService.request("/v1/mai/tools", {
      body: JSON.stringify({ enabled_tool_ids: enabledToolIds }),
      method: "POST",
    });
  }

  static async reactToMessage(
    messageId: string,
    emoji: string
  ): Promise<{
    success: boolean;
    reacted: boolean;
    reactions: { emoji: string; count: number; mine: boolean }[];
  }> {
    ApiService.invalidateCache("/dms/");
    return ApiService.request(`/v1/dms/messages/${messageId}/react`, {
      body: JSON.stringify({ emoji }),
      method: "POST",
    });
  }

  static async generateDMReply(
    partnerId: string | number,
    draft?: string,
    preset: "improve" | "shorten" | "extend" | "tone" | "custom" = "improve",
    customPrompt?: string,
    tone?: string
  ): Promise<{ success: boolean; suggestion: string }> {
    const payload: Record<string, unknown> = {
      draft: draft || "",
      partner_id: partnerId,
      preset,
    };
    if (preset === "custom" && customPrompt)
      payload.custom_prompt = customPrompt;
    if (preset === "tone" && tone) payload.tone = tone;
    try {
      return await ApiService.request("/v1/dms/suggest-reply", {
        body: JSON.stringify(payload),
        method: "POST",
      });
    } catch (error: any) {
      // Une ancienne route de génération n'est essayée que si la première a
      // réellement disparu ; jamais après un 401/429/500 ou une erreur réseau.
      if (!ApiService.shouldRetryVibeAlias(error)) throw error;
      return ApiService.request(`/v1/dms/generate-reply/${partnerId}`, {
        body: JSON.stringify(payload),
        method: "POST",
      });
    }
  }

  // ─────────────────────────────────────────────
  // DMs — MODÉRATION : blocage, signalement, suppression, renommage
  // ─────────────────────────────────────────────
  static async blockUser(
    userId: string | number
  ): Promise<{ success: boolean }> {
    return ApiService.request("/v1/dms/block", {
      body: JSON.stringify({ user_id: userId }),
      method: "POST",
    });
  }

  static async unblockUser(
    userId: string | number
  ): Promise<{ success: boolean }> {
    return ApiService.request("/v1/dms/unblock", {
      body: JSON.stringify({ user_id: userId }),
      method: "POST",
    });
  }

  static async getBlockedUsers(): Promise<{
    blocked: Array<{
      id: string;
      blocked_user_id: string;
      blocked_username?: string;
      blocked_display_name?: string;
      blocked_avatar_url?: string;
      created_at: string;
    }>;
  }> {
    return ApiService.request("/v1/dms/blocked");
  }

  // ─────────────────────────────────────────────
  // MUTE — masquage silencieux (posts + notifications, invisible pour l'autre)
  // ─────────────────────────────────────────────
  static async muteUser(
    username: string,
    muted: boolean
  ): Promise<{ success: boolean; muted: boolean }> {
    const clean = username.trim().replace(/^@/, "");
    return ApiService.request(`/v1/users/${encodeURIComponent(clean)}/mute`, {
      body: JSON.stringify({ muted }),
      method: "POST",
    });
  }

  static async getMutedUsers(): Promise<{
    muted: Array<{
      id: string;
      muted_user_id: string;
      muted_username?: string;
      muted_display_name?: string;
      muted_avatar_url?: string;
      created_at: string;
    }>;
  }> {
    return ApiService.request("/v1/users/muted");
  }

  static async reportConversation(
    partnerId: string | number,
    reason: string,
    messageId?: string
  ): Promise<{ success: boolean }> {
    return ApiService.request("/v1/dms/report", {
      body: JSON.stringify({
        message_id: messageId,
        reason,
        reported_user_id: partnerId,
      }),
      method: "POST",
    });
  }

  static async renameConversation(
    partnerId: string | number,
    customName: string
  ): Promise<{ success: boolean }> {
    ApiService.invalidateCache("/dms/");
    return ApiService.request(`/v1/dms/conversations/${partnerId}/rename`, {
      body: JSON.stringify({ name: customName }),
      method: "POST",
    });
  }

  static async deleteConversation(
    partnerId: string | number
  ): Promise<{ success: boolean }> {
    return ApiService.request(`/v1/dms/conversations/${partnerId}`, {
      method: "DELETE",
    });
  }

  static async deleteMessage(messageId: string): Promise<{ success: boolean }> {
    return ApiService.request(`/v1/dms/messages/${messageId}`, {
      method: "DELETE",
    });
  }

  static async editMessage(
    messageId: string,
    content: string
  ): Promise<{ success: boolean; message: DirectMessage }> {
    ApiService.invalidateCache("/dms/");
    return ApiService.request(`/v1/dms/messages/${messageId}`, {
      body: JSON.stringify({ content }),
      method: "PATCH",
    });
  }

  /** Heartbeat « en train d'écrire » d'un DM (throttlé côté appelant). */
  static async sendTyping(
    partnerId: string | number,
    typing = true
  ): Promise<void> {
    const payload = JSON.stringify({ partner_id: partnerId, typing });
    await ApiService.request("/v1/dms/typing", {
      body: payload,
      method: "POST",
    });
  }

  // ─────────────────────────────────────────────
  // AUDIENCE — CERCLE PRIVÉ (visibilité des posts)
  // ─────────────────────────────────────────────
  static async getCircle(): Promise<{
    members: Array<{
      id: string | number;
      username: string;
      display_name?: string;
      avatar_url?: string;
      is_verified?: boolean;
      added_at?: string;
    }>;
  }> {
    return ApiService.cachedRequest("/v1/circle", 20_000);
  }

  static async addToCircle(username: string): Promise<{ success: boolean }> {
    ApiService.invalidateCache("/circle");
    return ApiService.request(`/v1/circle/${encodeURIComponent(username)}`, {
      method: "POST",
    });
  }

  static async removeFromCircle(
    username: string
  ): Promise<{ success: boolean }> {
    ApiService.invalidateCache("/circle");
    return ApiService.request(`/v1/circle/${encodeURIComponent(username)}`, {
      method: "DELETE",
    });
  }

  /** @username est-il dans mon cercle ? (état du bouton sur les profils) */
  static async checkCircle(username: string): Promise<{ in_circle: boolean }> {
    return ApiService.request(
      `/v1/circle/check/${encodeURIComponent(username)}`
    );
  }

  // ─────────────────────────────────────────────
  // AI TEXT TOOLS (composer : continuation Tab, orthographe, allonger, ton)
  // ─────────────────────────────────────────────
  static async aiTransformText(
    text: string,
    action: "complete" | "fix_spelling" | "lengthen" | "shorten" | "tone",
    tone?: string
  ): Promise<{ success: boolean; text: string }> {
    const payload = JSON.stringify({ action, text, tone });
    return ApiService.request("/v1/ai/text", { body: payload, method: "POST" });
  }

  /** Traduction d'une publication (DeepL, repli mAI côté serveur, cache inclus). */
  static async translatePost(
    postId: string,
    targetLang: string
  ): Promise<TranslateResult> {
    const payload = JSON.stringify({
      post_id: postId,
      target_lang: targetLang,
    });
    return ApiService.request("/v1/translate", {
      body: payload,
      method: "POST",
    });
  }

  /** Traduction d'un commentaire/réponse (DeepL, repli mAI côté serveur). */
  static async translateComment(
    commentId: string,
    targetLang: string
  ): Promise<TranslateResult> {
    const payload = JSON.stringify({
      comment_id: commentId,
      target_lang: targetLang,
    });
    return ApiService.request("/v1/translate", {
      body: payload,
      method: "POST",
    });
  }

  // ─────────────────────────────────────────────
  // SPEECH — lecture vocale des posts/fils (mini-lecteur audio flottant)
  // ─────────────────────────────────────────────
  static async getSpeechVoices(): Promise<{
    voices: Array<{
      id: string;
      name: string;
      gender?: string;
      languages?: string[];
    }>;
  }> {
    const extract = (res: any) => ({
      voices: res?.voices || res?.data || (Array.isArray(res) ? res : []),
    });
    return extract(await ApiService.request("/v1/speech/voices"));
  }

  /** Synthèse vocale d'un texte → URL de lecture (data URL audio). */
  static async textToSpeech(
    text: string,
    voice?: string
  ): Promise<{ url: string }> {
    const payload = JSON.stringify({
      input: text,
      model: "deepgram/flux-tts:free",
      return_json: true,
      voice: voice || undefined,
    });

    // Les alias /api/vibe sont ajoutés par request() après un 404/405.
    const endpoints = ["/v1/speech", "/speech", "/v1/audio/speech"];
    let lastError: any = null;

    for (const ep of endpoints) {
      try {
        const json = await ApiService.request<any>(ep, {
          body: payload,
          method: "POST",
        });
        const audioUrl = json?.audio_url || json?.audioContent;
        if (audioUrl) {
          return { url: audioUrl };
        }
      } catch (err: any) {
        // Les variantes TTS ne sont essayées que si la route précédente a
        // disparu ; ne pas rejouer une génération après une erreur métier/réseau.
        if (!ApiService.shouldRetryVibeAlias(err)) throw err;
        lastError = err;
      }
    }
    throw lastError || new Error("Réponse audio invalide.");
  }

  // ─────────────────────────────────────────────
  // mAI & AI MODELS
  // ─────────────────────────────────────────────
  static async getModels(): Promise<{
    models: Array<{
      id: string;
      name: string;
      description: string;
      contextWindow?: number;
      provider?: string;
    }>;
  }> {
    try {
      const res = await ApiService.request<{ data?: any[]; models?: any[] }>(
        "/v1/models"
      );
      const list = res.data || res.models || [];
      if (Array.isArray(list) && list.length > 0) {
        const formatted = list.map((m: any) => {
          const rawName = m.name || m.id;
          // Nettoyer le nom si format "Fournisseur: Nom"
          const cleanName = rawName.includes(": ")
            ? rawName.split(": ")[1]
            : rawName;
          return {
            contextWindow:
              m.maxContext || m.context_length || m.contextWindow || 128_000,
            description: m.description || "",
            id: m.id,
            name: cleanName,
            provider:
              m.owned_by ||
              m.provider ||
              (m.id.includes("/") ? m.id.split("/")[0] : "mAI"),
          };
        });
        const lagunaIdx = formatted.findIndex(
          (m) => m.id === "poolside/laguna-xs-2.1:free"
        );
        if (lagunaIdx > 0) {
          const [laguna] = formatted.splice(lagunaIdx, 1);
          formatted.unshift(laguna);
        } else if (lagunaIdx === -1) {
          formatted.unshift({
            contextWindow: 128_000,
            description: "Modèle IA par défaut haute performance",
            id: "poolside/laguna-xs-2.1:free",
            name: "Laguna XS 2.1",
            provider: "Poolside",
          });
        }
        return { models: formatted };
      }
      return {
        models: [
          {
            description: "Modèle IA par défaut haute performance",
            id: "poolside/laguna-xs-2.1:free",
            name: "Laguna XS 2.1",
            provider: "Poolside",
          },
          {
            description:
              "Modèle IA d'élite mAI — Raisonnement profond & Vision",
            id: "mai-1.5-apex",
            name: "mAI 1.5 Apex",
            provider: "mDevsLabs",
          },
          {
            description: "Modèle agile mAI ultra-rapide",
            id: "mai-1.5-light",
            name: "mAI 1.5 Light",
            provider: "mDevsLabs",
          },
          {
            description: "Vitesse instantanée et compréhension multimodale",
            id: "google/gemini-2.5-flash:free",
            name: "Gemini 2.5 Flash",
            provider: "Google",
          },
          {
            description: "Compétences avancées de logique et programmation",
            id: "meta-llama/llama-3.3-70b-instruct:free",
            name: "Llama 3.3 70B Instruct",
            provider: "Meta",
          },
          {
            description: "Raisonnement mathématique et logique complexe",
            id: "deepseek/deepseek-r1:free",
            name: "DeepSeek R1",
            provider: "DeepSeek",
          },
          {
            description: "Modèle de code spécialisé de haute précision",
            id: "qwen/qwen-2.5-coder-32b-instruct:free",
            name: "Qwen 2.5 Coder 32B",
            provider: "Qwen",
          },
        ],
      };
    } catch {
      return {
        models: [
          {
            description: "Modèle IA par défaut haute performance",
            id: "poolside/laguna-xs-2.1:free",
            name: "Laguna XS 2.1",
            provider: "Poolside",
          },
          {
            description:
              "Modèle IA d'élite mAI — Raisonnement profond & Vision",
            id: "mai-1.5-apex",
            name: "mAI 1.5 Apex",
            provider: "mDevsLabs",
          },
          {
            description: "Modèle agile mAI ultra-rapide",
            id: "mai-1.5-light",
            name: "mAI 1.5 Light",
            provider: "mDevsLabs",
          },
          {
            description: "Vitesse instantanée et compréhension multimodale",
            id: "google/gemini-2.5-flash:free",
            name: "Gemini 2.5 Flash",
            provider: "Google",
          },
          {
            description: "Compétences avancées de logique et programmation",
            id: "meta-llama/llama-3.3-70b-instruct:free",
            name: "Llama 3.3 70B Instruct",
            provider: "Meta",
          },
          {
            description: "Raisonnement mathématique et logique complexe",
            id: "deepseek/deepseek-r1:free",
            name: "DeepSeek R1",
            provider: "DeepSeek",
          },
          {
            description: "Modèle de code spécialisé de haute précision",
            id: "qwen/qwen-2.5-coder-32b-instruct:free",
            name: "Qwen 2.5 Coder 32B",
            provider: "Qwen",
          },
        ],
      };
    }
  }

  static async chatMAI(
    message: string,
    execute_tool?: { name: string; args: any },
    model?: string,
    context?: { post_id?: string },
    conversationId?: string
  ): Promise<{
    reply: string;
    toolExecuted?: any;
    toolCalls?: MaiToolCall[];
    modelUsed?: string;
    requiresApproval?: boolean;
    pendingTool?: { name: string; args: any };
    conversation_id?: string | null;
    user_message_id?: string | null;
    assistant_message_id?: string | null;
  }> {
    const payload = {
      context,
      conversation_id: conversationId,
      execute_tool,
      message,
      model,
    };
    return ApiService.request("/v1/mai/chat", {
      body: JSON.stringify(payload),
      method: "POST",
    });
  }

  /** Régénère la dernière réponse mAI de la conversation (sans rejouer tout le fil). */
  static async regenerateMAI(opts?: {
    model?: string;
    postId?: string;
    conversationId?: string;
  }): Promise<{
    success: boolean;
    reply: string;
    message_id: string | null;
    modelUsed?: string;
    conversation_id?: string | null;
  }> {
    const payload = JSON.stringify({
      context: opts?.postId ? { post_id: opts.postId } : undefined,
      conversation_id: opts?.conversationId,
      model: opts?.model,
    });
    return ApiService.request("/v1/mai/regenerate", {
      body: payload,
      method: "POST",
    });
  }

  /** Historique d'une conversation mAI (persistance serveur, multi-conversations). */
  static async getMAIHistory(
    conversationId?: string,
    limit?: number,
    offset?: number
  ): Promise<{
    conversation_id: string | null;
    messages: Array<{
      id: string;
      role: "user" | "assistant";
      content: string;
      tool_calls?: MaiToolCall[];
      created_at: string;
    }>;
    has_more?: boolean;
  }> {
    const params = new URLSearchParams();
    if (conversationId) params.set("conversation_id", conversationId);
    if (limit) params.set("limit", String(limit));
    if (offset) params.set("offset", String(offset));
    const qs = params.toString() ? `?${params.toString()}` : "";
    return ApiService.request(`/v1/mai/history${qs}`);
  }

  /** Démarre une nouvelle conversation mAI (vide l'historique actif). */
  static async newMAIConversation(): Promise<{
    success: boolean;
    conversation_id: string;
  }> {
    return ApiService.request("/v1/mai/history/new", { method: "POST" });
  }

  /** Liste des conversations mAI de l'utilisateur (page Studio). */
  static async getMAIConversations(): Promise<{
    success: boolean;
    conversations: MAIConversationSummary[];
  }> {
    return ApiService.request("/v1/mai/conversations");
  }

  /** Renomme une conversation mAI. */
  static async renameMAIConversation(
    conversationId: string,
    title: string
  ): Promise<{
    success: boolean;
    conversation: { id: string; title: string };
  }> {
    const body = JSON.stringify({ title });
    return ApiService.request(
      `/v1/mai/conversations/${conversationId}/rename`,
      { body, method: "POST" }
    );
  }

  /** Supprime une conversation mAI (messages en cascade). */
  static async deleteMAIConversation(
    conversationId: string
  ): Promise<{ success: boolean; deleted: string }> {
    return ApiService.request(`/v1/mai/conversations/${conversationId}`, {
      method: "DELETE",
    });
  }

  /** Duplique une conversation mAI (messages copiés). */
  static async duplicateMAIConversation(
    conversationId: string
  ): Promise<{ success: boolean; conversation_id: string }> {
    return ApiService.request(
      `/v1/mai/conversations/${conversationId}/duplicate`,
      { method: "POST" }
    );
  }

  /** Exécute un outil mAI explicitement approuvé par l'utilisateur. */
  static async executeMAITool(
    name: string,
    args: any = {},
    model?: string,
    approve = false,
    conversationId?: string
  ): Promise<{
    reply: string;
    toolExecuted?: any;
    toolCalls?: MaiToolCall[];
    modelUsed?: string;
    requiresApproval?: boolean;
    pendingTool?: { name: string; args: any };
    conversation_id?: string | null;
    assistant_message_id?: string | null;
  }> {
    const body = JSON.stringify({
      approve,
      args,
      conversation_id: conversationId,
      model,
      name,
    });
    return ApiService.request("/v1/mai/execute-tool", { body, method: "POST" });
  }

  /** Refuse l'exécution d'un outil sensible (flux d'approbation persisté). */
  static async refuseMAITool(
    name: string,
    args: any = {},
    conversationId?: string
  ): Promise<{
    success: boolean;
    reply: string;
    toolCalls?: MaiToolCall[];
    conversation_id?: string | null;
    message_id?: string | null;
  }> {
    const body = JSON.stringify({
      args,
      conversation_id: conversationId,
      name,
    });
    return ApiService.request("/v1/mai/tool-refused", { body, method: "POST" });
  }

  static async getMAIQuotas(): Promise<MAIQuotas> {
    return ApiService.request("/v1/mai/quotas");
  }

  static async modulateText(
    text: string,
    tone = "executive"
  ): Promise<{ success: boolean; modulated: string }> {
    return ApiService.request("/v1/mai/modulate", {
      body: JSON.stringify({ text, tone }),
      method: "POST",
    });
  }

  // ─────────────────────────────────────────────
  // PROFILES & AVATAR SYNC
  // ─────────────────────────────────────────────
  static async getProfile(
    username: string
  ): Promise<{ profile: Profile; posts: Post[] }> {
    const cleanUser = username.trim().replace(/^@/, "");
    const endpoint = `/v1/profiles/${encodeURIComponent(cleanUser)}`;
    return ApiService.cachedRequest(endpoint, 30_000);
  }

  static async updateProfile(
    data: Partial<Profile>
  ): Promise<{ success: boolean }> {
    // Sans invalidation, le profil GET en cache (30 s) réaffichait l'ancien pseudo/tags après save
    ApiService.invalidateCache("/profiles/");
    return ApiService.request("/v1/profile/update", {
      body: JSON.stringify(data),
      method: "POST",
    });
  }

  static async uploadAvatar(
    file: File
  ): Promise<{ avatarUrl: string; success: boolean }> {
    return ApiService.uploadWithFallback<{
      avatarUrl: string;
      success: boolean;
    }>(
      "/v1/upload-avatar",
      "/upload-avatar",
      "avatar",
      file,
      "Erreur lors de l'upload de l'avatar."
    );
  }

  static async uploadFile(
    file: File
  ): Promise<{ url: string; pathname: string; contentType: string }> {
    return ApiService.uploadWithFallback<{
      url: string;
      pathname: string;
      contentType: string;
    }>(
      "/v1/upload-file",
      "/upload-file",
      "file",
      file,
      "Erreur lors de l'upload du fichier."
    );
  }

  static async updateAvatar(
    avatarUrl: string
  ): Promise<{ success: boolean; avatarUrl: string }> {
    return ApiService.request("/v1/profile/avatar", {
      body: JSON.stringify({ avatarUrl }),
      method: "POST",
    });
  }

  static async toggleFollow(
    username: string
  ): Promise<{ success: boolean; following: boolean }> {
    const cleanUser = username.trim().replace(/^@/, "");
    return ApiService.request(
      `/v1/profiles/${encodeURIComponent(cleanUser)}/follow`,
      { method: "POST" }
    );
  }

  /** Statut de l'abonnement aux notifications de posts d'un compte. */
  static async getPostSubscription(
    username: string
  ): Promise<{ success: boolean; subscribed: boolean }> {
    const cleanUser = username.trim().replace(/^@/, "");
    return ApiService.request(
      `/v1/profiles/${encodeURIComponent(cleanUser)}/subscribe`
    );
  }

  /** S'abonner / se désabonner aux notifications de posts d'un compte (toggle). */
  static async togglePostSubscription(
    username: string
  ): Promise<{ success: boolean; subscribed: boolean }> {
    const cleanUser = username.trim().replace(/^@/, "");
    return ApiService.request(
      `/v1/profiles/${encodeURIComponent(cleanUser)}/subscribe`,
      { method: "POST" }
    );
  }

  // ─────────────────────────────────────────────
  // NOTIFICATIONS & SETTINGS
  // ─────────────────────────────────────────────
  static async getNotifications(): Promise<{
    notifications: NotificationItem[];
  }> {
    return ApiService.request("/v1/notifications");
  }

  /** Badges légers : un seul appel, aucune liste chargée. */
  static async getUnreadCounts(): Promise<{
    unread_notifications: number;
    unread_messages: number;
  }> {
    return ApiService.request("/v1/notifications/unread_count");
  }

  static async markNotificationsRead(): Promise<{ success: boolean }> {
    return ApiService.request("/v1/notifications/read", { method: "POST" });
  }

  static async markNotificationRead(
    id: string,
    isRead = true
  ): Promise<{ success: boolean }> {
    const payload = JSON.stringify({ id, is_read: isRead });
    try {
      return await ApiService.request(
        `/v1/notifications/${encodeURIComponent(id)}/read`,
        {
          body: payload,
          method: "POST",
        }
      );
    } catch (error: any) {
      if (!ApiService.shouldRetryVibeAlias(error)) throw error;
      return ApiService.request("/v1/notifications/read", {
        body: payload,
        method: "POST",
      });
    }
  }

  static async deleteNotification(id: string): Promise<{ success: boolean }> {
    const payload = JSON.stringify({ id });
    try {
      return await ApiService.request(
        `/v1/notifications/${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
    } catch (error: any) {
      if (!ApiService.shouldRetryVibeAlias(error)) throw error;
      return ApiService.request("/v1/notifications/delete", {
        body: payload,
        method: "POST",
      });
    }
  }

  static async clearAllNotifications(): Promise<{ success: boolean }> {
    try {
      return await ApiService.request("/v1/notifications", {
        method: "DELETE",
      });
    } catch (error: any) {
      if (!ApiService.shouldRetryVibeAlias(error)) throw error;
      return ApiService.request("/v1/notifications/delete", {
        body: JSON.stringify({ all: true }),
        method: "POST",
      });
    }
  }

  static async getSettings(): Promise<{ settings: UserSettings }> {
    return ApiService.request("/v1/settings");
  }

  static async updateSettings(
    settings: Partial<UserSettings>
  ): Promise<{ success: boolean }> {
    return ApiService.request("/v1/settings/update", {
      body: JSON.stringify(settings),
      method: "POST",
    });
  }

  static async exportData(): Promise<any> {
    return ApiService.request("/v1/privacy/export");
  }

  static async logUsage(endpoint: string, tokens = 10): Promise<void> {
    const token = ApiService.getToken();
    if (!token) return;
    try {
      await fetch(`${API_BASE}/v1/usage/log`, {
        body: JSON.stringify({ action_type: "api_query", endpoint, tokens }),
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        method: "POST",
      });
    } catch {}
  }
}
