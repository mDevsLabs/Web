"use client";

import { useMemo } from "react";
import useSWR from "swr";
import type { ModelRegistryPayload } from "@/components/chat/input/use-model-capabilities";
import type { SharedModel } from "@/components/chat/model-selector-compact";
import { isAgentCompatible } from "@/lib/ai/registry";
import type { ModelCapabilities } from "@/lib/ai/registry/capabilities";
import { apiEndpoints } from "@/lib/client/api-endpoints";
import { fetcher } from "@/lib/utils";

// Modèles utilisables par Agent : le registre doit confirmer à la fois le
// tool calling et la continuation après ToolResult. La liste, les capacités et
// les accès par forfait viennent tous du registre central exposé par /api/models.
export function useAgentModels() {
  const { data, isLoading } = useSWR<ModelRegistryPayload>(
    apiEndpoints.models(),
    fetcher,
    { dedupingInterval: 30_000, revalidateOnFocus: false }
  );

  const models = useMemo<SharedModel[]>(() => {
    const entries = data?.entries ?? [];
    return entries
      .filter((entry) => entry.capabilities.tools && isAgentCompatible(entry))
      .map((entry) => ({
        description: entry.description,
        id: entry.id,
        isFree: entry.isFree,
        maxContext: entry.capabilities.contextWindow ?? undefined,
        name: entry.name,
        provider: entry.provider,
        supported_parameters: [
          ...(entry.capabilities.reasoning ? ["reasoning"] : []),
          ...(entry.capabilities.tools ? ["tools"] : []),
        ],
      }));
  }, [data]);

  const catalogModelIds = useMemo(
    () => new Set((data?.entries ?? []).map((entry) => entry.id)),
    [data]
  );

  const capabilities = useMemo<Record<string, ModelCapabilities>>(() => {
    const map: Record<string, ModelCapabilities> = {};
    for (const entry of data?.entries ?? []) {
      if (entry.capabilities.tools) {
        map[entry.id] = entry.capabilities;
      }
    }
    return map;
  }, [data]);

  return { capabilities, catalogModelIds, isLoading, models };
}
