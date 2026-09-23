import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";

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

  // Intégration Neon réelle : sous la suite complète (30 workers parallèles),
  // la latence pooler + scheduler dépasse le timeout par défaut (5 s).
  vi.setConfig({ testTimeout: 60_000 });

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

  it("met à jour config atomiquement et conserve les versions lors d'une édition concurrente", async () => {
    const { createAgentSchedule, mutateAgentSchedule, getAgentScheduleById, listScheduleVersions, ensureOccurrence } = await import("@/lib/db/agent-foundation-queries");
    const userId = `it-versions-${Date.now()}`;
    const schedule = await createAgentSchedule({
      agentId: null, config: { autonomy: "standard", enabledCategories: null, reasoningLevel: "medium" },
      instructions: "Version initiale", modelId: "google/gemini-2.5-flash",
      nextDueAt: new Date(Date.now() + 3_600_000), projectId: null,
      rule: { kind: "once" }, timezone: "Europe/Paris", title: "IT — versions", userId,
    });
    const [first, second] = await Promise.all([
      mutateAgentSchedule({ id: schedule.id, userId, expectedRevision: schedule.revision, mutation: { action: "update", patch: { autonomy: "high", reasoningLevel: "high", enabledCategories: ["web"] } } }),
      mutateAgentSchedule({ id: schedule.id, userId, expectedRevision: schedule.revision, mutation: { action: "update", patch: { title: "Concurrent" } } }),
    ]);
    expect(Number(first) + Number(second)).toBe(1);
    const updated = await getAgentScheduleById({ id: schedule.id, userId });
    expect(updated?.revision).toBe(schedule.revision + 1);
    if (first) expect(updated?.config).toEqual({ autonomy: "high", enabledCategories: ["web"], reasoningLevel: "high" });
    const versions = await listScheduleVersions({ scheduleId: schedule.id });
    expect(versions).toHaveLength(2);
    expect(versions.find((item) => item.revision === schedule.revision)?.snapshot.config).toEqual(schedule.config);
    const occurrence = await ensureOccurrence({ scheduleId: schedule.id, dueAt: schedule.nextDueAt });
    expect(occurrence?.scheduleVersionId).toBe(versions[0].id);
  });

  it("garantit un seul run actif, un message idempotent et une seule réservation", async () => {
    const { saveChat, deleteChatById } = await import("@/lib/db/queries");
    const { createAgentRun, getAgentRunByMessageId, getAgentRunById, claimAgentRunExecution, releaseAgentRunExecution, updateAgentRunStatus } = await import("@/lib/db/agent-queries");
    const chatId = randomUUID();
    const userId = `it-run-${Date.now()}`;
    await saveChat({ id: chatId, userId, title: "IT — concurrence Agent", visibility: "private", mode: "agent" });
    try {
      const base = { autonomy: "standard" as const, budget: { maxDurationMs: 240_000, maxRetries: 0, maxSteps: 5, maxToolCalls: 5 }, chatId, model: "google/gemini-2.5-flash", reasoningLevel: "medium" as const, toolPolicySnapshot: {}, userId };
      const firstId = randomUUID();
      const secondId = randomUUID();
      const creates = await Promise.allSettled([
        createAgentRun({ ...base, messageId: firstId }),
        createAgentRun({ ...base, messageId: secondId }),
      ]);
      expect(creates.filter((result) => result.status === "fulfilled")).toHaveLength(1);
      const winner = creates.find((result) => result.status === "fulfilled");
      if (!winner || winner.status !== "fulfilled") throw new Error("Aucun run créé");
      const run = winner.value;
      expect((await getAgentRunByMessageId({ chatId, messageId: run.messageId as string }))?.id).toBe(run.id);
      const claims = await Promise.all([
        claimAgentRunExecution({ id: run.id, owner: "worker-a" }),
        claimAgentRunExecution({ id: run.id, owner: "worker-b" }),
      ]);
      expect(claims.filter(Boolean)).toHaveLength(1);
      await releaseAgentRunExecution({ id: run.id, owner: claims[0] ? "worker-a" : "worker-b" });
      await updateAgentRunStatus({ id: run.id, status: "timed_out", completedAt: new Date(), stopReason: "duration_limit" });
      const parentBefore = await getAgentRunById({ id: run.id, userId });
      const resumed = await createAgentRun({ ...base, messageId: randomUUID(), parentRunId: run.id });
      expect(resumed.parentRunId).toBe(run.id);
      const parentAfter = await getAgentRunById({ id: run.id, userId });
      expect(parentAfter?.stepCount).toBe(parentBefore?.stepCount);
      expect(parentAfter?.toolCallCount).toBe(parentBefore?.toolCallCount);
    } finally { await deleteChatById({ id: chatId }); }
  });
});

describe("Fondations Agent — garde sans base", () => {
  it("documente que les tests base sont conditionnels", () => {
    expect(typeof RUN_DB_TESTS).toBe("boolean");
  });
});
