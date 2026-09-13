"use client";

import useSWR from "swr";
import {
  type AgentModelEntry,
  getModelEntry,
  type ModelCapabilities,
} from "@/lib/ai/registry";
import type { ReasoningLevel } from "@/lib/ai/registry/reasoning";

export type ModelRegistryPayload = {
  capabilities?: Record<string, ModelCapabilities>;
  entries?: AgentModelEntry[];
  models?: unknown[];
};

// Source unique pour les capacités du modèle via /api/models (un seul fetch SWR
// partagé entre le composer Chat, le menu Plus et Agent). Le repli local vient
// du registre central, jamais d'une heuristique recopiée dans un composant.
export function useModelCapabilities(selectedModelId: string) {
  const { data: modelCapsData, isLoading } = useSWR<ModelRegistryPayload>(
    `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/models`,
    (url: string) => fetch(url).then((r) => r.json()),
    { dedupingInterval: 30_000, revalidateOnFocus: false }
  );

  const capsMap = modelCapsData?.capabilities;
  const registryEntry =
    modelCapsData?.entries?.find((entry) => entry.id === selectedModelId) ??
    null;
  const currentCapabilities =
    capsMap?.[selectedModelId] ??
    registryEntry?.capabilities ??
    getModelEntry(selectedModelId).capabilities;

  const hasVisionSupport = Boolean(
    currentCapabilities?.vision ||
      currentCapabilities?.image ||
      currentCapabilities?.file
  );
  const supportsTools = currentCapabilities?.tools !== false;
  const supportsReasoning = Boolean(currentCapabilities?.reasoning);
  const hasStrictCaps = Boolean(capsMap && currentCapabilities !== undefined);
  const hasFileOrImage = hasStrictCaps
    ? Boolean(
        currentCapabilities?.vision ||
          currentCapabilities?.image ||
          currentCapabilities?.file
      )
    : false;
  const isVisionLoading = !hasStrictCaps && !modelCapsData;
  const reasoningLevels: ReasoningLevel[] =
    currentCapabilities?.reasoningLevels ?? [];
  const maxFiles = currentCapabilities?.maxFiles ?? 0;

  return {
    currentCapabilities,
    currentEntry: registryEntry,
    hasFileOrImage,
    hasStrictCaps,
    hasVisionSupport,
    isLoadingModels: isLoading,
    isVisionLoading,
    maxFiles,
    reasoningLevels,
    supportsReasoning,
    supportsTools,
  };
}
