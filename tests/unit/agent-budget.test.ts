import { describe, expect, it, vi } from "vitest";

import {
  AGENT_RUN_DURATION_LIMITS,
  resolveAgentExecutionBudget,
  resolveAgentRunDurationLimit,
} from "@/lib/agent/budget";
import { DEFAULT_AGENT_FLAGS } from "@/lib/agent/flags";
import { checkAgentAccess } from "@/lib/agent/gate";
import { PAID_TIERS } from "@/lib/auth/plan";
import type { MaiUser } from "@/lib/auth/session";
import type { ChatAuth } from "@/lib/chat/auth";

vi.mock("@/lib/ai/registry", () => ({
  getModelEntry: (id: string) => ({
    capabilities: { tools: true },
    id,
    name: id,
  }),
  isModelAllowedForUser: () => true,
}));

function makeAuth(tier: string): ChatAuth {
  const maiUser: MaiUser = {
    email: "u@example.com",
    id: "u-1",
    limit: 10,
    tier,
    tokensUsed: 0,
    username: "u",
  };
  return {
    isFreeUser: tier === "free",
    maiUser,
    sessionToken: "t",
    userId: "u-1",
  };
}

describe("resolveAgentRunDurationLimit (plafonds produit par forfait)", () => {
  it("Plus s'arrête à 1 heure", () => {
    expect(resolveAgentRunDurationLimit("plus")?.maxRunDurationMs).toBe(
      60 * 60 * 1000
    );
  });

  it("Pro s'arrête à 3 heures", () => {
    expect(resolveAgentRunDurationLimit("pro")?.maxRunDurationMs).toBe(
      3 * 60 * 60 * 1000
    );
  });

  it("Max n'a pas de plafond produit global (null)", () => {
    expect(resolveAgentRunDurationLimit("max")?.maxRunDurationMs).toBeNull();
  });

  it("retourne null pour Free et pour un tier inconnu", () => {
    expect(resolveAgentRunDurationLimit("free")).toBeNull();
    expect(resolveAgentRunDurationLimit("enterprise")).toBeNull();
    expect(resolveAgentRunDurationLimit("")).toBeNull();
  });

  it("expose des libellés stables et cohérents", () => {
    expect(AGENT_RUN_DURATION_LIMITS.plus.label).toBe("Plus");
    expect(AGENT_RUN_DURATION_LIMITS.pro.label).toBe("Pro");
    expect(AGENT_RUN_DURATION_LIMITS.max.label).toBe("Max");
  });
});

describe("resolveAgentExecutionBudget (même source de vérité que l'accès Agent)", () => {
  it("Free garde un budget minuscule et borné (garde amont)", () => {
    const budget = resolveAgentExecutionBudget({ tier: "free" });
    expect(budget.maxSteps).toBeLessThanOrEqual(3);
    expect(budget.maxToolCalls).toBeLessThanOrEqual(4);
  });

  it("un tier inconnu n'élève jamais le budget", () => {
    expect(resolveAgentExecutionBudget({ tier: "enterprise" }).maxSteps).toBe(
      resolveAgentExecutionBudget({ tier: "free" }).maxSteps
    );
  });

  it("Plus et Pro conservent le budget technique Alpha (borné par le plafond produit)", () => {
    expect(resolveAgentExecutionBudget({ tier: "plus" }).maxDurationMs).toBe(
      240_000
    );
    expect(resolveAgentExecutionBudget({ tier: "pro" }).maxDurationMs).toBe(
      240_000
    );
  });

  it("Max n'a pas de plafond produit : le budget reste le budget technique", () => {
    expect(resolveAgentExecutionBudget({ tier: "max" }).maxDurationMs).toBe(
      240_000
    );
  });
});

// Garde-fou de contrat : les tiers autorisés à Agent sont exactement ceux qui
// ont un plafond produit — la limite de durée et le contrôle d'accès partagent
// la même interprétation du tier. Si un jour les deux divergent, ce test
// échoue (plus de « Plus pour le quota, Free pour l'accès »).
describe("cohérence accès Agent / limites de durée", () => {
  it("les tiers autorisés à Agent sont exactement les tiers avec plafond produit", () => {
    for (const tier of ["free", "plus", "pro", "max", "bogus"] as const) {
      const allowed = checkAgentAccess(makeAuth(tier)).allowed;
      const hasCap = resolveAgentRunDurationLimit(tier) !== null;
      expect(allowed).toBe((PAID_TIERS as readonly string[]).includes(tier));
      expect(allowed).toBe(hasCap);
    }
  });

  it("la table des plafonds couvre exactement les forfaits payants", () => {
    expect(Object.keys(AGENT_RUN_DURATION_LIMITS).sort()).toEqual(
      [...PAID_TIERS].sort()
    );
  });

  it("les flags par défaut laissent Agent activé (le gate décide, pas l'UI)", () => {
    expect(DEFAULT_AGENT_FLAGS["agent.enabled"]).toBe(true);
  });
});
