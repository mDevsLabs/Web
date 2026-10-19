import "server-only";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  isNull,
  lt,
  lte,
  notInArray,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import { ChatbotError } from "@/lib/errors";
import {
  agent,
  agentTemplate,
  type Chat,
  chat,
  customCommand,
  type DBMessage,
  type DocumentProposal,
  document,
  documentProposal,
  mcpLog,
  mcpServer,
  mcpServerSecret,
  message,
  pluginInstallation,
  project,
  projectFile,
  projectInvite,
  projectMember,
  type ScheduledMessage,
  type Skill,
  type Suggestion,
  scheduledMessage,
  skill,
  skillUsage,
  skillVersion,
  stream,
  suggestion,
  toolExecution,
  userMcpPrefs,
  userMemory,
  vote,
} from "../schema";
import { _rawClient, dbReady, getDb, getRawClient } from "./connection";

// ==========================================
// CUSTOM COMMANDS (section Configuration)
// ==========================================

export async function createCustomCommand({
  userId,
  ...data
}: {
  userId: string;
  kind: "slash" | "mention";
  trigger: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  actionType: "mcp" | "agent" | "skill" | "prompt" | "tools" | "navigation";
  payload?: Record<string, unknown>;
  enabled?: boolean;
  pinned?: boolean;
}) {
  try {
    const database = await getDb();
    const [created] = await database
      .insert(customCommand)
      .values({
        actionType: data.actionType,
        color: data.color ?? "#6366f1",
        description: data.description ?? "",
        enabled: data.enabled ?? true,
        icon: data.icon ?? "zap",
        kind: data.kind,
        name: data.name,
        payload: (data.payload ?? {}) as any,
        pinned: data.pinned ?? false,
        trigger: data.trigger,
        userId,
      })
      .returning();
    return created ?? null;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getCustomCommandsByUserId({
  userId,
  kind,
}: {
  userId: string;
  kind?: "slash" | "mention";
}) {
  try {
    const database = await getDb();
    const conditions = kind
      ? and(eq(customCommand.userId, userId), eq(customCommand.kind, kind))
      : eq(customCommand.userId, userId);
    return database
      .select()
      .from(customCommand)
      .where(conditions)
      .orderBy(desc(customCommand.pinned), asc(customCommand.trigger));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getCustomCommandById({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  try {
    const database = await getDb();
    const [found] = await database
      .select()
      .from(customCommand)
      .where(and(eq(customCommand.id, id), eq(customCommand.userId, userId)));
    return found ?? null;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function updateCustomCommand({
  id,
  userId,
  data,
}: {
  id: string;
  userId: string;
  data: Partial<{
    name: string;
    description: string;
    icon: string;
    color: string;
    trigger: string;
    actionType: "mcp" | "agent" | "skill" | "prompt" | "tools" | "navigation";
    payload: Record<string, unknown>;
    enabled: boolean;
    pinned: boolean;
  }>;
}) {
  try {
    const database = await getDb();
    const [updated] = await database
      .update(customCommand)
      .set({
        ...data,
        ...(data.payload === undefined ? {} : { payload: data.payload as any }),
        updatedAt: new Date(),
      })
      .where(and(eq(customCommand.id, id), eq(customCommand.userId, userId)))
      .returning();
    return updated ?? null;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function deleteCustomCommand({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  try {
    const database = await getDb();
    const [deleted] = await database
      .delete(customCommand)
      .where(and(eq(customCommand.id, id), eq(customCommand.userId, userId)))
      .returning();
    return deleted ?? null;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function incrementCustomCommandUsage({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  try {
    const database = await getDb();
    await database
      .update(customCommand)
      .set({ usageCount: sql`${customCommand.usageCount} + 1` })
      .where(and(eq(customCommand.id, id), eq(customCommand.userId, userId)));
  } catch {
    /* non critique */
  }
}
