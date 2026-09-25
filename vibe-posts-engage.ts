/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — POSTS ENGAGEMENT (vibe-posts-engage.ts)
 * Likes, reposts, feedback algorithmique, bookmarks, commentaires & fils,
 * comptage de vues et épinglage sur le profil.
 * Enregistré par vibe-posts.ts (registerVibePostsRoutes) via
 * registerPostEngagementRoutes — l'ordre des registerMulti est inchangé.
 * ============================================================================
 */

import {
  extractToken,
  getDb,
  isPaidTier,
  rateLimit,
  verifyToken,
} from "./config.ts";
import { pushRealtimeEvent } from "./realtime.ts";
import { ensureCircleTable } from "./vibe-circle.ts";
import { isBlockEitherWay, type RegisterMultiFn } from "./vibe-common.ts";
import { ensureMAIAccount, getMAIUserId } from "./vibe-dms.ts";
import { generateMAICommentAnswer } from "./vibe-mai.ts";
import { MAIAgentFleet } from "./vibe-mai-fleet.ts";
import {
  ensurePostColumns,
  ensureProfilePinnedPostsTable,
  isUuid,
  stripHtmlTags,
} from "./vibe-posts-core.ts";

async function canViewerAccessPost(
  sql: any,
  postId: string,
  viewerId: number
): Promise<boolean> {
  if (!isUuid(postId)) return false;
  const rows = await sql`
    SELECT p.id
    FROM posts p
    WHERE p.id = ${postId}::uuid
      AND COALESCE(p.status, 'published') = 'published'
      AND (
        COALESCE(p.visibility, 'public') = 'public'
        OR p.author_id = ${viewerId}
        OR (
          p.visibility = 'followers'
          AND EXISTS (
            SELECT 1 FROM follows f
            WHERE f.follower_id = ${viewerId}
              AND f.following_id = p.author_id
          )
        )
        OR (
          p.visibility = 'circle'
          AND EXISTS (
            SELECT 1 FROM circle_members cm
            WHERE cm.user_id = p.author_id
              AND cm.member_user_id = ${viewerId}
          )
        )
      )
    LIMIT 1
  `;
  return rows.length > 0;
}

export function registerPostEngagementRoutes(registerMulti: RegisterMultiFn) {
  // 2. LIKES & REPOSTS & BOOKMARKS
  const handleLike = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);

      const postId = c.req.param("id");
      const sql = getDb();

      if (!(await canViewerAccessPost(sql, postId, userId))) {
        return c.json({ error: "Publication introuvable." }, 404);
      }

      const existing = await sql`
        SELECT id FROM post_interactions
        WHERE user_id = ${userId} AND post_id = ${postId}::uuid AND interaction_type = 'like'
      `;

      if (existing.length > 0) {
        await sql`DELETE FROM post_interactions WHERE id = ${existing[0].id}::uuid`;
        await sql`UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = ${postId}::uuid`;
        try {
          await sql`
            DELETE FROM notifications
            WHERE actor_id = ${userId} AND post_id = ${postId}::uuid AND type = 'like'
          `;
        } catch {}
        // Temps réel : compteurs actualisés pour l'auteur (flux SSE)
        try {
          const statsRows =
            await sql`SELECT author_id, likes_count, reposts_count, replies_count FROM posts WHERE id = ${postId}::uuid LIMIT 1`;
          if (statsRows[0]) {
            await pushRealtimeEvent(statsRows[0].author_id, "post_stats", {
              likes_count: Number(statsRows[0].likes_count || 0),
              post_id: postId,
              replies_count: Number(statsRows[0].replies_count || 0),
              reposts_count: Number(statsRows[0].reposts_count || 0),
            });
          }
        } catch {}
        return c.json({ liked: false, success: true });
      }
      await sql`
          INSERT INTO post_interactions (user_id, post_id, interaction_type)
          VALUES (${userId}, ${postId}::uuid, 'like')
          ON CONFLICT (user_id, post_id, interaction_type) DO NOTHING
        `;
      await sql`UPDATE posts SET likes_count = likes_count + 1 WHERE id = ${postId}::uuid`;

      const postAuthor =
        await sql`SELECT author_id, content, likes_count, reposts_count, replies_count FROM posts WHERE id = ${postId}::uuid LIMIT 1`;
      if (postAuthor.length > 0) {
        // Temps réel : compteurs actualisés pour l'auteur (flux SSE)
        pushRealtimeEvent(postAuthor[0].author_id, "post_stats", {
          likes_count: Number(postAuthor[0].likes_count || 0),
          post_id: postId,
          replies_count: Number(postAuthor[0].replies_count || 0),
          reposts_count: Number(postAuthor[0].reposts_count || 0),
        }).catch(() => {});

        const recipientId = Number(postAuthor[0].author_id);
        if (
          recipientId !== userId &&
          !(await isBlockEitherWay(userId, recipientId))
        ) {
          const rawContent = stripHtmlTags(postAuthor[0].content || "").trim();
          const snippet = rawContent
            ? ` : « ${rawContent.slice(0, 45)}${rawContent.length > 45 ? "…" : ""} »`
            : "";
          const msg = `a aimé votre publication${snippet}`;
          try {
            await sql`
                INSERT INTO notifications (recipient_id, actor_id, type, post_id, message)
                VALUES (${recipientId}, ${userId}, 'like', ${postId}::uuid, ${msg})
              `;
          } catch (err) {
            console.error("[Like Notification Error]:", err);
          }
        }
      }

      return c.json({ liked: true, success: true });
    } catch (err: any) {
      return c.json(
        { error: err.message || "Erreur lors de l'interaction." },
        500
      );
    }
  };

  registerMulti(
    "post",
    [
      "/api/vibe/posts/:id/like",
      "/vibe/posts/:id/like",
      "/v1/posts/:id/like",
      "/like/:id",
      "/api/vibe/posts/:id/likes",
    ],
    handleLike
  );

  const handleRepost = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);

      const postId = c.req.param("id");
      const sql = getDb();

      if (!(await canViewerAccessPost(sql, postId, userId))) {
        return c.json({ error: "Publication introuvable." }, 404);
      }

      const existing = await sql`
        SELECT id FROM post_interactions
        WHERE user_id = ${userId} AND post_id = ${postId}::uuid AND interaction_type = 'repost'
      `;

      if (existing.length > 0) {
        await sql`DELETE FROM post_interactions WHERE id = ${existing[0].id}::uuid`;
        await sql`UPDATE posts SET reposts_count = GREATEST(0, reposts_count - 1) WHERE id = ${postId}::uuid`;
        try {
          await sql`
            DELETE FROM notifications
            WHERE actor_id = ${userId} AND post_id = ${postId}::uuid AND type = 'repost'
          `;
        } catch {}
        // Temps réel : compteurs actualisés pour l'auteur (flux SSE)
        try {
          const statsRows =
            await sql`SELECT author_id, likes_count, reposts_count, replies_count FROM posts WHERE id = ${postId}::uuid LIMIT 1`;
          if (statsRows[0]) {
            await pushRealtimeEvent(statsRows[0].author_id, "post_stats", {
              likes_count: Number(statsRows[0].likes_count || 0),
              post_id: postId,
              replies_count: Number(statsRows[0].replies_count || 0),
              reposts_count: Number(statsRows[0].reposts_count || 0),
            });
          }
        } catch {}
        return c.json({ reposted: false, success: true });
      }
      await sql`
          INSERT INTO post_interactions (user_id, post_id, interaction_type)
          VALUES (${userId}, ${postId}::uuid, 'repost')
          ON CONFLICT (user_id, post_id, interaction_type) DO NOTHING
        `;
      await sql`UPDATE posts SET reposts_count = reposts_count + 1 WHERE id = ${postId}::uuid`;

      const postAuthor =
        await sql`SELECT author_id, content, likes_count, reposts_count, replies_count FROM posts WHERE id = ${postId}::uuid LIMIT 1`;
      if (postAuthor.length > 0) {
        // Temps réel : compteurs actualisés pour l'auteur (flux SSE)
        pushRealtimeEvent(postAuthor[0].author_id, "post_stats", {
          likes_count: Number(postAuthor[0].likes_count || 0),
          post_id: postId,
          replies_count: Number(postAuthor[0].replies_count || 0),
          reposts_count: Number(postAuthor[0].reposts_count || 0),
        }).catch(() => {});

        const recipientId = Number(postAuthor[0].author_id);
        if (
          recipientId !== userId &&
          !(await isBlockEitherWay(userId, recipientId))
        ) {
          const rawContent = stripHtmlTags(postAuthor[0].content || "").trim();
          const snippet = rawContent
            ? ` : « ${rawContent.slice(0, 45)}${rawContent.length > 45 ? "…" : ""} »`
            : "";
          const msg = `a republié votre publication${snippet}`;
          try {
            await sql`
                INSERT INTO notifications (recipient_id, actor_id, type, post_id, message)
                VALUES (${recipientId}, ${userId}, 'repost', ${postId}::uuid, ${msg})
              `;
          } catch (err) {
            console.error("[Repost Notification Error]:", err);
          }
        }
      }

      return c.json({ reposted: true, success: true });
    } catch (err: any) {
      return c.json({ error: err.message || "Erreur lors du repartage." }, 500);
    }
  };

  registerMulti(
    "post",
    [
      "/api/vibe/posts/:id/repost",
      "/vibe/posts/:id/repost",
      "/v1/posts/:id/repost",
      "/repost/:id",
      "/api/vibe/posts/:id/reposts",
    ],
    handleRepost
  );

  // 2bis. FEEDBACK ALGORITHMIQUE (« Cela m'intéresse » / « Cela ne m'intéresse pas »)
  const handlePostFeedback = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);

      const postId = c.req.param("id");
      if (!isUuid(postId)) {
        return c.json({ error: "Identifiant de post invalide." }, 400);
      }

      const body = await c.req.json().catch(() => ({}) as any);
      const value = body?.value;
      if (
        value !== "more" &&
        value !== "less" &&
        value !== null &&
        value !== undefined
      ) {
        return c.json(
          { error: "Valeur de feedback invalide (more | less | null)." },
          400
        );
      }

      const sql = getDb();
      // Toggle : supprime les deux types puis réinsère si un nouveau choix
      await sql`
        DELETE FROM post_interactions
        WHERE user_id = ${userId} AND post_id = ${postId}::uuid
          AND interaction_type IN ('interest_more', 'interest_less')
      `;
      if (value === "more" || value === "less") {
        const interactionType =
          value === "more" ? "interest_more" : "interest_less";
        await sql`
          INSERT INTO post_interactions (user_id, post_id, interaction_type)
          VALUES (${userId}, ${postId}::uuid, ${interactionType})
          ON CONFLICT (user_id, post_id, interaction_type) DO NOTHING
        `;
      }

      return c.json({ my_feedback: value ?? null, success: true });
    } catch (err: any) {
      console.error("[Post Feedback Error]:", err);
      return c.json(
        { error: "Erreur lors de l'enregistrement du feedback." },
        500
      );
    }
  };

  registerMulti(
    "post",
    [
      "/api/vibe/posts/:id/feedback",
      "/vibe/posts/:id/feedback",
      "/v1/posts/:id/feedback",
      "/feedback/:id",
    ],
    handlePostFeedback
  );

  const handleBookmark = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);

      const postId = c.req.param("id");
      const sql = getDb();

      const existing = await sql`
        SELECT id FROM bookmarks WHERE user_id = ${userId} AND post_id = ${postId}::uuid
      `;

      if (existing.length > 0) {
        await sql`DELETE FROM bookmarks WHERE id = ${existing[0].id}::uuid`;
        await sql`UPDATE posts SET bookmarks_count = GREATEST(0, bookmarks_count - 1) WHERE id = ${postId}::uuid`;
        return c.json({ bookmarked: false, success: true });
      }
      await sql`
          INSERT INTO bookmarks (user_id, post_id) VALUES (${userId}, ${postId}::uuid)
          ON CONFLICT (user_id, post_id) DO NOTHING
        `;
      await sql`UPDATE posts SET bookmarks_count = bookmarks_count + 1 WHERE id = ${postId}::uuid`;
      return c.json({ bookmarked: true, success: true });
    } catch (err: any) {
      return c.json(
        { error: err.message || "Erreur lors de l'enregistrement." },
        500
      );
    }
  };

  registerMulti(
    "post",
    [
      "/api/vibe/posts/:id/bookmark",
      "/vibe/posts/:id/bookmark",
      "/v1/posts/:id/bookmark",
      "/bookmark/:id",
      "/api/vibe/posts/:id/bookmarks",
    ],
    handleBookmark
  );

  // 3. COMMENTS
  const handleGetComments = async (c: any) => {
    try {
      const postId = c.req.param("id");
      const sql = getDb();

      if (!isUuid(postId)) {
        return c.json({ aiDigest: null, comments: [], count: 0 });
      }

      let currentUserId: number | null = null;
      const token = extractToken(c.req.raw);
      if (token) {
        try {
          const payload = await verifyToken(token);
          currentUserId = Number(payload.sub || (payload as any).id);
        } catch {}
      }

      // Visibilité du post parent : les commentaires d'un post à audience
      // restreinte (Abonnés / Cercle Privé) ne fuient pas par cette route.
      await ensureCircleTable().catch(() => {});
      const parentPost =
        await sql`SELECT author_id, visibility FROM posts WHERE id = ${postId}::uuid LIMIT 1`;
      if (parentPost.length > 0) {
        const vis = String(parentPost[0].visibility || "public");
        const authorId = Number(parentPost[0].author_id);
        let canView =
          vis === "public" ||
          (currentUserId !== null && authorId === currentUserId);
        if (!canView && currentUserId !== null && vis === "followers") {
          const followerRows =
            await sql`SELECT 1 FROM follows WHERE follower_id = ${currentUserId} AND following_id = ${authorId} LIMIT 1`;
          canView = followerRows.length > 0;
        } else if (!canView && currentUserId !== null && vis === "circle") {
          const memberRows =
            await sql`SELECT 1 FROM circle_members WHERE user_id = ${authorId} AND member_user_id = ${currentUserId} LIMIT 1`;
          canView = memberRows.length > 0;
        }
        if (!canView) return c.json({ aiDigest: null, comments: [], count: 0 });
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
              alt_text: m.alt_text,
              media_type: m.media_type,
              url: m.url,
            });
          }
          for (const cm of enriched) {
            cm.media_assets = mediaByComment[String(cm.id)] || [];
          }
        }
      } catch (mediaErr) {
        console.warn("[vibe-posts] Comment media hydratation:", mediaErr);
      }

      let aiDigest: string | null = null;
      if (enriched.length >= 2) {
        aiDigest = MAIAgentFleet.synthesizeThread(
          enriched.map((cm: any) => ({
            author: cm.username,
            content: cm.content,
          }))
        );
      }

      return c.json({ aiDigest, comments: enriched, count: enriched.length });
    } catch (err: any) {
      console.error("[Get Comments Error]:", err);
      return c.json({ error: "Erreur récupération réponses." }, 500);
    }
  };

  registerMulti(
    "get",
    [
      "/api/vibe/posts/:id/comments",
      "/vibe/posts/:id/comments",
      "/v1/posts/:id/comments",
      "/comments/:id",
    ],
    handleGetComments
  );

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
      const body = await c.req.json().catch(() => ({}) as any);
      const durationMs = Math.max(
        0,
        Math.min(
          600_000,
          Number(body?.duration_ms ?? body?.dwell_ms ?? 1000) || 1000
        )
      );
      const dwellMs = Math.max(
        0,
        Math.min(600_000, Number(body?.dwell_ms ?? durationMs) || durationMs)
      );
      const visibleRatio = Math.max(
        0,
        Math.min(1, Number(body?.visible_ratio ?? 0.5) || 0.5)
      );
      const completed = dwellMs >= 5000 || durationMs >= 8000;
      const allowedSources = [
        "feed",
        "profile",
        "detail",
        "search",
        "dm",
        "trends",
      ];
      const rawSource = String(body?.source ?? "feed")
        .toLowerCase()
        .slice(0, 20);
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
      const updated = await sql`
        UPDATE posts
        SET views_count = COALESCE(views_count, 0) + 1
        WHERE id = ${postId}::uuid
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
            const prow =
              await sql`SELECT content FROM posts WHERE id = ${postId}::uuid LIMIT 1`;
            const content = String(prow[0]?.content || "");
            const tags = Array.from(
              new Set(
                Array.from(content.matchAll(/#([\p{L}\p{N}_]{2,30})/gu)).map(
                  (m: any) => String(m[1]).toLowerCase()
                )
              )
            ).slice(0, 5);
            for (const tag of tags) {
              await sql`
                INSERT INTO user_topic_affinity (user_id, topic, total_time_ms, views, score, updated_at)
                VALUES (${viewerId}, ${tag}, ${Math.round(durationMs)}, 1, ${Math.min(1, durationMs / 30_000)}, NOW())
                ON CONFLICT (user_id, topic)
                DO UPDATE SET
                  total_time_ms = user_topic_affinity.total_time_ms + ${Math.round(durationMs)},
                  views = user_topic_affinity.views + 1,
                  score = LEAST(1, user_topic_affinity.score * 0.95 + ${Math.min(1, durationMs / 30_000)} * 0.2),
                  updated_at = NOW()
              `.catch(() => {});
            }
          } catch {}
        }
      } catch {}
      return c.json({
        success: true,
        views_count: Number(updated[0].views_count || 0),
      });
    } catch (err: any) {
      console.warn("[Post View Error]:", err);
      return c.json({ success: false, views_count: null });
    }
  };

  registerMulti(
    "post",
    ["/api/vibe/posts/:id/view", "/vibe/posts/:id/view", "/v1/posts/:id/view"],
    handlePostView
  );

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

      const body = await c.req.json().catch(() => ({}) as any);
      const pinned = Boolean(body.pinned);

      const sql = getDb();
      const owned = await sql`
        SELECT id FROM posts WHERE id = ${postId}::uuid AND author_id = ${userId} LIMIT 1
      `;
      if (owned.length === 0) {
        return c.json(
          { error: "Publication introuvable ou non autorisée." },
          403
        );
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
            return c.json(
              {
                code: "PIN_LIMIT",
                error: `Vous ne pouvez épingler que ${MAX_PINNED_POSTS} publications sur votre profil.`,
              },
              400
            );
          }
        }
      }

      await sql`
        UPDATE posts SET is_pinned = ${pinned} WHERE id = ${postId}::uuid AND author_id = ${userId}
      `;
      const countRows = await sql`
        SELECT COUNT(*)::int AS n FROM posts WHERE author_id = ${userId} AND is_pinned = TRUE
      `;
      return c.json({
        pinned,
        pinned_count: Number(countRows[0]?.n || 0),
        success: true,
      });
    } catch (err: any) {
      console.error("[Pin Post Error]:", err);
      return c.json({ error: "Erreur lors de l'épinglage." }, 500);
    }
  };

  registerMulti(
    "post",
    ["/api/vibe/posts/:id/pin", "/vibe/posts/:id/pin", "/v1/posts/:id/pin"],
    handlePinPost
  );

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
      const body = await c.req.json().catch(() => ({}) as any);
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
        return c.json({
          pinned: false,
          pinned_count: ownCount + Number(foreignCountRows[0]?.n || 0),
          success: true,
        });
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
        return c.json(
          {
            code: "OWN_PIN",
            error:
              "Vos propres publications s'épinglent via « Épingler sur votre profil ».",
          },
          400
        );
      }
      if (target.visibility !== "public" || target.status !== "published") {
        return c.json(
          {
            error:
              "Seule une publication publique peut être mise en avant sur votre profil.",
          },
          403
        );
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
        return c.json(
          {
            code: "PIN_LIMIT",
            error: `Vous ne pouvez épingler que ${MAX_PINNED_POSTS} publications sur votre profil.`,
          },
          400
        );
      }
      const foreignCountRows = await sql`
        SELECT COUNT(*)::int AS n FROM profile_pinned_posts WHERE user_id = ${userId}
      `;
      return c.json({
        pinned: true,
        pinned_count: ownCount + Number(foreignCountRows[0]?.n || 0),
        success: true,
      });
    } catch (err: any) {
      console.error("[Profile Pin Error]:", err);
      return c.json({ error: "Erreur lors de l'épinglage." }, 500);
    }
  };

  registerMulti(
    "post",
    [
      "/api/vibe/posts/:id/profile-pin",
      "/vibe/posts/:id/profile-pin",
      "/v1/posts/:id/profile-pin",
    ],
    handleProfilePinPost
  );

  const handleAddComment = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);

      const postId = c.req.param("id");
      const body = await c.req.json().catch(() => ({}) as any);
      const content = body?.content ?? "";
      const parent_comment_id = body?.parent_comment_id;
      const commentMedia = Array.isArray(body?.media_assets)
        ? body.media_assets
        : [];

      if ((!content || !String(content).trim()) && commentMedia.length === 0) {
        return c.json({ error: "Commentaire vide." }, 400);
      }
      if (String(content).length > 10_000) {
        return c.json(
          { error: "Commentaire trop long (10 000 caractères max)." },
          400
        );
      }
      if (!isUuid(postId)) {
        return c.json({ error: "Identifiant de post invalide." }, 400);
      }

      // Validation des médias de commentaire : max 3 images + 1 vidéo
      const normalizedCommentMedia: Array<{
        url: string;
        media_type: string;
        alt_text: string;
      }> = [];
      let mediaImages = 0;
      let mediaVideos = 0;
      for (const m of commentMedia) {
        if (!m?.url || typeof m.url !== "string") continue;
        const type = String(m.media_type || m.type || "");
        const isVideo =
          type.startsWith("video") || /\.(mp4|webm|mov)(\?|$)/i.test(m.url);
        if (isVideo) mediaVideos++;
        else mediaImages++;
        if (mediaImages > 3 || mediaVideos > 1) {
          return c.json(
            { error: "Maximum 3 images et 1 vidéo par réponse." },
            400
          );
        }
        normalizedCommentMedia.push({
          alt_text: String(m.alt_text || m.alt || "").slice(0, 500),
          media_type: type || (isVideo ? "video/mp4" : "image/jpeg"),
          url: m.url.trim().slice(0, 2048),
        });
      }

      const sql = getDb();
      await ensurePostColumns();

      // Commande /mai : réponse IA en commentaire (abonnés Plus, Pro et Max uniquement)
      const plainStart = stripHtmlTags(String(content || "")).trim();
      const isMaiCommand = /^\/mai\b/i.test(plainStart);
      let maiQuestion = "";
      if (isMaiCommand) {
        const tierRows =
          await sql`SELECT tier FROM users WHERE id = ${userId} LIMIT 1`;
        if (!isPaidTier(tierRows[0]?.tier)) {
          return c.json(
            {
              code: "MAI_CMD",
              error:
                "La commande /mai est réservée aux abonnés Plus, Pro et Max.",
              plan_required: true,
            },
            403
          );
        }
        maiQuestion = plainStart.replace(/^\/mai\b/i, "").trim();
        if (!maiQuestion) {
          return c.json(
            { error: "Ajoutez votre question après la commande /mai." },
            400
          );
        }
        if (!(await rateLimit(`mai-cmd:${userId}`, 5, 60_000))) {
          return c.json(
            { error: "Trop de commandes /mai. Patientez une minute." },
            429
          );
        }
      }

      // Résoudre le parent (profondeur réelle, aplatie au niveau 4 max)
      let parentDepth = 0;
      let effectiveParentId: string | null = null;
      if (parent_comment_id) {
        if (!isUuid(parent_comment_id)) {
          return c.json({ error: "Commentaire parent invalide." }, 400);
        }
        const parentRows = await sql`
          SELECT id, depth, parent_comment_id FROM comments WHERE id = ${parent_comment_id}::uuid LIMIT 1
        `;
        if (parentRows.length === 0) {
          return c.json({ error: "Commentaire parent introuvable." }, 404);
        }
        const parent = parentRows[0];
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
        VALUES (${postId}::uuid, ${userId}, ${effectiveParentId || null}::uuid, ${String(content || "").trim()}, ${parentDepth + 1})
        RETURNING *
      `;

      // Insertion des médias joints au commentaire
      const insertedCommentMedia: any[] = [];
      for (const m of normalizedCommentMedia) {
        try {
          const res = await sql`
            INSERT INTO media_assets (owner_id, post_id, comment_id, url, media_type, alt_text)
            VALUES (${userId}, ${postId}::uuid, ${inserted[0].id}::uuid, ${m.url}, ${m.media_type}, ${m.alt_text})
            RETURNING id, url, media_type, alt_text
          `;
          if (res?.[0]) insertedCommentMedia.push(res[0]);
        } catch (mediaInsertErr) {
          console.warn("[vibe-posts] Comment media insert:", mediaInsertErr);
        }
      }

      await sql`UPDATE posts SET replies_count = replies_count + 1 WHERE id = ${postId}::uuid`;

      // Temps réel : replies_count actualisé pour l'auteur du post (flux SSE)
      try {
        const statsRows =
          await sql`SELECT author_id, likes_count, reposts_count, replies_count FROM posts WHERE id = ${postId}::uuid LIMIT 1`;
        if (statsRows[0]) {
          await pushRealtimeEvent(statsRows[0].author_id, "post_stats", {
            likes_count: Number(statsRows[0].likes_count || 0),
            post_id: postId,
            replies_count: Number(statsRows[0].replies_count || 0),
            reposts_count: Number(statsRows[0].reposts_count || 0),
          });
        }
      } catch {}

      // Notifier l'auteur du post (ou du commentaire parent) sans se notifier soi-même
      try {
        let notifyId: number | null = null;
        let notifMsg = "a répondu à votre post";
        if (effectiveParentId) {
          const pAuthor =
            await sql`SELECT author_id FROM comments WHERE id = ${effectiveParentId}::uuid LIMIT 1`;
          notifyId = Number(pAuthor[0]?.author_id) || null;
          notifMsg = "a répondu à votre commentaire";
        } else {
          const pAuthor =
            await sql`SELECT author_id FROM posts WHERE id = ${postId}::uuid LIMIT 1`;
          notifyId = Number(pAuthor[0]?.author_id) || null;
        }
        if (
          notifyId &&
          notifyId !== userId &&
          !(await isBlockEitherWay(userId, notifyId))
        ) {
          await sql`
            INSERT INTO notifications (recipient_id, actor_id, type, post_id, comment_id, message)
            VALUES (${notifyId}, ${userId}, 'reply', ${postId}::uuid, ${inserted[0]?.id}::uuid, ${notifMsg})
          `;
        }

        // Détection et notification des mentions @username dans les commentaires
        try {
          const plainComment = stripHtmlTags(String(content || ""));
          const mentionMatches = Array.from(
            new Set(plainComment.match(/@([a-zA-Z0-9_]{1,30})/g) || [])
          ).map((m: string) => m.slice(1).toLowerCase());
          if (mentionMatches.length > 0) {
            const mentionedUsers = await sql`
              SELECT id, username FROM users
              WHERE LOWER(username) = ANY(${mentionMatches}) AND id <> ${userId}
            `;
            const snippet =
              plainComment.length > 45
                ? `${plainComment.slice(0, 45)}…`
                : plainComment;
            for (const u of mentionedUsers) {
              if (
                Number(u.id) !== notifyId &&
                !(await isBlockEitherWay(userId, Number(u.id)))
              ) {
                await sql`
                  INSERT INTO notifications (recipient_id, actor_id, type, post_id, comment_id, message)
                  VALUES (${u.id}, ${userId}, 'mention', ${postId}::uuid, ${inserted[0]?.id}::uuid, ${`vous a mentionné dans un commentaire : « ${snippet} »`})
                `.catch(() => {});
              }
            }
          }
        } catch (mentionErr) {
          console.warn(
            "[Vibe API] Erreur notification mention commentaire:",
            mentionErr
          );
        }
      } catch {}

      const userRow =
        await sql`SELECT username FROM users WHERE id = ${userId} LIMIT 1`;
      const prRow =
        await sql`SELECT display_name, avatar_url FROM profiles WHERE user_id = ${userId} LIMIT 1`;

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
            const replyContent =
              answer ||
              "Je n'ai pas pu générer de réponse pour le moment. Réessayez dans un instant.";
            const aiInserted = await sql`
              INSERT INTO comments (post_id, author_id, parent_comment_id, content, depth)
              VALUES (${postId}::uuid, ${maiUserId}, ${maiParentId}::uuid, ${replyContent}, ${maiReplyDepth})
              RETURNING id
            `;
            await sql`UPDATE posts SET replies_count = replies_count + 1 WHERE id = ${postId}::uuid`;
            try {
              const statsRows =
                await sql`SELECT author_id, likes_count, reposts_count, replies_count FROM posts WHERE id = ${postId}::uuid LIMIT 1`;
              if (statsRows[0]) {
                await pushRealtimeEvent(statsRows[0].author_id, "post_stats", {
                  likes_count: Number(statsRows[0].likes_count || 0),
                  post_id: postId,
                  replies_count: Number(statsRows[0].replies_count || 0),
                  reposts_count: Number(statsRows[0].reposts_count || 0),
                });
              }
            } catch {}
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

      return c.json(
        {
          ai_pending: isMaiCommand,
          comment: {
            ...inserted[0],
            avatar_url: prRow[0]?.avatar_url,
            display_name: prRow[0]?.display_name || userRow[0]?.username,
            liked_by_me: false,
            media_assets: insertedCommentMedia,
            username: userRow[0]?.username,
          },
          success: true,
        },
        201
      );
    } catch (err: any) {
      console.error("[Add Comment Error]:", err);
      const isMissingTable =
        err?.code === "42P01" ||
        (err?.message?.includes("does not exist") &&
          (err?.message?.includes("comments") ||
            err?.message?.includes("relation")));
      return c.json(
        {
          error: isMissingTable
            ? "Table comments incomplète — migration requise."
            : err?.message || "Erreur ajout commentaire.",
        },
        500
      );
    }
  };

  registerMulti(
    "post",
    [
      "/api/vibe/posts/:id/comments",
      "/vibe/posts/:id/comments",
      "/v1/posts/:id/comments",
      "/comments/:id",
    ],
    handleAddComment
  );

  // 4. LIKE / UNLIKE A COMMENT
  const handleLikeComment = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      const commentId = c.req.param("commentId");

      if (!isUuid(commentId)) {
        return c.json({ error: "Identifiant de commentaire invalide." }, 400);
      }

      const sql = getDb();

      let alreadyLiked = false;
      try {
        const existing = await sql`
          SELECT 1 FROM comment_likes WHERE user_id = ${userId} AND comment_id = ${commentId}::uuid LIMIT 1
        `;
        alreadyLiked = existing.length > 0;
      } catch {
        // Table comment_likes absente : on retombe sur un simple compteur
      }

      if (alreadyLiked) {
        try {
          await sql`DELETE FROM comment_likes WHERE user_id = ${userId} AND comment_id = ${commentId}::uuid`;
        } catch {}
        await sql`UPDATE comments SET likes_count = GREATEST(0, COALESCE(likes_count, 0) - 1) WHERE id = ${commentId}::uuid`;
        const row =
          await sql`SELECT COALESCE(likes_count, 0) as likes_count FROM comments WHERE id = ${commentId}::uuid LIMIT 1`;
        return c.json({
          liked: false,
          likes_count: Number(row[0]?.likes_count || 0),
          success: true,
        });
      }
      try {
        await sql`INSERT INTO comment_likes (user_id, comment_id) VALUES (${userId}, ${commentId}::uuid)`;
      } catch {}
      await sql`UPDATE comments SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = ${commentId}::uuid`;
      const row =
        await sql`SELECT COALESCE(likes_count, 0) as likes_count FROM comments WHERE id = ${commentId}::uuid LIMIT 1`;

      try {
        const cm =
          await sql`SELECT author_id, post_id FROM comments WHERE id = ${commentId}::uuid LIMIT 1`;
        const authorId = Number(cm[0]?.author_id);
        if (
          authorId &&
          authorId !== userId &&
          !(await isBlockEitherWay(userId, authorId))
        ) {
          await sql`
              INSERT INTO notifications (recipient_id, actor_id, type, post_id, comment_id, message)
              VALUES (${authorId}, ${userId}, 'like', ${cm[0]?.post_id}::uuid, ${commentId}::uuid, 'a aimé votre commentaire')
            `;
        }
      } catch {}

      return c.json({
        liked: true,
        likes_count: Number(row[0]?.likes_count || 0),
        success: true,
      });
    } catch (err: any) {
      console.error("[Like Comment Error]:", err);
      return c.json({ error: "Erreur lors du like du commentaire." }, 500);
    }
  };

  registerMulti(
    "post",
    [
      "/api/vibe/posts/:id/comments/:commentId/like",
      "/vibe/posts/:id/comments/:commentId/like",
      "/v1/posts/:id/comments/:commentId/like",
    ],
    handleLikeComment
  );
}
