"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/site/auth-provider";
import { MODEL_CATALOG_REFRESH_INTERVAL } from "@/lib/ai/model-catalog";
import type { ApiKeyMetadata } from "@/lib/site/api-key-types";
import { SITE_API_ROUTES } from "@/lib/site/api-routes";
import { maiModelsList } from "@/lib/site/mai-models";
import {
  type ConfigHostTarget,
  DEFAULT_CLOUD_MODEL,
  DEFAULT_LOCAL_MODEL,
} from "./config-data";

export type ConfigModelOption = {
  id: string;
  name: string;
  type: "mai" | "cloud";
};

export function useConfigCatalog() {
  const { token, isAuthenticated, loading: authLoading } = useAuth();
  const [selectedModel, setSelectedModel] = useState(DEFAULT_CLOUD_MODEL);
  const [hostTarget, setHostTarget] = useState<ConfigHostTarget>("cloud");
  const [userKeys, setUserKeys] = useState<ApiKeyMetadata[]>([]);
  const [selectedKeyRef, setSelectedKeyRef] = useState("");
  const [cloudModels, setCloudModels] = useState<ConfigModelOption[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [modelsRetry, setModelsRetry] = useState(0);
  const [keysLoading, setKeysLoading] = useState(false);
  const [keysError, setKeysError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !token) {
      setUserKeys([]);
      setSelectedKeyRef("");
      return;
    }

    let cancelled = false;
    async function loadKeys() {
      setKeysLoading(true);
      setKeysError(null);
      try {
        const res = await fetch(SITE_API_ROUTES.devKeys, {
          cache: "no-store",
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok || !data.success || !Array.isArray(data.keys)) {
          throw new Error(data.error?.message || "Métadonnées indisponibles.");
        }
        const activeKeys = (data.keys as ApiKeyMetadata[]).filter(
          (key) => key.isActive
        );
        if (cancelled) return;
        setUserKeys(activeKeys);
        setSelectedKeyRef((current) => {
          if (current && activeKeys.some((key) => key.keyRef === current))
            return current;
          return activeKeys[0]?.keyRef || "";
        });
      } catch (error) {
        if (cancelled) return;
        setUserKeys([]);
        setSelectedKeyRef("");
        setKeysError(
          error instanceof Error
            ? error.message
            : "Impossible de charger les clés."
        );
      } finally {
        if (!cancelled) setKeysLoading(false);
      }
    }
    void loadKeys();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, token]);

  /**
   * Charge le catalogue Cloud.
   *
   * Isolé dans une fonction pour que le bouton de rafraîchissement du
   * sélecteur puisse le rappeler sans remonter le composant : c'est la
   * même opération que le rechargement automatique, à la main.
   */
  const loadCloudModels = useCallback(async () => {
    setModelsLoading(true);
    setModelsError(null);
    try {
      const headers: Record<string, string> = {};
      if (selectedKeyRef) {
        if (!token) {
          throw new Error(
            "Session expirée. Reconnectez-vous pour utiliser une clé."
          );
        }
        headers["x-mai-key-ref"] = selectedKeyRef;
        headers.Authorization = `Bearer ${token}`;
      }
      const res = await fetch(SITE_API_ROUTES.models, {
        cache: selectedKeyRef ? "no-store" : "default",
        credentials: "include",
        headers,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error?.message || "Le catalogue de modèles est indisponible."
        );
      }
      if (!Array.isArray(data.data)) {
        throw new Error("Réponse de catalogue invalide.");
      }

      // Le groupe Cloud n'affiche que les modèles réellement reçus de
      // `GET /api/v1/models` : aucune liste de secours locale n'est fusionnée.
      const received = new Map<string, ConfigModelOption>();
      for (const model of data.data as Record<string, unknown>[]) {
        if (!model?.id) continue;
        const id = String(model.id);
        received.set(id, {
          id,
          name: `${String(model.name || id)} (${id})`,
          type: "cloud",
        });
      }
      const models = Array.from(received.values());
      setCloudModels(models);
      // Sélection par défaut : le premier modèle reçu, sinon aucun.
      setSelectedModel((current) =>
        current && models.some((model) => model.id === current)
          ? current
          : (models[0]?.id ?? "")
      );
    } catch (error) {
      setCloudModels([]);
      setModelsError(
        error instanceof Error
          ? error.message
          : "Erreur de chargement des modèles."
      );
    } finally {
      setModelsLoading(false);
    }
  }, [selectedKeyRef, token]);

  useEffect(() => {
    if (authLoading) return;
    void loadCloudModels();
  }, [authLoading, isAuthenticated, loadCloudModels, modelsRetry]);

  /**
   * Rafraîchissement automatique du catalogue (toutes les 10 minutes).
   *
   * Même règle que le sélecteur de l'hôte : le catalogue `/v1/models` dépend
   * du forfait et bouge. Une page de configuration laissée ouverte ne doit
   * pas proposer un modèle retiré.
   */
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    const timer = setInterval(() => {
      void loadCloudModels();
    }, MODEL_CATALOG_REFRESH_INTERVAL);
    return () => {
      clearInterval(timer);
    };
  }, [authLoading, isAuthenticated, loadCloudModels]);

  useEffect(() => {
    const isLocalModel = Boolean(
      maiModelsList.find((model) => model.ollamaTag === selectedModel)
        ?.ollamaTag
    );
    if (hostTarget === "cloud" && isLocalModel) {
      setSelectedModel(cloudModels[0]?.id ?? DEFAULT_CLOUD_MODEL);
    } else if (hostTarget !== "cloud" && !isLocalModel) {
      setSelectedModel(DEFAULT_LOCAL_MODEL);
    }
  }, [cloudModels, hostTarget, selectedModel]);

  const allModels = useMemo<ConfigModelOption[]>(
    () => [
      ...maiModelsList
        .filter((model) => model.ollamaTag)
        .map((model) => ({
          id: model.ollamaTag as string,
          name: `${model.name} (mAI Local)`,
          type: "mai" as const,
        })),
      ...cloudModels,
    ],
    [cloudModels]
  );

  /**
   * Groupes pour le sélecteur de modèles.
   *
   * Deux populations qui ne se mélangent pas : les modèles mAI locaux
   * (exécutés par Ollama) et le catalogue Cloud `/v1/models`. Les groupes
   * sont vides plutôt qu'absents quand la cible n'est pas active : le
   * sélecteur n'affiche alors que ce qui est réellement disponible.
   */
  const modelGroups = useMemo(
    () => [
      {
        heading: "Modèles mAI Locaux (Gratuits)",
        models: allModels
          .filter((model) => model.type === "mai")
          .map((model) => ({ id: model.id, name: model.name })),
      },
      {
        heading: "Modèles API v1 / Cloud",
        models: allModels
          .filter((model) => model.type === "cloud")
          .map((model) => ({ id: model.id, name: model.name })),
      },
    ],
    [allModels]
  );

  return {
    allModels,
    cloudModels,
    hostTarget,
    isAuthenticated,
    keysError,
    keysLoading,
    modelGroups,
    modelsError,
    modelsLoading,
    refreshModels: loadCloudModels,
    selectedKeyRef,
    selectedModel,
    setHostTarget,
    setModelsRetry,
    setSelectedKeyRef,
    setSelectedModel,
    token,
    userKeys,
  };
}
