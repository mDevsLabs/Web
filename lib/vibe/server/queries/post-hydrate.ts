/**
 * ============================================================================
 * VIBE — HYDRATATION DES POSTS (lib/vibe/server/queries/post-hydrate.ts)
 * ============================================================================
 *
 * Répliques serveur des aides partagées du backend
 * (`vibe-posts-core.ts:80-234,509-568`) : médias, citations, sondages,
 * co-auteurs, références aux livres. Les composants attendent ces champs
 * exactement tels que l'API les renvoie ; un lecteur qui les omet afficherait
 * des posts amputés. Comme le handler, chaque attache dégrade pour son propre
 * compte (table absente ⇒ champ vide) sans faire échouer la page.
 *
 * Divergence assumée avec le backend : ici, aucune `ensure*` (pas de DDL). Une
 * table que le backend n'a pas encore créée produit simplement un champ vide —
 * le premier appel API/mobile la créera.
 */
import "server-only";
import { vibeSql } from "../db";
import { columnExists } from "../schema";

/** Les tagged-templates Neon HTTP transforment chaque ${} en paramètre : une
 * expression SQL conditionnelle ne peut pas être injectée via ${}. Ces helpers
 * construisent donc des variantes complètes de requêtes. */

export async function fetchPostMedia(posts: any[]): Promise<void> {
  const sql = vibeSql();
  if (!sql || !posts?.length) {
    return;
  }
  try {
    const ids = posts.map((p) => String(p.id));
    // `position` est une colonne ajoutée paresseusement par le backend ; sans
    // elle, le tri n'existe pas — on le retire plutôt que de perdre les médias.
    const ordered = await columnExists("media_assets", "position");
    const media = ordered
      ? await sql`
          SELECT post_id, url, media_type, alt_text FROM media_assets
          WHERE post_id = ANY(${ids}::uuid[])
          ORDER BY position ASC, created_at ASC
        `
      : await sql`
          SELECT post_id, url, media_type, alt_text FROM media_assets
          WHERE post_id = ANY(${ids}::uuid[])
        `;
    const byPost: Record<string, any[]> = {};
    for (const m of media) {
      (byPost[String(m.post_id)] ||= []).push({
        alt_text: m.alt_text,
        media_type: m.media_type,
        url: m.url,
      });
    }
    for (const p of posts) p.media_assets = byPost[String(p.id)] || [];
  } catch (mediaErr) {
    console.warn("[vibe-server] fetchPostMedia:", mediaErr);
    for (const p of posts) p.media_assets ||= [];
  }
}

export async function attachQuotedPosts(posts: any[]): Promise<void> {
  const sql = vibeSql();
  if (!sql || !posts?.length) {
    return;
  }
  for (const p of posts) p.quoted_post = null;
  const quoteIds = Array.from(
    new Set(posts.map((p) => p.quoted_post_id).filter(Boolean))
  );
  if (quoteIds.length === 0) {
    return;
  }
  try {
    const rows = await sql`
      SELECT q.id, q.author_id, q.content, q.format, q.likes_count, q.replies_count, q.published_at, q.created_via, q.ai_generated,
             u.username, pr.display_name, pr.avatar_url,
             (COALESCE(u.is_verified, FALSE) OR LOWER(COALESCE(u.tier, '')) IN ('plus', 'pro', 'max')) as is_verified
      FROM posts q
      JOIN users u ON u.id = q.author_id
      LEFT JOIN profiles pr ON pr.user_id = u.id
      WHERE q.id = ANY(${quoteIds}::uuid[])
    `;
    const mediaRows = await sql`
      SELECT post_id, url, media_type, alt_text FROM media_assets
      WHERE post_id = ANY(${quoteIds}::uuid[])
    `;
    const mediaByPost: Record<string, any[]> = {};
    for (const m of mediaRows) {
      (mediaByPost[String(m.post_id)] ||= []).push({
        alt_text: m.alt_text,
        media_type: m.media_type,
        url: m.url,
      });
    }
    const byId = new Map(
      rows.map((r: any) => [
        String(r.id),
        { ...r, media_assets: mediaByPost[String(r.id)] || [] },
      ])
    );
    for (const p of posts) {
      if (p.quoted_post_id) {
        p.quoted_post = byId.get(String(p.quoted_post_id)) || null;
      }
    }
  } catch (err) {
    console.warn("[vibe-server] attachQuotedPosts:", err);
  }
}

export async function attachPolls(
  posts: any[],
  currentUserId: number | null
): Promise<void> {
  const sql = vibeSql();
  if (!sql || !posts?.length) {
    return;
  }
  for (const p of posts) p.poll = null;
  try {
    const ids = posts.map((p) => p.id);
    const polls = await sql`
      SELECT id, post_id, question, ends_at, total_votes, created_at
      FROM post_polls WHERE post_id = ANY(${ids}::uuid[])
    `.catch(() => []);
    if (!polls || polls.length === 0) {
      return;
    }
    const pollIds = polls.map((pl: any) => pl.id);
    const options = await sql`
      SELECT id, poll_id, label, votes_count, position
      FROM post_poll_options WHERE poll_id = ANY(${pollIds}::uuid[])
      ORDER BY position ASC
    `.catch(() => []);
    const optsByPoll: Record<string, any[]> = {};
    for (const o of options) (optsByPoll[String(o.poll_id)] ||= []).push(o);
    const votesByPoll: Record<string, string> = {};
    if (currentUserId) {
      const votes = await sql`
        SELECT poll_id, option_id FROM post_poll_votes
        WHERE poll_id = ANY(${pollIds}::uuid[]) AND user_id = ${currentUserId}
      `.catch(() => []);
      for (const v of votes) {
        votesByPoll[String(v.poll_id)] = String(v.option_id);
      }
    }
    const pollByPost: Record<string, any> = {};
    for (const pl of polls) {
      pollByPost[String(pl.post_id)] = {
        ...pl,
        expired: new Date(pl.ends_at).getTime() <= Date.now(),
        my_vote: votesByPoll[String(pl.id)] || null,
        options: optsByPoll[String(pl.id)] || [],
      };
    }
    for (const p of posts) p.poll = pollByPost[String(p.id)] || null;
  } catch (err) {
    console.warn("[vibe-server] attachPolls:", err);
  }
}

export async function attachCollaborators(posts: any[]): Promise<void> {
  const sql = vibeSql();
  if (!sql || !posts?.length) {
    return;
  }
  for (const p of posts) p.collaborators = [];
  try {
    const ids = posts.map((p) => p.id);
    const rows = await sql`
      SELECT pc.post_id, pc.status, u.username, pr.display_name, pr.avatar_url
      FROM post_collaborators pc
      JOIN users u ON u.id = pc.user_id
      LEFT JOIN profiles pr ON pr.user_id = u.id
      WHERE pc.post_id = ANY(${ids}::uuid[])
    `.catch(() => []);
    const byPost: Record<string, any[]> = {};
    for (const r of rows) {
      (byPost[String(r.post_id)] ||= []).push({
        avatar_url: r.avatar_url,
        display_name: r.display_name,
        status: r.status,
        username: r.username,
      });
    }
    for (const p of posts) p.collaborators = byPost[String(p.id)] || [];
  } catch (err) {
    console.warn("[vibe-server] attachCollaborators:", err);
  }
}

export async function attachPollsAndCollabs(
  posts: any[],
  currentUserId: number | null
): Promise<void> {
  await attachPolls(posts, currentUserId).catch(() => {});
  await attachCollaborators(posts).catch(() => {});
}

export async function attachBookRefs(
  posts: any[],
  viewerId: number | null = null
): Promise<void> {
  const sql = vibeSql();
  if (!sql || !Array.isArray(posts) || posts.length === 0) {
    return;
  }
  try {
    const postIds = posts.map((p) => String(p.id));
    const refRows =
      await sql`SELECT post_id, book_id FROM post_book_refs WHERE post_id = ANY(${postIds}::uuid[])`;
    if (refRows.length === 0) {
      for (const p of posts) p.book_refs = [];
      return;
    }
    const bookIds = Array.from(
      new Set(refRows.map((r: any) => String(r.book_id)))
    );
    const books = viewerId
      ? await sql`
          SELECT b.id, b.title, b.icon, COALESCE(b.is_public, FALSE) AS is_public, b.user_id,
                 u.username AS owner_username, pr.display_name AS owner_display_name,
                 (SELECT COUNT(*) FROM vibe_book_members bm WHERE bm.book_id = b.id) AS members_count,
                 (SELECT COUNT(*) FROM vibe_book_items bi WHERE bi.book_id = b.id) AS items_count,
                 (b.user_id = ${viewerId} OR EXISTS (SELECT 1 FROM vibe_book_members bm2 WHERE bm2.book_id = b.id AND bm2.user_id = ${viewerId})) AS viewer_is_member
          FROM vibe_books b
          JOIN users u ON u.id = b.user_id
          LEFT JOIN profiles pr ON pr.user_id = u.id
          WHERE b.id = ANY(${bookIds}::uuid[])
        `
      : await sql`
          SELECT b.id, b.title, b.icon, COALESCE(b.is_public, FALSE) AS is_public, b.user_id,
                 u.username AS owner_username, pr.display_name AS owner_display_name,
                 (SELECT COUNT(*) FROM vibe_book_members bm WHERE bm.book_id = b.id) AS members_count,
                 (SELECT COUNT(*) FROM vibe_book_items bi WHERE bi.book_id = b.id) AS items_count,
                 FALSE AS viewer_is_member
          FROM vibe_books b
          JOIN users u ON u.id = b.user_id
          LEFT JOIN profiles pr ON pr.user_id = u.id
          WHERE b.id = ANY(${bookIds}::uuid[])
        `;
    const byId = new Map<string, any>(books.map((b: any) => [String(b.id), b]));
    const byPost = new Map<string, any[]>();
    for (const r of refRows) {
      const book = byId.get(String(r.book_id));
      if (!book) {
        continue;
      }
      const canView = Boolean(book.is_public) || Boolean(book.viewer_is_member);
      const entry = {
        can_view: canView,
        icon: book.icon,
        id: String(book.id),
        items_count: Number(book.items_count || 0),
        members_count: Number(book.members_count || 0),
        owner_display_name: book.owner_display_name,
        owner_username: book.owner_username,
        title: book.title,
      };
      const key = String(r.post_id);
      if (!byPost.has(key)) {
        byPost.set(key, []);
      }
      byPost.get(key)!.push(entry);
    }
    for (const p of posts) {
      p.book_refs = byPost.get(String(p.id)) || [];
    }
  } catch (err) {
    console.warn("[vibe-server] attachBookRefs:", err);
  }
}
