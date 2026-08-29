"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { usePathname, useSearchParams } from "next/navigation";
import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import useSWR, { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import { useDataStream } from "@/components/chat/data-stream-provider";
import { getChatHistoryPaginationKey } from "@/components/chat/sidebar-history";
import { toast } from "@/components/chat/toast";
import type { VisibilityType } from "@/components/chat/visibility-selector";
import { useAutoResume } from "@/hooks/use-auto-resume";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { DEFAULT_ENABLED_TOOLS, type ToolId } from "@/lib/ai/tools/config";
import type { Agent, Skill, Vote } from "@/lib/db/schema";
import { ChatbotError } from "@/lib/errors";
import type { ChatMessage } from "@/lib/types";
import { fetcher, fetchWithErrorHandlers, generateUUID } from "@/lib/utils";

export type PendingProject = {
  id: string;
  name: string;
  color?: string;
  icon?: string;
} | null;

type ActiveChatContextValue = {
  chatId: string;
  currentChatTitle?: string;
  messages: ChatMessage[];
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  status: UseChatHelpers<ChatMessage>["status"];
  stop: UseChatHelpers<ChatMessage>["stop"];
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
  addToolApprovalResponse: UseChatHelpers<ChatMessage>["addToolApprovalResponse"];
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  visibilityType: VisibilityType;
  isReadonly: boolean;
  isLoading: boolean;
  votes: Vote[] | undefined;
  currentModelId: string;
  setCurrentModelId: (id: string) => void;
  activeAgent: Agent | null;
  setActiveAgent: (agent: Agent | null) => void;
  clearActiveAgent: () => void;
  // Deprecated alias for backward compat (maps to activeAgent)
  currentModeId: string | null;
  setCurrentModeId: (id: string | null) => void;
  pendingProject: PendingProject;
  setPendingProject: (p: PendingProject) => void;
  clearPendingProject: () => void;
  activeSkill: Skill | null;
  setActiveSkill: (skill: Skill | null) => void;
  clearActiveSkill: () => void;
  pendingTools: ToolId[];
  setPendingTools: (tools: ToolId[]) => void;
  togglePendingTool: (tool: ToolId) => void;
  clearPendingTools: () => void;
  showCreditCardAlert: boolean;
  setShowCreditCardAlert: Dispatch<SetStateAction<boolean>>;
  isGhostMode: boolean;
  setIsGhostMode: Dispatch<SetStateAction<boolean>>;
  toggleGhostMode: () => void;
};

const ActiveChatContext = createContext<ActiveChatContextValue | null>(null);

function extractChatId(pathname: string): string | null {
  const match = pathname.match(/\/chat\/([^/]+)/);
  return match ? match[1] : null;
}

export function ActiveChatProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setDataStream, setWaitingStatus } = useDataStream();

  const getAiErrorMessage = useCallback((error: unknown) => {
    const candidate = error as { status?: number; statusCode?: number; message?: string };
    const message = candidate?.message ?? String(error ?? "");
    const code = candidate?.status ?? candidate?.statusCode ?? Number(message.match(/\b(403|429|5\d\d|4\d\d)\b/)?.[1]);
    if (code === 403) return "Code 403 : Quota atteint !";
    if (code === 429) return "Code 429 : Serveurs surchargés, réessayer plus tard !";
    if (Number.isInteger(code) && code > 0) return `Code ${code} : Une erreur est survenue !`;
    return "Une erreur est survenue lors de la génération de la réponse.";
  }, []);
  const { mutate } = useSWRConfig();
  const pendingProjectIdRef = useRef<string | null>(null);

  const [pendingProject, setPendingProjectState] =
    useState<PendingProject>(null);
  const pendingProjectRef = useRef<PendingProject>(null);
  pendingProjectRef.current = pendingProject;

  const setPendingProject = useCallback((p: PendingProject) => {
    setPendingProjectState(p);
    pendingProjectIdRef.current = p?.id ?? null;
    if (typeof window !== "undefined") {
      if (p?.id) {
        try {
          localStorage.setItem("pendingProjectId", p.id);
          localStorage.setItem("pendingProjectName", p.name);
          if (p.color) {
            localStorage.setItem("pendingProjectColor", p.color);
          }
          if (p.icon) {
            localStorage.setItem("pendingProjectIcon", p.icon);
          }
        } catch {}
      } else {
        try {
          localStorage.removeItem("pendingProjectId");
          localStorage.removeItem("pendingProjectName");
          localStorage.removeItem("pendingProjectColor");
          localStorage.removeItem("pendingProjectIcon");
        } catch {}
      }
    }
  }, []);

  const clearPendingProject = useCallback(() => {
    setPendingProject(null);
  }, [setPendingProject]);

  // Active Skill (persisted for the conversation)
  const [activeSkill, setActiveSkillState] = useState<Skill | null>(null);
  const activeSkillRef = useRef<Skill | null>(null);
  activeSkillRef.current = activeSkill;
  const activeSkillIdRef = useRef<string | null>(null);

  const setActiveSkill = useCallback((s: Skill | null) => {
    setActiveSkillState(s);
    activeSkillRef.current = s;
    activeSkillIdRef.current = s?.id ?? null;
  }, []);

  const clearActiveSkill = useCallback(() => {
    setActiveSkillState(null);
    activeSkillRef.current = null;
    activeSkillIdRef.current = null;
  }, []);

  // Ghost mode (ephemeral, no DB recording, imageGenerate disabled)
  const [isGhostMode, setIsGhostMode] = useState<boolean>(false);
  const isGhostModeRef = useRef<boolean>(isGhostMode);
  isGhostModeRef.current = isGhostMode;

  const toggleGhostMode = useCallback(() => {
    setIsGhostMode((prev) => {
      const next = !prev;
      isGhostModeRef.current = next;
      if (next) {
        // Auto-disable imageGenerate tool if pending
        setPendingToolsState((tools) => {
          const filtered = tools.filter((t) => t !== "imageGenerate");
          pendingToolsRef.current = filtered;
          return filtered;
        });
        toast({
          description:
            "Mode fantôme activé - La discussion est temporaire et ne sera pas enregistrée.",
          type: "success",
        });
      } else {
        toast({
          description: "Mode fantôme désactivé",
          type: "success",
        });
      }
      return next;
    });
  }, []);

  // Pending tools one-shot (disabled by default)
  const [pendingTools, setPendingToolsState] = useState<ToolId[]>(
    DEFAULT_ENABLED_TOOLS
  );
  const pendingToolsRef = useRef<ToolId[]>(pendingTools);
  pendingToolsRef.current = pendingTools;
  const setPendingTools = useCallback((tools: ToolId[]) => {
    setPendingToolsState(tools);
    pendingToolsRef.current = tools;
  }, []);
  const togglePendingTool = useCallback((tool: ToolId) => {
    if (tool === "imageGenerate" && isGhostModeRef.current) {
      toast({
        description: "La génération d'image est indisponible en Mode fantôme",
        type: "error",
      });
      return;
    }
    setPendingToolsState((prev) => {
      const next = prev.includes(tool)
        ? prev.filter((t) => t !== tool)
        : [...prev, tool];
      pendingToolsRef.current = next;
      return next;
    });
  }, []);
  const clearPendingTools = useCallback(() => {
    setPendingToolsState([]);
    pendingToolsRef.current = [];
  }, []);

  // Lire projectId depuis query ?projectId= ou sessionStorage legacy ou localStorage sticky
  useEffect(() => {
    // Restore sticky from localStorage first
    if (typeof window !== "undefined" && !pendingProjectIdRef.current) {
      try {
        const storedId = localStorage.getItem("pendingProjectId");
        const storedName = localStorage.getItem("pendingProjectName");
        const storedColor = localStorage.getItem("pendingProjectColor");
        const storedIcon = localStorage.getItem("pendingProjectIcon");
        if (storedId && storedName) {
          const restored: PendingProject = {
            color: storedColor ?? undefined,
            icon: storedIcon ?? undefined,
            id: storedId,
            name: storedName,
          };
          setPendingProjectState(restored);
          pendingProjectIdRef.current = storedId;
          pendingProjectRef.current = restored;
        }
      } catch {}
    }
    const qp = searchParams.get("projectId");
    if (qp) {
      pendingProjectIdRef.current = qp;
      // Try to fetch name async - fallback to id
      setPendingProjectState((prev) =>
        prev?.id === qp ? prev : { id: qp, name: qp.slice(0, 8) }
      );
      // Nettoyer l'URL sans reload (garde chatId)
      const url = new URL(window.location.href);
      url.searchParams.delete("projectId");
      window.history.replaceState(
        {},
        "",
        url.pathname +
          (url.search ? `?${url.searchParams.toString()}` : "") +
          url.hash
      );
      try {
        localStorage.setItem("pendingProjectId", qp);
      } catch {}
    } else if (typeof window !== "undefined") {
      const legacy = sessionStorage.getItem("pendingProjectId");
      if (legacy) {
        pendingProjectIdRef.current = legacy;
        setPendingProjectState((prev) =>
          prev?.id === legacy ? prev : { id: legacy, name: legacy.slice(0, 8) }
        );
        sessionStorage.removeItem("pendingProjectId");
        try {
          localStorage.setItem("pendingProjectId", legacy);
        } catch {}
      }
    }
  }, [searchParams]);

  const chatIdFromUrl = extractChatId(pathname);
  const isNewChat = !chatIdFromUrl;
  const newChatIdRef = useRef(generateUUID());
  const prevPathnameRef = useRef(pathname);

  if (isNewChat && prevPathnameRef.current !== pathname) {
    newChatIdRef.current = generateUUID();
  }
  prevPathnameRef.current = pathname;

  const chatId = chatIdFromUrl ?? newChatIdRef.current;

  const [currentModelId, setCurrentModelId] = useState(DEFAULT_CHAT_MODEL);
  const currentModelIdRef = useRef(currentModelId);

  const handleModelChange = useCallback((id: string) => {
    setCurrentModelId(id);
    currentModelIdRef.current = id;
    if (typeof document !== "undefined") {
      document.cookie = `chat-model=${encodeURIComponent(id)}; path=/; max-age=31536000`;
    }
  }, []);

  // Active Agent (remplace Mode IA) — sélection globale via cookie agent-id
  const [activeAgent, setActiveAgentState] = useState<Agent | null>(null);
  const activeAgentRef = useRef<Agent | null>(null);
  activeAgentRef.current = activeAgent;
  const activeAgentIdRef = useRef<string | null>(null);

  const setActiveAgent = useCallback((agent: Agent | null) => {
    setActiveAgentState(agent);
    activeAgentRef.current = agent;
    activeAgentIdRef.current = agent?.id ?? null;
    if (typeof document !== "undefined") {
      if (agent?.id) {
        document.cookie = `agent-id=${encodeURIComponent(agent.id)}; path=/; max-age=31536000`;
        // Le modèle par défaut de l'agent écrase le modèle global
        if (agent.defaultModelId) {
          setCurrentModelId(agent.defaultModelId);
          currentModelIdRef.current = agent.defaultModelId;
          document.cookie = `chat-model=${encodeURIComponent(agent.defaultModelId)}; path=/; max-age=31536000`;
        }
      } else {
        document.cookie = "agent-id=; path=/; max-age=0";
      }
    }
    // Persist globale
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/user/preferences`, {
      body: JSON.stringify({ defaultAgentId: agent?.id ?? null }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }).catch(() => {});
  }, []);

  const clearActiveAgent = useCallback(() => {
    setActiveAgent(null);
  }, [setActiveAgent]);

  // Alias deprecated pour compatibilité (ancien Mode IA)
  const currentModeId = activeAgent?.id ?? null;
  const currentModeIdRef = useRef<string | null>(null);
  currentModeIdRef.current = currentModeId;
  const handleModeChange = useCallback(
    (id: string | null) => {
      if (!id) {
        clearActiveAgent();
        return;
      }
      // Si on passe un ID d'agent, fetch l'agent
      fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/agents/${id}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data) {
            setActiveAgent(data as Agent);
          }
        })
        .catch(() => {});
    },
    [clearActiveAgent, setActiveAgent]
  );

  useEffect(() => {
    if (typeof document !== "undefined") {
      const cookieModel = document.cookie
        .split("; ")
        .find((row) => row.startsWith("chat-model="))
        ?.split("=")[1];
      if (cookieModel) {
        const decoded = decodeURIComponent(cookieModel);
        setCurrentModelId(decoded);
        currentModelIdRef.current = decoded;
      }
      const cookieAgent = document.cookie
        .split("; ")
        .find((row) => row.startsWith("agent-id="))
        ?.split("=")[1];
      if (cookieAgent) {
        const decodedAgent = decodeURIComponent(cookieAgent);
        if (decodedAgent) {
          fetch(
            `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/agents/${decodedAgent}`
          )
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
              if (data?.id) {
                setActiveAgentState(data as Agent);
                activeAgentRef.current = data as Agent;
                activeAgentIdRef.current = data.id;
              }
            })
            .catch(() => {});
        }
      }
      // Sync default agent from DB (source de vérité)
      fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/user/preferences`)
        .then((r) => r.json())
        .then((data) => {
          if (
            data?.defaultAgentId &&
            data.defaultAgentId !== activeAgentIdRef.current
          ) {
            fetch(
              `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/agents/${data.defaultAgentId}`
            )
              .then((r2) => (r2.ok ? r2.json() : null))
              .then((ag) => {
                if (ag?.id) {
                  setActiveAgentState(ag as Agent);
                  activeAgentRef.current = ag as Agent;
                  activeAgentIdRef.current = ag.id;
                  document.cookie = `agent-id=${encodeURIComponent(ag.id)}; path=/; max-age=31536000`;
                  if (ag.defaultModelId) {
                    setCurrentModelId(ag.defaultModelId);
                    currentModelIdRef.current = ag.defaultModelId;
                    document.cookie = `chat-model=${encodeURIComponent(ag.defaultModelId)}; path=/; max-age=31536000`;
                  }
                }
              })
              .catch(() => {});
          }
        })
        .catch(() => {});
    }
  }, []);

  const [input, setInput] = useState("");
  const [showCreditCardAlert, setShowCreditCardAlert] = useState(false);

  const { data: chatData, isLoading } = useSWR(
    isNewChat
      ? null
      : `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/messages?chatId=${chatId}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const initialMessages: ChatMessage[] = isNewChat
    ? []
    : (chatData?.messages ?? []);
  const visibility: VisibilityType = isNewChat
    ? "private"
    : (chatData?.visibility ?? "private");

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    resumeStream,
    addToolApprovalResponse,
  } = useChat<ChatMessage>({
    generateId: generateUUID,
    id: chatId,
    messages: initialMessages,
    onData: (dataPart) => {
      if (dataPart.type === "data-waiting-status") {
        setWaitingStatus(dataPart.data);
        return;
      }
      setDataStream((ds) => (ds ? [...ds, dataPart] : []));
    },
    onError: (error) => {
      if (error.message?.includes("AI Gateway requires a valid credit card")) {
        setShowCreditCardAlert(true);
      } else {
        toast({
          description: getAiErrorMessage(error),
          type: "error",
        });
      }
    },
    onFinish: () => {
      if (!isGhostModeRef.current) {
        mutate(unstable_serialize(getChatHistoryPaginationKey));
      }
    },
    sendAutomaticallyWhen: ({ messages: currentMessages }) => {
      const lastMessage = currentMessages.at(-1);
      return (
        lastMessage?.parts?.some(
          (part) =>
            "state" in part &&
            part.state === "approval-responded" &&
            "approval" in part &&
            (part.approval as { approved?: boolean })?.approved === true
        ) ?? false
      );
    },
    transport: new DefaultChatTransport({
      api: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/chat`,
      fetch: fetchWithErrorHandlers,
      prepareSendMessagesRequest(request) {
        const lastMessage = request.messages.at(-1);
        const isToolApprovalContinuation =
          lastMessage?.role !== "user" ||
          request.messages.some((msg) =>
            msg.parts?.some((part) => {
              const { state } = part as { state?: string };
              return (
                state === "approval-responded" || state === "output-denied"
              );
            })
          );

        // Inject projectId pour nouvelle discussion si présent (sticky session)
        const projectIdToSend = isToolApprovalContinuation
          ? null
          : pendingProjectIdRef.current;
        // Session complète: on NE clear pas après envoi, reste sticky jusqu'à clear manuel

        // One-shot tools: capture and clear after send
        const toolsToSend = isToolApprovalContinuation
          ? []
          : isGhostModeRef.current
            ? pendingToolsRef.current.filter((t) => t !== "imageGenerate")
            : [...pendingToolsRef.current];
        if (!isToolApprovalContinuation && pendingToolsRef.current.length > 0) {
          // Clear after capturing — one-shot
          setTimeout(() => clearPendingTools(), 0);
        }

        return {
          body: {
            id: request.id,
            ...(isToolApprovalContinuation
              ? { messages: request.messages }
              : {
                  message: lastMessage,
                  ...(projectIdToSend ? { projectId: projectIdToSend } : {}),
                }),
            agentId: activeAgentIdRef.current,
            enabledTools: toolsToSend,
            isGhostMode: isGhostModeRef.current,
            selectedChatMode: currentModeIdRef.current,
            selectedChatModel: currentModelIdRef.current,
            selectedVisibilityType: visibility,
            skillId: activeSkillIdRef.current,
            ...(projectIdToSend && isToolApprovalContinuation
              ? { projectId: projectIdToSend }
              : {}),
            ...request.body,
          },
        };
      },
    }),
  });

  useEffect(() => {
    if (status === "submitted" || status === "ready" || status === "error") {
      setWaitingStatus(undefined);
    }
  }, [status, setWaitingStatus]);

  const lastLoadedChatIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (isNewChat) {
      if (lastLoadedChatIdRef.current !== chatId) {
        lastLoadedChatIdRef.current = chatId;
        setMessages([]);
      }
      return;
    }
    if (
      chatData?.messages &&
      (chatData.chatId === chatId || !chatData.chatId) &&
      lastLoadedChatIdRef.current !== chatId
    ) {
      lastLoadedChatIdRef.current = chatId;
      setMessages(chatData.messages);
    }
  }, [chatId, isNewChat, chatData, setMessages]);

  useEffect(() => {
    if (chatData && !isNewChat) {
      const cookieModel = document.cookie
        .split("; ")
        .find((row) => row.startsWith("chat-model="))
        ?.split("=")[1];
      if (cookieModel) {
        setCurrentModelId(decodeURIComponent(cookieModel));
      }
    }
  }, [chatData, isNewChat]);

  const hasAppendedQueryRef = useRef(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("query");
    if (query && !hasAppendedQueryRef.current) {
      hasAppendedQueryRef.current = true;
      window.history.replaceState(
        {},
        "",
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/chat/${chatId}`
      );
      sendMessage({
        parts: [{ text: query, type: "text" }],
        role: "user" as const,
      });
    }
  }, [sendMessage, chatId]);

  useAutoResume({
    autoResume: !isNewChat && !!chatData,
    initialMessages,
    resumeStream,
    setMessages,
  });

  const isReadonly = isNewChat ? false : (chatData?.isReadonly ?? false);

  const { data: votes } = useSWR<Vote[]>(
    !isReadonly && messages.length >= 2
      ? `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/vote?chatId=${chatId}`
      : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const value = useMemo<ActiveChatContextValue>(
    () => ({
      activeAgent,
      activeSkill,
      addToolApprovalResponse,
      chatId,
      clearActiveAgent,
      clearActiveSkill,
      clearPendingProject,
      clearPendingTools,
      currentModeId,
      currentModelId,
      input,
      isGhostMode,
      isLoading: !isNewChat && isLoading,
      isReadonly,
      messages,
      pendingProject,
      pendingTools,
      regenerate,
      sendMessage,
      setActiveAgent,
      setActiveSkill,
      setCurrentModeId: handleModeChange,
      setCurrentModelId: handleModelChange,
      setInput,
      setIsGhostMode,
      setMessages,
      setPendingProject,
      setPendingTools,
      setShowCreditCardAlert,
      showCreditCardAlert,
      status,
      stop,
      toggleGhostMode,
      togglePendingTool,
      visibilityType: visibility,
      votes,
    }),
    [
      chatId,
      messages,
      setMessages,
      sendMessage,
      status,
      stop,
      regenerate,
      addToolApprovalResponse,
      input,
      visibility,
      isReadonly,
      isNewChat,
      isLoading,
      votes,
      activeAgent,
      setActiveAgent,
      clearActiveAgent,
      currentModelId,
      currentModeId,
      pendingProject,
      setPendingProject,
      clearPendingProject,
      activeSkill,
      setActiveSkill,
      clearActiveSkill,
      pendingTools,
      setPendingTools,
      togglePendingTool,
      clearPendingTools,
      showCreditCardAlert,
      isGhostMode,
      toggleGhostMode,
      handleModelChange,
      handleModeChange,
    ]
  );

  return (
    <ActiveChatContext.Provider value={value}>
      {children}
    </ActiveChatContext.Provider>
  );
}

export function useActiveChat() {
  const context = useContext(ActiveChatContext);
  if (!context) {
    throw new Error("useActiveChat must be used within ActiveChatProvider");
  }
  return context;
}
