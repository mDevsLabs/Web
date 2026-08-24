import { createClient } from "redis";

import { isProductionEnvironment } from "@/lib/constants";
import { ChatbotError } from "@/lib/errors";

const MAX_MESSAGES = 10;
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

export async function checkIpRateLimit(ip: string | undefined, userId?: string) {
  // En dev, on rate-limit aussi si REDIS_URL présent (évite bypass)
  const shouldCheck = isProductionEnvironment || !!process.env.REDIS_URL;
  if (!shouldCheck) return;

  const redis = getClient();
  const hasRedis = !!redis?.isReady;

  // Fallback DB si Redis indisponible: compteur messages dernière heure
  const fallbackDbCheck = async (uid?: string, ipAddr?: string) => {
    try {
      const { getMessageCountByUserId } = await import("./db/queries");
      if (uid) {
        const c = await getMessageCountByUserId({ id: uid, differenceInHours: 1 });
        if (c >= MAX_MESSAGES_PER_USER) throw new ChatbotError("rate_limit:chat");
      } else if (ipAddr && !uid) {
        // Sans user, on ne peut pas fallback efficacement, on laisse passer (mais IP Redis manquant = fail open limité)
      }
    } catch (e) {
      if (e instanceof ChatbotError) throw e;
    }
  };

  if (!hasRedis) {
    if (userId) await fallbackDbCheck(userId);
    return;
  }

  try {
    const multi = redis!.multi();
    if (userId) {
      multi.incr(`rate:user:${userId}`);
      multi.expire(`rate:user:${userId}`, TTL_SECONDS, "NX" as any);
    }
    if (ip) {
      multi.incr(`ip-rate-limit:${ip}`);
      multi.expire(`ip-rate-limit:${ip}`, TTL_SECONDS, "NX" as any);
    }
    const results = (await multi.exec()) as unknown as (number | null)[];

    // results order: user incr, user expire, ip incr, ip expire  OR ip only
    // Simplified: check any count > limit
    const counts = (results as unknown as (number | null)[]).filter((v) => typeof v === "number") as number[];
    // First count corresponds to user if userId present
    if (userId && counts[0] !== undefined && counts[0] > MAX_MESSAGES_PER_USER) {
      throw new ChatbotError("rate_limit:chat");
    }
    const ipCount = userId ? counts[1] : counts[0];
    if (typeof ipCount === "number" && ipCount > MAX_MESSAGES_PER_IP) {
      throw new ChatbotError("rate_limit:chat");
    }
  } catch (error) {
    if (error instanceof ChatbotError) throw error;
    // Fallback DB en cas d'erreur Redis
    if (userId) await fallbackDbCheck(userId);
  }
}

// Alias pour compat
export const checkUserRateLimit = checkIpRateLimit;
