"use client";

import useSWR from "swr";
import { getModelCapabilities, type ModelCapabilities } from "@/lib/ai/models";

// Source unique pour les capacités du modèle via /api/models (un seul
// fetch SWR partagé entre multimodal-input et le menu Plus).
export function useModelCapabilities(selectedModelId: string) {
  const { data: modelCapsData, isLoading } = useSWR(
    `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/models`,
    (url: string) => fetch(url).then((r) => r.json()),
    { dedupingInterval: 30_000, revalidateOnFocus: false }
  );

  const capsMap: Record<string, ModelCapabilities> | undefined =
    modelCapsData?.capabilities;
  const currentCapabilities =
    capsMap?.[selectedModelId] || getModelCapabilities(selectedModelId);
  const hasVisionSupport = Boolean(
    currentCapabilities?.vision ||
      currentCapabilities?.image ||
      currentCapabilities?.file
  );
  const supportsTools = currentCapabilities?.tools !== false;
  const hasStrictCaps = Boolean(capsMap && currentCapabilities !== undefined);
  const hasFileOrImage = hasStrictCaps
    ? Boolean(
        currentCapabilities?.vision ||
          currentCapabilities?.image ||
          currentCapabilities?.file
      )
    : false;
  const isVisionLoading = !hasStrictCaps && !modelCapsData;

  return {
    currentCapabilities,
    hasFileOrImage,
    hasStrictCaps,
    hasVisionSupport,
    isLoadingModels: isLoading,
    isVisionLoading,
    supportsTools,
  };
}
