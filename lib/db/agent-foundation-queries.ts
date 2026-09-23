import "server-only";

import { and, asc, desc, eq, inArray, lt, lte, or, sql } from "drizzle-orm";
import type { ScheduleRule } from "@/lib/agent/contracts";
import {
  type AgentOccurrenceRecord,
  type AgentRunCheckpoint,
  type AgentRunInstructionRecord,
  type AgentScheduleRecord,
  type ApprovalRequestRecord,
  canonicalParamsKey,
  OCCURRENCE_LEASE_MS,
} from "@/lib/agent/db-schema";
import type { AgentRunStatus } from "@/lib/agent/types";
import { dbReady } from "@/lib/db/queries";
import {
  agentRun,
  agentRunInstruction,
  agentSchedule,
  agentScheduleVersion,
  agentScheduleOccurrence,
  agentUserInputRequest,
  approvalRequest,
} from "@/lib/db/schema";
import { ChatbotError } from "@/lib/errors";

// Requêtes des fondations Agent : schedules, occurrences, approbations,
// instructions de réorientation, checkpoints. Les invariants clés :
//  - réservation ATOMIQUE d'occurrence (UPDATE ... WHERE ... RETURNING) :
//    deux workers concurrents ne peuvent jamais exécuter la même occurrence ;
//  - approbations invalidées par hash de paramètres ;
//  - instructions de réorientation ordonnées et idempotentes.

// ---------------------------------------------------------------------------
// AgentSchedule
// ---------------------------------------------------------------------------

export async function createAgentSchedule(params: {
  agentId: string | null;
  config: AgentScheduleRecord["config"];
  instructions: string;
  modelId: string;
  nextDueAt: Date;
  projectId: string | null;
  rule: ScheduleRule;
  timezone: string;
  title: string;
  userId: string;
}): Promise<AgentScheduleRecord> {
  try {
    const db = await dbReady();
    return await db.transaction(async (tx) => {
      const [row] = await tx.insert(agentSchedule).values({
        agentId: params.agentId,
        config: params.config,
        instructions: params.instructions,
        modelId: params.modelId,
        nextDueAt: params.nextDueAt,
        projectId: params.projectId,
        rule: params.rule,
        timezone: params.timezone,
        title: params.title,
        userId: params.userId,
      }).returning();
      await tx.insert(agentScheduleVersion).values({
        revision: row.revision,
        scheduleId: row.id,
        snapshot: row,
        userId: row.userId,
      });
      return row;
    });
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getAgentScheduleById(params: {
  id: string;
  userId: string;
}): Promise<AgentScheduleRecord | null> {
  try {
    const db = await dbReady();
    const [row] = await db
      .select()
      .from(agentSchedule)
      .where(
        and(
          eq(agentSchedule.id, params.id),
          eq(agentSchedule.userId, params.userId)
        )
      )
      .limit(1);
    return row ?? null;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getAgentScheduleForScheduler(id: string): Promise<AgentScheduleRecord | null> {
  const db = await dbReady();
  const [row] = await db.select().from(agentSchedule).where(eq(agentSchedule.id, id)).limit(1);
  return row ?? null;
}

export async function listAgentSchedules(params: {
  includeDeleted?: boolean;
  userId: string;
}): Promise<AgentScheduleRecord[]> {
  try {
    const db = await dbReady();
    const conditions = [eq(agentSchedule.userId, params.userId)];
    if (!params.includeDeleted) {
      conditions.push(sql`${agentSchedule.deletedAt} IS NULL`);
    }
    return await db
      .select()
      .from(agentSchedule)
      .where(and(...conditions))
      .orderBy(desc(agentSchedule.createdAt));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

// Mutation protégée par révision optimiste : renvoie false si la ligne a
// changé depuis la lecture du client (ou a été supprimée logiquement).
export async function mutateAgentSchedule(params: {
  expectedRevision: number;
  id: string;
  mutation:
    | { action: "delete" }
    | { action: "pause" }
    | {
        action: "update";
        patch: Partial<
          Pick<
            AgentScheduleRecord,
            | "instructions"
            | "modelId"
            | "nextDueAt"
            | "projectId"
            | "rule"
            | "timezone"
            | "title"
          >
        > & Partial<AgentScheduleRecord["config"]>;
      }
    | { action: "resume" };
  userId: string;
}): Promise<boolean> {
  try {
    const db = await dbReady();
    return await db.transaction(async (tx) => {
      const [current] = await tx.select().from(agentSchedule).where(and(
        eq(agentSchedule.id, params.id), eq(agentSchedule.userId, params.userId),
        eq(agentSchedule.revision, params.expectedRevision), sql`${agentSchedule.deletedAt} IS NULL`
      )).limit(1);
      if (!current) return false;
      const set: Record<string, unknown> = {
        revision: sql`${agentSchedule.revision} + 1`, updatedAt: new Date(),
      };
      if (params.mutation.action === "delete") {
        set.deletedAt = new Date(); set.status = "deleted";
      } else if (params.mutation.action === "pause") {
        set.status = "paused";
      } else if (params.mutation.action === "resume") {
        set.status = "active";
      } else {
        const { autonomy, enabledCategories, reasoningLevel, ...columns } = params.mutation.patch;
        Object.assign(set, columns);
        if (autonomy !== undefined || enabledCategories !== undefined || reasoningLevel !== undefined) {
          set.config = {
            ...current.config,
            ...(autonomy === undefined ? {} : { autonomy }),
            ...(enabledCategories === undefined ? {} : { enabledCategories }),
            ...(reasoningLevel === undefined ? {} : { reasoningLevel }),
          };
        }
      }
      const [updated] = await tx.update(agentSchedule).set(set).where(and(
        eq(agentSchedule.id, params.id), eq(agentSchedule.userId, params.userId),
        eq(agentSchedule.revision, params.expectedRevision), sql`${agentSchedule.deletedAt} IS NULL`
      )).returning();
      if (!updated) return false;
      await tx.insert(agentScheduleVersion).values({
        revision: updated.revision, scheduleId: updated.id,
        snapshot: updated, userId: updated.userId,
      });
      return true;
    });
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function setAgentScheduleError(params: {
  id: string;
  lastError: string | null;
  expectedRevision?: number;
}): Promise<void> {
  try {
    const db = await dbReady();
    await db
      .update(agentSchedule)
      .set({
        lastError: params.lastError,
        ...(params.lastError === null ? {} : { status: "paused" as const }),
      })
      .where(and(eq(agentSchedule.id, params.id), ...(params.expectedRevision === undefined ? [] : [eq(agentSchedule.revision, params.expectedRevision)])));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function recordScheduleRun(params: {
  id: string;
  lastRunAt: Date;
  nextDueAt: Date;
  expectedRevision?: number;
}): Promise<void> {
  try {
    const db = await dbReady();
    await db
      .update(agentSchedule)
      .set({ lastRunAt: params.lastRunAt, nextDueAt: params.nextDueAt })
      .where(and(eq(agentSchedule.id, params.id), ...(params.expectedRevision === undefined ? [] : [eq(agentSchedule.revision, params.expectedRevision)])));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

// ---------------------------------------------------------------------------
// AgentScheduleOccurrence — réservation atomique et historique
// ---------------------------------------------------------------------------

// Crée l'occurrence si absente (idempotence par UNIQUE(scheduleId, dueAt)) et
// renvoie toujours la ligne existante ou nouvellement créée.
export async function ensureOccurrence(params: {
  dueAt: Date;
  scheduleId: string;
}): Promise<AgentOccurrenceRecord | null> {
  try {
    const db = await dbReady();
    const inserted = await db
      .insert(agentScheduleOccurrence)
      .values({
        dueAt: params.dueAt,
        scheduleId: params.scheduleId,
        scheduleVersionId: sql`(SELECT "id" FROM "AgentScheduleVersion" WHERE "scheduleId" = ${params.scheduleId} ORDER BY "revision" DESC LIMIT 1)`,
      })
      .onConflictDoNothing()
      .returning();
    if (inserted[0]) {
      return inserted[0];
    }
    const [existing] = await db
      .select()
      .from(agentScheduleOccurrence)
      .where(
        and(
          eq(agentScheduleOccurrence.scheduleId, params.scheduleId),
          eq(agentScheduleOccurrence.dueAt, params.dueAt)
        )
      )
      .limit(1);
    return existing ?? null;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function listDueSchedules(params: {
  limit?: number;
  now: Date;
}): Promise<AgentScheduleRecord[]> {
  try {
    const db = await dbReady();
    return await db
      .select()
      .from(agentSchedule)
      .where(
        and(
          eq(agentSchedule.status, "active"),
          sql`${agentSchedule.deletedAt} IS NULL`,
          lte(agentSchedule.nextDueAt, params.now)
        )
      )
      .orderBy(asc(agentSchedule.nextDueAt))
      .limit(params.limit ?? 20);
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

// Réservation atomique : UPDATE conditionnel ... RETURNING. Si aucun worker
// ne détient l'occurrence (pending, ou lease expirée), elle est réclamée ;
// le second worker concurrent obtient zéro ligne. Chaque claim incrémente
// `attempt` : le compteur de tentatives est donc porté par la base et borne
// les reprises après échec (SCHEDULE_MAX_ATTEMPTS).
export async function claimOccurrence(params: {
  now: Date;
  occurrenceId: string;
  workerId: string;
}): Promise<AgentOccurrenceRecord | null> {
  try {
    const db = await dbReady();
    const rows = await db
      .update(agentScheduleOccurrence)
      .set({
        attempt: sql`${agentScheduleOccurrence.attempt} + 1`,
        claimedAt: params.now,
        claimedBy: params.workerId,
        leaseUntil: new Date(params.now.getTime() + OCCURRENCE_LEASE_MS),
        status: "claimed",
      })
      .where(
        and(
          eq(agentScheduleOccurrence.id, params.occurrenceId),
          // Comparaison de date via lt() : un fragment sql`${col} < ${date}`
          // passe l'objet Date brut au driver (sans mapping Drizzle) et échoue
          // avec TypeError "Received an instance of Date".
          or(
            eq(agentScheduleOccurrence.status, "pending"),
            and(
              eq(agentScheduleOccurrence.status, "claimed"),
              lt(agentScheduleOccurrence.leaseUntil, params.now)
            ),
            and(
              eq(agentScheduleOccurrence.status, "running"),
              lt(agentScheduleOccurrence.leaseUntil, params.now)
            )
          )
        )
      )
      .returning();
    return rows[0] ?? null;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function startOccurrence(params: {
  id: string;
  now: Date;
  runId: string;
}): Promise<void> {
  try {
    const db = await dbReady();
    await db
      .update(agentScheduleOccurrence)
      .set({
        leaseUntil: new Date(params.now.getTime() + OCCURRENCE_LEASE_MS),
        runId: params.runId,
        status: "running",
      })
      .where(eq(agentScheduleOccurrence.id, params.id));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function waitOccurrence(params: { id: string; runId: string }): Promise<void> {
  const db = await dbReady();
  await db.update(agentScheduleOccurrence).set({
    runId: params.runId, status: "waiting", leaseUntil: null,
  }).where(eq(agentScheduleOccurrence.id, params.id));
}

export async function listWaitingOccurrences(params: { limit?: number }): Promise<AgentOccurrenceRecord[]> {
  const db = await dbReady();
  return db.select().from(agentScheduleOccurrence)
    .where(eq(agentScheduleOccurrence.status, "waiting"))
    .orderBy(asc(agentScheduleOccurrence.claimedAt)).limit(params.limit ?? 50);
}

export async function getWaitingRequestExpiry(params: {
  kind: "approval" | "user";
  runId: string;
}): Promise<Date | null> {
  const db = await dbReady();
  if (params.kind === "approval") {
    const [request] = await db.select({ expiresAt: approvalRequest.expiresAt, status: approvalRequest.status })
      .from(approvalRequest).where(eq(approvalRequest.runId, params.runId))
      .orderBy(desc(approvalRequest.createdAt)).limit(1);
    return request && ["pending", "expired"].includes(request.status) ? request.expiresAt : null;
  }
  const [request] = await db.select({ expiresAt: agentUserInputRequest.expiresAt, status: agentUserInputRequest.status })
    .from(agentUserInputRequest).where(eq(agentUserInputRequest.runId, params.runId))
    .orderBy(desc(agentUserInputRequest.createdAt)).limit(1);
  return request && ["pending", "expired"].includes(request.status) ? request.expiresAt : null;
}

export async function getScheduleVersionById(params: { id: string; scheduleId: string }) {
  const db = await dbReady();
  const [row] = await db.select().from(agentScheduleVersion).where(and(
    eq(agentScheduleVersion.id, params.id), eq(agentScheduleVersion.scheduleId, params.scheduleId)
  )).limit(1);
  return row ?? null;
}

export async function listScheduleVersions(params: { scheduleId: string; limit?: number }) {
  const db = await dbReady();
  const query = db.select().from(agentScheduleVersion)
    .where(eq(agentScheduleVersion.scheduleId, params.scheduleId))
    .orderBy(desc(agentScheduleVersion.revision));
  return params.limit === undefined ? query : query.limit(params.limit);
}

export async function finishOccurrence(params: {
  id: string;
  now: Date;
  status: "completed" | "failed" | "skipped";
}): Promise<void> {
  try {
    const db = await dbReady();
    await db
      .update(agentScheduleOccurrence)
      .set({ finishedAt: params.now, status: params.status })
      .where(eq(agentScheduleOccurrence.id, params.id));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

// Occurrences dont la lease a expiré pendant une exécution (crash worker) :
// reprise possible par n'importe quel worker — mais une occurrence déjà liée
// à un run ne crée jamais un second run (le run existant est avancé).
export async function listExpiredLeaseOccurrences(params: {
  limit?: number;
  now: Date;
}): Promise<AgentOccurrenceRecord[]> {
  try {
    const db = await dbReady();
    return await db
      .select()
      .from(agentScheduleOccurrence)
      .where(
        and(
          inArray(agentScheduleOccurrence.status, ["claimed", "running"]),
          lt(agentScheduleOccurrence.leaseUntil, params.now)
        )
      )
      .limit(params.limit ?? 20);
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

// Occurrence liée à un run : sert à la fois au résolveur de notifications
// (le run vient-il d'une tâche planifiée ?) et à la reprise après crash
// (retrouver l'occurrence mère d'un run interrompu).
export async function getOccurrenceByRunId(params: {
  runId: string;
}): Promise<AgentOccurrenceRecord | null> {
  try {
    const db = await dbReady();
    const [row] = await db
      .select()
      .from(agentScheduleOccurrence)
      .where(eq(agentScheduleOccurrence.runId, params.runId))
      .orderBy(desc(agentScheduleOccurrence.dueAt))
      .limit(1);
    return row ?? null;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

// Retour d'une occurrence réclamée sans run vers l'état pending : après un
// crash entre claim et création du run, elle redevient éligible au tick
// suivant au lieu d'être perdue (ni doublonnée : la clé unique tient).
export async function resetOccurrenceToPending(params: {
  id: string;
}): Promise<void> {
  try {
    const db = await dbReady();
    await db
      .update(agentScheduleOccurrence)
      .set({
        claimedAt: null,
        claimedBy: null,
        leaseUntil: null,
        status: "pending",
      })
      .where(eq(agentScheduleOccurrence.id, params.id));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

// One-shot terminé : la tâche n'a plus d'échéance future. Passage en paused
// (et non deleted) : l'historique reste visible dans l'interface et le run
// produit reste rattachable. listDueSchedules filtre sur status active, donc
// le schedule ne sera plus repris par les ticks — plus jamais de repoll d'une
// échéance passée.
export async function deactivateScheduleAfterRun(params: {
  id: string;
  lastRunAt: Date;
  expectedRevision?: number;
}): Promise<void> {
  try {
    const db = await dbReady();
    await db
      .update(agentSchedule)
      .set({ lastRunAt: params.lastRunAt, status: "paused" })
      .where(and(eq(agentSchedule.id, params.id), ...(params.expectedRevision === undefined ? [] : [eq(agentSchedule.revision, params.expectedRevision)])));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

// Lecture par id (sans filtre utilisateur) : usage serveur uniquement —
// reprise après crash, diagnostics du scheduler.
export async function getOccurrenceById(params: {
  id: string;
}): Promise<AgentOccurrenceRecord | null> {
  try {
    const db = await dbReady();
    const [row] = await db
      .select()
      .from(agentScheduleOccurrence)
      .where(eq(agentScheduleOccurrence.id, params.id))
      .limit(1);
    return row ?? null;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function listOccurrencesByScheduleId(params: {
  limit?: number;
  scheduleId: string;
}): Promise<AgentOccurrenceRecord[]> {
  try {
    const db = await dbReady();
    return await db
      .select()
      .from(agentScheduleOccurrence)
      .where(eq(agentScheduleOccurrence.scheduleId, params.scheduleId))
      .orderBy(desc(agentScheduleOccurrence.dueAt))
      .limit(params.limit ?? 50);
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

// ---------------------------------------------------------------------------
// ApprovalRequest
// ---------------------------------------------------------------------------

export async function createApprovalRequest(params: {
  expiresAt: Date;
  params: Record<string, unknown>;
  paramsHash: string;
  runId: string;
  stepId?: string | null;
  toolCallId: string;
  toolExecutionId?: string | null;
  toolId: string;
}): Promise<ApprovalRequestRecord> {
  try {
    const db = await dbReady();
    const [row] = await db
      .insert(approvalRequest)
      .values({
        expiresAt: params.expiresAt,
        params: params.params,
        paramsHash: params.paramsHash,
        runId: params.runId,
        stepId: params.stepId ?? null,
        toolCallId: params.toolCallId,
        toolExecutionId: params.toolExecutionId ?? null,
        toolId: params.toolId,
      })
      .returning();
    return row;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

// Une demande par appel d'outil : la reprise relit TOUJOURS la décision
// persistée de cet appel précis, jamais un état transmis par le client.
export async function getApprovalRequestByToolCall(params: {
  runId: string;
  toolCallId: string;
}): Promise<ApprovalRequestRecord | null> {
  try {
    const db = await dbReady();
    const [row] = await db
      .select()
      .from(approvalRequest)
      .where(
        and(
          eq(approvalRequest.runId, params.runId),
          eq(approvalRequest.toolCallId, params.toolCallId)
        )
      )
      .orderBy(desc(approvalRequest.createdAt))
      .limit(1);
    return row ?? null;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getPendingApprovalForRun(params: {
  runId: string;
}): Promise<ApprovalRequestRecord | null> {
  try {
    const db = await dbReady();
    const [row] = await db
      .select()
      .from(approvalRequest)
      .where(
        and(
          eq(approvalRequest.runId, params.runId),
          eq(approvalRequest.status, "pending"),
          sql`${approvalRequest.expiresAt} > NOW()`
        )
      )
      .orderBy(desc(approvalRequest.createdAt))
      .limit(1);
    return row ?? null;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

// Décision d'approbation : refus si le hash des paramètres ne correspond plus
// (les paramètres ont été modifiés entre-temps) — la demande est alors caduque
// et une nouvelle demande devra être créée.
export async function decideApprovalRequest(params: {
  decision: "approve" | "deny";
  denyReason?: string | null;
  expectedStatuses?: string[];
  id: string;
  paramsHash: string;
}): Promise<
  | { ok: true; runId: string }
  | { ok: false; reason: "hash_mismatch" | "not_found" }
> {
  try {
    const db = await dbReady();
    const rows = await db
      .update(approvalRequest)
      .set({
        decidedAt: new Date(),
        denyReason:
          params.decision === "deny" ? (params.denyReason ?? null) : null,
        status: params.decision === "approve" ? "approved" : "denied",
      })
      .where(
        and(
          eq(approvalRequest.id, params.id),
          eq(approvalRequest.paramsHash, params.paramsHash),
          eq(approvalRequest.status, "pending")
        )
      )
      .returning({ runId: approvalRequest.runId });
    if (rows[0]) {
      return { ok: true, runId: rows[0].runId };
    }
    const [any] = await db
      .select({ hash: approvalRequest.paramsHash })
      .from(approvalRequest)
      .where(eq(approvalRequest.id, params.id))
      .limit(1);
    return any
      ? { ok: false, reason: "hash_mismatch" }
      : { ok: false, reason: "not_found" };
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

// Caducité d'une demande : les paramètres présentés ne correspondent plus à
// l'appel d'outil en cours, l'accord ne doit donc plus pouvoir s'appliquer. Le
// passage à « expired » est conditionné au statut « pending » : une demande
// déjà décidée n'est jamais écrasée.
export async function expireApprovalRequestById(params: {
  id: string;
}): Promise<void> {
  try {
    const db = await dbReady();
    await db
      .update(approvalRequest)
      .set({ status: "expired" })
      .where(
        and(
          eq(approvalRequest.id, params.id),
          eq(approvalRequest.status, "pending")
        )
      );
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

// ---------------------------------------------------------------------------
// AgentRunInstruction — réorientations
// ---------------------------------------------------------------------------

export async function enqueueRunInstruction(params: {
  seq: number;
  stopRequested: boolean;
  runId: string;
  text: string;
}): Promise<AgentRunInstructionRecord> {
  try {
    const db = await dbReady();
    const [row] = await db
      .insert(agentRunInstruction)
      .values({
        runId: params.runId,
        seq: params.seq,
        stopRequested: params.stopRequested,
        text: params.text,
      })
      .returning();
    return row;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function listPendingRunInstructions(params: {
  runId: string;
}): Promise<AgentRunInstructionRecord[]> {
  try {
    const db = await dbReady();
    return await db
      .select()
      .from(agentRunInstruction)
      .where(
        and(
          eq(agentRunInstruction.runId, params.runId),
          eq(agentRunInstruction.status, "pending")
        )
      )
      .orderBy(asc(agentRunInstruction.seq));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function markRunInstructionsApplied(params: {
  appliedStepIndex: number;
  ids: string[];
}): Promise<void> {
  try {
    const db = await dbReady();
    await db
      .update(agentRunInstruction)
      .set({
        appliedAt: new Date(),
        appliedStepIndex: params.appliedStepIndex,
        status: "applied",
      })
      .where(inArray(agentRunInstruction.id, params.ids));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

// ---------------------------------------------------------------------------
// Checkpoint de run (limites de durée, reprise, révision optimiste)
// ---------------------------------------------------------------------------

export async function saveAgentRunCheckpoint(params: {
  checkpoint: AgentRunCheckpoint;
  expectedRevision: number;
  id: string;
}): Promise<boolean> {
  try {
    const db = await dbReady();
    const rows = await db
      .update(agentRun)
      .set({
        checkpoint: params.checkpoint,
        revision: sql`${agentRun.revision} + 1`,
      })
      .where(
        and(
          eq(agentRun.id, params.id),
          eq(agentRun.revision, params.expectedRevision)
        )
      )
      .returning({ id: agentRun.id });
    return rows.length > 0;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function setAgentRunStatusIfMatches(params: {
  expectedStatuses: AgentRunStatus[];
  id: string;
  status: AgentRunStatus;
}): Promise<boolean> {
  try {
    const db = await dbReady();
    const rows = await db
      .update(agentRun)
      .set({ status: params.status })
      .where(
        and(
          eq(agentRun.id, params.id),
          inArray(agentRun.status, params.expectedStatuses)
        )
      )
      .returning({ id: agentRun.id });
    return rows.length > 0;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export { canonicalParamsKey };
