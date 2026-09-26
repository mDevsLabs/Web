import "server-only";

import { and, asc, desc, eq, gte, inArray, sql } from "drizzle-orm";
import type {
  AgentAutonomy,
  AgentExecutionBudget,
  AgentPlan,
  AgentRunStatus,
  AgentRunUsage,
  AgentStepStatus,
  AgentStepType,
  ReasoningLevel,
  ToolCategory,
  ToolPermission,
} from "@/lib/agent/types";
import { ACTIVE_AGENT_RUN_STATUSES } from "@/lib/agent/types";
import { dbReady } from "@/lib/db/queries";
import {
  type AgentRun,
  agentRun,
  agentSettings,
  agentStep,
  type ToolExecution,
  toolExecution,
} from "@/lib/db/schema";
import { ChatbotError } from "@/lib/errors";

// Persistance propre à Agent, dans un module dédié pour ne pas alourdir
// lib/db/queries.ts. Les runs et steps sont la source de vérité côté serveur :
// le frontend ne fait que les afficher.

export async function createAgentRun(params: {
  autonomy: AgentAutonomy;
  budget: AgentExecutionBudget;
  chatId: string;
  messageId?: string | null;
  parentRunId?: string | null;
  model: string;
  plan?: AgentPlan | null;
  reasoningLevel: ReasoningLevel;
  status?: AgentRunStatus;
  tasksEnabled?: boolean;
  toolPolicySnapshot: Record<string, ToolPermission>;
  userId: string;
}): Promise<AgentRun> {
  try {
    const db = await dbReady();
    const [row] = await db
      .insert(agentRun)
      .values({
        autonomy: params.autonomy,
        budget: params.budget,
        chatId: params.chatId,
        messageId: params.messageId ?? null,
        model: params.model,
        parentRunId: params.parentRunId ?? null,
        plan: params.plan ?? null,
        reasoningLevel: params.reasoningLevel,
        startedAt: new Date(),
        status: params.status ?? "running",
        tasksEnabled: params.tasksEnabled ?? false,
        toolPolicySnapshot: params.toolPolicySnapshot,
        userId: params.userId,
      })
      .returning();
    return row;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getAgentRunByMessageId(params: {
  chatId: string;
  messageId: string;
}): Promise<AgentRun | null> {
  const db = await dbReady();
  const [row] = await db
    .select()
    .from(agentRun)
    .where(
      and(
        eq(agentRun.chatId, params.chatId),
        eq(agentRun.messageId, params.messageId)
      )
    )
    .limit(1);
  return row ?? null;
}

// Réservation d'exécution atomique. La lease dépasse la limite HTTP (300 s)
// et sera libérée par le runtime à la clôture, y compris en attente utilisateur.
export async function claimAgentRunExecution(params: {
  id: string;
  owner: string;
}): Promise<boolean> {
  const db = await dbReady();
  const [row] = await db
    .update(agentRun)
    .set({
      executionLeaseUntil: new Date(Date.now() + 310_000),
      executionOwner: params.owner,
    })
    .where(
      and(
        eq(agentRun.id, params.id),
        inArray(agentRun.status, ACTIVE_AGENT_RUN_STATUSES),
        sql`(${agentRun.executionLeaseUntil} IS NULL OR ${agentRun.executionLeaseUntil} < now())`
      )
    )
    .returning({ id: agentRun.id });
  if (row)
    console.info(
      JSON.stringify({ event: "agent_run_reserved", runId: row.id })
    );
  return Boolean(row);
}

export async function releaseAgentRunExecution(params: {
  id: string;
  owner: string;
}): Promise<void> {
  const db = await dbReady();
  await db
    .update(agentRun)
    .set({ executionLeaseUntil: null, executionOwner: null })
    .where(
      and(eq(agentRun.id, params.id), eq(agentRun.executionOwner, params.owner))
    );
}

export async function setAgentRunFeedback(params: {
  goalReached?: boolean;
  id: string;
  useful?: boolean;
  userId: string;
}): Promise<AgentRun | null> {
  const db = await dbReady();
  const [row] = await db
    .update(agentRun)
    .set({
      ...(params.useful === undefined ? {} : { useful: params.useful }),
      ...(params.goalReached === undefined
        ? {}
        : { goalReached: params.goalReached }),
      feedbackAt: new Date(),
    })
    .where(
      and(
        eq(agentRun.id, params.id),
        eq(agentRun.userId, params.userId),
        inArray(agentRun.status, [
          "completed",
          "failed",
          "cancelled",
          "timed_out",
        ])
      )
    )
    .returning();
  return row ?? null;
}

export async function getAgentActivityRuns(params: {
  since: Date;
  userId: string;
}): Promise<AgentRun[]> {
  const db = await dbReady();
  return db
    .select()
    .from(agentRun)
    .where(
      and(
        eq(agentRun.userId, params.userId),
        gte(agentRun.createdAt, params.since)
      )
    )
    .orderBy(desc(agentRun.createdAt));
}

export async function getAgentRunById({
  id,
  userId,
}: {
  id: string;
  userId: string;
}): Promise<AgentRun | null> {
  try {
    const db = await dbReady();
    const [row] = await db
      .select()
      .from(agentRun)
      .where(and(eq(agentRun.id, id), eq(agentRun.userId, userId)))
      .limit(1);
    return row ?? null;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getAgentRunsByChatId({
  chatId,
}: {
  chatId: string;
}): Promise<AgentRun[]> {
  try {
    const db = await dbReady();
    return await db
      .select()
      .from(agentRun)
      .where(eq(agentRun.chatId, chatId))
      .orderBy(asc(agentRun.createdAt));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

// Utilisé à la reprise : au plus un run actif par conversation.
export async function getActiveAgentRunByChatId({
  chatId,
}: {
  chatId: string;
}): Promise<AgentRun | null> {
  try {
    const db = await dbReady();
    const [row] = await db
      .select()
      .from(agentRun)
      .where(
        and(
          eq(agentRun.chatId, chatId),
          inArray(agentRun.status, ACTIVE_AGENT_RUN_STATUSES)
        )
      )
      .orderBy(desc(agentRun.createdAt))
      .limit(1);
    return row ?? null;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function updateAgentRunStatus({
  completedAt,
  error,
  executionOwner,
  id,
  startedAt,
  status,
  stopReason,
  onlyIfActive = false,
}: {
  completedAt?: Date | null;
  error?: string | null;
  executionOwner?: string | null;
  id: string;
  startedAt?: Date | null;
  status: AgentRunStatus;
  stopReason?: string | null;
  onlyIfActive?: boolean;
}): Promise<boolean> {
  try {
    const db = await dbReady();
    const rows = await db
      .update(agentRun)
      .set({
        completedAt: completedAt ?? null,
        error: error ?? null,
        status,
        ...(stopReason === undefined ? {} : { stopReason }),
        ...(startedAt === undefined ? {} : { startedAt }),
      })
      .where(
        and(
          eq(agentRun.id, id),
          ...(executionOwner
            ? [eq(agentRun.executionOwner, executionOwner)]
            : []),
          ...(onlyIfActive
            ? [inArray(agentRun.status, ACTIVE_AGENT_RUN_STATUSES)]
            : [])
        )
      )

      .returning({ id: agentRun.id });
    return rows.length > 0;
  } catch (err) {
    throw new ChatbotError("bad_request:database", { cause: err });
  }
}

export async function bumpAgentRunCounters({
  executionOwner,
  id,
  stepDelta = 0,
  toolCallDelta = 0,
}: {
  executionOwner?: string | null;
  id: string;
  stepDelta?: number;
  toolCallDelta?: number;
}): Promise<void> {
  try {
    const db = await dbReady();
    await db
      .update(agentRun)
      .set({
        ...(stepDelta === 0
          ? {}
          : { stepCount: sql`${agentRun.stepCount} + ${stepDelta}` }),
        ...(toolCallDelta === 0
          ? {}
          : {
              toolCallCount: sql`${agentRun.toolCallCount} + ${toolCallDelta}`,
            }),
      })
      .where(
        and(
          eq(agentRun.id, id),
          ...(executionOwner
            ? [eq(agentRun.executionOwner, executionOwner)]
            : [])
        )
      );
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function setAgentRunPlan({
  executionOwner,
  id,
  plan,
}: {
  executionOwner?: string | null;
  id: string;
  plan: AgentPlan | null;
}): Promise<void> {
  try {
    const db = await dbReady();
    await db
      .update(agentRun)
      .set({ plan })
      .where(
        and(
          eq(agentRun.id, id),
          ...(executionOwner
            ? [eq(agentRun.executionOwner, executionOwner)]
            : [])
        )
      );
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function setAgentRunUsage({
  executionOwner,
  id,
  usage,
}: {
  executionOwner?: string | null;
  id: string;
  usage: AgentRunUsage;
}): Promise<void> {
  try {
    const db = await dbReady();
    await db.transaction(async (tx) => {
      const [current] = await tx
        .select({ usage: agentRun.usage })
        .from(agentRun)
        .where(
          and(
            eq(agentRun.id, id),
            ...(executionOwner
              ? [eq(agentRun.executionOwner, executionOwner)]
              : [])
          )
        )
        .for("update")
        .limit(1);
      if (!current) return;
      const previous = current.usage as AgentRunUsage;
      await tx
        .update(agentRun)
        .set({
          usage: {
            ...previous,
            durationMs: (previous.durationMs ?? 0) + (usage.durationMs ?? 0),
            inputTokens: (previous.inputTokens ?? 0) + (usage.inputTokens ?? 0),
            outputTokens:
              (previous.outputTokens ?? 0) + (usage.outputTokens ?? 0),
            totalTokens: (previous.totalTokens ?? 0) + (usage.totalTokens ?? 0),
          },
        })
        .where(
          and(
            eq(agentRun.id, id),
            ...(executionOwner
              ? [eq(agentRun.executionOwner, executionOwner)]
              : [])
          )
        );
    });
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

// Actions suggérées validées par le registre, persistées en fin de run et
// relues par l'API runs après refresh (le flux ne sert qu'aux mises à jour).
export async function setAgentRunSuggestedActions({
  actions,
  executionOwner,
  id,
}: {
  actions: { id: string; label: string; payload: Record<string, unknown> }[];
  executionOwner?: string | null;
  id: string;
}): Promise<void> {
  try {
    const db = await dbReady();
    await db
      .update(agentRun)
      .set({ suggestedActions: actions })
      .where(
        and(
          eq(agentRun.id, id),
          ...(executionOwner
            ? [eq(agentRun.executionOwner, executionOwner)]
            : [])
        )
      );
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function createAgentStep(params: {
  executionOwner?: string | null;
  index: number;
  runId: string;
  status?: AgentStepStatus;
  summary?: string | null;
  title: string;
  toolExecutionId?: string | null;
  type: AgentStepType;
}) {
  try {
    const db = await dbReady();
    if (params.executionOwner) {
      const [run] = await db
        .select({ owner: agentRun.executionOwner })
        .from(agentRun)
        .where(eq(agentRun.id, params.runId))
        .limit(1);
      if (!run || run.owner !== params.executionOwner) {
        throw new Error("lease_agent_invalid");
      }
    }
    const [row] = await db
      .insert(agentStep)
      .values({
        index: params.index,
        runId: params.runId,
        status: params.status ?? "running",
        summary: params.summary ?? null,
        title: params.title,
        toolExecutionId: params.toolExecutionId ?? null,
        type: params.type,
      })
      .returning();
    return row;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function updateAgentStep({
  completedAt,
  executionOwner,
  id,
  runId,
  status,
  summary,
  title,
  toolExecutionId,
}: {
  completedAt?: Date | null;
  executionOwner?: string | null;
  id: string;
  runId?: string;
  status?: AgentStepStatus;
  summary?: string | null;
  title?: string;
  toolExecutionId?: string | null;
}): Promise<void> {
  try {
    const db = await dbReady();
    if (executionOwner) {
      if (!runId) throw new Error("lease_agent_missing_run");
      const [step] = await db
        .select({ owner: agentRun.executionOwner })
        .from(agentStep)
        .innerJoin(agentRun, eq(agentRun.id, agentStep.runId))
        .where(and(eq(agentStep.id, id), eq(agentStep.runId, runId)))
        .limit(1);
      if (!step || step.owner !== executionOwner) return;
    }
    await db
      .update(agentStep)
      .set({
        ...(completedAt === undefined ? {} : { completedAt }),
        ...(status === undefined ? {} : { status }),
        ...(summary === undefined ? {} : { summary }),
        ...(title === undefined ? {} : { title }),
        ...(toolExecutionId === undefined ? {} : { toolExecutionId }),
      })
      .where(
        and(
          eq(agentStep.id, id),
          ...(runId ? [eq(agentStep.runId, runId)] : [])
        )
      );
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getAgentStepsByRunId({ runId }: { runId: string }) {
  try {
    const db = await dbReady();
    return await db
      .select()
      .from(agentStep)
      .where(eq(agentStep.runId, runId))
      .orderBy(asc(agentStep.index));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function createToolExecution(params: {
  attempt?: number;
  category: ToolCategory;
  executionOwner?: string | null;
  input: unknown;
  operationKey?: string | null;
  parentExecutionId?: string | null;
  retryable?: boolean;
  runId: string;
  stepId?: string | null;
  toolId: string;
}): Promise<ToolExecution> {
  try {
    const db = await dbReady();
    if (params.executionOwner) {
      const [run] = await db
        .select({ owner: agentRun.executionOwner })
        .from(agentRun)
        .where(eq(agentRun.id, params.runId))
        .limit(1);
      if (!run || run.owner !== params.executionOwner) {
        throw new Error("lease_agent_invalid");
      }
    }
    const [row] = await db
      .insert(toolExecution)
      .values({
        attempt: params.attempt ?? 1,
        category: params.category,
        input: params.input as never,
        operationKey: params.operationKey ?? null,
        parentExecutionId: params.parentExecutionId ?? null,

        retryable: params.retryable ?? false,
        runId: params.runId,
        startedAt: new Date(),
        status: "running",
        stepId: params.stepId ?? null,
        toolId: params.toolId,
      })
      .returning();
    return row;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function completeToolExecution({
  approvalStatus,
  durationMs,
  error,
  errorCategory,
  executionOwner,
  id,
  output,
  retryable,
  runId,
  status,
}: {
  approvalStatus?: "not_required" | "pending" | "approved" | "denied";
  durationMs?: number;
  error?: string | null;
  errorCategory?: string | null;
  executionOwner?: string | null;
  id: string;
  output?: unknown;
  retryable?: boolean;
  runId?: string;
  status: "running" | "completed" | "failed" | "denied" | "cancelled";
}): Promise<void> {
  try {
    const db = await dbReady();
    if (executionOwner) {
      if (!runId) throw new Error("lease_agent_missing_run");
      const [run] = await db
        .select({ owner: agentRun.executionOwner })
        .from(agentRun)
        .where(eq(agentRun.id, runId))
        .limit(1);
      if (!run || run.owner !== executionOwner) return;
    }
    await db
      .update(toolExecution)
      .set({
        ...(approvalStatus === undefined ? {} : { approvalStatus }),
        ...(durationMs === undefined ? {} : { durationMs }),
        ...(error === undefined ? {} : { error }),
        ...(errorCategory === undefined ? {} : { errorCategory }),
        ...(output === undefined ? {} : { output: output as never }),
        ...(retryable === undefined ? {} : { retryable }),
        completedAt: new Date(),
        status,
      })
      .where(
        and(
          eq(toolExecution.id, id),
          ...(runId ? [eq(toolExecution.runId, runId)] : [])
        )
      );
  } catch (err) {
    throw new ChatbotError("bad_request:database", { cause: err });
  }
}

export async function getToolExecutionsByRunId({
  limit = 200,
  runId,
}: {
  limit?: number;
  runId: string;
}): Promise<ToolExecution[]> {
  try {
    const db = await dbReady();
    return await db
      .select()
      .from(toolExecution)
      .where(eq(toolExecution.runId, runId))
      .orderBy(asc(toolExecution.createdAt))
      .limit(Math.min(Math.max(limit, 1), 500));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getAgentSettingsRow({ userId }: { userId: string }) {
  try {
    const db = await dbReady();
    const [row] = await db
      .select()
      .from(agentSettings)
      .where(eq(agentSettings.userId, userId))
      .limit(1);
    return row ?? null;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function upsertAgentSettingsRow({
  patch,
  userId,
}: {
  patch: {
    autonomy?: AgentAutonomy;
    defaultModel?: string | null;
    defaultProjectId?: string | null;
    enabledCategories?: ToolCategory[];
    reasoningLevel?: ReasoningLevel;
    toolPolicies?: Record<string, ToolPermission>;
  };
  userId: string;
}): Promise<void> {
  try {
    const db = await dbReady();
    await db
      .insert(agentSettings)
      .values({
        autonomy: patch.autonomy ?? "standard",
        defaultModel: patch.defaultModel ?? null,
        defaultProjectId: patch.defaultProjectId ?? null,
        enabledCategories: patch.enabledCategories ?? [],
        reasoningLevel: patch.reasoningLevel ?? "medium",
        toolPolicies: patch.toolPolicies ?? {},
        userId,
      })
      .onConflictDoUpdate({
        set: {
          ...(patch.autonomy === undefined ? {} : { autonomy: patch.autonomy }),
          ...(patch.defaultModel === undefined
            ? {}
            : { defaultModel: patch.defaultModel }),
          ...(patch.defaultProjectId === undefined
            ? {}
            : { defaultProjectId: patch.defaultProjectId }),
          ...(patch.enabledCategories === undefined
            ? {}
            : { enabledCategories: patch.enabledCategories }),
          ...(patch.reasoningLevel === undefined
            ? {}
            : { reasoningLevel: patch.reasoningLevel }),
          ...(patch.toolPolicies === undefined
            ? {}
            : { toolPolicies: patch.toolPolicies }),
          updatedAt: new Date(),
        },
        target: agentSettings.userId,
      });
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}
