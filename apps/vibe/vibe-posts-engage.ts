/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — POSTS ENGAGEMENT (vibe-posts-engage.ts)
 * Likes, reposts, feedback algorithmique, bookmarks, commentaires & fils,
 * comptage de vues et épinglage sur le profil.
 * Enregistré par vibe-posts.ts (registerVibePostsRoutes) via
 * registerPostEngagementRoutes — l'ordre des registerMulti est inchangé.
 * ============================================================================
 */

import { extractToken, getDb, isPaidTier, rateLimit, verifyToken } from "./config.ts";
import { isBlockEitherWay, type RegisterMultiFn } from "./vibe-common.ts";
import { MAIAgentFleet } from "./vibe-mai-fleet.ts";
import { generateMAICommentAnswer } from "./vibe-mai.ts";
import { ensureMAIAccount, getMAIUserId } from "./vibe-dms.ts";
import { pushRealtimeEvent } from "./realtime.ts";
import { ensureCircleTable } from "./vibe-circle.ts";
import {
  ensurePostColumns,
  ensureProfilePinnedPostsTable,
  isUuid,
  stripHtmlTags,
} from "./vibe-posts-core.ts";

type PostAccessResult =
  | { post: any; error?: never; status?: never }
  | { post?: never; error: string; status: number; blocked?: boolean };

/**
 * Charge un post et applique les mêmes règles d'accès aux interactions que
 * pour le détail : statut publié, audience, et blocage croisé. La vérification
 * est faite avant toute mutation afin qu'un UUID valide ne permette pas de
 * signaler un post privé/planifié.
 */
const getPostForViewer = async (
  sql: any,
  postId: string,
  viewerId: number | null,
  options: { allowOwnScheduled?: boolean } = {},
): Promise<PostAccessResult> => {
  await ensurePostColumns().catch(() => {});
  const rows = await sql`
    SELECT id, author_id, content, visibility,
           COALESCE(status, 'published') AS status,
           likes_count, reposts_count, replies_count, bookmarks_count, views_count
    FROM posts
    WHERE id = ${postId}::uuid
    LIMIT 1
  `;
  if (!rows || rows.length === 0) {
    return { error: "Publication introuvable.", status: 404 };
  }

  const post = rows[0];
  const authorId = Number(post.author_id);
  const isAuthor = viewerId !== null && Number.isFinite(viewerId) && authorId === viewerId;
  const status = String(post.status || "published").toLowerCase();
  if (status !== "published" && !(options.allowOwnScheduled && isAuthor)) {
    return { error: "Publication introuvable.", status: 404 };
  }

  const visibility = String(post.visibility || "public").toLowerCase();
  if (visibility === "private" && !isAuthor) {
    return { error: "Publication introuvable.", status: 404 };
  }
  if (visibility === "followers" && !isAuthor) {
    try {
      const followed = await sql`
        SELECT 1 FROM follows
        WHERE follower_id = ${viewerId} AND following_id = ${authorId}
        LIMIT 1
      `;
      if (!followed || followed.length === 0) {
        return { error: "Publication introuvable.", status: 404 };
      }
    } catch {
      return { error: "Publication introuvable.", status: 404 };
    }
  }
  if (visibility === "circle" && !isAuthor) {
    try {
      const member = await sql`
        SELECT 1 FROM circle_members
        WHERE user_id = ${authorId} AND member_user_id = ${viewerId}
        LIMIT 1
      `;
      if (!member || member.length === 0) {
        return { error: "Publication introuvable.", status: 404 };
      }
    } catch {
      return { error: "Publication introuvable.", status: 404 };
    }
  }
  // Une audience inconnue ne doit pas être traitée comme publique.
  if (!["public", "private", "followers", "circle"].includes(visibility)) {
    return { error: "Publication introuvable.", status: 404 };
  }

  if (viewerId !== null && Number.isFinite(viewerId) && !isAuthor && await isBlockEitherWay(viewerId, authorId)) {
    return { error: "Publication indisponible.", status: 403, blocked: true };
  }
  return { post };
};

const emitPostStats = async (post: any): Promise<void> => {
  try {
    await pushRealtimeEvent(Number(post?.author_id), "post_stats", {
      post_id: post?.id,
      likes_count: Number(post?.likes_count || 0),
      reposts_count: Number(post?.reposts_count || 0),
      replies_count: Number(post?.replies_count || 0),
    });
  } catch {}
};

/** Recalcule le compteur depuis la table d'interactions (source de vérité). */
const syncLikeCounter = async (sql: any, postId: string, userId: number) => sql`
  UPDATE posts AS p
  SET likes_count = (
    SELECT COUNT(*)::int FROM post_interactions pi
    WHERE pi.post_id = p.id AND pi.interaction_type = 'like'
  )
  WHERE p.id = ${postId}::uuid AND COALESCE(p.status, 'published') = 'published'
  RETURNING p.id, p.author_id, p.content, p.likes_count, p.reposts_count, p.replies_count,
            EXISTS (
              SELECT 1 FROM post_interactions pi
              WHERE pi.post_id = p.id AND pi.user_id = ${userId} AND pi.interaction_type = 'like'
            ) AS liked
`;

const syncRepostCounter = async (sql: any, postId: string, userId: number) => sql`
  UPDATE posts AS p
  SET reposts_count = (
    SELECT COUNT(*)::int FROM post_interactions pi
    WHERE pi.post_id = p.id AND pi.interaction_type = 'repost'
  )
  WHERE p.id = ${postId}::uuid AND COALESCE(p.status, 'published') = 'published'
  RETURNING p.id, p.author_id, p.content, p.likes_count, p.reposts_count, p.replies_count,
            EXISTS (
              SELECT 1 FROM post_interactions pi
              WHERE pi.post_id = p.id AND pi.user_id = ${userId} AND pi.interaction_type = 'repost'
            ) AS reposted
`;

const syncBookmarkCounter = async (sql: any, postId: string, userId: number) => sql`
  UPDATE posts AS p
  SET bookmarks_count = (
    SELECT COUNT(*)::int FROM bookmarks b
    WHERE b.post_id = p.id
  )
  WHERE p.id = ${postId}::uuid AND COALESCE(p.status, 'published') = 'published'
  RETURNING p.id, p.author_id, p.content, p.likes_count, p.reposts_count, p.replies_count,
            EXISTS (
              SELECT 1 FROM bookmarks b
              WHERE b.post_id = p.id AND b.user_id = ${userId}
            ) AS bookmarked
`;

const syncCommentLikeCounter = async (sql: any, commentId: string, userId: number) => sql`
  UPDATE comments AS c
  SET likes_count = (
    SELECT COUNT(*)::int FROM comment_likes cl
    WHERE cl.comment_id = c.id
  )
  WHERE c.id = ${commentId}::uuid
  RETURNING c.id, c.post_id, c.author_id, c.likes_count,
            EXISTS (
              SELECT 1 FROM comment_likes cl
              WHERE cl.comment_id = c.id AND cl.user_id = ${userId}
            ) AS liked
`;

export function registerPostEngagementRoutes(registerMulti: RegisterMultiFn) {
  // 2. LIKES & REPOSTS & BOOKMARKS
  const handleLike = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      if (!Number.isSafeInteger(userId) || userId <= 0) return c.json({ error: "Non authentifié." }, 401);

      const postId = c.req.param("id");
      if (!isUuid(postId)) return c.json({ error: "Identifiant de post invalide." }, 400);
      const sql = getDb();
      await ensureCircleTable().catch(() => {});
      const access = await getPostForViewer(sql, postId, userId);
      if (access.error) return c.json({ error: access.error, blocked: access.blocked }, access.status);
      const post = access.post;

      // Suppression d'abord, puis insertion seulement si aucune ligne n'a
      // été supprimée. RETURNING permet de ne notifier/compter qu'une
      // transition réelle, même avec deux requêtes concurrentes.
      const removed = await sql`
        DELETE FROM post_interactions
        WHERE user_id = ${userId} AND post_id = ${postId}::uuid AND interaction_type = 'like'
        RETURNING id
      `;
      let becameLiked = false;
      if (removed.length === 0) {
        const inserted = await sql`
          INSERT INTO post_interactions (user_id, post_id, interaction_type)
          VALUES (${userId}, ${postId}::uuid, 'like')
          ON CONFLICT (user_id, post_id, interaction_type) DO NOTHING
          RETURNING id
        `;
        becameLiked = inserted.length > 0;
      }

      const synced = await syncLikeCounter(sql, postId, userId);
      if (synced.length === 0) return c.json({ error: "Publication introuvable." }, 404);
      await emitPostStats(synced[0]);

      if (becameLiked) {
        const recipientId = Number(post.author_id);
        if (recipientId !== userId && !(await isBlockEitherWay(userId, recipientId))) {
          const rawContent = stripHtmlTags(post.content || "").trim();
          const snippet = rawContent ? ` : « ${rawContent.slice(0, 45)}${rawContent.length > 45 ? '…' : ''} »` : '';
          try {
            await sql`
              INSERT INTO notifications (recipient_id, actor_id, type, post_id, message)
              SELECT ${recipientId}, ${userId}, 'like', ${postId}::uuid,
                     ${`a aimé votre publication${snippet}`}
              WHERE NOT EXISTS (
                SELECT 1 FROM notifications
                WHERE recipient_id = ${recipientId} AND actor_id = ${userId}
                  AND type = 'like' AND post_id = ${postId}::uuid AND comment_id IS NULL
              )
            `;
          } catch (err) {
            console.error("[Like Notification Error]:", err);
          }
        }
      } else if (removed.length > 0) {
        try {
          await sql`
            DELETE FROM notifications
            WHERE actor_id = ${userId} AND post_id = ${postId}::uuid
              AND type = 'like' AND comment_id IS NULL
          `;
        } catch {}
      }

      return c.json({ success: true, liked: Boolean(synced[0].liked ?? becameLiked) });
    } catch (err: any) {
      console.error("[Like] interaction error:", err?.message || err);
      return c.json({ error: "Erreur lors de l'interaction." }, 500);
    }
  };

  registerMulti("post", ["/api/vibe/posts/:id/like", "/vibe/posts/:id/like", "/v1/posts/:id/like", "/like/:id", "/api/vibe/posts/:id/likes"], handleLike);

  const handleRepost = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      if (!Number.isSafeInteger(userId) || userId <= 0) return c.json({ error: "Non authentifié." }, 401);

      const postId = c.req.param("id");
      if (!isUuid(postId)) return c.json({ error: "Identifiant de post invalide." }, 400);
      const sql = getDb();
      await ensureCircleTable().catch(() => {});
      const access = await getPostForViewer(sql, postId, userId);
      if (access.error) return c.json({ error: access.error, blocked: access.blocked }, access.status);
      const post = access.post;

      const removed = await sql`
        DELETE FROM post_interactions
        WHERE user_id = ${userId} AND post_id = ${postId}::uuid AND interaction_type = 'repost'
        RETURNING id
      `;
      let becameReposted = false;
      if (removed.length === 0) {
        const inserted = await sql`
          INSERT INTO post_interactions (user_id, post_id, interaction_type)
          VALUES (${userId}, ${postId}::uuid, 'repost')
          ON CONFLICT (user_id, post_id, interaction_type) DO NOTHING
          RETURNING id
        `;
        becameReposted = inserted.length > 0;
      }

      const synced = await syncRepostCounter(sql, postId, userId);
      if (synced.length === 0) return c.json({ error: "Publication introuvable." }, 404);
      await emitPostStats(synced[0]);

      if (becameReposted) {
        const recipientId = Number(post.author_id);
        if (recipientId !== userId && !(await isBlockEitherWay(userId, recipientId))) {
          const rawContent = stripHtmlTags(post.content || "").trim();
          const snippet = rawContent ? ` : « ${rawContent.slice(0, 45)}${rawContent.length > 45 ? '…' : ''} »` : '';
          try {
            await sql`
              INSERT INTO notifications (recipient_id, actor_id, type, post_id, message)
              SELECT ${recipientId}, ${userId}, 'repost', ${postId}::uuid,
                     ${`a republié votre publication${snippet}`}
              WHERE NOT EXISTS (
                SELECT 1 FROM notifications
                WHERE recipient_id = ${recipientId} AND actor_id = ${userId}
                  AND type = 'repost' AND post_id = ${postId}::uuid AND comment_id IS NULL
              )
            `;
          } catch (err) {
            console.error("[Repost Notification Error]:", err);
          }
        }
      } else if (removed.length > 0) {
        try {
          await sql`
            DELETE FROM notifications
            WHERE actor_id = ${userId} AND post_id = ${postId}::uuid AND type = 'repost'
          `;
        } catch {}
      }

      return c.json({ success: true, reposted: Boolean(synced[0].reposted ?? becameReposted) });
    } catch (err: any) {
      console.error("[Repost] interaction error:", err?.message || err);
      return c.json({ error: "Erreur lors du repartage." }, 500);
    }
  };

  registerMulti("post", ["/api/vibe/posts/:id/repost", "/vibe/posts/:id/repost", "/v1/posts/:id/repost", "/repost/:id", "/api/vibe/posts/:id/reposts"], handleRepost);

  // 2bis. FEEDBACK ALGORITHMIQUE (« Cela m'intéresse » / « Cela ne m'intéresse pas »)
  const handlePostFeedback = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      if (!Number.isSafeInteger(userId) || userId <= 0) return c.json({ error: "Non authentifié." }, 401);

      const postId = c.req.param("id");
      if (!isUuid(postId)) {
        return c.json({ error: "Identifiant de post invalide." }, 400);
      }

      const body = await c.req.json().catch(() => ({} as any));
      const value = body?.value;
      if (value !== "more" && value !== "less" && value !== null && value !== undefined) {
        return c.json({ error: "Valeur de feedback invalide (more | less | null)." }, 400);
      }

      const sql = getDb();
      await ensureCircleTable().catch(() => {});
      const access = await getPostForViewer(sql, postId, userId);
      if (access.error) return c.json({ error: access.error, blocked: access.blocked }, access.status);
      // Toggle : supprime les deux types puis réinsère si un nouveau choix
      await sql`
        DELETE FROM post_interactions
        WHERE user_id = ${userId} AND post_id = ${postId}::uuid
          AND interaction_type IN ('interest_more', 'interest_less')
      `;
      if (value === "more" || value === "less") {
        const interactionType = value === "more" ? "interest_more" : "interest_less";
        await sql`
          INSERT INTO post_interactions (user_id, post_id, interaction_type)
          VALUES (${userId}, ${postId}::uuid, ${interactionType})
          ON CONFLICT (user_id, post_id, interaction_type) DO NOTHING
        `;
      }

      return c.json({ success: true, my_feedback: value ?? null });
    } catch (err: any) {
      console.error("[Post Feedback Error]:", err);
      return c.json({ error: "Erreur lors de l'enregistrement du feedback." }, 500);
    }
  };

  registerMulti("post", ["/api/vibe/posts/:id/feedback", "/vibe/posts/:id/feedback", "/v1/posts/:id/feedback", "/feedback/:id"], handlePostFeedback);

  const handleBookmark = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      if (!Number.isSafeInteger(userId) || userId <= 0) return c.json({ error: "Non authentifié." }, 401);

      const postId = c.req.param("id");
      if (!isUuid(postId)) return c.json({ error: "Identifiant de post invalide." }, 400);
      const sql = getDb();
      await ensureCircleTable().catch(() => {});
      const access = await getPostForViewer(sql, postId, userId);
      if (access.error) return c.json({ error: access.error, blocked: access.blocked }, access.status);

      const removed = await sql`
        DELETE FROM bookmarks
        WHERE user_id = ${userId} AND post_id = ${postId}::uuid
        RETURNING id
      `;
      if (removed.length === 0) {
        await sql`
          INSERT INTO bookmarks (user_id, post_id) VALUES (${userId}, ${postId}::uuid)
          ON CONFLICT (user_id, post_id) DO NOTHING
        `;
      }
      const synced = await syncBookmarkCounter(sql, postId, userId);
      if (synced.length === 0) return c.json({ error: "Publication introuvable." }, 404);
      return c.json({ success: true, bookmarked: Boolean(synced[0].bookmarked) });
    } catch (err: any) {
      console.error("[Bookmark] interaction error:", err?.message || err);
      return c.json({ error: "Erreur lors de l'enregistrement." }, 500);
    }
  };

  registerMulti("post", ["/api/vibe/posts/:id/bookmark", "/vibe/posts/:id/bookmark", "/v1/posts/:id/bookmark", "/bookmark/:id", "/api/vibe/posts/:id/bookmarks"], handleBookmark);

  // 3. COMMENTS
  const handleGetComments = async (c: any) => {
    try {
      const postId = c.req.param("id");
      if (!isUuid(postId)) {
        return c.json({ error: "Identifiant de post invalide." }, 400);
      }
      const sql = getDb();

      let currentUserId: number | null = null;
      const token = extractToken(c.req.raw);
      if (token) {
        try {
          const payload = await verifyToken(token);
          const parsedUserId = Number(payload.sub || (payload as any).id);
          if (Number.isSafeInteger(parsedUserId) && parsedUserId > 0) currentUserId = parsedUserId;
        } catch {}
      }

      // Un post inaccessible (restricted, planifié, bloqué ou absent) ne doit
      // pas laisser fuiter ses commentaires via cette route.
      await ensureCircleTable().catch(() => {});
      const access = await getPostForViewer(sql, postId, currentUserId);
      if (access.error) {
        return c.json({ count: 0, aiDigest: null, comments: [] });
      }

      const comments = await sql`
        SELECT c.*, u.username, pr.display_name, pr.avatar_url,
               (COALESCE(u.is_verified, FALSE) OR LOWER(COALESCE(u.tier, '')) IN ('plus', 'pro', 'max')) as is_verified
        FROM comments c
        JOIN users u ON u.id = c.author_id
        LEFT JOIN profiles pr ON pr.user_id = u.id
        WHERE c.post_id = ${postId}::uuid AND c.is_hidden = FALSE
        ORDER BY c.depth ASC, c.likes_count DESC, c.created_at ASC
      `;

      let likedIds = new Set<string>();
      if (currentUserId && comments.length > 0) {
        try {
          const likedRows = await sql`
            SELECT cl.comment_id FROM comment_likes cl
            JOIN comments c ON c.id = cl.comment_id
            WHERE cl.user_id = ${currentUserId} AND c.post_id = ${postId}::uuid
          `;
          likedIds = new Set(likedRows.map((r: any) => String(r.comment_id)));
        } catch {}
      }

      const enriched = comments.map((cm: any) => ({
        ...cm,
        liked_by_me: likedIds.has(String(cm.id)),
      }));

      // Médias joints aux commentaires (3 images / 1 vidéo, légendes incluses)
      try {
        const commentIds = enriched.map((cm: any) => String(cm.id));
        if (commentIds.length > 0) {
          const mediaRows = await sql`
            SELECT comment_id, url, media_type, alt_text
            FROM media_assets
            WHERE comment_id = ANY(${commentIds}::uuid[])
          `;
          const mediaByComment: Record<string, any[]> = {};
          for (const m of mediaRows) {
            (mediaByComment[String(m.comment_id)] ||= []).push({
              url: m.url,
              media_type: m.media_type,
              alt_text: m.alt_text,
            });
          }
          for (const cm of enriched) {
            cm.media_assets = mediaByComment[String(cm.id)] || [];
          }
        }
      } catch (mediaErr) {
        console.warn("[vibe-posts] Comment media hydratation:", mediaErr);
      }

      let aiDigest = null;
      if (enriched.length >= 2) {
        aiDigest = MAIAgentFleet.synthesizeThread(
          enriched.map((cm: any) => ({ author: cm.username, content: cm.content }))
        );
      }

      return c.json({ count: enriched.length, aiDigest, comments: enriched });
    } catch (err: any) {
      console.error("[Get Comments Error]:", err);
      return c.json({ error: "Erreur récupération réponses." }, 500);
    }
  };

  registerMulti("get", ["/api/vibe/posts/:id/comments", "/vibe/posts/:id/comments", "/v1/posts/:id/comments", "/comments/:id"], handleGetComments);

  // 2ter. COMPTAGE D'IMPRESSIONS / VUES
  // Le client dédoublonne par session (IntersectionObserver + dwell 1 s,
  // cf. src/algorithms/viewTracking.ts) ; le serveur incrémente simplement.
  // Nouveau : accepte {duration_ms, dwell_ms, visible_ratio} + auth optionnelle
  // pour alimenter post_views (profil temporel) sans casser l'ancien flux anonyme.
  const handlePostView = async (c: any) => {
    try {
      const postId = c.req.param("id");
      if (!isUuid(postId)) {
        return c.json({ error: "Identifiant de post invalide." }, 400);
      }
      const body = await c.req.json().catch(() => ({} as any));
      const durationMs = Math.max(0, Math.min(600000, Number(body?.duration_ms ?? body?.dwell_ms ?? 1000) || 1000));
      const dwellMs = Math.max(0, Math.min(600000, Number(body?.dwell_ms ?? durationMs) || durationMs));
      const visibleRatio = Math.max(0, Math.min(1, Number(body?.visible_ratio ?? 0.5) || 0.5));
      const completed = dwellMs >= 5000 || durationMs >= 8000;
      const allowedSources = ["feed", "profile", "detail", "search", "dm", "trends"];
      const rawSource = String(body?.source ?? "feed").toLowerCase().slice(0, 20);
      const source = allowedSources.includes(rawSource) ? rawSource : "feed";

      let viewerId: number | null = null;
      try {
        const token = extractToken(c.req.raw);
        if (token) {
          const payload = await verifyToken(token);
          viewerId = Number(payload.sub || (payload as any).id) || null;
        }
      } catch {}

      const sql = getDb();
      await ensurePostColumns().catch(() => {});
      await ensureCircleTable().catch(() => {});
      const access = await getPostForViewer(sql, postId, viewerId);
      if (access.error) return c.json({ error: access.error, blocked: access.blocked }, access.status);

      const updated = await sql`
        UPDATE posts
        SET views_count = COALESCE(views_count, 0) + 1
        WHERE id = ${postId}::uuid AND COALESCE(status, 'published') = 'published'
        RETURNING views_count
      `;
      if (updated.length === 0) {
        return c.json({ error: "Publication introuvable." }, 404);
      }
      // Persistance temporelle (best-effort, n'échoue jamais la vue)
      try {
        await sql`
          INSERT INTO post_views (user_id, post_id, duration_ms, dwell_ms, visible_ratio, completed, source)
          VALUES (${viewerId}, ${postId}::uuid, ${Math.round(durationMs)}, ${Math.round(dwellMs)}, ${visibleRatio}, ${completed}, ${source})
        `;
        // Mise à jour incrémentale de l'affinité topic (fire-and-forget)
        if (viewerId) {
          try {
            const prow = await sql`SELECT content FROM posts WHERE id = ${postId}::uuid LIMIT 1`;
            const content = String(prow[0]?.content || "");
            const tags = Array.from(new Set(
              Array.from(content.matchAll(/#([\p{L}\p{N}_]{2,30})/gu)).map((m: any) => String(m[1]).toLowerCase())
            )).slice(0, 5);
            for (const tag of tags) {
              await sql`
                INSERT INTO user_topic_affinity (user_id, topic, total_time_ms, views, score, updated_at)
                VALUES (${viewerId}, ${tag}, ${Math.round(durationMs)}, 1, ${Math.min(1, durationMs / 30000)}, NOW())
                ON CONFLICT (user_id, topic)
                DO UPDATE SET
                  total_time_ms = user_topic_affinity.total_time_ms + ${Math.round(durationMs)},
                  views = user_topic_affinity.views + 1,
                  score = LEAST(1, user_topic_affinity.score * 0.95 + ${Math.min(1, durationMs / 30000)} * 0.2),
                  updated_at = NOW()
              `.catch(() => {});
            }
          } catch {}
        }
      } catch {}
      return c.json({ success: true, views_count: Number(updated[0].views_count || 0) });
    } catch (err: any) {
      console.warn("[Post View Error]:", err);
      return c.json({ success: false, views_count: null });
    }
  };

  registerMulti("post", ["/api/vibe/posts/:id/view", "/vibe/posts/:id/view", "/v1/posts/:id/view"], handlePostView);

  // 2quater. ÉPINGLAGE SUR LE PROFIL (maximum 2 posts épinglés par auteur)
  const MAX_PINNED_POSTS = 2;
  const handlePinPost = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);

      const postId = c.req.param("id");
      if (!isUuid(postId)) {
        return c.json({ error: "Identifiant de post invalide." }, 400);
      }

      const body = await c.req.json().catch(() => ({} as any));
      const pinned = Boolean(body.pinned);

      const sql = getDb();
      const owned = await sql`
        SELECT id FROM posts WHERE id = ${postId}::uuid AND author_id = ${userId} LIMIT 1
      `;
      if (owned.length === 0) {
        return c.json({ error: "Publication introuvable ou non autorisée." }, 403);
      }

      if (pinned) {
        const alreadyPinned = await sql`
          SELECT 1 FROM posts WHERE id = ${postId}::uuid AND is_pinned = TRUE LIMIT 1
        `;
        if (alreadyPinned.length === 0) {
          const countRows = await sql`
            SELECT COUNT(*)::int AS n FROM posts WHERE author_id = ${userId} AND is_pinned = TRUE
          `;
          if (Number(countRows[0]?.n || 0) >= MAX_PINNED_POSTS) {
            return c.json({
              error: `Vous ne pouvez épingler que ${MAX_PINNED_POSTS} publications sur votre profil.`,
              code: "PIN_LIMIT",
            }, 400);
          }
        }
      }

      await sql`
        UPDATE posts SET is_pinned = ${pinned} WHERE id = ${postId}::uuid AND author_id = ${userId}
      `;
      const countRows = await sql`
        SELECT COUNT(*)::int AS n FROM posts WHERE author_id = ${userId} AND is_pinned = TRUE
      `;
      return c.json({ success: true, pinned, pinned_count: Number(countRows[0]?.n || 0) });
    } catch (err: any) {
      console.error("[Pin Post Error]:", err);
      return c.json({ error: "Erreur lors de l'épinglage." }, 500);
    }
  };

  registerMulti("post", ["/api/vibe/posts/:id/pin", "/vibe/posts/:id/pin", "/v1/posts/:id/pin"], handlePinPost);

  // 2quinquies. MISE EN AVANT D'UN POST (Y COMPRIS D'AUTRES COMPTES) SUR SON PROFIL
  // La limite de 2 épinglages compte à la fois les posts de l'auteur et ceux mis en avant.
  const handleProfilePinPost = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);

      const postId = c.req.param("id");
      if (!isUuid(postId)) {
        return c.json({ error: "Identifiant de post invalide." }, 400);
      }
      const body = await c.req.json().catch(() => ({} as any));
      const pinned = Boolean(body.pinned);

      const sql = getDb();
      await ensureProfilePinnedPostsTable();

      const ownCountRows = await sql`
        SELECT COUNT(*)::int AS n FROM posts WHERE author_id = ${userId} AND is_pinned = TRUE
      `;
      const ownCount = Number(ownCountRows[0]?.n || 0);

      if (!pinned) {
        await sql`DELETE FROM profile_pinned_posts WHERE user_id = ${userId} AND post_id = ${postId}::uuid`;
        const foreignCountRows = await sql`
          SELECT COUNT(*)::int AS n FROM profile_pinned_posts WHERE user_id = ${userId}
        `;
        return c.json({ success: true, pinned: false, pinned_count: ownCount + Number(foreignCountRows[0]?.n || 0) });
      }

      const postRows = await sql`
        SELECT author_id, visibility, COALESCE(status, 'published') AS status
        FROM posts WHERE id = ${postId}::uuid LIMIT 1
      `;
      if (postRows.length === 0) {
        return c.json({ error: "Publication introuvable." }, 404);
      }
      const target = postRows[0];
      if (Number(target.author_id) === userId) {
        return c.json({
          error: "Vos propres publications s'épinglent via « Épingler sur votre profil ».",
          code: "OWN_PIN",
        }, 400);
      }
      if (target.visibility !== "public" || target.status !== "published") {
        return c.json({ error: "Seule une publication publique peut être mise en avant sur votre profil." }, 403);
      }

      // Insertion conditionnelle anti-course : la limite est réévaluée côté SQL
      await sql`
        INSERT INTO profile_pinned_posts (user_id, post_id)
        SELECT ${userId}, ${postId}::uuid
        WHERE ${ownCount} + (SELECT COUNT(*) FROM profile_pinned_posts WHERE user_id = ${userId}) < ${MAX_PINNED_POSTS}
        ON CONFLICT DO NOTHING
      `;
      const existsRows = await sql`
        SELECT 1 FROM profile_pinned_posts WHERE user_id = ${userId} AND post_id = ${postId}::uuid LIMIT 1
      `;
      if (existsRows.length === 0) {
        return c.json({
          error: `Vous ne pouvez épingler que ${MAX_PINNED_POSTS} publications sur votre profil.`,
          code: "PIN_LIMIT",
        }, 400);
      }
      const foreignCountRows = await sql`
        SELECT COUNT(*)::int AS n FROM profile_pinned_posts WHERE user_id = ${userId}
      `;
      return c.json({ success: true, pinned: true, pinned_count: ownCount + Number(foreignCountRows[0]?.n || 0) });
    } catch (err: any) {
      console.error("[Profile Pin Error]:", err);
      return c.json({ error: "Erreur lors de l'épinglage." }, 500);
    }
  };

  registerMulti("post", ["/api/vibe/posts/:id/profile-pin", "/vibe/posts/:id/profile-pin", "/v1/posts/:id/profile-pin"], handleProfilePinPost);

  const handleAddComment = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      if (!Number.isSafeInteger(userId) || userId <= 0) return c.json({ error: "Non authentifié." }, 401);

      const postId = c.req.param("id");
      if (!isUuid(postId)) {
        return c.json({ error: "Identifiant de post invalide." }, 400);
      }
      const body = await c.req.json().catch(() => ({} as any));
      const content = body?.content ?? "";
      const parent_comment_id = body?.parent_comment_id;
      const commentMedia = Array.isArray(body?.media_assets) ? body.media_assets : [];
      if (
        parent_comment_id !== undefined &&
        parent_comment_id !== null &&
        parent_comment_id !== "" &&
        !isUuid(String(parent_comment_id))
      ) {
        return c.json({ error: "Commentaire parent invalide." }, 400);
      }

      const sql = getDb();
      await ensurePostColumns();
      await ensureCircleTable().catch(() => {});
      // Ne jamais insérer un commentaire sur un post absent, planifié,
      // hors audience ou bloqué avec son auteur.
      const access = await getPostForViewer(sql, postId, userId);
      if (access.error) return c.json({ error: access.error, blocked: access.blocked }, access.status);

      if ((!content || !String(content).trim()) && commentMedia.length === 0) {
        return c.json({ error: "Commentaire vide." }, 400);
      }
      if (String(content).length > 10000) {
        return c.json({ error: "Commentaire trop long (10 000 caractères max)." }, 400);
      }

      // Validation des médias de commentaire : max 3 images + 1 vidéo
      const normalizedCommentMedia: Array<{ url: string; media_type: string; alt_text: string }> = [];
      let mediaImages = 0;
      let mediaVideos = 0;
      for (const m of commentMedia) {
        if (!m || !m.url || typeof m.url !== "string") continue;
        const type = String(m.media_type || m.type || "");
        const isVideo = type.startsWith("video") || /\.(mp4|webm|mov)(\?|$)/i.test(m.url);
        if (isVideo) mediaVideos++;
        else mediaImages++;
        if (mediaImages > 3 || mediaVideos > 1) {
          return c.json({ error: "Maximum 3 images et 1 vidéo par réponse." }, 400);
        }
        normalizedCommentMedia.push({
          url: m.url.trim().slice(0, 2048),
          media_type: type || (isVideo ? "video/mp4" : "image/jpeg"),
          alt_text: String(m.alt_text || m.alt || "").slice(0, 500),
        });
      }

      // Commande /mai : réponse IA en commentaire (abonnés Plus, Pro et Max uniquement)
      const plainStart = stripHtmlTags(String(content || "")).trim();
      const isMaiCommand = /^\/mai\b/i.test(plainStart);
      let maiQuestion = "";
      if (isMaiCommand) {
        const tierRows = await sql`SELECT tier FROM users WHERE id = ${userId} LIMIT 1`;
        if (!isPaidTier(tierRows[0]?.tier)) {
          return c.json(
            {
              error: "La commande /mai est réservée aux abonnés Plus, Pro et Max.",
              plan_required: true,
              code: "MAI_CMD",
            },
            403
          );
        }
        maiQuestion = plainStart.replace(/^\/mai\b/i, "").trim();
        if (!maiQuestion) {
          return c.json({ error: "Ajoutez votre question après la commande /mai." }, 400);
        }
        if (!rateLimit(`mai-cmd:${userId}`, 5, 60_000)) {
          return c.json({ error: "Trop de commandes /mai. Patientez une minute." }, 429);
        }
      }

      // Résoudre le parent (profondeur réelle, aplatie au niveau 4 max)
      let parentDepth = 0;
      let effectiveParentId: string | null = null;
      if (parent_comment_id !== undefined && parent_comment_id !== null && parent_comment_id !== "") {
        const parentId = String(parent_comment_id);
        if (!isUuid(parentId)) {
          return c.json({ error: "Commentaire parent invalide." }, 400);
        }
        const parentRows = await sql`
          SELECT id, depth, parent_comment_id, author_id, is_hidden, post_id
          FROM comments
          WHERE id = ${parentId}::uuid AND post_id = ${postId}::uuid
          LIMIT 1
        `;
        if (parentRows.length === 0 || parentRows[0].is_hidden) {
          return c.json({ error: "Commentaire parent introuvable." }, 404);
        }
        const parent = parentRows[0];
        const parentAuthorId = Number(parent.author_id);
        if (
          parentAuthorId &&
          parentAuthorId !== userId &&
          await isBlockEitherWay(userId, parentAuthorId)
        ) {
          return c.json({ error: "Commentaire indisponible." }, 403);
        }
        // On répond toujours à la racine du fil si le parent est déjà profond
        if (Number(parent.depth) >= 4) {
          effectiveParentId = parent.parent_comment_id || parent.id;
          parentDepth = 3;
        } else {
          effectiveParentId = parent.id;
          parentDepth = Number(parent.depth) || 0;
        }
      }

      const inserted = await sql`
        INSERT INTO comments (post_id, author_id, parent_comment_id, content, depth)
        VALUES (${postId}::uuid, ${userId}, ${effectiveParentId || null}::uuid, ${String(content || '').trim()}, ${parentDepth + 1})
        RETURNING *
      `;
      if (!inserted || inserted.length === 0) {
        return c.json({ error: "Commentaire introuvable ou publication supprimée." }, 404);
      }

      // Insertion des médias joints au commentaire
      const insertedCommentMedia: any[] = [];
      for (const m of normalizedCommentMedia) {
        try {
          const res = await sql`
            INSERT INTO media_assets (owner_id, post_id, comment_id, url, media_type, alt_text)
            VALUES (${userId}, ${postId}::uuid, ${inserted[0].id}::uuid, ${m.url}, ${m.media_type}, ${m.alt_text})
            RETURNING id, url, media_type, alt_text
          `;
          if (res && res[0]) insertedCommentMedia.push(res[0]);
        } catch (mediaInsertErr) {
          console.warn("[vibe-posts] Comment media insert:", mediaInsertErr);
        }
      }

      // Compter depuis comments (source de vérité) évite qu'un retry ou un
      // import ancien ne décale définitivement replies_count.
      const statsRows = await sql`
        UPDATE posts AS p
        SET replies_count = (
          SELECT COUNT(*)::int FROM comments c
          WHERE c.post_id = p.id
        )
        WHERE p.id = ${postId}::uuid AND COALESCE(p.status, 'published') = 'published'
        RETURNING p.id, p.author_id, p.likes_count, p.reposts_count, p.replies_count
      `;
      if (statsRows.length === 0) {
        return c.json({ error: "Publication introuvable." }, 404);
      }
      await emitPostStats(statsRows[0]);

      // Notifier l'auteur du post (ou du commentaire parent) sans se notifier soi-même
      try {
        let notifyId: number | null = null;
        let notifMsg = "a répondu à votre post";
        if (effectiveParentId) {
          const pAuthor = await sql`SELECT author_id FROM comments WHERE id = ${effectiveParentId}::uuid LIMIT 1`;
          notifyId = Number(pAuthor[0]?.author_id) || null;
          notifMsg = "a répondu à votre commentaire";
        } else {
          const pAuthor = await sql`SELECT author_id FROM posts WHERE id = ${postId}::uuid LIMIT 1`;
          notifyId = Number(pAuthor[0]?.author_id) || null;
        }
        if (notifyId && notifyId !== userId && !(await isBlockEitherWay(userId, notifyId))) {
          await sql`
            INSERT INTO notifications (recipient_id, actor_id, type, post_id, comment_id, message)
            VALUES (${notifyId}, ${userId}, 'reply', ${postId}::uuid, ${inserted[0]?.id}::uuid, ${notifMsg})
          `;
        }

        // Détection et notification des mentions @username dans les commentaires
        try {
          const plainComment = stripHtmlTags(String(content || ''));
          const mentionMatches = Array.from(new Set(plainComment.match(/@([a-zA-Z0-9_]{1,30})/g) || [])).map((m: string) => m.slice(1).toLowerCase());
          if (mentionMatches.length > 0) {
            const mentionedUsers = await sql`
              SELECT id, username FROM users
              WHERE LOWER(username) = ANY(${mentionMatches}) AND id <> ${userId}
            `;
            const snippet = plainComment.length > 45 ? `${plainComment.slice(0, 45)}…` : plainComment;
            for (const u of mentionedUsers) {
              if (Number(u.id) !== notifyId && !(await isBlockEitherWay(userId, Number(u.id)))) {
                await sql`
                  INSERT INTO notifications (recipient_id, actor_id, type, post_id, comment_id, message)
                  VALUES (${u.id}, ${userId}, 'mention', ${postId}::uuid, ${inserted[0]?.id}::uuid, ${`vous a mentionné dans un commentaire : « ${snippet} »`})
                `.catch(() => {});
              }
            }
          }
        } catch (mentionErr) {
          console.warn("[Vibe API] Erreur notification mention commentaire:", mentionErr);
        }
      } catch {}

      const userRow = await sql`SELECT username FROM users WHERE id = ${userId} LIMIT 1`;
      const prRow = await sql`SELECT display_name, avatar_url FROM profiles WHERE user_id = ${userId} LIMIT 1`;

      // Réponse mAI asynchrone (même pattern que les DMs) : commentaire de @mai
      // sous le /mai, généré à partir du contenu de la publication uniquement.
      if (isMaiCommand) {
        const maiParentId = String(inserted[0]?.id);
        const maiReplyDepth = Math.min(parentDepth + 2, 4);
        setTimeout(async () => {
          try {
            await ensureMAIAccount();
            const maiUserId = await getMAIUserId(sql);
            if (!maiUserId) return;
            const answer = await generateMAICommentAnswer(sql, {
              postId,
              question: maiQuestion,
              requesterId: userId,
            });
            if (!answer) {
              console.warn("[Vibe API] /mai: aucun résultat IA, aucune réponse persistée");
              return;
            }
            const replyContent = answer;
            const aiInserted = await sql`
              INSERT INTO comments (post_id, author_id, parent_comment_id, content, depth)
              VALUES (${postId}::uuid, ${maiUserId}, ${maiParentId}::uuid, ${replyContent}, ${maiReplyDepth})
              RETURNING id
            `;
            const aiStats = await sql`
              UPDATE posts AS p
              SET replies_count = (
                SELECT COUNT(*)::int FROM comments c WHERE c.post_id = p.id
              )
              WHERE p.id = ${postId}::uuid AND COALESCE(p.status, 'published') = 'published'
              RETURNING p.id, p.author_id, p.likes_count, p.reposts_count, p.replies_count
            `;
            if (aiStats.length > 0) await emitPostStats(aiStats[0]);
            try {
              await sql`
                INSERT INTO notifications (recipient_id, actor_id, type, post_id, comment_id, message)
                VALUES (${userId}, ${maiUserId}, 'reply', ${postId}::uuid, ${aiInserted[0]?.id}::uuid, 'mAI a répondu à votre question /mai')
              `;
            } catch {}
          } catch (aiErr) {
            console.warn("[Vibe API] /mai async:", (aiErr as any)?.message);
          }
        }, 50);
      }

      return c.json({
        success: true,
        ai_pending: isMaiCommand,
        comment: {
          ...inserted[0],
          username: userRow[0]?.username,
          display_name: prRow[0]?.display_name || userRow[0]?.username,
          avatar_url: prRow[0]?.avatar_url,
          liked_by_me: false,
          media_assets: insertedCommentMedia,
        },
      }, 201);
    } catch (err: any) {
      console.error("[Add Comment Error]:", err);
      const isMissingTable =
        err?.code === "42P01" ||
        (err?.message?.includes("does not exist") && (err?.message?.includes("comments") || err?.message?.includes("relation")));
      return c.json(
        {
          error: isMissingTable
            ? "Table comments incomplète — migration requise."
            : "Erreur ajout commentaire.",
        },
        500
      );
    }
  };

  registerMulti("post", ["/api/vibe/posts/:id/comments", "/vibe/posts/:id/comments", "/v1/posts/:id/comments", "/comments/:id"], handleAddComment);

  // 4. LIKE / UNLIKE A COMMENT
  const handleLikeComment = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      if (!Number.isSafeInteger(userId) || userId <= 0) return c.json({ error: "Non authentifié." }, 401);

      // Le paramètre du post fait partie de l'URL et doit être utilisé pour
      // vérifier que le commentaire appartient bien au post demandé.
      const postId = c.req.param("id");
      const commentId = c.req.param("commentId");
      if (!isUuid(postId)) {
        return c.json({ error: "Identifiant de post invalide." }, 400);
      }
      if (!isUuid(commentId)) {
        return c.json({ error: "Identifiant de commentaire invalide." }, 400);
      }

      const sql = getDb();
      await ensurePostColumns();
      await ensureCircleTable().catch(() => {});
      const access = await getPostForViewer(sql, postId, userId);
      if (access.error) return c.json({ error: access.error, blocked: access.blocked }, access.status);

      const commentRows = await sql`
        SELECT c.id, c.post_id, c.author_id, c.is_hidden
        FROM comments c
        WHERE c.id = ${commentId}::uuid AND c.post_id = ${postId}::uuid
        LIMIT 1
      `;
      if (commentRows.length === 0 || commentRows[0].is_hidden) {
        return c.json({ error: "Commentaire introuvable." }, 404);
      }
      const comment = commentRows[0];
      const commentAuthorId = Number(comment.author_id);
      if (
        commentAuthorId &&
        commentAuthorId !== userId &&
        await isBlockEitherWay(userId, commentAuthorId)
      ) {
        return c.json({ error: "Commentaire indisponible." }, 403);
      }

      const removed = await sql`
        DELETE FROM comment_likes
        WHERE user_id = ${userId} AND comment_id = ${commentId}::uuid
        RETURNING id
      `;
      let becameLiked = false;
      if (removed.length === 0) {
        const inserted = await sql`
          INSERT INTO comment_likes (user_id, comment_id)
          VALUES (${userId}, ${commentId}::uuid)
          ON CONFLICT (user_id, comment_id) DO NOTHING
          RETURNING id
        `;
        becameLiked = inserted.length > 0;
      }

      const synced = await syncCommentLikeCounter(sql, commentId, userId);
      if (synced.length === 0) return c.json({ error: "Commentaire introuvable." }, 404);

      if (becameLiked && commentAuthorId && commentAuthorId !== userId && !(await isBlockEitherWay(userId, commentAuthorId))) {
        try {
          await sql`
            INSERT INTO notifications (recipient_id, actor_id, type, post_id, comment_id, message)
            SELECT ${commentAuthorId}, ${userId}, 'like', ${postId}::uuid, ${commentId}::uuid,
                   'a aimé votre commentaire'
            WHERE NOT EXISTS (
              SELECT 1 FROM notifications
              WHERE recipient_id = ${commentAuthorId} AND actor_id = ${userId}
                AND type = 'like' AND post_id = ${postId}::uuid AND comment_id = ${commentId}::uuid
            )
          `;
        } catch {}
      } else if (removed.length > 0) {
        try {
          await sql`
            DELETE FROM notifications
            WHERE actor_id = ${userId} AND post_id = ${postId}::uuid
              AND comment_id = ${commentId}::uuid AND type = 'like'
          `;
        } catch {}
      }

      return c.json({
        success: true,
        liked: Boolean(synced[0].liked ?? becameLiked),
        likes_count: Number(synced[0].likes_count || 0),
      });
    } catch (err: any) {
      console.error("[Like Comment Error]:", err);
      return c.json({ error: "Erreur lors du like du commentaire." }, 500);
    }
  };

  registerMulti("post", ["/api/vibe/posts/:id/comments/:commentId/like", "/vibe/posts/:id/comments/:commentId/like", "/v1/posts/:id/comments/:commentId/like"], handleLikeComment);
}
