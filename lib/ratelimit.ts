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

async function checkAuthBucket(
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
    const result = await checkAuthBucket(
      `auth:${action}:id:${hashIdentifier(identifier)}`,
      policies.identifier
    );
    if (!result.allowed) {
      return result;
    }
  }

  if (ip && ip !== "unknown") {
    const result = await checkAuthBucket(
      `auth:${action}:ip:${ip}`,
      policies.ip
    );
    if (!result.allowed) {
      return result;
    }
  }

  return { allowed: true };
}
