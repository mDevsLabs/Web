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
  notInArray,
  type SQL,
  sql,
} from "drizzle-orm";
import { resolveBillableTotal } from "@/lib/agent/usage";
import type { VisibilityType } from "@/lib/chat/visibility";
import { ChatbotError } from "@/lib/errors";
import {
  agent,
  agentRun,
  agentUserInputRequest,
  chat,
  chatSecurity,
  type DBMessage,
  documentProposal,
  message,
  scheduledMessage,
  stream,
  vote,
} from "../schema";
import { _rawClient, dbReady, getRawClient } from "./connection";

export async function saveChat({
  id,
  userId,
  title,
  visibility,
  projectId,
  tags,
  customInstructions,
  modeId: _modeId,
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
      lastMessageAt: new Date(),
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
    return await db.transaction(async (tx) => {
      await tx.delete(chatSecurity).where(eq(chatSecurity.chatId, id));
      await tx.delete(vote).where(eq(vote.chatId, id));
      await tx.delete(message).where(eq(message.chatId, id));
      await tx.delete(stream).where(eq(stream.chatId, id));
      await tx
        .delete(agentUserInputRequest)
        .where(eq(agentUserInputRequest.chatId, id));
      await tx.delete(agentRun).where(eq(agentRun.chatId, id));
      await tx
        .update(scheduledMessage)
        .set({ chatId: null })
        .where(eq(scheduledMessage.chatId, id));
      await tx
        .update(scheduledMessage)
        .set({ resultChatId: null })
        .where(eq(scheduledMessage.resultChatId, id));
      await tx
        .update(documentProposal)
        .set({ chatId: null })
        .where(eq(documentProposal.chatId, id));
      const [chatsDeleted] = await tx
        .delete(chat)
        .where(eq(chat.id, id))
        .returning();
      return chatsDeleted ?? null;
    });
  } catch (error) {
    console.error(
      `[deleteChatById] Échec de suppression de la discussion ${id}:`,
      error
    );
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function deleteAllChatsByUserId({
  userId,
  userEmail,
}: {
  userId: string;
  userEmail?: string | null;
}) {
  try {
    const db = await dbReady();
    const ownerFilter = chatUserFilter(userId, userEmail);
    const userChats = await db
      .select({ id: chat.id })
      .from(chat)
      .where(ownerFilter);

    if (userChats.length === 0) {
      return { deletedCount: 0 };
    }

    const chatIds = userChats.map((c) => c.id);
    return await db.transaction(async (tx) => {
      await tx
        .delete(chatSecurity)
        .where(inArray(chatSecurity.chatId, chatIds));
      await tx.delete(vote).where(inArray(vote.chatId, chatIds));
      await tx.delete(message).where(inArray(message.chatId, chatIds));
      await tx.delete(stream).where(inArray(stream.chatId, chatIds));
      await tx
        .delete(agentUserInputRequest)
        .where(inArray(agentUserInputRequest.chatId, chatIds));
      await tx.delete(agentRun).where(inArray(agentRun.chatId, chatIds));
      await tx
        .update(scheduledMessage)
        .set({ chatId: null })
        .where(inArray(scheduledMessage.chatId, chatIds));
      await tx
        .update(scheduledMessage)
        .set({ resultChatId: null })
        .where(inArray(scheduledMessage.resultChatId, chatIds));
      await tx
        .update(documentProposal)
        .set({ chatId: null })
        .where(inArray(documentProposal.chatId, chatIds));

      const deletedChats = await tx.delete(chat).where(ownerFilter).returning();

      return { deletedCount: deletedChats.length };
    });
  } catch (error) {
    console.error(
      `[deleteAllChatsByUserId] Échec de suppression de l'historique (${userId}):`,
      error
    );
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
      // Pinned first, then lastMessageAt desc
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
          isSecure: sql<boolean>`EXISTS (
            SELECT 1 FROM "ChatSecurity" cs WHERE cs."chatId" = ${chat.id}
          )`,
          lastMessageAt: chat.lastMessageAt,
          mode: chat.mode,
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
        .orderBy(
          desc(chat.pinned),
          desc(chat.lastMessageAt),
          desc(chat.createdAt)
        )
        .limit(extendedLimit);
    };

    let filteredChats: any[] = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);

      if (selectedChat) {
        filteredChats = await query(
          sql`(${chat.pinned}, ${chat.lastMessageAt}) > (${selectedChat.pinned}, ${selectedChat.lastMessageAt})`
        );
      } else {
        // Le chat repère a pu être supprimé : repli gracieux sur le début sans casser SWR.
        filteredChats = await query();
      }
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);

      if (selectedChat) {
        filteredChats = await query(
          sql`(${chat.pinned}, ${chat.lastMessageAt}) < (${selectedChat.pinned}, ${selectedChat.lastMessageAt})`
        );
      } else {
        // Le chat repère a pu être supprimé : repli gracieux sur le début sans casser SWR.
        filteredChats = await query();
      }
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
  isArchived: _isArchived,
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
    return await db.transaction(async (tx) => {
      await tx
        .delete(chatSecurity)
        .where(inArray(chatSecurity.chatId, chatIds));
      await tx.delete(vote).where(inArray(vote.chatId, chatIds));
      await tx.delete(message).where(inArray(message.chatId, chatIds));
      await tx.delete(stream).where(inArray(stream.chatId, chatIds));
      await tx
        .delete(agentUserInputRequest)
        .where(inArray(agentUserInputRequest.chatId, chatIds));
      await tx.delete(agentRun).where(inArray(agentRun.chatId, chatIds));
      await tx
        .update(scheduledMessage)
        .set({ chatId: null })
        .where(inArray(scheduledMessage.chatId, chatIds));
      await tx
        .update(scheduledMessage)
        .set({ resultChatId: null })
        .where(inArray(scheduledMessage.resultChatId, chatIds));
      await tx
        .update(documentProposal)
        .set({ chatId: null })
        .where(inArray(documentProposal.chatId, chatIds));

      const deleted = await tx.delete(chat).where(where).returning();
      return { updated: deleted.length };
    });
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
    await Promise.all(
      existing.map((row) => {
        const merged = [...new Set([...(row.tags || []), ...sanitized])].slice(
          0,
          10
        );
        return db.update(chat).set({ tags: merged }).where(eq(chat.id, row.id));
      })
    );
    return { updated: existing.length };
  }
  return { updated: 0 };
}

export async function saveMessages({ messages }: { messages: DBMessage[] }) {
  try {
    const db = await dbReady();
    const result = await db.insert(message).values(messages);

    // Met à jour `lastMessageAt` avec l'horodatage le plus récent des messages
    // enregistrés afin que le tri de l'historique reflète le dernier message.
    const latestByChat = new Map<string, number>();
    for (const msg of messages) {
      const ts = msg.createdAt ? new Date(msg.createdAt).getTime() : Date.now();
      const prev = latestByChat.get(msg.chatId) ?? 0;
      if (ts > prev) {
        latestByChat.set(msg.chatId, ts);
      }
    }
    for (const [targetChatId, maxMs] of latestByChat) {
      const iso = new Date(maxMs).toISOString();
      await db
        .update(chat)
        .set({
          lastMessageAt: sql`GREATEST(${chat.lastMessageAt}, ${iso}::timestamp)`,
        })
        .where(eq(chat.id, targetChatId));
    }

    return result;
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

export async function getMessagesByChatId({
  id,
  limit,
}: {
  id: string;
  /**
   * Nombre maximal de messages, en gardant les PLUS RÉCENTS.
   *
   * `undefined` conserve le contrat historique (tout l'historique), utilisé
   * par l'interface, les exports et les forks. Le prompt IA, lui, n'a pas
   * besoin de rejouer des centaines de messages : la borne évite de charger
   * et de convertir un historique entier à chaque tour.
   */
  limit?: number;
}) {
  if (!id || typeof id !== "string") {
    return [];
  }
  try {
    const db = await dbReady();
    if (limit && limit > 0) {
      // Tri décroissant pour prendre la FIN de l'historique, puis remise en
      // ordre chronologique : le modèle reçoit la conversation dans le bon
      // sens, et la coupure ne retire que les messages les plus anciens.
      const recent = await db
        .select()
        .from(message)
        .where(eq(message.chatId, id))
        .orderBy(desc(message.createdAt))
        .limit(limit);
      return recent.reverse();
    }
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
      .where(
        and(
          sql`${chat.userId}::text = ${userId}::text`,
          // Une conversation sécurisée est exclue de l'export global : le
          // fichier ne doit pas contourner un PIN. Son export individuel reste
          // disponible après déverrouillage.
          sql`NOT EXISTS (
            SELECT 1 FROM "ChatSecurity" cs WHERE cs."chatId" = ${chat.id}
          )`
        )
      )
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

/**
 * Volet « suppression » du remplacement différé d'une régénération (truncate).
 *
 * Supprime les messages du chat POSTÉRIEURS au message repère — jamais le
 * repère lui-même — sauf ceux de la liste blanche (`keepIds` : la nouvelle
 * réponse et les messages du tour en cours), ainsi que leurs votes.
 *
 * Cette fonction n'est appelée qu'APRÈS la persistance de la nouvelle réponse
 * (issue #46) : supprimer avant, c'était détruire le tour valide dès qu'une
 * génération échouait. Un repère introuvable ou hors du chat ne supprime rien
 * (fail-safe : la perte n'est jamais dans le sens de l'effacement).
 */
export async function deleteMessagesAfterMessageId({
  chatId,
  keepIds,
  messageId,
}: {
  chatId: string;
  keepIds: string[];
  messageId: string;
}): Promise<string[]> {
  try {
    const db = await dbReady();
    return await db.transaction(async (tx) => {
      const [anchor] = await tx
        .select({ createdAt: message.createdAt, id: message.id })
        .from(message)
        .where(and(eq(message.chatId, chatId), eq(message.id, messageId)))
        .limit(1);
      if (!anchor) {
        return [];
      }
      const trailing = await tx
        .select({ id: message.id })
        .from(message)
        .where(
          and(
            eq(message.chatId, chatId),
            gt(message.createdAt, anchor.createdAt),
            keepIds.length > 0 ? notInArray(message.id, keepIds) : undefined
          )
        );
      const trailingIds = trailing.map((row) => row.id);
      if (trailingIds.length === 0) {
        return [];
      }
      await tx
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, trailingIds))
        );
      await tx
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, trailingIds))
        );
      return trailingIds;
    });
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
    // Invariant : une conversation privée ne conserve jamais de PIN. Le
    // passage en privé efface la ligne dans la même transaction que la
    // visibilité ; les appelants refusent d'abord le changement si la session
    // n'est pas déverrouillée (le PIN ne se retire pas sans le connaître).
    return await db.transaction(async (tx) => {
      const result = await tx
        .update(chat)
        .set({ visibility })
        .where(eq(chat.id, chatId))
        .returning();
      if (visibility === "private") {
        await tx.delete(chatSecurity).where(eq(chatSecurity.chatId, chatId));
      }
      return result;
    });
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

    // weekly_usage.user_id est un INTEGER (table plateforme partagée avec le
    // backend mAI : handleGetUsage passe un integer). On n'y débite que les
    // identifiants numériques (users.id) ; les autres formats (uuid, emails)
    // ne sont pas comptabilisés ici — le quota hebdomadaire reste cohérent.
    const numericUserId = String(targetUserId).match(/^\d+$/)?.[0] ?? null;

    // Sans clé d'idempotence, l'événement reçoit un identifiant neuf : il est
    // bien enregistré, une seule fois, et le débit reste attaché à CETTE
    // insertion. Auparavant les appels sans clé n'écrivaient pas UsageEvent.
    const safeKey = (idempotencyKey ?? crypto.randomUUID()).slice(0, 256);
    const safeInputTokens = Math.max(0, Math.floor(inputTokens || 0));
    const safeOutputTokens = Math.max(0, Math.floor(outputTokens || 0));
    const safeReasoningTokens = Math.max(0, Math.floor(reasoningTokens || 0));
    const safeTotalTokens = Math.max(0, Math.floor(actualTotal));
    // Un `chatId` non uuid (identifiant historique d'une autre forme) doit
    // faire perdre le lien, pas l'INSERT : on l'écarte plutôt que de laisser
    // Postgres rejeter l'ensemble de la ligne.
    const safeChatId =
      chatId && /^[0-9a-fA-F-]{36}$/.test(chatId) ? chatId : null;
    // Même règle que pour `chatId` : un identifiant de projet mal formé perd
    // l'attribution, il ne doit pas faire échouer l'INSERT entier.
    const safeChatProjectId =
      chatProjectId && /^[0-9a-fA-F-]{36}$/.test(chatProjectId)
        ? chatProjectId
        : null;
    const safeChatMode =
      chatMode === "agent" ? "agent" : chatMode === "chat" ? "chat" : null;
    // `client` est capturé localement : le garde `if (!_rawClient) return`
    // plus haut ne survit pas à la fermeture.
    const client = _rawClient;

    /**
     * UN aller-retour pour les deux écritures qui comptent.
     *
     * Avant : `UsageEvent`, `weekly_usage`, puis `mprojects_api_logs` — trois
     * requêtes séquentielles par réponse IA. `mprojects_api_logs` documente
     * l'API publique et n'était lu par aucune surface de l'hôte : il dupliquait
     * `UsageEvent` sur le chemin chaud et disparaît. Les deux écritures
     * restantes partent dans la même requête ; le débit est conditionné à
     * l'insertion RÉELLE par une CTE, donc un rejeu idempotent ne débite pas
     * deux fois.
     */
    const insertUsage = async (
      withChatId: boolean,
      withAttribution: boolean
    ) => {
      const columns = [
        "id",
        "userId",
        "model",
        "inputTokens",
        "outputTokens",
        "reasoningTokens",
        "totalTokens",
        "isGhostMode",
      ];
      const values: (string | number | boolean | null)[] = [
        safeKey,
        targetUserId,
        model,
        safeInputTokens,
        safeOutputTokens,
        safeReasoningTokens,
        safeTotalTokens,
        isGhostMode,
      ];
      if (withChatId) {
        columns.push("chatId");
        values.push(safeChatId);
      }
      if (withAttribution) {
        columns.push("chatMode", "chatProjectId");
        values.push(safeChatMode, safeChatProjectId);
      }
      const placeholders = columns.map((column, index) => {
        const position = `$${index + 1}`;
        if (column === "chatId" || column === "chatProjectId") {
          return `${position}::uuid`;
        }
        if (column === "chatMode") {
          return `${position}::varchar`;
        }
        return position;
      });
      const userIdParam = values.length + 1;
      const weekParam = values.length + 2;
      const totalParam = values.length + 3;
      // `debited` n'est pas relue : une CTE modificatrice s'exécute dès lors
      // que l'instruction est présente. Le SELECT final renvoie les lignes
      // réellement insérées, ce qui suffit à savoir si le débit a eu lieu.
      const query = `WITH inserted AS (
          INSERT INTO "UsageEvent" (${columns.map((column) => `"${column}"`).join(", ")})
          VALUES (${placeholders.join(", ")})
          ON CONFLICT ("id") DO NOTHING
          RETURNING "id"
        ), debited AS (
          INSERT INTO weekly_usage (user_id, week_start, tokens_used)
          SELECT $${userIdParam}::int, $${weekParam}::date, $${totalParam}::int
          FROM inserted
          WHERE $${userIdParam}::int IS NOT NULL
          ON CONFLICT (user_id, week_start)
          DO UPDATE SET tokens_used = weekly_usage.tokens_used + $${totalParam}::int
        )
        SELECT "id" FROM inserted`;
      return client.unsafe(query, [
        ...values,
        numericUserId ? Number(numericUserId) : null,
        weekStartStr,
        safeTotalTokens,
      ]);
    };

    try {
      // La table est ajoutée par la migration 0026, `reasoningTokens` par la
      // 0030, `chatId` par la 0033, l'attribution par la 0035. On descend d'un
      // cran à chaque 42703 (colonne absente) : un environnement qui traîne une
      // migration de retard continue d'enregistrer sa consommation.
      const attempts: [boolean, boolean][] = [
        [true, true],
        [true, false],
        [false, false],
      ];
      for (const [withChatId, withAttribution] of attempts) {
        try {
          await insertUsage(withChatId, withAttribution);
          return;
        } catch (tierError) {
          if ((tierError as { code?: string })?.code !== "42703") {
            throw tierError;
          }
        }
      }

      // Repli ultime : aucune colonne d'attribution n'est disponible. Le quota
      // hebdomadaire reste débité, comme avant la migration 0026.
      if (numericUserId) {
        await client`
          INSERT INTO weekly_usage (user_id, week_start, tokens_used)
          VALUES (${Number(numericUserId)}, ${weekStartStr}::date, ${safeTotalTokens})
          ON CONFLICT (user_id, week_start)
          DO UPDATE SET tokens_used = weekly_usage.tokens_used + ${safeTotalTokens}
        `;
      }
      console.warn(
        "UsageEvent indisponible, comptage direct conservé (aucun palier n'a abouti)."
      );
    } catch (eventError) {
      // Une seule instruction atomique : un échec n'a rien écrit, il n'y a
      // donc rien à compenser.
      console.error("Erreur recordTokenUsage direct en BDD:", eventError);
    }
  } catch (err) {
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
