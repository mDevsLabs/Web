import type { AgentExecutionBudget } from "@/lib/agent/types";
import { getPaidTierRank } from "@/lib/auth/plan";
import {
  TECHNICAL_TIMEOUTS_MS,
  tierRunLimit,
} from "@/lib/plans/tier-capabilities";

// Budget d'exécution d'un AgentRun. DEUX notions de durée, volontairement
// séparées dans le type pour qu'aucune ne masque l'autre :
//
//  - `maxDurationMs` : plafond TECHNIQUE d'UNE invocation (identique pour tous
//    les forfaits). Il protège l'hébergement : au-delà, on force une réponse
//    finale puis on rend la main, checkpoint persisté.
//  - `productLimitMs` : limite PRODUIT cumulée du run, par forfait (Plus 1 h,
//    Pro 3 h, Max aucune). Elle est appliquée par `lib/agent/limits.ts` sur le
//    temps d'ACTIVITÉ cumulé, checkpoint après checkpoint — le run peut donc
//    être avancé par plusieurs invocations sans perdre son compteur.
//
// La limite produit n'écrase jamais le plafond technique (et réciproquement) :
// seul le forfait décide de la première, seul l'hébergement de la seconde.
// Source unique des valeurs : lib/plans/tier-capabilities.ts.

// Compat : le contrôleur d'outils importe encore ce nom. La VALEUR reste
// définie une seule fois (source unique : lib/plans/tier-capabilities.ts) —
// aucun timeout n'est dupliqué ici.
export const AGENT_TOOL_TIMEOUT_MS = TECHNICAL_TIMEOUTS_MS.toolExecution;

export const AGENT_BUDGET_DEFAULT: AgentExecutionBudget = {
  maxDurationMs: TECHNICAL_TIMEOUTS_MS.invocation,
  maxRetries: 2,
  maxSteps: 12,
  maxToolCalls: 24,
  productLimitMs: null,
};

// Plancher défensif : si un forfait non payant atteignait malgré tout le
// runtime (contournement de la garde), le run reste minuscule et borné.
export const AGENT_BUDGET_RESTRICTED: AgentExecutionBudget = {
  maxDurationMs: 30_000,
  maxRetries: 1,
  maxSteps: 3,
  maxToolCalls: 4,
  productLimitMs: null,
};

export function resolveAgentExecutionBudget(params: {
  tier?: string | null;
}): AgentExecutionBudget {
  const rank = getPaidTierRank(params.tier);
  if (rank === 0) {
    return { ...AGENT_BUDGET_RESTRICTED };
  }
  return {
    ...AGENT_BUDGET_DEFAULT,
    productLimitMs: tierRunLimit(params.tier).limitMs,
  };
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
