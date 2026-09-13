import type { AgentExecutionBudget } from "@/lib/agent/types";
import { getPaidTierRank } from "@/lib/auth/plan";

// Budget d'exécution : garde-fou anti-boucle infinie. Les valeurs sont uniques
// en Alpha (décision de plan) ; la résolution reste centralisée ici pour que
// l'affinage par forfait/modèle en Beta ne touche qu'un seul fichier.

export const AGENT_BUDGET_DEFAULT: AgentExecutionBudget = {
  maxDurationMs: 240_000,
  maxRetries: 2,
  maxSteps: 12,
  maxToolCalls: 24,
};

// Plancher défensif : si un forfait non payant atteignait malgré tout le
// runtime (contournement de la garde), le run reste minuscule et borné.
export const AGENT_BUDGET_RESTRICTED: AgentExecutionBudget = {
  maxDurationMs: 30_000,
  maxRetries: 1,
  maxSteps: 3,
  maxToolCalls: 4,
};

export const AGENT_TOOL_TIMEOUT_MS = 45_000;

export function resolveAgentExecutionBudget(params: {
  tier?: string | null;
}): AgentExecutionBudget {
  const rank = getPaidTierRank(params.tier);
  if (rank === 0) {
    return { ...AGENT_BUDGET_RESTRICTED };
  }
  return { ...AGENT_BUDGET_DEFAULT };
}

export function remainingBudget(params: {
  budget: AgentExecutionBudget;
  startedAt: number;
  toolCallCount: number;
  stepCount: number;
  now?: number;
}): {
  exhausted: boolean;
  remainingMs: number;
  remainingSteps: number;
  remainingToolCalls: number;
} {
  const now = params.now ?? Date.now();
  const remainingMs = Math.max(
    0,
    params.budget.maxDurationMs - (now - params.startedAt)
  );
  const remainingSteps = Math.max(0, params.budget.maxSteps - params.stepCount);
  const remainingToolCalls = Math.max(
    0,
    params.budget.maxToolCalls - params.toolCallCount
  );

  return {
    exhausted: remainingMs <= 0 || remainingSteps <= 0,
    remainingMs,
    remainingSteps,
    remainingToolCalls,
  };
}
