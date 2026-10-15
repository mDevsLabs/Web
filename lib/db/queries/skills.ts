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


// ==========================================
// SKILLS QUERIES
// ==========================================

export async function getSkillsByUserId({ userId }: { userId: string }) {
  const database = await getDb();
  return database
    .select()
    .from(skill)
    .where(eq(skill.userId, userId))
    .orderBy(desc(skill.pinned), desc(skill.updatedAt));
}

// Skill installé depuis un modèle donné : sert à rendre l'installation d'un
// modèle idempotente (un seul skill par utilisateur et par slug de modèle).
export async function getSkillByTemplateId({
  userId,
  templateId,
}: {
  userId: string;
  templateId: string;
}) {
  const database = await getDb();
  const [result] = await database
    .select()
    .from(skill)
    .where(and(eq(skill.userId, userId), eq(skill.templateId, templateId)))
    .limit(1);
  return result ?? null;
}

export async function getSkillById({
  id,
  userId,
}: {
  id: string;
  userId?: string;
}) {
  const database = await getDb();
  const conditions = [eq(skill.id, id)];
  if (userId) {
    conditions.push(eq(skill.userId, userId));
  }
  const [result] = await database
    .select()
    .from(skill)
    .where(and(...conditions));
  return result ?? null;
}

export async function getPublicSkillByShareId({
  shareId,
}: {
  shareId: string;
}) {
  const database = await getDb();
  const [result] = await database
    .select()
    .from(skill)
    .where(and(eq(skill.shareId, shareId), eq(skill.isPublic, true)));
  return result ?? null;
}

export async function createSkill(data: {
  userId: string;
  name: string;
  description?: string;
  instructions: string;
  icon?: string;
  color?: string;
  tools?: string[];
  parameters?: Array<{
    name: string;
    description?: string;
    type?: string;
    required?: boolean;
    defaultValue?: string;
    enumValues?: string[];
  }>;
  pinned?: boolean;
  isPublic?: boolean;
  tags?: string[];
  mcpServerIds?: string[];
  mcpToolFilter?: Record<string, string[] | null>;
  templateId?: string | null;
}) {
  const database = await getDb();
  const [created] = await database
    .insert(skill)
    .values({
      color: data.color ?? "#6366f1",
      description: data.description ?? "",
      icon: data.icon ?? "sparkles",
      instructions: data.instructions,
      isPublic: data.isPublic ?? false,
      mcpServerIds: (data.mcpServerIds as any) ?? [],
      mcpToolFilter: (data.mcpToolFilter as any) ?? {},
      name: data.name,
      parameters: (data.parameters as any) ?? [],
      pinned: data.pinned ?? false,
      shareId: data.isPublic
        ? Math.random().toString(36).substring(2, 10)
        : null,
      tags: data.tags ?? [],
      templateId: (data.templateId as any) ?? null,
      tools: (data.tools as any) ?? [],
      userId: data.userId,
    })
    .returning();
  return created;
}

const SKILL_SNAPSHOT_FIELDS = [
  "name",
  "description",
  "instructions",
  "icon",
  "color",
  "tools",
  "parameters",
  "mcpServerIds",
  "mcpToolFilter",
] as const;

function skillSnapshotChanged(
  current: Skill,
  data: Record<string, unknown>
): boolean {
  return SKILL_SNAPSHOT_FIELDS.some((field) => {
    const next = data[field];
    if (next === undefined) {
      return false;
    }
    const prev = (current as any)[field];
    return JSON.stringify(prev ?? null) !== JSON.stringify(next ?? null);
  });
}

export async function updateSkill({
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
    tools: string[];
    parameters: any[];
    pinned: boolean;
    isPublic: boolean;
    shareId: string | null;
    tags: string[];
    mcpServerIds: string[];
    mcpToolFilter: Record<string, string[] | null>;
    version: string;
    usageCount: number;
    lastUsedAt: Date | string | null;
    templateId: string | null;
  }>;
}) {
  const database = await getDb();
  const clean: any = { ...data };
  if (clean.lastUsedAt && typeof clean.lastUsedAt === "string") {
    clean.lastUsedAt = new Date(clean.lastUsedAt);
  }

  // Snapshot de la version courante si le contenu éditable change
  const current = await getSkillById({ id, userId });
  if (current && skillSnapshotChanged(current, clean)) {
    await database.insert(skillVersion).values({
      color: current.color ?? "#6366f1",
      description: current.description ?? "",
      icon: current.icon ?? "sparkles",
      instructions: current.instructions ?? "",
      mcpServerIds: (current.mcpServerIds as any) ?? [],
      mcpToolFilter: (current.mcpToolFilter as any) ?? {},
      name: current.name,
      parameters: (current.parameters as any) ?? [],
      skillId: current.id,
      tags: current.tags ?? [],
      tools: (current.tools as any) ?? [],
      userId,
      versionLabel: current.version ?? "v1",
    });
    if (!clean.version) {
      const match = /^v(\d+)$/.exec(current.version ?? "v1");
      const nextNumber = match ? Number(match[1]) + 1 : 1;
      clean.version = `v${nextNumber}`;
    }
  }

  const [updated] = await database
    .update(skill)
    .set({
      ...clean,
      updatedAt: new Date(),
    })
    .where(and(eq(skill.id, id), eq(skill.userId, userId)))
    .returning();
  return updated ?? null;
}

export async function getSkillVersions({
  skillId,
  userId,
}: {
  skillId: string;
  userId: string;
}) {
  const database = await getDb();
  const owns = await getSkillById({ id: skillId, userId });
  if (!owns) {
    return [];
  }
  return database
    .select()
    .from(skillVersion)
    .where(eq(skillVersion.skillId, skillId))
    .orderBy(desc(skillVersion.createdAt));
}

export async function restoreSkillVersion({
  versionId,
  userId,
}: {
  versionId: string;
  userId: string;
}) {
  const database = await getDb();
  const [version] = await database
    .select()
    .from(skillVersion)
    .where(
      and(eq(skillVersion.id, versionId), eq(skillVersion.userId, userId))
    );
  if (!version) {
    return null;
  }
  return updateSkill({
    data: {
      color: version.color ?? "#6366f1",
      description: version.description ?? "",
      icon: version.icon ?? "sparkles",
      instructions: version.instructions ?? "",
      mcpServerIds: (version.mcpServerIds as string[]) ?? [],
      mcpToolFilter:
        (version.mcpToolFilter as Record<string, string[] | null>) ?? {},
      name: version.name,
      parameters: (version.parameters as any[]) ?? [],
      tags: version.tags ?? [],
      tools: (version.tools as string[]) ?? [],
    },
    id: version.skillId,
    userId,
  });
}

export async function trackSkillUsage({
  skillId,
  userId,
}: {
  skillId: string;
  userId: string;
}) {
  const database = await getDb();
  const [existing] = await database
    .select()
    .from(skillUsage)
    .where(and(eq(skillUsage.skillId, skillId), eq(skillUsage.userId, userId)));
  if (existing) {
    await database
      .update(skillUsage)
      .set({
        invocationCount: (existing.invocationCount ?? 0) + 1,
        lastInvokedAt: new Date(),
      })
      .where(eq(skillUsage.id, existing.id));
  } else {
    await database.insert(skillUsage).values({
      invocationCount: 1,
      lastInvokedAt: new Date(),
      skillId,
      userId,
    });
  }
  await database
    .update(skill)
    .set({ lastUsedAt: new Date() })
    .where(eq(skill.id, skillId));
}

export async function deleteSkill({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  const database = await getDb();
  const [deleted] = await database
    .delete(skill)
    .where(and(eq(skill.id, id), eq(skill.userId, userId)))
    .returning();
  return deleted ?? null;
}

export async function togglePinSkill({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  const database = await getDb();
  const existing = await getSkillById({ id, userId });
  if (!existing) {
    return null;
  }

  const [updated] = await database
    .update(skill)
    .set({
      pinned: !existing.pinned,
      updatedAt: new Date(),
    })
    .where(and(eq(skill.id, id), eq(skill.userId, userId)))
    .returning();
  return updated ?? null;
}

export async function duplicateSkill({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  const original = await getSkillById({ id, userId });
  if (!original) {
    return null;
  }

  return createSkill({
    color: original.color ?? "#6366f1",
    description: original.description ?? "",
    icon: original.icon ?? "sparkles",
    instructions: original.instructions,
    isPublic: false,
    name: `${original.name} (Copie)`,
    parameters: (original.parameters as any[]) ?? [],
    pinned: false,
    tags: original.tags ?? [],
    tools: (original.tools as string[]) ?? [],
    userId,
  });
}
