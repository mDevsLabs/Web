import "server-only";

import type { AgentEventWriter } from "@/lib/agent/events";
import {
  emitAgentArtifact,
  emitAgentRun,
  emitAgentSources,
  emitAgentStep,
  emitAgentTool,
} from "@/lib/agent/events";
import { summarizeToolResult } from "@/lib/agent/summaries";
import type {
  AgentSource,
  AgentStepStatus,
  AgentToolBaseContext,
  RegisteredAgentTool,
  ToolCallController,
  ToolResult,
} from "@/lib/agent/types";
import {
  bumpAgentRunCounters,
  completeToolExecution,
  createAgentStep,
  createToolExecution,
  updateAgentStep,
} from "@/lib/db/agent-queries";

// Contrôleur d'appels d'outils : c'est ici que chaque appel devient un step
// visible, une ligne ToolExecution persistée et un événement diffusé. Le
// runtime ne fait que le brancher ; la couche d'adaptation ne fait que
// l'invoquer.

export type AgentToolControllerState = {
  approvalRequiredToolIds: string[];
  // Un livrable a été produit pendant le run (dérivation des actions suggérées).
  producedArtifact: boolean;
  sources: AgentSource[];
  stepIndex: number;
  toolCallCount: number;
  waitingForUser: boolean;
  // Dernière catégorie d'erreur normalisée vue sur un outil (pour le statut
  // « timed_out » du run : timeout réseau, dépassement, 429…).
  lastErrorCategory: string | null;
};

function readString(value: unknown, key: string): string | undefined {
  if (!value || typeof value !== "object") {
    return;
  }
  const candidate = (value as Record<string, unknown>)[key];
  return typeof candidate === "string" && candidate.trim()
    ? candidate
    : undefined;
}

export function createAgentToolController(params: {
  approvalRequiredToolIds: string[];
  base: AgentToolBaseContext;
  onPlanProgress: (progress: {
    status: AgentStepStatus;
    title: string;
  }) => void;
  runId: string;
  state: AgentToolControllerState;
  writer: AgentEventWriter;
}): ToolCallController {
  return {
    beginToolCall: async ({ input, tool }) => {
      const index = params.state.stepIndex;
      params.state.stepIndex += 1;

      const step = await createAgentStep({
        index,
        runId: params.runId,
        status: "running",
        title: tool.name,
        type: "tool_call",
      });

      const execution = await createToolExecution({
        category: tool.category,
        input,
        runId: params.runId,
        stepId: step.id,
        toolId: tool.id,
      });

      emitAgentStep(params.writer, {
        index,
        runId: params.runId,
        status: "running",
        stepId: step.id,
        title: tool.name,
        type: "tool_call",
      });
      emitAgentTool(params.writer, {
        attempt: 1,
        category: tool.category,
        label: tool.name,
        runId: params.runId,
        status: "running",
        stepId: step.id,
        toolId: tool.id,
      });

      const startedAt = Date.now();

      return {
        context: {
          ...params.base,
          runId: params.runId,
          stepId: step.id,
          toolExecutionId: execution.id,
        },
        finishToolCall: async (result: ToolResult) => {
          params.state.toolCallCount += 1;
          const durationMs = Date.now() - startedAt;
          const status: AgentStepStatus = result.success
            ? "completed"
            : "failed";
          const summary = summarizeToolResult({ result, toolId: tool.id });
          const requiresApproval =
            params.state.approvalRequiredToolIds.includes(tool.id);
          const errorCategory = result.success
            ? null
            : categorizeToolError(result.error.code, result.error.message);
          if (errorCategory) {
            params.state.lastErrorCategory = errorCategory;
          }

          await completeToolExecution({
            approvalStatus: requiresApproval ? "approved" : "not_required",
            durationMs,
            error: result.success ? null : result.error.message,
            errorCategory,
            id: execution.id,
            output: result.success ? result.data : { error: result.error },
            status: result.success ? "completed" : "failed",
          });

          await updateAgentStep({
            completedAt: new Date(),
            id: step.id,
            status,
            summary,
            toolExecutionId: execution.id,
          });

          emitAgentStep(params.writer, {
            index,
            runId: params.runId,
            status,
            stepId: step.id,
            summary,
            title: tool.name,
            type: status === "completed" ? "tool_result" : "error",
          });
          emitAgentTool(params.writer, {
            attempt: 1,
            category: tool.category,
            durationMs,
            errorCategory,
            label: tool.name,
            runId: params.runId,
            status: result.success ? "completed" : "failed",
            stepId: step.id,
            summary,
            toolId: tool.id,
          });

          if (result.success && result.sources?.length) {
            params.state.sources.push(...result.sources);
            emitAgentSources(params.writer, result.sources);
          }

          // Livrable : étape dédiée et référence diffusée au client, qui ouvre
          // l'artefact dans le panneau existant.
          const documentId = result.success
            ? readString(result.data, "documentId")
            : undefined;
          if (result.success && documentId) {
            params.state.producedArtifact = true;
            const artifactTitle =
              readString(result.data, "title") ?? "Livrable";
            const artifactKind = readString(result.data, "kind") ?? "text";
            const artifactStep = await createAgentStep({
              index: params.state.stepIndex,
              runId: params.runId,
              status: "completed",
              summary: artifactTitle,
              title: `Livrable « ${artifactTitle} »`,
              type: "artifact",
            });
            params.state.stepIndex += 1;
            await updateAgentStep({
              completedAt: new Date(),
              id: artifactStep.id,
              status: "completed",
              toolExecutionId: execution.id,
            });
            emitAgentArtifact(params.writer, {
              documentId,
              kind: artifactKind,
              runId: params.runId,
              title: artifactTitle,
            });
            emitAgentStep(params.writer, {
              index: artifactStep.index,
              runId: params.runId,
              status: "completed",
              stepId: artifactStep.id,
              summary: artifactTitle,
              title: artifactStep.title,
              type: "artifact",
            });
          }

          // Information manquante : le run attend une réponse utilisateur au
          // lieu d'inventer. La reprise se fera sur le même run.
          if (
            result.success &&
            tool.id === "ask_user" &&
            readString(result.data, "status") === "waiting_for_user"
          ) {
            params.state.waitingForUser = true;
            emitAgentRun(params.writer, {
              model: "",
              reasoningLevel: "medium",
              runId: params.runId,
              status: "waiting_for_user",
            });
          }

          params.onPlanProgress({ status, title: tool.name });
          await bumpAgentRunCounters({ id: params.runId, toolCallDelta: 1 });
        },
      };
    },
  };
}

export function findToolById(
  tools: RegisteredAgentTool[],
  toolId: string
): RegisteredAgentTool | null {
  return tools.find((tool) => tool.id === toolId) ?? null;
}

// Catégorie d'erreur normalisée, affichable sans exposer de détail interne.
export function categorizeToolError(
  code: string,
  message: string
): string | null {
  const haystack = `${code} ${message}`.toLowerCase();
  if (
    haystack.includes("timeout") ||
    haystack.includes("abort") ||
    haystack.includes("délai") ||
    haystack.includes("delai")
  ) {
    return "timeout";
  }
  if (
    haystack.includes("rate") ||
    haystack.includes("429") ||
    haystack.includes("quota") ||
    haystack.includes("limite")
  ) {
    return "rate_limit";
  }
  if (
    haystack.includes("network") ||
    haystack.includes("fetch") ||
    haystack.includes("econn") ||
    haystack.includes("réseau") ||
    haystack.includes("reseau")
  ) {
    return "network";
  }
  if (
    haystack.includes("permission") ||
    haystack.includes("denied") ||
    haystack.includes("forbidden") ||
    haystack.includes("403")
  ) {
    return "permission";
  }
  return "provider";
}
