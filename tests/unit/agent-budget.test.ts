import { describe, expect, it, vi } from "vitest";

import * as budgetModule from "@/lib/agent/budget";
import {
  AGENT_BUDGET_DEFAULT,
  AGENT_BUDGET_RESTRICTED,
  resolveAgentExecutionBudget,
} from "@/lib/agent/budget";
import { DEFAULT_AGENT_FLAGS } from "@/lib/agent/flags";
import { checkAgentAccess } from "@/lib/agent/gate";
import { PAID_TIERS } from "@/lib/auth/plan";
import type { MaiUser } from "@/lib/auth/session";
import type { ChatAuth } from "@/lib/chat/auth";
import {
  TECHNICAL_TIMEOUTS_MS,
  TIER_RUN_LIMIT_MS,
  tierCapabilities,
  tierRunLimit,
} from "@/lib/plans/tier-capabilities";

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

describe("limites PRODUIT par forfait (source unique tier-capabilities)", () => {
  it("Plus s'arrête à 1 heure", () => {
    expect(TIER_RUN_LIMIT_MS.plus).toBe(60 * 60 * 1000);
    expect(tierRunLimit("plus").limitMs).toBe(60 * 60 * 1000);
  });

  it("Pro s'arrête à 3 heures", () => {
    expect(TIER_RUN_LIMIT_MS.pro).toBe(3 * 60 * 60 * 1000);
    expect(tierRunLimit("pro").limitMs).toBe(3 * 60 * 60 * 1000);
  });

  it("Max n'a aucune limite produit globale", () => {
    expect(TIER_RUN_LIMIT_MS.max).toBeNull();
    expect(tierRunLimit("max").limitMs).toBeNull();
  });

  it("la table des limites couvre exactement les forfaits payants", () => {
    expect(Object.keys(TIER_RUN_LIMIT_MS).sort()).toEqual(
      [...PAID_TIERS].sort()
    );
  });
});

describe("budget d'exécution (plafond technique vs limite produit)", () => {
  it("Plus reçoit 1 h de limite produit et le plafond technique d'invocation", () => {
    const budget = resolveAgentExecutionBudget({ tier: "plus" });
    expect(budget.productLimitMs).toBe(60 * 60 * 1000);
    expect(budget.maxDurationMs).toBe(TECHNICAL_TIMEOUTS_MS.invocation);
  });

  it("Pro reçoit 3 h, Max aucune limite produit", () => {
    expect(resolveAgentExecutionBudget({ tier: "pro" }).productLimitMs).toBe(
      3 * 60 * 60 * 1000
    );
    expect(
      resolveAgentExecutionBudget({ tier: "max" }).productLimitMs
    ).toBeNull();
  });

  it("le plafond technique d'invocation ne dépend pas du forfait", () => {
    const invocations = ["plus", "pro", "max"].map(
      (tier) => resolveAgentExecutionBudget({ tier }).maxDurationMs
    );
    expect(new Set(invocations)).toEqual(
      new Set([TECHNICAL_TIMEOUTS_MS.invocation])
    );
    expect(TECHNICAL_TIMEOUTS_MS.invocation).toBe(
      AGENT_BUDGET_DEFAULT.maxDurationMs
    );
  });

  it("les timeouts techniques sont identiques pour tous les forfaits", () => {
    const perTier = ["plus", "pro", "max"].map(
      (tier) => tierCapabilities(tier).technicalTimeoutsMs
    );
    for (const timeouts of perTier) {
      expect(timeouts).toEqual(TECHNICAL_TIMEOUTS_MS);
      expect(timeouts.modelCall).toBeGreaterThan(0);
      expect(timeouts.network).toBeGreaterThan(0);
      expect(timeouts.toolExecution).toBeGreaterThan(0);
    }
  });

  it("Free garde un budget minuscule et borné (garde amont)", () => {
    const budget = resolveAgentExecutionBudget({ tier: "free" });
    expect(budget.maxSteps).toBeLessThanOrEqual(3);
    expect(budget.maxToolCalls).toBeLessThanOrEqual(4);
    expect(budget.productLimitMs).toBeNull();
  });

  it("un tier inconnu n'élève jamais le budget", () => {
    expect(resolveAgentExecutionBudget({ tier: "enterprise" })).toEqual(
      AGENT_BUDGET_RESTRICTED
    );
  });
});

// Garde-fou de contrat : les tiers autorisés à Agent sont exactement ceux qui
// ont une limite produit — la limite de durée et le contrôle d'accès partagent
// la même interprétation du tier. Si les deux divergent un jour, ce test
// échoue (plus de « Plus pour le quota, Free pour l'accès »).
describe("cohérence accès Agent / limites de durée", () => {
  it("les tiers autorisés à Agent sont exactement les forfaits payants", () => {
    for (const tier of ["free", "plus", "pro", "max", "bogus"] as const) {
      const allowed = checkAgentAccess(makeAuth(tier)).allowed;
      expect(allowed).toBe((PAID_TIERS as readonly string[]).includes(tier));
      expect(tierCapabilities(tier).isPaid).toBe(allowed);
    }
  });

  // Garde-fou anti-régression : les tables de limites produit et de timeouts
  // d'outil dupliquées dans budget.ts ont été supprimées. Si l'une réapparaît,
  // la source de vérité redevient multiple et ce test échoue.
  it("aucune constante de durée parallèle ne subsiste dans budget.ts", () => {
    const exports = Object.keys(budgetModule);
    expect(exports).not.toContain("AGENT_RUN_DURATION_LIMITS");
    expect(exports).not.toContain("resolveAgentRunDurationLimit");
    // Le nom historique peut subsister comme simple alias, mais sa valeur doit
    // venir de la source unique (aucun timeout dupliqué).
    expect(budgetModule.AGENT_TOOL_TIMEOUT_MS).toBe(
      TECHNICAL_TIMEOUTS_MS.toolExecution
    );
  });

  it("les flags par défaut laissent Agent activé (le gate décide, pas l'UI)", () => {
    expect(DEFAULT_AGENT_FLAGS["agent.enabled"]).toBe(true);
  });
});
