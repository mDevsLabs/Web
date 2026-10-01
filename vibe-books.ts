/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — BOOKS / VIBE PRÉFÉRÉES (vibe-books.ts)
 * Collections de Vibe (max 5 Livres possédés par compte), avec icône lucide +
 * titre. Les Livres sont COLLABORATIFS : on les rejoint par lien/code, tous
 * les membres peuvent inviter et enrichir, seul le créateur renomme/supprime.
 * ============================================================================
 */

import type { Hono } from "npm:hono@4";
import { extractToken, getDb, verifyToken } from "./config.ts";
import type { RegisterMultiFn } from "./vibe-common.ts";
import { attachBookRefs, attachQuotedPosts, stripHtmlTags } from "./vibe-posts-core.ts";
import { pushRealtimeEvent } from "./realtime.ts";
import { pushToUsers } from "./vibe-dms-core.ts";
import {
  backfillBookConversations,
  deleteBookConversation,
  ensureBookConversation,
  getBookConversationId,
  removeBookConversationMember,
  renameBookConversation,
  transferBookConversationOwnership,
} from "./vibe-books-conversations.ts";

/** Limite de Livres possédés par compte (les Livres rejoints ne comptent pas). */
export const MAX_BOOKS_PER_USER = 5;

/** Alphabet sans caractères ambigus (pas de I, L, O, 0, 1). */
export const BOOK_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const BOOK_CODE_LENGTH = 8;

export function makeBookCode(): string {
  const bytes = new Uint8Array(BOOK_CODE_LENGTH);
  crypto.getRandomValues(bytes);
  let code = "";
  for (let i = 0; i < BOOK_CODE_LENGTH; i++) {
    code += BOOK_CODE_ALPHABET[bytes[i] % BOOK_CODE_ALPHABET.length];
  }
  return code;
}

/** Normalise un code brut ou une URL de partage (« .../books/join/CODE »). */
export function normalizeBookCode(raw: unknown): string {
  const text = String(raw ?? "").trim();
  if (!text) return "";
  const segment = text.includes("/") ? text.split(/[/?#]/).filter(Boolean).pop() || "" : text;
  return segment.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
}

let booksSchemaReady = false;
export async function ensureBooksTables(sql: any) {
  if (booksSchemaReady) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS vibe_books (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id INTEGER NOT NULL,
        title VARCHAR(60) NOT NULL,
        icon VARCHAR(40) NOT NULL DEFAULT 'BookHeart',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS vibe_book_items (
        book_id UUID NOT NULL REFERENCES vibe_books(id) ON DELETE CASCADE,
        post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        added_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (book_id, post_id)
      )
    `;
    // Collaboration : code de partage + attribution des Vibe ajoutées
    await sql`ALTER TABLE vibe_books ADD COLUMN IF NOT EXISTS join_code VARCHAR(12)`;
    await sql`ALTER TABLE vibe_books ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_vibe_books_join_code ON vibe_books(join_code) WHERE join_code IS NOT NULL`;
    // Livres publics (lecture seule par tous) + références de livres dans les posts
    await sql`ALTER TABLE vibe_books ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE`;
    await sql`
      CREATE TABLE IF NOT EXISTS post_book_refs (
        post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        book_id UUID NOT NULL REFERENCES vibe_books(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (post_id, book_id)
      )
    `.catch(() => {});
    await sql`CREATE INDEX IF NOT EXISTS idx_post_book_refs_book ON post_book_refs(book_id)`.catch(() => {});
    await sql`
      CREATE TABLE IF NOT EXISTS vibe_book_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        book_id UUID NOT NULL REFERENCES vibe_books(id) ON DELETE CASCADE,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) DEFAULT 'member',
        joined_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (book_id, user_id)
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_book_members_book ON vibe_book_members(book_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_book_members_user ON vibe_book_members(user_id)`;
    await sql`ALTER TABLE vibe_book_items ADD COLUMN IF NOT EXISTS added_by BIGINT`;
    // Épingles de contenu (max 3 par Livre) + discussion du Livre
    await sql`ALTER TABLE vibe_book_items ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE`.catch(() => {});
    await sql`ALTER TABLE vibe_book_items ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ`.catch(() => {});
    await sql`ALTER TABLE vibe_book_items ADD COLUMN IF NOT EXISTS pinned_by BIGINT`.catch(() => {});
    await sql`
      CREATE TABLE IF NOT EXISTS vibe_book_comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        book_id UUID NOT NULL REFERENCES vibe_books(id) ON DELETE CASCADE,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `.catch(() => {});
    await sql`CREATE INDEX IF NOT EXISTS idx_book_comments_book ON vibe_book_comments(book_id, created_at DESC)`.catch(() => {});
    // Discussion : réponses citées + réactions emoji (migration 024)
    await sql`ALTER TABLE vibe_book_comments ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES vibe_book_comments(id) ON DELETE SET NULL`.catch(() => {});
    await sql`
      CREATE TABLE IF NOT EXISTS vibe_book_comment_reactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        comment_id UUID NOT NULL REFERENCES vibe_book_comments(id) ON DELETE CASCADE,
        user_id BIGINT NOT NULL,
        emoji TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (comment_id, user_id, emoji)
      )
    `.catch(() => {});
    await sql`CREATE INDEX IF NOT EXISTS idx_book_comment_reactions_comment ON vibe_book_comment_reactions(comment_id)`.catch(() => {});
    // Rétro-compat : inscrire les créateurs existants comme membres propriétaires
    await sql`
      INSERT INTO vibe_book_members (book_id, user_id, role)
      SELECT b.id, b.user_id, 'owner' FROM vibe_books b
      WHERE NOT EXISTS (SELECT 1 FROM vibe_book_members m WHERE m.book_id = b.id AND m.user_id = b.user_id)
    `.catch(() => {});
    // Rétro-compat : doter les Livres existants d'un code de partage
    const missing = await sql`SELECT id FROM vibe_books WHERE join_code IS NULL LIMIT 500`.catch(() => []);
    for (const row of missing) {
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          await sql`UPDATE vibe_books SET join_code = ${makeBookCode()} WHERE id = ${row.id}::uuid AND join_code IS NULL`;
          break;
        } catch {
          // collision de code : nouvelle tentative
        }
      }
    }
    // Conversation Messages de chaque Livre (création + rattachement des membres)
    await backfillBookConversations(sql).catch(() => {});
    booksSchemaReady = true;
  } catch (err) {
    console.error("[vibe-books] ensure tables error:", err);
  }
}

async function getAuthUserId(c: any): Promise<number | null> {
  try {
    const token = extractToken(c.req.raw);
    if (!token) return null;
    const payload = await verifyToken(token);
    const userId = Number(payload.sub || (payload as any).id || (payload as any).userId);
    return userId && !isNaN(userId) ? userId : null;
  } catch {
    return null;
  }
}

/** Clause d'appartenance : propriétaire OU membre inscrit. */
const bookAccessClause = (sql: any, userId: number) => sql`
  (b.user_id = ${userId} OR EXISTS (SELECT 1 FROM vibe_book_members m WHERE m.book_id = b.id AND m.user_id = ${userId}))
`;

async function fetchBookMembers(sql: any, bookId: string) {
  return await sql`
    SELECT m.user_id, m.role, m.joined_at, u.username, pr.display_name, pr.avatar_url
    FROM vibe_book_members m
    JOIN users u ON u.id = m.user_id
    LEFT JOIN profiles pr ON pr.user_id = m.user_id
    WHERE m.book_id = ${bookId}::uuid
    ORDER BY (m.role = 'owner') DESC, m.joined_at ASC
    LIMIT 100
  `;
}

export function registerVibeBooksRoutes(app: Hono, registerMulti: RegisterMultiFn) {
  // 1. LISTE DES LIVRES ACCESSIBLES (possédés + rejoints)
  const handleListBooks = async (c: any) => {
    try {
      const userId = await getAuthUserId(c);
      if (!userId) return c.json({ error: "Non authentifié." }, 401);
      const sql = getDb();
      await ensureBooksTables(sql);

      const postId = c.req.query("post_id") || "";
      const rows = await sql`
        SELECT b.id, b.title, b.icon, b.created_at, b.join_code, b.user_id, COALESCE(b.is_public, FALSE) AS is_public,
               (b.user_id = ${userId}) AS is_owner,
               COALESCE(
                 (SELECT m.role FROM vibe_book_members m WHERE m.book_id = b.id AND m.user_id = ${userId} LIMIT 1),
                 CASE WHEN b.user_id = ${userId} THEN 'owner' ELSE 'member' END
               ) AS role,
               (SELECT COUNT(*) FROM vibe_book_items bi WHERE bi.book_id = b.id) AS items_count,
               (SELECT COUNT(*) FROM vibe_book_members bm WHERE bm.book_id = b.id) AS members_count,
               (SELECT dm.id FROM dm_conversations dm WHERE dm.book_id = b.id LIMIT 1) AS conversation_id,
               ${postId ? sql`EXISTS (SELECT 1 FROM vibe_book_items bi2 WHERE bi2.book_id = b.id AND bi2.post_id = ${postId}::uuid)` : sql`FALSE`} AS contains_post
        FROM vibe_books b
        WHERE ${bookAccessClause(sql, userId)}
        ORDER BY (b.user_id = ${userId}) DESC, b.created_at ASC
      `;

      const ownedRows = await sql`SELECT COUNT(*) AS n FROM vibe_books WHERE user_id = ${userId}`;

      return c.json({
        success: true,
        books: rows,
        maxBooks: MAX_BOOKS_PER_USER,
        ownedCount: Number(ownedRows[0]?.n || 0),
      });
    } catch (err: any) {
      console.error("[vibe-books] List error:", err);
      return c.json({ error: "Erreur lors de la récupération des Livres." }, 500);
    }
  };
  registerMulti("get", ["/api/vibe/books", "/vibe/books", "/v1/books"], handleListBooks);

  // 2. CRÉATION D'UN LIVRE (max 5 possédés par compte, code de partage inclus)
  const handleCreateBook = async (c: any) => {
    try {
      const userId = await getAuthUserId(c);
      if (!userId) return c.json({ error: "Non authentifié." }, 401);
      const body = await c.req.json().catch(() => ({}));
      const title = String(body?.title || "").trim();
      const icon = String(body?.icon || "BookHeart").trim().slice(0, 40);
      const isPublic = Boolean(body?.is_public);

      if (!title) return c.json({ error: "Veuillez donner un titre à votre Livre." }, 400);
      if (title.length > 60) return c.json({ error: "Le titre est limité à 60 caractères." }, 400);

      const sql = getDb();
      await ensureBooksTables(sql);
      const countRows = await sql`SELECT COUNT(*) AS n FROM vibe_books WHERE user_id = ${userId}`;
      if (Number(countRows[0]?.n || 0) >= MAX_BOOKS_PER_USER) {
        return c.json({ error: `Vous avez atteint la limite de ${MAX_BOOKS_PER_USER} Livres par compte.` }, 403);
      }

      let inserted: any[] = [];
      for (let attempt = 0; attempt < 5 && inserted.length === 0; attempt++) {
        const code = makeBookCode();
        try {
          inserted = await sql`
            INSERT INTO vibe_books (user_id, title, icon, join_code, is_public)
            VALUES (${userId}, ${title}, ${icon}, ${code}, ${isPublic})
            RETURNING id, title, icon, created_at, join_code, is_public
          `;
        } catch (err: any) {
          const msg = String(err?.message || "").toLowerCase();
          if (!msg.includes("duplicate") && !msg.includes("unique")) throw err;
        }
      }
      if (inserted.length === 0) {
        return c.json({ error: "Impossible de créer le Livre. Réessayez." }, 500);
      }

      await sql`
        INSERT INTO vibe_book_members (book_id, user_id, role)
        VALUES (${inserted[0].id}::uuid, ${userId}, 'owner')
        ON CONFLICT (book_id, user_id) DO NOTHING
      `.catch(() => {});

      // Conversation Messages du Livre : créée immédiatement pour le propriétaire
      const conversationId = await ensureBookConversation(sql, {
        id: String(inserted[0].id),
        user_id: userId,
        title: String(inserted[0].title || title),
      }).catch(() => null);
      if (conversationId) {
        await pushRealtimeEvent(userId, "group_updated", {
          conversation_id: conversationId,
          action: "created",
          book_id: String(inserted[0].id),
        }).catch(() => {});
      }

      return c.json({
        success: true,
        book: {
          ...inserted[0],
          items_count: 0,
          contains_post: false,
          is_owner: true,
          role: "owner",
          members_count: 1,
          conversation_id: conversationId || null,
        },
      }, 201);
    } catch (err: any) {
      console.error("[vibe-books] Create error:", err);
      return c.json({ error: "Erreur lors de la création du Livre." }, 500);
    }
  };
  registerMulti("post", ["/api/vibe/books", "/vibe/books", "/v1/books"], handleCreateBook);

  // 3. MISE À JOUR D'UN LIVRE (titre / icône — créateur uniquement)
  const handleUpdateBook = async (c: any) => {
    try {
      const userId = await getAuthUserId(c);
      if (!userId) return c.json({ error: "Non authentifié." }, 401);
      const bookId = c.req.param("bookId");
      const body = await c.req.json().catch(() => ({}));
      const title = body?.title !== undefined ? String(body.title).trim() : null;
      const icon = body?.icon !== undefined ? String(body.icon).trim().slice(0, 40) : null;
      const isPublic = body?.is_public !== undefined ? Boolean(body.is_public) : null;

      if (title !== null && !title) return c.json({ error: "Le titre ne peut pas être vide." }, 400);

      const sql = getDb();
      await ensureBooksTables(sql);
      const updated = await sql`
        UPDATE vibe_books SET
          title = ${title ?? sql`title`},
          icon = ${icon ?? sql`icon`},
          is_public = ${isPublic ?? sql`is_public`},
          updated_at = NOW()
        WHERE id = ${bookId}::uuid AND user_id = ${userId}
        RETURNING id, title, icon, created_at, join_code, is_public
      `;
      if (updated.length === 0) return c.json({ error: "Livre introuvable." }, 404);

      // Synchro du titre de la conversation Messages du Livre
      if (title) await renameBookConversation(sql, bookId, title).catch(() => {});

      return c.json({ success: true, book: { ...updated[0], is_owner: true, role: "owner", conversation_id: await getBookConversationId(sql, bookId) } });
    } catch (err: any) {
      console.error("[vibe-books] Update error:", err);
      return c.json({ error: "Erreur lors de la mise à jour du Livre." }, 500);
    }
  };
  registerMulti("post", [
    "/api/vibe/books/:bookId/update",
    "/vibe/books/:bookId/update",
    "/v1/books/:bookId/update",
  ], handleUpdateBook);

  // 4. SUPPRESSION D'UN LIVRE (créateur uniquement, les Vibe ne sont pas supprimées)
  const handleDeleteBook = async (c: any) => {
    try {
      const userId = await getAuthUserId(c);
      if (!userId) return c.json({ error: "Non authentifié." }, 401);
      const bookId = c.req.param("bookId");
      const sql = getDb();
      await ensureBooksTables(sql);
      const deleted = await sql`
        DELETE FROM vibe_books WHERE id = ${bookId}::uuid AND user_id = ${userId} RETURNING id
      `;
      if (deleted.length === 0) return c.json({ error: "Livre introuvable." }, 404);
      await deleteBookConversation(sql, bookId).catch(() => {});
      return c.json({ success: true });
    } catch (err: any) {
      console.error("[vibe-books] Delete error:", err);
      return c.json({ error: "Erreur lors de la suppression du Livre." }, 500);
    }
  };
  registerMulti("delete", ["/api/vibe/books/:bookId", "/vibe/books/:bookId", "/v1/books/:bookId"], handleDeleteBook);

  // 5. REJOINDRE UN LIVRE PAR CODE / LIEN (adhésion immédiate)
  const handleJoinBook = async (c: any) => {
    try {
      const userId = await getAuthUserId(c);
      if (!userId) return c.json({ error: "Non authentifié." }, 401);
      const body = await c.req.json().catch(() => ({}));
      const code = normalizeBookCode(body?.code);
      if (code.length < 4) {
        return c.json({ success: false, error: "Code d'invitation invalide." }, 400);
      }

      const sql = getDb();
      await ensureBooksTables(sql);
      const rows = await sql`
        SELECT id, user_id, title, icon, join_code FROM vibe_books WHERE join_code = ${code} LIMIT 1
      `;
      if (rows.length === 0) {
        return c.json({ success: false, error: "Aucun Livre ne correspond à ce code." }, 404);
      }

      const book = rows[0];
      const isOwner = Number(book.user_id) === userId;
      let alreadyMember = isOwner;
      if (!isOwner) {
        const inserted = await sql`
          INSERT INTO vibe_book_members (book_id, user_id, role)
          VALUES (${book.id}::uuid, ${userId}, 'member')
          ON CONFLICT (book_id, user_id) DO NOTHING
          RETURNING id
        `;
        alreadyMember = inserted.length === 0;
        if (!alreadyMember) {
          await sql`UPDATE vibe_books SET updated_at = NOW() WHERE id = ${book.id}::uuid`.catch(() => {});
          try {
            await sql`
              INSERT INTO notifications (recipient_id, actor_id, type, message)
              VALUES (${book.user_id}, ${userId}, 'book_join', ${`a rejoint votre Livre « ${book.title} »`})
            `;
            await pushRealtimeEvent(Number(book.user_id), "notification", {
              type: "book_join",
              book_id: book.id,
              actor_id: userId,
            });
          } catch {
            // notification best-effort
          }
        }
      }

      const countRows = await sql`SELECT COUNT(*) AS n FROM vibe_book_members WHERE book_id = ${book.id}::uuid`;

      // Conversation Messages du Livre : garantie + membres synchronisés
      const conversationId = await ensureBookConversation(sql, {
        id: String(book.id),
        user_id: Number(book.user_id),
        title: String(book.title),
      }).catch(() => null);
      if (conversationId && !alreadyMember) {
        const memberRows = await sql`
          SELECT user_id FROM dm_group_members WHERE conversation_id = ${conversationId}::uuid
        `.catch(() => []);
        const memberIds = (memberRows as any[]).map((r) => Number(r.user_id));
        await pushToUsers(memberIds.length > 0 ? memberIds : [userId], "group_updated", {
          conversation_id: conversationId,
          action: "added",
          book_id: String(book.id),
        }).catch(() => {});
      }

      return c.json({
        success: true,
        already_member: alreadyMember,
        book: {
          id: book.id,
          title: book.title,
          icon: book.icon,
          join_code: book.join_code,
          user_id: book.user_id,
          is_owner: isOwner,
          role: isOwner ? "owner" : "member",
          members_count: Number(countRows[0]?.n || 0),
          conversation_id: conversationId || null,
        },
      });
    } catch (err: any) {
      console.error("[vibe-books] Join error:", err);
      return c.json({ error: "Erreur lors de la jointure du Livre." }, 500);
    }
  };
  registerMulti("post", ["/api/vibe/books/join", "/vibe/books/join", "/v1/books/join"], handleJoinBook);

  // 6. MEMBRES D'UN LIVRE (qui a rejoint)
  const handleGetBookMembers = async (c: any) => {
    try {
      const userId = await getAuthUserId(c);
      if (!userId) return c.json({ error: "Non authentifié." }, 401);
      const bookId = c.req.param("bookId");
      const sql = getDb();
      await ensureBooksTables(sql);

      const access = await sql`
        SELECT b.id FROM vibe_books b WHERE b.id = ${bookId}::uuid AND ${bookAccessClause(sql, userId)} LIMIT 1
      `;
      if (access.length === 0) return c.json({ error: "Livre introuvable." }, 404);

      const members = await fetchBookMembers(sql, bookId);
      return c.json({ success: true, members });
    } catch (err: any) {
      console.error("[vibe-books] Members error:", err);
      return c.json({ error: "Erreur lors de la récupération des membres." }, 500);
    }
  };
  registerMulti("get", [
    "/api/vibe/books/:bookId/members",
    "/vibe/books/:bookId/members",
    "/v1/books/:bookId/members",
  ], handleGetBookMembers);

  // 7. QUITTER UN LIVRE (membres non propriétaires)
  const handleLeaveBook = async (c: any) => {
    try {
      const userId = await getAuthUserId(c);
      if (!userId) return c.json({ error: "Non authentifié." }, 401);
      const bookId = c.req.param("bookId");
      const sql = getDb();
      await ensureBooksTables(sql);

      const rows = await sql`SELECT id, user_id FROM vibe_books WHERE id = ${bookId}::uuid LIMIT 1`;
      if (rows.length === 0) return c.json({ error: "Livre introuvable." }, 404);
      if (Number(rows[0].user_id) === userId) {
        return c.json({
          success: false,
          error: "Le créateur ne peut pas quitter son Livre. Supprimez-le à la place.",
          code: "OWNER_CANNOT_LEAVE",
        }, 403);
      }

      const deleted = await sql`
        DELETE FROM vibe_book_members
        WHERE book_id = ${bookId}::uuid AND user_id = ${userId}
        RETURNING id
      `;
      if (deleted.length === 0) return c.json({ error: "Livre introuvable." }, 404);

      await removeBookConversationMember(sql, bookId, userId).catch(() => {});
      return c.json({ success: true });
    } catch (err: any) {
      console.error("[vibe-books] Leave error:", err);
      return c.json({ error: "Erreur lors de la sortie du Livre." }, 500);
    }
  };
  registerMulti("post", [
    "/api/vibe/books/:bookId/leave",
    "/vibe/books/:bookId/leave",
    "/v1/books/:bookId/leave",
  ], handleLeaveBook);

  // 8. RÉGÉNÉRER LE CODE DE PARTAGE (créateur uniquement, invalide l'ancien lien)
  const handleRegenerateCode = async (c: any) => {
    try {
      const userId = await getAuthUserId(c);
      if (!userId) return c.json({ error: "Non authentifié." }, 401);
      const bookId = c.req.param("bookId");
      const sql = getDb();
      await ensureBooksTables(sql);

      const rows = await sql`
        SELECT id FROM vibe_books WHERE id = ${bookId}::uuid AND user_id = ${userId} LIMIT 1
      `;
      if (rows.length === 0) return c.json({ error: "Livre introuvable." }, 404);

      for (let attempt = 0; attempt < 5; attempt++) {
        const code = makeBookCode();
        try {
          const updated = await sql`
            UPDATE vibe_books SET join_code = ${code}, updated_at = NOW()
            WHERE id = ${bookId}::uuid
            RETURNING join_code
          `;
          return c.json({ success: true, join_code: updated[0]?.join_code || code });
        } catch {
          // collision de code : nouvelle tentative
        }
      }
      return c.json({ error: "Impossible de générer un nouveau code." }, 500);
    } catch (err: any) {
      console.error("[vibe-books] Regenerate error:", err);
      return c.json({ error: "Erreur lors de la régénération du code." }, 500);
    }
  };
  registerMulti("post", [
    "/api/vibe/books/:bookId/regenerate-code",
    "/vibe/books/:bookId/regenerate-code",
    "/v1/books/:bookId/regenerate-code",
  ], handleRegenerateCode);

  // 9. ENREGISTRER / RETIRER UNE VIBE D'UN LIVRE (toggle, tout membre)
  const handleToggleBookItem = async (c: any) => {
    try {
      const userId = await getAuthUserId(c);
      if (!userId) return c.json({ error: "Non authentifié." }, 401);
      const bookId = c.req.param("bookId");
      const postId = c.req.param("postId");
      const sql = getDb();
      await ensureBooksTables(sql);

      const access = await sql`
        SELECT b.id FROM vibe_books b WHERE b.id = ${bookId}::uuid AND ${bookAccessClause(sql, userId)} LIMIT 1
      `;
      if (access.length === 0) return c.json({ error: "Livre introuvable." }, 404);

      const exists = await sql`SELECT 1 FROM posts WHERE id = ${postId}::uuid LIMIT 1`;
      if (exists.length === 0) return c.json({ error: "Publication introuvable." }, 404);

      const already = await sql`
        SELECT 1 FROM vibe_book_items WHERE book_id = ${bookId}::uuid AND post_id = ${postId}::uuid
      `;
      if (already.length > 0) {
        await sql`DELETE FROM vibe_book_items WHERE book_id = ${bookId}::uuid AND post_id = ${postId}::uuid`;
        return c.json({ success: true, saved: false });
      } else {
        await sql`
          INSERT INTO vibe_book_items (book_id, post_id, added_by)
          VALUES (${bookId}::uuid, ${postId}::uuid, ${userId})
          ON CONFLICT DO NOTHING
        `;
        return c.json({ success: true, saved: true });
      }
    } catch (err: any) {
      console.error("[vibe-books] Toggle item error:", err);
      return c.json({ error: "Erreur lors de l'enregistrement dans le Livre." }, 500);
    }
  };
  registerMulti("post", [
    "/api/vibe/books/:bookId/posts/:postId",
    "/vibe/books/:bookId/posts/:postId",
    "/v1/books/:bookId/posts/:postId",
  ], handleToggleBookItem);

  // 10. CONTENU D'UN LIVRE (Vibe partagées + membres, même forme que le fil)
  const handleGetBookPosts = async (c: any) => {
    try {
      const userId = await getAuthUserId(c);
      if (!userId) return c.json({ error: "Non authentifié." }, 401);
      const bookId = c.req.param("bookId");
      const sql = getDb();
      await ensureBooksTables(sql);

      const bookRows = await sql`
        SELECT b.id, b.title, b.icon, b.created_at, b.join_code, b.user_id, COALESCE(b.is_public, FALSE) AS is_public,
               (b.user_id = ${userId}) AS is_owner,
               (b.user_id = ${userId} OR EXISTS (SELECT 1 FROM vibe_book_members m2 WHERE m2.book_id = b.id AND m2.user_id = ${userId})) AS is_member,
               COALESCE(
                 (SELECT m.role FROM vibe_book_members m WHERE m.book_id = b.id AND m.user_id = ${userId} LIMIT 1),
                 CASE WHEN b.user_id = ${userId} THEN 'owner' ELSE 'member' END
               ) AS role,
               (SELECT COUNT(*) FROM vibe_book_members bm WHERE bm.book_id = b.id) AS members_count,
               (SELECT dm.id FROM dm_conversations dm WHERE dm.book_id = b.id LIMIT 1) AS conversation_id
        FROM vibe_books b
        WHERE b.id = ${bookId}::uuid AND (${bookAccessClause(sql, userId)} OR COALESCE(b.is_public, FALSE) = TRUE)
        LIMIT 1
      `;
      if (bookRows.length === 0) return c.json({ error: "Livre introuvable." }, 404);

      // Un simple lecteur d'un Livre public ne doit jamais voir le code d'invitation
      const book: any = { ...bookRows[0] };
      if (!book.is_member) {
        delete book.join_code;
      }

      const rows = await sql`
        SELECT p.*, pr.display_name, pr.avatar_url, u.username,
               (SELECT COUNT(*) FROM post_interactions WHERE post_id = p.id AND user_id = ${userId} AND interaction_type = 'like') > 0 as has_liked,
               (SELECT COUNT(*) FROM post_interactions WHERE post_id = p.id AND user_id = ${userId} AND interaction_type = 'repost') > 0 as has_reposted,
               (SELECT COUNT(*) FROM bookmarks WHERE post_id = p.id AND user_id = ${userId}) > 0 as has_bookmarked,
               (SELECT pi.interaction_type FROM post_interactions pi WHERE pi.post_id = p.id AND pi.user_id = ${userId} AND pi.interaction_type IN ('interest_more', 'interest_less') LIMIT 1) as my_feedback,
               bi.added_at as saved_at,
               bi.added_by,
               COALESCE(bi.is_pinned, FALSE) AS is_pinned,
               bi.pinned_at,
               au.username AS added_by_username,
               ap.display_name AS added_by_display_name,
               ap.avatar_url AS added_by_avatar_url
        FROM vibe_book_items bi
        JOIN posts p ON p.id = bi.post_id
        JOIN users u ON u.id = p.author_id
        LEFT JOIN profiles pr ON pr.user_id = u.id
        LEFT JOIN users au ON au.id = bi.added_by
        LEFT JOIN profiles ap ON ap.user_id = bi.added_by
        WHERE bi.book_id = ${bookId}::uuid
          AND (COALESCE(p.status, 'published') <> 'scheduled' OR p.author_id = ${userId})
        ORDER BY COALESCE(bi.is_pinned, FALSE) DESC, bi.pinned_at DESC NULLS LAST, bi.added_at DESC
        LIMIT 200
      `;

      const ids = rows.map((r: any) => String(r.id));
      const media = ids.length
        ? await sql`SELECT post_id, url, media_type, alt_text FROM media_assets WHERE post_id = ANY(${ids}::uuid[])`
        : [];
      const byPost: Record<string, any[]> = {};
      for (const m of media) {
        (byPost[String(m.post_id)] ||= []).push(m);
      }
      const posts = rows.map((r: any) => ({ ...r, media_assets: byPost[String(r.id)] || [] }));
      await attachQuotedPosts(posts);
      await attachBookRefs(posts, userId).catch(() => {});

      // Membres visibles uniquement pour les membres/propriétaires du Livre
      const members = book.is_member ? await fetchBookMembers(sql, bookId) : [];

      return c.json({ success: true, book, members, posts });
    } catch (err: any) {
      console.error("[vibe-books] Book posts error:", err);
      return c.json({ error: "Erreur lors de la récupération du Livre." }, 500);
    }
  };
  registerMulti("get", [
    "/api/vibe/books/:bookId/posts",
    "/vibe/books/:bookId/posts",
    "/v1/books/:bookId/posts",
  ], handleGetBookPosts);

  // 11. LIVRES CONTENANT UNE VIBE DONNÉE (badge du PostCard)
  const handleBooksForPost = async (c: any) => {
    try {
      const userId = await getAuthUserId(c);
      if (!userId) return c.json({ error: "Non authentifié." }, 401);
      const postId = c.req.param("postId");
      const sql = getDb();
      await ensureBooksTables(sql);

      const rows = await sql`
        SELECT bi.book_id FROM vibe_book_items bi
        JOIN vibe_books b ON b.id = bi.book_id
        WHERE bi.post_id = ${postId}::uuid AND ${bookAccessClause(sql, userId)}
      `;

      return c.json({ success: true, book_ids: rows.map((r: any) => String(r.book_id)) });
    } catch (err: any) {
      console.error("[vibe-books] Books for post error:", err);
      return c.json({ error: "Erreur lors de la vérification des Livres." }, 500);
    }
  };
  registerMulti("get", [
    "/api/vibe/books/for-post/:postId",
    "/vibe/books/for-post/:postId",
    "/v1/books/for-post/:postId",
  ], handleBooksForPost);

  // 12. ÉPINGLER UNE VIBE DANS UN LIVRE (max 3 par Livre, membres autorisés)
  const handlePinBookPost = async (c: any) => {
    try {
      const userId = await getAuthUserId(c);
      if (!userId) return c.json({ error: "Non authentifié." }, 401);
      const bookId = c.req.param("bookId");
      const postId = c.req.param("postId");
      const body = await c.req.json().catch(() => ({}));
      const pinned = body?.pinned !== false;

      const sql = getDb();
      await ensureBooksTables(sql);

      const access = await sql`
        SELECT b.id FROM vibe_books b
        WHERE b.id = ${bookId}::uuid AND ${bookAccessClause(sql, userId)}
        LIMIT 1
      `;
      if (access.length === 0) return c.json({ error: "Livre introuvable." }, 404);

      const item = await sql`
        SELECT 1 FROM vibe_book_items WHERE book_id = ${bookId}::uuid AND post_id = ${postId}::uuid LIMIT 1
      `;
      if (item.length === 0) return c.json({ error: "Cette Vibe n'est pas dans ce Livre." }, 404);

      if (pinned) {
        const countRows = await sql`
          SELECT COUNT(*) AS n FROM vibe_book_items
          WHERE book_id = ${bookId}::uuid AND COALESCE(is_pinned, FALSE) = TRUE AND post_id <> ${postId}::uuid
        `;
        if (Number(countRows[0]?.n || 0) >= 3) {
          return c.json({ error: "Maximum 3 Vibes épinglées par Livre.", code: "PIN_LIMIT" }, 403);
        }
        await sql`
          UPDATE vibe_book_items SET is_pinned = TRUE, pinned_at = NOW(), pinned_by = ${userId}
          WHERE book_id = ${bookId}::uuid AND post_id = ${postId}::uuid
        `;
      } else {
        await sql`
          UPDATE vibe_book_items SET is_pinned = FALSE, pinned_at = NULL, pinned_by = NULL
          WHERE book_id = ${bookId}::uuid AND post_id = ${postId}::uuid
        `;
      }
      await sql`UPDATE vibe_books SET updated_at = NOW() WHERE id = ${bookId}::uuid`.catch(() => {});
      return c.json({ success: true, pinned });
    } catch (err: any) {
      console.error("[vibe-books] Pin error:", err);
      return c.json({ error: "Erreur lors de l'épinglage." }, 500);
    }
  };
  registerMulti("post", [
    "/api/vibe/books/:bookId/posts/:postId/pin",
    "/vibe/books/:bookId/posts/:postId/pin",
    "/v1/books/:bookId/posts/:postId/pin",
  ], handlePinBookPost);

  // 13. EXCLURE UN MEMBRE DU LIVRE (créateur uniquement)
  const handleKickBookMember = async (c: any) => {
    try {
      const userId = await getAuthUserId(c);
      if (!userId) return c.json({ error: "Non authentifié." }, 401);
      const bookId = c.req.param("bookId");
      const targetId = Number(c.req.param("userId"));
      if (!targetId) return c.json({ error: "Membre invalide." }, 400);

      const sql = getDb();
      await ensureBooksTables(sql);
      const bookRows = await sql`SELECT user_id, title FROM vibe_books WHERE id = ${bookId}::uuid LIMIT 1`;
      if (bookRows.length === 0) return c.json({ error: "Livre introuvable." }, 404);
      if (Number(bookRows[0].user_id) !== userId) {
        return c.json({ error: "Seul le créateur du Livre peut exclure un membre." }, 403);
      }
      if (targetId === userId) {
        return c.json({ error: "Le créateur ne peut pas s'exclure de son propre Livre." }, 400);
      }

      const del = await sql`
        DELETE FROM vibe_book_members WHERE book_id = ${bookId}::uuid AND user_id = ${targetId} RETURNING 1
      `;
      if (del.length === 0) return c.json({ error: "Ce membre ne fait pas partie du Livre." }, 404);

      await removeBookConversationMember(sql, bookId, targetId).catch(() => {});

      try {
        await sql`
          INSERT INTO notifications (recipient_id, actor_id, type, message)
          VALUES (${targetId}, ${userId}, 'book_join', ${`vous a retiré du Livre « ${bookRows[0].title} »`})
        `;
        await pushRealtimeEvent(targetId, "notification", { type: "book_join", book_id: bookId, actor_id: userId });
      } catch {}
      await sql`UPDATE vibe_books SET updated_at = NOW() WHERE id = ${bookId}::uuid`.catch(() => {});
      return c.json({ success: true, removed: targetId });
    } catch (err: any) {
      console.error("[vibe-books] Kick error:", err);
      return c.json({ error: "Erreur lors de l'exclusion du membre." }, 500);
    }
  };
  registerMulti("delete", [
    "/api/vibe/books/:bookId/members/:userId",
    "/vibe/books/:bookId/members/:userId",
    "/v1/books/:bookId/members/:userId",
  ], handleKickBookMember);

  // 14. TRANSFÉRER LA PROPRIÉTÉ DU LIVRE (créateur → membre)
  const handleTransferBookOwnership = async (c: any) => {
    try {
      const userId = await getAuthUserId(c);
      if (!userId) return c.json({ error: "Non authentifié." }, 401);
      const bookId = c.req.param("bookId");
      const targetId = Number(c.req.param("userId"));
      if (!targetId || targetId === userId) return c.json({ error: "Cible invalide." }, 400);

      const sql = getDb();
      await ensureBooksTables(sql);
      const bookRows = await sql`SELECT user_id, title FROM vibe_books WHERE id = ${bookId}::uuid LIMIT 1`;
      if (bookRows.length === 0) return c.json({ error: "Livre introuvable." }, 404);
      if (Number(bookRows[0].user_id) !== userId) {
        return c.json({ error: "Seul le créateur du Livre peut transférer la propriété." }, 403);
      }
      const targetMember = await sql`
        SELECT 1 FROM vibe_book_members WHERE book_id = ${bookId}::uuid AND user_id = ${targetId} LIMIT 1
      `;
      if (targetMember.length === 0) return c.json({ error: "Ce membre ne fait pas partie du Livre." }, 404);

      const updated = await sql`
        UPDATE vibe_books SET user_id = ${targetId}, updated_at = NOW()
        WHERE id = ${bookId}::uuid AND user_id = ${userId}
        RETURNING id
      `;
      if (updated.length === 0) return c.json({ error: "Transfert impossible." }, 409);

      await sql`UPDATE vibe_book_members SET role = 'member' WHERE book_id = ${bookId}::uuid AND user_id = ${userId}`;
      await sql`UPDATE vibe_book_members SET role = 'owner' WHERE book_id = ${bookId}::uuid AND user_id = ${targetId}`;

      await transferBookConversationOwnership(sql, bookId, userId, targetId).catch(() => {});

      try {
        await sql`
          INSERT INTO notifications (recipient_id, actor_id, type, message)
          VALUES (${targetId}, ${userId}, 'book_join', ${`vous a transféré la propriété du Livre « ${bookRows[0].title} »`})
        `;
        await pushRealtimeEvent(targetId, "notification", { type: "book_join", book_id: bookId, actor_id: userId });
      } catch {}
      return c.json({ success: true, new_owner: targetId });
    } catch (err: any) {
      console.error("[vibe-books] Transfer error:", err);
      return c.json({ error: "Erreur lors du transfert de propriété." }, 500);
    }
  };
  registerMulti("post", [
    "/api/vibe/books/:bookId/members/:userId/transfer-ownership",
    "/vibe/books/:bookId/members/:userId/transfer-ownership",
    "/v1/books/:bookId/members/:userId/transfer-ownership",
  ], handleTransferBookOwnership);

  // 15. DISCUSSION DU LIVRE (commentaires au niveau du Livre)
  const handleGetBookComments = async (c: any) => {
    try {
      const userId = await getAuthUserId(c);
      if (!userId) return c.json({ error: "Non authentifié." }, 401);
      const bookId = c.req.param("bookId");
      const limit = Math.min(100, Math.max(1, Number(c.req.query("limit") || 50)));
      const offset = Math.max(0, Number(c.req.query("offset") || 0));

      const sql = getDb();
      await ensureBooksTables(sql);
      const access = await sql`
        SELECT b.id FROM vibe_books b
        WHERE b.id = ${bookId}::uuid AND ${bookAccessClause(sql, userId)}
        LIMIT 1
      `;
      if (access.length === 0) return c.json({ error: "Livre introuvable." }, 404);

      const comments = await sql`
        SELECT bc.id, bc.content, bc.created_at, bc.user_id,
               u.username, pr.display_name, pr.avatar_url,
               bc.reply_to_id,
               rc.content AS reply_content, ru.username AS reply_username
        FROM vibe_book_comments bc
        JOIN users u ON u.id = bc.user_id
        LEFT JOIN profiles pr ON pr.user_id = bc.user_id
        LEFT JOIN vibe_book_comments rc ON rc.id = bc.reply_to_id
        LEFT JOIN users ru ON ru.id = rc.user_id
        WHERE bc.book_id = ${bookId}::uuid
        ORDER BY bc.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      // Réactions emoji agrégées { emoji, count, mine } (modèle DMs)
      try {
        const ids = (comments as any[]).map((cmt) => cmt.id);
        if (ids.length > 0) {
          const reactions = await sql`
            SELECT comment_id, emoji, user_id FROM vibe_book_comment_reactions
            WHERE comment_id = ANY(${ids}::uuid[])
          `;
          const byComment = new Map<string, { emoji: string; user_id: number }[]>();
          for (const r of reactions) {
            const key = String(r.comment_id);
            if (!byComment.has(key)) byComment.set(key, []);
            byComment.get(key)!.push({ emoji: r.emoji, user_id: Number(r.user_id) });
          }
          for (const cmt of comments as any[]) {
            const list = byComment.get(String(cmt.id)) || [];
            const grouped: { emoji: string; count: number; mine: boolean }[] = [];
            for (const r of list) {
              const g = grouped.find((x) => x.emoji === r.emoji);
              if (g) {
                g.count += 1;
                g.mine = g.mine || r.user_id === userId;
              } else {
                grouped.push({ emoji: r.emoji, count: 1, mine: r.user_id === userId });
              }
            }
            cmt.reactions = grouped;
          }
        }
      } catch {}
      for (const cmt of comments as any[]) if (!cmt.reactions) cmt.reactions = [];

      return c.json({ success: true, comments });
    } catch (err: any) {
      console.error("[vibe-books] Comments list error:", err);
      return c.json({ error: "Erreur lors de la récupération de la discussion." }, 500);
    }
  };
  registerMulti("get", [
    "/api/vibe/books/:bookId/comments",
    "/vibe/books/:bookId/comments",
    "/v1/books/:bookId/comments",
  ], handleGetBookComments);

  const handleAddBookComment = async (c: any) => {
    try {
      const userId = await getAuthUserId(c);
      if (!userId) return c.json({ error: "Non authentifié." }, 401);
      const bookId = c.req.param("bookId");
      const body = await c.req.json().catch(() => ({}));
      const plain = stripHtmlTags(String(body?.content || "")).trim();
      if (!plain) return c.json({ error: "Le message de la discussion est requis." }, 400);
      if (plain.length > 2000) return c.json({ error: "Message trop long (max 2000 caractères)." }, 400);

      // Réponse citée : le commentaire ciblé doit appartenir au même Livre
      const rawReplyTo = typeof body?.reply_to_id === "string" ? body.reply_to_id : "";
      const replyToId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawReplyTo)
        ? rawReplyTo
        : null;

      const sql = getDb();
      await ensureBooksTables(sql);
      const access = await sql`
        SELECT b.id, b.user_id AS owner_id, b.title FROM vibe_books b
        WHERE b.id = ${bookId}::uuid AND ${bookAccessClause(sql, userId)}
        LIMIT 1
      `;
      if (access.length === 0) return c.json({ error: "Livre introuvable." }, 404);

      let validReplyTo: string | null = null;
      if (replyToId) {
        const replyRows = await sql`
          SELECT 1 FROM vibe_book_comments
          WHERE id = ${replyToId}::uuid AND book_id = ${bookId}::uuid
          LIMIT 1
        `;
        if (replyRows.length === 0) return c.json({ error: "Le message auquel vous répondez est introuvable." }, 400);
        validReplyTo = replyToId;
      }

      const inserted = await sql`
        INSERT INTO vibe_book_comments (book_id, user_id, content, reply_to_id)
        VALUES (${bookId}::uuid, ${userId}, ${plain}, ${validReplyTo})
        RETURNING id, content, created_at, user_id
      `;
      await sql`UPDATE vibe_books SET updated_at = NOW() WHERE id = ${bookId}::uuid`.catch(() => {});

      // Notification légère au créateur (best-effort, hors auto-commentaire)
      const ownerId = Number(access[0].owner_id);
      if (ownerId !== userId) {
        try {
          await sql`
            INSERT INTO notifications (recipient_id, actor_id, type, message)
            VALUES (${ownerId}, ${userId}, 'book_join', ${`a commenté la discussion du Livre « ${access[0].title} »`})
          `;
          await pushRealtimeEvent(ownerId, "notification", { type: "book_join", book_id: bookId, actor_id: userId });
        } catch {}
      }

      const enriched = await sql`
        SELECT bc.id, bc.content, bc.created_at, bc.user_id,
               u.username, pr.display_name, pr.avatar_url,
               bc.reply_to_id,
               rc.content AS reply_content, ru.username AS reply_username
        FROM vibe_book_comments bc
        JOIN users u ON u.id = bc.user_id
        LEFT JOIN profiles pr ON pr.user_id = bc.user_id
        LEFT JOIN vibe_book_comments rc ON rc.id = bc.reply_to_id
        LEFT JOIN users ru ON ru.id = rc.user_id
        WHERE bc.id = ${inserted[0].id}::uuid
        LIMIT 1
      `;
      const comment = enriched[0] || inserted[0];
      if (comment && !comment.reactions) comment.reactions = [];
      return c.json({ success: true, comment }, 201);
    } catch (err: any) {
      console.error("[vibe-books] Add comment error:", err);
      return c.json({ error: "Erreur lors de l'ajout du commentaire." }, 500);
    }
  };
  registerMulti("post", [
    "/api/vibe/books/:bookId/comments",
    "/vibe/books/:bookId/comments",
    "/v1/books/:bookId/comments",
  ], handleAddBookComment);

  const handleDeleteBookComment = async (c: any) => {
    try {
      const userId = await getAuthUserId(c);
      if (!userId) return c.json({ error: "Non authentifié." }, 401);
      const bookId = c.req.param("bookId");
      const commentId = c.req.param("commentId");

      const sql = getDb();
      await ensureBooksTables(sql);
      const rows = await sql`
        SELECT bc.user_id AS author_id, b.user_id AS owner_id
        FROM vibe_book_comments bc
        JOIN vibe_books b ON b.id = bc.book_id
        WHERE bc.id = ${commentId}::uuid AND bc.book_id = ${bookId}::uuid
        LIMIT 1
      `;
      if (rows.length === 0) return c.json({ error: "Commentaire introuvable." }, 404);
      if (Number(rows[0].author_id) !== userId && Number(rows[0].owner_id) !== userId) {
        return c.json({ error: "Seuls l'auteur du commentaire ou le créateur du Livre peuvent le supprimer." }, 403);
      }
      await sql`DELETE FROM vibe_book_comments WHERE id = ${commentId}::uuid`;
      return c.json({ success: true });
    } catch (err: any) {
      console.error("[vibe-books] Delete comment error:", err);
      return c.json({ error: "Erreur lors de la suppression du commentaire." }, 500);
    }
  };
  registerMulti("delete", [
    "/api/vibe/books/:bookId/comments/:commentId",
    "/vibe/books/:bookId/comments/:commentId",
    "/v1/books/:bookId/comments/:commentId",
  ], handleDeleteBookComment);

  // Réaction emoji sur un message de la discussion (toggle, membres du Livre)
  const handleReactBookComment = async (c: any) => {
    try {
      const userId = await getAuthUserId(c);
      if (!userId) return c.json({ error: "Non authentifié." }, 401);
      const bookId = c.req.param("bookId");
      const commentId = c.req.param("commentId");
      const body = await c.req.json().catch(() => ({}));
      const emoji = String(body?.emoji || "");
      if (!emoji || emoji.length > 16) return c.json({ error: "Emoji requis." }, 400);

      const sql = getDb();
      await ensureBooksTables(sql);
      const access = await sql`
        SELECT bc.id FROM vibe_book_comments bc
        JOIN vibe_books b ON b.id = bc.book_id
        WHERE bc.id = ${commentId}::uuid AND bc.book_id = ${bookId}::uuid
          AND ${bookAccessClause(sql, userId)}
        LIMIT 1
      `;
      if (access.length === 0) return c.json({ error: "Commentaire introuvable." }, 404);

      const existing = await sql`
        SELECT id FROM vibe_book_comment_reactions
        WHERE comment_id = ${commentId}::uuid AND user_id = ${userId} AND emoji = ${emoji}
        LIMIT 1
      `;
      let reacted = false;
      if (existing.length > 0) {
        await sql`DELETE FROM vibe_book_comment_reactions WHERE id = ${existing[0].id}`;
      } else {
        await sql`
          INSERT INTO vibe_book_comment_reactions (comment_id, user_id, emoji)
          VALUES (${commentId}::uuid, ${userId}, ${emoji})
          ON CONFLICT (comment_id, user_id, emoji) DO NOTHING
        `;
        reacted = true;
      }

      const all = await sql`
        SELECT emoji, user_id FROM vibe_book_comment_reactions WHERE comment_id = ${commentId}::uuid
      `;
      const grouped: { emoji: string; count: number; mine: boolean }[] = [];
      for (const r of all as any[]) {
        const g = grouped.find((x) => x.emoji === r.emoji);
        if (g) {
          g.count += 1;
          g.mine = g.mine || Number(r.user_id) === userId;
        } else {
          grouped.push({ emoji: r.emoji, count: 1, mine: Number(r.user_id) === userId });
        }
      }
      return c.json({ success: true, reacted, reactions: grouped });
    } catch (err: any) {
      console.error("[vibe-books] React comment error:", err);
      return c.json({ error: "Erreur lors de la réaction." }, 500);
    }
  };
  registerMulti("post", [
    "/api/vibe/books/:bookId/comments/:commentId/react",
    "/vibe/books/:bookId/comments/:commentId/react",
    "/v1/books/:bookId/comments/:commentId/react",
  ], handleReactBookComment);

  // 16. RECHERCHE DE LIVRES PUBLICS (mention @livre / attachement dans un post)
  const handleSearchPublicBooks = async (c: any) => {
    try {
      const userId = await getAuthUserId(c);
      if (!userId) return c.json({ error: "Non authentifié." }, 401);
      const q = String(c.req.query("q") || "").trim().slice(0, 50);
      if (!q) return c.json({ success: true, books: [] });

      const sql = getDb();
      await ensureBooksTables(sql);

      const rows = await sql`
        SELECT b.id, b.title, b.icon, TRUE AS is_public,
               u.username AS owner_username,
               pr.display_name AS owner_display_name,
               (SELECT COUNT(*) FROM vibe_book_members bm WHERE bm.book_id = b.id) AS members_count,
               (SELECT COUNT(*) FROM vibe_book_items bi WHERE bi.book_id = b.id) AS items_count
        FROM vibe_books b
        JOIN users u ON u.id = b.user_id
        LEFT JOIN profiles pr ON pr.user_id = u.id
        WHERE COALESCE(b.is_public, FALSE) = TRUE AND b.title ILIKE ${'%' + q + '%'}
        ORDER BY items_count DESC, b.updated_at DESC NULLS LAST
        LIMIT 20
      `;
      return c.json({ success: true, books: rows });
    } catch (err: any) {
      console.error("[vibe-books] Public search error:", err);
      return c.json({ error: "Erreur lors de la recherche de Livres." }, 500);
    }
  };
  registerMulti("get", [
    "/api/vibe/books/public",
    "/vibe/books/public",
    "/v1/books/public",
  ], handleSearchPublicBooks);
}
