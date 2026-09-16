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
//
// Le fetcher LÈVE sur une réponse non-OK : un 401/500 ponctuel ne doit plus
// mettre `null` en cache SWR (qui figeait tier="free" pour toute la session
// et bloquait les abonnés payants hors de l'espace Agent). En cas d'échec,
// SWR réessaie et l'appelant reçoit `isError` + les dernières données valides.
export function useAgentFlags() {
  const { data, error, isLoading } = useSWR<AgentFlagsPayload>(
    `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/agent/flags`,
    (url: string) => {
      // fetch+throw (et non fetch->null) : laisse SWR gérer retry/état d'erreur.
      return fetch(url).then((response) => {
        if (!response.ok) {
          throw new Error(`agent/flags HTTP ${response.status}`);
        }
        return response.json() as Promise<AgentFlagsPayload>;
      });
    },
    {
      dedupingInterval: 60_000,
      errorRetryCount: 6,
      errorRetryInterval: 5000,
      // Un échec réseau ne doit pas verrouiller l'utilisateur en mode Chat :
      // on retente au focus et à intervalle régulier jusqu'à récupération.
      revalidateOnFocus: true,
      shouldRetryOnError: true,
    }
  );

  const flags: AgentFlags = data?.flags ?? DEFAULT_AGENT_FLAGS;
  const channel: AgentChannel = data?.channel?.channel ?? "alpha";

  return {
    channel,
    channelInfo: data?.channel ?? getAgentChannelInfo(channel),
    flags,
    isEnabled: (key: AgentFlagKey) => flags[key],
    isError: Boolean(error),
    isLoading,
    tier: data?.tier ?? null,
  };
}
