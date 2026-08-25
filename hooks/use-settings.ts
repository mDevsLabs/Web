"use client";

import useSWR, { type SWRConfiguration } from "swr";
import { getTierImageDailyLimit, getTierSpeechLimit } from "@/lib/constants";
import { fetcher } from "@/lib/utils";

export type UserSettings = {
  username: string;
  email: string;
  phone?: string;
  tier: string;
  avatarUrl?: string;
  newsletter?: boolean;
  notify_limits?: boolean;
};

export type AIUsageData = {
  tokensUsed: number;
  limit: number;
  resetAt?: string;
  tier: string;
};

export type SpeechUsageData = {
  tokensUsed: number;
  limit: number;
  requestsCount?: number;
  resetAt?: string;
  tier: string;
};

export type ImagesUsageData = {
  usedToday: number;
  dailyLimit: number;
  resetAt?: string;
  plan: string;
};

export type CloudUsageData = {
  bytesUsed: number;
  bytesLimit: number;
  filesCount: number;
  percentUsed: number;
  overLimit: boolean;
  tier: string;
};

export type SettingsPayload = {
  aiUsage?: AIUsageData | null;
  cloudUsage?: CloudUsageData | null;
  imagesUsage?: ImagesUsageData | null;
  speechUsage?: SpeechUsageData | null;
  user?: UserSettings | null;
};

export type ResolvedSpeechUsage = {
  limit: number;
  plan: string;
  requestsCount: number;
  resetAt?: string;
  tokensUsed: number;
};

export function resolveSpeechUsage(
  data?: SettingsPayload | null
): ResolvedSpeechUsage {
  const speechUsage = data?.speechUsage ?? null;
  const plan = speechUsage?.tier || data?.user?.tier || "Free";
  const rawLimit = speechUsage?.limit ?? (speechUsage as any)?.weeklyLimit;
  const limit =
    typeof rawLimit === "number" &&
    Number.isFinite(rawLimit) &&
    rawLimit > 0
      ? rawLimit
      : getTierSpeechLimit(plan);
  const tokensUsed =
    typeof speechUsage?.tokensUsed === "number" &&
    Number.isFinite(speechUsage.tokensUsed)
      ? speechUsage.tokensUsed
      : 0;
  const requestsCount =
    typeof speechUsage?.requestsCount === "number" &&
    Number.isFinite(speechUsage.requestsCount)
      ? speechUsage.requestsCount
      : 0;

  return {
    limit,
    plan,
    requestsCount,
    resetAt: speechUsage?.resetAt,
    tokensUsed,
  };
}

export type ResolvedImagesUsage = {
  dailyLimit: number;
  plan: string;
  resetAt?: string;
  usedToday: number;
};

// Résolution centralisée du quota d'images : source unique utilisée par la
// page Images ET les paramètres (Consommation & Forfait) pour garantir un
// affichage identique. Fallback sur la limite du tier si l'API ne répond pas.
export function resolveImagesUsage(
  data?: SettingsPayload | null
): ResolvedImagesUsage {
  const imagesUsage = data?.imagesUsage ?? null;
  const plan = imagesUsage?.plan || data?.user?.tier || "Free";
  const dailyLimit =
    typeof imagesUsage?.dailyLimit === "number" &&
    Number.isFinite(imagesUsage.dailyLimit)
      ? imagesUsage.dailyLimit
      : getTierImageDailyLimit(plan);
  const usedToday =
    typeof imagesUsage?.usedToday === "number" &&
    Number.isFinite(imagesUsage.usedToday)
      ? imagesUsage.usedToday
      : 0;

  return {
    dailyLimit,
    plan,
    resetAt: imagesUsage?.resetAt,
    usedToday,
  };
}

// Hook SWR partagé sur /api/settings : une seule clé de cache pour toutes les
// vues (page Images, page Paramètres, bandeau de quota du chat).
export function useSettings(swrConfig?: SWRConfiguration) {
  return useSWR<SettingsPayload>("/api/settings", fetcher, swrConfig);
}

// Variante pratique dédiée au quota d'images (polling léger activé).
export function useImagesUsage() {
  const { data, error, isLoading, mutate } = useSettings({
    refreshInterval: 30_000,
    revalidateOnFocus: true,
  });
  const usage = resolveImagesUsage(data);
  return { error, isLoading, mutate, usage };
}

// Variante pratique dédiée au quota audio/synthèse vocale (polling léger activé).
export function useAudioUsage() {
  const { data, error, isLoading, mutate } = useSettings({
    refreshInterval: 30_000,
    revalidateOnFocus: true,
  });
  const usage = resolveSpeechUsage(data);
  return { error, isLoading, mutate, usage };
}

