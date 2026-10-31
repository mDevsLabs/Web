import { describe, expect, it } from "vitest";
import {
  computeRetryDelayMs,
  DEFAULT_TOOL_RETRY_POLICY,
  decideToolRetry,
} from "@/lib/agent/retry";
import { AgentToolError, toAgentToolError } from "@/lib/agent/tool-errors";

function transientError(): AgentToolError {
  return new AgentToolError({
    category: "transient",
    code: "tool_timeout",
    message: "Délai dépassé.",
  });
}

function permanentError(): AgentToolError {
  return new AgentToolError({
    category: "permanent",
    code: "tool_failed",
    message: "Échec définitif.",
  });
}

describe("Politique de retry des outils", () => {
  it("produit un backoff exponentiel borné avec jitter plein", () => {
    const delays = [1, 2, 3].map((attempt) =>
      computeRetryDelayMs(DEFAULT_TOOL_RETRY_POLICY, attempt, () => 1)
    );
    // Jitter plein : à random=1, on obtient le plafond brut de chaque palier.
    // attempt=2 est le premier retry (délai de base), puis doublement.
    expect(delays[0]).toBe(1000);
    expect(delays[1]).toBe(1000);
    expect(delays[2]).toBe(2000);

    const capped = computeRetryDelayMs(
      { ...DEFAULT_TOOL_RETRY_POLICY, baseDelayMs: 10_000 },
      6,
      () => 1
    );
    expect(capped).toBe(DEFAULT_TOOL_RETRY_POLICY.maxDelayMs);
  });

  it("retente une erreur transitoire sous le maximum de tentatives", () => {
    const decision = decideToolRetry({
      attempt: 1,
      error: transientError(),
      policy: DEFAULT_TOOL_RETRY_POLICY,
      random: () => 0,
    });
    expect(decision).toEqual({ delayMs: 0, retry: true });
  });

  it("refuse un retry au-delà du maximum de tentatives", () => {
    const decision = decideToolRetry({
      attempt: DEFAULT_TOOL_RETRY_POLICY.maxAttempts,
      error: transientError(),
      policy: DEFAULT_TOOL_RETRY_POLICY,
    });
    expect(decision).toEqual({ reason: "max_attempts", retry: false });
  });

  it("refuse un retry pour une erreur non transitoire", () => {
    const decision = decideToolRetry({
      attempt: 1,
      error: permanentError(),
      policy: DEFAULT_TOOL_RETRY_POLICY,
    });
    expect(decision).toEqual({ reason: "not_retryable", retry: false });
  });

  it("refuse un retry dont le délai dépasserait le budget restant", () => {
    const decision = decideToolRetry({
      attempt: 1,
      error: transientError(),
      policy: { baseDelayMs: 5000, maxAttempts: 3, maxDelayMs: 15_000 },
      random: () => 1,
      remainingMs: 2000,
    });
    expect(decision).toEqual({ reason: "delay_exceeds_budget", retry: false });
  });

  it("refuse permission, quota et arguments invalides", () => {
    const permission = new AgentToolError({
      category: "permission",
      code: "permission_denied",
      message: "Action refusée.",
    });
    const quota = toAgentToolError(new Error("quota_exceeded secret"));
    const invalid = new AgentToolError({
      category: "invalid_arguments",
      code: "invalid_input",
      message: "Arguments invalides.",
    });
    for (const error of [permission, quota, invalid]) {
      expect(
        decideToolRetry({
          attempt: 1,
          error,
          policy: DEFAULT_TOOL_RETRY_POLICY,
        })
      ).toEqual({ reason: "not_retryable", retry: false });
    }
    expect(quota.toSafeShape().message).not.toContain("secret");
  });

  it("attend au moins le Retry-After, sauf s'il dépasse le budget", () => {
    const error = new AgentToolError({
      category: "transient",
      code: "tool_failed",
      message: "Limité.",
      retryAfterMs: 4000,
    });
    const waited = decideToolRetry({
      attempt: 1,
      error,
      policy: DEFAULT_TOOL_RETRY_POLICY,
      random: () => 0,
    });
    expect(waited).toEqual({ delayMs: 4000, retry: true });

    const refused = decideToolRetry({
      attempt: 1,
      error,
      policy: DEFAULT_TOOL_RETRY_POLICY,
      random: () => 0,
      remainingMs: 2000,
    });
    expect(refused).toEqual({
      reason: "delay_exceeds_budget",
      retry: false,
    });
  });
});
