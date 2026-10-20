"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import type { UserApiKeyUsage } from "@/app/(chat)/site/actions/api-keys";
import { getUserApiUsage } from "@/app/(chat)/site/actions/api-keys";
import { useAuth } from "@/components/site/auth-provider";
import { MODEL_CATALOG_REFRESH_INTERVAL } from "@/lib/ai/model-catalog";

type ModelCatalogOptions<T> = {
  emptyError: string;
  endpoint: `/api/site/v1/models${string}` | `/api/v1/models${string}`;
  errorMessage: string;
  getModelId: (model: T) => string;
};

export function useModelCatalog<T>({
  emptyError,
  endpoint,
  errorMessage,
  getModelId,
}: ModelCatalogOptions<T>) {
  const { isAuthenticated, token, loading: authLoading } = useAuth();
  const [models, setModels] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeKeyRef, setActiveKeyRef] = useState<string | null>(null);
  const [availableKeys, setAvailableKeys] = useState<UserApiKeyUsage[]>([]);
  const [openModelId, setOpenModelId] = useState<string | null>(null);

  const loadModels = useCallback(
    async (preferredKeyRef?: string) => {
      setLoading(true);
      try {
        const usage = await getUserApiUsage();
        const activeKeys = usage.success
          ? usage.keys.filter((key: UserApiKeyUsage) => key.isActive)
          : [];
        setAvailableKeys(activeKeys);
        const selectedKeyRef =
          preferredKeyRef === undefined
            ? activeKeys[0]?.keyRef || null
            : activeKeys.some(
                  (key: UserApiKeyUsage) => key.keyRef === preferredKeyRef
                )
              ? preferredKeyRef
              : null;
        setActiveKeyRef(selectedKeyRef);

        const headers: Record<string, string> = {};
        if (selectedKeyRef && token) {
          headers.Authorization = `Bearer ${token}`;
          headers["x-mai-key-ref"] = selectedKeyRef;
        }
        const res = await fetch(endpoint, {
          cache: selectedKeyRef ? "no-store" : "default",
          headers,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || errorMessage);
        if (!Array.isArray(data.data)) {
          toast.error(emptyError);
          return;
        }

        const nextModels = data.data as T[];
        setModels(nextModels);
        if (nextModels.length > 0) setOpenModelId(getModelId(nextModels[0]));
      } catch (caughtError) {
        console.error(errorMessage, caughtError);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [emptyError, endpoint, errorMessage, getModelId, token]
  );

  useEffect(() => {
    if (isAuthenticated && token) void loadModels();
  }, [isAuthenticated, loadModels, token]);

  /**
   * Rafraîchissement automatique du catalogue.
   *
   * Le catalogue bouge : un modèle est ajouté, retiré, ou devient accessible
   * selon le forfait. Une page de catalogue laissée ouverte ne doit pas
   * proposer un modèle retiré — d'où la relecture périodique, toutes les 10
   * minutes, comme partout ailleurs.
   *
   * Le minuteur est armé une fois (`armedRef`) et se réarme après chaque
   * passage : changer de clé API ou de cible recharge déjà le catalogue, et
   * une relecture supplémentaire ne ferait que du bruit.
   */
  const armedRef = useRef(true);
  useEffect(() => {
    if (!isAuthenticated || !token) return;
    if (!armedRef.current) return;
    armedRef.current = false;

    const timer = setInterval(() => {
      armedRef.current = true;
      void loadModels();
    }, MODEL_CATALOG_REFRESH_INTERVAL);

    return () => {
      clearInterval(timer);
    };
  }, [isAuthenticated, loadModels, token]);

  return {
    activeKeyRef,
    authLoading,
    availableKeys,
    isAuthenticated,
    loading,
    loadModels,
    models,
    openModelId,
    setOpenModelId,
  };
}
