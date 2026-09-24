import "server-only";

import { AGENT_TOOL_TIMEOUT_MS } from "@/lib/agent/budget";
import { AGENT_ERROR_CODES } from "@/lib/agent/errors";
import type { AgentEventWriter } from "@/lib/agent/events";
import {
  emitAgentArtifact,
  emitAgentPlan,
  emitAgentRun,
  emitAgentSources,
  emitAgentStep,
  emitAgentTool,
} from "@/lib/agent/events";
import { emitAgentBusinessEvent } from "@/lib/agent/events/business";
import { paramsHashOf } from "@/lib/agent/params-hash";
import { DEFAULT_TOOL_RETRY_POLICY, decideToolRetry } from "@/lib/agent/retry";
import { summarizeToolResult } from "@/lib/agent/summaries";
import { AgentToolError } from "@/lib/agent/tool-errors";
import { getAgentToolLabel } from "@/lib/agent/tools/catalog";
import type {
  AgentSource,
  AgentStepStatus,
  AgentToolBaseContext,
  RegisteredAgentTool,
  ToolCallController,
  ToolExecutionContext,
  ToolFailure,
  ToolResult,
} from "@/lib/agent/types";
import { toolFailure } from "@/lib/agent/types";
import {
  createApprovalRequest,
  getApprovalRequestByToolCall,
  renewApprovalRequest,
} from "@/lib/db/agent-foundation-queries";
import {
  completeToolExecution,
  createAgentStep,
  createToolExecution,
  setAgentRunPlan,
  updateAgentStep,
} from "@/lib/db/agent-queries";

// Contrôleur d'appels d'outils : c'est ici que chaque appel devient un step
// visible, une ligne ToolExecution persistée et un événement diffusé. Le
// runtime ne fait que le brancher ; la couche d'adaptation ne fait que
// l'invoquer. Aucune branche ne dépend du nom d'un outil : les effets
// (livrable, attente utilisateur) sont déclarés par l'outil lui-même dans
// `ToolSuccess.outcome`, et l'approbation est une décision serveur persistée.

export type AgentToolControllerState = {
  approvalRequiredToolIds: string[];
  // Un livrable a été produit pendant le run (dérivation des actions suggérées).
  producedArtifact: boolean;
  sources: AgentSource[];
  stepIndex: number;
  toolCallCount: number;
  // Une approbation persistée manque pour poursuivre : le run se suspend au
  // lieu de conclure, et la reprise repart de la décision enregistrée.
  waitingForApproval: boolean;
  waitingForUser: boolean;
  // Dernière catégorie d'erreur normalisée vue sur un outil (pour le statut
  // « timed_out » du run : timeout réseau, dépassement, 429…).
  lastErrorCategory: string | null;
};

type ApprovalResolution =
  | { kind: "approved" }
  | { kind: "denied"; reason: string }
  | { kind: "pending"; requestId: string };

const APPROVAL_TTL_MS = 24 * 60 * 60 * 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// Erreur normalisée, sûre pour le modèle : code affichable, message court,
// catégorie (utilisée pour décider d'un retry) — jamais de détail interne.
function failureFromResult(result: ToolFailure): {
  category: string;
  code: string;
  message: string;
} {
  return {
    category:
      result.error.category ??
      categorizeToolError(result.error.code, result.error.message),
    code: result.error.code,
    message: result.error.message,
  };
}

export function createAgentToolController(params: {
  approvalRequiredToolIds: string[];
  base: AgentToolBaseContext;
  executionOwner?: string | null;
  maxToolAttempts: number;
  onPlanProgress: (progress: {
    status: AgentStepStatus;
    title: string;
  }) => void;
  runId: string;
  state: AgentToolControllerState;
  writer: AgentEventWriter;
}): ToolCallController {
  const requiresApproval = (toolId: string) =>
    params.state.approvalRequiredToolIds.includes(toolId);

  // Rattachement de la demande d'approbation au step et à l'exécution en cours.
  let pendingStepId: string | null = null;
  let pendingExecutionId: string | null = null;

  async function createPendingApproval(vc: {
    input: unknown;
    paramsHash: string;
    toolCallId: string;
    toolId: string;
  }): Promise<string> {
    // L'attente d'approbation est une étape visible de la timeline, pas un état
    // implicite : elle porte la décision qui sera appliquée à la reprise.
    const index = params.state.stepIndex;
    params.state.stepIndex += 1;
    const step = await createAgentStep({
      executionOwner: params.executionOwner,
      index,
      runId: params.runId,
      status: "running",
      summary: `« ${getAgentToolLabel(vc.toolId)} » attend votre accord avant d'agir.`,
      title: "Approbation requise",
      type: "approval_request",
    }).catch(() => null);
    if (step) {
      emitAgentStep(params.writer, {
        index,
        runId: params.runId,
        status: "running",
        stepId: step.id,
        title: "Approbation requise",
        type: "approval_request",
      });
    }

    const request = await createApprovalRequest({
      executionOwner: params.executionOwner,
      expiresAt: new Date(Date.now() + APPROVAL_TTL_MS),
      params: (vc.input && typeof vc.input === "object"
        ? vc.input
        : { value: vc.input }) as Record<string, unknown>,
      paramsHash: vc.paramsHash,
      runId: params.runId,
      stepId: step?.id ?? pendingStepId,
      toolCallId: vc.toolCallId,
      toolExecutionId: pendingExecutionId,
      toolId: vc.toolId,
    }).catch(() => null);

    emitAgentBusinessEvent({
      approvalRequestId: request?.id ?? vc.toolCallId,
      runId: params.runId,
      toolId: vc.toolId,
      type: "approval_required",
    });

    return request?.id ?? `pending-${vc.toolCallId}`;
  }

  // Décision d'approbation : la base fait foi. Aucun outil soumis à
  // approbation ne s'exécute sans une décision « approved » dont les
  // paramètres correspondent encore. Une modification du ToolCall invalide
  // donc l'accord ; un refus est définitif pour cet appel.
  async function resolveApproval(vc: {
    input: unknown;
    toolCallId: string;
    toolId: string;
  }): Promise<ApprovalResolution> {
    if (!requiresApproval(vc.toolId)) {
      return { kind: "approved" };
    }

    const paramsHash = paramsHashOf(vc.input);
    const existing = await getApprovalRequestByToolCall({
      runId: params.runId,
      toolCallId: vc.toolCallId,
    }).catch(() => null);

    if (!existing) {
      const requestId = await createPendingApproval({
        input: vc.input,
        paramsHash,
        toolCallId: vc.toolCallId,
        toolId: vc.toolId,
      });
      return { kind: "pending", requestId };
    }

    if (existing.status === "approved") {
      // Les paramètres approuvés doivent être exactement ceux présentés.
      if (paramsHashOf(existing.params) !== paramsHash) {
        return {
          kind: "denied",
          reason:
            "Les paramètres de cette action ont changé depuis votre approbation : une nouvelle demande est nécessaire.",
        };
      }
      return { kind: "approved" };
    }

    if (existing.status === "denied") {
      return {
        kind: "denied",
        reason:
          existing.denyReason ??
          "Cette action a été refusée et ne peut pas être exécutée.",
      };
    }

    if (existing.status === "expired") {
      const renewed = await renewApprovalRequest({
        executionOwner: params.executionOwner,
        expiresAt: new Date(Date.now() + APPROVAL_TTL_MS),
        id: existing.id,
        params: (vc.input && typeof vc.input === "object"
          ? vc.input
          : { value: vc.input }) as Record<string, unknown>,
        paramsHash,
        stepId: pendingStepId,
        toolExecutionId: pendingExecutionId,
        toolId: vc.toolId,
      });
      if (renewed) return { kind: "pending", requestId: renewed.id };
      const current = await getApprovalRequestByToolCall({
        runId: params.runId,
        toolCallId: vc.toolCallId,
      });
      if (current?.status === "pending") {
        return { kind: "pending", requestId: current.id };
      }
      return {
        kind: "denied",
        reason:
          "La demande d'approbation précédente a expiré. Recommencez l'action pour obtenir une nouvelle demande.",
      };
    }

    return { kind: "pending", requestId: existing.id };
  }

  async function runAttempt(vc: {
    execute: (context: ToolExecutionContext) => Promise<ToolResult>;
    stepId: string;
    toolCallId: string;
    toolExecutionId: string;
  }): Promise<ToolResult> {
    const timeoutSignal = AbortSignal.timeout(AGENT_TOOL_TIMEOUT_MS);
    const context: ToolExecutionContext = {
      ...params.base,
      runId: params.runId,
      signal: params.base.signal
        ? AbortSignal.any([params.base.signal, timeoutSignal])
        : timeoutSignal,
      stepId: vc.stepId,
      toolCallId: vc.toolCallId,
      toolExecutionId: vc.toolExecutionId,
    };
    return await vc.execute(context);
  }

  async function finishCall(vc: {
    approvalStatus: "approved" | "denied" | "not_required" | "pending";
    durationMs: number;
    executionId: string;
    index: number;
    result: ToolResult;
    stepId: string;
    tool: RegisteredAgentTool;
  }): Promise<void> {
    const status: AgentStepStatus = vc.result.success ? "completed" : "failed";
    const summary = summarizeToolResult({
      result: vc.result,
      summarize: vc.tool.summarize,
    });
    const failure = vc.result.success ? null : failureFromResult(vc.result);
    const errorCategory = failure?.category ?? null;
    if (errorCategory) {
      // Le statut « timed_out » du run s'appuie sur cette valeur : un timeout
      // technique (délai d'outil dépassé) est distingué des erreurs métier.
      params.state.lastErrorCategory =
        vc.result.success === false &&
        vc.result.error.code === AGENT_ERROR_CODES.toolTimeout
          ? "timeout"
          : errorCategory;
    }

    await completeToolExecution({
      approvalStatus: vc.approvalStatus,
      durationMs: vc.durationMs,
      error: failure?.message ?? null,
      errorCategory,
      executionOwner: params.executionOwner,
      id: vc.executionId,
      output: vc.result.success ? vc.result.data : { error: vc.result.error },
      retryable: vc.result.success
        ? false
        : (vc.result.error.retryable ?? false),
      runId: params.runId,
      status: vc.result.success
        ? "completed"
        : vc.approvalStatus === "denied"
          ? "denied"
          : "failed",
    });

    await updateAgentStep({
      completedAt: new Date(),
      executionOwner: params.executionOwner,
      id: vc.stepId,
      runId: params.runId,
      status,
      summary,
      toolExecutionId: vc.executionId,
    });

    emitAgentStep(params.writer, {
      index: vc.index,
      runId: params.runId,
      status,
      stepId: vc.stepId,
      summary,
      title: vc.tool.name,
      type: vc.result.success ? "tool_result" : "error",
    });
    emitAgentTool(params.writer, {
      attempt: 1,
      category: vc.tool.category,
      durationMs: vc.durationMs,
      errorCategory,
      label: vc.tool.name,
      runId: params.runId,
      status: vc.result.success ? "completed" : "failed",
      stepId: vc.stepId,
      summary,
      toolId: vc.tool.id,
    });
    emitAgentBusinessEvent({
      durationMs: vc.durationMs,
      runId: params.runId,
      stepId: vc.stepId,
      success: vc.result.success,
      toolExecutionId: vc.executionId,
      toolId: vc.tool.id,
      type: "tool_call_finished",
    });

    if (vc.result.success && vc.result.sources?.length) {
      params.state.sources.push(...vc.result.sources);
      emitAgentSources(params.writer, vc.result.sources);
    }

    // Livrable : effet générique déclaré par l'outil (aucune connaissance de
    // son identifiant). Une étape dédiée ouvre l'artefact côté client.
    const artifact = vc.result.success
      ? vc.result.outcome?.artifact
      : undefined;
    if (artifact) {
      params.state.producedArtifact = true;
      const artifactStep = await createAgentStep({
        executionOwner: params.executionOwner,
        index: params.state.stepIndex,
        runId: params.runId,
        status: "completed",
        summary: artifact.title,
        title: `Livrable « ${artifact.title} »`,
        type: "artifact",
      });
      params.state.stepIndex += 1;
      await updateAgentStep({
        completedAt: new Date(),
        executionOwner: params.executionOwner,
        id: artifactStep.id,
        runId: params.runId,

        status: "completed",
        toolExecutionId: vc.executionId,
      });
      emitAgentArtifact(params.writer, {
        documentId: artifact.documentId,
        kind: artifact.kind,
        runId: params.runId,
        title: artifact.title,
      });
      emitAgentStep(params.writer, {
        index: artifactStep.index,
        runId: params.runId,
        status: "completed",
        stepId: artifactStep.id,
        summary: artifact.title,
        title: artifactStep.title,
        type: "artifact",
      });
    }

    // Information manquante : le run attend une réponse utilisateur au lieu
    // d'inventer. La reprise se fera sur le même run, à partir du checkpoint.
    const awaitingUser = vc.result.success
      ? vc.result.outcome?.awaitingUser
      : undefined;
    if (awaitingUser) {
      params.state.waitingForUser = true;
      emitAgentBusinessEvent({ runId: params.runId, type: "waiting_for_user" });
      emitAgentRun(params.writer, {
        model: "",
        reasoningLevel: "medium",
        runId: params.runId,
        status: "waiting_for_user",
      });
      // La question est un événement de timeline propre : l'utilisateur voit
      // « question posée », puis « réponse reçue » (route) et la reprise,
      // au lieu d'une simple sortie d'outil.
      const questionStep = await createAgentStep({
        executionOwner: params.executionOwner,
        index: params.state.stepIndex,
        runId: params.runId,
        status: "completed",
        summary: awaitingUser.requestId,
        title: "Question posée",
        type: "user_input_request",
      }).catch(() => null);
      if (questionStep) {
        params.state.stepIndex += 1;
        emitAgentStep(params.writer, {
          index: questionStep.index,
          runId: params.runId,
          status: "completed",
          stepId: questionStep.id,
          summary: awaitingUser.requestId,
          title: questionStep.title,
          type: "user_input_request",
        });
      }
    }

    // Plan de tâche déclaré par un outil (effet générique ToolOutcome.plan) :
    // persisté sur le run puis diffusé à la timeline. La progression des items
    // reste pilotée par onPlanProgress, déjà branchée sur les étapes.
    const plan = vc.result.success ? vc.result.outcome?.plan : undefined;
    if (plan) {
      await setAgentRunPlan({
        executionOwner: params.executionOwner,
        id: params.runId,
        plan,
      }).catch(() => {});
      emitAgentPlan(params.writer, plan);
    }

    params.onPlanProgress({ status, title: vc.tool.name });
  }

  return {
    onApprovalRequired: async ({ input, toolId, toolCallId }) => {
      if (!requiresApproval(toolId)) {
        return false;
      }
      const resolution = await resolveApproval({
        input,
        toolCallId,
        toolId,
      });
      if (resolution.kind === "denied") {
        return false;
      }
      if (resolution.kind === "pending") {
        params.state.waitingForApproval = true;
      }
      return resolution.kind !== "approved";
    },

    runToolCall: async ({ execute, input, tool, toolCallId }) => {
      if (params.state.waitingForUser) {
        return toolFailure(
          "user_input_required",
          "Une réponse de l'utilisateur est requise avant toute autre action.",
          { category: "user_intervention", retryable: false }
        );
      }
      if (params.state.waitingForApproval) {
        return toolFailure(
          "approval_required",
          "Une approbation est requise avant toute autre action.",
          { category: "user_intervention", retryable: false }
        );
      }
      const index = params.state.stepIndex;
      params.state.stepIndex += 1;

      const step = await createAgentStep({
        executionOwner: params.executionOwner,
        index,
        runId: params.runId,
        status: "running",
        title: tool.name,
        type: "tool_call",
      });

      pendingStepId = step.id;
      emitAgentBusinessEvent({
        runId: params.runId,
        stepId: step.id,
        stepType: "tool_call",
        title: tool.name,
        type: "step_created",
      });

      const firstExecution = await createToolExecution({
        attempt: 1,
        category: tool.category,
        executionOwner: params.executionOwner,
        input,
        operationKey: `${params.runId}:${toolCallId}`,
        runId: params.runId,
        stepId: step.id,
        toolId: tool.id,
      });
      pendingExecutionId = firstExecution.id;

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
      emitAgentBusinessEvent({
        attempt: 1,
        category: tool.category,
        runId: params.runId,
        stepId: step.id,
        toolExecutionId: firstExecution.id,
        toolId: tool.id,
        type: "tool_call_started",
      });

      const resolution = await resolveApproval({
        input,
        toolCallId,
        toolId: tool.id,
      });

      // Sécurité fail-closed : sans accord explicite couvrant exactement ces
      // paramètres, l'outil ne s'exécute jamais — quel que soit le chemin qui
      // a mené jusqu'ici. Aucun retry, plugin ou MCP ne contourne ce point.
      if (resolution.kind !== "approved") {
        const failure =
          resolution.kind === "denied"
            ? toolFailure(
                AGENT_ERROR_CODES.permissionDenied,
                resolution.reason,
                { category: "permission", retryable: false }
              )
            : toolFailure(
                "approval_required",
                "Cette action attend votre approbation avant de s'exécuter.",
                { category: "user_intervention", retryable: false }
              );
        await finishCall({
          approvalStatus: resolution.kind === "denied" ? "denied" : "pending",
          durationMs: 0,
          executionId: firstExecution.id,
          index,
          result: failure,
          stepId: step.id,
          tool,
        });
        return failure;
      }

      let attempt = 1;
      let executionId = firstExecution.id;
      const startedAt = Date.now();
      let result = await runAttempt({
        execute,
        stepId: step.id,
        toolCallId,
        toolExecutionId: executionId,
      });

      // Retries bornés : uniquement des erreurs transitoires, dans la limite
      // des tentatives autorisées. Chaque tentative est une ligne persistée.
      while (!result.success && attempt < params.maxToolAttempts) {
        const normalized = new AgentToolError({
          category: result.error.category ?? "permanent",
          code: result.error.code,
          message: result.error.message,
          ...(result.error.retryAfterMs === undefined
            ? {}
            : { retryAfterMs: result.error.retryAfterMs }),
        });
        const decision = decideToolRetry({
          attempt,
          error: normalized,
          policy: {
            ...DEFAULT_TOOL_RETRY_POLICY,
            maxAttempts: params.maxToolAttempts,
          },
        });
        if (!decision.retry) {
          break;
        }

        emitAgentBusinessEvent({
          attempt: attempt + 1,
          delayMs: decision.delayMs,
          retryable: true,
          runId: params.runId,
          stepId: step.id,
          toolExecutionId: executionId,
          toolId: tool.id,
          type: "tool_retry_scheduled",
        });
        await sleep(decision.delayMs);

        attempt += 1;
        const retryExecution = await createToolExecution({
          attempt,
          category: tool.category,
          executionOwner: params.executionOwner,
          input,
          operationKey: `${params.runId}:${toolCallId}`,
          parentExecutionId: executionId,
          retryable: true,
          runId: params.runId,
          stepId: step.id,
          toolId: tool.id,
        });
        executionId = retryExecution.id;
        emitAgentTool(params.writer, {
          attempt,
          category: tool.category,
          label: tool.name,
          runId: params.runId,
          status: "running",
          stepId: step.id,
          toolId: tool.id,
        });
        result = await runAttempt({
          execute,
          stepId: step.id,
          toolCallId,
          toolExecutionId: executionId,
        });
      }

      await finishCall({
        approvalStatus: requiresApproval(tool.id) ? "approved" : "not_required",
        durationMs: Math.max(0, Date.now() - startedAt),
        executionId,
        index,
        result,
        stepId: step.id,
        tool,
      });

      return result;
    },
  };
}

// Catégorie d'erreur de repli, pour les outils qui ne déclarent pas de
// catégorie (plugins, MCP, outils tiers). Les outils internes normalisent
// leurs erreurs à la source (AgentToolError) et ne passent pas par ici.
export function categorizeToolError(code: string, message: string): string {
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

export function findToolById(
  tools: RegisteredAgentTool[],
  toolId: string
): RegisteredAgentTool | null {
  return tools.find((tool) => tool.id === toolId) ?? null;
}
