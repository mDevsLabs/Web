import { describe, expect, it } from "vitest";
import {
  addNormalizedUsage,
  emptyNormalizedUsage,
  estimateRunCost,
  normalizeProviderUsage,
} from "@/lib/agent/usage";

describe("Usage provider normalisé", () => {
  it("normalise les deux conventions de nommage du SDK", () => {
    const usage = normalizeProviderUsage(
      { cachedInputTokens: 25, completionTokens: 40, promptTokens: 100 },
      { latencyMs: 850, provider: "google" }
    );
    expect(usage.inputTokens).toBe(100);
    expect(usage.outputTokens).toBe(40);
    expect(usage.totalTokens).toBe(140);
    expect(usage.cacheReadTokens).toBe(25);
    expect(usage.provider).toBe("google");
    expect(usage.latencyMs).toBe(850);
  });

  it("ignore les valeurs non numériques et négatives", () => {
    const usage = normalizeProviderUsage({
      inputTokens: "beaucoup",
      outputTokens: -5,
    });
    expect(usage.inputTokens).toBe(0);
    expect(usage.outputTokens).toBe(0);
    expect(usage.totalTokens).toBe(0);
  });

  it("additionne les usages de plusieurs étapes", () => {
    const a = normalizeProviderUsage({ inputTokens: 10, outputTokens: 5 });
    const b = normalizeProviderUsage({ inputTokens: 7, outputTokens: 3 });
    const total = addNormalizedUsage(a, b);
    expect(total.inputTokens).toBe(17);
    expect(total.outputTokens).toBe(8);
    expect(total.totalTokens).toBe(25);
    expect(total.retries).toBe(0);
  });

  it("propage le nombre de retries et les unités de calcul", () => {
    const usage = normalizeProviderUsage(
      { inputTokens: 1 },
      { provider: "openai", retries: 2 }
    );
    usage.computeUnits = 3;
    const merged = addNormalizedUsage(usage, emptyNormalizedUsage());
    expect(merged.retries).toBe(2);
    expect(merged.computeUnits).toBe(3);
  });

  it("refuse d'estimer un coût sans tarifs configurés", () => {
    expect(estimateRunCost()).toBeNull();
  });
});
