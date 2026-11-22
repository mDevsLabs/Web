"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { getUserImageUsage } from "@/app/(chat)/site/actions/image-usage";
import {
  type AvailableResetItem,
  claimUserReset,
  getUserAvailableResets,
} from "@/app/(chat)/site/actions/resets";
import { useAuth } from "@/components/site/auth-provider";
import type { UserImageUsageData } from "@/lib/site/image-usage";
import { getAudioUsage, getTierSpeechLimit } from "@/lib/site/mai-api";
import type { AudioUsageData } from "./account-utils";

export function useAccountDashboard() {
  const {
    user,
    usage,
    cloudStorage,
    loading: authLoading,
    isAuthenticated,
    refreshUsage,
    refreshCloudStorage,
  } = useAuth();

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
    if (!isAuthenticated) {
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
      const data = await getAudioUsage();
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
  }, [isAuthenticated, userId, userTier]);

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
      await Promise.all([loadImagesUsage(), loadAudioUsage(), loadResets()]);
      return { storageResult, usageResult };
    } finally {
      setRefreshing(false);
    }
  }, [
    loadAudioUsage,
    loadImagesUsage,
    loadResets,
    refreshCloudStorage,
    refreshUsage,
  ]);

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
    void Promise.all([loadImagesUsage(), loadAudioUsage(), loadResets()]);
  }, [isAuthenticated, loadAudioUsage, loadImagesUsage, loadResets, userId]);

  const maiPercent = useMemo(() => {
    if (!usage?.limit) return 0;
    return Math.min(100, Math.round((usage.tokensUsed / usage.limit) * 100));
  }, [usage]);

  return {
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
    refreshAudio,
    refreshImages,
    refreshing,
    refreshingAudio,
    refreshingImages,
    refreshingStorage,
    refreshStorage,
    usage,
    user,
  };
}
