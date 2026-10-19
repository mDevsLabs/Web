/**
 * ============================================================================
 * VIBE — LECTEUR LIVRES (lib/vibe/server/queries/books.ts)
 * ============================================================================
 *
 * Réplique de `handleListBooks` (`vibe-books.ts:216-260`) : livres possédés
 * ou rejoints, rôles, compteurs, conversation liée. L'`ensureBooksTables` du
 * handler (qui ÉCRIT : rétro-complétions de codes, backfill de conversations)
 * n'est pas reproduite — sur une base qui n'a pas encore le schéma, le
 * lecteur retourne null et l'API fait sa réparation habituelle.
 */
import "server-only";
import { vibeSql } from "../db";
import type { VibeIdentity } from "../identity";
import { tableExists } from "../schema";
import { isoDeep } from "../shape";

/** Miroir `vibe-books.ts:31`. */
const MAX_BOOKS_PER_USER = 5;

export async function readBooks(identity: VibeIdentity): Promise<{
  books: any[];
  maxBooks: number;
  ownedCount: number;
  success: boolean;
} | null> {
  const sql = vibeSql();
  const userId =
    identity && /^\d+$/.test(String(identity.userId))
      ? Number(identity.userId)
      : null;
  if (!sql || userId === null) {
    return null;
  }
  if (
    !(await tableExists("vibe_books")) ||
    !(await tableExists("vibe_book_members"))
  ) {
    return null;
  }
  try {
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
             FALSE AS contains_post
      FROM vibe_books b
      WHERE (b.user_id = ${userId} OR EXISTS (SELECT 1 FROM vibe_book_members m WHERE m.book_id = b.id AND m.user_id = ${userId}))
      ORDER BY (b.user_id = ${userId}) DESC, b.created_at ASC
    `;
    const ownedRows =
      await sql`SELECT COUNT(*) AS n FROM vibe_books WHERE user_id = ${userId}`;
    return {
      books: isoDeep(rows),
      maxBooks: MAX_BOOKS_PER_USER,
      ownedCount: Number(ownedRows[0]?.n || 0),
      success: true,
    };
  } catch {
    return null;
  }
}
