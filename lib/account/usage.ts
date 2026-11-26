import "server-only";

import type { MaiUser } from "@/lib/auth/session";
import {
  countTodayImageGenerations,
  getUtcWeekStart,
  getWeeklySpeechUsage,
} from "@/lib/db/queries/generations";
import { getUserCloudStorage } from "@/lib/db/queries/storage";
import {
  getTierChatWeeklyLimit,
  getTierImageDailyLimit,
  getTierSpeechWeeklyLimit,
} from "@/lib/plans/tier-limits";

export type AiUsage = {
  limit: number;
  resetAt?: string;
  tier: string;
  tokensUsed: number;
};

export type ImagesUsage = {
  dailyLimit: number | null;
  plan: string;
  resetAt?: string;
  usedToday: number | null;
} | null;

export type CloudUsage = {
  bytesLimit: number;
  bytesUsed: number;
  filesCount: number;
  overLimit: boolean;
  percentUsed: number;
  tier: string;
} | null;

export type SpeechUsage = {
  limit: number;
  requestsCount: number;
  resetAt?: string;
  tier: string;
  tokensUsed: number;
} | null;

export type UsageBundle = {
  aiUsage: AiUsage;
  cloudUsage: CloudUsage;
  imagesUsage: ImagesUsage;
  speechUsage: SpeechUsage;
  user: any;
  warnings: string[];
};

// Agrège forfait + usage + quotas directement depuis Neon PostgreSQL.
export async function fetchUsageBundle({
  sessionToken: _sessionToken,
  fallbackUser,
}: {
  sessionToken: string;
  fallbackUser?: MaiUser;
}): Promise<UsageBundle> {
  const warnings: string[] = [];

  const userTier = fallbackUser?.tier || "Free";
  const userId = fallbackUser?.id || "";

  const now = new Date();
  const monday = getUtcWeekStart(now);
  const nextMonday = new Date(monday.getTime() + 7 * 86_400_000);
  const nextMidnight = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0
    )
  ).toISOString();

  let cloudData: Awaited<ReturnType<typeof getUserCloudStorage>> | null = null;
  let usedImagesToday = 0;
  let speechTokens = 0;
  let speechRequests = 0;

  if (userId) {
    try {
      const [storage, imagesCount, speech] = await Promise.all([
        getUserCloudStorage(userId, userTier),
        countTodayImageGenerations(userId),
        // Tolérant : une lecture Speech en échec ne masque pas le reste.
        getWeeklySpeechUsage([
          userId,
          fallbackUser?.email,
          fallbackUser?.username,
        ]).catch(() => null),
      ]);
      cloudData = storage;
      usedImagesToday = imagesCount;
      if (speech) {
        speechTokens = speech.tokensUsed;
        speechRequests = speech.requestsCount;
      } else {
        warnings.push("speech");
      }
    } catch {
      warnings.push("métriques");
    }
  }

  const result: UsageBundle = {
    aiUsage: {
      limit: Number(fallbackUser?.limit || getTierChatWeeklyLimit(userTier)),
      resetAt: fallbackUser?.resetAt || nextMonday.toISOString(),
      tier: userTier,
      tokensUsed: Number(fallbackUser?.tokensUsed ?? 0),
    },
    cloudUsage: cloudData
      ? {
          bytesLimit: cloudData.bytes_limit,
          bytesUsed: cloudData.bytes_used,
          filesCount: cloudData.files_count,
          overLimit: cloudData.over_limit,
          percentUsed: cloudData.percent_used,
          tier: cloudData.tier,
        }
      : null,
    imagesUsage: {
      dailyLimit: getTierImageDailyLimit(userTier),
      plan: userTier,
      resetAt: nextMidnight,
      usedToday: usedImagesToday,
    },
    speechUsage: {
      limit: getTierSpeechWeeklyLimit(userTier),
      requestsCount: speechRequests,
      resetAt: nextMonday.toISOString(),
      tier: userTier,
      tokensUsed: speechTokens,
    },
    user: fallbackUser ?? null,
    warnings,
  };

  return result;
}

export type UsageSummary = {
  tier: string;
  ai: { tokensUsed: number; limit: number; percent: number; resetAt?: string };
  images: {
    usedToday: number;
    dailyLimit: number;
    percent: number;
    resetAt?: string;
  } | null;
  speech: {
    tokensUsed: number;
    limit: number;
    percent: number;
    resetAt?: string;
  } | null;
  storage: {
    bytesUsed: number;
    bytesLimit: number;
    percent: number;
    filesCount: number;
    overLimit: boolean;
  } | null;
  generatedAt: string;
  warnings?: string[];
};

function percentOf(used: number, limit: number): number {
  return limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
}

// Forme compacte destinée à l'outil IA et au modèle.
export function toUsageSummary(bundle: UsageBundle): UsageSummary {
  const tier = bundle.aiUsage.tier || "Free";
  const images = bundle.imagesUsage;
  const speech = bundle.speechUsage;
  const storage = bundle.cloudUsage;

  return {
    ai: {
      limit: bundle.aiUsage.limit,
      percent: percentOf(bundle.aiUsage.tokensUsed, bundle.aiUsage.limit),
      resetAt: bundle.aiUsage.resetAt,
      tokensUsed: bundle.aiUsage.tokensUsed,
    },
    generatedAt: new Date().toISOString(),
    images: images
      ? (() => {
          const dailyLimit =
            images.dailyLimit ?? getTierImageDailyLimit(images.plan || tier);
          const usedToday = images.usedToday ?? 0;
          return {
            dailyLimit,
            percent: percentOf(usedToday, dailyLimit),
            resetAt: images.resetAt,
            usedToday,
          };
        })()
      : null,
    speech: speech
      ? {
          limit: speech.limit,
          percent: percentOf(speech.tokensUsed, speech.limit),
          resetAt: speech.resetAt,
          tokensUsed: speech.tokensUsed,
        }
      : null,
    storage: storage
      ? {
          bytesLimit: storage.bytesLimit,
          bytesUsed: storage.bytesUsed,
          filesCount: storage.filesCount,
          overLimit: storage.overLimit,
          percent:
            storage.percentUsed ||
            percentOf(storage.bytesUsed, storage.bytesLimit),
        }
      : null,
    tier,
    ...(bundle.warnings.length > 0 ? { warnings: bundle.warnings } : {}),
  };
}
