"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import useSWR, { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import { useAgentStream } from "@/components/agent/agent-stream-provider";
import { useDataStream } from "@/components/chat/data-stream-provider";
import { getChatHistoryPaginationKey } from "@/components/chat/sidebar-history";
import type { VisibilityType } from "@/components/chat/visibility-selector";
import type {
  AgentAutonomy,
  AgentStepRecord,
  AgentToolActivity,
  ToolCategory,
  ToolExecutionRecord,
} from "@/lib/agent/types";
import type { ReasoningLevel } from "@/lib/ai/registry/reasoning";
import type { Attachment, ChatMessage } from "@/lib/types";
import { fetcher, fetchWithErrorHandlers, generateUUID } from "@/lib/utils";

// Conduite de l'expérience Agent côté client. Le hook ne décide de rien : il
// compose la requête (modèle, projet, réflexion, autonomie, familles d'outils)
// et laisse chaque garde au serveur. Il relaie les data parts à
// AgentStreamProvider et n'est jamais la source de vérité de l'exécution.
export type AgentToolMode = "auto" | "all" | "categories";

export type AgentRequestOptions = {
  autonomy: AgentAutonomy;
  enabledCategories: ToolCategory[] | null;
  projectId: string | null;
  reasoningLevel: ReasoningLevel;
  toolMode: AgentToolMode;
};

export type AgentRunHistoryPayload = {
  executions?: ToolExecutionRecord[];
  mode?: string;
  runs?: { id: string; status: string }[];
  steps?: AgentStepRecord[];
};

const EMPTY_OPTIONS: AgentRequestOptions = {
  autonomy: "standard",
  enabledCategories: null,
  projectId: null,
  reasoningLevel: "medium",
  toolMode: "auto",
};

function toToolActivity(execution: ToolExecutionRecord): AgentToolActivity {
  return {
    category: execution.category,
    label: execution.toolId,
    runId: execution.runId,
    status:
      execution.status === "failed"
        ? "failed"
        : execution.status === "completed"
          ? "completed"
          : "running",
    stepId: execution.stepId ?? execution.id,
    toolId: execution.toolId,
  };
}

export function useAgentChat({
  chatId,
  isNewChat,
  modelId,
  visibility,
}: {
  chatId: string;
  isNewChat: boolean;
  modelId: string;
  visibility: VisibilityType;
}) {
  const { applyDataPart, state: streamState } = useAgentStream();
  const { setWaitingStatus } = useDataStream();
  const { mutate } = useSWRConfig();

  const optionsRef = useRef<AgentRequestOptions>(EMPTY_OPTIONS);
  const modelIdRef = useRef(modelId);
  modelIdRef.current = modelId;
  const visibilityRef = useRef(visibility);
  visibilityRef.current = visibility;

  const { data: chatData, isLoading } = useSWR(
    isNewChat
      ? null
      : `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/messages?chatId=${chatId}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const initialMessages: ChatMessage[] = isNewChat
    ? []
    : ((chatData?.messages as ChatMessage[] | undefined) ?? []);

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
      // Le statut d'attente est partagé avec le Chat : « Agent travaille… »
      // s'affiche pendant le premier chunk, comme pour une réponse classique.
      if (dataPart.type === "data-waiting-status") {
        setWaitingStatus(dataPart.data);
        return;
      }
      applyDataPart(dataPart);
    },
    onError: (error) => {
      const message =
        error instanceof Error && error.message
          ? error.message.slice(0, 300)
          : "Agent a rencontré une erreur inattendue.";
      toast.error(message);
    },
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },
    sendAutomaticallyWhen: ({ messages: currentMessages }) => {
      const lastMessage = currentMessages.at(-1);
      if (!lastMessage) {
        return false;
      }
      const hasApprovedTool = lastMessage.parts?.some(
        (part) =>
          "state" in part &&
          part.state === "approval-responded" &&
          "approval" in part &&
          (part.approval as { approved?: boolean })?.approved === true
      );
      if (hasApprovedTool) {
        return true;
      }
      // Reprise du même run : Agent a rendu la main (question, approbation) et
      // l'utilisateur vient de répondre.
      return Boolean(
        lastMessage.parts?.some(
          (part) =>
            "state" in part &&
            part.state === "output-available" &&
            "toolCallId" in part
        )
      );
    },
    transport: new DefaultChatTransport({
      api: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/agent`,
      fetch: fetchWithErrorHandlers,
      prepareReconnectToStreamRequest: () => ({
        api: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/chat/${chatId}/stream`,
      }),
      prepareSendMessagesRequest(request) {
        const lastMessage = request.messages.at(-1);
        const isContinuation = lastMessage?.role !== "user";
        const options = optionsRef.current;
        return {
          body: {
            autonomy: options.autonomy,
            enabledCategories: options.enabledCategories,
            id: request.id,
            modelId: modelIdRef.current,
            ...(isContinuation
              ? { messages: request.messages }
              : {
                  message: lastMessage,
                  projectId: options.projectId,
                }),
            reasoningLevel: options.reasoningLevel,
            toolMode: options.toolMode,
            visibility: visibilityRef.current,
            ...request.body,
          },
        };
      },
    }),
  });

  // Chargement initial d'une conversation existante : une seule fois par chat.
  const loadedChatIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (isNewChat) {
      return;
    }
    if (loadedChatIdRef.current === chatId) {
      return;
    }
    if (
      chatData?.messages &&
      (chatData.chatId === chatId || !chatData.chatId)
    ) {
      loadedChatIdRef.current = chatId;
      setMessages(chatData.messages as ChatMessage[]);
    }
  }, [chatId, chatData, isNewChat, setMessages]);

  // Reprise automatique après refresh : le serveur rejoue le flux resumable.
  const resumedChatIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (isNewChat || initialMessages.length === 0) {
      return;
    }
    if (resumedChatIdRef.current === chatId) {
      return;
    }
    if (initialMessages.at(-1)?.role !== "user") {
      return;
    }
    resumedChatIdRef.current = chatId;
    resumeStream().catch(() => {});
  }, [chatId, initialMessages, isNewChat, resumeStream]);

  useEffect(() => {
    if (status === "ready" || status === "error") {
      setWaitingStatus(undefined);
    }
  }, [status, setWaitingStatus]);

  const sendTask = useCallback(
    ({
      attachments = [],
      options,
      text,
    }: {
      attachments?: Attachment[];
      options?: AgentRequestOptions;
      text: string;
    }) => {
      if (options) {
        optionsRef.current = options;
      }
      if (typeof window !== "undefined") {
        window.history.pushState(
          {},
          "",
          `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/chat/${chatId}`
        );
      }
      sendMessage({
        parts: [
          ...attachments.map((attachment) => ({
            mediaType: attachment.contentType,
            name: attachment.name,
            type: "file" as const,
            url: attachment.url,
          })),
          { text, type: "text" as const },
        ],
        role: "user" as const,
      });
    },
    [chatId, sendMessage]
  );

  const runId = streamState.run?.runId ?? null;

  // Stop : on annule le flux côté client, puis on confirme côté serveur pour
  // que le run soit marqué « cancelled » et que les étapes déjà réalisées
  // restent intactes.
  const stopRun = useCallback(async () => {
    stop();
    if (!runId) {
      return;
    }
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/agent/runs/${runId}`,
        { method: "DELETE" }
      );
    } catch {
      // Sans confirmation, le serveur clôturera le run à la déconnexion.
    }
  }, [runId, stop]);

  return {
    addToolApprovalResponse,
    chatId,
    hasHistory: initialMessages.length > 0,
    isLoading: isNewChat ? false : isLoading,
    messages,
    regenerate,
    runId,
    sendTask,
    setMessages,
    setRequestOptions: (options: AgentRequestOptions) => {
      optionsRef.current = options;
    },
    status,
    stopRun,
  };
}

export { toToolActivity };
