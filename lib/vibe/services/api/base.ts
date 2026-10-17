/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — API CORE CLIENT (base.ts)
 * Configuration, cache, requêtes réseau, tokens et alias Vibe
 * ============================================================================
 */

import { MAI_API_URL } from "@/lib/constants";
import { AppStorage } from "@/lib/vibe/services/storageAdapter";
import type { Post } from "@/lib/vibe/types/vibe";

export const API_BASE = MAI_API_URL;

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
      await fetch(`${API_BASE}/v1/logout`, {
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

  public static toVibeAliasEndpoint(endpoint: string): string | null {
    if (
      typeof endpoint !== "string" ||
      (endpoint !== "/v1" && !endpoint.startsWith("/v1/"))
    )
      return null;
    return `/api/vibe${endpoint.slice("/v1".length)}`;
  }

  public static async executeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = ApiServiceCore.getToken();
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
      if (errJson.code) err.code = errJson.code;
      err.body = errJson;
      throw err;
    }

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
      ApiServiceCore.logUsage(endpoint).catch(() => {});
    }

    const json = await response.json();

    if (!isReadRequest) {
      ApiServiceCore.invalidateCache();
    }

    return json;
  }

  public static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const aliasEndpoint = ApiServiceCore.toVibeAliasEndpoint(endpoint);
    const sessionGeneration = ApiServiceCore.sessionGeneration;
    try {
      return await ApiServiceCore.executeRequest<T>(endpoint, options);
    } catch (error) {
      if (sessionGeneration !== ApiServiceCore.sessionGeneration) throw error;
      if (!aliasEndpoint || !ApiServiceCore.shouldRetryVibeAlias(error))
        throw error;
      return ApiServiceCore.executeRequest<T>(aliasEndpoint, options);
    }
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
      const token = ApiServiceCore.getToken();
      const headers: Record<string, string> = { Accept: "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
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

  public static async logUsage(endpoint: string, tokens = 10): Promise<void> {
    const token = ApiServiceCore.getToken();
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
