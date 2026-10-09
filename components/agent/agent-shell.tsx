"use client";

import { AlertTriangleIcon, PanelLeftIcon } from "@mdevs/icons";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import type { AgentComposerSubmit } from "@/components/agent/agent-composer";
import { AgentComposer } from "@/components/agent/agent-composer";
import { AgentHome } from "@/components/agent/agent-home";
import { AgentRunErrorBoundary } from "@/components/agent/agent-run-error-boundary";
import { AgentRunFeedback } from "@/components/agent/agent-run-feedback";
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
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { useActiveChat } from "@/hooks/use-active-chat";
import type { AgentRunHistoryPayload } from "@/hooks/use-agent-chat";
import { type AgentRequestOptions, useAgentChat } from "@/hooks/use-agent-chat";
import { useAgentFlags } from "@/hooks/use-agent-flags";
import { extractChatIdFromPath, useAgentMode } from "@/hooks/use-agent-mode";
import { useAgentModels } from "@/hooks/use-agent-models";
import { useAgentSettings } from "@/hooks/use-agent-settings";
import { type ProjectLite, useProjects } from "@/hooks/use-projects";
import { useSharedDraft } from "@/hooks/use-shared-draft";
import { AGENT_COMPOSER_ARIA_LABEL } from "@/lib/agent/channel";
import { shouldShowAgentHome } from "@/lib/agent/timeline-visibility";
import type {
  AgentRunRecord,
  AgentRunUsage,
  AgentStepEvent,
  AgentStepRecord,
  AgentToolActivity,
  ToolExecutionRecord,
} from "@/lib/agent/types";
import { normalizeReasoningLevel } from "@/lib/ai/registry/reasoning";
import { downloadChatAsMarkdown } from "@/lib/chat/export-markdown";
import { apiEndpoints, pagePath } from "@/lib/client/api-endpoints";
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
  const { requestPreserveDraft } = useSharedDraft();

  const {
    activeAgent,
    chatId,
    currentModelId,
    resetChat,
    resetEpoch,
    setCurrentModelId,
    visibilityType,
  } = useActiveChat();
  const { flags, channelInfo } = useAgentFlags();
  // Le mode Agent remplace tout le contenu de ChatShell, en-tête compris : il
  // porte donc son propre accès à la navigation. `isMobile` sert à ne pas
  // afficher un bouton d'en-tête de 44px au doigt sur desktop, ni l'inverse.
  const { isMobile, state: sidebarState, toggleSidebar } = useSidebar();
  const isCollapsedDesktop = sidebarState === "collapsed" && !isMobile;
  const {
    capabilities: modelsCapabilities,
    catalogModelIds,
    isLoading: isLoadingModels,
    models,
  } = useAgentModels();
  const { currentCapabilities, currentEntry } =
    useModelCapabilities(currentModelId);
  const { reset, state } = useAgentStream();

  const currentModelIsAgentCompatible = Boolean(
    currentEntry?.capabilities.tools &&
      currentEntry.agentCompatibility?.toolDefinitions &&
      currentEntry.agentCompatibility?.structuredToolCalls &&
      currentEntry.agentCompatibility?.continuationAfterToolResult
  );

  // Le cookie peut contenir un modèle qui n'existe plus. Une fois le catalogue
  // chargé, on synchronise seulement les IDs invalides ; un modèle Chat
  // incompatible reste visible et l'utilisateur peut le changer lui-même.
  useEffect(() => {
    if (
      !isLoadingModels &&
      catalogModelIds.size > 0 &&
      !catalogModelIds.has(currentModelId) &&
      models.length > 0
    ) {
      setCurrentModelId(models[0].id);
    }
  }, [
    catalogModelIds,
    currentModelId,
    isLoadingModels,
    models,
    setCurrentModelId,
  ]);

  const [project, setProject] = useState<ProjectLite | null>(null);
  const [options, setOptions] = useState<AgentRequestOptions>({
    // La persona suit la sélection globale partagée avec le Chat : un seul et
    // même « assistant actif » dans les deux modes, une seule source de vérité.
    assistantId: activeAgent?.id ?? null,
    audioEnabled: false,
    enabledCategories: null,
    forceWeb: false,
    imageEnabled: false,
    mcpServerIds: [],
    memoryEnabled: false,
    projectId: null,
    // Aucun choix tant que l'utilisateur n'a pas bougé le sélecteur : le niveau
    // par défaut est celui du compte, appliqué par le serveur.
    reasoningLevel: null,
    skillId: null,
    skillParams: null,
    tasksEnabled: false,
    toolMode: "auto",
  });

  // Réflexion : le niveau du compte sert de référence d'affichage tant que
  // l'utilisateur n'a pas choisi dans le composer. Il ne remplace jamais le
  // choix de session — il évite seulement que le sélecteur annonce une valeur
  // que le serveur n'appliquera pas. Tant que le payload n'est pas arrivé,
  // `normalizeReasoningLevel` retombe sur la même valeur que le serveur
  // (colonne NOT NULL à « medium »), donc aucun clignotement trompeur.
  const { data: agentSettings } = useAgentSettings();
  const defaultReasoningLevel = normalizeReasoningLevel(
    agentSettings?.settings.reasoningLevel
  );

  // `handleSubmit` remplace l'objet d'options en entier : sans cette
  // synchronisation, la persona choisie au composer disparaîtrait dès le
  // premier envoi. L'écriture est conditionnée pour ne pas créer de boucle
  // quand la sélection n'a pas bougé.
  const activeAgentId = activeAgent?.id ?? null;
  useEffect(() => {
    setOptions((current) =>
      current.assistantId === activeAgentId
        ? current
        : { ...current, assistantId: activeAgentId }
    );
  }, [activeAgentId]);

  // Hydratation du projet depuis la conversation persistée : la vérité est en
  // base (chat.projectId), jamais dans un état React initialisé à null. Le
  // premier envoi transmet projectId ; les suivants ne perdent jamais une
  // association déjà enregistrée ni un changement explicite de l'utilisateur.
  const { data: chatRecord } = useSWR<{ projectId: string | null }>(
    isNewChat ? null : apiEndpoints.chatById(chatId),
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
      fetch(apiEndpoints.chatById(chatId), {
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
    onModelResolved: setCurrentModelId,
    visibility: visibilityType,
  });
  const [resumeFromRunId, setResumeFromRunId] = useState<string | null>(null);

  // Reprise après refresh : la vérité est côté serveur (AgentRun / AgentStep /
  // ToolExecution). On hydrate la timeline depuis l'API, jamais depuis le flux.
  // La clé SWR est aussi revalidée en fin de run : les actions suggérées
  // persistées côté serveur apparaissent après la fin du flux.
  const runsHistoryKey = apiEndpoints.agentRunsForChat(chatId);
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
    // Après un refresh, l'option « Tâches » est relue depuis AgentRun : sans
    // elle, un plan resterait invisible même si l'utilisateur l'avait demandée.
    const tasksEnabled = lastRun.tasksEnabled === true;
    reset({
      artifacts: [],
      plan: tasksEnabled ? (lastRun.plan ?? null) : null,
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
        reasoningTokens: runUsage.reasoningTokens,
        runId: lastRun.id,
        status: lastRun.status,
        stepCount: lastRun.stepCount,
        tasksEnabled,
        toolCallCount: lastRun.toolCallCount,
        totalTokens: runUsage.totalTokens,
      },
      sources: [],
      steps: (history.steps ?? [])
        .filter((step) => step.runId === lastRun.id)
        .map(toStepEvent),
      tasksEnabled,
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
      resumeFromRunId: resumeFromRunId ?? undefined,
      text: payload.text,
    });
    setResumeFromRunId(null);
  };

  const isRunning = status === "streaming" || status === "submitted";

  // « Nouvelle discussion » (barre latérale) ne réinitialise que l'état Chat :
  // l'AgentStreamProvider est monté plus bas que le sidebar, il n'était donc
  // jamais vidé. Sans ce reset, `state.steps` restait peuplé après le retour à
  // `/`, `showHome` restait faux et l'accueil Agent ne s'affichait jamais.
  //
  // Le run en cours est arrêté en même temps : sans cela le flux continuait
  // d'alimenter `state.steps` et l'écran restait bloqué sur la timeline.
  //
  // L'hydratation depuis l'historique (effet suivant) ne peut pas ressusciter
  // l'ancienne conversation : `hydratedRunIdRef` retient déjà l'ID du dernier
  // run hydraté, et la clé SWR passe à null dès que le pathname redevient `/`.
  const lastHandledResetEpochRef = useRef(resetEpoch);
  useEffect(() => {
    if (lastHandledResetEpochRef.current === resetEpoch) {
      return;
    }
    lastHandledResetEpochRef.current = resetEpoch;
    if (isRunning) {
      void stopRun();
    }
    reset();
    setResumeFromRunId(null);
  }, [isRunning, reset, resetEpoch, stopRun]);

  // Hydratation de la conversation : le fetch /api/messages est-il encore en
  // cours ET l'agent est-il inerte ? Un run actif prime toujours — pendant une
  // génération, la conversation est déjà là, et « Chargement » s'affichait
  // par-dessus, à chaque révalidation, alors que l'agent travaillait.
  const isHydrating = isLoading && !isRunning;
  const showHome = shouldShowAgentHome({
    isHydrating,
    messageCount: messages.length,
    stepCount: state.steps.length,
  });

  const modelCompatibilityWarning =
    currentEntry && !currentModelIsAgentCompatible ? (
      <div
        className="mb-2 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-5 text-amber-900 dark:text-amber-200"
        role="status"
      >
        <AlertTriangleIcon className="mt-0.5 size-3.5 shrink-0" />
        <span>
          Ce modèle ne peut pas exécuter la boucle d&apos;outils Agent.
          Choisissez un modèle compatible pour envoyer une nouvelle tâche.
        </span>
      </div>
    ) : null;

  // Effets de bord que le composer ne peut pas faire lui-même : il ne connaît
  // ni l'export de conversation ni le reset global. Le reset est celui de
  // « Nouvelle discussion » — le même qui vide la timeline via resetEpoch, donc
  // pas de second chemin à maintenir.
  const slashSideEffects = useMemo(
    () => ({
      exportMarkdown: () => {
        if (isNewChat) {
          toast.info("Rien à exporter : la conversation est vide.");
          return;
        }
        downloadChatAsMarkdown(chatId);
      },
      resetConversation: () => {
        resetChat();
        router.push(pagePath("/"));
      },
    }),
    [chatId, isNewChat, resetChat, router]
  );

  const composer = (
    <>
      {modelCompatibilityWarning}
      <AgentComposer
        capabilities={capabilities}
        defaultReasoningLevel={defaultReasoningLevel}
        flags={flags}
        isRunning={isRunning}
        modelId={currentModelId}
        modelIsCompatible={currentModelIsAgentCompatible || !currentEntry}
        models={models}
        onModelChange={setCurrentModelId}
        onOptionsChange={handleOptionsChange}
        onProjectChange={(next) => {
          setProject(next);
          handleOptionsChange({ projectId: next?.id ?? null });
          // Changement explicite : persisté immédiatement sur une conversation
          // existante, pour survivre à un envoi raté, un refresh ou un retour.
          if (!isNewChat) {
            fetch(apiEndpoints.chatById(chatId), {
              body: JSON.stringify({ projectId: next?.id ?? null }),
              headers: { "Content-Type": "application/json" },
              method: "PATCH",
            })
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
        onSlashSideEffect={slashSideEffects}
        onStop={stopRun}
        onSubmit={handleSubmit}
        options={options}
        placeholder={
          showHome ? undefined : "Précisez, ajustez ou poursuivez la tâche"
        }
        project={project}
      />
    </>
  );

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-background">
      {/* Le sélecteur Chat | Agent n'est plus dans l'en-tête Agent : il vit
          désormais dans la pile d'accueil (HomeModeSwitcher), au même endroit
          exactement que sur l'accueil Chat. L'en-tête ne porte que
          l'identité de canal et l'accès à la navigation.

          Le déclencheur du tiroir est reproduit ici parce que `ChatShell`
          remplace son contenu en mode Agent : sans lui, `ChatHeader` n'est jamais
          rendu et la barre latérale devient inatteignable — sur mobile, on n'avait
          plus ni historique, ni nouveau chat, ni réglages. Même code que
          `chat-header.tsx` : deux boutons distincts, car un en-tête de 44px ne
          doit pas être un bouton de 28px sur desktop. */}
      <header className="flex h-[calc(env(safe-area-inset-top)+2.75rem)] shrink-0 items-center justify-between gap-2 border-b border-border/40 px-3 pt-[env(safe-area-inset-top)] md:px-5">
        {isCollapsedDesktop ? (
          <Button
            aria-label="Ouvrir la navigation"
            className="-ml-1"
            data-testid="agent-nav-toggle"
            onClick={toggleSidebar}
            size="icon-sm"
            variant="ghost"
          >
            <PanelLeftIcon className="size-4" />
          </Button>
        ) : (
          <Button
            aria-label="Ouvrir la navigation"
            className="-ml-1 h-11 w-11 md:hidden"
            data-testid="agent-nav-toggle"
            onClick={toggleSidebar}
            size="icon-sm"
            variant="ghost"
          >
            <PanelLeftIcon className="size-5" />
          </Button>
        )}

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
                {/* La zone d'exécution est la seule partie réellement exposée
                    (icônes choisies par clé, listes, dialogue). Elle est
                    encapsulée pour qu'un défaut d'affichage ne jette plus la
                    conversation, le compositeur et l'historique avec. */}
                <AgentRunErrorBoundary runId={state.run?.runId ?? null}>
                  <AgentRunTimeline state={state} />
                </AgentRunErrorBoundary>
                {flags["agent.activity"] &&
                state.run &&
                ["completed", "failed", "cancelled", "timed_out"].includes(
                  state.run.status
                ) ? (
                  <AgentRunFeedback
                    goalReached={
                      (
                        (history?.runs ?? []).find(
                          (run) => run.id === state.run?.runId
                        ) as { goalReached?: boolean | null } | undefined
                      )?.goalReached ?? null
                    }
                    key={state.run.runId}
                    runId={state.run.runId}
                    useful={
                      (
                        (history?.runs ?? []).find(
                          (run) => run.id === state.run?.runId
                        ) as { useful?: boolean | null } | undefined
                      )?.useful ?? null
                    }
                  />
                ) : null}
                {flags["agent.guidedResume"] &&
                !isRunning &&
                state.run?.status === "timed_out" ? (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
                    <p>
                      Le délai est dépassé. Vous pouvez poursuivre dans un
                      nouveau run lié à celui-ci.
                    </p>
                    <button
                      className="mt-2 rounded-md bg-primary px-3 py-1.5 text-primary-foreground"
                      onClick={() =>
                        setResumeFromRunId(state.run?.runId ?? null)
                      }
                      type="button"
                    >
                      Poursuivre
                    </button>
                    {resumeFromRunId ? (
                      <p className="mt-2 text-xs">
                        Ajoutez votre consigne dans la zone de saisie, puis
                        envoyez-la.
                      </p>
                    ) : null}
                  </div>
                ) : null}
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
                {isHydrating && messages.length === 0 ? (
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
                modelCompatibilityKnown={Boolean(currentEntry)}
                modelId={currentModelId}
                modelIsCompatible={currentModelIsAgentCompatible}
                models={models}
                modeSwitcher={
                  <HomeModeSwitcher
                    mode="agent"
                    onModeChange={(next) => {
                      // Le `router.push("/")` ci-dessous change de `chatId`,
                      // ce qui déclencherait les deux effets de purge du
                      // brouillon. On le déclare à l'avance : ce changement de
                      // `chatId` est une bascule de mode, pas un changement de
                      // conversation, et le prompt saisi doit survivre au
                      // retour en mode Chat. Voir hooks/use-shared-draft.tsx.
                      if (next === "chat" && !isNewChat) {
                        requestPreserveDraft();
                      }
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
                onSlashSideEffect={slashSideEffects}
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
