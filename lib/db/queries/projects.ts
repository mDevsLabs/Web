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

async function getProjectAccessGuard() {
  return import("@/lib/projects/access");
}

export async function createProject({
  userId,
  name,
  description,
  icon,
  color,
  customInstructions,
  defaultModel,
}: {
  userId: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  customInstructions?: string;
  defaultModel?: string;
}) {
  try {
    const db = await dbReady();
    const [p] = await db
      .insert(project)
      .values({
        color: color ?? "#6366f1",
        customInstructions: customInstructions ?? null,
        defaultModel: defaultModel ?? null,
        description: description ?? "",
        icon: icon ?? "folder",
        name,
        userId,
      })
      .returning();
    return p;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getProjectsByUserId({
  userId,
  userEmail,
  includeArchived = false,
  search,
  limit = 50,
}: {
  userId: string;
  userEmail?: string;
  includeArchived?: boolean;
  search?: string;
  limit?: number;
}) {
  try {
    const db = await dbReady();
    const userCondition =
      userEmail && userEmail !== userId
        ? sql`(${project.userId}::text = ${userId}::text OR ${project.userId}::text = ${userEmail}::text)`
        : sql`${project.userId}::text = ${userId}::text`;
    const conditions: SQL<unknown>[] = [userCondition];
    if (!includeArchived) {
      conditions.push(eq(project.isArchived, false));
    }
    if (search) {
      const escaped = `%${search.replace(/[%_]/g, "\\$&")}%`;
      conditions.push(sql`${project.name} ILIKE ${escaped}`);
    }
    const where = and(...conditions);
    const owned = await db
      .select({
        color: project.color,
        createdAt: project.createdAt,
        customInstructions: project.customInstructions,
        defaultModel: project.defaultModel,
        description: project.description,
        icon: project.icon,
        id: project.id,
        isArchived: project.isArchived,
        name: project.name,
        role: sql<"owner">`'owner'`.as("role"),
        updatedAt: project.updatedAt,
      })
      .from(project)
      .where(where)
      .orderBy(desc(project.updatedAt), desc(project.createdAt))
      .limit(Math.min(Math.max(limit, 1), 100));

    // Projets rejoints : membre ProjectMember et NON propriétaire (évite le
    // doublon quand un membre-ligne coexiste avec l'ownership legacy).
    const joinedConditions: SQL<unknown>[] = [
      eq(projectMember.role, "member"),
      notInArray(
        projectMember.projectId,
        db.select({ id: project.id }).from(project).where(userCondition)
      ),
    ];
    if (!includeArchived) {
      joinedConditions.push(eq(project.isArchived, false));
    }
    if (search) {
      const escaped = `%${search.replace(/[%_]/g, "\\$&")}%`;
      joinedConditions.push(sql`${project.name} ILIKE ${escaped}`);
    }
    const joined = await db
      .select({
        color: project.color,
        createdAt: project.createdAt,
        customInstructions: project.customInstructions,
        defaultModel: project.defaultModel,
        description: project.description,
        icon: project.icon,
        id: project.id,
        isArchived: project.isArchived,
        name: project.name,
        role: sql<"member">`'member'`.as("role"),
        updatedAt: project.updatedAt,
      })
      .from(project)
      .innerJoin(projectMember, eq(projectMember.projectId, project.id))
      .where(and(...joinedConditions))
      .orderBy(desc(project.updatedAt), desc(project.createdAt))
      .limit(Math.min(Math.max(limit, 1), 100));

    return [...owned, ...joined].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getProjectById({
  id,
  userId,
  userEmail,
}: {
  id: string;
  userId: string;
  userEmail?: string;
}) {
  try {
    const db = await dbReady();
    const userCondition =
      userEmail && userEmail !== userId
        ? sql`(${project.userId}::text = ${userId}::text OR ${project.userId}::text = ${userEmail}::text)`
        : sql`${project.userId}::text = ${userId}::text`;
    const [p] = await db
      .select()
      .from(project)
      .where(and(eq(project.id, id), userCondition))
      .limit(1);
    return p ?? null;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function updateProject({
  id,
  userId,
  userEmail,
  ...fields
}: {
  id: string;
  userId: string;
  userEmail?: string;
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  customInstructions?: string | null;
  defaultModel?: string | null;
  isArchived?: boolean;
}) {
  try {
    const db = await dbReady();
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (fields.name !== undefined) {
      updateData.name = fields.name;
    }
    if (fields.description !== undefined) {
      updateData.description = fields.description;
    }
    if (fields.icon !== undefined) {
      updateData.icon = fields.icon;
    }
    if (fields.color !== undefined) {
      updateData.color = fields.color;
    }
    if (fields.customInstructions !== undefined) {
      updateData.customInstructions = fields.customInstructions;
    }
    if (fields.defaultModel !== undefined) {
      updateData.defaultModel = fields.defaultModel;
    }
    if (fields.isArchived !== undefined) {
      updateData.isArchived = fields.isArchived;
    }
    const userCondition =
      userEmail && userEmail !== userId
        ? sql`(${project.userId}::text = ${userId}::text OR ${project.userId}::text = ${userEmail}::text)`
        : sql`${project.userId}::text = ${userId}::text`;
    const [updated] = await db
      .update(project)
      .set(updateData as any)
      .where(and(eq(project.id, id), userCondition))
      .returning();
    return updated;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function deleteProject({
  id,
  userId,
  userEmail,
  deleteChats = false,
}: {
  id: string;
  userId: string;
  userEmail?: string;
  deleteChats?: boolean;
}) {
  try {
    const db = await dbReady();
    const userCondition =
      userEmail && userEmail !== userId
        ? sql`(${chat.userId}::text = ${userId}::text OR ${chat.userId}::text = ${userEmail}::text)`
        : sql`${chat.userId}::text = ${userId}::text`;
    const projectUserCondition =
      userEmail && userEmail !== userId
        ? sql`(${project.userId}::text = ${userId}::text OR ${project.userId}::text = ${userEmail}::text)`
        : sql`${project.userId}::text = ${userId}::text`;

    if (deleteChats) {
      const chatsToDelete = await db
        .select({ id: chat.id })
        .from(chat)
        .where(and(eq(chat.projectId, id), userCondition));
      const ids = chatsToDelete.map((c) => c.id);
      if (ids.length > 0) {
        await db.delete(vote).where(inArray(vote.chatId, ids));
        await db.delete(message).where(inArray(message.chatId, ids));
        await db.delete(stream).where(inArray(stream.chatId, ids));
        await db.delete(chat).where(inArray(chat.id, ids));
      }
    } else {
      await db
        .update(chat)
        .set({ projectId: null })
        .where(and(eq(chat.projectId, id), userCondition));
    }
    const [deleted] = await db
      .delete(project)
      .where(and(eq(project.id, id), projectUserCondition))
      .returning();
    return deleted;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getProjectChatCounts({
  userId,
  userEmail,
  includeArchived = false,
}: {
  userId: string;
  userEmail?: string;
  includeArchived?: boolean;
}) {
  try {
    const db = await dbReady();
    const userCondition =
      userEmail && userEmail !== userId
        ? sql`(${chat.userId}::text = ${userId}::text OR ${chat.userId}::text = ${userEmail}::text)`
        : sql`${chat.userId}::text = ${userId}::text`;
    const where = includeArchived
      ? userCondition
      : and(userCondition, eq(chat.isArchived, false));
    const rows = await db
      .select({ count: count(chat.id), projectId: chat.projectId })
      .from(chat)
      .where(where)
      .groupBy(chat.projectId);

    // Projets partagés : compter TOUTES les conversations des projets où
    // l'utilisateur est owner ou membre (les autres auteurs aussi). La liste
    // des projets accessibles vient de la garde centralisée.
    try {
      const { getAccessibleProjectIds } = await import("@/lib/projects/access");
      const accessibleIds = await getAccessibleProjectIds({
        userEmail,
        userId,
      });
      if (accessibleIds.length > 0) {
        const sharedWhere = includeArchived
          ? inArray(chat.projectId, accessibleIds)
          : and(
              inArray(chat.projectId, accessibleIds),
              eq(chat.isArchived, false)
            );
        const sharedRows = await db
          .select({ count: count(chat.id), projectId: chat.projectId })
          .from(chat)
          .where(sharedWhere)
          .groupBy(chat.projectId);
        // Fusion : max(ownCount, sharedCount) — un projet n'est ni owner-only
        // ni membre-only dans ce contexte, le compte d'espace fait foi.
        const sharedMap = new Map(
          sharedRows.map((r) => [r.projectId, r.count])
        );
        for (const row of rows) {
          const shared = row.projectId
            ? sharedMap.get(row.projectId)
            : undefined;
          if (shared !== undefined && shared > row.count) {
            row.count = shared;
            sharedMap.delete(row.projectId);
          }
        }
        for (const [projectId, sharedCount] of sharedMap) {
          rows.push({ count: sharedCount, projectId });
        }
      }
    } catch {
      // Garde indisponible (environnement dégradé) : comptes personnels seuls.
    }

    return rows;
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────
// Projets partagés : membres, invitations, fichiers, conversations du projet
// ─────────────────────────────────────────────

// Tous les chats d'un projet partagé (tous auteurs confondus). L'appelant
// DOIT avoir vérifié l'accès au projet au préalable (getProjectAccess) : cette
// fonction ne revalide pas, elle liste l'espace demandé.
export async function getProjectChats({
  projectId,
  limit = 100,
  includeArchived = true,
}: {
  projectId: string;
  limit?: number;
  includeArchived?: boolean;
}) {
  try {
    const db = await dbReady();
    const conditions: SQL<unknown>[] = [eq(chat.projectId, projectId)];
    if (!includeArchived) {
      conditions.push(eq(chat.isArchived, false));
    }
    return await db
      .select({
        agentColor: agent.color,
        agentIcon: agent.icon,
        agentId: chat.agentId,
        agentName: agent.name,
        archivedAt: chat.archivedAt,
        createdAt: chat.createdAt,
        customInstructions: chat.customInstructions,
        id: chat.id,
        isArchived: chat.isArchived,
        mode: chat.mode,
        ownerVariant: chat.userId,
        pinned: chat.pinned,
        projectId: chat.projectId,
        skillId: chat.skillId,
        tags: chat.tags,
        temperatureOverride: chat.temperatureOverride,
        title: chat.title,
        userId: chat.userId,
        visibility: chat.visibility,
      })
      .from(chat)
      .leftJoin(agent, eq(chat.agentId, agent.id))
      .where(and(...conditions))
      .orderBy(desc(chat.pinned), desc(chat.createdAt))
      .limit(Math.min(Math.max(limit, 1), 200));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

// Membres d'un projet (l'appelant a vérifié l'accès).
export async function getProjectMembers({ projectId }: { projectId: string }) {
  try {
    const db = await dbReady();
    return await db
      .select()
      .from(projectMember)
      .where(eq(projectMember.projectId, projectId))
      .orderBy(desc(projectMember.joinedAt));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function countProjectMembers({
  projectId,
}: {
  projectId: string;
}) {
  try {
    const db = await dbReady();
    const [result] = await db
      .select({ value: count() })
      .from(projectMember)
      .where(eq(projectMember.projectId, projectId));
    return result?.value ?? 0;
  } catch {
    return 0;
  }
}

// Invitation active d'un projet (index unique partiel : au plus une ligne).
export async function getActiveProjectInvite({
  projectId,
}: {
  projectId: string;
}) {
  try {
    const db = await dbReady();
    const [invite] = await db
      .select()
      .from(projectInvite)
      .where(
        and(
          eq(projectInvite.projectId, projectId),
          isNull(projectInvite.revokedAt)
        )
      )
      .orderBy(desc(projectInvite.createdAt))
      .limit(1);
    return invite ?? null;
  } catch {
    return null;
  }
}

export async function getProjectInviteByCode({ code }: { code: string }) {
  try {
    const db = await dbReady();
    const [invite] = await db
      .select()
      .from(projectInvite)
      .where(eq(projectInvite.code, code))
      .limit(1);
    return invite ?? null;
  } catch {
    return null;
  }
}

export async function createProjectInvite({
  projectId,
  createdBy,
  maxUses = null,
  expiresAt = null,
}: {
  projectId: string;
  createdBy: string;
  maxUses?: number | null;
  expiresAt?: Date | null;
}) {
  const db = await dbReady();
  const { nanoid } = await import("nanoid");
  const code = nanoid(24);
  const [invite] = await db
    .insert(projectInvite)
    .values({ code, createdBy, expiresAt, maxUses, projectId })
    .returning();
  return invite;
}

// Révoque l'invitation active d'un projet. Idempotent : renvoie true même si
// aucune invitation n'est active.
export async function revokeProjectInvites({
  projectId,
}: {
  projectId: string;
}) {
  try {
    const db = await dbReady();
    const revoked = await db
      .update(projectInvite)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(projectInvite.projectId, projectId),
          isNull(projectInvite.revokedAt)
        )
      )
      .returning();
    return revoked.length > 0;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function deleteProjectMember({
  projectId,
  userId: memberUserId,
}: {
  projectId: string;
  userId: string;
}) {
  try {
    const db = await dbReady();
    const removed = await db
      .delete(projectMember)
      .where(
        and(
          eq(projectMember.projectId, projectId),
          eq(projectMember.userId, memberUserId)
        )
      )
      .returning();
    return removed.length > 0;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

// Rejoindre un projet via une invitation : atomique. L'index unique
// (projectId, userId) protège contre les doubles joins concurrents ; le
// compteur d'usage est incrémenté seulement si l'insertion réussit.
export async function joinProjectWithInvite({
  invite,
  userId,
  invitedBy,
}: {
  invite: typeof projectInvite.$inferSelect;
  userId: string;
  invitedBy: string;
}) {
  const db = await dbReady();
  try {
    const [member] = await db
      .insert(projectMember)
      .values({
        invitedBy,
        projectId: invite.projectId,
        role: "member",
        userId,
      })
      .onConflictDoNothing({
        target: [projectMember.projectId, projectMember.userId],
      })
      .returning();
    if (!member) {
      // Déjà membre : rien à faire, pas d'incrément d'usage.
      return { alreadyMember: true, member: null } as const;
    }
    await db
      .update(projectInvite)
      .set({ useCount: sql`${projectInvite.useCount} + 1` })
      .where(eq(projectInvite.id, invite.id));
    return { alreadyMember: false, member } as const;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

// Fichiers d'un projet (l'appelant a vérifié l'accès).
export async function getProjectFiles({ projectId }: { projectId: string }) {
  try {
    const db = await dbReady();
    return await db
      .select({
        contentType: projectFile.contentType,
        createdAt: projectFile.createdAt,
        extractedText: sql<
          string | null
        >`LEFT(${projectFile.extractedText}, 1)`,
        extractionStatus: projectFile.extractionStatus,
        fileName: projectFile.fileName,
        fileSize: projectFile.fileSize,
        id: projectFile.id,
        storageUrl: projectFile.storageUrl,
        uploadedBy: projectFile.uploadedBy,
      })
      .from(projectFile)
      .where(eq(projectFile.projectId, projectId))
      .orderBy(desc(projectFile.createdAt));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function createProjectFile({
  projectId,
  fileName,
  contentType,
  fileSize,
  uploadedBy,
  fileRef,
  storageUrl,
  extractionStatus = "pending",
  extractedText = null,
}: {
  projectId: string;
  fileName: string;
  contentType: string;
  fileSize?: number | null;
  uploadedBy: string;
  fileRef?: string | null;
  storageUrl: string;
  extractionStatus?: "pending" | "ready" | "unsupported" | "failed";
  extractedText?: string | null;
}) {
  try {
    const db = await dbReady();
    const [file] = await db
      .insert(projectFile)
      .values({
        contentType,
        extractedText,
        extractionStatus,
        fileName,
        fileRef,
        fileSize: fileSize ?? null,
        projectId,
        storageUrl,
        uploadedBy,
      })
      .returning();
    return file;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getProjectFileById({ id }: { id: string }) {
  try {
    const db = await dbReady();
    const [file] = await db
      .select()
      .from(projectFile)
      .where(eq(projectFile.id, id))
      .limit(1);
    return file ?? null;
  } catch {
    return null;
  }
}

export async function deleteProjectFile({ id }: { id: string }) {
  try {
    const db = await dbReady();
    const [deleted] = await db
      .delete(projectFile)
      .where(eq(projectFile.id, id))
      .returning();
    return deleted ?? null;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

// Contexte fichiers pour l'injection modèle : texte extrait complet, borné
// côté policy (lib/chat/project-files.ts), jamais exposé aux listes UI.
export async function getProjectFilesForInjection({
  projectId,
}: {
  projectId: string;
}) {
  try {
    const db = await dbReady();
    return await db
      .select({
        contentType: projectFile.contentType,
        createdAt: projectFile.createdAt,
        extractedText: projectFile.extractedText,
        extractionStatus: projectFile.extractionStatus,
        fileName: projectFile.fileName,
        fileSize: projectFile.fileSize,
        id: projectFile.id,
        storageUrl: projectFile.storageUrl,
      })
      .from(projectFile)
      .where(
        and(
          eq(projectFile.projectId, projectId),
          inArray(projectFile.extractionStatus, ["ready", "unsupported"])
        )
      )
      .orderBy(desc(projectFile.createdAt))
      .limit(50);
  } catch {
    return [];
  }
}
