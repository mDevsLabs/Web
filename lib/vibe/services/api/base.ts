/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — API CORE CLIENT (base.ts)
 * Configuration, cache, requêtes réseau, tokens et relais BFF
 * ============================================================================
 */

import { apiUrl } from "@/lib/client/api-endpoints";
import { AppStorage } from "@/lib/vibe/services/storageAdapter";
import type { Post } from "@/lib/vibe/types/vibe";

/**
 * Racine du relais BFF de l'hôte.
 *
 * Vibe n'appelle PLUS l'API mAI en direct : tout passe par
 * `/api/vibe/**` (`app/(chat)/api/vibe/[...path]/route.ts`), qui lit le
 * cookie de session httpOnly de l'hôte et le relaie en `Authorization`.
 *
 * Pourquoi ce changement : le client ne détenait son jeton que dans
 * `localStorage`, posé par `VibeSessionBridge` — qui n'existe QUE sous
 * `/vibe`. L'onglet « Applications » des paramètres de l'hôte utilise le
 * même client mais vit ailleurs : la requête partait sans authentification
 * et le backend répondait « Service Unavailable. API Key missing. ».
 * Un seul chemin, une seule identité, et le jeton ne quitte plus le
 * navigateur.
 */
export const API_BASE = apiUrl("/api/vibe");

/**
 * Racine de l'API mAI, pour les appels qui NE passent pas par le relais.
 *
 * Deux cas seulement : l'authentification Vibe (`/login`, `/register`,
 * `/verify-*`, `/resend-code`), pilotée par les Server Actions de l'hôte, et
 * la révocation de session (route inexistante côté backend, conservée par
 * prudence). Le flux temps réel, lui, passe par le relais.
 */
export const API_DIRECT_BASE =
  process.env.NEXT_PUBLIC_MAI_API_URL || "https://mai.val.run";

/**
 * Chemins qui restent en accès direct à l'API mAI.
 *
 * L'authentification Vibe est pilotée par les Server Actions de l'hôte, qui
 * posent le cookie `mai_session_token`. La relayer donnerait au navigateur
 * une seconde porte d'entrée, sans gain : le client n'a pas de secret à
 * présenter pour ces routes.
 */
const DIRECT_ENDPOINTS = [
  "/login",
  "/register",
  "/resend-code",
  "/verify-login",
  "/verify-register",
];

/** Un endpoint passe-t-il par le relais BFF ? */
function isRelayed(endpoint: string): boolean {
  if (endpoint.startsWith("http")) {
    return false;
  }
  if (DIRECT_ENDPOINTS.includes(endpoint)) {
    return false;
  }
  return true;
}

// ─────────────────────────────────────────────
// TRADUCTION (DeepL) — langues cibles & types
// ─────────────────────────────────────────────
export interface TranslateResult {
  cached?: boolean;
  detected_language: string;
  provider?: "deepl" | "mai";
  same_language?: boolean;
  success: boolean;
  target_lang?: string;
  translation: string;
}

export type StatsPeriod = "7d" | "30d" | "90d" | "12m";

export interface CreatorSeriesPoint {
  day: string;
  likes: number;
  profile_views: number;
  replies: number;
  reposts: number;
  views: number;
}

export interface CreatorStats {
  best_day?: { day: string; views: number } | null;
  best_publish_day?: { day: string; views: number; posts: number } | null;
  daily: Array<{ day: string; views: number; posts: number }>;
  engagement_rate?: number;
  hourly?: Array<{ hour: number; views: number }>;
  period?: string;
  posts_count: number;
  posts_per_week?: number;
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
  top_posts?: Array<Post & { engagement?: number }>;
  total_likes: number;
  total_replies: number;
  total_reposts: number;
  total_views: number;
}

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

export class ApiServiceCore {
  protected static readonly cache = new Map<string, CacheEntry>();
  protected static readonly inflight = new Map<string, Promise<any>>();
  public static cacheGeneration = 0;
  public static sessionGeneration = 0;

  public static cacheGet<T>(
    endpoint: string,
    ttlMs: number = GET_CACHE_TTL
  ): Promise<T> | null {
    const hit = ApiServiceCore.cache.get(endpoint);
    if (hit && Date.now() - hit.ts < ttlMs)
      return Promise.resolve(hit.data as T);
    return null;
  }

  public static async cachedRequest<T>(
    endpoint: string,
    ttlMs: number = GET_CACHE_TTL
  ): Promise<T> {
    const cached = ApiServiceCore.cacheGet<T>(endpoint, ttlMs);
    if (cached) return cached;

    const pending = ApiServiceCore.inflight.get(endpoint);
    if (pending) return pending as Promise<T>;

    const generation = ApiServiceCore.cacheGeneration;
    const p: Promise<T> = ApiServiceCore.request<T>(endpoint)
      .then((data) => {
        if (generation === ApiServiceCore.cacheGeneration) {
          ApiServiceCore.cache.set(endpoint, { data, ts: Date.now() });
        }
        return data;
      })
      .finally(() => {
        if (ApiServiceCore.inflight.get(endpoint) === p)
          ApiServiceCore.inflight.delete(endpoint);
      });

    ApiServiceCore.inflight.set(endpoint, p);
    return p;
  }

  public static clearCache(): void {
    ApiServiceCore.cacheGeneration += 1;
    ApiServiceCore.cache.clear();
    ApiServiceCore.inflight.clear();
  }

  public static invalidateCache(prefix?: string): void {
    if (!prefix) {
      ApiServiceCore.clearCache();
      return;
    }

    ApiServiceCore.cacheGeneration += 1;
    for (const key of Array.from(ApiServiceCore.cache.keys())) {
      if (key.includes(prefix)) ApiServiceCore.cache.delete(key);
    }
    for (const key of Array.from(ApiServiceCore.inflight.keys())) {
      if (key.includes(prefix)) ApiServiceCore.inflight.delete(key);
    }
  }

  public static clearOfflineData(): void {
    for (const key of OFFLINE_FEED_KEYS) AppStorage.removeItem(key);
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        for (const key of Object.keys(window.localStorage)) {
          if (key.startsWith("vibe_offline_")) AppStorage.removeItem(key);
        }
      }
    } catch {}
  }

  public static seedCache(endpoint: string, data: unknown): void {
    ApiServiceCore.cache.set(endpoint, { data, ts: Date.now() });
  }

  public static feedEndpoint(
    type: "for_you" | "stream" | "trending",
    tag?: string,
    cursor?: string
  ): string {
    const queryParams = new URLSearchParams({ type });
    if (tag) queryParams.append("tag", tag);
    if (cursor) queryParams.append("cursor", cursor);
    return `/v1/feed?${queryParams.toString()}`;
  }

  public static profileEndpoint(username: string): string {
    const cleanUser = username.trim().replace(/^@/, "");
    return `/v1/profiles/${encodeURIComponent(cleanUser)}`;
  }

  public static prefetchProfiles(
    posts: Array<{ username?: string; author_id?: string }>
  ): void {
    const usernames = Array.from(
      new Set(
        posts.map((p) => p.username).filter((u): u is string => Boolean(u))
      )
    ).slice(0, 8);
    for (const u of usernames) ApiServiceCore.prefetchProfile(u);
  }

  public static prefetchProfile(username: string): void {
    const endpoint = ApiServiceCore.profileEndpoint(username);
    ApiServiceCore.cachedRequest(endpoint, 60_000).catch(() => {});
  }

  public static getToken(): string | null {
    return AppStorage.getItem("vibe_jwt_token");
  }

  public static setToken(token: string): void {
    const previousToken = ApiServiceCore.getToken();
    if (previousToken && previousToken !== token) {
      ApiServiceCore.sessionGeneration += 1;
      ApiServiceCore.clearCache();
      ApiServiceCore.clearOfflineData();
      AppStorage.removeItem("vibe_user_data");
    }
    AppStorage.setItem("vibe_jwt_token", token);
  }

  public static removeToken(): void {
    ApiServiceCore.sessionGeneration += 1;
    ApiServiceCore.clearCache();
    AppStorage.removeItem("vibe_jwt_token");
    AppStorage.removeItem("vibe_user_data");
    ApiServiceCore.clearOfflineData();
  }

  public static async revokeSession(
    token: string | null = ApiServiceCore.getToken()
  ): Promise<void> {
    if (!token) return;
    try {
      // Le backend n'expose pas de route de déconnexion Vibe : la révocation
      // réelle passe par la déconnexion de l'hôte (Server Action). Cet appel
      // est conservé par prudence — et il part en accès DIRECT, avec le jeton,
      // parce que `/v1/logout` n'est pas une route relayable.
      await fetch(`${API_DIRECT_BASE}/v1/logout`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        method: "POST",
      });
    } catch {}
  }

  public static resolveTargetLanguage(): string {
    const stored = String(AppStorage.getItem("vibe_ui_language") || "")
      .trim()
      .toUpperCase();
    if (stored && TRANSLATION_LANGUAGES.some((l) => l.code === stored))
      return stored;
    return browserToDeepLCode(
      typeof navigator === "undefined" ? "" : navigator.language
    );
  }

  public static setUiLanguageMirror(lang: string): void {
    AppStorage.setItem("vibe_ui_language", lang);
  }

  public static shouldRetryVibeAlias(error: any): boolean {
    return error?.status === 404 || error?.status === 405;
  }

  /**
   * URL effective d'un endpoint.
   *
   * Les routes `/v1/…` passent par le relais BFF (`/api/vibe/…`), qui pose
   * l'authentification à partir du cookie de session. Les routes
   * d'authentification Vibe vont en accès direct à l'API mAI.
   */
  public static resolveUrl(endpoint: string): string {
    if (endpoint.startsWith("http")) {
      return endpoint;
    }
    if (!isRelayed(endpoint)) {
      return `${API_DIRECT_BASE}${endpoint}`;
    }
    // `/v1/xxx` → `/api/vibe/xxx`. Le préfixe `/v1` est retiré : le relais
    // l'ajoute côté amont, et le garder produirait `/api/vibe/v1/xxx`.
    const suffix = endpoint.startsWith("/v1/")
      ? endpoint.slice("/v1".length)
      : endpoint;
    return `${API_BASE}${suffix}`;
  }

  public static async executeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    const relayed = isRelayed(endpoint);
    if (relayed) {
      // Relais BFF : le cookie de session de l'hôte fait foi. Poser un
      // `Authorization` ici écraserait l'identité du relais par celle d'un
      // jeton de session Vibe, qui n'est pas forcément le même compte.
      delete headers.Authorization;
    } else {
      // Accès direct : l'authentification Vibe porte son propre jeton.
      const token = ApiServiceCore.getToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    const url = ApiServiceCore.resolveUrl(endpoint);
    const method = (options.method || "GET").toUpperCase();
    const isReadRequest = method === "GET" || method === "HEAD";

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        credentials: "same-origin",
        headers,
      });
    } catch (networkErr: any) {
      // Repli de développement : l'hôte local peut ne pas exposer la route
      // BFF (build de démo, basePath, Capacitor). On retente alors en accès
      // direct, avec le jeton Vibe.
      const isLocalhost =
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1");

      if (isReadRequest && relayed && isLocalhost) {
        try {
          const token = ApiServiceCore.getToken();
          response = await fetch(`${API_DIRECT_BASE}${endpoint}`, {
            ...options,
            headers: token
              ? { ...headers, Authorization: `Bearer ${token}` }
              : headers,
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
      if (errJson.code) err.code = errJson.code;
      err.body = errJson;
      throw err;
    }

    const SKIP_LOG_PATTERNS = [
      "/usage/log",
      "/log-usage",
      "/v1/log-usage",
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

    const json = await response.json();

    if (shouldLog) {
      const actualTokens =
        typeof json?.tokensUsed === "number"
          ? json.tokensUsed
          : typeof json?.usage?.total_tokens === "number"
            ? json.usage.total_tokens
            : typeof json?.tokens === "number"
              ? json.tokens
              : 10;
      const inputTokens =
        typeof json?.inputTokens === "number"
          ? json.inputTokens
          : json?.usage?.prompt_tokens;
      const outputTokens =
        typeof json?.outputTokens === "number"
          ? json.outputTokens
          : json?.usage?.completion_tokens;
      ApiServiceCore.logUsage(endpoint, actualTokens, {
        inputTokens,
        outputTokens,
      }).catch(() => {});
    }

    if (!isReadRequest) {
      ApiServiceCore.invalidateCache();
    }

    return json;
  }

  public static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Le repli d'alias (`/v1/…` → `/api/vibe/…`) a disparu : le relais BFF
    // EST désormais le chemin normal, et le backend expose déjà les deux
    // alias (`/v1/…` et `/api/vibe/…`). `request` n'est plus qu'un alias de
    // `executeRequest` — il reste pour la compatibilité de la surface
    // publique du client.
    return await ApiServiceCore.executeRequest<T>(endpoint, options);
  }

  public static async uploadWithFallback<T>(
    primaryEndpoint: string,
    fallbackEndpoint: string,
    field: string,
    file: File,
    errorMessage: string
  ): Promise<T> {
    const send = async (endpoint: string): Promise<Response> => {
      const formData = new FormData();
      formData.append(field, file);
      const headers: Record<string, string> = { Accept: "application/json" };
      if (!isRelayed(endpoint)) {
        const token = ApiServiceCore.getToken();
        if (token) headers.Authorization = `Bearer ${token}`;
      }
      return fetch(ApiServiceCore.resolveUrl(endpoint), {
        body: formData,
        credentials: "same-origin",
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

    const sessionGeneration = ApiServiceCore.sessionGeneration;
    let response: Response = await send(primaryEndpoint);

    if (!response.ok) {
      const error = await toError(response);
      if (
        !ApiServiceCore.shouldRetryVibeAlias(error) ||
        sessionGeneration !== ApiServiceCore.sessionGeneration
      )
        throw error;
      response = await send(fallbackEndpoint);
      if (!response.ok) throw await toError(response);
    }

    return response.json() as Promise<T>;
  }

  public static async logUsage(
    endpoint: string,
    tokens = 10,
    details?: { inputTokens?: number; outputTokens?: number }
  ): Promise<void> {
    // Le relevé de consommation passe par le relais : le cookie de session
    // authentifie, et le jeton Vibe n'est plus nécessaire. L'appel est « au
    // feu et forget » — sans session, l'amont le refuse et l'échec est
    // absorbé, comme avant.
    const post = async (path: string, body: unknown) => {
      try {
        await fetch(ApiServiceCore.resolveUrl(path), {
          body: JSON.stringify(body),
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
      } catch {}
    };
    await post("/v1/log-usage", {
      action_type: "api_query",
      endpoint,
      inputTokens: details?.inputTokens,
      outputTokens: details?.outputTokens,
      tokens,
      tokensUsed: tokens,
    });
    await post("/v1/usage/log", {
      action_type: "api_query",
      endpoint,
      tokens,
      tokensUsed: tokens,
    });
  }
}
