"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { getUserApiUsage } from "@/app/(chat)/site/actions/api-keys";
import { getUserImageUsage } from "@/app/(chat)/site/actions/image-usage";
import {
  type AvailableResetItem,
  claimUserReset,
  getUserAvailableResets,
} from "@/app/(chat)/site/actions/resets";
import { useAuth } from "@/components/site/auth-provider";
import type { UserImageUsageData } from "@/lib/site/image-usage";
import { getAudioUsage, getTierSpeechLimit } from "@/lib/site/mai-api";
import { getTierQuotaLimit } from "@/lib/site/tiers";
import {
  type ApiUsageStat,
  type AudioUsageData,
  getSafeKeyPrefix,
} from "./account-utils";

interface ApiUsageKey {
  id?: string;
  keyRef?: string;
  maxLimit?: number | null;
  name?: string;
  plan?: string;
  prefix?: string;
  requestCount?: number;
}

export function useAccountDashboard() {
  const {
    user,
    token,
    usage,
    cloudStorage,
    loading: authLoading,
    isAuthenticated,
    refreshUsage,
    refreshCloudStorage,
  } = useAuth();

  const [apiUsageStats, setApiUsageStats] = useState<ApiUsageStat[]>([]);
  const [apiBoost, setApiBoost] = useState(0);
  const [refreshingApi, setRefreshingApi] = useState(false);

  const [imageUsage, setImageUsage] = useState<UserImageUsageData | null>(null);
  const [refreshingImages, setRefreshingImages] = useState(false);

  const [audioUsage, setAudioUsage] = useState<AudioUsageData | null>(null);
  const [refreshingAudio, setRefreshingAudio] = useState(false);

  const [availableResets, setAvailableResets] = useState<AvailableResetItem[]>(
    []
  );
  const [loadingResets, setLoadingResets] = useState(false);
  const [claimingResetId, setClaimingResetId] = useState<number | null>(null);

  const [refreshing, setRefreshing] = useState(false);
  const [refreshingStorage, setRefreshingStorage] = useState(false);

  const userId = user?.id || user?.email || user?.username || null;
  const userTier = user?.tier || "Free";

  const loadApiUsage = useCallback(async () => {
    if (!userId) return;

    const result = await getUserApiUsage();
    if (!result.success) return;

    if (typeof result.apiBoost === "number") {
      setApiBoost(result.apiBoost);
    }

    const keys = (result.keys || []) as ApiUsageKey[];
    const defaultLimit = getTierQuotaLimit(userTier);
    setApiUsageStats(
      keys.map((key, index) => {
        const legacySecret =
          "key" in key
            ? (key as ApiUsageKey & { key?: string }).key
            : undefined;
        const keyRef =
          key.keyRef ||
          key.id ||
          key.prefix ||
          getSafeKeyPrefix(legacySecret, `clé-api-${index + 1}`);

        return {
          keyRef,
          limit:
            key.maxLimit === null || key.maxLimit === undefined
              ? defaultLimit
              : Number(key.maxLimit),
          name: key.name || key.plan || "Clé API",
          prefix: key.prefix || getSafeKeyPrefix(legacySecret, keyRef),
          requestCount: Number(key.requestCount || 0),
        };
      })
    );
  }, [userId, userTier]);

  const loadImagesUsage = useCallback(async () => {
    if (!userId) return;
    const result = await getUserImageUsage();
    if (result.success && result.data) {
      setImageUsage(result.data);
    }
  }, [userId]);

  const loadAudioUsage = useCallback(async () => {
    if (!userId) return;

    const defaultLimit = getTierSpeechLimit(userTier);
    if (!token) {
      setAudioUsage({
        plan: userTier,
        requestsCount: 0,
        resetAt: "",
        tokensUsed: 0,
        weeklyLimit: defaultLimit,
      });
      return;
    }

    try {
      const data = await getAudioUsage(token);
      setAudioUsage({
        plan: data.plan ?? userTier,
        requestsCount: Number(data.requestsCount ?? 0),
        resetAt: data.resetAt ?? "",
        tokensUsed: Number(data.tokensUsed ?? 0),
        weeklyLimit: Number(data.weeklyLimit ?? defaultLimit),
      });
    } catch {
      setAudioUsage(
        (current) =>
          current || {
            plan: userTier,
            requestsCount: 0,
            resetAt: "",
            tokensUsed: 0,
            weeklyLimit: defaultLimit,
          }
      );
    }
  }, [token, userId, userTier]);

  const loadResets = useCallback(async () => {
    if (!userId) return;
    setLoadingResets(true);
    try {
      const result = await getUserAvailableResets();
      if (result.success) {
        setAvailableResets(result.resets);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des réinitialisations:", error);
    } finally {
      setLoadingResets(false);
    }
  }, [userId]);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    try {
      const [usageResult, storageResult] = await Promise.all([
        refreshUsage(),
        refreshCloudStorage(),
      ]);
      await Promise.all([
        loadApiUsage(),
        loadImagesUsage(),
        loadAudioUsage(),
        loadResets(),
      ]);
      return { storageResult, usageResult };
    } finally {
      setRefreshing(false);
    }
  }, [
    loadApiUsage,
    loadAudioUsage,
    loadImagesUsage,
    loadResets,
    refreshCloudStorage,
    refreshUsage,
  ]);

  const refreshApiUsage = useCallback(async () => {
    setRefreshingApi(true);
    try {
      await Promise.all([loadApiUsage(), refreshUsage()]);
    } finally {
      setRefreshingApi(false);
    }
  }, [loadApiUsage, refreshUsage]);

  const refreshImages = useCallback(async () => {
    setRefreshingImages(true);
    try {
      await loadImagesUsage();
    } finally {
      setRefreshingImages(false);
    }
  }, [loadImagesUsage]);

  const refreshAudio = useCallback(async () => {
    setRefreshingAudio(true);
    try {
      await loadAudioUsage();
    } finally {
      setRefreshingAudio(false);
    }
  }, [loadAudioUsage]);

  const refreshStorage = useCallback(async () => {
    setRefreshingStorage(true);
    try {
      return await refreshCloudStorage();
    } finally {
      setRefreshingStorage(false);
    }
  }, [refreshCloudStorage]);

  const claimReset = useCallback(
    async (resetId: number) => {
      if (!userId) return;
      setClaimingResetId(resetId);
      try {
        const result = await claimUserReset(resetId);
        if (!result.success) {
          toast.error(result.error || "Erreur lors de la réinitialisation");
          return;
        }

        toast.success(result.message || "Quota réinitialisé avec succès !");
        setAvailableResets((current) =>
          current.filter((reset) => reset.id !== resetId)
        );
        await refreshAll();
      } catch {
        toast.error("Erreur de connexion au serveur.");
      } finally {
        setClaimingResetId(null);
      }
    },
    [refreshAll, userId]
  );

  useEffect(() => {
    if (!isAuthenticated || !userId) return;
    void Promise.all([
      loadApiUsage(),
      loadImagesUsage(),
      loadAudioUsage(),
      loadResets(),
    ]);
  }, [
    isAuthenticated,
    loadApiUsage,
    loadAudioUsage,
    loadImagesUsage,
    loadResets,
    userId,
  ]);

  const maiPercent = useMemo(() => {
    if (!usage?.limit) return 0;
    return Math.min(100, Math.round((usage.tokensUsed / usage.limit) * 100));
  }, [usage]);

  return {
    apiBoost,
    apiUsageStats,
    audioUsage,
    authLoading,
    availableResets,
    claimingResetId,
    claimReset,
    cloudStorage,
    imageUsage,
    isAuthenticated,
    loadingResets,
    loadResets,
    maiPercent,
    refreshAll,
    refreshApiUsage,
    refreshAudio,
    refreshImages,
    refreshing,
    refreshingApi,
    refreshingAudio,
    refreshingImages,
    refreshingStorage,
    refreshStorage,
    usage,
    user,
  };
}
