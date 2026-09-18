"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import type { AgentFlags } from "@/lib/agent/flags";
import type {
  AgentSettings,
  ToolCategory,
  ToolPermission,
} from "@/lib/agent/types";
import type { AgentModelEntry } from "@/lib/ai/registry";
import type { ReasoningLevel } from "@/lib/ai/registry/reasoning";
import { apiEndpoints } from "@/lib/client/api-endpoints";
import { fetcher } from "@/lib/utils";

export type AgentSettingsTool = {
  category: ToolCategory;
  defaultPermission: ToolPermission;
  description: string;
  id: string;
  name: string;
};

export type AgentSettingsPayload = {
  agentModels: AgentModelEntry[];
  flags: AgentFlags;
  settings: AgentSettings;
  tools: AgentSettingsTool[];
};

export type AgentSettingsPatch = {
  autonomy?: AgentSettings["autonomy"];
  defaultModel?: string | null;
  defaultProjectId?: string | null;
  enabledCategories?: ToolCategory[] | null;
  reasoningLevel?: ReasoningLevel;
  toolPolicies?: Record<string, ToolPermission>;
};

const ENDPOINT = apiEndpoints.agentSettings();

export function useAgentSettings() {
  const { data, error, isLoading, mutate } = useSWR<AgentSettingsPayload>(
    ENDPOINT,
    fetcher,
    { dedupingInterval: 15_000, revalidateOnFocus: false }
  );

  const update = useCallback(
    async (patch: AgentSettingsPatch) => {
      try {
        const response = await fetch(ENDPOINT, {
          body: JSON.stringify(patch),
          headers: { "Content-Type": "application/json" },
          method: "PATCH",
        });
        if (!response.ok) {
          throw new Error("patch");
        }
        // Optimiste : la réponse fait foi, puis on resynchronise.
        await mutate(
          (current) =>
            current
              ? {
                  ...current,
                  settings: { ...current.settings, ...(patch as object) },
                }
              : current,
          { revalidate: true }
        );
      } catch {
        toast.error("Impossible d'enregistrer les paramètres Agent.");
      }
    },
    [mutate]
  );

  return { data, error, isLoading, update };
}
