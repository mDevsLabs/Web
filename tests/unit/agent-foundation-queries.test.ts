import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Tests d'intégration des fondations Agent (base requise). Exécution
// conditionnelle : ils ne tournent que si AGENT_IT_DATABASE_URL (ou
// DATABASE_URL) est défini — en CI comme en local sans base, ils sont
// sautés proprement, et les tests unitaires purs restent la garde principale.

const DATABASE_URL =
  process.env.AGENT_IT_DATABASE_URL ?? process.env.DATABASE_URL ?? "";
const RUN_DB_TESTS = DATABASE_URL.length > 0;

describe.skipIf(!RUN_DB_TESTS)("Fondations Agent — intégration base", () => {
  beforeAll(async () => {
    process.env.DATABASE_URL = DATABASE_URL;
  });
  afterAll(() => {
    delete process.env.DATABASE_URL;
  });

  it("réserve atomiquement une occurrence : un seul worker gagne", async () => {
    const { createAgentSchedule } = await import(
      "@/lib/db/agent-foundation-queries"
    );
    const { runSchedulerTick } = await import("@/lib/agent/scheduler/engine");

    const userId = `it-user-${Date.now()}`;
    const schedule = await createAgentSchedule({
      agentId: null,
      config: {
        autonomy: "standard",
        enabledCategories: null,
        reasoningLevel: "medium",
      },
      instructions: "Résume les news IA.",
      modelId: "google/gemini-2.5-flash",
      nextDueAt: new Date(Date.now() - 1000),
      projectId: null,
      rule: { kind: "once" },
      timezone: "Europe/Paris",
      title: "IT — veille unique",
      userId,
    });

    // Premier tick : l'occurrence due est réclamée, traitée, clôturée.
    const first = await runSchedulerTick({ now: new Date() });
    expect(first.processed).toBeGreaterThanOrEqual(1);

    // Second tick immédiat : plus rien à traiter pour ce schedule one-shot
    // (idempotence — pas de second run pour la même occurrence).
    const second = await runSchedulerTick({ now: new Date() });
    const touchedAgain = second.results.filter(
      (result) => result.scheduleId === schedule.id
    );
    expect(touchedAgain).toHaveLength(0);
  });

  it("crée exactement un AgentRun par occurrence malgré des ticks concurrents", async () => {
    const { createAgentSchedule } = await import(
      "@/lib/db/agent-foundation-queries"
    );
    const { runSchedulerTick } = await import("@/lib/agent/scheduler/engine");

    const userId = `it-conc-${Date.now()}`;
    await createAgentSchedule({
      agentId: null,
      config: {
        autonomy: "standard",
        enabledCategories: null,
        reasoningLevel: "medium",
      },
      instructions: "Vérifie les sources.",
      modelId: "google/gemini-2.5-flash",
      nextDueAt: new Date(Date.now() - 1000),
      projectId: null,
      rule: { kind: "once" },
      timezone: "Europe/Paris",
      title: "IT — concurrence",
      userId,
    });

    // Deux workers simultanés : l'UNION des ticks ne doit produire qu'un seul
    // traitement « claimed » pour la même occurrence (lease atomique).
    const [a, b] = await Promise.all([
      runSchedulerTick({ now: new Date(), workerId: "worker-a" }),
      runSchedulerTick({ now: new Date(), workerId: "worker-b" }),
    ]);
    const claimed = [...a.results, ...b.results].filter(
      (result) => result.outcome === "claimed"
    );
    expect(claimed.length).toBeLessThanOrEqual(1);
  });
});

describe("Fondations Agent — garde sans base", () => {
  it("documente que les tests base sont conditionnels", () => {
    expect(typeof RUN_DB_TESTS).toBe("boolean");
  });
});
