"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import useSWR from "swr";
import { type AgentMode, isAgentMode } from "@/lib/agent/channel";
import type { AgentRunRecord } from "@/lib/agent/types";
import { apiEndpoints } from "@/lib/client/api-endpoints";
import { fetcher } from "@/lib/utils";

const STORAGE_KEY = "mai.agent-mode";
export const AGENT_MODE_COOKIE_NAME = "agent-mode";
const AGENT_MODE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function extractChatIdFromPath(pathname: string | null): string | null {
  const match = pathname?.match(/\/chat\/([^/]+)/);
  return match ? match[1] : null;
}

type AgentModePayload = {
  canUseAgent: boolean;
  defaultMode: string;
};

type AgentModeContextValue = {
  canUseAgent: boolean;
  isForced: boolean;
  mode: AgentMode;
  setMode: (mode: AgentMode) => void;
};

const AgentModeContext = createContext<AgentModeContextValue | null>(null);

// Le mode est un choix d'interface, pas une autorisation : il décide seulement
// de l'écran affiché sur la page principale. Deux exceptions où le serveur est
// la source de vérité : une conversation déjà enregistrée en mode « agent »
// (Chat.mode = 'agent') rouvre toujours l'expérience Agent, et la préférence
// enregistrée porte le mode d'accueil d'une visite à l'autre.
//
// Quatre sources, par ordre de priorité décroissante :
// 1. la conversation ouverte (Chat.mode), qui ne doit jamais être réécrite ;
// 2. le cookie serveur (agent-mode), qui garantit la cohérence SSR / hydratation ;
// 3. la préférence en base, qui survit au navigateur et au rechargement ;
// 4. le localStorage, qui permet l'affichage instantané avant l'aller-retour.
export function AgentModeProvider({
  children,
  initialMode,
}: {
  children: ReactNode;
  initialMode?: AgentMode;
}) {
  const pathname = usePathname();
  const chatId = extractChatIdFromPath(pathname);

  const [mode, setModeState] = useState<AgentMode>(initialMode ?? "chat");
  const [isForced, setIsForced] = useState(false);
  const [canUseAgent, setCanUseAgent] = useState(false);
  // La préférence a-t-elle déjà été lue ? Avant cela, le localStorage peut
  // pré-remplir l'écran, mais il ne doit pas écraser la base.
  const preferenceLoadedRef = useRef(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (isAgentMode(stored) && stored !== mode) {
        setModeState(stored);
        if (typeof document !== "undefined") {
          document.cookie = `${AGENT_MODE_COOKIE_NAME}=${encodeURIComponent(stored)}; path=/; max-age=${AGENT_MODE_COOKIE_MAX_AGE}`;
        }
      }
    } catch {
      // Stockage indisponible : on reste sur Chat.
    }
  }, [mode]);

  const { data: preference } = useSWR<AgentModePayload>(
    apiEndpoints.agentMode(),
    fetcher,
    { dedupingInterval: 60_000, revalidateOnFocus: false }
  );

  useEffect(() => {
    if (!preference) {
      return;
    }
    setCanUseAgent(preference.canUseAgent);
    if (preferenceLoadedRef.current) {
      return;
    }
    preferenceLoadedRef.current = true;
    // La base l'emporte sur le cache local, sauf si elle dit « chat » alors
    // que le cache dit « agent » : c'est le cas d'un compte qui perd l'accès,
    // où appliquer « agent » afficherait un écran que le gate refusera.
    if (isAgentMode(preference.defaultMode)) {
      setModeState(preference.defaultMode);
      if (typeof document !== "undefined") {
        document.cookie = `${AGENT_MODE_COOKIE_NAME}=${encodeURIComponent(preference.defaultMode)}; path=/; max-age=${AGENT_MODE_COOKIE_MAX_AGE}`;
      }
      return;
    }
    if (preference.canUseAgent) {
      setModeState("chat");
      if (typeof document !== "undefined") {
        document.cookie = `${AGENT_MODE_COOKIE_NAME}=chat; path=/; max-age=${AGENT_MODE_COOKIE_MAX_AGE}`;
      }
      return;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!isAgentMode(stored) || stored === "agent") {
        setModeState("chat");
        if (typeof document !== "undefined") {
          document.cookie = `${AGENT_MODE_COOKIE_NAME}=chat; path=/; max-age=${AGENT_MODE_COOKIE_MAX_AGE}`;
        }
      }
    } catch {
      setModeState("chat");
      if (typeof document !== "undefined") {
        document.cookie = `${AGENT_MODE_COOKIE_NAME}=chat; path=/; max-age=${AGENT_MODE_COOKIE_MAX_AGE}`;
      }
    }
  }, [preference]);

  const { data } = useSWR<{ mode?: string; runs?: AgentRunRecord[] }>(
    chatId ? apiEndpoints.agentRunsForChat(chatId) : null,
    fetcher,
    { dedupingInterval: 30_000, revalidateOnFocus: false }
  );

  useEffect(() => {
    if (!chatId) {
      setIsForced(false);
      return;
    }
    if (data?.mode === "agent") {
      setModeState("agent");
      setIsForced(true);
      return;
    }
    if (data) {
      setIsForced(false);
    }
  }, [chatId, data]);

  const setMode = useCallback((next: AgentMode) => {
    setModeState(next);
    setIsForced(false);
    if (typeof document !== "undefined") {
      document.cookie = `${AGENT_MODE_COOKIE_NAME}=${encodeURIComponent(next)}; path=/; max-age=${AGENT_MODE_COOKIE_MAX_AGE}`;
    }
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Sans stockage, le choix ne survit pas au rechargement : sans gravité.
    }
    // Écriture opportuniste : l'affichage est déjà à jour, la base suit derrière.
    // Un échec n'a rien à signaler — l'utilisateur a ce qu'il a demandé, et le
    // gate interdit de toute façon d'utiliser un mode interdit.
    fetch(apiEndpoints.agentMode(), {
      body: JSON.stringify({ defaultMode: next }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    }).catch(() => {});
  }, []);

  const value = useMemo<AgentModeContextValue>(
    () => ({ canUseAgent, isForced, mode, setMode }),
    [canUseAgent, isForced, mode, setMode]
  );

  return (
    <AgentModeContext.Provider value={value}>
      {children}
    </AgentModeContext.Provider>
  );
}

export function useAgentMode() {
  const context = useContext(AgentModeContext);
  if (!context) {
    throw new Error("useAgentMode doit être utilisé dans AgentModeProvider");
  }
  return context;
}
