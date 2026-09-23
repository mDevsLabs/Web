import "server-only";

import { randomUUID } from "node:crypto";
import type {
  AgentOccurrenceRecord,
  AgentScheduleRecord,
} from "@/lib/agent/db-schema";
import { executeScheduledRun } from "@/lib/agent/scheduler/execute";
import { nextOccurrenceFromRule } from "@/lib/agent/scheduler/occurrence";
import {
  claimOccurrence,
  deactivateScheduleAfterRun,
  ensureOccurrence,
  finishOccurrence,
  getOccurrenceById,
  listDueSchedules,
  listExpiredLeaseOccurrences,
  listWaitingOccurrences,
  getScheduleVersionById,
  getAgentScheduleForScheduler,
  getWaitingRequestExpiry,
  recordScheduleRun,
  resetOccurrenceToPending,
  setAgentScheduleError,
  startOccurrence,
  waitOccurrence,
} from "@/lib/db/agent-foundation-queries";
import { getAgentRunById, updateAgentRunStatus } from "@/lib/db/agent-queries";
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

export function isWaitingRequestExpired(params: {
  expiresAt: Date | null;
  now: Date;
  runStatus: string;
}): boolean {
  return (params.runStatus === "waiting_for_approval" || params.runStatus === "waiting_for_user")
    && params.expiresAt !== null
    && params.expiresAt.getTime() <= params.now.getTime();
}

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

// Traitement d'une échéance due, du point de vue d'un worker :
//  - réservation atomique de l'occurrence ;
//  - exécution du run par le MÊME AgentRuntime que l'API interactive
//    (lib/agent/scheduler/execute.ts) ;
//  - calcul de la prochaine échéance depuis la règle + fuseau ;
//  - clôture de l'occurrence, sauf si le run attend une résolution
//    (approbation / réponse utilisateur) : l'occurrence reste alors liée au
//    run et sous lease — sa résolution relira l'occurrence et reprendra le
//    même run, sans jamais en créer un second.
// La reprise crash-safe est assurée par la lease : si le worker meurt pendant
// l'exécution, la lease expire, l'occurrence est re-réclamée au tick suivant
// et le run existant est avancé (jamais dupliqué).
export async function processDueSchedule(params: {
  timeoutMs?: number;
  now: Date;
  schedule: AgentScheduleRecord;
  workerId: string;
}): Promise<
  | {
      outcome:
        | "claimed"
        | "already_claimed"
        | "awaiting_resolution"
        | "exhausted";
      runId?: string;
    }
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
  const version = occurrence.scheduleVersionId
    ? await getScheduleVersionById({ id: occurrence.scheduleVersionId, scheduleId: params.schedule.id })
    : null;
  const executionSchedule = version
    ? { ...params.schedule, ...version.snapshot, nextDueAt: params.schedule.nextDueAt }
    : params.schedule;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort("scheduler_deadline"), params.timeoutMs ?? 240_000);
  let hardTimer: ReturnType<typeof setTimeout> | null = null;

  try {
    // Exécution réelle par le runtime Agent. Cette étape crée (ou reprend) le
    // run, la conversation, persiste steps, checkpoints et messages, et rend
    // le statut final relu depuis la base.
    const execution = await Promise.race([
      executeScheduledRun({ abortSignal: controller.signal, occurrence, schedule: executionSchedule }),
      new Promise<never>((_, reject) => {
        hardTimer = setTimeout(() => {
          controller.abort("scheduler_deadline");
          reject(new Error("Délai maximum du run planifié dépassé."));
        }, (params.timeoutMs ?? 240_000) + 20_000);
      }),
    ]);

    if (execution.outcome === "already_done") {
      // Crash après exécution, avant clôture : le travail est réalisé.
      await startOccurrence({
        id: occurrence.id,
        now: params.now,
        runId: execution.runId,
      });
      await finishOccurrence({
        id: occurrence.id,
        now: params.now,
        status: execution.finalStatus === "completed" ? "completed" : "failed",
      });
      if (execution.finalStatus === "completed") {
        const nextDue = nextDueForSchedule(params.schedule, params.now);
        await closeScheduleAfterRun({ nextDue, now: params.now, schedule: params.schedule });
      } else {
        await setAgentScheduleError({ id: params.schedule.id, expectedRevision: params.schedule.revision, lastError: `Run planifié terminé avec ${execution.finalStatus}.` });
      }
      return { outcome: "claimed", runId: execution.runId };
    }

    if (execution.outcome === "no_tools") {
      if (execution.runId) {
        await startOccurrence({
          id: occurrence.id,
          now: params.now,
          runId: execution.runId,
        });
      }
      await finishOccurrence({
        id: occurrence.id,
        now: params.now,
        status: "skipped",
      });
      await setAgentScheduleError({
        id: params.schedule.id,
        expectedRevision: params.schedule.revision,
        lastError:
          "Aucun outil disponible pour cette tâche (réglages ou forfait).",
      });
      return { outcome: "claimed", runId: execution.runId ?? undefined };
    }

    if (execution.outcome === "awaiting_resolution") {
      await waitOccurrence({ id: occurrence.id, runId: execution.runId });
      // Attente persistée sans lease : aucune échéance suivante ne sera
      // réclamée avant résolution ou expiration de la demande.
      return { outcome: "awaiting_resolution", runId: execution.runId };
    }

    // Run terminé (completed, failed, timed_out, cancelled) : occurrence
    // clôturée, échéance suivante recalculée depuis la règle + fuseau.
    const failed = execution.finalStatus !== "completed";
    await finishOccurrence({
      id: occurrence.id,
      now: params.now,
      status: failed ? "failed" : "completed",
    });
    const nextDue = nextDueForSchedule(params.schedule, params.now);
    await closeScheduleAfterRun({
      nextDue,
      now: params.now,
      schedule: params.schedule,
    });
    if (failed) {
      await setAgentScheduleError({
        id: params.schedule.id,
        expectedRevision: params.schedule.revision,
        lastError: `Dernier run en échec (${execution.finalStatus}).`,
      });
    }
    return { outcome: "claimed", runId: execution.runId };
  } catch (error) {
    const message =
      error instanceof Error ? error.message.slice(0, 300) : "Erreur inconnue.";
    // Crash / erreur d'exécution : l'occurrence redevient pending si elle ne
    // porte pas encore de run (elle sera re-réclamée au prochain tick) ; si
    // elle porte un run, elle reste liée (reprise du même run). Le compteur
    // `attempt` a été incrémenté au claim : les échecs répétés finiront par
    // être bornés par SCHEDULE_MAX_ATTEMPTS.
    const fresh = await getOccurrenceById({ id: occurrence.id }).catch(
      () => null
    );
    if (fresh && !fresh.runId && fresh.attempt >= SCHEDULE_MAX_ATTEMPTS) {
      await finishOccurrence({
        id: occurrence.id,
        now: params.now,
        status: "failed",
      }).catch(() => {});
      await setAgentScheduleError({
        id: params.schedule.id,
        expectedRevision: params.schedule.revision,
        lastError: message,
      });
    } else if (fresh?.runId && controller.signal.aborted) {
      // Le run reste lié à l'occurrence et sa lease expire naturellement.
      // Le runtime reçoit l'annulation et finalise son checkpoint en arrière-plan.
      console.warn(JSON.stringify({ event: "agent_schedule_watchdog", occurrenceId: occurrence.id, runId: fresh.runId, attempt: fresh.attempt }));
    } else {
      await resetOccurrenceToPending({ id: occurrence.id }).catch(() => {});
    }
    return { message, outcome: "error" };
  } finally {
    clearTimeout(timer);
    if (hardTimer) clearTimeout(hardTimer);
  }
}

// Clôture du schedule après un run terminé : récurrence → nextDueAt recalculé
// ; one-shot → désactivation (paused, historique conservé). Jamais de
// repoll d'une échéance passée : listDueSchedules filtre sur status active.
async function closeScheduleAfterRun(params: {
  nextDue: Date | null;
  now: Date;
  schedule: AgentScheduleRecord;
}): Promise<void> {
  if (params.nextDue) {
    await recordScheduleRun({
      id: params.schedule.id,
      lastRunAt: params.now,
      nextDueAt: params.nextDue,
      expectedRevision: params.schedule.revision,
    });
    return;
  }
  await deactivateScheduleAfterRun({
    id: params.schedule.id,
    lastRunAt: params.now,
    expectedRevision: params.schedule.revision,
  });
}

// Tick du scheduler : à appeler périodiquement (cron). Traite les échéances
// dues ET les occurrences à la lease expirée (reprise après crash). Un
// timeout de tick (le budget d'invocation + une marge) borne chaque run :
// le cron ne peut pas rester bloqué sur un run en attente externe.
const TICK_TIMEOUT_MS = 285_000;
const TICK_RUN_TIMEOUT_MS = 240_000;

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
  const deadline = Date.now() + TICK_TIMEOUT_MS;

  for (const occurrence of await listWaitingOccurrences({})) {
    if (Date.now() >= deadline - 5_000) break;
    if (!occurrence.runId) continue;
    const schedule = await getAgentScheduleForScheduler(occurrence.scheduleId);
    if (!schedule) continue;
    const run = await getAgentRunById({ id: occurrence.runId, userId: schedule.userId });
    if (!run) continue;
    if (["completed", "failed", "cancelled", "timed_out"].includes(run.status)) {
      await finishOccurrence({ id: occurrence.id, now, status: run.status === "completed" ? "completed" : "failed" });
      await closeScheduleAfterRun({ nextDue: nextDueForSchedule(schedule, now), now, schedule });
    } else if (run.status === "waiting_for_approval" || run.status === "waiting_for_user") {
      const expiresAt = await getWaitingRequestExpiry({
        kind: run.status === "waiting_for_approval" ? "approval" : "user",
        runId: run.id,
      });
      if (isWaitingRequestExpired({ expiresAt, now, runStatus: run.status })) {
        const expired = await updateAgentRunStatus({ id: run.id, status: "timed_out", completedAt: now, stopReason: "user_request_expired", error: "Demande utilisateur expirée après 24 heures.", onlyIfActive: true });
        if (expired) {
          await finishOccurrence({ id: occurrence.id, now, status: "failed" });
          await setAgentScheduleError({ id: schedule.id, lastError: "Demande utilisateur expirée après 24 heures : tâche mise en pause." });
          console.warn(JSON.stringify({ event: "agent_schedule_wait_expired", occurrenceId: occurrence.id, runId: run.id, scheduleId: schedule.id }));
        }
      }
    }
  }

  const due = await listDueSchedules({ now });
  for (const schedule of due) {
    if (Date.now() >= deadline - 5_000) break;
    const result = await processDueSchedule({
      now,
      schedule,
      workerId,
      timeoutMs: Math.min(TICK_RUN_TIMEOUT_MS, deadline - Date.now() - 5_000),
    });
    results.push({
      outcome: result.outcome,
      runId:
        result.outcome === "claimed" || result.outcome === "awaiting_resolution"
          ? result.runId
          : undefined,
      scheduleId: schedule.id,
    });
  }

  // Reprise après crash : occurrences à la lease expirée. Celles qui portent
  // déjà un run ont été avancées par processDueSchedule via le run actif du
  // chat — elles sont replacées en pending pour être re-traitées proprement
  // (le run actif, s'il existe, sera avancé sans duplication). Celles sans
  // run redeviennent éligibles à un nouveau claim (jamais perdues, jamais
  // doublonnées : clé unique + compteur attempt).
  if (Date.now() < deadline - 5_000) {
    const expired = await listExpiredLeaseOccurrences({ now });
    for (const occurrence of expired) {
      if (Date.now() >= deadline - 5_000) break;
      await resetOccurrenceToPending({ id: occurrence.id }).catch(() => {});
    }
  }
  return { processed: results.length, results };
}
