"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import useSWR from "swr";
import { type AgentMode, isAgentMode } from "@/lib/agent/channel";
import type { AgentRunRecord } from "@/lib/agent/types";
import { fetcher } from "@/lib/utils";

const STORAGE_KEY = "mai.agent-mode";

export function extractChatIdFromPath(pathname: string | null): string | null {
  const match = pathname?.match(/\/chat\/([^/]+)/);
  return match ? match[1] : null;
}

type AgentModeContextValue = {
  isForced: boolean;
  mode: AgentMode;
  setMode: (mode: AgentMode) => void;
};

const AgentModeContext = createContext<AgentModeContextValue | null>(null);

// Le mode est un choix d'interface, pas une autorisation : il décide seulement
// de l'écran affiché sur la page principale. Deux exceptions où le serveur est
// la source de vérité : une conversation déjà enregistrée en mode « agent »
// (Chat.mode = 'agent') rouvre toujours l'expérience Agent.
export function AgentModeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const chatId = extractChatIdFromPath(pathname);

  const [mode, setModeState] = useState<AgentMode>("chat");
  const [isForced, setIsForced] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (isAgentMode(stored)) {
        setModeState(stored);
      }
    } catch {
      // Stockage indisponible : on reste sur Chat.
    }
  }, []);

  const { data } = useSWR<{ mode?: string; runs?: AgentRunRecord[] }>(
    chatId
      ? `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/agent/runs?chatId=${chatId}`
      : null,
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
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Sans stockage, le choix ne survit pas au rechargement : sans gravité.
    }
  }, []);

  const value = useMemo<AgentModeContextValue>(
    () => ({ isForced, mode, setMode }),
    [isForced, mode, setMode]
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
