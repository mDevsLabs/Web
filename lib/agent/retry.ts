import type { AgentToolError } from "@/lib/agent/tool-errors";

// Politique de retry des outils : backoff exponentiel borné avec jitter plein
// (full jitter), nombre maximal de tentatives configurable, et garde-fous —
// ni quota, ni permission, ni budget de temps ne peuvent être dépassés pour
// retenter. La décision finale appartient à l'appelant (tool-controller),
// qui connaît le budget restant du run.

export type RetryPolicy = {
  // Nombre maximal de TENTATIVES totales (1 = pas de retry).
  maxAttempts: number;
  // Délai de base avant la 2e tentative.
  baseDelayMs: number;
  // Plafond du délai quelle que soit la tentative.
  maxDelayMs: number;
};

export const DEFAULT_TOOL_RETRY_POLICY: RetryPolicy = {
  baseDelayMs: 1000,
  maxAttempts: 3,
  maxDelayMs: 15_000,
};

// Délai avant la tentative `attempt` (1-based) : base * 2^(attempt-2), borné,
// puis jitter plein [0, delay]. `attempt=2` est le premier retry.
export function computeRetryDelayMs(
  policy: RetryPolicy,
  attempt: number,
  random: () => number = Math.random
): number {
  const retryNumber = Math.max(1, attempt - 1);
  const raw = Math.min(
    policy.maxDelayMs,
    policy.baseDelayMs * 2 ** (retryNumber - 1)
  );
  return Math.floor(raw * random());
}

export type RetryDecision =
  | { retry: true; delayMs: number }
  | {
      retry: false;
      reason:
        | "max_attempts"
        | "not_retryable"
        | "deadline"
        | "delay_exceeds_budget";
    };

export function decideToolRetry(params: {
  error: AgentToolError;
  attempt: number;
  policy: RetryPolicy;
  // Budget de temps restant pour le run : un délai de backoff qui dépasserait
  // ce budget n'a pas de sens (l'invocation serait morte avant la tentative).
  remainingMs?: number;
  random?: () => number;
}): RetryDecision {
  if (!params.error.retryable) {
    return { reason: "not_retryable", retry: false };
  }
  if (params.attempt >= params.policy.maxAttempts) {
    return { reason: "max_attempts", retry: false };
  }
  const delayMs = computeRetryDelayMs(
    params.policy,
    params.attempt + 1,
    params.random
  );
  if (params.remainingMs !== undefined && delayMs >= params.remainingMs) {
    return { reason: "delay_exceeds_budget", retry: false };
  }
  return { delayMs, retry: true };
}
