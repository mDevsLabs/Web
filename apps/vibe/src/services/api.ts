/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — API CLIENT (src/services/api.ts)
 * Centralized API calls to https://mai.val.run with JWT Bearer token
 * Uses standard /v1/ prefixes
 * ============================================================================
 */

import type {
  Post,
  Profile,
  Comment,
  DirectMessage,
  DMConversation,
  NotificationItem,
  MAIQuotas,
  MAIConversationSummary,
  MaiToolCall,
  UserSettings,
  User,
  VibeBook,
  VibeBookMember,
  VibeBookPost,
  BookComment,
  ProfileListUser,
  Poll,
  UnifiedSearchResult,
  ServerDraft,
} from '../types/vibe';
import { AppStorage } from './storageAdapter';

export const API_BASE =
  (import.meta as any).env?.VITE_API_URL ||
  (import.meta as any).env?.VITE_API_BASE ||
  (typeof window !== 'undefined' &&
   (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
   !(import.meta as any).env?.VITE_API_URL &&
   !(import.meta as any).env?.VITE_API_BASE
    ? ''
    : 'https://mai.val.run');

// ─────────────────────────────────────────────
// TRADUCTION (DeepL) — langues cibles & résolution de la langue utilisateur
// ─────────────────────────────────────────────
/** Résultat de POST /v1/translate (DeepL, repli mAI côté serveur). */
export interface TranslateResult {
  success: boolean;
  detected_language: string;
  translation: string;
  target_lang?: string;
  /** Moteur réellement utilisé : 'deepl' ou 'mai' (repli). */
  provider?: 'deepl' | 'mai';
  /** true si le contenu source est déjà dans la langue cible. */
  same_language?: boolean;
  cached?: boolean;
}

/** Périodes supportées par les endpoints stats (?period=). */
export type StatsPeriod = '7d' | '30d' | '90d' | '12m';

/** Point quotidien d'une série stats créateur. */
export interface CreatorSeriesPoint {
  day: string;
  views: number;
  likes: number;
  reposts: number;
  replies: number;
  profile_views: number;
}

/** Statistiques créateur agrégées (champs historiques + séries à période). */
export interface CreatorStats {
  total_views: number;
  total_likes: number;
  total_reposts: number;
  total_replies: number;
  posts_count: number;
  top_post: Post | null;
  daily: Array<{ day: string; views: number; posts: number }>;
  period?: string;
  series?: CreatorSeriesPoint[];
  sources?: Array<{ source: string; views: number }>;
  profile_views?: number;
  /** Période précédente (comparaison de croissance). */
  previous_period?: { total_views: number; total_likes: number; total_reposts: number; total_replies: number; posts_count: number } | null;
  /** Jour le plus vu (événement vues) de la période. */
  best_day?: { day: string; views: number } | null;
  /** Jour de publication le plus performant. */
  best_publish_day?: { day: string; views: number; posts: number } | null;
  /** Répartition horaire des vues (0-23). */
  hourly?: Array<{ hour: number; views: number }>;
  /** Top 5 des publications les plus engageantes. */
  top_posts?: Array<Post & { engagement?: number }>;
  /** Taux d'engagement global (%). */
  engagement_rate?: number;
  /** Fréquence de publication (posts/semaine). */
  posts_per_week?: number;
}

/** Statistiques d'un post (auteur uniquement). */
export interface PostStats {
  views: number;
  likes: number;
  reposts: number;
  replies: number;
  bookmarks: number;
  engagement_rate: number;
  period?: string;
  reach_7d: Array<{ day: string; views: number }>;
  reach?: Array<{ day: string; views: number }>;
  top_referrers: unknown[];
}

/** Langues cibles supportées par DeepL (libellés français). */
export const TRANSLATION_LANGUAGES: Array<{ code: string; label: string }> = [
  { code: 'AR', label: 'Arabe' },
  { code: 'BG', label: 'Bulgare' },
  { code: 'CS', label: 'Tchèque' },
  { code: 'DA', label: 'Danois' },
  { code: 'DE', label: 'Allemand' },
  { code: 'EL', label: 'Grec' },
  { code: 'EN-US', label: 'Anglais (États-Unis)' },
  { code: 'EN-GB', label: 'Anglais (Royaume-Uni)' },
  { code: 'ES', label: 'Espagnol' },
  { code: 'ET', label: 'Estonien' },
  { code: 'FI', label: 'Finnois' },
  { code: 'FR', label: 'Français' },
  { code: 'HE', label: 'Hébreu' },
  { code: 'HU', label: 'Hongrois' },
  { code: 'ID', label: 'Indonésien' },
  { code: 'IT', label: 'Italien' },
  { code: 'JA', label: 'Japonais' },
  { code: 'KO', label: 'Coréen' },
  { code: 'LT', label: 'Lituanien' },
  { code: 'LV', label: 'Letton' },
  { code: 'NB', label: 'Norvégien' },
  { code: 'NL', label: 'Néerlandais' },
  { code: 'PL', label: 'Polonais' },
  { code: 'PT-BR', label: 'Portugais (Brésil)' },
  { code: 'PT-PT', label: 'Portugais (Portugal)' },
  { code: 'RO', label: 'Roumain' },
  { code: 'RU', label: 'Russe' },
  { code: 'SK', label: 'Slovaque' },
  { code: 'SL', label: 'Slovène' },
  { code: 'SV', label: 'Suédois' },
  { code: 'TR', label: 'Turc' },
  { code: 'UK', label: 'Ukrainien' },
  { code: 'VI', label: 'Vietnamien' },
  { code: 'ZH', label: 'Chinois' },
];

/** Convertit une langue de navigateur (« fr-FR ») en code DeepL (« FR »). */
export function browserToDeepLCode(tag: string): string {
  const lower = String(tag || '').trim().toLowerCase();
  if (!lower) return 'EN-US';
  const region = (lower.split('-')[1] || '').toUpperCase();
  const base = lower.slice(0, 2);
  if (base === 'en') return region === 'GB' ? 'EN-GB' : 'EN-US';
  if (base === 'pt') return region === 'BR' ? 'PT-BR' : 'PT-PT';
  const generic = TRANSLATION_LANGUAGES.find((l) => l.code.toLowerCase() === base);
  return generic ? generic.code : 'EN-US';
}

// ─────────────────────────────────────────────
// CACHE GET (TTL court) + dédoublonnage des requêtes en vol.
// Réduit fortement les latences perçues (feed, profils, DMs…).
// Toute écriture invalide le cache pour rester cohérent.
// ─────────────────────────────────────────────
const GET_CACHE_TTL = 15000;
const OFFLINE_FEED_KEYS = [
  'vibe_offline_feed_for_you',
  'vibe_offline_feed_stream',
  'vibe_offline_feed_trending',
] as const;

interface CacheEntry { data: any; ts: number }

export class ApiService {
  private static cache = new Map<string, CacheEntry>();
  private static inflight = new Map<string, Promise<any>>();
  // Une réponse déjà partie en vol ne doit pas repeupler le cache après une purge.
  private static cacheGeneration = 0;
  private static sessionGeneration = 0;

  private static cacheGet<T>(endpoint: string, ttlMs: number = GET_CACHE_TTL): Promise<T> | null {
    const hit = this.cache.get(endpoint);
    if (hit && Date.now() - hit.ts < ttlMs) return Promise.resolve(hit.data as T);
    return null;
  }

  private static async cachedRequest<T>(endpoint: string, ttlMs: number = GET_CACHE_TTL): Promise<T> {
    const cached = this.cacheGet<T>(endpoint, ttlMs);
    if (cached) return cached;

    const pending = this.inflight.get(endpoint);
    if (pending) return pending as Promise<T>;

    const generation = this.cacheGeneration;
    const p: Promise<T> = this.request<T>(endpoint)
      .then((data) => {
        if (generation === this.cacheGeneration) {
          this.cache.set(endpoint, { data, ts: Date.now() });
        }
        return data;
      })
      .finally(() => {
        // Ne pas supprimer une requête plus récente lancée après une invalidation.
        if (this.inflight.get(endpoint) === p) this.inflight.delete(endpoint);
      });

    this.inflight.set(endpoint, p);
    return p;
  }

  /**
   * Purge complète du cache mémoire, y compris les dédoublonnages en vol.
   * Les réponses déjà lancées ne peuvent plus réinjecter leurs données.
   * TEST: invalider puis résoudre une promesse GET ne doit pas recréer une entrée.
   */
  public static clearCache(): void {
    this.cacheGeneration += 1;
    this.cache.clear();
    this.inflight.clear();
  }

  /** Invalide tout ou partie du cache GET (préfixe d'endpoint, ex. '/v1/dms'). */
  public static invalidateCache(prefix?: string) {
    if (!prefix) {
      this.clearCache();
      return;
    }

    this.cacheGeneration += 1;
    for (const key of Array.from(this.cache.keys())) {
      if (key.includes(prefix)) this.cache.delete(key);
    }
    for (const key of Array.from(this.inflight.keys())) {
      if (key.includes(prefix)) this.inflight.delete(key);
    }
  }

  /** Supprime les seuls snapshots explicitement enregistrés pour le mode hors-ligne. */
  public static clearOfflineData(): void {
    for (const key of OFFLINE_FEED_KEYS) AppStorage.removeItem(key);
    // Couvre aussi une clé offline future, sans toucher aux préférences de thème
    // ou aux brouillons explicitement gérés par une autre couche.
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        for (const key of Object.keys(window.localStorage)) {
          if (key.startsWith('vibe_offline_')) AppStorage.removeItem(key);
        }
      }
    } catch {}
  }

  /** Précharge les profils auteurs d'un flux pour un affichage instantané des pages profil. */
  public static prefetchProfiles(posts: Array<{ username?: string; author_id?: string }>): void {
    const usernames = Array.from(
      new Set(posts.map((p) => p.username).filter((u): u is string => Boolean(u)))
    ).slice(0, 8);
    for (const u of usernames) this.prefetchProfile(u);
  }

  /** Précharge en arrière-plan le profil + ses posts (sans bloquer l'UI). */
  public static prefetchProfile(username: string): void {
    const cleanUser = username.trim().replace(/^@/, '');
    const endpoint = `/v1/profiles/${encodeURIComponent(cleanUser)}`;
    this.cachedRequest(endpoint, 60000).catch(() => {});
  }
  public static getToken(): string | null {
    return AppStorage.getItem('vibe_jwt_token');
  }

  public static setToken(token: string) {
    const previousToken = this.getToken();
    if (previousToken && previousToken !== token) {
      this.sessionGeneration += 1;
      this.clearCache();
      this.clearOfflineData();
      AppStorage.removeItem('vibe_user_data');
    }
    AppStorage.setItem('vibe_jwt_token', token);
  }

  public static removeToken() {
    // Une déconnexion est une frontière de session : ni cache mémoire, ni snapshot
    // hors-ligne, ni réponse GET déjà en vol ne doit conserver l'identité précédente.
    this.sessionGeneration += 1;
    this.clearCache();
    AppStorage.removeItem('vibe_jwt_token');
    AppStorage.removeItem('vibe_user_data');
    this.clearOfflineData();
  }

  /** Révoque le token courant côté serveur sans bloquer la fermeture locale. */
  public static async revokeSession(token: string | null = this.getToken()): Promise<void> {
    if (!token) return;
    try {
      await fetch(`${API_BASE}/v1/logout`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // La purge locale restePrioritaire même si le réseau est indisponible.
    }
  }

  /** Langue cible de traduction : réglage utilisateur (miroir local), sinon langue du navigateur. */
  public static resolveTargetLanguage(): string {
    const stored = String(AppStorage.getItem('vibe_ui_language') || '').trim().toUpperCase();
    if (stored && TRANSLATION_LANGUAGES.some((l) => l.code === stored)) return stored;
    return browserToDeepLCode(typeof navigator !== 'undefined' ? navigator.language : '');
  }

  /** Miroir local de la langue de traduction (évite un appel settings à chaque traduction). */
  public static setUiLanguageMirror(lang: string) {
    AppStorage.setItem('vibe_ui_language', lang);
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
    if (typeof endpoint !== 'string' || (endpoint !== '/v1' && !endpoint.startsWith('/v1/'))) return null;
    return `/api/vibe${endpoint.slice('/v1'.length)}`;
  }

  /** Un seul essai réseau/HTTP. La politique d'alias est centralisée dans request(). */
  private static async executeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    const method = (options.method || 'GET').toUpperCase();
    const isReadRequest = method === 'GET' || method === 'HEAD';

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
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

      if (isReadRequest && url.startsWith('https://mai.val.run') && isLocalhost) {
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
      const err = new Error(errJson.error || `Erreur (${response.status})`) as any;
      err.status = response.status;
      // Code machine optionnel renvoyé par le backend (ex. 'PIN_LIMIT')
      if (errJson.code) err.code = errJson.code;
      err.body = errJson;
      throw err;
    }

    // Les GET sont déjà couverts par !isReadRequest. Exclure aussi les trackers
    // de vue POST : une visite simple ne doit pas créer elle-même un usage API.
    // TEST: viewPost/trackProfileView => aucun POST /v1/usage/log.
    const SKIP_LOG_PATTERNS = ['/usage/log', '/like', '/repost', '/bookmark', '/notifications/read', '/models'];
    const isViewEvent = /\/view\/?(?:\?|$)/.test(endpoint);
    const shouldLog = !isReadRequest && !isViewEvent && !SKIP_LOG_PATTERNS.some(p => endpoint.includes(p));

    if (shouldLog) {
      this.logUsage(endpoint).catch(() => {});
    }

    const json = await response.json();

    if (!isReadRequest) {
      this.invalidateCache();
    }

    return json;
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const aliasEndpoint = this.toVibeAliasEndpoint(endpoint);
    const sessionGeneration = this.sessionGeneration;
    try {
      return await this.executeRequest<T>(endpoint, options);
    } catch (error) {
      // Si la session a changé entre les deux essais, ne jamais porter une
      // mutation vers le compte suivant.
      if (sessionGeneration !== this.sessionGeneration) throw error;
      if (!aliasEndpoint || !this.shouldRetryVibeAlias(error)) throw error;
      return this.executeRequest<T>(aliasEndpoint, options);
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
      const token = this.getToken();
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      // Une exception réseau est propagée telle quelle : aucune écriture n'est rejouée.
      return fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      });
    };

    const toError = async (response: Response): Promise<any> => {
      const body = (await response.json().catch(() => ({}))) || {};
      const error = new Error(body.error || errorMessage) as any;
      error.status = response.status;
      error.body = body;
      return error;
    };

    const sessionGeneration = this.sessionGeneration;
    let response: Response = await send(primaryEndpoint);

    if (!response.ok) {
      const error = await toError(response);
      if (!this.shouldRetryVibeAlias(error) || sessionGeneration !== this.sessionGeneration) throw error;
      // send() recrée le FormData et relit le jeton courant.
      response = await send(fallbackEndpoint);
      if (!response.ok) throw await toError(response);
    }

    return response.json() as Promise<T>;
  }

  // ─────────────────────────────────────────────
  // AUTHENTICATION & CURRENT USER
  // ─────────────────────────────────────────────
  public static async register(email: string, username: string, password: string) {
    return this.request<{ success: boolean; email: string; status: string }>('/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password }),
    });
  }

  public static async verifyRegister(email: string, username: string, password: string, code: string) {
    const res = await this.request<{ success: boolean; token: string; tier: string }>('/verify-register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password, code }),
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  public static async login(identifier: string, password: string) {
    return this.request<{ success: boolean; email: string; status: string }>('/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
  }

  public static async verifyLogin(email: string, code: string) {
    const res = await this.request<{ success: boolean; token: string; tier: string }>('/verify-login', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  public static async resendCode(email: string, action: string = 'login') {
    return this.request<{ success: boolean; error?: string }>('/resend-code', {
      method: 'POST',
      body: JSON.stringify({ email, action }),
    });
  }

  public static async getCurrentUser(): Promise<{ user: User; profile: Profile; quotas: MAIQuotas }> {
    return this.request<{ user: User; profile: Profile; quotas: MAIQuotas }>('/v1/me');
  }

  public static async getSuggestedUsers(): Promise<{ users: Array<{ id: string | number; username: string; display_name?: string; avatar_url?: string; bio?: string }> }> {
    return this.request('/v1/users/suggested');
  }

  // ─────────────────────────────────────────────
  // FEEDS & POSTS & TRENDS
  // ─────────────────────────────────────────────
  public static async getFeed(type: 'for_you' | 'stream' | 'trending' = 'for_you', tag?: string, cursor?: string): Promise<{ posts: Post[]; mode: string; title: string; nextCursor?: string | null }> {
    const queryParams = new URLSearchParams({ type });
    if (tag) queryParams.append('tag', tag);
    if (cursor) queryParams.append('cursor', cursor);
    const sessionGeneration = this.sessionGeneration;
    const cacheGeneration = this.cacheGeneration;

    try {
      const res = await this.request<{ posts: Post[]; mode: string; title: string; nextCursor?: string | null }>(`/v1/feed?${queryParams.toString()}`);

      // Ne pas recréer un snapshot après un logout ou une écriture survenu pendant le fetch.
      if (!cursor && !tag && res?.posts && res.posts.length > 0 && sessionGeneration === this.sessionGeneration && cacheGeneration === this.cacheGeneration) {
        AppStorage.setJSON(`vibe_offline_feed_${type}`, res);
      }
      return res;
    } catch (networkErr) {
      // Fallback gracieux en mode hors-ligne : récupérer le dernier flux en cache local.
      const cached = sessionGeneration === this.sessionGeneration && cacheGeneration === this.cacheGeneration
        ? AppStorage.getJSON<{ posts: Post[]; mode: string; title: string } | null>(`vibe_offline_feed_${type}`, null)
        : null;
      if (cached && cached.posts && cached.posts.length > 0) {
        return {
          ...cached,
          title: `${cached.title || 'Flux'} (Hors-ligne)`,
          nextCursor: null,
        };
      }
      throw networkErr;
    }
  }

  public static async getTrends(): Promise<{ success: boolean; trends: Array<{ tag: string; category?: string; posts: string; post_count?: number }> }> {
    try {
      return await this.cachedRequest('/v1/trends', 60000);
    } catch {
      // Aucun fallback statique — retourner une liste vide si le backend est inaccessible
      return { success: false, trends: [] };
    }
  }

  /** Top Vibe — meilleures publications des N derniers jours (Explorer). */
  public static async getTopPosts(limit: number = 5, days: number = 30): Promise<{ success: boolean; posts: Post[] }> {
    const qs = `?limit=${limit}&days=${days}`;
    try {
      return await this.cachedRequest(`/v1/posts/top${qs}`, 60000);
    } catch {
      return { success: false, posts: [] };
    }
  }

  /** Top Vibers — comptes les plus suivis (Explorer). */
  public static async getTopVibers(limit: number = 5): Promise<{ users: Array<{ id: number; username: string; display_name?: string; avatar_url?: string; is_verified?: boolean; followers_count?: number; bio?: string; is_following?: boolean }> }> {
    const qs = `?limit=${limit}`;
    try {
      return await this.cachedRequest(`/v1/users/top${qs}`, 60000);
    } catch {
      return { users: [] };
    }
  }

  public static async searchUsers(q: string): Promise<{ users: Array<{ id: number; username: string; display_name?: string; avatar_url?: string; is_verified?: boolean; followers_count?: number }> }> {
    try {
      return await this.request(`/v1/search/users?q=${encodeURIComponent(q)}`);
    } catch (error: any) {
      // Le troisième endpoint est une ancienne route métier, pas l'alias /api/vibe.
      // On ne l'essaie que si les deux routes de recherche ont réellement disparu.
      if (!this.shouldRetryVibeAlias(error)) return { users: [] };
      try {
        return await this.request(`/v1/dms/users?q=${encodeURIComponent(q)}`);
      } catch {
        return { users: [] };
      }
    }
  }

  public static async searchPosts(q: string, limit: number = 20, offset: number = 0): Promise<{ posts: Post[]; count: number }> {
    try {
      return await this.request(`/v1/search/posts?q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}`);
    } catch {
      return { posts: [], count: 0 };
    }
  }

  /** Recherche globale unifiée : posts + utilisateurs + livres + DMs (limit/section). */
  public static async searchUnified(q: string, limit: number = 5): Promise<UnifiedSearchResult> {
    try {
      return await this.cachedRequest<UnifiedSearchResult>(`/v1/search/unified?q=${encodeURIComponent(q)}&limit=${limit}`, 15000);
    } catch {
      return { posts: [], users: [], books: [], messages: [], total: 0 };
    }
  }

  /** Vote (modifiable) à un sondage de post. */
  public static async votePoll(postId: string, optionId: string): Promise<{ success: boolean; poll: Poll }> {
    this.invalidateCache('/v1/posts/');
    return this.request(`/v1/posts/${postId}/poll/vote`, {
      method: 'POST',
      body: JSON.stringify({ option_id: optionId }),
    });
  }

  /** Statistiques créateur d'un post (auteur uniquement). */
  public static async getPostStats(postId: string, period: StatsPeriod = '7d'): Promise<PostStats> {
    return this.cachedRequest(`/v1/posts/${postId}/stats?period=${period}`, 30000);
  }

  /** Statistiques créateur agrégées (?period=7d|30d|90d|12m, défaut 30d). */
  public static async getCreatorStats(period: StatsPeriod = '30d'): Promise<CreatorStats> {
    return this.cachedRequest(`/v1/users/me/creator-stats?period=${period}`, 60000);
  }

  /** Visites profil agrégées (?period=7d|30d|90d|12m, défaut 30d, soi-même uniquement). */
  public static async getProfileViews(period: StatsPeriod = '30d'): Promise<{ period: string; total: number; series: Array<{ day: string; views: number }> }> {
    return this.cachedRequest(`/v1/users/me/profile-views?period=${period}`, 60000);
  }

  /** Track une visite profil (fire-and-forget, anti-spam serveur 1/24h, pas d'auto-comptage). */
  public static async trackProfileView(username: string, source = 'profile'): Promise<{ success: boolean; counted?: boolean }> {
    const clean = username.replace(/^@/, '');
    if (!clean) return { success: false };
    const body = JSON.stringify({ source });
    try {
      return await this.request(`/v1/profiles/${encodeURIComponent(clean)}/view`, { method: 'POST', body });
    } catch {
      return { success: false };
    }
  }

  /** Traduction d'un texte brut (ex : message DM) via /v1/ai/translate. */
  public static async translateText(text: string, targetLang: string): Promise<TranslateResult> {
    return this.request('/v1/ai/translate', {
      method: 'POST',
      body: JSON.stringify({ text, target_lang: targetLang }),
    });
  }

  /** Suggestions de comptes pour l'onboarding (10 populaires non suivis). */
  public static async getOnboardingSuggestions(): Promise<{ users: Array<{ id: number; username: string; display_name?: string; avatar_url?: string; is_verified?: boolean; followers_count?: number; bio?: string }> }> {
    try {
      return await this.cachedRequest('/v1/onboarding/suggestions', 60000);
    } catch {
      return { users: [] };
    }
  }

  /** Marque l'onboarding comme terminé. */
  public static async completeOnboarding(): Promise<{ success: boolean }> {
    return this.request('/v1/onboarding/complete', { method: 'POST' });
  }

  /** Épingle un message dans une conversation (max 3, adressage partnerId). */
  public static async pinMessage(partnerId: string | number, messageId: string): Promise<{ success: boolean; pinned: boolean }> {
    this.invalidateCache('/dms/');
    return this.request(`/v1/dms/conversations/${partnerId}/pin`, {
      method: 'POST',
      body: JSON.stringify({ message_id: messageId }),
    });
  }

  /** Désépingle un message d'une conversation. */
  public static async unpinMessage(partnerId: string | number, messageId: string): Promise<{ success: boolean; pinned: boolean }> {
    this.invalidateCache('/dms/');
    return this.request(`/v1/dms/conversations/${partnerId}/pin/${messageId}`, { method: 'DELETE' });
  }

  /** Recherche plein texte dans une conversation DM. */
  public static async searchDMMessages(partnerId: string | number, q: string): Promise<{ messages: DirectMessage[] }> {
    try {
      return await this.request(`/v1/dms/messages/${partnerId}/search?q=${encodeURIComponent(q)}`);
    } catch {
      return { messages: [] };
    }
  }

  /** Marque manuellement une conversation comme non lue. */
  public static async markConversationUnread(partnerId: string | number): Promise<{ success: boolean }> {
    this.invalidateCache('/dms/');
    return this.request(`/v1/dms/conversations/${partnerId}/mark-unread`, { method: 'POST' });
  }

  /** Posts programmés de l'utilisateur courant (tri scheduled_at ASC). */
  public static async getScheduledPosts(): Promise<{ posts: Post[] }> {
    try {
      return await this.cachedRequest<{ posts: Post[] }>('/v1/posts/scheduled', 15000);
    } catch {
      return { posts: [] };
    }
  }

  /** Replanifie un post (scheduled_at=null → publie aussitôt). */
  public static async reschedulePost(postId: string, scheduledAt: string | null): Promise<{ success: boolean; status?: string; scheduled_at?: string }> {
    this.invalidateCache('/v1/posts/');
    return this.request(`/v1/posts/${postId}/reschedule`, {
      method: 'PATCH',
      body: JSON.stringify({ scheduled_at: scheduledAt }),
    });
  }

  /** Brouillons serveur (multi-appareils). */
  public static async getDrafts(): Promise<{ drafts: ServerDraft[] }> {
    try {
      return await this.cachedRequest<{ drafts: ServerDraft[] }>('/v1/drafts', 15000);
    } catch {
      return { drafts: [] };
    }
  }

  public static async saveDraft(draft: { id?: string; html: string; text: string; visibility?: string; scheduled_at?: string | null; ai_generated?: boolean; media_assets?: Array<{ url: string; media_type?: string; size?: number; alt_text?: string }> }): Promise<{ success: boolean; id: string }> {
    if (draft.id) {
      return this.request(`/v1/drafts/${draft.id}`, {
        method: 'PUT',
        body: JSON.stringify(draft),
      });
    }
    return this.request('/v1/drafts', {
      method: 'POST',
      body: JSON.stringify(draft),
    });
  }

  public static async deleteDraft(id: string): Promise<{ success: boolean }> {
    return this.request(`/v1/drafts/${id}`, { method: 'DELETE' });
  }

  /** Répond à une invitation de co-signature. */
  public static async respondToCollab(postId: string, accept: boolean): Promise<{ success: boolean; status: string }> {
    this.invalidateCache('/v1/posts/');
    const action = accept ? 'accept' : 'decline';
    return this.request(`/v1/posts/${postId}/collaborate/${action}`, { method: 'POST' });
  }

  public static async getUserLikedPosts(username: string): Promise<{ posts: Post[] }> {
    const cleanUser = username.trim().replace(/^@/, '');
    try {
      return await this.cachedRequest<{ posts: Post[] }>(`/v1/profiles/${encodeURIComponent(cleanUser)}/likes`, 15000);
    } catch {
      return { posts: [] };
    }
  }

  public static async createPost(
    content: string,
    media_url?: string,
    media_assets?: Array<{ url: string; media_type: string; size?: number; alt_text?: string }>,
    options?: { aiGenerated?: boolean; quotedPostId?: string; scheduledAt?: string | null; visibility?: 'public' | 'followers' | 'circle' | 'private'; poll?: { question?: string; options: string[]; duration_hours: number }; collaboratorUsername?: string; mediaPositions?: number[] }
  ): Promise<{ success: boolean; post: Post }> {
    const payload = {
      content,
      media_url,
      media_assets,
      ai_generated: options?.aiGenerated,
      quoted_post_id: options?.quotedPostId,
      scheduled_at: options?.scheduledAt || undefined,
      visibility: options?.visibility || 'public',
      poll: options?.poll,
      collaborator_username: options?.collaboratorUsername,
      media_positions: options?.mediaPositions,
    };
    return this.request('/v1/posts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /** Met à jour une Vibe existante (auteur uniquement). */
  public static async updatePost(
    id: string,
    content: string,
    media_assets?: Array<{ url: string; media_type: string; size?: number; alt_text?: string }>,
    options?: { scheduledAt?: string | null; visibility?: 'public' | 'followers' | 'circle' | 'private'; mediaPositions?: number[] }
  ): Promise<{ success: boolean; post: Post }> {
    const payload = {
      content,
      media_assets,
      scheduled_at: options?.scheduledAt,
      visibility: options?.visibility,
      media_positions: options?.mediaPositions,
    };
    return this.request(`/v1/posts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  public static async getPost(id: string): Promise<{ post: Post }> {
    return this.request(`/v1/posts/${id}`);
  }

  public static async deletePost(id: string): Promise<{ success: boolean }> {
    return this.request(`/v1/posts/${id}`, { method: 'DELETE' });
  }

  public static async toggleLike(id: string): Promise<{ success: boolean; liked: boolean }> {
    return this.request(`/v1/posts/${id}/like`, { method: 'POST' });
  }

  public static async toggleRepost(id: string): Promise<{ success: boolean; reposted: boolean }> {
    return this.request(`/v1/posts/${id}/repost`, { method: 'POST' });
  }

  public static async toggleBookmark(id: string): Promise<{ success: boolean; bookmarked: boolean }> {
    return this.request(`/v1/posts/${id}/bookmark`, { method: 'POST' });
  }

  // ─────────────────────────────────────────────
  // LIVRES — collections de « Vibe préférées » (max 5 possédés par compte, collaboratifs)
  // ─────────────────────────────────────────────
  public static async getBooks(postId?: string): Promise<{ success: boolean; books: VibeBook[]; maxBooks: number; ownedCount: number }> {
    const qs = postId ? `?post_id=${encodeURIComponent(postId)}` : '';
    return this.request(`/v1/books${qs}`);
  }

  public static async createBook(title: string, icon: string, isPublic = false): Promise<{ success: boolean; book: VibeBook }> {
    // La conversation Messages du Livre est créée côté serveur : rafraîchir la liste DM
    this.invalidateCache('/dms/');
    const body = JSON.stringify({ title, icon, is_public: isPublic });
    return this.request('/v1/books', { method: 'POST', body });
  }

  /** Recherche les Livres publics par titre (mention @livre / attachement dans un post). */
  public static async searchPublicBooks(q: string): Promise<{ success: boolean; books: Array<{ id: string; title: string; icon?: string; owner_username?: string; owner_display_name?: string; members_count?: number; items_count?: number }> }> {
    const qs = `?q=${encodeURIComponent(q)}`;
    return this.request(`/v1/books/public${qs}`);
  }

  public static async updateBook(bookId: string, data: { title?: string; icon?: string; is_public?: boolean }): Promise<{ success: boolean; book: VibeBook }> {
    const body = JSON.stringify(data);
    return this.request(`/v1/books/${bookId}/update`, { method: 'POST', body });
  }

  public static async deleteBook(bookId: string): Promise<{ success: boolean }> {
    this.invalidateCache('/dms/');
    return this.request(`/v1/books/${bookId}`, { method: 'DELETE' });
  }

  /** Enregistre / retire une Vibe d'un Livre (toggle). */
  public static async toggleBookItem(bookId: string, postId: string): Promise<{ success: boolean; saved: boolean }> {
    return this.request(`/v1/books/${bookId}/posts/${postId}`, { method: 'POST' });
  }

  /** Contenu d'un Livre : Vibe partagées + membres. */
  public static async getBookPosts(bookId: string): Promise<{ success: boolean; book: VibeBook; members: VibeBookMember[]; posts: VibeBookPost[] }> {
    return this.request(`/v1/books/${bookId}/posts`);
  }

  /** Rejoint un Livre par code (ou URL de partage) — adhésion immédiate. */
  public static async joinBook(code: string): Promise<{ success: boolean; book: VibeBook; already_member?: boolean }> {
    this.invalidateCache('/dms/');
    const body = JSON.stringify({ code });
    return this.request('/v1/books/join', { method: 'POST', body });
  }

  /** Membres d'un Livre (qui a rejoint). */
  public static async getBookMembers(bookId: string): Promise<{ success: boolean; members: VibeBookMember[] }> {
    return this.request(`/v1/books/${bookId}/members`);
  }

  /** Quitte un Livre collaboratif (membres non créateurs). */
  public static async leaveBook(bookId: string): Promise<{ success: boolean }> {
    this.invalidateCache('/dms/');
    return this.request(`/v1/books/${bookId}/leave`, { method: 'POST' });
  }

  /** Régénère le code de partage d'un Livre (créateur uniquement). */
  public static async regenerateBookCode(bookId: string): Promise<{ success: boolean; join_code: string }> {
    return this.request(`/v1/books/${bookId}/regenerate-code`, { method: 'POST' });
  }

  /** Livres (du compte courant) contenant un post donné — badge PostCard. */
  public static async getBooksForPost(postId: string): Promise<{ success: boolean; book_ids: string[] }> {
    return this.request(`/v1/books/for-post/${postId}`);
  }

  /** Épingle / désépingle une Vibe dans un Livre (max 3, membres autorisés). */
  public static async pinBookPost(bookId: string, postId: string, pinned: boolean): Promise<{ success: boolean; pinned: boolean }> {
    return this.request(`/v1/books/${bookId}/posts/${postId}/pin`, {
      method: 'POST',
      body: JSON.stringify({ pinned }),
    });
  }

  /** Exclut un membre d'un Livre (créateur uniquement). */
  public static async kickBookMember(bookId: string, userId: string | number): Promise<{ success: boolean; removed: number }> {
    this.invalidateCache('/dms/');
    return this.request(`/v1/books/${bookId}/members/${userId}`, { method: 'DELETE' });
  }

  /** Transfère la propriété d'un Livre à un membre (créateur uniquement). */
  public static async transferBookOwnership(bookId: string, userId: string | number): Promise<{ success: boolean; new_owner: number }> {
    this.invalidateCache('/dms/');
    return this.request(`/v1/books/${bookId}/members/${userId}/transfer-ownership`, { method: 'POST' });
  }

  /** Discussion du Livre : liste des commentaires (pagée). */
  public static async getBookComments(bookId: string, limit = 50, offset = 0): Promise<{ success: boolean; comments: BookComment[] }> {
    return this.request(`/v1/books/${bookId}/comments?limit=${limit}&offset=${offset}`);
  }

  /** Ajoute un commentaire à la discussion du Livre (réponse citée optionnelle). */
  public static async addBookComment(bookId: string, content: string, replyToId?: string | null): Promise<{ success: boolean; comment: BookComment }> {
    return this.request(`/v1/books/${bookId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, ...(replyToId ? { reply_to_id: replyToId } : {}) }),
    });
  }

  /** Supprime un commentaire de la discussion (auteur ou créateur du Livre). */
  public static async deleteBookComment(bookId: string, commentId: string): Promise<{ success: boolean }> {
    return this.request(`/v1/books/${bookId}/comments/${commentId}`, { method: 'DELETE' });
  }

  /** Réagit à un message de la discussion du Livre (toggle emoji). */
  public static async reactBookComment(
    bookId: string,
    commentId: string,
    emoji: string
  ): Promise<{ success: boolean; reacted: boolean; reactions: { emoji: string; count: number; mine: boolean }[] }> {
    return this.request(`/v1/books/${bookId}/comments/${commentId}/react`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    });
  }

  /** Abonnés d'un profil (liste paginée, avec état « je suis »). */
  public static async getProfileFollowers(username: string, limit = 20, offset = 0): Promise<{ users: ProfileListUser[]; has_more: boolean }> {
    return this.request(`/v1/profiles/${username}/followers?limit=${limit}&offset=${offset}`);
  }

  /** Abonnements d'un profil (liste paginée, avec état « je suis »). */
  public static async getProfileFollowing(username: string, limit = 20, offset = 0): Promise<{ users: ProfileListUser[]; has_more: boolean }> {
    return this.request(`/v1/profiles/${username}/following?limit=${limit}&offset=${offset}`);
  }

  /** Retour d'algorithme sur un post : 'more' | 'less' | null (désactive). */
  public static async sendPostFeedback(id: string, value: 'more' | 'less' | null): Promise<{ success: boolean; my_feedback: 'more' | 'less' | null }> {
    return this.request(`/v1/posts/${id}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ value }),
    });
  }

  /**
   * Incrémente le compteur d'impressions d'un post. Appelé fire-and-forget
   * par le tracking de vues (IntersectionObserver). Le compteur est
   * volontairement approximatif côté affichage.
   * Accepte le temps passé pour le profil temporel (post_views).
   */
  public static async viewPost(id: string, opts?: { duration_ms?: number; dwell_ms?: number; visible_ratio?: number; source?: string }): Promise<{ success: boolean; views_count: number | null }> {
    const body = opts ? JSON.stringify({ duration_ms: opts.duration_ms, dwell_ms: opts.dwell_ms, visible_ratio: opts.visible_ratio, source: opts.source }) : undefined;
    return this.request(`/v1/posts/${id}/view`, { method: 'POST', ...(body ? { body } : {}) });
  }

  /** Épingler / désépingler un post sur son profil (max 2, contrôlé serveur). */
  public static async setPostPinned(id: string, pinned: boolean): Promise<{ success: boolean; pinned: boolean; pinned_count?: number; code?: string; error?: string }> {
    // La politique d'alias est dans request() : PIN_LIMIT et les autres erreurs
    // métier remontent directement, sans une seconde mutation.
    return this.request(`/v1/posts/${id}/pin`, {
      method: 'POST',
      body: JSON.stringify({ pinned }),
    });
  }

  /** Épingler / retirer de son profil un post d'un autre compte (max 2 au total, contrôlé serveur). */
  public static async setPostProfilePinned(id: string, pinned: boolean): Promise<{ success: boolean; pinned: boolean; pinned_count?: number; code?: string; error?: string }> {
    return this.request(`/v1/posts/${id}/profile-pin`, {
      method: 'POST',
      body: JSON.stringify({ pinned }),
    });
  }

  // ─────────────────────────────────────────────
  // COMMENTS
  // ─────────────────────────────────────────────
  public static async getComments(postId: string): Promise<{ comments: Comment[]; aiDigest: string | null; count: number }> {
    return this.cachedRequest(`/v1/posts/${postId}/comments`, 10000);
  }

  public static async addComment(
    postId: string,
    content: string,
    parent_comment_id?: string,
    media_assets?: Array<{ url: string; media_type: string; alt_text?: string }>
  ): Promise<{ success: boolean; comment: Comment; ai_pending?: boolean }> {
    const payload = { content, parent_comment_id, media_assets };
    return this.request(`/v1/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public static async likeComment(postId: string, commentId: string): Promise<{ success: boolean; liked: boolean; likes_count: number }> {
    return this.request(`/v1/posts/${postId}/comments/${commentId}/like`, { method: 'POST' });
  }

  // ─────────────────────────────────────────────
  // DIRECT MESSAGES (DMs)
  // ─────────────────────────────────────────────
  public static async getConversations(): Promise<{ conversations: DMConversation[] }> {
    return this.cachedRequest('/v1/dms/conversations', 8000);
  }

  public static async getMessages(partnerId: string | number): Promise<{ messages: DirectMessage[]; pinned_messages?: DirectMessage[] }> {
    return this.cachedRequest(`/v1/dms/messages/${partnerId}`, 5000);
  }

  public static async sendMessage(recipient_id: string | number, content: string, reply_to_id?: string, send_at?: string, conversation_id?: string, forwarded_from?: { message_id: string } | null, attached_post_id?: string): Promise<{ success: boolean; message: DirectMessage; scheduled?: boolean }> {
    this.invalidateCache('/dms/');
    const body = JSON.stringify({ recipient_id, content, reply_to_id, send_at, conversation_id, forwarded_from, attached_post_id });
    return this.request('/v1/dms/messages', { method: 'POST', body });
  }

  // ─────────────────────────────────────────────
  // MESSAGES DE GROUPE (migration 019)
  // ─────────────────────────────────────────────
  /** Crée un groupe dont le créateur devient admin. */
  public static async createGroup(name: string, memberIds: Array<string | number>): Promise<{ success: boolean; conversation_id: string; name: string; member_count: number }> {
    this.invalidateCache('/dms/');
    return this.request('/v1/dms/groups', {
      method: 'POST',
      body: JSON.stringify({ name, member_ids: memberIds }),
    });
  }

  /** Ajoute des membres (admin) — les ajoutés récupèrent tout l'historique. */
  public static async addGroupMembers(groupId: string, memberIds: Array<string | number>): Promise<{ success: boolean; added: number }> {
    this.invalidateCache('/dms/');
    return this.request(`/v1/dms/groups/${groupId}/members`, {
      method: 'POST',
      body: JSON.stringify({ member_ids: memberIds }),
    });
  }

  /** Retire un membre (admin) ou quitte le groupe soi-même. */
  public static async removeGroupMember(groupId: string, userId: string | number): Promise<{ success: boolean }> {
    this.invalidateCache('/dms/');
    return this.request(`/v1/dms/groups/${groupId}/members/${userId}`, { method: 'DELETE' });
  }

  /** Détails d'un groupe (nom, membres, rôle admin). */
  public static async getGroup(groupId: string): Promise<{ group: { id: string; group_name: string; group_avatar_url?: string; created_by: string; is_admin: boolean; members: Array<{ user_id: string; username: string; display_name?: string; avatar_url?: string; role: string; joined_at: string }> } }> {
    return this.request(`/v1/dms/groups/${groupId}`);
  }

  /** Met à jour le groupe (admin) : nom et/ou photo. */
  public static async updateGroup(groupId: string, data: { name?: string; avatar_url?: string | null }): Promise<{ success: boolean; group?: { group_name: string; group_avatar_url: string | null } }> {
    this.invalidateCache('/dms/');
    return this.request(`/v1/dms/groups/${groupId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /** Supprime définitivement le groupe (admin). */
  public static async deleteGroup(groupId: string): Promise<{ success: boolean }> {
    this.invalidateCache('/dms/');
    return this.request(`/v1/dms/groups/${groupId}`, { method: 'DELETE' });
  }

  /** Transfère le rôle d'administrateur du groupe à un membre. */
  public static async transferGroupAdmin(groupId: string, userId: string | number): Promise<{ success: boolean; new_admin: number }> {
    this.invalidateCache('/dms/');
    return this.request(`/v1/dms/groups/${groupId}/members/${userId}/transfer-admin`, { method: 'POST' });
  }

  /** Masque un message pour soi uniquement (« supprimer pour moi »). */
  public static async hideMessage(messageId: string): Promise<{ success: boolean; hidden: boolean }> {
    this.invalidateCache('/dms/');
    return this.request(`/v1/dms/messages/${messageId}/hide`, { method: 'POST' });
  }

  /** Mémorise côté serveur une traduction de message (max 3 langues). */
  public static async saveMessageTranslation(messageId: string, lang: string, text: string, detected?: string | null): Promise<{ success: boolean; translations: Record<string, { text: string; detected?: string | null; at?: string }> }> {
    return this.request(`/v1/dms/messages/${messageId}/translations`, {
      method: 'POST',
      body: JSON.stringify({ lang, text, detected }),
    });
  }

  /** Catalogue des outils mAI (lib/tools/index.json, filtré par réglages). */
  public static async getMAITools(): Promise<{ tools: Array<{ id: string; name: string; slash_command: string; mention_tag: string; description: string; icon_name: string; category: string; sensitive: boolean }> }> {
    return this.request('/v1/mai/tools');
  }

  /** Enregistre la liste des outils mAI activés (Paramètres → Outils mAI). */
  public static async updateMAITools(enabledToolIds: string[]): Promise<{ success: boolean; enabled_tool_ids: string[] }> {
    return this.request('/v1/mai/tools', {
      method: 'POST',
      body: JSON.stringify({ enabled_tool_ids: enabledToolIds }),
    });
  }

  public static async reactToMessage(messageId: string, emoji: string): Promise<{ success: boolean; reacted: boolean; reactions: { emoji: string; count: number; mine: boolean }[] }> {
    this.invalidateCache('/dms/');
    return this.request(`/v1/dms/messages/${messageId}/react`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    });
  }

  public static async generateDMReply(
    partnerId: string | number,
    draft?: string,
    preset: 'improve' | 'shorten' | 'extend' | 'tone' | 'custom' = 'improve',
    customPrompt?: string,
    tone?: string
  ): Promise<{ success: boolean; suggestion: string }> {
    const payload: Record<string, unknown> = { partner_id: partnerId, draft: draft || '', preset };
    if (preset === 'custom' && customPrompt) payload.custom_prompt = customPrompt;
    if (preset === 'tone' && tone) payload.tone = tone;
    try {
      return await this.request('/v1/dms/suggest-reply', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (error: any) {
      // Une ancienne route de génération n'est essayée que si la première a
      // réellement disparu ; jamais après un 401/429/500 ou une erreur réseau.
      if (!this.shouldRetryVibeAlias(error)) throw error;
      return this.request(`/v1/dms/generate-reply/${partnerId}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }
  }

  // ─────────────────────────────────────────────
  // DMs — MODÉRATION : blocage, signalement, suppression, renommage
  // ─────────────────────────────────────────────
  public static async blockUser(userId: string | number): Promise<{ success: boolean }> {
    return this.request('/v1/dms/block', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
  }

  public static async unblockUser(userId: string | number): Promise<{ success: boolean }> {
    return this.request('/v1/dms/unblock', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
  }

  public static async getBlockedUsers(): Promise<{ blocked: Array<{ id: string; blocked_user_id: string; blocked_username?: string; blocked_display_name?: string; blocked_avatar_url?: string; created_at: string }> }> {
    return this.request('/v1/dms/blocked');
  }

  // ─────────────────────────────────────────────
  // MUTE — masquage silencieux (posts + notifications, invisible pour l'autre)
  // ─────────────────────────────────────────────
  public static async muteUser(username: string, muted: boolean): Promise<{ success: boolean; muted: boolean }> {
    const clean = username.trim().replace(/^@/, '');
    return this.request(`/v1/users/${encodeURIComponent(clean)}/mute`, {
      method: 'POST',
      body: JSON.stringify({ muted }),
    });
  }

  public static async getMutedUsers(): Promise<{ muted: Array<{ id: string; muted_user_id: string; muted_username?: string; muted_display_name?: string; muted_avatar_url?: string; created_at: string }> }> {
    return this.request('/v1/users/muted');
  }

  public static async reportConversation(
    partnerId: string | number,
    reason: string,
    messageId?: string
  ): Promise<{ success: boolean }> {
    return this.request('/v1/dms/report', {
      method: 'POST',
      body: JSON.stringify({ reported_user_id: partnerId, reason, message_id: messageId }),
    });
  }

  public static async renameConversation(partnerId: string | number, customName: string): Promise<{ success: boolean }> {
    this.invalidateCache('/dms/');
    return this.request(`/v1/dms/conversations/${partnerId}/rename`, {
      method: 'POST',
      body: JSON.stringify({ name: customName }),
    });
  }

  public static async deleteConversation(partnerId: string | number): Promise<{ success: boolean }> {
    return this.request(`/v1/dms/conversations/${partnerId}`, { method: 'DELETE' });
  }

  public static async deleteMessage(messageId: string): Promise<{ success: boolean }> {
    return this.request(`/v1/dms/messages/${messageId}`, { method: 'DELETE' });
  }

  public static async editMessage(messageId: string, content: string): Promise<{ success: boolean; message: DirectMessage }> {
    this.invalidateCache('/dms/');
    return this.request(`/v1/dms/messages/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
  }

  /** Heartbeat « en train d'écrire » d'un DM (throttlé côté appelant). */
  public static async sendTyping(partnerId: string | number, typing: boolean = true): Promise<void> {
    const payload = JSON.stringify({ partner_id: partnerId, typing });
    await this.request('/v1/dms/typing', { method: 'POST', body: payload });
  }

  // ─────────────────────────────────────────────
  // AUDIENCE — CERCLE PRIVÉ (visibilité des posts)
  // ─────────────────────────────────────────────
  public static async getCircle(): Promise<{ members: Array<{ id: string | number; username: string; display_name?: string; avatar_url?: string; is_verified?: boolean; added_at?: string }> }> {
    return this.cachedRequest('/v1/circle', 20000);
  }

  public static async addToCircle(username: string): Promise<{ success: boolean }> {
    this.invalidateCache('/circle');
    return this.request(`/v1/circle/${encodeURIComponent(username)}`, { method: 'POST' });
  }

  public static async removeFromCircle(username: string): Promise<{ success: boolean }> {
    this.invalidateCache('/circle');
    return this.request(`/v1/circle/${encodeURIComponent(username)}`, { method: 'DELETE' });
  }

  /** @username est-il dans mon cercle ? (état du bouton sur les profils) */
  public static async checkCircle(username: string): Promise<{ in_circle: boolean }> {
    return this.request(`/v1/circle/check/${encodeURIComponent(username)}`);
  }

  // ─────────────────────────────────────────────
  // AI TEXT TOOLS (composer : continuation Tab, orthographe, allonger, ton)
  // ─────────────────────────────────────────────
  public static async aiTransformText(
    text: string,
    action: 'complete' | 'fix_spelling' | 'lengthen' | 'shorten' | 'tone',
    tone?: string
  ): Promise<{ success: boolean; text: string }> {
    const payload = JSON.stringify({ text, action, tone });
    return this.request('/v1/ai/text', { method: 'POST', body: payload });
  }

  /** Traduction d'une publication (DeepL, repli mAI côté serveur, cache inclus). */
  public static async translatePost(postId: string, targetLang: string): Promise<TranslateResult> {
    const payload = JSON.stringify({ post_id: postId, target_lang: targetLang });
    return this.request('/v1/translate', { method: 'POST', body: payload });
  }

  /** Traduction d'un commentaire/réponse (DeepL, repli mAI côté serveur). */
  public static async translateComment(commentId: string, targetLang: string): Promise<TranslateResult> {
    const payload = JSON.stringify({ comment_id: commentId, target_lang: targetLang });
    return this.request('/v1/translate', { method: 'POST', body: payload });
  }

  // ─────────────────────────────────────────────
  // SPEECH — lecture vocale des posts/fils (mini-lecteur audio flottant)
  // ─────────────────────────────────────────────
  public static async getSpeechVoices(): Promise<{ voices: Array<{ id: string; name: string; gender?: string; languages?: string[] }> }> {
    const extract = (res: any) => ({ voices: res?.voices || res?.data || (Array.isArray(res) ? res : []) });
    return extract(await this.request('/v1/speech/voices'));
  }

  /** Synthèse vocale d'un texte → URL de lecture (data URL audio). */
  public static async textToSpeech(text: string, voice?: string): Promise<{ url: string }> {
    const payload = JSON.stringify({
      input: text,
      model: 'deepgram/flux-tts:free',
      voice: voice || undefined,
      return_json: true,
    });

    // Les alias /api/vibe sont ajoutés par request() après un 404/405.
    const endpoints = ['/v1/speech', '/speech', '/v1/audio/speech'];
    let lastError: any = null;

    for (const ep of endpoints) {
      try {
        const json = await this.request<any>(ep, {
          method: 'POST',
          body: payload,
        });
        const audioUrl = json?.audio_url || json?.audioContent;
        if (audioUrl) {
          return { url: audioUrl };
        }
      } catch (err: any) {
        // Les variantes TTS ne sont essayées que si la route précédente a
        // disparu ; ne pas rejouer une génération après une erreur métier/réseau.
        if (!this.shouldRetryVibeAlias(err)) throw err;
        lastError = err;
      }
    }
    throw lastError || new Error('Réponse audio invalide.');
  }

  // ─────────────────────────────────────────────
  // mAI & AI MODELS
  // ─────────────────────────────────────────────
  public static async getModels(): Promise<{ models: Array<{ id: string; name: string; description: string; contextWindow?: number; provider?: string }> }> {
    try {
      const res = await this.request<{ data?: any[]; models?: any[] }>('/v1/models');
      const list = res.data || res.models || [];
      if (Array.isArray(list) && list.length > 0) {
        const formatted = list.map((m: any) => {
          const rawName = m.name || m.id;
          // Nettoyer le nom si format "Fournisseur: Nom"
          const cleanName = rawName.includes(': ') ? rawName.split(': ')[1] : rawName;
          return {
            id: m.id,
            name: cleanName,
            description: m.description || '',
            contextWindow: m.maxContext || m.context_length || m.contextWindow || 128000,
            provider: m.owned_by || m.provider || (m.id.includes('/') ? m.id.split('/')[0] : 'mAI'),
          };
        });
        const lagunaIdx = formatted.findIndex((m) => m.id === 'poolside/laguna-xs-2.1:free');
        if (lagunaIdx > 0) {
          const [laguna] = formatted.splice(lagunaIdx, 1);
          formatted.unshift(laguna);
        } else if (lagunaIdx === -1) {
          formatted.unshift({
            id: 'poolside/laguna-xs-2.1:free',
            name: 'Laguna XS 2.1',
            description: 'Modèle IA par défaut haute performance',
            contextWindow: 128000,
            provider: 'Poolside',
          });
        }
        return { models: formatted };
      }
      return {
        models: [
          { id: 'poolside/laguna-xs-2.1:free', name: 'Laguna XS 2.1', description: 'Modèle IA par défaut haute performance', provider: 'Poolside' },
          { id: 'mai-1.5-apex', name: 'mAI 1.5 Apex', description: 'Modèle IA d\'élite mAI — Raisonnement profond & Vision', provider: 'mDevsLabs' },
          { id: 'mai-1.5-light', name: 'mAI 1.5 Light', description: 'Modèle agile mAI ultra-rapide', provider: 'mDevsLabs' },
          { id: 'google/gemini-2.5-flash:free', name: 'Gemini 2.5 Flash', description: 'Vitesse instantanée et compréhension multimodale', provider: 'Google' },
          { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B Instruct', description: 'Compétences avancées de logique et programmation', provider: 'Meta' },
          { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1', description: 'Raisonnement mathématique et logique complexe', provider: 'DeepSeek' },
          { id: 'qwen/qwen-2.5-coder-32b-instruct:free', name: 'Qwen 2.5 Coder 32B', description: 'Modèle de code spécialisé de haute précision', provider: 'Qwen' },
        ],
      };
    } catch {
      return {
        models: [
          { id: 'poolside/laguna-xs-2.1:free', name: 'Laguna XS 2.1', description: 'Modèle IA par défaut haute performance', provider: 'Poolside' },
          { id: 'mai-1.5-apex', name: 'mAI 1.5 Apex', description: 'Modèle IA d\'élite mAI — Raisonnement profond & Vision', provider: 'mDevsLabs' },
          { id: 'mai-1.5-light', name: 'mAI 1.5 Light', description: 'Modèle agile mAI ultra-rapide', provider: 'mDevsLabs' },
          { id: 'google/gemini-2.5-flash:free', name: 'Gemini 2.5 Flash', description: 'Vitesse instantanée et compréhension multimodale', provider: 'Google' },
          { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B Instruct', description: 'Compétences avancées de logique et programmation', provider: 'Meta' },
          { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1', description: 'Raisonnement mathématique et logique complexe', provider: 'DeepSeek' },
          { id: 'qwen/qwen-2.5-coder-32b-instruct:free', name: 'Qwen 2.5 Coder 32B', description: 'Modèle de code spécialisé de haute précision', provider: 'Qwen' },
        ],
      };
    }
  }

  public static async chatMAI(
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
    const payload = { message, execute_tool, model, context, conversation_id: conversationId };
    return this.request('/v1/mai/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /** Régénère la dernière réponse mAI de la conversation (sans rejouer tout le fil). */
  public static async regenerateMAI(opts?: { model?: string; postId?: string; conversationId?: string }): Promise<{ success: boolean; reply: string; message_id: string | null; modelUsed?: string; conversation_id?: string | null }> {
    const payload = JSON.stringify({
      model: opts?.model,
      context: opts?.postId ? { post_id: opts.postId } : undefined,
      conversation_id: opts?.conversationId,
    });
    return this.request('/v1/mai/regenerate', { method: 'POST', body: payload });
  }

  /** Historique d'une conversation mAI (persistance serveur, multi-conversations). */
  public static async getMAIHistory(conversationId?: string, limit?: number, offset?: number): Promise<{
    conversation_id: string | null;
    messages: Array<{ id: string; role: 'user' | 'assistant'; content: string; tool_calls?: MaiToolCall[]; created_at: string }>;
    has_more?: boolean;
  }> {
    const params = new URLSearchParams();
    if (conversationId) params.set('conversation_id', conversationId);
    if (limit) params.set('limit', String(limit));
    if (offset) params.set('offset', String(offset));
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/v1/mai/history${qs}`);
  }

  /** Démarre une nouvelle conversation mAI (vide l'historique actif). */
  public static async newMAIConversation(): Promise<{ success: boolean; conversation_id: string }> {
    return this.request('/v1/mai/history/new', { method: 'POST' });
  }

  /** Liste des conversations mAI de l'utilisateur (page Studio). */
  public static async getMAIConversations(): Promise<{ success: boolean; conversations: MAIConversationSummary[] }> {
    return this.request('/v1/mai/conversations');
  }

  /** Renomme une conversation mAI. */
  public static async renameMAIConversation(conversationId: string, title: string): Promise<{ success: boolean; conversation: { id: string; title: string } }> {
    const body = JSON.stringify({ title });
    return this.request(`/v1/mai/conversations/${conversationId}/rename`, { method: 'POST', body });
  }

  /** Supprime une conversation mAI (messages en cascade). */
  public static async deleteMAIConversation(conversationId: string): Promise<{ success: boolean; deleted: string }> {
    return this.request(`/v1/mai/conversations/${conversationId}`, { method: 'DELETE' });
  }

  /** Duplique une conversation mAI (messages copiés). */
  public static async duplicateMAIConversation(conversationId: string): Promise<{ success: boolean; conversation_id: string }> {
    return this.request(`/v1/mai/conversations/${conversationId}/duplicate`, { method: 'POST' });
  }

  /** Exécute un outil mAI explicitement approuvé par l'utilisateur. */
  public static async executeMAITool(
    name: string,
    args: any = {},
    model?: string,
    approve: boolean = false,
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
    const body = JSON.stringify({ name, args, model, approve, conversation_id: conversationId });
    return this.request('/v1/mai/execute-tool', { method: 'POST', body });
  }

  /** Refuse l'exécution d'un outil sensible (flux d'approbation persisté). */
  public static async refuseMAITool(
    name: string,
    args: any = {},
    conversationId?: string
  ): Promise<{ success: boolean; reply: string; toolCalls?: MaiToolCall[]; conversation_id?: string | null; message_id?: string | null }> {
    const body = JSON.stringify({ name, args, conversation_id: conversationId });
    return this.request('/v1/mai/tool-refused', { method: 'POST', body });
  }

  public static async getMAIQuotas(): Promise<MAIQuotas> {
    return this.request('/v1/mai/quotas');
  }

  public static async modulateText(text: string, tone: string = 'executive'): Promise<{ success: boolean; modulated: string }> {
    return this.request('/v1/mai/modulate', {
      method: 'POST',
      body: JSON.stringify({ text, tone }),
    });
  }

  // ─────────────────────────────────────────────
  // PROFILES & AVATAR SYNC
  // ─────────────────────────────────────────────
  public static async getProfile(username: string): Promise<{ profile: Profile; posts: Post[] }> {
    const cleanUser = username.trim().replace(/^@/, '');
    const endpoint = `/v1/profiles/${encodeURIComponent(cleanUser)}`;
    return this.cachedRequest(endpoint, 30000);
  }

  public static async updateProfile(data: Partial<Profile>): Promise<{ success: boolean }> {
    // Sans invalidation, le profil GET en cache (30 s) réaffichait l'ancien pseudo/tags après save
    this.invalidateCache('/profiles/');
    return this.request('/v1/profile/update', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public static async uploadAvatar(file: File): Promise<{ avatarUrl: string; success: boolean }> {
    return this.uploadWithFallback<{ avatarUrl: string; success: boolean }>(
      '/v1/upload-avatar',
      '/upload-avatar',
      'avatar',
      file,
      "Erreur lors de l'upload de l'avatar."
    );
  }

  public static async uploadFile(file: File): Promise<{ url: string; pathname: string; contentType: string }> {
    return this.uploadWithFallback<{ url: string; pathname: string; contentType: string }>(
      '/v1/upload-file',
      '/upload-file',
      'file',
      file,
      "Erreur lors de l'upload du fichier."
    );
  }

  public static async updateAvatar(avatarUrl: string): Promise<{ success: boolean; avatarUrl: string }> {
    return this.request('/v1/profile/avatar', {
      method: 'POST',
      body: JSON.stringify({ avatarUrl }),
    });
  }

  public static async toggleFollow(username: string): Promise<{ success: boolean; following: boolean }> {
    const cleanUser = username.trim().replace(/^@/, '');
    return this.request(`/v1/profiles/${encodeURIComponent(cleanUser)}/follow`, { method: 'POST' });
  }

  /** Statut de l'abonnement aux notifications de posts d'un compte. */
  public static async getPostSubscription(username: string): Promise<{ success: boolean; subscribed: boolean }> {
    const cleanUser = username.trim().replace(/^@/, '');
    return this.request(`/v1/profiles/${encodeURIComponent(cleanUser)}/subscribe`);
  }

  /** S'abonner / se désabonner aux notifications de posts d'un compte (toggle). */
  public static async togglePostSubscription(username: string): Promise<{ success: boolean; subscribed: boolean }> {
    const cleanUser = username.trim().replace(/^@/, '');
    return this.request(`/v1/profiles/${encodeURIComponent(cleanUser)}/subscribe`, { method: 'POST' });
  }

  // ─────────────────────────────────────────────
  // NOTIFICATIONS & SETTINGS
  // ─────────────────────────────────────────────
  public static async getNotifications(): Promise<{ notifications: NotificationItem[] }> {
    return this.request('/v1/notifications');
  }

  /** Badges légers : un seul appel, aucune liste chargée. */
  public static async getUnreadCounts(): Promise<{ unread_notifications: number; unread_messages: number }> {
    return this.request('/v1/notifications/unread_count');
  }

  public static async markNotificationsRead(): Promise<{ success: boolean }> {
    return this.request('/v1/notifications/read', { method: 'POST' });
  }

  public static async markNotificationRead(id: string, isRead = true): Promise<{ success: boolean }> {
    const payload = JSON.stringify({ id, is_read: isRead });
    try {
      return await this.request(`/v1/notifications/${encodeURIComponent(id)}/read`, {
        method: 'POST',
        body: payload,
      });
    } catch (error: any) {
      if (!this.shouldRetryVibeAlias(error)) throw error;
      return this.request('/v1/notifications/read', {
        method: 'POST',
        body: payload,
      });
    }
  }

  public static async deleteNotification(id: string): Promise<{ success: boolean }> {
    const payload = JSON.stringify({ id });
    try {
      return await this.request(`/v1/notifications/${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch (error: any) {
      if (!this.shouldRetryVibeAlias(error)) throw error;
      return this.request('/v1/notifications/delete', {
        method: 'POST',
        body: payload,
      });
    }
  }

  public static async clearAllNotifications(): Promise<{ success: boolean }> {
    try {
      return await this.request('/v1/notifications', { method: 'DELETE' });
    } catch (error: any) {
      if (!this.shouldRetryVibeAlias(error)) throw error;
      return this.request('/v1/notifications/delete', {
        method: 'POST',
        body: JSON.stringify({ all: true }),
      });
    }
  }

  public static async getSettings(): Promise<{ settings: UserSettings }> {
    return this.request('/v1/settings');
  }

  public static async updateSettings(settings: Partial<UserSettings>): Promise<{ success: boolean }> {
    return this.request('/v1/settings/update', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  }

  public static async exportData(): Promise<any> {
    return this.request('/v1/privacy/export');
  }

  public static async logUsage(endpoint: string, tokens: number = 10): Promise<void> {
    const token = this.getToken();
    if (!token) return;
    try {
      await fetch(`${API_BASE}/v1/usage/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ endpoint, tokens, action_type: 'api_query' }),
      });
    } catch {}
  }
}
