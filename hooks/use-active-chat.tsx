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
import {
  type AIModeId,
  DEFAULT_AI_MODE,
  isValidAIModeId,
} from "@/lib/ai/modes";
import { DEFAULT_ENABLED_TOOLS, type ToolId } from "@/lib/ai/tools/config";
import type { Vote } from "@/lib/db/schema";
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
  currentModeId: AIModeId;
  setCurrentModeId: (id: AIModeId) => void;
  pendingProject: PendingProject;
  setPendingProject: (p: PendingProject) => void;
  clearPendingProject: () => void;
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
            "Mode fantôme activé - La discussion est temporaire et ne sera pas enregistrée en base de données.",
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

  const [currentModeId, setCurrentModeId] = useState<AIModeId>(DEFAULT_AI_MODE);
  const currentModeIdRef = useRef(currentModeId);
  const handleModeChange = useCallback((id: AIModeId) => {
    setCurrentModeId(id);
    currentModeIdRef.current = id;
    if (typeof document !== "undefined") {
      document.cookie = `ai-mode=${encodeURIComponent(id)}; path=/; max-age=31536000`;
    }
    // Persist default mode to DB (async, fire-and-forget)
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/user/preferences`, {
      body: JSON.stringify({ defaultMode: id }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }).catch(() => {});
  }, []);

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
      const cookieMode = document.cookie
        .split("; ")
        .find((row) => row.startsWith("ai-mode="))
        ?.split("=")[1];
      if (cookieMode) {
        const decodedMode = decodeURIComponent(cookieMode);
        if (isValidAIModeId(decodedMode)) {
          setCurrentModeId(decodedMode as AIModeId);
          currentModeIdRef.current = decodedMode as AIModeId;
        }
      }
      // Sync default mode from DB (overrides cookie if present)
      fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/user/preferences`)
        .then((r) => r.json())
        .then((data) => {
          if (data?.defaultMode && isValidAIModeId(data.defaultMode)) {
            const dbMode = data.defaultMode as AIModeId;
            // Only override if no cookie or DB differs from cookie -> treat DB as source of truth
            if (dbMode !== currentModeIdRef.current) {
              setCurrentModeId(dbMode);
              currentModeIdRef.current = dbMode;
              document.cookie = `ai-mode=${encodeURIComponent(dbMode)}; path=/; max-age=31536000`;
            }
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
      } else if (error instanceof ChatbotError) {
        toast({ description: error.message, type: "error" });
      } else {
        toast({
          description: error.message || "Oops, an error occurred!",
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
            enabledTools: toolsToSend,
            isGhostMode: isGhostModeRef.current,
            selectedChatMode: currentModeIdRef.current,
            selectedChatModel: currentModelIdRef.current,
            selectedVisibilityType: visibility,
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
      (chatData.chatId === chatId || !chatData.chatId)
    ) {
      if (lastLoadedChatIdRef.current !== chatId) {
        lastLoadedChatIdRef.current = chatId;
        setMessages(chatData.messages);
      }
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
      addToolApprovalResponse,
      chatId,
      clearPendingProject,
      clearPendingTools,
      currentModeId,
      currentModelId,
      input,
      isLoading: !isNewChat && isLoading,
      isReadonly,
      messages,
      pendingProject,
      pendingTools,
      regenerate,
      sendMessage,
      setCurrentModeId: handleModeChange,
      setCurrentModelId: handleModelChange,
      setInput,
      setMessages,
      setPendingProject,
      setPendingTools,
      isGhostMode,
      setIsGhostMode,
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
      currentModelId,
      currentModeId,
      pendingProject,
      setPendingProject,
      clearPendingProject,
      pendingTools,
      setPendingTools,
      togglePendingTool,
      clearPendingTools,
      showCreditCardAlert,
      isGhostMode,
      toggleGhostMode,
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
