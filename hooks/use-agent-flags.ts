"use client";

import useSWR from "swr";
import {
  type AgentChannel,
  type AgentChannelInfo,
  getAgentChannelInfo,
} from "@/lib/agent/channel";
import {
  type AgentFlagKey,
  type AgentFlags,
  DEFAULT_AGENT_FLAGS,
} from "@/lib/agent/flags";

export type AgentFlagsPayload = {
  channel: AgentChannelInfo;
  flags: AgentFlags;
  tier: string;
};

// Fonctionnalités réellement actives côté serveur. L'interface s'y adapte mais
// ne décide de rien : chaque garde est revérifiée dans les routes Agent.
export function useAgentFlags() {
  const { data, isLoading } = useSWR<AgentFlagsPayload>(
    `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/agent/flags`,
    (url: string) =>
      fetch(url).then((response) => (response.ok ? response.json() : null)),
    { dedupingInterval: 60_000, revalidateOnFocus: false }
  );

  const flags: AgentFlags = data?.flags ?? DEFAULT_AGENT_FLAGS;
  const channel: AgentChannel = data?.channel?.channel ?? "alpha";

  return {
    channel,
    channelInfo: data?.channel ?? getAgentChannelInfo(channel),
    flags,
    isEnabled: (key: AgentFlagKey) => flags[key],
    isLoading,
    tier: data?.tier ?? "free",
  };
}
