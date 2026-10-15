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
import { _rawClient, dbReady, getDb, getRawClient } from "./connection";
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
import { ChatbotError } from "@/lib/errors";

import { MEMORY_CONTENT_MAX_LENGTH } from "@/lib/constants";
import { getAgentById } from "./agents";

export async function getGlobalMemories({
  userId,
  limit = 200,
  includeDisabled = false,
}: {
  userId: string;
  limit?: number;
  includeDisabled?: boolean;
}) {
  const database = await getDb();
  const conditions = [
    eq(userMemory.userId, userId),
    isNull(userMemory.agentId),
    isNull(userMemory.projectId),
  ];
  if (!includeDisabled) {
    conditions.push(eq(userMemory.isEnabled, true));
  }
  return database
    .select()
    .from(userMemory)
    .where(and(...conditions))
    .orderBy(desc(userMemory.isImportant), desc(userMemory.createdAt))
    .limit(limit);
}

export async function getAgentMemories({
  agentId,
  userId,
  limit = 200,
  includeDisabled = false,
}: {
  agentId: string;
  userId: string;
  limit?: number;
  includeDisabled?: boolean;
}) {
  const database = await getDb();
  const conditions = [
    eq(userMemory.userId, userId),
    eq(userMemory.agentId, agentId),
  ];
  if (!includeDisabled) {
    conditions.push(eq(userMemory.isEnabled, true));
  }
  return database
    .select()
    .from(userMemory)
    .where(and(...conditions))
    .orderBy(desc(userMemory.isImportant), desc(userMemory.createdAt))
    .limit(limit);
}

export async function getProjectMemories({
  projectId,
  userId,
  limit = 200,
  includeDisabled = false,
}: {
  projectId: string;
  userId: string;
  limit?: number;
  includeDisabled?: boolean;
}) {
  const database = await getDb();
  const conditions = [
    eq(userMemory.userId, userId),
    eq(userMemory.projectId, projectId),
  ];
  if (!includeDisabled) {
    conditions.push(eq(userMemory.isEnabled, true));
  }
  return database
    .select()
    .from(userMemory)
    .where(and(...conditions))
    .orderBy(desc(userMemory.isImportant), desc(userMemory.createdAt))
    .limit(limit);
}

export async function countMemories({
  userId,
  agentId,
  projectId,
}: {
  userId: string;
  agentId?: string | null;
  projectId?: string | null;
}) {
  const database = await getDb();
  const conditions = [eq(userMemory.userId, userId)];
  if (agentId) {
    conditions.push(eq(userMemory.agentId, agentId));
  } else if (projectId) {
    conditions.push(eq(userMemory.projectId, projectId));
  } else {
    conditions.push(isNull(userMemory.agentId));
    conditions.push(isNull(userMemory.projectId));
  }
  const [result] = await database
    .select({ value: count() })
    .from(userMemory)
    .where(and(...conditions));
  return result?.value ?? 0;
}

export async function getUserScopeMemoriesForChat({
  userId,
  agentId,
}: {
  userId: string;
  agentId?: string | null;
}) {
  if (agentId) {
    const ag = await getAgentById({ id: agentId, userId });
    if (ag && (ag as any).memoryMode === "custom") {
      return {
        memories: await getAgentMemories({ agentId, limit: 50, userId }),
        mode: "custom" as const,
      };
    }
  }
  return {
    memories: await getGlobalMemories({ limit: 50, userId }),
    mode: "global" as const,
  };
}

export async function getGhostMemoryEnabled(userId: string): Promise<boolean> {
  try {
    await dbReady();
    if (!_rawClient) {
      return false;
    }
    const rows = await _rawClient`
      SELECT ghost_memory_enabled FROM users
      WHERE id::text = ${userId}::text OR username = ${userId}::text OR email = ${userId}::text
      LIMIT 1`;
    return Boolean((rows as any[])[0]?.ghost_memory_enabled);
  } catch (e) {
    console.error("getGhostMemoryEnabled error", e);
    return false;
  }
}

export async function createMemory({
  userId,
  content,
  agentId = null,
  projectId = null,
  tags = [],
  isImportant = false,
  isEnabled = true,
}: {
  userId: string;
  content: string;
  agentId?: string | null;
  projectId?: string | null;
  tags?: string[];
  isImportant?: boolean;
  isEnabled?: boolean;
}) {
  const database = await getDb();
  const [created] = await database
    .insert(userMemory)
    .values({
      agentId: agentId ?? null,
      content: sanitizeMemoryContent(content),
      isEnabled: isEnabled ?? true,
      isImportant: isImportant ?? false,
      projectId: projectId ?? null,
      tags: tags ?? [],
      userId,
    })
    .returning();
  return created;
}

export async function deleteMemory({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  const database = await getDb();
  const [deleted] = await database
    .delete(userMemory)
    .where(and(eq(userMemory.id, id), eq(userMemory.userId, userId)))
    .returning();
  return deleted ?? null;
}

/**
 * Vide toute la mémoire d'un utilisateur : personnelle, projet ET agent.
 *
 * Le filtre porte UNIQUEMENT sur `userId` : c'est le seul moyen de garantir
 * qu'aucune mémoire ne survit sous un autre portée. Borner par `agentId` ou
 * `projectId` laisserait des traces que l'utilisateur ne voit plus nulle part,
 * donc qu'il ne pourrait plus jamais supprimer.
 *
 * Retourne le nombre de lignes retirées, pour que l'interface puisse
 * distinguer « rien à supprimer » d'une purge réellement effectuée.
 */
export async function deleteAllMemoriesByUserId({
  userId,
}: {
  userId: string;
}): Promise<number> {
  const database = await getDb();
  const deleted = await database
    .delete(userMemory)
    .where(eq(userMemory.userId, userId))
    .returning({ id: userMemory.id });
  return deleted.length;
}

function sanitizeMemoryContent(content: string): string {
  return content
    .replace(new RegExp(String.fromCharCode(0), "g"), "")
    .trim()
    .slice(0, MEMORY_CONTENT_MAX_LENGTH);
}

export async function updateMemory({
  content,
  id,
  isEnabled,
  isImportant,
  tags,
  userId,
}: {
  content?: string;
  id: string;
  isEnabled?: boolean;
  isImportant?: boolean;
  tags?: string[];
  userId: string;
}) {
  const setFields: Record<string, any> = { updatedAt: new Date() };
  if (content !== undefined) {
    const safe = sanitizeMemoryContent(content);
    if (!safe) return null;
    setFields.content = safe;
  }
  if (isEnabled !== undefined) setFields.isEnabled = isEnabled;
  if (isImportant !== undefined) setFields.isImportant = isImportant;
  if (tags !== undefined) setFields.tags = tags;

  const database = await getDb();
  const [updated] = await database
    .update(userMemory)
    .set(setFields)
    .where(and(eq(userMemory.id, id), eq(userMemory.userId, userId)))
    .returning();
  return updated ?? null;
}

/**
 * Toutes les mémoires de l'utilisateur, tous scopes confondus, avec le nom de
 * l'agent ou du projet auquel chacune est rattachée (null pour une mémoire
 * globale). Utilisé par l'onglet Mémoire des paramètres.
 */
export async function getUserMemoriesWithScope({
  limit = 500,
  userId,
}: {
  limit?: number;
  userId: string;
}) {
  const database = await getDb();
  return database
    .select({
      agentId: userMemory.agentId,
      agentName: agent.name,
      content: userMemory.content,
      createdAt: userMemory.createdAt,
      id: userMemory.id,
      isEnabled: userMemory.isEnabled,
      isImportant: userMemory.isImportant,
      projectId: userMemory.projectId,
      projectName: project.name,
      tags: userMemory.tags,
      updatedAt: userMemory.updatedAt,
    })
    .from(userMemory)
    .leftJoin(agent, eq(userMemory.agentId, agent.id))
    .leftJoin(project, eq(userMemory.projectId, project.id))
    .where(eq(userMemory.userId, userId))
    .orderBy(desc(userMemory.isImportant), desc(userMemory.createdAt))
    .limit(limit);
}

export async function searchMemories({
  userId,
  query,
  agentId = null,
  projectId = null,
  limit = 20,
}: {
  userId: string;
  query: string;
  agentId?: string | null;
  projectId?: string | null;
  limit?: number;
}) {
  const database = await getDb();
  const safe = query.replace(/[%_\\]/g, "\\$&");
  const conditions = [eq(userMemory.userId, userId)];
  if (agentId) {
    conditions.push(eq(userMemory.agentId, agentId));
  } else if (projectId) {
    conditions.push(eq(userMemory.projectId, projectId));
  } else {
    conditions.push(isNull(userMemory.agentId));
    conditions.push(isNull(userMemory.projectId));
  }
  conditions.push(sql`${userMemory.content} ILIKE ${`%${safe}%`}`);
  return database
    .select()
    .from(userMemory)
    .where(and(...conditions))
    .orderBy(desc(userMemory.createdAt))
    .limit(limit);
}
