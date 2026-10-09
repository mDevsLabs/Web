import { createHash } from "node:crypto";

import { createClient } from "redis";

import { isProductionEnvironment } from "@/lib/constants";
import { ChatbotError } from "@/lib/errors";

const _MAX_MESSAGES = 10;
const TTL_SECONDS = 60 * 60;

let client: ReturnType<typeof createClient> | null = null;

function getClient() {
  if (!client && process.env.REDIS_URL) {
    client = createClient({ url: process.env.REDIS_URL });
    client.on("error", (error) =>
      console.warn("[ratelimit] Erreur Redis:", error?.message ?? error)
    );
    client.connect().catch((error) => {
      console.warn(
        "[ratelimit] Connexion Redis impossible, repli mémoire:",
        error?.message ?? error
      );
      client = null;
    });
  }
  return client;
}

const MAX_MESSAGES_PER_USER = 50;
const MAX_MESSAGES_PER_IP = 20;

export async function checkIpRateLimit(
  ip: string | undefined,
  userId?: string
) {
  // En dev, on rate-limit aussi si REDIS_URL présent (évite bypass)
  const shouldCheck = isProductionEnvironment || !!process.env.REDIS_URL;
  if (!shouldCheck) {
    return;
  }

  const redis = getClient();
  const hasRedis = !!redis?.isReady;

  // Fallback DB si Redis indisponible: compteur messages dernière heure
  const fallbackDbCheck = async (uid?: string, ipAddr?: string) => {
    try {
      const { getMessageCountByUserId } = await import("./db/queries");
      if (uid) {
        const c = await getMessageCountByUserId({
          differenceInHours: 1,
          id: uid,
        });
        if (c >= MAX_MESSAGES_PER_USER) {
          throw new ChatbotError("rate_limit:chat");
        }
      } else if (ipAddr && !uid) {
        // Sans user, on ne peut pas fallback efficacement, on laisse passer (mais IP Redis manquant = fail open limité)
      }
    } catch (e) {
      if (e instanceof ChatbotError) {
        throw e;
      }
      console.warn(
        "[ratelimit] Échec du repli DB pour le rate limit:",
        e instanceof Error ? e.message : e
      );
    }
  };

  if (!hasRedis) {
    if (userId) {
      await fallbackDbCheck(userId);
    }
    return;
  }

  try {
    const multi = redis?.multi();
    if (userId) {
      multi.incr(`rate:user:${userId}`);
      multi.expire(`rate:user:${userId}`, TTL_SECONDS, "NX" as any);
    }
    if (ip) {
      multi.incr(`ip-rate-limit:${ip}`);
      multi.expire(`ip-rate-limit:${ip}`, TTL_SECONDS, "NX" as any);
    }
    const rawResults = (await multi.exec()) as unknown as unknown[];

    // rawResults is array of [error, result] tuples OR flat results depending on redis client version.
    // Robust parsing: flatten and extract numeric incr results in order added.
    const incrResults: (number | null)[] = [];
    if (Array.isArray(rawResults)) {
      for (const entry of rawResults as any[]) {
        if (Array.isArray(entry) && entry.length >= 2) {
          // tuple [err, value]
          const val = entry[1];
          if (typeof val === "number") {
            incrResults.push(val);
          } else if (val === null) {
            incrResults.push(null);
          }
          // "OK" or 0/1 from expire are ignored for counting
          else if (typeof val === "string" && !Number.isNaN(Number(val))) {
            incrResults.push(Number(val));
          }
        } else if (typeof entry === "number") {
          incrResults.push(entry);
        } else if (typeof entry === "string" && !Number.isNaN(Number(entry))) {
          incrResults.push(Number(entry));
        }
      }
    }

    // incrResults order: [userIncr?, ipIncr?] — only incr values, expire results filtered out
    // Fallback if parsing yielded nothing (older client returns flat numbers + "OK" strings)
    let userCount: number | null = null;
    let ipCount: number | null = null;
    if (userId && ip) {
      userCount = incrResults[0] ?? null;
      ipCount = incrResults[1] ?? null;
      // If only one numeric found but both expected, try alternative flat parsing from rawResults
      if (userCount === null && ipCount === null && rawResults.length >= 2) {
        const flatNums = (rawResults as any[]).filter(
          (v) => typeof v === "number"
        );
        if (flatNums.length >= 2) {
          userCount = flatNums[0];
          ipCount = flatNums[1];
        }
      }
    } else if (userId) {
      userCount = incrResults[0] ?? null;
      if (userCount === null) {
        const flatNums = (rawResults as any[]).filter(
          (v) => typeof v === "number"
        );
        userCount = flatNums[0] ?? null;
      }
    } else if (ip) {
      ipCount = incrResults[0] ?? null;
      if (ipCount === null) {
        const flatNums = (rawResults as any[]).filter(
          (v) => typeof v === "number"
        );
        ipCount = flatNums[0] ?? null;
      }
    }

    if (typeof userCount === "number" && userCount > MAX_MESSAGES_PER_USER) {
      throw new ChatbotError("rate_limit:chat");
    }
    if (typeof ipCount === "number" && ipCount > MAX_MESSAGES_PER_IP) {
      throw new ChatbotError("rate_limit:chat");
    }
  } catch (error) {
    if (error instanceof ChatbotError) {
      throw error;
    }
    console.warn(
      "[ratelimit] Échec Redis pour le rate limit chat, repli DB:",
      error instanceof Error ? error.message : error
    );
    // Fallback DB en cas d'erreur Redis
    if (userId) {
      await fallbackDbCheck(userId);
    }
  }
}

// Alias pour compat
export const checkUserRateLimit = checkIpRateLimit;

// ─────────────────────────────────────────────
// Rate limiting des Server Actions d'authentification
// ─────────────────────────────────────────────

export type AuthRateLimitAction =
  | "login"
  | "verify_login"
  | "register"
  | "verify_register"
  | "resend_code";

type BucketPolicy = { limit: number; windowSeconds: number };

const AUTH_RATE_LIMITS: Record<
  AuthRateLimitAction,
  { identifier: BucketPolicy; ip: BucketPolicy }
> = {
  login: {
    identifier: { limit: 5, windowSeconds: 600 },
    ip: { limit: 20, windowSeconds: 3600 },
  },
  register: {
    identifier: { limit: 3, windowSeconds: 3600 },
    ip: { limit: 5, windowSeconds: 3600 },
  },
  resend_code: {
    identifier: { limit: 3, windowSeconds: 900 },
    ip: { limit: 10, windowSeconds: 3600 },
  },
  verify_login: {
    identifier: { limit: 10, windowSeconds: 600 },
    ip: { limit: 30, windowSeconds: 3600 },
  },
  verify_register: {
    identifier: { limit: 10, windowSeconds: 600 },
    ip: { limit: 30, windowSeconds: 3600 },
  },
};

export type AuthRateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

// Repli mémoire (fenêtre fixe) : actif quand Redis est absent/indisponible,
// pour ne jamais laisser les actions d'auth sans aucune protection.
const memoryBuckets = new Map<string, { count: number; resetAt: number }>();
const MEMORY_BUCKETS_MAX = 10_000;

function checkMemoryBucket(
  key: string,
  policy: BucketPolicy,
  now: number
): AuthRateLimitResult {
  const entry = memoryBuckets.get(key);
  if (!entry || now >= entry.resetAt) {
    memoryBuckets.set(key, {
      count: 1,
      resetAt: now + policy.windowSeconds * 1000,
    });
    if (memoryBuckets.size > MEMORY_BUCKETS_MAX) {
      for (const [k, v] of memoryBuckets) {
        if (now >= v.resetAt) {
          memoryBuckets.delete(k);
        }
      }
    }
    return { allowed: true };
  }
  entry.count += 1;
  if (entry.count > policy.limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }
  return { allowed: true };
}

function hashIdentifier(identifier: string): string {
  return createHash("sha256")
    .update(identifier.toLowerCase().trim())
    .digest("hex")
    .slice(0, 32);
}

async function checkRedisBucket(
  key: string,
  policy: BucketPolicy
): Promise<AuthRateLimitResult | null> {
  const redis = getClient();
  if (!redis?.isReady) {
    return null;
  }
  try {
    const multi = redis.multi();
    multi.incr(key);
    multi.expire(key, policy.windowSeconds, "NX" as any);
    multi.ttl(key);
    const results = (await multi.exec()) as unknown as unknown[];
    const numbers = (results ?? [])
      .map((entry) =>
        Array.isArray(entry) && entry.length >= 2 ? entry[1] : entry
      )
      .filter((v): v is number => typeof v === "number");
    const count = numbers[0] ?? 0;
    const ttl = numbers[1] ?? policy.windowSeconds;
    if (count > policy.limit) {
      return { allowed: false, retryAfterSeconds: Math.max(1, ttl) };
    }
    return { allowed: true };
  } catch (error) {
    console.warn(
      "[ratelimit] Échec Redis pour l'auth, repli mémoire:",
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

async function checkBucket(
  key: string,
  policy: BucketPolicy
): Promise<AuthRateLimitResult> {
  const redisResult = await checkRedisBucket(key, policy);
  if (redisResult) {
    return redisResult;
  }
  return checkMemoryBucket(key, policy, Date.now());
}

export async function checkAuthRateLimit(params: {
  action: AuthRateLimitAction;
  identifier?: string;
  ip?: string;
}): Promise<AuthRateLimitResult> {
  const { action, identifier, ip } = params;
  const policies = AUTH_RATE_LIMITS[action];

  if (identifier?.trim()) {
    const result = await checkBucket(
      `auth:${action}:id:${hashIdentifier(identifier)}`,
      policies.identifier
    );
    if (!result.allowed) {
      return result;
    }
  }

  if (ip && ip !== "unknown") {
    const result = await checkBucket(`auth:${action}:ip:${ip}`, policies.ip);
    if (!result.allowed) {
      return result;
    }
  }

  return { allowed: true };
}

// ─── Limitation des routes API coûteuses ────────────────────────────────────
//
// `checkIpRateLimit` ne couvre que le Chat et l'Agent (routes partagées avec
// le runtime). Les autres routes qui déclenchent une dépense — génération
// d'image, synthèse vocale, traduction, résumé mémoire — en étaient exemptes,
// alors qu'elles consomment le quota de l'utilisateur.
//
// Même mécanique que l'authentification : deux seaux (utilisateur, IP), Redis
// avec repli mémoire borné, seuils regroupés ici pour rester lisibles.
export type ApiRateLimitAction =
  | "image_generation"
  | "audio_generation"
  | "memory_import"
  | "memory_summary"
  | "message_execute"
  | "mcp_test"
  | "file_upload"
  | "chat_bulk";

type ApiRateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

// Les seuils par utilisateur sont plus stricts que les seuils par IP : un IP
// partagée (entreprise, box) ne doit pas être pénalisée par l'usage d'une
// seule personne, alors qu'un compte ne doit pas pouvoir marteler.
const API_RATE_LIMITS: Record<
  ApiRateLimitAction,
  { user: BucketPolicy; ip: BucketPolicy }
> = {
  audio_generation: {
    ip: { limit: 90, windowSeconds: 3600 },
    user: { limit: 30, windowSeconds: 3600 },
  },
  // Archivage/suppression en masse d'historique.
  chat_bulk: {
    ip: { limit: 100, windowSeconds: 3600 },
    user: { limit: 30, windowSeconds: 3600 },
  },
  file_upload: {
    ip: { limit: 100, windowSeconds: 3600 },
    user: { limit: 30, windowSeconds: 3600 },
  },
  // Génération d'image : la dépense la plus unitaire du produit.
  image_generation: {
    ip: { limit: 60, windowSeconds: 3600 },
    user: { limit: 20, windowSeconds: 3600 },
  },
  // `/api/mcp/test` déclenche une requête sortante vers une URL fournie : la
  // route la plus exposée à l'amplification.
  mcp_test: {
    ip: { limit: 30, windowSeconds: 3600 },
    user: { limit: 10, windowSeconds: 3600 },
  },
  // Import mémoire : la borne est déjà sur la taille du tableau ; le rate limit
  // borne le nombre d'appels qui entraînent des écritures en série.
  memory_import: {
    ip: { limit: 15, windowSeconds: 3600 },
    user: { limit: 5, windowSeconds: 3600 },
  },
  memory_summary: {
    ip: { limit: 60, windowSeconds: 3600 },
    user: { limit: 20, windowSeconds: 3600 },
  },
  // Exécution manuelle d'un envoi planifié : une génération complète.
  message_execute: {
    ip: { limit: 60, windowSeconds: 3600 },
    user: { limit: 20, windowSeconds: 3600 },
  },
};

export async function checkApiRateLimit(params: {
  action: ApiRateLimitAction;
  userId?: string | null;
  ip?: string | null;
}): Promise<ApiRateLimitResult> {
  const policies = API_RATE_LIMITS[params.action];
  const { userId, ip } = params;

  if (userId?.trim()) {
    const result = await checkBucket(
      `api:${params.action}:user:${hashIdentifier(userId)}`,
      policies.user
    );
    if (!result.allowed) {
      return result;
    }
  }

  // L'IP n'est pas hachée : elle n'est pas un identifiant de compte et le
  // conserver en clair garde les compteurs lisibles dans un `SCAN` Redis.
  if (ip && ip !== "unknown") {
    const result = await checkBucket(
      `api:${params.action}:ip:${ip}`,
      policies.ip
    );
    if (!result.allowed) {
      return result;
    }
  }

  return { allowed: true };
}
