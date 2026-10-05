/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — CONVERSATIONS DES LIVRES (vibe-books-conversations.ts)
 * Chaque Livre possède une conversation de groupe dans Messages
 * (dm_conversations.book_id, partner_id = "group:<uuid>") : les mécanismes de
 * groupe existants (envoi, réactions, épingles, recherche, non-lus, SSE)
 * fonctionnent sans modification. Ce module synchronise membres et métadonnées
 * à chaque mutation du Livre + backfill idempotent des Livres existants.
 * ============================================================================
 */

import { ensureDMTables, pushToUsers } from "./vibe-dms-core.ts";

let bookConvTablesReady = false;

/** Colonnes/index propres aux conversations de Livre (idempotent, 1×/isolate). */
export async function ensureBookConversationTables(sql: any): Promise<void> {
  if (bookConvTablesReady) return;
  try {
    await ensureDMTables().catch(() => {});
    await sql`ALTER TABLE dm_conversations ADD COLUMN IF NOT EXISTS book_id UUID`.catch(() => {});
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_dm_conversations_book ON dm_conversations(book_id) WHERE book_id IS NOT NULL`.catch(() => {});
    await sql`ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS attached_post_id UUID`.catch(() => {});
    await sql`CREATE INDEX IF NOT EXISTS idx_dm_attached_post ON direct_messages(attached_post_id) WHERE attached_post_id IS NOT NULL`.catch(() => {});
    bookConvTablesReady = true;
  } catch (err) {
    console.warn("[vibe-books-conversations] ensure tables skipped:", (err as any)?.message);
  }
}

/** Id de la conversation Messages d'un Livre (null si absente). */
export async function getBookConversationId(sql: any, bookId: string): Promise<string | null> {
  try {
    const rows = await sql`SELECT id FROM dm_conversations WHERE book_id = ${bookId}::uuid LIMIT 1`;
    return rows[0] ? String(rows[0].id) : null;
  } catch {
    return null;
  }
}

/** Membres de la conversation d'un Livre (depuis dm_group_members). */
async function fetchConversationMemberIds(sql: any, conversationId: string): Promise<number[]> {
  try {
    const rows = await sql`SELECT user_id FROM dm_group_members WHERE conversation_id = ${conversationId}::uuid`;
    return (rows as any[]).map((r) => Number(r.user_id)).filter((n) => Number.isFinite(n));
  } catch {
    return [];
  }
}

/**
 * Aligne dm_group_members sur vibe_book_members (upsert des rôles + purge des
 * partis). Retourne l'id de conversation et les membres synchronisés.
 */
export async function syncBookConversationMembers(
  sql: any,
  bookId: string
): Promise<{ conversationId: string | null; memberIds: number[] }> {
  const conversationId = await getBookConversationId(sql, bookId);
  if (!conversationId) return { conversationId: null, memberIds: [] };
  try {
    await sql`
      INSERT INTO dm_group_members (conversation_id, user_id, role, added_by)
      SELECT ${conversationId}::uuid, m.user_id,
             CASE WHEN m.role = 'owner' THEN 'admin' ELSE 'member' END,
             (SELECT user_id FROM vibe_books WHERE id = ${bookId}::uuid)
      FROM vibe_book_members m
      WHERE m.book_id = ${bookId}::uuid
      ON CONFLICT (conversation_id, user_id) DO UPDATE SET role = EXCLUDED.role
    `.catch(() => {});
    await sql`
      DELETE FROM dm_group_members
      WHERE conversation_id = ${conversationId}::uuid
        AND NOT EXISTS (
          SELECT 1 FROM vibe_book_members m
          WHERE m.book_id = ${bookId}::uuid AND m.user_id = dm_group_members.user_id
        )
    `.catch(() => {});
  } catch (err) {
    console.warn("[vibe-books-conversations] sync members failed:", (err as any)?.message);
  }
  const memberIds = await fetchConversationMemberIds(sql, conversationId);
  return { conversationId, memberIds };
}

/**
 * Garantit l'existence de la conversation du Livre + synchronise ses membres.
 * Retourne l'id de conversation (ou null en cas d'échec non bloquant).
 */
export async function ensureBookConversation(
  sql: any,
  book: { id: string; user_id: number; title: string }
): Promise<string | null> {
  try {
    await ensureBookConversationTables(sql);
    let conversationId = await getBookConversationId(sql, book.id);
    if (!conversationId) {
      try {
        const created = await sql`
          INSERT INTO dm_conversations
            (participant_one_id, participant_two_id, is_group, group_name, created_by, book_id,
             last_message_preview, last_message_at)
          VALUES (${book.user_id}, NULL, TRUE, ${book.title}, ${book.user_id}, ${book.id}::uuid,
                  'Conversation du Livre', NOW())
          RETURNING id
        `;
        conversationId = created[0]?.id ? String(created[0].id) : null;
      } catch {
        // course possible avec un autre isolate : la ligne existe peut-être déjà
        conversationId = await getBookConversationId(sql, book.id);
      }
    }
    if (!conversationId) return null;
    await syncBookConversationMembers(sql, book.id);
    return conversationId;
  } catch (err) {
    console.warn("[vibe-books-conversations] ensure failed:", (err as any)?.message);
    return null;
  }
}

/** Retire un membre (leave/kick) et prévient le membre retiré + les restants. */
export async function removeBookConversationMember(sql: any, bookId: string, userId: number): Promise<void> {
  try {
    const conversationId = await getBookConversationId(sql, bookId);
    if (!conversationId) return;
    await sql`
      DELETE FROM dm_group_members WHERE conversation_id = ${conversationId}::uuid AND user_id = ${userId}
    `.catch(() => {});
    const memberIds = await fetchConversationMemberIds(sql, conversationId);
    await pushToUsers([userId], "group_updated", { conversation_id: conversationId, action: "removed", book_id: bookId });
    await pushToUsers(memberIds, "group_updated", { conversation_id: conversationId, action: "updated", book_id: bookId });
  } catch (err) {
    console.warn("[vibe-books-conversations] remove member failed:", (err as any)?.message);
  }
}

/** Renomme la conversation (synchro du titre du Livre). */
export async function renameBookConversation(sql: any, bookId: string, title: string): Promise<void> {
  try {
    const conversationId = await getBookConversationId(sql, bookId);
    if (!conversationId) return;
    await sql`
      UPDATE dm_conversations SET group_name = ${title.slice(0, 100)} WHERE id = ${conversationId}::uuid
    `.catch(() => {});
    const memberIds = await fetchConversationMemberIds(sql, conversationId);
    await pushToUsers(memberIds, "group_updated", { conversation_id: conversationId, action: "renamed", book_id: bookId });
  } catch (err) {
    console.warn("[vibe-books-conversations] rename failed:", (err as any)?.message);
  }
}

/** Transfère la propriété : created_by + rôles dm_group_members. */
export async function transferBookConversationOwnership(
  sql: any,
  bookId: string,
  fromUserId: number,
  toUserId: number
): Promise<void> {
  try {
    const conversationId = await getBookConversationId(sql, bookId);
    if (!conversationId) return;
    await sql`
      UPDATE dm_conversations SET created_by = ${toUserId} WHERE id = ${conversationId}::uuid
    `.catch(() => {});
    await sql`
      UPDATE dm_group_members SET role = 'admin'
      WHERE conversation_id = ${conversationId}::uuid AND user_id = ${toUserId}
    `.catch(() => {});
    await sql`
      UPDATE dm_group_members SET role = 'member'
      WHERE conversation_id = ${conversationId}::uuid AND user_id = ${fromUserId}
    `.catch(() => {});
    const memberIds = await fetchConversationMemberIds(sql, conversationId);
    await pushToUsers(memberIds, "group_updated", { conversation_id: conversationId, action: "admin_transferred", book_id: bookId });
  } catch (err) {
    console.warn("[vibe-books-conversations] transfer failed:", (err as any)?.message);
  }
}

/** Supprime la conversation, ses messages et prévient les membres. */
export async function deleteBookConversation(sql: any, bookId: string): Promise<void> {
  try {
    const conversationId = await getBookConversationId(sql, bookId);
    if (!conversationId) return;
    const memberIds = await fetchConversationMemberIds(sql, conversationId);
    // dm_reactions n'a pas de FK sur direct_messages : purge explicite (comme les groupes)
    await sql`DELETE FROM dm_reactions WHERE message_id IN (SELECT id FROM direct_messages WHERE conversation_id = ${conversationId}::uuid)`.catch(() => {});
    await sql`DELETE FROM direct_messages WHERE conversation_id = ${conversationId}::uuid`.catch(() => {});
    await sql`DELETE FROM dm_conversations WHERE id = ${conversationId}::uuid`.catch(() => {});
    await pushToUsers(memberIds, "group_updated", { conversation_id: conversationId, action: "deleted", book_id: bookId });
  } catch (err) {
    console.warn("[vibe-books-conversations] delete failed:", (err as any)?.message);
  }
}

/** Backfill idempotent : conversation + membres pour chaque Livre qui n'en a pas. */
export async function backfillBookConversations(sql: any): Promise<void> {
  try {
    await ensureBookConversationTables(sql);
    await sql`
      INSERT INTO dm_conversations
        (participant_one_id, participant_two_id, is_group, group_name, created_by, book_id,
         last_message_preview, last_message_at)
      SELECT b.user_id, NULL, TRUE, b.title, b.user_id, b.id, 'Conversation du Livre', COALESCE(b.updated_at, NOW())
      FROM vibe_books b
      WHERE NOT EXISTS (SELECT 1 FROM dm_conversations dm WHERE dm.book_id = b.id)
    `.catch(() => {});
    await sql`
      INSERT INTO dm_group_members (conversation_id, user_id, role, added_by)
      SELECT dm.id, m.user_id, CASE WHEN m.role = 'owner' THEN 'admin' ELSE 'member' END, b.user_id
      FROM dm_conversations dm
      JOIN vibe_books b ON b.id = dm.book_id
      JOIN vibe_book_members m ON m.book_id = dm.book_id
      WHERE dm.book_id IS NOT NULL
      ON CONFLICT (conversation_id, user_id) DO NOTHING
    `.catch(() => {});
    await sql`
      UPDATE dm_group_members gm SET role = 'admin'
      WHERE gm.role <> 'admin'
        AND EXISTS (
          SELECT 1 FROM dm_conversations dm
          JOIN vibe_books b ON b.id = dm.book_id
          WHERE dm.id = gm.conversation_id AND b.user_id = gm.user_id
        )
    `.catch(() => {});
  } catch (err) {
    console.warn("[vibe-books-conversations] backfill failed:", (err as any)?.message);
  }
}
