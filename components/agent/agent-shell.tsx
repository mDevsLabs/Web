"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import type { AgentComposerSubmit } from "@/components/agent/agent-composer";
import { AgentComposer } from "@/components/agent/agent-composer";
import { AgentHome } from "@/components/agent/agent-home";
import { AgentRunTimeline } from "@/components/agent/agent-run-timeline";
import {
  AgentStreamProvider,
  useAgentStream,
} from "@/components/agent/agent-stream-provider";
import { AgentSuggestedActions } from "@/components/agent/agent-suggested-actions";
import { AgentChannelBadge } from "@/components/agent/alpha-badge";
import { HomeModeSwitcher } from "@/components/chat/home-mode-switcher";
import { useModelCapabilities } from "@/components/chat/input/use-model-capabilities";
import { PreviewMessage } from "@/components/chat/message";
import { useActiveChat } from "@/hooks/use-active-chat";
import type { AgentRunHistoryPayload } from "@/hooks/use-agent-chat";
import { type AgentRequestOptions, useAgentChat } from "@/hooks/use-agent-chat";
import { useAgentFlags } from "@/hooks/use-agent-flags";
import { extractChatIdFromPath, useAgentMode } from "@/hooks/use-agent-mode";
import { useAgentModels } from "@/hooks/use-agent-models";
import { type ProjectLite, useProjects } from "@/hooks/use-projects";
import { AGENT_COMPOSER_ARIA_LABEL } from "@/lib/agent/channel";
import type {
  AgentRunRecord,
  AgentRunUsage,
  AgentStepEvent,
  AgentStepRecord,
  AgentToolActivity,
  ToolExecutionRecord,
} from "@/lib/agent/types";
import { fetcher } from "@/lib/utils";

// Enveloppe de l'expérience Agent : le provider d'état de flux est monté ici,
// une seule fois, pour que le hook de conversation et la timeline partagent le
// même état.
export function AgentShell() {
  return (
    <AgentStreamProvider>
      <AgentShellInner />
    </AgentStreamProvider>
  );
}

function toStepEvent(step: AgentStepRecord): AgentStepEvent {
  return {
    index: step.index,
    runId: step.runId,
    status: step.status,
    stepId: step.id,
    summary: step.summary ?? undefined,
    title: step.title,
    type: step.type,
  };
}

function toToolActivity(execution: ToolExecutionRecord): AgentToolActivity {
  return {
    attempt: execution.attempt ?? 1,
    category: execution.category,
    durationMs: execution.durationMs ?? undefined,
    errorCategory: execution.errorCategory ?? null,
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

function AgentShellInner() {
  const pathname = usePathname();
  const router = useRouter();
  const isNewChat = !extractChatIdFromPath(pathname);
  const { setMode } = useAgentMode();

  const { chatId, currentModelId, setCurrentModelId, visibilityType } =
    useActiveChat();
  const { flags, channelInfo } = useAgentFlags();
  const { capabilities: modelsCapabilities, models } = useAgentModels();
  const { currentCapabilities } = useModelCapabilities(currentModelId);
  const { reset, state } = useAgentStream();

  const [project, setProject] = useState<ProjectLite | null>(null);
  const [options, setOptions] = useState<AgentRequestOptions>({
    autonomy: "standard",
    enabledCategories: null,
    projectId: null,
    reasoningLevel: "medium",
    toolMode: "auto",
  });

  // Hydratation du projet depuis la conversation persistée : la vérité est en
  // base (chat.projectId), jamais dans un état React initialisé à null. Le
  // premier envoi transmet projectId ; les suivants ne perdent jamais une
  // association déjà enregistrée ni un changement explicite de l'utilisateur.
  const { data: chatRecord } = useSWR<{ projectId: string | null }>(
    isNewChat
      ? null
      : `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/chats/${chatId}`,
    fetcher,
    { revalidateOnFocus: false }
  );
  const hydratedProjectIdRef = useRef<string | null | undefined>(undefined);
  const { projects: allProjects } = useProjects();
  useEffect(() => {
    if (!chatRecord || hydratedProjectIdRef.current !== undefined) {
      return;
    }
    const storedProjectId = chatRecord.projectId ?? null;
    hydratedProjectIdRef.current = storedProjectId;
    if (!storedProjectId) {
      return;
    }
    // Ne pas conserver silencieusement un projet supprimé ou inaccessible :
    // si la liste ne le connaît pas, l'association est retirée côté serveur.
    const known = allProjects.find((p) => p.id === storedProjectId);
    if (known) {
      setProject(known);
      setOptions((current) => ({ ...current, projectId: known.id }));
    } else if (allProjects.length > 0) {
      fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/chats/${chatId}`, {
        body: JSON.stringify({ projectId: null }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      }).catch(() => {});
    }
  }, [allProjects, chatRecord, chatId]);

  const {
    addToolApprovalResponse,
    isLoading,
    messages,
    regenerate,
    sendTask,
    setMessages,
    status,
    stopRun,
    submitUserInputAnswer,
  } = useAgentChat({
    chatId,
    isNewChat,
    modelId: currentModelId,
    visibility: visibilityType,
  });

  // Reprise après refresh : la vérité est côté serveur (AgentRun / AgentStep /
  // ToolExecution). On hydrate la timeline depuis l'API, jamais depuis le flux.
  // La clé SWR est aussi revalidée en fin de run : les actions suggérées
  // persistées côté serveur apparaissent après la fin du flux.
  const runsHistoryKey = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/agent/runs?chatId=${chatId}`;
  const { data: history, mutate: mutateHistory } =
    useSWR<AgentRunHistoryPayload>(isNewChat ? null : runsHistoryKey, fetcher, {
      revalidateOnFocus: false,
    });
  const suggestedActions = useMemo(() => {
    if (!history?.suggestedActions) {
      return [] as {
        id: string;
        label: string;
        payload: Record<string, unknown>;
      }[];
    }
    const runs = (history.runs ?? []) as { id: string }[];
    const lastRun = runs.at(-1);
    if (!lastRun) {
      return [];
    }
    return (
      history.suggestedActions[lastRun.id] ??
      ([] as { id: string; label: string; payload: Record<string, unknown> }[])
    );
  }, [history]);

  const hydratedRunIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!history || state.run) {
      return;
    }
    const runs = (history.runs ?? []) as AgentRunRecord[];
    const lastRun = runs.at(-1);
    if (!lastRun || hydratedRunIdRef.current === lastRun.id) {
      return;
    }
    hydratedRunIdRef.current = lastRun.id;
    const runUsage = (lastRun as { usage?: AgentRunUsage }).usage ?? {};
    reset({
      artifacts: [],
      plan: lastRun.plan ?? null,
      run: {
        durationMs:
          runUsage.durationMs ??
          (lastRun.startedAt && lastRun.completedAt
            ? new Date(lastRun.completedAt).getTime() -
              new Date(lastRun.startedAt).getTime()
            : undefined),
        error: lastRun.error,
        inputTokens: runUsage.inputTokens,
        model: lastRun.model,
        outputTokens: runUsage.outputTokens,
        reasoningLevel: lastRun.reasoningLevel,
        runId: lastRun.id,
        status: lastRun.status,
        stepCount: lastRun.stepCount,
        toolCallCount: lastRun.toolCallCount,
        totalTokens: runUsage.totalTokens,
      },
      sources: [],
      steps: (history.steps ?? [])
        .filter((step) => step.runId === lastRun.id)
        .map(toStepEvent),
      tools: (history.executions ?? [])
        .filter((execution) => execution.runId === lastRun.id)
        .map(toToolActivity),
    });
  }, [history, reset, state.run]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollKey = `${messages.length}:${state.steps.length}`;
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }
    // `scrollKey` est le signal de défilement : nouveaux messages ou nouvelles
    // étapes. On suit le contenu, jamais l'inverse.
    const shouldFollow = scrollKey.length > 0;
    if (shouldFollow) {
      element.scrollTop = element.scrollHeight;
    }
  }, [scrollKey]);

  const capabilities = useMemo(
    () => modelsCapabilities[currentModelId] ?? currentCapabilities,
    [currentCapabilities, currentModelId, modelsCapabilities]
  );

  const handleOptionsChange = (patch: Partial<AgentRequestOptions>) => {
    setOptions((current) => ({ ...current, ...patch }));
  };

  const handleSubmit = (payload: AgentComposerSubmit) => {
    setOptions(payload.options);
    sendTask({
      attachments: payload.attachments,
      options: payload.options,
      text: payload.text,
    });
  };

  const isRunning = status === "streaming" || status === "submitted";
  const showHome =
    messages.length === 0 && !isRunning && state.steps.length === 0;

  const composer = (
    <AgentComposer
      capabilities={capabilities}
      flags={flags}
      isRunning={isRunning}
      modelId={currentModelId}
      models={models}
      onModelChange={setCurrentModelId}
      onOptionsChange={handleOptionsChange}
      onProjectChange={(next) => {
        setProject(next);
        handleOptionsChange({ projectId: next?.id ?? null });
        // Changement explicite : persisté immédiatement sur une conversation
        // existante, pour survivre à un envoi raté, un refresh ou un retour.
        if (!isNewChat) {
          fetch(
            `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/chats/${chatId}`,
            {
              body: JSON.stringify({ projectId: next?.id ?? null }),
              headers: { "Content-Type": "application/json" },
              method: "PATCH",
            }
          )
            .then((response) => {
              if (!response.ok) {
                throw new Error(String(response.status));
              }
            })
            .catch(() => {
              // L'association reste appliquée localement ; le prochain envoi
              // retransmettra projectId et rattrapera l'état serveur.
            });
        }
      }}
      onStop={stopRun}
      onSubmit={handleSubmit}
      options={options}
      placeholder={
        showHome ? undefined : "Précisez, ajustez ou poursuivez la tâche"
      }
      project={project}
    />
  );

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-background">
      {/* Le sélecteur Chat | Agent n'est plus dans l'en-tête Agent : il vit
          désormais dans la pile d'accueil (HomeModeSwitcher), au même endroit
          exactement que sur l'accueil Chat. L'en-tête ne porte plus que
          l'identité de canal. */}
      <header className="flex shrink-0 items-center justify-end gap-2 border-b border-border/40 px-3 py-2 md:px-5">
        <div className="flex items-center gap-2">
          <AgentChannelBadge channel={channelInfo.channel} />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        <div
          aria-busy={isRunning}
          aria-label={AGENT_COMPOSER_ARIA_LABEL}
          className="min-h-0 flex-1 overflow-y-auto"
          ref={scrollRef}
        >
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-3 py-5 md:px-4">
            {showHome ? null : (
              <>
                <AgentRunTimeline state={state} />
                {!isRunning && suggestedActions.length > 0 ? (
                  <AgentSuggestedActions
                    actions={suggestedActions}
                    runId={state.run?.runId ?? ""}
                  />
                ) : null}
                {messages.map((message, index) => (
                  <PreviewMessage
                    addToolApprovalResponse={addToolApprovalResponse}
                    chatId={chatId}
                    isLoading={
                      status === "streaming" && index === messages.length - 1
                    }
                    isReadonly={false}
                    key={message.id}
                    message={message}
                    regenerate={regenerate}
                    requiresScrollPadding={false}
                    setMessages={setMessages}
                    submitUserInputAnswer={submitUserInputAnswer}
                    vote={undefined}
                  />
                ))}
                {isLoading ? (
                  <p className="text-xs text-muted-foreground">
                    Chargement de la conversation…
                  </p>
                ) : null}
              </>
            )}
          </div>

          {showHome ? (
            <div className="flex min-h-full flex-col">
              <AgentHome
                capabilities={capabilities}
                flags={flags}
                isRunning={isRunning}
                modelId={currentModelId}
                models={models}
                modeSwitcher={
                  <HomeModeSwitcher
                    mode="agent"
                    onModeChange={(next) => {
                      setMode(next);
                      if (next === "chat" && !isNewChat) {
                        router.push("/");
                      }
                    }}
                  />
                }
                onModelChange={setCurrentModelId}
                onOptionsChange={handleOptionsChange}
                onProjectChange={(next) => {
                  setProject(next);
                  handleOptionsChange({ projectId: next?.id ?? null });
                }}
                onStop={stopRun}
                onSubmit={handleSubmit}
                options={options}
                project={project}
              />
            </div>
          ) : null}
        </div>

        {showHome ? null : (
          <div className="sticky bottom-0 z-30 shrink-0 border-t border-border/10 bg-background px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] md:px-4">
            <div className="mx-auto w-full max-w-3xl">{composer}</div>
          </div>
        )}
      </div>
    </div>
  );
}
