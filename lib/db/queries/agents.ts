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

import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { dedupeAgentTemplatesByName } from "@/lib/agent-templates/dedupe";

// ==========================================
// AGENT QUERIES (remplace Mode IA)
// ==========================================

export async function getAgentsByUserId({ userId }: { userId: string }) {
  const database = await getDb();
  return database
    .select()
    .from(agent)
    .where(eq(agent.userId, userId))
    .orderBy(desc(agent.updatedAt));
}

export async function getAgentById({
  id,
  userId,
}: {
  id: string;
  userId?: string;
}) {
  const database = await getDb();
  const conditions = [eq(agent.id, id)];
  if (userId) {
    conditions.push(eq(agent.userId, userId));
  }
  const [result] = await database
    .select()
    .from(agent)
    .where(and(...conditions));
  return result ?? null;
}

export async function createAgent(data: {
  userId: string;
  name: string;
  description?: string;
  instructions: string;
  icon?: string;
  color?: string;
  defaultModelId?: string;
  skillIds?: string[];
  mcpServerIds?: string[];
  cloudFileUrls?: string[];
  temperature?: number | null;
  topP?: number | null;
  maxTokens?: number | null;
  starterPrompts?: string[];
  welcomeMessage?: string | null;
  pinned?: boolean;
  memoryMode?: "global" | "custom";
}) {
  const database = await getDb();
  const [created] = await database
    .insert(agent)
    .values({
      cloudFileUrls: (data.cloudFileUrls as any) ?? [],
      color: data.color ?? "#6366f1",
      defaultModelId: data.defaultModelId ?? DEFAULT_CHAT_MODEL,
      description: data.description ?? "",
      icon: data.icon ?? "sparkles",
      instructions: data.instructions,
      maxTokens: data.maxTokens ?? null,
      mcpServerIds: (data.mcpServerIds as any) ?? [],
      memoryMode: data.memoryMode ?? "global",
      name: data.name,
      pinned: data.pinned ?? false,
      skillIds: (data.skillIds as any) ?? [],
      starterPrompts: (data.starterPrompts as any) ?? [],
      temperature: data.temperature ?? null,
      topP: data.topP ?? null,
      userId: data.userId,
      welcomeMessage: data.welcomeMessage ?? null,
    })
    .returning();
  return created;
}

export async function updateAgent({
  id,
  userId,
  data,
}: {
  id: string;
  userId: string;
  data: Partial<{
    name: string;
    description: string;
    instructions: string;
    icon: string;
    color: string;
    defaultModelId: string;
    skillIds: string[];
    mcpServerIds: string[];
    cloudFileUrls: string[];
    temperature: number | null;
    topP: number | null;
    maxTokens: number | null;
    starterPrompts: string[];
    welcomeMessage: string | null;
    pinned: boolean;
    isPublic: boolean;
    shareId: string | null;
    memoryMode: "global" | "custom";
  }>;
}) {
  const database = await getDb();
  const [updated] = await database
    .update(agent)
    .set({ ...(data as any), updatedAt: new Date() })
    .where(and(eq(agent.id, id), eq(agent.userId, userId)))
    .returning();
  return updated ?? null;
}

export async function deleteAgent({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  const database = await getDb();
  const [deleted] = await database
    .delete(agent)
    .where(and(eq(agent.id, id), eq(agent.userId, userId)))
    .returning();
  return deleted ?? null;
}

export async function duplicateAgent({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  const original = await getAgentById({ id, userId });
  if (!original) {
    return null;
  }
  return createAgent({
    cloudFileUrls: (original.cloudFileUrls as any) ?? [],
    color: original.color ?? "#6366f1",
    defaultModelId: original.defaultModelId ?? DEFAULT_CHAT_MODEL,
    description: original.description ?? "",
    icon: original.icon ?? "sparkles",
    instructions: original.instructions,
    maxTokens: (original as any).maxTokens ?? null,
    mcpServerIds: (original.mcpServerIds as any) ?? [],
    memoryMode: (original as any).memoryMode === "custom" ? "custom" : "global",
    name: `${original.name} (Copie)`,
    pinned: (original as any).pinned ?? false,
    skillIds: (original.skillIds as any) ?? [],
    starterPrompts: (original as any).starterPrompts ?? [],
    temperature: (original as any).temperature ?? null,
    topP: (original as any).topP ?? null,
    userId,
    welcomeMessage: (original as any).welcomeMessage ?? null,
  });
}

export async function getAgentTemplates() {
  const database = await getDb();
  const rows = await database
    .select()
    .from(agentTemplate)
    .where(eq(agentTemplate.isPublic, true))
    .orderBy(asc(agentTemplate.name));
  // Défense en profondeur : la migration 0029 supprime les doublons et pose un
  // index UNIQUE sur "name", mais une base migrée à la main (ou une ligne
  // insérée avant la contrainte) ne doit jamais afficher deux fois le même
  // modèle. Voir lib/agent-templates/dedupe.ts.
  return dedupeAgentTemplatesByName(rows);
}

export async function getAgentStatsByUserId({ userId }: { userId: string }) {
  const database = await getDb();

  // Liste des agents de l'utilisateur
  const userAgents = await database
    .select()
    .from(agent)
    .where(eq(agent.userId, userId))
    .orderBy(desc(agent.createdAt));

  // Compte des chats par agentId
  const chatCounts = await database
    .select({
      agentId: chat.agentId,
      count: sql<number>`count(*)::int`,
      lastUsedAt: sql<string | null>`max(${chat.createdAt})::text`,
    })
    .from(chat)
    .where(eq(chat.userId, userId))
    .groupBy(chat.agentId);

  const countsMap = new Map<
    string,
    { count: number; lastUsedAt: string | null }
  >();
  let totalStandardChats = 0;
  let totalAgentChats = 0;

  for (const c of chatCounts) {
    if (c.agentId) {
      countsMap.set(c.agentId, { count: c.count, lastUsedAt: c.lastUsedAt });
      totalAgentChats += c.count;
    } else {
      totalStandardChats += c.count;
    }
  }

  const agentsWithStats = userAgents.map((ag) => {
    const stats = countsMap.get(ag.id) || { count: 0, lastUsedAt: null };
    return {
      color: ag.color,
      defaultModelId: ag.defaultModelId,
      description: ag.description,
      icon: ag.icon,
      id: ag.id,
      lastUsedAt: stats.lastUsedAt,
      name: ag.name,
      pinned: ag.pinned,
      usageCount: stats.count,
    };
  });

  // Trier par nombre d'utilisations décroissant
  agentsWithStats.sort((a, b) => b.usageCount - a.usageCount);

  return {
    agents: agentsWithStats,
    totalAgentChats,
    totalAgents: userAgents.length,
    totalChats: totalStandardChats + totalAgentChats,
    totalStandardChats,
  };
}
