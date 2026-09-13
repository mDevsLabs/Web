import "server-only";

import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
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
  agentRun,
  agentSettings,
  agentStep,
  type AgentRun,
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
  model: string;
  plan?: AgentPlan | null;
  reasoningLevel: ReasoningLevel;
  status?: AgentRunStatus;
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
        plan: params.plan ?? null,
        reasoningLevel: params.reasoningLevel,
        startedAt: new Date(),
        status: params.status ?? "running",
        toolPolicySnapshot: params.toolPolicySnapshot,
        userId: params.userId,
      })
      .returning();
    return row;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
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
  id,
  startedAt,
  status,
}: {
  completedAt?: Date | null;
  error?: string | null;
  id: string;
  startedAt?: Date | null;
  status: AgentRunStatus;
}): Promise<void> {
  try {
    const db = await dbReady();
    await db
      .update(agentRun)
      .set({
        completedAt: completedAt ?? null,
        error: error ?? null,
        status,
        ...(startedAt === undefined ? {} : { startedAt }),
      })
      .where(eq(agentRun.id, id));
  } catch (err) {
    throw new ChatbotError("bad_request:database", { cause: err });
  }
}

export async function bumpAgentRunCounters({
  id,
  stepDelta = 0,
  toolCallDelta = 0,
}: {
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
          : { toolCallCount: sql`${agentRun.toolCallCount} + ${toolCallDelta}` }),
      })
      .where(eq(agentRun.id, id));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function setAgentRunPlan({
  id,
  plan,
}: {
  id: string;
  plan: AgentPlan | null;
}): Promise<void> {
  try {
    const db = await dbReady();
    await db.update(agentRun).set({ plan }).where(eq(agentRun.id, id));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function setAgentRunUsage({
  id,
  usage,
}: {
  id: string;
  usage: AgentRunUsage;
}): Promise<void> {
  try {
    const db = await dbReady();
    await db.update(agentRun).set({ usage }).where(eq(agentRun.id, id));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function createAgentStep(params: {
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
  id,
  status,
  summary,
  title,
  toolExecutionId,
}: {
  completedAt?: Date | null;
  id: string;
  status?: AgentStepStatus;
  summary?: string | null;
  title?: string;
  toolExecutionId?: string | null;
}): Promise<void> {
  try {
    const db = await dbReady();
    await db
      .update(agentStep)
      .set({
        ...(completedAt === undefined ? {} : { completedAt }),
        ...(status === undefined ? {} : { status }),
        ...(summary === undefined ? {} : { summary }),
        ...(title === undefined ? {} : { title }),
        ...(toolExecutionId === undefined ? {} : { toolExecutionId }),
      })
      .where(eq(agentStep.id, id));
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
  category: ToolCategory;
  input: unknown;
  runId: string;
  stepId?: string | null;
  toolId: string;
}): Promise<ToolExecution> {
  try {
    const db = await dbReady();
    const [row] = await db
      .insert(toolExecution)
      .values({
        category: params.category,
        input: params.input as never,
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
  id,
  output,
  status,
}: {
  approvalStatus?: "not_required" | "pending" | "approved" | "denied";
  durationMs?: number;
  error?: string | null;
  id: string;
  output?: unknown;
  status: "running" | "completed" | "failed" | "denied" | "cancelled";
}): Promise<void> {
  try {
    const db = await dbReady();
    await db
      .update(toolExecution)
      .set({
        ...(approvalStatus === undefined ? {} : { approvalStatus }),
        ...(durationMs === undefined ? {} : { durationMs }),
        ...(error === undefined ? {} : { error }),
        ...(output === undefined ? {} : { output: output as never }),
        completedAt: new Date(),
        status,
      })
      .where(eq(toolExecution.id, id));
  } catch (err) {
    throw new ChatbotError("bad_request:database", { cause: err });
  }
}

export async function getToolExecutionsByRunId({
  runId,
}: {
  runId: string;
}): Promise<ToolExecution[]> {
  try {
    const db = await dbReady();
    return await db
      .select()
      .from(toolExecution)
      .where(eq(toolExecution.runId, runId))
      .orderBy(asc(toolExecution.createdAt));
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
