import "server-only";
import "dotenv/config";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  type SQL,
  sql,
} from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { ArtifactKind } from "@/components/chat/artifact";
import type { VisibilityType } from "@/components/chat/visibility-selector";
import { ChatbotError } from "../errors";
import {
  type Chat,
  chat,
  type DBMessage,
  document,
  message,
  type Project,
  project,
  type Suggestion,
  stream,
  suggestion,
  tokenBlacklist,
  userTotp,
  vote,
} from "./schema";

let _db: ReturnType<typeof drizzle> | null = null;
let _migrationRan = false;

async function ensureTableTypes(client: ReturnType<typeof postgres>) {
  if (_migrationRan) {
    return;
  }
  _migrationRan = true;

  // Neon pooler: chaque instruction doit être dans une requête séparée
  const run = async (query: Promise<unknown>) => {
    try {
      await query;
    } catch {
      /* ignorer les erreurs (déjà existant, etc.) */
    }
  };

  // Création des tables une par une
  await run(client`CREATE TABLE IF NOT EXISTS "User" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "email" varchar(64) NOT NULL,
    "password" varchar(64),
    "name" text,
    "emailVerified" boolean NOT NULL DEFAULT false,
    "image" text,
    "isAnonymous" boolean NOT NULL DEFAULT false,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
  )`);

  await run(client`CREATE TABLE IF NOT EXISTS "Chat" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "title" text NOT NULL DEFAULT 'Nouvelle discussion',
    "userId" text NOT NULL,
    "visibility" varchar NOT NULL DEFAULT 'private'
  )`);

  await run(client`CREATE TABLE IF NOT EXISTS "Message_v2" (
    "id" text PRIMARY KEY NOT NULL,
    "chatId" uuid NOT NULL,
    "role" varchar NOT NULL,
    "parts" json NOT NULL,
    "attachments" json NOT NULL DEFAULT '[]'::json,
    "createdAt" timestamp NOT NULL DEFAULT now()
  )`);

  await run(client`CREATE TABLE IF NOT EXISTS "Vote_v2" (
    "chatId" uuid NOT NULL,
    "messageId" text NOT NULL,
    "isUpvoted" boolean NOT NULL,
    PRIMARY KEY ("chatId", "messageId")
  )`);

  await run(client`CREATE TABLE IF NOT EXISTS "Document" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "title" text NOT NULL,
    "content" text,
    "text" varchar NOT NULL DEFAULT 'text',
    "userId" text NOT NULL,
    PRIMARY KEY ("id", "createdAt")
  )`);

  await run(client`CREATE TABLE IF NOT EXISTS "Suggestion" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "documentId" uuid NOT NULL,
    "documentCreatedAt" timestamp NOT NULL,
    "originalText" text NOT NULL,
    "suggestedText" text NOT NULL,
    "description" text,
    "isResolved" boolean NOT NULL DEFAULT false,
    "userId" text NOT NULL,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
  )`);

  await run(client`CREATE TABLE IF NOT EXISTS "Stream" (
    "id" text PRIMARY KEY NOT NULL,
    "chatId" uuid NOT NULL,
    "createdAt" timestamp NOT NULL DEFAULT now()
  )`);

  await run(client`CREATE TABLE IF NOT EXISTS "Project" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "userId" text NOT NULL,
    "name" text NOT NULL,
    "description" text DEFAULT '',
    "icon" text DEFAULT '📁',
    "color" varchar(7) DEFAULT '#6366f1',
    "isArchived" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
  )`);

  await run(client`CREATE TABLE IF NOT EXISTS "token_blacklist" (
    "token" text PRIMARY KEY NOT NULL,
    "revoked_at" timestamp DEFAULT now() NOT NULL,
    "expires_at" timestamp DEFAULT now() NOT NULL
  )`);

  await run(client`CREATE TABLE IF NOT EXISTS "user_totp" (
    "user_id" text PRIMARY KEY NOT NULL,
    "secret" text NOT NULL,
    "verified" boolean DEFAULT false NOT NULL,
    "backup_codes" text[] DEFAULT '{}' NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "verified_at" timestamp
  )`);

  // Migrations de colonnes (supprimer contraintes FK, caster vers text)
  await run(
    client`ALTER TABLE "Chat" DROP CONSTRAINT IF EXISTS "Chat_userId_fkey" CASCADE`
  );
  await run(
    client`ALTER TABLE "Chat" DROP CONSTRAINT IF EXISTS "Chat_userId_User_id_fk" CASCADE`
  );
  await run(
    client`ALTER TABLE "Chat" ALTER COLUMN "userId" TYPE text USING "userId"::text`
  );

  await run(
    client`ALTER TABLE "Document" DROP CONSTRAINT IF EXISTS "Document_userId_fkey" CASCADE`
  );
  await run(
    client`ALTER TABLE "Document" DROP CONSTRAINT IF EXISTS "Document_userId_User_id_fk" CASCADE`
  );
  await run(
    client`ALTER TABLE "Document" ALTER COLUMN "userId" TYPE text USING "userId"::text`
  );

  await run(
    client`ALTER TABLE "Suggestion" DROP CONSTRAINT IF EXISTS "Suggestion_userId_fkey" CASCADE`
  );
  await run(
    client`ALTER TABLE "Suggestion" DROP CONSTRAINT IF EXISTS "Suggestion_userId_User_id_fk" CASCADE`
  );
  await run(
    client`ALTER TABLE "Suggestion" ALTER COLUMN "userId" TYPE text USING "userId"::text`
  );

  await run(
    client`ALTER TABLE "Message_v2" DROP CONSTRAINT IF EXISTS "Message_v2_chatId_fkey" CASCADE`
  );
  await run(
    client`ALTER TABLE "Message_v2" ALTER COLUMN "id" TYPE text USING "id"::text`
  );

  await run(
    client`ALTER TABLE "Vote_v2" DROP CONSTRAINT IF EXISTS "Vote_v2_messageId_fkey" CASCADE`
  );
  await run(
    client`ALTER TABLE "Vote_v2" ALTER COLUMN "messageId" TYPE text USING "messageId"::text`
  );

  await run(
    client`ALTER TABLE "Stream" ALTER COLUMN "id" TYPE text USING "id"::text`
  );
  await run(
    client`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "customInstructions" text`
  );
}

let _migrationPromise: Promise<void> | null = null;

function initDb() {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL or POSTGRES_URL is missing in environment variables. Please check your .env configuration."
    );
  }

  const client = postgres(connectionString, { prepare: false });
  _db = drizzle(client);
  _migrationPromise = ensureTableTypes(client);
}

export function getDb() {
  if (!_db) {
    initDb();
  }
  if (!_db) {
    throw new Error("Database initialization failed.");
  }
  return _db;
}

// Helper utilisé dans toutes les fonctions de requêtes
async function dbReady() {
  if (!_db) {
    initDb();
  }
  if (_migrationPromise) {
    await _migrationPromise;
    _migrationPromise = null; // éviter de re-await
  }
  if (!_db) {
    throw new Error("Database initialization failed.");
  }
  return _db;
}

export async function saveChat({
  id,
  userId,
  title,
  visibility,
  projectId,
  tags,
  customInstructions,
  modeId,
  temperatureOverride,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
  projectId?: string | null;
  tags?: string[];
  customInstructions?: string | null;
  modeId?: string;
  temperatureOverride?: number | null;
}) {
  try {
    const db = await dbReady();
    return await db.insert(chat).values({
      createdAt: new Date(),
      customInstructions: customInstructions ?? null,
      id,
      modeId: modeId ?? "standard",
      projectId: projectId ?? null,
      tags: tags ?? [],
      temperatureOverride: temperatureOverride ?? null,
      title,
      userId,
      visibility,
    });
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    const db = await dbReady();
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));
    await db.delete(stream).where(eq(stream.chatId, id));
    const [chatsDeleted] = await db
      .delete(chat)
      .where(eq(chat.id, id))
      .returning();
    return chatsDeleted;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function deleteAllChatsByUserId({ userId }: { userId: string }) {
  try {
    const db = await dbReady();
    const userChats = await db
      .select({ id: chat.id })
      .from(chat)
      .where(sql`${chat.userId}::text = ${userId}::text`);

    if (userChats.length === 0) {
      return { deletedCount: 0 };
    }

    const chatIds = userChats.map((c) => c.id);
    await db.delete(vote).where(inArray(vote.chatId, chatIds));
    await db.delete(message).where(inArray(message.chatId, chatIds));
    await db.delete(stream).where(inArray(stream.chatId, chatIds));

    const deletedChats = await db
      .delete(chat)
      .where(sql`${chat.userId}::text = ${userId}::text`)
      .returning();

    return { deletedCount: deletedChats.length };
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getChatsByUserId({
  id,
  userEmail,
  limit,
  startingAfter,
  endingBefore,
  projectId,
  isArchived,
  pinned,
  search,
  tag,
  includeArchived = false,
}: {
  id: string;
  userEmail?: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
  projectId?: string | null;
  isArchived?: boolean | null;
  pinned?: boolean | null;
  search?: string | null;
  tag?: string | null;
  includeArchived?: boolean;
}) {
  try {
    const db = await dbReady();
    const extendedLimit = limit + 1;

    const extraConditions: SQL<unknown>[] = [];

    // Project filter: "null" means no project, undefined means no filter
    if (projectId !== undefined) {
      if (projectId === null || projectId === "null" || projectId === "") {
        extraConditions.push(sql`${chat.projectId} IS NULL`);
      } else {
        extraConditions.push(sql`${chat.projectId} = ${projectId}::uuid`);
      }
    }

    if (isArchived !== undefined && isArchived !== null) {
      extraConditions.push(eq(chat.isArchived, isArchived));
    } else if (!includeArchived) {
      extraConditions.push(eq(chat.isArchived, false));
    }

    if (pinned !== undefined && pinned !== null) {
      extraConditions.push(eq(chat.pinned, pinned));
    }

    if (tag) {
      extraConditions.push(sql`${tag} = ANY(${chat.tags})`);
    }

    if (search) {
      const escaped = `%${search.replace(/[%_]/g, "\\$&")}%`;
      extraConditions.push(sql`${chat.title} ILIKE ${escaped}`);
    }

    const userCondition = userEmail && userEmail !== id
      ? sql`(${chat.userId}::text = ${id}::text OR ${chat.userId}::text = ${userEmail}::text)`
      : sql`${chat.userId}::text = ${id}::text`;

    const baseWhere = and(
      userCondition,
      ...extraConditions
    );

    const query = (whereCondition?: SQL<unknown>) => {
      const where = whereCondition ? and(whereCondition, baseWhere) : baseWhere;
      // Pinned first, then createdAt desc
      return db
        .select()
        .from(chat)
        .where(where)
        .orderBy(desc(chat.pinned), desc(chat.createdAt))
        .limit(extendedLimit);
    };

    let filteredChats: Chat[] = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new ChatbotError(
          "not_found:database",
          `Chat with id ${startingAfter} not found`
        );
      }

      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new ChatbotError(
          "not_found:database",
          `Chat with id ${endingBefore} not found`
        );
      }

      filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt));
    } else {
      filteredChats = await query();
    }

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const db = await dbReady();
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    if (!selectedChat) {
      return null;
    }
    return selectedChat;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

// ─────────────────────────────────────────────
// Projects
// ─────────────────────────────────────────────
export async function createProject({
  userId,
  name,
  description,
  icon,
  color,
  customInstructions,
}: {
  userId: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  customInstructions?: string;
}) {
  try {
    const db = await dbReady();
    const [p] = await db
      .insert(project)
      .values({
        color: color ?? "#6366f1",
        customInstructions: customInstructions ?? null,
        description: description ?? "",
        icon: icon ?? "📁",
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
    const userCondition = userEmail && userEmail !== userId
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
    const rows = await db
      .select()
      .from(project)
      .where(where)
      .orderBy(desc(project.updatedAt), desc(project.createdAt))
      .limit(Math.min(Math.max(limit, 1), 100));
    return rows;
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
    const userCondition = userEmail && userEmail !== userId
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
  customInstructions?: string;
  isArchived?: boolean;
}) {
  try {
    const db = await dbReady();
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (fields.name !== undefined) updateData.name = fields.name;
    if (fields.description !== undefined) updateData.description = fields.description;
    if (fields.icon !== undefined) updateData.icon = fields.icon;
    if (fields.color !== undefined) updateData.color = fields.color;
    if (fields.customInstructions !== undefined) updateData.customInstructions = fields.customInstructions;
    if (fields.isArchived !== undefined) updateData.isArchived = fields.isArchived;
    const userCondition = userEmail && userEmail !== userId
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
    const userCondition = userEmail && userEmail !== userId
      ? sql`(${chat.userId}::text = ${userId}::text OR ${chat.userId}::text = ${userEmail}::text)`
      : sql`${chat.userId}::text = ${userId}::text`;
    const projectUserCondition = userEmail && userEmail !== userId
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
    const userCondition = userEmail && userEmail !== userId
      ? sql`(${chat.userId}::text = ${userId}::text OR ${chat.userId}::text = ${userEmail}::text)`
      : sql`${chat.userId}::text = ${userId}::text`;
    const where = includeArchived
      ? userCondition
      : and(userCondition, eq(chat.isArchived, false));
    const rows = await db
      .select({ projectId: chat.projectId, count: count(chat.id) })
      .from(chat)
      .where(where)
      .groupBy(chat.projectId);
    return rows;
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────
// Chat extended: pin / archive / tags / project / bulk
// ─────────────────────────────────────────────
export async function updateChatProjectById({
  chatId,
  userId,
  projectId,
}: {
  chatId: string;
  userId: string;
  projectId: string | null;
}) {
  try {
    const db = await dbReady();
    if (projectId) {
      const proj = await getProjectById({ id: projectId, userId });
      if (!proj) throw new ChatbotError("not_found:database", "Project not found");
    }
    const [updated] = await db
      .update(chat)
      .set({ projectId })
      .where(and(eq(chat.id, chatId), sql`${chat.userId}::text = ${userId}::text`))
      .returning();
    return updated;
  } catch (error) {
    if (error instanceof ChatbotError) throw error;
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function updateChatArchivedById({
  chatId,
  userId,
  isArchived,
}: {
  chatId: string;
  userId: string;
  isArchived: boolean;
}) {
  const db = await dbReady();
  return db
    .update(chat)
    .set({ archivedAt: isArchived ? new Date() : null, isArchived })
    .where(and(eq(chat.id, chatId), sql`${chat.userId}::text = ${userId}::text`))
    .returning();
}

export async function updateChatPinnedById({
  chatId,
  userId,
  pinned,
}: {
  chatId: string;
  userId: string;
  pinned: boolean;
}) {
  const db = await dbReady();
  return db
    .update(chat)
    .set({ pinned })
    .where(and(eq(chat.id, chatId), sql`${chat.userId}::text = ${userId}::text`))
    .returning();
}

export async function updateChatTagsById({
  chatId,
  userId,
  tags,
}: {
  chatId: string;
  userId: string;
  tags: string[];
}) {
  const sanitized = tags
    .map((t) => t.trim().slice(0, 30))
    .filter(Boolean)
    .slice(0, 10);
  const db = await dbReady();
  return db
    .update(chat)
    .set({ tags: sanitized })
    .where(and(eq(chat.id, chatId), sql`${chat.userId}::text = ${userId}::text`))
    .returning();
}

export async function updateChatCustomInstructionsById({
  chatId,
  userId,
  customInstructions,
  modeId,
  temperatureOverride,
}: {
  chatId: string;
  userId: string;
  customInstructions?: string | null;
  modeId?: string | null;
  temperatureOverride?: number | null;
}) {
  const db = await dbReady();
  const data: Record<string, unknown> = {};
  if (customInstructions !== undefined) data.customInstructions = customInstructions;
  if (modeId !== undefined) data.modeId = modeId;
  if (temperatureOverride !== undefined) data.temperatureOverride = temperatureOverride;
  return db
    .update(chat)
    .set(data as any)
    .where(and(eq(chat.id, chatId), sql`${chat.userId}::text = ${userId}::text`))
    .returning();
}

export async function bulkUpdateChats({
  userId,
  chatIds,
  action,
  projectId,
  tags,
  isArchived,
}: {
  userId: string;
  chatIds: string[];
  action: "move" | "archive" | "unarchive" | "pin" | "unpin" | "tag" | "delete";
  projectId?: string | null;
  tags?: string[];
  isArchived?: boolean;
}) {
  const db = await dbReady();
  if (chatIds.length === 0) return { updated: 0 };
  const where = and(inArray(chat.id, chatIds), sql`${chat.userId}::text = ${userId}::text`);
  if (action === "delete") {
    await db.delete(vote).where(inArray(vote.chatId, chatIds));
    await db.delete(message).where(inArray(message.chatId, chatIds));
    await db.delete(stream).where(inArray(stream.chatId, chatIds));
    const deleted = await db.delete(chat).where(where).returning();
    return { updated: deleted.length };
  }
  if (action === "move") {
    if (projectId) {
      const proj = await getProjectById({ id: projectId, userId });
      if (!proj) throw new ChatbotError("not_found:database", "Project not found");
    }
    await db.update(chat).set({ projectId: projectId ?? null }).where(where);
    return { updated: chatIds.length };
  }
  if (action === "archive") {
    await db.update(chat).set({ archivedAt: new Date(), isArchived: true }).where(where);
    return { updated: chatIds.length };
  }
  if (action === "unarchive") {
    await db.update(chat).set({ archivedAt: null, isArchived: false }).where(where);
    return { updated: chatIds.length };
  }
  if (action === "pin") {
    await db.update(chat).set({ pinned: true }).where(where);
    return { updated: chatIds.length };
  }
  if (action === "unpin") {
    await db.update(chat).set({ pinned: false }).where(where);
    return { updated: chatIds.length };
  }
  if (action === "tag" && tags) {
    if (tags.length === 0) {
      await db.update(chat).set({ tags: [] }).where(where);
      return { updated: chatIds.length };
    }
    const sanitized = tags.map((t) => t.trim().slice(0, 30)).filter(Boolean).slice(0, 10);
    // Append mode: merge with existing tags (non-destructif)
    const existing = await db
      .select({ id: chat.id, tags: chat.tags })
      .from(chat)
      .where(where);
    for (const row of existing) {
      const merged = [...new Set([...(row.tags || []), ...sanitized])].slice(0, 10);
      await db.update(chat).set({ tags: merged }).where(eq(chat.id, row.id));
    }
    return { updated: existing.length };
  }
  return { updated: 0 };
}

export async function saveMessages({ messages }: { messages: DBMessage[] }) {
  try {
    const db = await dbReady();
    return await db.insert(message).values(messages);
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function updateMessage({
  id,
  parts,
}: {
  id: string;
  parts: DBMessage["parts"];
}) {
  try {
    const db = await dbReady();
    return await db.update(message).set({ parts }).where(eq(message.id, id));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    const db = await dbReady();
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: "up" | "down";
}) {
  try {
    const db = await dbReady();
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === "up" })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      isUpvoted: type === "up",
      messageId,
    });
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    const db = await dbReady();
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    const db = await dbReady();
    return await db
      .insert(document)
      .values({ content, createdAt: new Date(), id, kind, title, userId })
      .returning();
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function updateDocumentContent({
  id,
  content,
}: {
  id: string;
  content: string;
}) {
  try {
    const db = await dbReady();
    const docs = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt))
      .limit(1);

    const [latest] = docs;
    if (!latest) {
      throw new ChatbotError("not_found:database", "Document not found");
    }

    return await db
      .update(document)
      .set({ content })
      .where(and(eq(document.id, id), eq(document.createdAt, latest.createdAt)))
      .returning();
  } catch (error) {
    if (error instanceof ChatbotError) {
      throw error;
    }
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const db = await dbReady();
    return await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const db = await dbReady();
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));
    return selectedDocument;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    const db = await dbReady();
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp)
        )
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
      .returning();
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Suggestion[];
}) {
  try {
    const db = await dbReady();
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    const db = await dbReady();
    return await db
      .select()
      .from(suggestion)
      .where(eq(suggestion.documentId, documentId));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    const db = await dbReady();
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const db = await dbReady();
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp))
      );

    const messageIds = messagesToDelete.map((m) => m.id);

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds))
        );

      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds))
        );
    }
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function updateChatVisibilityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: "private" | "public";
}) {
  try {
    const db = await dbReady();
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function updateChatTitleById({
  chatId,
  title,
}: {
  chatId: string;
  title: string;
}) {
  try {
    const db = await dbReady();
    return await db.update(chat).set({ title }).where(eq(chat.id, chatId));
  } catch {
    // Best effort title update.
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: {
  id: string;
  differenceInHours: number;
}) {
  try {
    const db = await dbReady();
    const cutoffTime = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000
    );

    const [stats] = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          sql`${chat.userId}::text = ${id}::text`,
          gte(message.createdAt, cutoffTime),
          eq(message.role, "user")
        )
      )
      .execute();

    return stats?.count ?? 0;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  try {
    const db = await dbReady();
    await db
      .insert(stream)
      .values({ chatId, createdAt: new Date(), id: streamId });
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const db = await dbReady();
    const streamIds = await db
      .select({ id: stream.id })
      .from(stream)
      .where(eq(stream.chatId, chatId))
      .orderBy(asc(stream.createdAt))
      .execute();

    return streamIds.map(({ id }) => id);
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}
