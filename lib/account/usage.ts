import "server-only";

import { upstreamJson } from "@/lib/api/upstream";
import type { MaiUser } from "@/lib/auth/session";
import {
  getTierChatWeeklyLimit,
  getTierImageDailyLimit,
  getTierSpeechWeeklyLimit,
  getTierStorageBytes,
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

// Agrège forfait + usage + quotas depuis le backend Val Town.
// Un endpoint en échec renseigne `warnings` sans faire échouer l'ensemble.
export async function fetchUsageBundle({
  sessionToken,
  fallbackUser,
}: {
  sessionToken: string;
  fallbackUser?: MaiUser;
}): Promise<UsageBundle> {
  const warnings: string[] = [];

  // Un endpoint en échec renseigne `warnings` sans faire échouer l'ensemble :
  // l'interface affiche alors des quotas partiels plutôt qu'un écran vide.
  const fetchJson = async <T>(
    path: string,
    label: string
  ): Promise<T | null> => {
    const result = await upstreamJson<T>({
      path,
      timeoutMs: 8000,
      token: sessionToken,
    });
    if (!result.ok) {
      warnings.push(label);
      return null;
    }
    return result.data;
  };

  const [usageData, imagesData, cloudData, speechData] = await Promise.all([
    fetchJson<Record<string, any>>("/usage", "forfait"),
    fetchJson<Record<string, any>>("/v1/images/usage", "images"),
    fetchJson<Record<string, any>>("/cloud/storage", "stockage"),
    fetchJson<Record<string, any>>("/v1/speech/usage", "synthèse vocale"),
  ]);

  const userTier = usageData?.tier || fallbackUser?.tier || "Free";
  const fallbackTier = fallbackUser?.tier || userTier;

  const result: UsageBundle = {
    aiUsage: {
      limit: Number(
        usageData?.limit ||
          fallbackUser?.limit ||
          getTierChatWeeklyLimit(fallbackTier)
      ),
      resetAt: usageData?.resetAt || fallbackUser?.resetAt,
      tier: userTier,
      tokensUsed: Number(
        usageData?.tokensUsed ?? fallbackUser?.tokensUsed ?? 0
      ),
    },
    cloudUsage: cloudData
      ? {
          bytesLimit: Number(
            cloudData.bytes_limit || getTierStorageBytes(userTier)
          ),
          bytesUsed: Number(cloudData.bytes_used || 0),
          filesCount: Number(cloudData.files_count || 0),
          overLimit: Boolean(cloudData.over_limit),
          percentUsed: Number(cloudData.percent_used || 0),
          tier: cloudData.tier || userTier,
        }
      : null,
    imagesUsage: imagesData
      ? {
          dailyLimit: imagesData.dailyLimit ?? null,
          plan: imagesData.plan || userTier,
          resetAt: imagesData.resetAt,
          usedToday: imagesData.usedToday ?? null,
        }
      : null,
    speechUsage: speechData
      ? {
          limit: Number(
            speechData.limit ||
              speechData.weeklyLimit ||
              usageData?.speechLimit ||
              getTierSpeechWeeklyLimit(speechData.plan || userTier)
          ),
          requestsCount: Number(speechData.requestsCount || 0),
          resetAt: speechData.resetAt || usageData?.resetAt,
          tier: speechData.plan || userTier,
          tokensUsed: Number(
            speechData.tokensUsed ?? usageData?.speechTokensUsed ?? 0
          ),
        }
      : usageData?.speechTokensUsed === undefined
        ? null
        : {
            limit: Number(
              usageData?.speechLimit || getTierSpeechWeeklyLimit(userTier)
            ),
            requestsCount: 0,
            resetAt: usageData?.resetAt,
            tier: userTier,
            tokensUsed: Number(usageData?.speechTokensUsed || 0),
          },
    user: usageData ?? fallbackUser ?? null,
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
