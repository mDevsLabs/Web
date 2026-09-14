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

// ─────────────────────────────────────────────
// Limites produit de durée d'un AgentRun, par forfait. Source unique partagée
// par l'accès Agent et les budgets d'exécution : un utilisateur ne peut pas
// être « Plus pour le quota » et « Free pour l'accès Agent ». Le plafond
// produit est un MAXIMUM commercial ; en Alpha le budget technique reste plus
// court (les timeouts individuels par appel modèle/réseau/tool conservent la
// limitation effective). maxDurationMs = null : aucune limite produit globale.
// ─────────────────────────────────────────────
export type AgentRunDurationLimit = {
  /** Plafond produit en millisecondes, ou null = illimité (Max). */
  maxRunDurationMs: number | null;
  label: string;
};

export const AGENT_RUN_DURATION_LIMITS: Record<
  "plus" | "pro" | "max",
  AgentRunDurationLimit
> = {
  max: { label: "Max", maxRunDurationMs: null },
  plus: { label: "Plus", maxRunDurationMs: 60 * 60 * 1000 }, // 1 heure
  pro: { label: "Pro", maxRunDurationMs: 3 * 60 * 60 * 1000 }, // 3 heures
};

export function resolveAgentRunDurationLimit(
  tier?: string | null
): AgentRunDurationLimit | null {
  const rank = getPaidTierRank(tier);
  if (rank <= 0) {
    // Free / tier inconnu : pas de run Agent de toute façon (garde amont).
    return null;
  }
  const key =
    getPaidTierRank(tier) === 1
      ? "plus"
      : getPaidTierRank(tier) === 2
        ? "pro"
        : "max";
  return { ...AGENT_RUN_DURATION_LIMITS[key] };
}

function productCapMs(tier?: string | null): number | null {
  return resolveAgentRunDurationLimit(tier)?.maxRunDurationMs ?? null;
}

export function resolveAgentExecutionBudget(params: {
  tier?: string | null;
}): AgentExecutionBudget {
  const rank = getPaidTierRank(params.tier);
  if (rank === 0) {
    return { ...AGENT_BUDGET_RESTRICTED };
  }
  const technical = AGENT_BUDGET_DEFAULT.maxDurationMs;
  const cap = productCapMs(params.tier);
  // Le plafond produit borne le budget technique (jamais l'inverse en Alpha) :
  // un utilisateur Plus ne peut pas dépasser son plafond commercial, mais le
  // run reste en pratique stoppé plus tôt par les timeouts par appel.
  return {
    ...AGENT_BUDGET_DEFAULT,
    maxDurationMs: cap === null ? technical : Math.min(technical, cap),
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
