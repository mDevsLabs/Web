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
import type { AgentFlags } from "@/lib/agent/flags";
import { persistAgentRunMessages } from "@/lib/agent/persist";
import { applyPlanProgress } from "@/lib/agent/plan";
import {
  type AgentToolControllerState,
  createAgentToolController,
} from "@/lib/agent/tool-controller";
import { toProviderTools } from "@/lib/agent/tools/adapters/provider";
import { buildToolApprovalConfig } from "@/lib/agent/tools/permissions";
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
import {
  bumpAgentRunCounters,
  createAgentStep,
  setAgentRunPlan,
  setAgentRunUsage,
  updateAgentRunStatus,
} from "@/lib/db/agent-queries";
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
  runId: string;
  sessionToken: string;
  shouldRenameAfterFirst: boolean;
  startedAt: number;
  task: string;
  tools: RegisteredAgentTool[];
  userEmail: string;
  userId: string;
};

function approvalSecret(flags: AgentFlags): string | undefined {
  if (!flags["agent.approvals"]) {
    return;
  }
  return (
    process.env.AGENT_TOOL_APPROVAL_SECRET ??
    process.env.MAI_JWT_SECRET ??
    undefined
  );
}

export function createAgentStream(params: AgentStreamParams) {
  return createUIMessageStream({
    execute: async ({ writer }) => {
      const state: AgentToolControllerState = {
        approvalRequiredToolIds: params.approvalRequiredToolIds,
        sources: [],
        stepIndex: 0,
        toolCallCount: 0,
        waitingForUser: false,
      };
      let plan = params.plan;
      let aborted = false;
      let failure: string | null = null;
      let accountingStarted = false;

      const emitRun = (
        status: AgentRunStatus,
        extra: { stepCount?: number; toolCallCount?: number } = {}
      ) => {
        emitAgentRun(writer, {
          model: params.modelId,
          reasoningLevel: params.reasoningLevel,
          runId: params.runId,
          status,
          stepCount: extra.stepCount ?? state.stepIndex,
          toolCallCount: extra.toolCallCount ?? state.toolCallCount,
        });
      };

      emitRun("running");
      if (plan) {
        emitAgentPlan(writer, plan);
      }

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

      const tools = toProviderTools({ controller, tools: params.tools });
      const approvalConfig = buildToolApprovalConfig({
        approvalRequiredToolIds: params.approvalRequiredToolIds,
        enabledTools: params.tools,
      });
      const secret = approvalSecret(params.flags);
      const providerOptions = resolveReasoningProviderOptions(
        params.modelId,
        params.reasoningLevel
      );

      const result = streamText({
        abortSignal: params.abortSignal,
        activeTools: params.tools.map((tool) => tool.id),
        instructions: params.context.instructions,
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
          await bumpAgentRunCounters({
            id: params.runId,
            stepDelta: 1,
            toolCallDelta: 0,
          }).catch(() => {});
          const text = (step.text ?? "").trim();
          if (text) {
            emitRun("running");
          }
        },
        prepareStep: ({ steps }) => {
          const elapsed = Date.now() - params.startedAt;
          const toolCalls = steps.reduce(
            (total, step) => total + (step.toolCalls?.length ?? 0),
            0
          );
          // Budget épuisé : on interdit les outils restants pour forcer une
          // réponse finale au lieu d'une coupure brutale.
          if (
            elapsed >= params.budget.maxDurationMs ||
            toolCalls >= params.budget.maxToolCalls
          ) {
            return { toolChoice: "none" as const };
          }
        },
        ...(providerOptions ? { providerOptions } : {}),
        ...(secret && params.flags["agent.approvals"]
          ? { experimental_toolApprovalSecret: secret }
          : {}),
        stopWhen: ({ steps }) =>
          steps.length >= params.budget.maxSteps ||
          Date.now() - params.startedAt >= params.budget.maxDurationMs,
        toolApproval: approvalConfig,
        tools,
      });

      writer.merge(
        toUIMessageStream({
          // Agent n'affiche jamais de raisonnement privé : seules les actions,
          // les outils, la progression et les résultats utiles sont visibles.
          sendReasoning: false,
          stream: result.stream,
        })
      );

      try {
        await result.finishReason;
      } catch {
        // L'erreur a déjà été captée par onError ; on poursuit la finalisation.
      }

      const finalStatus: AgentRunStatus = state.waitingForUser
        ? "waiting_for_user"
        : aborted
          ? "cancelled"
          : failure
            ? "failed"
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

      await updateAgentRunStatus({
        ...(finalStatus === "waiting_for_user"
          ? {}
          : { completedAt: new Date() }),
        error: failure,
        id: params.runId,
        status: finalStatus,
      }).catch(() => {});

      emitRun(finalStatus);
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
