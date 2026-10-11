/**
 * ============================================================================
 * VIBE — LECTEURS PUBLICATION & RÉPONSES (lib/vibe/server/queries/post.ts)
 * ============================================================================
 *
 * Répliques de `handleGetPost` (`vibe-posts-crud.ts:1287-1355`) et
 * `handleGetComments` (`vibe-posts-engage.ts:339-447`), à deux nuances près,
 * constantes pour tous les lecteurs de ce dossier :
 * 1. pas d'`ensure*` DDL (le backend reste propriétaire du schéma) ;
 * 2. pas d'effets d'écriture dans la lecture.
 *
 * La visibilité du post parent garde la même garde que le handler : les
 * réponses d'un post « Abonnés » ou « Cercle » ne fuient pas si le visiteur
 * n'y a pas droit — ici, la graine vaut alors `null` et l'API tranche.
 *
 * `aiDigest` est une pure fonction du nombre et des auteurs des réponses
 * (`MAIAgentFleet.synthesizeThread`, `vibe-mai-fleet.ts:100-111`) — aucun
 * appel modèle : répliqué tel quel.
 */
import "server-only";
import { vibeSql } from "../db";
import type { VibeIdentity } from "../identity";
import { columnExists } from "../schema";
import { isoDeep } from "../shape";
import {
  attachBookRefs,
  attachPollsAndCollabs,
  attachQuotedPosts,
  fetchPostMedia,
} from "./post-hydrate";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function viewerIdOf(identity: VibeIdentity | null): number | null {
  return identity && /^\d+$/.test(String(identity.userId))
    ? Number(identity.userId)
    : null;
}

/** Synthèse locale du fil — réplique `synthesizeThread`. */
export function synthesizeThreadLocal(
  comments: Array<{ author: string; content: string }>
): string {
  if (!comments || comments.length === 0) {
    return "Aucun commentaire pour le moment.";
  }
  const count = comments.length;
  const authors = [...new Set(comments.map((c) => c.author))]
    .slice(0, 3)
    .join(", ");
  return `Synthèse (${count} réponses) : Échanges autour des points partagés par @${authors}.`;
}

/** Accès au post parent : public, ou soi, ou abonné, ou membre du cercle. */
async function canViewPost(
  postId: string,
  viewerId: number | null
): Promise<boolean> {
  const sql = vibeSql();
  if (!sql) {
    return false;
  }
  const parent = await sql`
    SELECT author_id, visibility FROM posts WHERE id = ${postId}::uuid LIMIT 1
  `;
  if (parent.length === 0) {
    return false;
  }
  const vis = String(parent[0].visibility || "public");
  const authorId = Number(parent[0].author_id);
  if (vis === "public" || (viewerId !== null && authorId === viewerId)) {
    return true;
  }
  if (viewerId === null) {
    return false;
  }
  if (vis === "followers") {
    const rows = await sql`
      SELECT 1 FROM follows WHERE follower_id = ${viewerId} AND following_id = ${authorId} LIMIT 1
    `.catch(() => []);
    return rows.length > 0;
  }
  if (vis === "circle") {
    const rows = await sql`
      SELECT 1 FROM circle_members WHERE user_id = ${authorId} AND member_user_id = ${viewerId} LIMIT 1
    `.catch(() => []);
    return rows.length > 0;
  }
  return false;
}

export type VibePostSeed = {
  comments: {
    aiDigest: string | null;
    comments: any[];
    count: number;
  } | null;
  post: any | null;
};

export async function readPostSeed(
  postId: string,
  identity: VibeIdentity | null
): Promise<VibePostSeed | null> {
  const sql = vibeSql();
  if (!sql || !UUID_RE.test(postId)) {
    return null;
  }
  const viewerId = viewerIdOf(identity);

  let postRow: any;
  try {
    const rows = viewerId
      ? await sql`
          SELECT p.*, pr.display_name, pr.avatar_url, u.username,
                 (SELECT COUNT(*) FROM post_interactions WHERE post_id = p.id AND user_id = ${viewerId} AND interaction_type = 'like') > 0 as has_liked,
                 (SELECT COUNT(*) FROM post_interactions WHERE post_id = p.id AND user_id = ${viewerId} AND interaction_type = 'repost') > 0 as has_reposted,
                 (SELECT COUNT(*) FROM bookmarks WHERE post_id = p.id AND user_id = ${viewerId}) > 0 as has_bookmarked,
                 (SELECT pi.interaction_type FROM post_interactions pi WHERE pi.post_id = p.id AND pi.user_id = ${viewerId} AND pi.interaction_type IN ('interest_more', 'interest_less') LIMIT 1) as my_feedback
          FROM posts p
          JOIN users u ON u.id = p.author_id
          LEFT JOIN profiles pr ON pr.user_id = u.id
          WHERE p.id = ${postId}::uuid
            AND (
              p.visibility = 'public'
              OR p.author_id = ${viewerId}
              OR (p.visibility = 'followers' AND EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = ${viewerId} AND f.following_id = p.author_id))
              OR (p.visibility = 'circle' AND EXISTS (SELECT 1 FROM circle_members cm WHERE cm.user_id = p.author_id AND cm.member_user_id = ${viewerId}))
            )
          LIMIT 1
        `
      : await sql`
          SELECT p.*, pr.display_name, pr.avatar_url, u.username,
                 FALSE as has_liked, FALSE as has_reposted, FALSE as has_bookmarked, NULL as my_feedback
          FROM posts p
          JOIN users u ON u.id = p.author_id
          LEFT JOIN profiles pr ON pr.user_id = u.id
          WHERE p.id = ${postId}::uuid AND p.visibility = 'public'
          LIMIT 1
        `;
    postRow = rows[0];
  } catch {
    // Table de visibilité absente : on laisse l'API (qui répare) répondre.
    return null;
  }
  if (!postRow) {
    return null;
  }
  // Une vibe programmée n'existe que pour son auteur (le handler fait 404).
  if (
    postRow.status === "scheduled" &&
    Number(postRow.author_id) !== viewerId
  ) {
    return null;
  }

  await fetchPostMedia([postRow]);
  await attachQuotedPosts([postRow]);
  await attachPollsAndCollabs([postRow], viewerId).catch(() => {});
  await attachBookRefs([postRow], viewerId).catch(() => {});

  // — Commentaires —
  let comments: VibePostSeed["comments"] = null;
  const visible = await canViewPost(postId, viewerId);
  if (visible) {
    try {
      const rows: any[] = await sql`
        SELECT c.*, u.username, pr.display_name, pr.avatar_url,
               (COALESCE(u.is_verified, FALSE) OR LOWER(COALESCE(u.tier, '')) IN ('plus', 'pro', 'max')) as is_verified
        FROM comments c
        JOIN users u ON u.id = c.author_id
        LEFT JOIN profiles pr ON pr.user_id = u.id
        WHERE c.post_id = ${postId}::uuid AND c.is_hidden = FALSE
        ORDER BY c.depth ASC, c.likes_count DESC, c.created_at ASC
      `;
      let likedIds = new Set<string>();
      if (viewerId && rows.length > 0) {
        const likedRows = await sql`
          SELECT cl.comment_id FROM comment_likes cl
          JOIN comments c ON c.id = cl.comment_id
          WHERE cl.user_id = ${viewerId} AND c.post_id = ${postId}::uuid
        `.catch(() => []);
        likedIds = new Set(likedRows.map((r: any) => String(r.comment_id)));
      }
      const enriched = rows.map((cm: any) => ({
        ...cm,
        liked_by_me: likedIds.has(String(cm.id)),
      }));

      if (
        enriched.length > 0 &&
        (await columnExists("media_assets", "comment_id"))
      ) {
        try {
          const commentIds = enriched.map((cm: any) => String(cm.id));
          const mediaRows = await sql`
            SELECT comment_id, url, media_type, alt_text
            FROM media_assets
            WHERE comment_id = ANY(${commentIds}::uuid[])
          `;
          const mediaByComment: Record<string, any[]> = {};
          for (const m of mediaRows) {
            (mediaByComment[String(m.comment_id)] ||= []).push({
              alt_text: m.alt_text,
              media_type: m.media_type,
              url: m.url,
            });
          }
          for (const cm of enriched) {
            cm.media_assets = mediaByComment[String(cm.id)] || [];
          }
        } catch (mediaErr) {
          console.warn("[vibe-server] medias commentaires:", mediaErr);
        }
      }

      comments = {
        aiDigest:
          enriched.length >= 2
            ? synthesizeThreadLocal(
                enriched.map((cm: any) => ({
                  author: cm.username,
                  content: cm.content,
                }))
              )
            : null,
        comments: isoDeep(enriched),
        count: enriched.length,
      };
    } catch {
      comments = null;
    }
  }

  return { comments, post: isoDeep(postRow) };
}
