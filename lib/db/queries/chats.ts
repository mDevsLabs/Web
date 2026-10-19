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
import type { VisibilityType } from "@/components/chat/visibility-selector";
import { resolveBillableTotal } from "@/lib/agent/usage";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
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
import { getProjectById } from "./projects";

export async function saveChat({
  id,
  userId,
  title,
  visibility,
  projectId,
  tags,
  customInstructions,
  modeId,
  agentId,
  skillId,
  temperatureOverride,
  mode,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
  projectId?: string | null;
  tags?: string[];
  customInstructions?: string | null;
  modeId?: string;
  agentId?: string | null;
  skillId?: string | null;
  temperatureOverride?: number | null;
  mode?: "chat" | "agent";
}) {
  try {
    const db = await dbReady();
    return await db.insert(chat).values({
      agentId: agentId ?? null,
      customInstructions: customInstructions ?? null,
      id,
      mode: mode ?? "chat",
      projectId: projectId ?? null,
      skillId: skillId ?? null,
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

    const userCondition =
      userEmail && userEmail !== id
        ? sql`(${chat.userId}::text = ${id}::text OR ${chat.userId}::text = ${userEmail}::text)`
        : sql`${chat.userId}::text = ${id}::text`;

    const baseWhere = and(userCondition, ...extraConditions);

    const query = (whereCondition?: SQL<unknown>) => {
      const where = whereCondition ? and(whereCondition, baseWhere) : baseWhere;
      // Pinned first, then createdAt desc
      return db
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
        .where(where)
        .orderBy(desc(chat.pinned), desc(chat.createdAt))
        .limit(extendedLimit);
    };

    let filteredChats: any[] = [];

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

      filteredChats = await query(
        sql`(${chat.pinned}, ${chat.createdAt}) > (${selectedChat.pinned}, ${selectedChat.createdAt})`
      );
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

      filteredChats = await query(
        sql`(${chat.pinned}, ${chat.createdAt}) < (${selectedChat.pinned}, ${selectedChat.createdAt})`
      );
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
  if (!id || typeof id !== "string") {
    return null;
  }
  try {
    const db = await dbReady();
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    if (!selectedChat) {
      return null;
    }
    return selectedChat;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// Projects
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// Chat extended: pin / archive / tags / project / bulk
// ─────────────────────────────────────────────
// chat.userId peut contenir indifféremment user.id, user.email ou username
// selon la création : le filtre doit couvrir les variantes (fallback email).
function chatUserFilter(userId: string, email?: string | null) {
  if (email && email !== userId) {
    return sql`(${chat.userId}::text = ${userId}::text OR ${chat.userId}::text = ${email}::text)`;
  }
  return sql`${chat.userId}::text = ${userId}::text`;
}

export async function updateChatProjectById({
  chatId,
  userId,
  email,
  projectId,
}: {
  chatId: string;
  userId: string;
  email?: string | null;
  projectId: string | null;
}) {
  try {
    const db = await dbReady();
    if (projectId) {
      // Le projet cible est accessible au propriétaire OU au membre (espace
      // partagé) : la validation passe par la garde d'accès centralisée.
      const { getProjectAccess } = await import("@/lib/projects/access");
      const access = await getProjectAccess({
        projectId,
        userEmail: email ?? null,
        userId,
      });
      if (!access) {
        throw new ChatbotError("not_found:database", "Projet introuvable");
      }
    }
    const [updated] = await db
      .update(chat)
      .set({ projectId })
      .where(and(eq(chat.id, chatId), chatUserFilter(userId, email)))
      .returning();
    return updated;
  } catch (error) {
    if (error instanceof ChatbotError) {
      throw error;
    }
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function updateChatArchivedById({
  chatId,
  userId,
  email,
  isArchived,
}: {
  chatId: string;
  userId: string;
  email?: string | null;
  isArchived: boolean;
}) {
  const db = await dbReady();
  return db
    .update(chat)
    .set({ archivedAt: isArchived ? new Date() : null, isArchived })
    .where(and(eq(chat.id, chatId), chatUserFilter(userId, email)))
    .returning();
}

export async function updateChatPinnedById({
  chatId,
  userId,
  email,
  pinned,
}: {
  chatId: string;
  userId: string;
  email?: string | null;
  pinned: boolean;
}) {
  const db = await dbReady();
  return db
    .update(chat)
    .set({ pinned })
    .where(and(eq(chat.id, chatId), chatUserFilter(userId, email)))
    .returning();
}

export async function updateChatTagsById({
  chatId,
  userId,
  email,
  tags,
}: {
  chatId: string;
  userId: string;
  email?: string | null;
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
    .where(and(eq(chat.id, chatId), chatUserFilter(userId, email)))
    .returning();
}

export async function updateChatCustomInstructionsById({
  chatId,
  userId,
  email,
  customInstructions,
  modeId,
  temperatureOverride,
}: {
  chatId: string;
  userId: string;
  email?: string | null;
  customInstructions?: string | null;
  modeId?: string | null;
  temperatureOverride?: number | null;
}) {
  const db = await dbReady();
  const data: Record<string, unknown> = {};
  if (customInstructions !== undefined) {
    data.customInstructions = customInstructions;
  }
  if (modeId !== undefined) {
    data.modeId = modeId;
  }
  if (temperatureOverride !== undefined) {
    data.temperatureOverride = temperatureOverride;
  }
  return db
    .update(chat)
    .set(data as any)
    .where(and(eq(chat.id, chatId), chatUserFilter(userId, email)))
    .returning();
}

export async function bulkUpdateChats({
  userId,
  email,
  chatIds,
  action,
  projectId,
  tags,
  isArchived,
}: {
  userId: string;
  email?: string | null;
  chatIds: string[];
  action: "move" | "archive" | "unarchive" | "pin" | "unpin" | "tag" | "delete";
  projectId?: string | null;
  tags?: string[];
  isArchived?: boolean;
}) {
  const db = await dbReady();
  if (chatIds.length === 0) {
    return { updated: 0 };
  }
  const where = and(inArray(chat.id, chatIds), chatUserFilter(userId, email));
  if (action === "delete") {
    await db.delete(vote).where(inArray(vote.chatId, chatIds));
    await db.delete(message).where(inArray(message.chatId, chatIds));
    await db.delete(stream).where(inArray(stream.chatId, chatIds));
    const deleted = await db.delete(chat).where(where).returning();
    return { updated: deleted.length };
  }
  if (action === "move") {
    if (projectId) {
      // Espace partagé : la cible est accessible au propriétaire OU au membre.
      const { getProjectAccess } = await import("@/lib/projects/access");
      const access = await getProjectAccess({
        projectId,
        userEmail: email ?? null,
        userId,
      });
      if (!access) {
        throw new ChatbotError("not_found:database", "Projet introuvable");
      }
    }
    await db
      .update(chat)
      .set({ projectId: projectId ?? null })
      .where(where);
    return { updated: chatIds.length };
  }
  if (action === "archive") {
    await db
      .update(chat)
      .set({ archivedAt: new Date(), isArchived: true })
      .where(where);
    return { updated: chatIds.length };
  }
  if (action === "unarchive") {
    await db
      .update(chat)
      .set({ archivedAt: null, isArchived: false })
      .where(where);
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
    const sanitized = tags
      .map((t) => t.trim().slice(0, 30))
      .filter(Boolean)
      .slice(0, 10);
    // Append mode: merge with existing tags (non-destructif)
    const existing = await db
      .select({ id: chat.id, tags: chat.tags })
      .from(chat)
      .where(where);
    for (const row of existing) {
      const merged = [...new Set([...(row.tags || []), ...sanitized])].slice(
        0,
        10
      );
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
  if (!id || typeof id !== "string") {
    return [];
  }
  try {
    const db = await dbReady();
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch {
    return [];
  }
}

/**
 * Historique complet d'un utilisateur, à plat, pour l'export Markdown.
 *
 * Une seule requête, et non `getChatsByUserId` suivi d'un
 * `getMessagesByChatId` par conversation : l'export porte sur TOUT
 * l'historique, donc la variante N+1 reviendrait à faire une requête par
 * discussion — plusieurs centaines sur un compte ancien. Le groupement par
 * `chatId` est fait par l'appelant.
 *
 * `userId` est comparé en texte : la colonne est un `text` et contient
 * indifféremment un uuid, un pseudo ou un e-mail selon l'origine de la ligne.
 */
export async function getMessagesForExportByUserId({
  userId,
  limit,
}: {
  userId: string;
  limit: number;
}): Promise<
  {
    chatCreatedAt: Date;
    chatId: string;
    chatTags: string[];
    chatTitle: string;
    createdAt: Date;
    parts: unknown;
    role: string;
  }[]
> {
  try {
    const db = await dbReady();
    return (await db
      .select({
        chatCreatedAt: chat.createdAt,
        chatId: chat.id,
        chatTags: chat.tags,
        chatTitle: chat.title,
        createdAt: message.createdAt,
        parts: message.parts,
        role: message.role,
      })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(sql`${chat.userId}::text = ${userId}::text`)
      .orderBy(desc(chat.createdAt), asc(message.createdAt))
      .limit(limit)) as never;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function messageBelongsToChat({
  chatId,
  messageId,
}: {
  chatId: string;
  messageId: string;
}): Promise<boolean> {
  try {
    const db = await dbReady();
    const [row] = await db
      .select({ id: message.id })
      .from(message)
      .where(and(eq(message.chatId, chatId), eq(message.id, messageId)))
      .limit(1);
    return Boolean(row);
  } catch {
    return false;
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
    // Le vote existant doit être recherché par (chatId, messageId) — la
    // recherche par messageId seul peut remonter une ligne d'un autre chat.
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));

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

export async function recordTokenUsage({
  userId,
  userEmail,
  inputTokens = 0,
  outputTokens = 0,
  reasoningTokens = 0,
  totalTokens = 0,
  model = "default",
  isGhostMode = false,
  idempotencyKey,
  chatId = null,
  chatMode = null,
  chatProjectId = null,
}: {
  userId: string;
  userEmail?: string | null;
  inputTokens?: number;
  outputTokens?: number;
  // Décomposition du quota : les tokens de réflexion sont un sous-ensemble des
  // tokens de sortie côté fournisseur, mais l'AI SDK les sort de `outputTokens`.
  // Ils sont donc comptés à part pour rester lisibles, et inclus dans
  // `actualTotal` s'ils n'y sont pas déjà.
  reasoningTokens?: number;
  totalTokens?: number;
  model?: string;
  isGhostMode?: boolean;
  idempotencyKey?: string;
  // Conversation à l'origine de l'appel (migration 0033). Facultatif : les
  // lignes de planification peuvent être écrites sans conversation persistée.
  // Volontairement hors du chemin critique du quota — une colonne NOT NULL
  // ferait échouer le débit, qui doit rester garanti même si `UsageEvent` est
  // en retard de migration (le `catch` plus bas conserve alors le débit).
  chatId?: string | null;
  // Mode et projet de cette conversation, figés ici (migration 0035) : la
  // jointure `Chat` disparaît avec la conversation, et `Chat.projectId` est en
  // `ON DELETE SET NULL`. Un filtre de la page Statistiques appliqué plus tard
  // ne doit donc pas dépendre du fait que la conversation existe encore.
  chatMode?: "chat" | "agent" | null;
  chatProjectId?: string | null;
}) {
  const actualTotal = resolveBillableTotal({
    inputTokens,
    outputTokens,
    reasoningTokens,
    totalTokens,
  });

  if (
    actualTotal <= 0 &&
    (!inputTokens || inputTokens <= 0) &&
    (!outputTokens || outputTokens <= 0)
  ) {
    return;
  }

  let insertedUsageEventKey: string | null = null;
  try {
    await dbReady();
    if (!_rawClient) {
      return;
    }

    // Calcul du début de la semaine (Lundi 00:00 UTC)
    const now = new Date();
    const day = now.getUTCDay();
    const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), diff)
    );
    const weekStartStr = monday.toISOString().split("T")[0];

    const targetUserId = userId || userEmail || "";
    if (!targetUserId) {
      return;
    }

    let shouldDebit = true;
    if (idempotencyKey) {
      const safeKey = idempotencyKey.slice(0, 256);
      const safeInputTokens = Math.max(0, Math.floor(inputTokens || 0));
      const safeOutputTokens = Math.max(0, Math.floor(outputTokens || 0));
      const safeReasoningTokens = Math.max(0, Math.floor(reasoningTokens || 0));
      const safeTotalTokens = Math.max(0, Math.floor(actualTotal));
      // Un `chatId` non uuid (identifiant historique d'une autre forme) doit
      // faire perdre le lien, pas l'INSERT : on l'écarte plutôt que de laisser
      // Postgres rejeter l'ensemble de la ligne.
      const safeChatId =
        chatId && /^[0-9a-fA-F-]{36}$/.test(chatId) ? chatId : null;
      // INSERT avec le lien de conversation. Sur une base pas encore migrée en
      // 0033, Postgres rejette la colonne (42703) et l'on RETOMBE sur l'INSERT
      // historique : le lien est perdu, pas la ligne. Ce repli est ce qui rend
      // le déploiement sans risque — un environnement qui traîne une migration
      // de retard continue d'enregistrer sa consommation au lieu de la
      // perdre entièrement. La migration 0035 ajoute un TROISIÈME palier, dans
      // le même ordre : on descend d'un cran à chaque 42703, jamais plus bas.
      //
      // `client` est capturé localement : le garde `if (!_rawClient) return`
      // plus haut ne survit pas à la fermeture, et sans cette capture chaque
      // requête serait typée `Sql | null`.
      const client = _rawClient;
      // Même règle que pour `chatId` : un identifiant de projet mal formé perd
      // l'attribution, il ne doit pas faire échouer l'INSERT entier.
      const safeChatProjectId =
        chatProjectId && /^[0-9a-fA-F-]{36}$/.test(chatProjectId)
          ? chatProjectId
          : null;
      // `chatMode` est une énumération fermée, un cast `::varchar` inutile :
      // `postgres.js` l'échappe comme une chaîne.
      const safeChatMode =
        chatMode === "agent" ? "agent" : chatMode === "chat" ? "chat" : null;
      const insertWithAttribution = async (
        includeChatId: boolean,
        includeAttribution: boolean
      ) => {
        if (includeAttribution) {
          return client`
            INSERT INTO "UsageEvent" (
              "id", "userId", "model", "inputTokens", "outputTokens",
              "reasoningTokens", "totalTokens", "isGhostMode", "chatId",
              "chatMode", "chatProjectId"
            )
            VALUES (
              ${safeKey}, ${targetUserId}, ${model}, ${safeInputTokens},
              ${safeOutputTokens}, ${safeReasoningTokens},
              ${safeTotalTokens}, ${isGhostMode}, ${safeChatId}::uuid,
              ${safeChatMode}::varchar, ${safeChatProjectId}::uuid
            )
            ON CONFLICT ("id") DO NOTHING
            RETURNING "id"
          `;
        }
        if (includeChatId) {
          return client`
            INSERT INTO "UsageEvent" (
              "id", "userId", "model", "inputTokens", "outputTokens",
              "reasoningTokens", "totalTokens", "isGhostMode", "chatId"
            )
            VALUES (
              ${safeKey}, ${targetUserId}, ${model}, ${safeInputTokens},
              ${safeOutputTokens}, ${safeReasoningTokens},
              ${safeTotalTokens}, ${isGhostMode}, ${safeChatId}::uuid
            )
            ON CONFLICT ("id") DO NOTHING
            RETURNING "id"
          `;
        }
        return client`
          INSERT INTO "UsageEvent" (
            "id", "userId", "model", "inputTokens", "outputTokens",
            "reasoningTokens", "totalTokens", "isGhostMode"
          )
          VALUES (
            ${safeKey}, ${targetUserId}, ${model}, ${safeInputTokens},
            ${safeOutputTokens}, ${safeReasoningTokens},
            ${safeTotalTokens}, ${isGhostMode}
          )
          ON CONFLICT ("id") DO NOTHING
          RETURNING "id"
        `;
      };

      try {
        // On ne lit que la LONGUEUR de la liste renvoyée (`ON CONFLICT DO
        // NOTHING` + `RETURNING`) : le type précis de ligne n'a pas d'intérêt.
        // Les paliers sont essayés dans l'ordre décroissant de fidélité ; seul
        // un 42703 (colonne absente) fait descendre d'un cran, toute autre
        // erreur est réelle et remontée plus bas.
        const attempts: [boolean, boolean][] = [
          [true, true],
          [true, false],
          [false, false],
        ];
        let inserted: unknown[] = [];
        for (const [withChatId, withAttribution] of attempts) {
          try {
            inserted = await insertWithAttribution(withChatId, withAttribution);
            break;
          } catch (tierError) {
            if ((tierError as { code?: string })?.code !== "42703") {
              throw tierError;
            }
          }
        }
        shouldDebit = inserted.length > 0;
        if (shouldDebit) {
          insertedUsageEventKey = safeKey;
        }
      } catch (eventError) {
        // La table est ajoutée par la migration 0026, `reasoningTokens` par la
        // 0030, `chatId` par la 0033, l'attribution par la 0035. Tant qu'elles
        // ne sont pas appliquées, conserver le comptage historique plutôt que
        // de le perdre.
        console.warn(
          "UsageEvent indisponible, comptage direct conservé:",
          eventError
        );
      }
    }

    // weekly_usage.user_id est un INTEGER (table plateforme partagée avec le
    // backend mAI : handleGetUsage passe un integer). On n'y débite que les
    // identifiants numériques (users.id) ; les autres formats (uuid, emails)
    // ne sont pas comptabilisés ici — le quota hebdomadaire reste cohérent.
    const numericUserId = String(targetUserId).match(/^\d+$/)?.[0];
    if (shouldDebit && numericUserId) {
      // 1. Mise à jour ou insertion dans weekly_usage
      await _rawClient`
        INSERT INTO weekly_usage (user_id, week_start, tokens_used)
        VALUES (${Number(numericUserId)}, ${weekStartStr}::date, ${actualTotal})
        ON CONFLICT (user_id, week_start)
        DO UPDATE SET tokens_used = weekly_usage.tokens_used + ${actualTotal}
      `;
    }

    if (shouldDebit) {
      // 2. Enregistrement dans mprojects_api_logs
      try {
        await _rawClient`
          INSERT INTO mprojects_api_logs (api_key, endpoint, method, status_code, latency_ms, created_at)
          VALUES (
            ${targetUserId}::text,
            ${isGhostMode ? `/v1/chat/completions?ghost=true&model=${model}` : `/v1/chat/completions?model=${model}`}::text,
            'POST',
            200,
            1200,
            NOW()
          )
        `;
      } catch (logErr) {
        // Repli volontaire (l'usage a déjà été débité) — tracé pour audit.
        console.warn("Insertion mprojects_api_logs impossible:", logErr);
      }
    }
  } catch (err) {
    if (insertedUsageEventKey && _rawClient) {
      await _rawClient`
        DELETE FROM "UsageEvent" WHERE "id" = ${insertedUsageEventKey}
      `.catch(() => {});
    }
    console.error("Erreur recordTokenUsage direct en BDD:", err);
  }
}

export async function getWeeklyAiTokenUsage({
  userId,
}: {
  userId: string;
}): Promise<number | null> {
  try {
    await dbReady();
    const client = getRawClient();
    if (!client) return null;
    const rows = await client.unsafe<{ tokens_used: number | string }[]>(
      `SELECT COALESCE(tokens_used, 0)::bigint AS tokens_used
       FROM weekly_usage
       WHERE user_id::text = $1
         AND week_start = date_trunc('week', now() AT TIME ZONE 'UTC')::date
       LIMIT 1`,
      [userId]
    );
    return rows[0] ? Number(rows[0].tokens_used) : 0;
  } catch {
    return null;
  }
}
