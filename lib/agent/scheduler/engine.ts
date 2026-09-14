import "server-only";

import { randomUUID } from "node:crypto";
import type { ScheduleRule } from "@/lib/agent/contracts";
import type {
  AgentOccurrenceRecord,
  AgentScheduleRecord,
} from "@/lib/agent/db-schema";
import { emitAgentBusinessEvent } from "@/lib/agent/events/business";
import { nextOccurrenceFromRule } from "@/lib/agent/scheduler/occurrence";
import {
  claimOccurrence,
  ensureOccurrence,
  finishOccurrence,
  listDueSchedules,
  listExpiredLeaseOccurrences,
  recordScheduleRun,
  startOccurrence,
} from "@/lib/db/agent-foundation-queries";
import { createAgentRun, updateAgentRunStatus } from "@/lib/db/agent-queries";

// Scheduler central des tâches planifiées Agent : indépendant du fournisseur
// d'infrastructure (il n'exige qu'un déclencheur périodique — le tick cron —
// et la base). Invariants :
//  1. une occurrence est réservée ATOMIQUEMENT (lease) : deux workers
//     concurrents ne peuvent jamais exécuter la même occurrence ;
//  2. exactement un AgentRun par occurrence (lien occurrence → run) ;
//  3. la prochaine échéance est recalculée depuis la RÈGLE et le FUSEAU IANA,
//     jamais depuis une suite de dates UTC ;
//  4. une occurrence déjà liée à un run n'en crée jamais un second : après
//     crash, le run existant est repris (avancé) tel quel.

export const SCHEDULE_MAX_ATTEMPTS = 3;

function nextDueForSchedule(
  schedule: AgentScheduleRecord,
  now: Date
): Date | null {
  const computed = nextOccurrenceFromRule(
    schedule.rule,
    schedule.timezone,
    now
  );
  if (computed) {
    return computed;
  }
  // Règle « once » : pas de suite après l'exécution.
  return null;
}

export type ScheduledClaimResult =
  | { outcome: "claimed"; occurrence: AgentOccurrenceRecord }
  | {
      outcome: "already_claimed" | "exhausted";
      occurrence: AgentOccurrenceRecord;
    };

// Réserve une occurrence due : idempotent, sûr en concurrence.
export async function claimDueOccurrence(params: {
  now: Date;
  schedule: AgentScheduleRecord;
  workerId: string;
}): Promise<ScheduledClaimResult | null> {
  const ensured = await ensureOccurrence({
    dueAt: params.schedule.nextDueAt,
    scheduleId: params.schedule.id,
  });
  if (!ensured) {
    return null;
  }
  const claimed = await claimOccurrence({
    now: params.now,
    occurrenceId: ensured.id,
    workerId: params.workerId,
  });
  if (!claimed) {
    return { occurrence: ensured, outcome: "already_claimed" };
  }
  if (claimed.attempt >= SCHEDULE_MAX_ATTEMPTS) {
    await finishOccurrence({
      id: claimed.id,
      now: params.now,
      status: "skipped",
    });
    return { occurrence: claimed, outcome: "exhausted" };
  }
  return { occurrence: claimed, outcome: "claimed" };
}

// Crée exactement un AgentRun pour une occurrence réclamée : si l'occurrence
// porte déjà un runId (reprise après crash), le run existant est retourné —
// jamais recréé.
export async function createOrReuseRunForOccurrence(params: {
  occurrence: AgentOccurrenceRecord;
  schedule: AgentScheduleRecord;
}): Promise<string> {
  if (params.occurrence.runId) {
    return params.occurrence.runId;
  }
  const run = await createAgentRun({
    autonomy: params.schedule.config.autonomy,
    budget: {
      maxDurationMs: 240_000,
      maxRetries: 2,
      maxSteps: 12,
      maxToolCalls: 24,
    },
    chatId: params.schedule.projectId ?? params.schedule.id,
    messageId: null,
    model: params.schedule.modelId,
    plan: null,
    reasoningLevel: params.schedule.config.reasoningLevel,
    status: "queued",
    toolPolicySnapshot: {},
    userId: params.schedule.userId,
  });
  return run.id;
}

// Traitement d'une échéance due, du point de vue d'un worker :
//  - réservation atomique de l'occurrence ;
//  - création (ou reprise) du run lié ;
//  - calcul de la prochaine échéance depuis la règle + fuseau ;
//  - clôture de l'occurrence.
// La reprise crash-safe est assurée par la lease : si le worker meurt après
// avoir créé le run, l'occurrence reste liée au run et ne sera jamais dupliquée.
export async function processDueSchedule(params: {
  now: Date;
  schedule: AgentScheduleRecord;
  workerId: string;
}): Promise<
  | { outcome: "claimed" | "already_claimed" | "exhausted"; runId?: string }
  | { outcome: "error"; message: string }
> {
  const claim = await claimDueOccurrence({
    now: params.now,
    schedule: params.schedule,
    workerId: params.workerId,
  });
  if (!claim) {
    return { message: "Occurrence introuvable.", outcome: "error" };
  }
  if (claim.outcome !== "claimed") {
    return { outcome: claim.outcome };
  }

  const { occurrence } = claim;

  try {
    const runId = await createOrReuseRunForOccurrence({
      occurrence,
      schedule: params.schedule,
    });
    await startOccurrence({ id: occurrence.id, now: params.now, runId });

    // Lien occurrence → run persisté : le run appartient désormais à la
    // conversation (source de vérité) et l'occurrence ne redémarrera jamais
    // un second run.
    await updateAgentRunStatus({
      id: runId,
      status: "queued",
    });

    const nextDue = nextDueForSchedule(params.schedule, params.now);
    await recordScheduleRun({
      id: params.schedule.id,
      lastRunAt: params.now,
      nextDueAt: nextDue ?? params.schedule.nextDueAt,
    });
    if (!nextDue) {
      // One-shot terminé : suppression logique (historique conservé).
      await recordScheduleRun({
        id: params.schedule.id,
        lastRunAt: params.now,
        nextDueAt: params.schedule.nextDueAt,
      });
    }

    await finishOccurrence({
      id: occurrence.id,
      now: params.now,
      status: "completed",
    });

    emitAgentBusinessEvent({
      chatId: runId,
      model: params.schedule.modelId,
      runId,
      type: "run_started",
    });

    return { outcome: "claimed", runId };
  } catch (error) {
    const message =
      error instanceof Error ? error.message.slice(0, 300) : "Erreur inconnue.";
    await finishOccurrence({
      id: occurrence.id,
      now: params.now,
      status: "failed",
    }).catch(() => {});
    return { message, outcome: "error" };
  }
}

// Tick du scheduler : à appeler périodiquement (cron). Traite les échéances
// dues ET les occurrences à la lease expirée (reprise après crash).
export async function runSchedulerTick(params: {
  now?: Date;
  workerId?: string;
}): Promise<{
  processed: number;
  results: Array<{ outcome: string; runId?: string; scheduleId: string }>;
}> {
  const now = params.now ?? new Date();
  const workerId = params.workerId ?? `worker-${randomUUID().slice(0, 8)}`;
  const results: Array<{
    outcome: string;
    runId?: string;
    scheduleId: string;
  }> = [];

  const due = await listDueSchedules({ now });
  for (const schedule of due) {
    const result = await processDueSchedule({
      now,
      schedule,
      workerId,
    });
    results.push({
      outcome: result.outcome,
      runId: result.outcome === "claimed" ? result.runId : undefined,
      scheduleId: schedule.id,
    });
  }

  // Reprise après crash : occurrences à la lease expirée, jamais doublement.
  const expired = await listExpiredLeaseOccurrences({ now });
  for (const occurrence of expired) {
    // L'occurrence déjà liée à un run est simplement replacée en pending :
    // son run existe (source de vérité) et sera avancé par un tick suivant ;
    // une occurrence non liée redevient éligible à un nouveau claim.
    const reclaimed = await claimOccurrence({
      now,
      occurrenceId: occurrence.id,
      workerId,
    });
    if (reclaimed && !reclaimed.runId) {
      await finishOccurrence({
        id: reclaimed.id,
        now,
        status: "failed",
      }).catch(() => {});
    }
  }

  return { processed: results.length, results };
}
