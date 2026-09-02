"use client";

import { useMemo } from "react";
import { useSettings } from "@/hooks/use-settings";
import { isPaidTier, normalizeTier } from "@/lib/auth/plan";

export type TierInfo = {
  isPaid: boolean;
  isFree: boolean;
  isPlus: boolean;
  isPro: boolean;
  isMax: boolean;
  raw: string;
  normalized: string;
  loaded: boolean;
};

export function useTier(): TierInfo {
  const { data, isLoading } = useSettings({
    revalidateIfStale: false,
    revalidateOnFocus: false,
  });

  return useMemo(() => {
    const raw =
      data?.user?.tier ||
      data?.aiUsage?.tier ||
      data?.imagesUsage?.plan ||
      data?.speechUsage?.tier ||
      "Free";
    const normalized = normalizeTier(raw);
    return {
      isFree: normalized === "free",
      isMax: normalized === "max",
      isPaid: isPaidTier(normalized),
      isPlus: normalized === "plus",
      isPro: normalized === "pro",
      loaded: !isLoading,
      normalized,
      raw,
    };
  }, [data, isLoading]);
}
