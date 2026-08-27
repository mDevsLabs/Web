import { createClient } from "redis";

import { isProductionEnvironment } from "@/lib/constants";
import { ChatbotError } from "@/lib/errors";

const _MAX_MESSAGES = 10;
const TTL_SECONDS = 60 * 60;

let client: ReturnType<typeof createClient> | null = null;

function getClient() {
  if (!client && process.env.REDIS_URL) {
    client = createClient({ url: process.env.REDIS_URL });
    client.on("error", () => undefined);
    client.connect().catch(() => {
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
    // Fallback DB en cas d'erreur Redis
    if (userId) {
      await fallbackDbCheck(userId);
    }
  }
}

// Alias pour compat
export const checkUserRateLimit = checkIpRateLimit;
