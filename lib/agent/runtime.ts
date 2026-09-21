import "server-only";

import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
  type LanguageModel,
  streamText,
  toUIMessageStream,
} from "ai";
import { recordAgentUsage } from "@/lib/agent/accounting";
import type { AgentContextResult } from "@/lib/agent/context/build";
import {
  type AgentEventWriter,
  emitAgentPlan,
  emitAgentRun,
} from "@/lib/agent/events";
import {
  type AgentBusinessEvent,
  emitAgentBusinessEvent,
} from "@/lib/agent/events/business";
import type { AgentFlags } from "@/lib/agent/flags";
import {
  type AgentRunClock,
  accumulatedActiveMs,
  closeActivity,
  type DurationCheckpoint,
  emptyDurationCheckpoint,
  openActivity,
  shouldStopAtSafePoint,
  systemClock,
} from "@/lib/agent/limits";
import { persistAgentRunMessages } from "@/lib/agent/persist";
import { applyPlanProgress } from "@/lib/agent/plan";
import { takePendingReorientations } from "@/lib/agent/reorientation/service";
import {
  deriveSuggestedActions,
  validateDerivedActions,
} from "@/lib/agent/suggested-actions/derive";
import {
  type AgentToolControllerState,
  createAgentToolController,
} from "@/lib/agent/tool-controller";
import { toProviderTools } from "@/lib/agent/tools/adapters/provider";
import type {
  AgentExecutionBudget,
  AgentPlan,
  AgentRunStatus,
  ReasoningLevel,
  RegisteredAgentTool,
} from "@/lib/agent/types";
import { resolveReasoningProviderOptions } from "@/lib/ai/registry/reasoning";
import {
  getStreamContext,
  isModelStreamActivity,
} from "@/lib/chat/stream-context";
import { saveAgentRunCheckpoint } from "@/lib/db/agent-foundation-queries";
import {
  bumpAgentRunCounters,
  createAgentStep,
  setAgentRunPlan,
  setAgentRunSuggestedActions,
  setAgentRunUsage,
  updateAgentRunStatus,
} from "@/lib/db/agent-queries";
import { expireAgentUserInputsForRun } from "@/lib/db/agent-user-input-queries";
import type { ChatMessage } from "@/lib/types";
import { generateUUID } from "@/lib/utils";

// Runtime Agent : une boucle de tool calling standard, portée par les primitives
// du SDK AI — streamText multi-steps (stopWhen), sélection d'outils par étape
// (prepareStep), fin d'étape (onStepEnd), approbations signées (toolApproval) et
// sources natives. Aucune orchestration propriétaire, aucune infrastructure
// distante : seulement des messages, des outils, du streaming et la base.

export type AgentStreamParams = {
  abortSignal?: AbortSignal;
  approvalRequiredToolIds: string[];
  budget: AgentExecutionBudget;
  chatId: string;
  // Checkpoint persisté du run (reprise / ticks successifs) : la limite
  // produit s'appuie dessus, jamais sur un compteur local remis à zéro.
  checkpoint?: DurationCheckpoint | null;
  context: AgentContextResult;
  existingMessages: ChatMessage[];
  firstUserMessageForTitle: ChatMessage | null;
  flags: AgentFlags;
  isContinuation: boolean;
  model: LanguageModel;
  modelId: string;
  plan: AgentPlan | null;
  projectId: string | null;
  reasoningLevel: ReasoningLevel;
  revision?: number;
  runId: string;
  sessionToken: string;
  shouldRenameAfterFirst: boolean;
  // Transport des parts de raisonnement : activé uniquement quand le modèle
  // déclare la capacité (capabilities.reasoning). Le SDK ne fabrique jamais de
  // chain-of-thought : seuls les parts explicitement fournis par le provider
  // pour affichage transitent — le même protocole que le Chat.
  sendReasoning: boolean;
  // Indice de départ des étapes : sur une reprise (réponse, approbation), les
  // nouvelles étapes s'ajoutent à la suite au lieu de repartir de 0.
  startStepIndex?: number;
  // Nombre d'appels d'outils déjà consommés par les invocations précédentes du
  // même run : sans cette baseline, le budget d'outils repartait de zéro à
  // chaque reprise (approbation, réponse utilisateur, continuation).
  startToolCallCount?: number;
  startedAt: number;
  task: string;
  tools: RegisteredAgentTool[];
  userEmail: string;
  userId: string;
};

/**
 * Compose les instructions système en y ajoutant les réorientations demandées
 * par l'utilisateur pendant le run. Exporté pour être testé directement.
 */
export function composeAgentInstructions(
  base: string,
  reorientations: readonly string[]
): string {
  if (reorientations.length === 0) {
    return base;
  }
  return `${base}\n\nCONSIGNES DE RÉORIENTATION DE L'UTILISATEUR (à prendre en compte maintenant, par ordre d'arrivée) :\n${reorientations.map((text) => `- ${text}`).join("\n")}`;
}

export function createAgentStream(params: AgentStreamParams) {
  return createUIMessageStream({
    execute: async ({ writer }) => {
      const state: AgentToolControllerState = {
        approvalRequiredToolIds: params.approvalRequiredToolIds,
        lastErrorCategory: null,
        producedArtifact: false,
        sources: [],
        stepIndex: params.startStepIndex ?? 0,
        toolCallCount: params.startToolCallCount ?? 0,
        waitingForApproval: false,
        waitingForUser: false,
      };
      let plan = params.plan;
      let aborted = false;
      let failure: string | null = null;
      let accountingStarted = false;
      let productLimitReached = false;
      // Horloge injectable + checkpoint persisté : la limite produit s'appuie
      // sur le temps d'ACTIVITÉ cumulé du run, à travers toutes ses invocations.
      const clock: AgentRunClock = systemClock();
      let revision = params.revision ?? 0;
      let duration = openActivity(
        params.checkpoint ?? emptyDurationCheckpoint(),
        clock
      );
      let usageTotals: {
        inputTokens?: number;
        outputTokens?: number;
        totalTokens?: number;
      } = {};
      // Réorientations appliquées aux points sûrs : réinjectées au modèle via
      // le contexte du prochain appel (message système de fin).
      const pendingReorientations: string[] = [];
      // Nombre de réorientations déjà transmises au modèle : évite de les
      // réinjecter à chaque étape tout en garantissant qu'elles le sont AVANT
      // l'appel suivant.
      let injectedReorientations = 0;

      // Persistance du checkpoint (révision optimiste). Un échec n'interrompt
      // jamais le run : au pire, la limite est réévaluée depuis le dernier
      // checkpoint connu.
      const persistCheckpoint = async () => {
        const saved = await saveAgentRunCheckpoint({
          checkpoint: {
            duration,
            instructionsPending: 0,
            lastStepIndex: state.stepIndex,
            toolSelectionSignature: null,
          },
          expectedRevision: revision,
          id: params.runId,
        }).catch(() => false);
        if (saved) {
          revision += 1;
        }
        return saved;
      };

      const emitBusiness = (event: AgentBusinessEvent) => {
        emitAgentBusinessEvent(event);
      };

      const emitRun = (
        status: AgentRunStatus,
        extra: {
          durationMs?: number;
          error?: string;
          inputTokens?: number;
          outputTokens?: number;
          stepCount?: number;
          toolCallCount?: number;
          totalTokens?: number;
        } = {}
      ) => {
        emitAgentRun(writer, {
          model: params.modelId,
          reasoningLevel: params.reasoningLevel,
          runId: params.runId,
          status,
          stepCount: extra.stepCount ?? state.stepIndex,
          toolCallCount: extra.toolCallCount ?? state.toolCallCount,
          ...(extra.durationMs === undefined
            ? {}
            : { durationMs: extra.durationMs }),
          ...(extra.error === undefined ? {} : { error: extra.error }),
          ...(extra.inputTokens === undefined
            ? {}
            : { inputTokens: extra.inputTokens }),
          ...(extra.outputTokens === undefined
            ? {}
            : { outputTokens: extra.outputTokens }),
          ...(extra.totalTokens === undefined
            ? {}
            : { totalTokens: extra.totalTokens }),
        });
      };

      emitRun("running");
      if (plan) {
        emitAgentPlan(writer, plan);
      }
      // Un run n'est annoncé qu'une fois : une reprise (approbation, question)
      // avance le MÊME run et ne redéclenche pas l'événement de démarrage.
      if (!params.isContinuation) {
        emitBusiness({
          chatId: params.chatId,
          model: params.modelId,
          runId: params.runId,
          type: "run_started",
        });
      }
      await persistCheckpoint();

      const controller = createAgentToolController({
        approvalRequiredToolIds: params.approvalRequiredToolIds,
        base: {
          chatId: params.chatId,
          projectId: params.projectId,
          sessionToken: params.sessionToken,
          signal: params.abortSignal,
          userEmail: params.userEmail,
          userId: params.userId,
        },
        maxToolAttempts: Math.max(1, params.budget.maxRetries + 1),
        onPlanProgress: ({ status, title }) => {
          if (!plan) {
            return;
          }
          plan = applyPlanProgress({ plan: plan as AgentPlan, status, title });
          emitAgentPlan(writer, plan);
          setAgentRunPlan({ id: params.runId, plan }).catch(() => {});
        },
        runId: params.runId,
        state,
        writer,
      });

      // L'approbation est une décision serveur persistée : elle est branchée
      // par outil via `needsApproval` dans l'adaptateur, jamais par un secret
      // d'approbation côté SDK (qui ne survivrait pas à un refresh).
      const tools = toProviderTools({
        approvalRequiredToolIds: params.approvalRequiredToolIds,
        controller,
        tools: params.tools,
      });
      const providerOptions = resolveReasoningProviderOptions(
        params.modelId,
        params.reasoningLevel
      );

      // Interruption réelle : une réorientation « arrête-toi » doit couper la
      // génération en cours, pas seulement changer un état local. Le
      // contrôleur interne est chaîné au signal de la requête HTTP.
      const internalController = new AbortController();
      if (params.abortSignal) {
        if (params.abortSignal.aborted) {
          internalController.abort();
        } else {
          params.abortSignal.addEventListener(
            "abort",
            () => internalController.abort(),
            { once: true }
          );
        }
      }
      // Baselines CUMULÉES : valeur persistée à l'entrée de cette invocation.
      const stepBaseline = state.stepIndex;
      const toolCallBaseline = state.toolCallCount;

      const result = streamText({
        abortSignal: internalController.signal,
        activeTools: params.tools.map((tool) => tool.id),
        instructions: composeAgentInstructions(
          params.context.instructions,
          pendingReorientations
        ),
        maxRetries: params.budget.maxRetries,
        messages: params.context.messages,
        model: params.model,
        onAbort: async () => {
          aborted = true;
        },
        onChunk({ chunk }) {
          if (isModelStreamActivity(chunk) && !accountingStarted) {
            accountingStarted = true;
            writer.write({
              data: {
                message: "Agent travaille…",
                modelId: params.modelId,
                modelName: params.modelId,
                phase: "thinking",
              },
              transient: true,
              type: "data-waiting-status",
            });
          }
        },
        onError: async ({ error }) => {
          failure =
            error instanceof Error
              ? error.message.slice(0, 400)
              : "Erreur inconnue du runtime Agent.";
        },
        onFinish: async ({ usage }) => {
          const totals = await recordAgentUsage({
            model: params.modelId,
            sessionToken: params.sessionToken,
            usage: usage as {
              inputTokens?: number;
              outputTokens?: number;
              totalTokens?: number;
            },
            userEmail: params.userEmail,
            userId: params.userId,
          });
          if (totals.totalTokens > 0) {
            writer.write({
              data: { tokens: totals.totalTokens, total: totals.totalTokens },
              transient: true,
              type: "data-usage",
            });
          }
          usageTotals = {
            inputTokens: totals.inputTokens,
            outputTokens: totals.outputTokens,
            totalTokens: totals.totalTokens,
          };
          await setAgentRunUsage({
            id: params.runId,
            usage: {
              durationMs: Date.now() - params.startedAt,
              inputTokens: totals.inputTokens,
              outputTokens: totals.outputTokens,
              totalTokens: totals.totalTokens,
            },
          }).catch(() => {});
        },
        onStepEnd: async (step) => {
          const stepToolCalls = step.toolCalls?.length ?? 0;
          // Télémétrie ET budget : le nombre RÉEL d'appels d'outils est
          // persisté à chaque étape (l'ancien `toolCallDelta: 0` sous-comptait
          // systématiquement) ; la valeur relue au prochain démarrage sert de
          // baseline cumulée.
          await bumpAgentRunCounters({
            id: params.runId,
            stepDelta: 1,
            toolCallDelta: stepToolCalls,
          }).catch(() => {});
          state.toolCallCount += stepToolCalls;
          // Fin d'étape = point sûr : la tranche d'activité est refermée puis
          // persistée (un crash ne perd donc pas le temps déjà consommé), et
          // une nouvelle tranche est ouverte pour la suite.
          duration = closeActivity(duration, clock);
          await persistCheckpoint();
          duration = openActivity(duration, clock);
          // Réorientations en attente : appliquées UNIQUEMENT à ce point sûr
          // (jamais au milieu d'un appel d'outil). Les instructions sont
          // ordonnées (seq), marquées appliquées côté base, et le texte est
          // réinjecté comme message système du contexte au prochain appel —
          // le flux streaming reste un reflet, jamais la source d'état.
          try {
            const reorientation = await takePendingReorientations({
              appliedStepIndex: state.stepIndex,
              runId: params.runId,
            });
            if (reorientation) {
              pendingReorientations.push(reorientation.text);
              if (reorientation.stopRequested) {
                // Interruption effective : le flux en cours est coupé, les
                // étapes suivantes ne partent pas.
                aborted = true;
                internalController.abort();
              }
            }
          } catch {
            // Une réorientation jamais appliquée reste « pending » en base :
            // elle sera retentée au point sûr suivant, sans perte.
          }
          const text = (step.text ?? "").trim();
          if (text) {
            emitRun("running");
          }
        },
        prepareStep: ({ steps }) => {
          const elapsed = clock.now() - params.startedAt;
          // Comptage CUMULÉ à travers les reprises : baseline persistée + 
          // étapes de l'invocation en cours. L'ancien calcul ne comptait que
          // `steps` (par invocation), si bien qu'une longue tâche reprise
          // plusieurs fois n'atteignait jamais son plafond.
          const toolCalls =
            toolCallBaseline +
            steps.reduce(
              (total, step) => total + (step.toolCalls?.length ?? 0),
              0
            );
          const stop = shouldStopAtSafePoint({
            checkpoint: duration,
            clock,
            productLimitMs: params.budget.productLimitMs ?? null,
          });
          if (stop.stop) {
            productLimitReached = true;
          }

          const patch: { instructions?: string; toolChoice?: "none" } = {};
          // Les réorientations lues au dernier point sûr sont injectées ICI,
          // avant la construction de l'étape suivante. Les lire seulement en
          // fin d'étape (onStepEnd) les rendait inopérantes : les instructions
          // de l'appel suivant étaient déjà figées.
          if (pendingReorientations.length > injectedReorientations) {
            patch.instructions = composeAgentInstructions(
              params.context.instructions,
              [...pendingReorientations]
            );
            injectedReorientations = pendingReorientations.length;
          }

          // Budget d'invocation ou limite produit atteinte : on interdit les
          // outils restants pour forcer une réponse finale au lieu d'une
          // coupure brutale, sans perdre les résultats déjà produits.
          if (
            stop.stop ||
            elapsed >= params.budget.maxDurationMs ||
            toolCalls >= params.budget.maxToolCalls
          ) {
            patch.toolChoice = "none";
          }

          return Object.keys(patch).length > 0 ? patch : undefined;
        },
        ...(providerOptions ? { providerOptions } : {}),
        stopWhen: ({ steps }) =>
          stepBaseline + steps.length >= params.budget.maxSteps ||
          clock.now() - params.startedAt >= params.budget.maxDurationMs ||
          shouldStopAtSafePoint({
            checkpoint: duration,
            clock,
            productLimitMs: params.budget.productLimitMs ?? null,
          }).stop,
        tools,
      });

      writer.merge(
        toUIMessageStream({
          // Protocole aligné sur le Chat : les parts de raisonnement fournis
          // par le provider (jamais fabriqués) transitent quand le modèle les
          // déclare. Sans part, l'UI n'affiche aucun panneau vide : le rendu
          // partagé (components/chat/message.tsx) ne rend que du texte
          // reasoning non vide. Les actions, outils, progression et résultats
          // restent le cœur visible d'Agent.
          sendReasoning: params.sendReasoning,
          stream: result.stream,
        })
      );

      try {
        await result.finishReason;
      } catch {
        // L'erreur a déjà été captée par onError ; on poursuit la finalisation.
      }

      // Une suspension n'est ni un échec ni une fin : le run reste actif et
      // reprendra sur la décision ou la réponse enregistrée.
      const finalStatus: AgentRunStatus = state.waitingForApproval
        ? "waiting_for_approval"
        : state.waitingForUser
          ? "waiting_for_user"
          : aborted
            ? "cancelled"
            : failure
              ? state.lastErrorCategory === "timeout"
                ? "timed_out"
                : "failed"
              : productLimitReached
                ? "timed_out"
                : "completed";

      if (finalStatus === "completed") {
        try {
          await createAgentStep({
            index: state.stepIndex,
            runId: params.runId,
            status: "completed",
            title: "Réponse finale",
            type: "message",
          });
          state.stepIndex += 1;
        } catch {
          // Un échec de persistance du step final ne doit pas invalider le run.
        }
      }

      // Le run se termine toujours sur un point sûr : la tranche d'activité est
      // refermée et le checkpoint final persisté avant l'écriture du statut.
      duration = closeActivity(duration, clock);
      await persistCheckpoint();
      const runActiveMs = accumulatedActiveMs(duration, clock);

      await updateAgentRunStatus({
        ...(finalStatus === "waiting_for_user" ||
        finalStatus === "waiting_for_approval"
          ? {}
          : { completedAt: new Date() }),
        error:
          failure ??
          (finalStatus === "timed_out" && productLimitReached
            ? "Limite de durée du forfait atteinte : le travail réalisé est conservé."
            : null),
        id: params.runId,
        status: finalStatus,
      }).catch(() => {});

      if (productLimitReached) {
        emitBusiness({
          limitKind: "tier",
          runId: params.runId,
          type: "duration_limit_reached",
        });
      }
      // `waiting_for_user` est déjà émis par le contrôleur au moment où l'outil
      // le déclare (une seule fois) : ne pas le dupliquer ici.
      const failureForEvent = failure as string | null;
      emitBusiness({
        chatId: params.chatId,
        ...(failureForEvent ? { error: failureForEvent.slice(0, 200) } : {}),
        runId: params.runId,
        status: finalStatus,
        type: "run_finished",
      });
      // Durée d'activité cumulée (pas la latence entre invocations) : c'est la
      // valeur qui décide du filtre « run long » des notifications.

      // SuggestedActions : dérivées côté serveur à partir de ce qui s'est
      // réellement passé (outils activés, livrable, projet), validées par le
      // registre puis persistées. Le client n'affiche que des actions du
      // registre et les exécute via la route dédiée — jamais localement.
      try {
        const hasArtifact = state.producedArtifact;
        const derived = deriveSuggestedActions({
          enabledToolCategories: [
            ...new Set(params.tools.map((tool) => tool.category)),
          ],
          hasArtifact:
            hasArtifact ||
            state.sources.some((source) => source.kind === "web"),
          projectId: params.projectId,
          taskTitle: params.task,
        });
        const validated = validateDerivedActions({
          actions: derived,
          enabledToolCategories: [
            ...new Set(params.tools.map((tool) => tool.category)),
          ],
        });
        if (validated.length > 0) {
          const displayActions = validated.map((candidate) => ({
            id: candidate.id,
            label: candidate.action.label,
            payload: (candidate.action.payload ?? {}) as Record<
              string,
              unknown
            >,
          }));
          await setAgentRunSuggestedActions({
            actions: displayActions,
            id: params.runId,
          }).catch(() => {});
        }
      } catch {
        // Les actions suggérées sont un confort : un échec ne touche jamais
        // au run lui-même.
      }

      // Synthèse d'observabilité en fin de run : le client affiche durée,
      // tokens et erreur éventuelle sans jamais lire les traces techniques.
      // Lecture via fermeture : `failure` n'est assigné que dans le rappel
      // onError (asynchrone), donc le flux de contrôle ne le suit pas — la
      // fonction restitue le type déclaré plutôt que le narrowing local.
      const currentFailure = (): string | null => failure;
      const failureText = currentFailure();
      emitRun(finalStatus, {
        ...(failureText ? { error: failureText.slice(0, 200) } : {}),
        durationMs: runActiveMs,
        ...usageTotals,
      });
    },
    generateId: generateUUID,
    onEnd: async ({ messages: finishedMessages }) => {
      await persistAgentRunMessages({
        chatId: params.chatId,
        existingMessages: params.existingMessages,
        finishedMessages: finishedMessages as ChatMessage[],
        firstUserMessageForTitle: params.firstUserMessageForTitle,
        isContinuation: params.isContinuation,
        shouldRenameAfterFirst: params.shouldRenameAfterFirst,
      }).catch((error) => {
        console.error("Erreur persistance conversation Agent :", error);
      });
    },
    onError: (error) => {
      console.error("Erreur de streaming Agent :", error);
      return "Agent a rencontré une erreur pendant l'exécution. Les étapes déjà réalisées restent visibles.";
    },
    originalMessages: params.isContinuation
      ? params.existingMessages
      : undefined,
  });
}

// Même mécanisme de reprise que le Chat (streams resumables Redis) : après un
// refresh, l'utilisateur retrouve le run là où il en était.
export function createAgentStreamResponse(params: {
  chatId: string;
  stream: ReturnType<typeof createUIMessageStream>;
}): Response {
  return createUIMessageStreamResponse({
    async consumeSseStream({ stream: sseStream }) {
      if (!process.env.REDIS_URL) {
        return;
      }
      try {
        const streamContext = getStreamContext();
        if (streamContext) {
          const streamId = generateId();
          const { createStreamId } = await import("@/lib/db/queries");
          await createStreamId({ chatId: params.chatId, streamId });
          await streamContext.createNewResumableStream(
            streamId,
            () => sseStream
          );
        }
      } catch {
        // Non critique : la reprise est un confort, pas une condition du run.
      }
    },
    stream: params.stream,
  });
}

export type { AgentEventWriter };
