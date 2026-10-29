import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { MAI_API_URL, MAI_SESSION_COOKIE } from "@/lib/constants";
import { getTierChatWeeklyLimit } from "@/lib/plans/tier-limits";

export { MAI_SESSION_COOKIE } from "@/lib/constants";

export type MaiUser = {
  id?: string;
  username: string;
  email: string;
  phone?: string;
  tier: "Free" | "Plus" | "Pro" | "Max" | string;
  avatarUrl?: string | null;
  tokensUsed: number;
  limit: number;
  resetAt?: string;
  weekStart?: string;
};

export async function getMaiSessionToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(MAI_SESSION_COOKIE)?.value;
    return token || null;
  } catch {
    return null;
  }
}

export async function setMaiSessionToken(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(MAI_SESSION_COOKIE, token, {
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60, // 30 jours
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

// Cache de sessions indexé par JETON. Trois garanties :
//  • taille BORNÉE (LRU) : un cache non borné indexé par jeton est un vecteur
//    d'épuisement mémoire — il suffisait d'accumuler des jetons distincts ;
//  • purge des entrées expirées : elles ne restent jamais indéfiniment ;
//  • entrée NÉGATIVE pour un refus DÉFINITIF de l'API distante : sans elle, un
//    client porteur d'un jeton mort ferait interroger le backend à chaque
//    requête. Un simple échec réseau, lui, n'est jamais mis en cache : il ne
//    doit pas faire croire à une déconnexion.
// Le jeton complet n'est jamais journalisé (aucun log ne le contient).
type SessionCacheEntry = { user: MaiUser | null; expiresAt: number };

const userCache = new Map<string, SessionCacheEntry>();
const CACHE_TTL_MS = 120_000; // 2 minutes de cache en mémoire
const CACHE_DENIED_TTL_MS = 30_000; // refus : fenêtre courte, le temps qu'une
//                                    reconnexion (cookie neuf) prenne effet
const CACHE_LOCAL_FALLBACK_TTL_MS = 15_000; // panne réseau : on réessaie vite
const CACHE_MAX_ENTRIES = 500;
const REVOKED_MAX_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Jetons explicitement refusés par le backend. Cette liste survit à l'expiration
// du cache négatif : une signature locale valide ne doit JAMAIS ressusciter un
// jeton que l'autorité a refusé. Entrée bornée par l'expiration du JWT (7 jours
// au plus) et par la taille LRU du cache.
const revokedTokens = new Map<string, number>();

function pruneRevoked() {
  const now = Date.now();
  for (const [token, expiresAt] of revokedTokens) {
    if (expiresAt <= now) {
      revokedTokens.delete(token);
    }
  }
}

export function markMaiSessionRevoked(token: string, ttlMs?: number): void {
  const ttl = Math.min(
    Math.max(ttlMs ?? CACHE_DENIED_TTL_MS, CACHE_DENIED_TTL_MS),
    REVOKED_MAX_TTL_MS
  );
  if (revokedTokens.size >= CACHE_MAX_ENTRIES) {
    pruneRevoked();
    const oldest = revokedTokens.keys().next().value as string | undefined;
    if (oldest) {
      revokedTokens.delete(oldest);
    }
  }
  revokedTokens.set(token, Date.now() + ttl);
}

export function isMaiSessionRevoked(token: string): boolean {
  const expiresAt = revokedTokens.get(token);
  if (!expiresAt) {
    return false;
  }
  if (Date.now() >= expiresAt) {
    revokedTokens.delete(token);
    return false;
  }
  return true;
}

function readCachedEntry(token: string) {
  const cached = userCache.get(token);
  if (!cached) {
    return null;
  }
  if (Date.now() >= cached.expiresAt) {
    userCache.delete(token);
    return null;
  }
  // Réinsertion : l'ordre d'itération d'un Map sert d'ordre LRU.
  userCache.delete(token);
  userCache.set(token, cached);
  return cached;
}

function cacheUser(token: string, user: MaiUser | null, expiresAt: number) {
  if (userCache.size >= CACHE_MAX_ENTRIES) {
    const oldest = userCache.keys().next().value as string;
    userCache.delete(oldest);
    remoteFallbackNotices.delete(oldest);
  }
  userCache.set(token, { expiresAt, user });
}

// Diagnostic « repli distant » : une seule ligne par jeton, et uniquement
// hors production (en production le silence évite de révéler la configuration
// de déploiement).
const remoteFallbackNotices = new Set<string>();

function noteRemoteValidation(
  token: string,
  reason: "no_secret" | "signature" | "unreachable"
) {
  if (
    process.env.NODE_ENV === "production" ||
    remoteFallbackNotices.has(token)
  ) {
    return;
  }
  if (remoteFallbackNotices.size >= CACHE_MAX_ENTRIES) {
    remoteFallbackNotices.clear();
  }
  remoteFallbackNotices.add(token);
  console.warn(
    reason === "no_secret"
      ? "[auth] MAI_JWT_SECRET absent : session contrôlée par l'API distante."
      : reason === "signature"
        ? "[auth] Signature locale refusée : session contrôlée par l'API distante."
        : "[auth] API de session injoignable : repli local temporaire sur la signature HS256."
  );
}

let _jwtSecret: Uint8Array | null | undefined;

function getJwtSecret(): Uint8Array | null {
  if (_jwtSecret === undefined) {
    const secret = process.env.MAI_JWT_SECRET || process.env.JWT_SECRET || "";
    _jwtSecret = secret ? new TextEncoder().encode(secret) : null;
    if (!_jwtSecret && process.env.NODE_ENV === "production") {
      // Signal fort : sans clé locale, la vérification est déléguée à l'API
      // distante (ligne suivante du flux d'authentification).
      console.warn(
        "[auth] MAI_JWT_SECRET absent : vérification des sessions déléguée à l'API distante."
      );
    }
  }
  return _jwtSecret;
}

// Vérifie la signature HS256 du JWT — un payload décodé sans vérification
// serait forgeable par n'importe quel client (élévation de tier, IDOR).
async function verifyJwtPayload(token: string): Promise<any | null> {
  const secret = getJwtSecret();
  if (!secret) {
    return null;
  }
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
      // Contrôles appliqués dès qu'ils sont configurés (aucun défaut imposé
      // pour ne pas casser des jetons émis par un autre service) :
      ...(process.env.MAI_JWT_ISSUER
        ? { issuer: process.env.MAI_JWT_ISSUER }
        : {}),
      ...(process.env.MAI_JWT_AUDIENCE
        ? { audience: process.env.MAI_JWT_AUDIENCE }
        : {}),
      // L'expiration est obligatoire : un jeton sans `exp` serait valable à
      // vie, ce qui rend toute révocation impossible.
      requiredClaims: ["exp"],
    });
    return payload;
  } catch {
    return null;
  }
}

export async function removeMaiSessionToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get(MAI_SESSION_COOKIE)?.value;
  if (token) {
    userCache.delete(token);
    remoteFallbackNotices.delete(token);
  }
  cookieStore.delete(MAI_SESSION_COOKIE);
}

// Invalidation ciblée du cache utilisateur après une mutation de profil
// (avatar, username, téléphone…) : la session reste valide, seule la copie en
// mémoire est jetée pour que la prochaine requête relise l'amont.
export function invalidateMaiUserCache(token: string): void {
  userCache.delete(token);
}

// Retire le cookie de session UNIQUEMENT s'il porte encore le jeton refusé.
// Une déconnexion concurrente ou une reconnexion (nouveau cookie) ne doit pas
// être écrasée par un refus concernant l'ancien jeton. Les Server Components
// n'autorisent pas l'écriture de cookies : l'échec est ignoré, le jeton reste
// refusé côté serveur.
async function clearSessionCookieIfMatches(token: string): Promise<void> {
  try {
    const cookieStore = await cookies();
    if (cookieStore.get(MAI_SESSION_COOKIE)?.value === token) {
      cookieStore.delete(MAI_SESSION_COOKIE);
    }
  } catch {
    // Contexte en lecture seule (RSC), test ou CLI : rien à effacer ici.
  }
}

// Projette un payload JWT VÉRIFIÉ (signature HS256 + expiration contrôlées par
// `verifyJwtPayload`) en utilisateur. `null` si le payload ne porte aucune
// identité exploitable.
function userFromVerifiedPayload(payload: any): MaiUser | null {
  if (!(payload.email || payload.sub)) {
    return null;
  }
  // Double contrôle d'expiration : `jose` la vérifie déjà, mais ce chemin
  // décide de l'accès — la garde reste ici, explicite.
  if (!payload.exp || payload.exp * 1000 <= Date.now()) {
    return null;
  }
  return {
    avatarUrl: payload.avatarUrl || null,
    email: payload.email || "",
    id: payload.id
      ? String(payload.id)
      : payload.sub
        ? String(payload.sub)
        : payload.email || "",
    limit: Number(payload.limit || getTierChatWeeklyLimit(payload.tier)),
    phone: payload.phone || "",
    resetAt: payload.resetAt,
    tier: payload.tier || "Free",
    tokensUsed: Number(payload.tokensUsed || 0),
    username: payload.username || payload.name || "Utilisateur",
    weekStart: payload.weekStart,
  };
}

export type MaiSessionResolution =
  | { status: "ok"; user: MaiUser }
  // L'API a répondu et a refusé le jeton : décision définitive, elle mérite
  // d'être mémorisée pour ne pas la redemander à chaque requête.
  | { status: "refused" }
  // Panne réseau / délai dépassé : décision INCONCLUANTE. La distinguer du
  // refus évite de faire apparaître une déconnexion alors que la session est
  // parfaitement valide.
  | { status: "unreachable" };

// Déduplication des résolutions distantes en vol (évite les rafales de requêtes
// fetch concurrentes vers le backend lors du chargement des routes).
const inFlightResolutions = new Map<string, Promise<MaiSessionResolution>>();
const REMOTE_AUTH_TIMEOUT_MS = 10_000;

// Résolution de l'identité par l'API distante. C'est elle qui a émis le jeton :
// seule elle peut dire s'il est encore valide, si le compte est bloqué et quel
// est le forfait actuel. Le payload local n'est consulté qu'en repli technique
// lorsque l'API est injoignable, et jamais s'il a déjà été refusé.
async function resolveUserFromApi(
  token: string,
  verifiedPayload: any | null
): Promise<MaiSessionResolution> {
  const existing = inFlightResolutions.get(token);
  if (existing) {
    return existing;
  }

  const resolutionPromise = (async (): Promise<MaiSessionResolution> => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        REMOTE_AUTH_TIMEOUT_MS
      );
      const res = await fetch(`${MAI_API_URL}/usage`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      // 401/403 : refus explicite de l'autorité (jeton révoqué, compte bloqué).
      // Les 5xx et 429 sont des indisponibilités : elles ne révoquent rien.
      if (res.status === 401 || res.status === 403) {
        return { status: "refused" };
      }
      if (!res.ok) {
        return { status: "unreachable" };
      }
      const data = await res.json().catch(() => null);
      if (!data || typeof data !== "object") {
        return { status: "unreachable" };
      }
      if (data.error) {
        return { status: "refused" };
      }

      const userId = data.id
        ? String(data.id)
        : verifiedPayload?.sub
          ? String(verifiedPayload.sub)
          : undefined;

      return {
        status: "ok",
        user: {
          avatarUrl: data.avatarUrl || null,
          email: data.email || "",
          id: userId || data.email,
          limit: Number(data.limit || getTierChatWeeklyLimit(data.tier)),
          phone: data.phone || "",
          resetAt: data.resetAt,
          tier: data.tier || "Free",
          tokensUsed: Number(data.tokensUsed || 0),
          username: data.username || "Utilisateur",
          weekStart: data.weekStart,
        },
      };
    } catch (error: any) {
      if (error?.name === "AbortError") {
        console.warn(
          `[auth] Délai dépassé (${REMOTE_AUTH_TIMEOUT_MS}ms) lors de la récupération utilisateur mAI.`
        );
      } else {
        console.error("Erreur récupération utilisateur mAI:", error);
      }
      return { status: "unreachable" };
    } finally {
      inFlightResolutions.delete(token);
    }
  })();

  inFlightResolutions.set(token, resolutionPromise);
  return resolutionPromise;
}

/**
 * Résolution complète d'une session mAI, avec la distinction
 * refus définitif / indisponibilité.
 *
 * Ordre :
 * 1. jeton déjà refusé explicitement → refus, sans consulter personne ;
 * 2. cache (positif ou négatif) ;
 * 3. l'API émettrice tranche (elle est l'autorité) ;
 * 4. si elle est injoignable, repli local sur signature vérifiée — court, pour
 *    réessayer vite, mais jamais pour un jeton déjà refusé.
 */
export async function resolveMaiSession(
  tokenInput?: string | null
): Promise<MaiSessionResolution> {
  const token = tokenInput || (await getMaiSessionToken());
  if (!token) {
    return { status: "refused" };
  }

  // Un refus explicite est définitif : ni le cache ni la signature locale ne
  // peuvent le rétablir.
  if (isMaiSessionRevoked(token)) {
    return { status: "refused" };
  }

  const cached = readCachedEntry(token);
  if (cached) {
    return cached.user
      ? { status: "ok", user: cached.user }
      : { status: "refused" };
  }

  const hasSecret = getJwtSecret() !== null;
  const payload = hasSecret ? await verifyJwtPayload(token) : null;
  const localUser = payload ? userFromVerifiedPayload(payload) : null;
  if (!localUser) {
    // Le chemin rapide n'a pas conclu (secret absent ou signature divergente) :
    // c'est l'API émettrice qui tranche, et le diagnostic le dit.
    noteRemoteValidation(token, hasSecret ? "signature" : "no_secret");
  }

  const resolution = await resolveUserFromApi(token, payload);
  if (resolution.status === "ok") {
    cacheUser(token, resolution.user, Date.now() + CACHE_TTL_MS);
    return resolution;
  }
  if (resolution.status === "refused") {
    // Un refus explicite est définitif pour CE jeton. Sans payload vérifiable,
    // on applique la borne maximale (7 jours) : une panne ultérieure ne doit
    // pas réhabiliter un jeton que l'autorité a refusé.
    const ttlMs =
      payload?.exp && Number.isFinite(payload.exp)
        ? payload.exp * 1000 - Date.now()
        : REVOKED_MAX_TTL_MS;
    markMaiSessionRevoked(token, ttlMs);
    cacheUser(token, null, Date.now() + CACHE_DENIED_TTL_MS);
    await clearSessionCookieIfMatches(token);
    return { status: "refused" };
  }

  // API injoignable : repli local uniquement sur signature vérifiée, avec un
  // cache court. Le forfait y est celui du jeton, donc potentiellement en
  // retard — c'est acceptable le temps d'une panne, et jamais un accès nouveau.
  if (localUser) {
    noteRemoteValidation(token, "unreachable");
    cacheUser(token, localUser, Date.now() + CACHE_LOCAL_FALLBACK_TTL_MS);
    return { status: "ok", user: localUser };
  }

  return { status: "unreachable" };
}

export async function getMaiUser(
  tokenInput?: string | null
): Promise<MaiUser | null> {
  const resolution = await resolveMaiSession(tokenInput);
  return resolution.status === "ok" ? resolution.user : null;
}
