import { estimateRunCost } from "@/lib/agent/usage";
import { errorResponse } from "@/lib/api/error-response";
import { getMaiUser } from "@/lib/auth/session";
import {
  getAgentRunById,
  getAgentStepsByRunId,
  getToolExecutionsByRunId,
} from "@/lib/db/agent-queries";

// Synthèse utilisateur d'un run : construite DEPUIS LA BASE (runs, steps,
// exécutions d'outils) — le frontend ne recalcule rien. Séparée de la
// télémétrie interne : n'expose que des métriques factuelles, jamais de
// contenu de raisonnement ni de détail technique brut. Le coût n'est fourni
// que s'il est fiable (tarifs configurés côté mAI) et reste libellé comme
// estimation.

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getMaiUser();
  if (!user) {
    return errorResponse("auth_required");
  }
  const userId = user.id || user.email;

  const run = await getAgentRunById({ id, userId });
  if (!run) {
    return errorResponse("not_found", { message: "Run introuvable." });
  }

  const [steps, executions] = await Promise.all([
    getAgentStepsByRunId({ runId: id }),
    getToolExecutionsByRunId({ runId: id }),
  ]);

  const distinctTools = new Set(
    executions.map((execution) => execution.toolId)
  );
  const retries = executions.reduce(
    (total, execution) => total + Math.max(0, (execution.attempt ?? 1) - 1),
    0
  );
  const usage = run.usage as {
    durationMs?: number;
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };

  const durationMs =
    run.completedAt && run.startedAt
      ? run.completedAt.getTime() - run.startedAt.getTime()
      : (usage.durationMs ?? null);

  const cost = estimateRunCost();

  return Response.json(
    {
      costEstimate: cost
        ? { amountUsd: cost.amountUsd, basis: cost.basis, isEstimate: true }
        : null,
      counts: {
        distinctTools: distinctTools.size,
        retries,
        steps: steps.length,
        toolExecutions: executions.length,
      },
      durationMs,
      model: run.model,
      reasoningLevel: run.reasoningLevel,
      status: run.status,
      usage: {
        inputTokens: usage.inputTokens ?? null,
        outputTokens: usage.outputTokens ?? null,
        totalTokens: usage.totalTokens ?? null,
      },
    },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
