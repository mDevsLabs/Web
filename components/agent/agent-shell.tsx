"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import type { AgentComposerSubmit } from "@/components/agent/agent-composer";
import { AgentComposer } from "@/components/agent/agent-composer";
import { AgentHome } from "@/components/agent/agent-home";
import { AgentModeSwitcher } from "@/components/agent/agent-mode-switcher";
import { AgentRunTimeline } from "@/components/agent/agent-run-timeline";
import {
  AgentStreamProvider,
  useAgentStream,
} from "@/components/agent/agent-stream-provider";
import { AgentChannelBadge } from "@/components/agent/alpha-badge";
import { useModelCapabilities } from "@/components/chat/input/use-model-capabilities";
import { PreviewMessage } from "@/components/chat/message";
import { useActiveChat } from "@/hooks/use-active-chat";
import type { AgentRunHistoryPayload } from "@/hooks/use-agent-chat";
import { type AgentRequestOptions, useAgentChat } from "@/hooks/use-agent-chat";
import { useAgentFlags } from "@/hooks/use-agent-flags";
import { extractChatIdFromPath, useAgentMode } from "@/hooks/use-agent-mode";
import { useAgentModels } from "@/hooks/use-agent-models";
import type { ProjectLite } from "@/hooks/use-projects";
import { AGENT_COMPOSER_ARIA_LABEL } from "@/lib/agent/channel";
import type {
  AgentRunRecord,
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

  const {
    addToolApprovalResponse,
    isLoading,
    messages,
    regenerate,
    sendTask,
    setMessages,
    status,
    stopRun,
  } = useAgentChat({
    chatId,
    isNewChat,
    modelId: currentModelId,
    visibility: visibilityType,
  });

  // Reprise après refresh : la vérité est côté serveur (AgentRun / AgentStep /
  // ToolExecution). On hydrate la timeline depuis l'API, jamais depuis le flux.
  const { data: history } = useSWR<AgentRunHistoryPayload>(
    isNewChat
      ? null
      : `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/agent/runs?chatId=${chatId}`,
    fetcher,
    { revalidateOnFocus: false }
  );

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
    reset({
      artifacts: [],
      plan: lastRun.plan ?? null,
      run: {
        model: lastRun.model,
        reasoningLevel: lastRun.reasoningLevel,
        runId: lastRun.id,
        status: lastRun.status,
        stepCount: lastRun.stepCount,
        toolCallCount: lastRun.toolCallCount,
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
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border/40 px-3 py-2 md:px-5">
        <AgentModeSwitcher
          mode="agent"
          onModeChange={(next) => {
            setMode(next);
            if (next === "chat" && !isNewChat) {
              router.push("/");
            }
          }}
          size="sm"
        />
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
