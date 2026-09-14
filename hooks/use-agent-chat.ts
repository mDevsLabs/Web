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
  suggestedActions?: Record<
    string,
    { id: string; label: string; payload: Record<string, unknown> }[]
  >;
};

// Une partie de message déclenche la reprise si l'utilisateur a accordé une
// approbation, ou s'il a répondu à une question (marqueur posé par la carte
// après validation serveur). Aucune autre sortie d'outil ne déclenche.
function isResumeTriggerPart(part: unknown): boolean {
  if (!part || typeof part !== "object") {
    return false;
  }
  const candidate = part as {
    approval?: { approved?: boolean };
    output?: { answered?: boolean };
    state?: string;
  };
  const output = candidate.output;
  const answered =
    output !== null && typeof output === "object"
      ? (output as { answered?: boolean }).answered
      : undefined;
  if (candidate.state === "approval-responded") {
    return candidate.approval?.approved === true;
  }
  return candidate.state === "output-available" && answered === true;
}

export type SubmitUserInputResult =
  | { message?: string; ok: true }
  | { message: string; ok: false };

// Partie de message Agent telle que produite par le transport : sert
// uniquement à marquer localement une réponse déjà validée par le serveur.
type AgentMessagePart = NonNullable<ChatMessage["parts"]>[number];

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
      // Fin de run : l'historique persisté (timeline, usage, actions
      // suggérées) est revalidé — le flux ne sert qu'aux mises à jour live.
      mutate(
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/agent/runs?chatId=${chatId}`
      );
    },
    // Reprise du MÊME run, uniquement sur une action explicite de
    // l'utilisateur : une approbation accordée, ou une réponse enregistrée par
    // la carte de clarification. Une simple sortie d'outil ne relance JAMAIS
    // le run : un run qui attend une réponse ne doit pas avancer sans elle.
    sendAutomaticallyWhen: ({ messages: currentMessages }) => {
      const lastMessage = currentMessages.at(-1);
      if (!lastMessage) {
        return false;
      }
      return Boolean(lastMessage.parts?.some(isResumeTriggerPart));
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

  // Enregistrement d'une réponse à un questionnaire : le serveur valide et
  // persiste (autorité unique), puis le message local est marqué « répondu »
  // pour que la reprise du même run soit déclenchée. Le contenu transmis au
  // modèle est toujours relu depuis la base, jamais depuis ce marqueur.
  const submitUserInputAnswer = useCallback(
    async ({
      answers,
      requestId,
      revision,
      runId: answeredRunId,
      toolCallId,
    }: {
      answers: { questionId: string; value: unknown }[];
      requestId: string;
      revision: number;
      runId?: string;
      toolCallId: string;
    }): Promise<SubmitUserInputResult> => {
      // Le run vient de l'état de flux quand il existe, sinon de la sortie
      // persistée de la question (après un refresh) : jamais d'un identifiant
      // fabriqué côté client.
      const targetRunId = runId ?? answeredRunId ?? "";
      if (!targetRunId) {
        return {
          message:
            "Ce run n'est plus joignable : rechargez la conversation avant de répondre.",
          ok: false,
        };
      }
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/agent/runs/${targetRunId}/user-input`,
          {
            body: JSON.stringify({ answers, requestId, revision }),
            headers: { "Content-Type": "application/json" },
            method: "POST",
          }
        );
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
          message?: string;
          ok?: boolean;
        } | null;
        if (!response.ok || !payload?.ok) {
          return {
            message:
              payload?.message ??
              "Votre réponse n'a pas pu être enregistrée. Réessayez.",
            ok: false,
          };
        }
        setMessages((current) =>
          current.map((message) => ({
            ...message,
            parts: (message.parts ?? []).map((part) => {
              const candidate = part as { toolCallId?: string };
              if (candidate.toolCallId !== toolCallId) {
                return part;
              }
              // Marqueur local : la réponse faisant autorité est relue depuis
              // la base par le serveur à la reprise, jamais depuis ce champ. Les
              // données du questionnaire sont conservées pour que la carte
              // reste lisible (question + réponse) après l'envoi.
              const current = (part as { output?: unknown }).output;
              return {
                ...part,
                output: {
                  ...(current && typeof current === "object" ? current : {}),
                  answered: true,
                  answers,
                  status: "answered",
                },
                state: "output-available",
              } as unknown as AgentMessagePart;
            }),
          }))
        );
        return { ok: true };
      } catch {
        return {
          message: "Connexion impossible : votre réponse n'a pas été envoyée.",
          ok: false,
        };
      }
    },
    [runId, setMessages]
  );

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
    submitUserInputAnswer,
  };
}

export { toToolActivity };
