/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — USERS & PROFILES (vibe-users.ts)
 * User authentication, profile querying, avatar upload, follow graph & search
 * ============================================================================
 */

import type { Hono } from "npm:hono@4";
import {
  extractToken,
  getDb,
  getTierDailyImageLimit,
  getTierMaiTokenLimit,
  getWeekData,
  rateLimit,
  verifyToken,
} from "./config.ts";
import { selectStorageNode, uploadWithFallback } from "./storage.ts";
import { ensureCircleTable } from "./vibe-circle.ts";
import type { RegisterMultiFn } from "./vibe-common.ts";
import {
  attachBookRefs,
  attachPollsAndCollabs,
  attachQuotedPosts,
  ensureProfilePinnedPostsTable,
  publishDuePosts,
} from "./vibe-posts-core.ts";

const MAX_INTERESTS = 5;
const MAX_INTEREST_LENGTH = 30;
const MAX_BIO_LENGTH = 2000;
const MAX_WEBSITE_LENGTH = 255;
const MAX_LOCATION_LENGTH = 100;

export function registerVibeUsersRoutes(
  app: Hono,
  registerMulti: RegisterMultiFn
) {
  // 1. CURRENT USER PROFILE & QUOTAS VIA JWT
  const handleMe = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(
        payload.sub || (payload as any).id || (payload as any).userId
      );

      if (!userId || Number.isNaN(userId)) {
        return c.json({ error: "Jeton JWT invalide." }, 401);
      }

      const sql = getDb();
      const userRows = await sql`
        SELECT u.id, u.username, u.email, u.tier, u.avatar_url,
               COALESCE(u.created_at, NOW()) as created_at,
               (COALESCE(u.is_verified, FALSE) OR LOWER(COALESCE(u.tier, '')) IN ('plus', 'pro', 'max')) as is_verified,
               pr.display_name, pr.bio, pr.banner_url, pr.website, pr.location, pr.interests, pr.followers_count, pr.following_count, pr.posts_count
        FROM users u
        LEFT JOIN profiles pr ON pr.user_id = u.id
        WHERE u.id = ${userId}
        LIMIT 1
      `;

      if (userRows.length === 0) {
        return c.json({ error: "Utilisateur introuvable." }, 404);
      }

      const row = userRows[0];
      const { weekStartStr, nextResetIso } = getWeekData();
      const [usageRows, imgRows] = await Promise.all([
        sql`SELECT COALESCE(SUM(tokens_used), 0) as tokens FROM weekly_usage WHERE user_id = ${userId} AND week_start = ${weekStartStr}::date`,
        sql`SELECT COALESCE(images_generated, 0) as images FROM daily_image_usage WHERE user_id = ${userId} AND usage_date = CURRENT_DATE`,
      ]);

      const tier = row.tier || "Free";
      const tokenLimit = getTierMaiTokenLimit(tier);
      const imageLimit = getTierDailyImageLimit(tier);
      const tokensUsed = Number(usageRows[0]?.tokens || 0);
      const imagesUsed = Number(imgRows[0]?.images || 0);

      const quotas = {
        dailyImages: {
          limit: imageLimit,
          percent: Math.min(100, Math.round((imagesUsed / imageLimit) * 100)),
          used: imagesUsed,
        },
        resetAt: nextResetIso,
        tier,
        weeklyTokens: {
          limit: tokenLimit,
          percent: Math.min(100, Math.round((tokensUsed / tokenLimit) * 100)),
          used: tokensUsed,
        },
      };

      return c.json({
        profile: {
          avatarUrl: row.avatar_url,
          bannerUrl: row.banner_url,
          bio: row.bio || "",
          displayName: row.display_name || row.username,
          followersCount: row.followers_count || 0,
          followingCount: row.following_count || 0,
          id: row.id,
          interests: row.interests || [],
          is_verified: Boolean(row.is_verified),
          location: row.location || "",
          postsCount: row.posts_count || 0,
          username: row.username,
          website: row.website || "",
        },
        quotas,
        user: {
          avatar_url: row.avatar_url,
          created_at: row.created_at,
          email: row.email,
          id: row.id,
          is_verified: Boolean(row.is_verified),
          tier: row.tier,
          username: row.username,
        },
      });
    } catch (err: any) {
      console.error("[Me Handler Error]:", err);
      return c.json(
        { error: err.message || "Session expirée ou invalide." },
        401
      );
    }
  };

  registerMulti("get", ["/api/vibe/me", "/vibe/me", "/v1/me", "/me"], handleMe);

  // 2. SUGGESTED USERS
  const handleSuggestedUsers = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      let currentUserId: number | null = null;
      if (token) {
        try {
          const payload = await verifyToken(token);
          currentUserId = Number(payload.sub || (payload as any).id);
        } catch {}
      }

      const sql = getDb();
      const rows = await sql`
        SELECT u.id, u.username, u.tier,
               (COALESCE(u.is_verified, FALSE) OR LOWER(COALESCE(u.tier, '')) IN ('plus', 'pro', 'max')) as is_verified,
               COALESCE(pr.display_name, u.username) as display_name,
               COALESCE(pr.avatar_url, u.avatar_url) as avatar_url,
               COALESCE(pr.bio, 'Membre Vibe') as bio,
               COALESCE(pr.followers_count, 0) as followers_count
        FROM users u
        LEFT JOIN profiles pr ON pr.user_id = u.id
        WHERE (${currentUserId ? sql`u.id != ${currentUserId}` : true})
        ORDER BY pr.followers_count DESC, u.id DESC
        LIMIT 5
      `;

      return c.json({ users: rows });
    } catch {
      return c.json({ users: [] });
    }
  };

  registerMulti(
    "get",
    [
      "/api/vibe/users/suggested",
      "/vibe/users/suggested",
      "/v1/users/suggested",
      "/users/suggested",
    ],
    handleSuggestedUsers
  );

  // 2bis. TOP VIBERS — meilleurs comptes par abonnés (Explorer)
  const handleTopVibers = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      let currentUserId: number | null = null;
      if (token) {
        try {
          const payload = await verifyToken(token);
          currentUserId = Number(payload.sub || (payload as any).id);
        } catch {}
      }

      const limit = Math.min(
        20,
        Math.max(1, Number(c.req.query("limit") || 5))
      );

      const sql = getDb();
      const rows = await sql`
        SELECT u.id, u.username, u.tier,
               (COALESCE(u.is_verified, FALSE) OR LOWER(COALESCE(u.tier, '')) IN ('plus', 'pro', 'max')) as is_verified,
               COALESCE(pr.display_name, u.username) as display_name,
               COALESCE(pr.avatar_url, u.avatar_url) as avatar_url,
               COALESCE(pr.bio, 'Membre Vibe') as bio,
               COALESCE(pr.followers_count, 0) as followers_count,
               ${currentUserId ? sql`EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = ${currentUserId} AND f.following_id = u.id)` : sql`FALSE`} as is_following
        FROM users u
        LEFT JOIN profiles pr ON pr.user_id = u.id
        WHERE (${currentUserId ? sql`u.id != ${currentUserId}` : true})
          AND LOWER(u.username) NOT IN ('bot', 'mai')
        ORDER BY COALESCE(pr.followers_count, 0) DESC, u.id DESC
        LIMIT ${limit}
      `;

      return c.json({ users: rows });
    } catch {
      return c.json({ users: [] });
    }
  };

  registerMulti(
    "get",
    ["/api/vibe/users/top", "/vibe/users/top", "/v1/users/top", "/users/top"],
    handleTopVibers
  );

  // 2ter. ABONNÉS / ABONNEMENTS D'UN PROFIL (listes paginées, boutons Suivre)
  const handleFollowList = async (c: any, kind: "followers" | "following") => {
    try {
      const username = (c.req.param("username") || "")
        .replace(/^@/, "")
        .toLowerCase()
        .trim();
      if (!username) return c.json({ has_more: false, users: [] });
      let currentUserId: number | null = null;
      const token = extractToken(c.req.raw);
      if (token) {
        try {
          const payload = await verifyToken(token);
          currentUserId = Number(payload.sub || (payload as any).id);
        } catch {}
      }
      const limit = Math.min(
        100,
        Math.max(1, Number(c.req.query("limit") || 20))
      );
      const offset = Math.max(0, Number(c.req.query("offset") || 0));

      const sql = getDb();
      const target =
        await sql`SELECT id FROM users WHERE LOWER(username) = ${username} LIMIT 1`;
      if (target.length === 0)
        return c.json({ error: "Profil introuvable." }, 404);
      const targetId = Number(target[0].id);

      const users =
        kind === "followers"
          ? await sql`
            SELECT u.id, u.username, u.tier,
                   (COALESCE(u.is_verified, FALSE) OR LOWER(COALESCE(u.tier, '')) IN ('plus', 'pro', 'max')) as is_verified,
                   COALESCE(pr.display_name, u.username) as display_name,
                   COALESCE(pr.avatar_url, u.avatar_url) as avatar_url,
                   COALESCE(pr.followers_count, 0) as followers_count,
                   ${currentUserId ? sql`EXISTS (SELECT 1 FROM follows f2 WHERE f2.follower_id = ${currentUserId} AND f2.following_id = u.id)` : sql`FALSE`} as is_following
            FROM follows f
            JOIN users u ON u.id = f.follower_id
            LEFT JOIN profiles pr ON pr.user_id = u.id
            WHERE f.following_id = ${targetId}
            ORDER BY f.created_at DESC
            LIMIT ${limit + 1} OFFSET ${offset}
          `
          : await sql`
            SELECT u.id, u.username, u.tier,
                   (COALESCE(u.is_verified, FALSE) OR LOWER(COALESCE(u.tier, '')) IN ('plus', 'pro', 'max')) as is_verified,
                   COALESCE(pr.display_name, u.username) as display_name,
                   COALESCE(pr.avatar_url, u.avatar_url) as avatar_url,
                   COALESCE(pr.followers_count, 0) as followers_count,
                   ${currentUserId ? sql`EXISTS (SELECT 1 FROM follows f2 WHERE f2.follower_id = ${currentUserId} AND f2.following_id = u.id)` : sql`FALSE`} as is_following
            FROM follows f
            JOIN users u ON u.id = f.following_id
            LEFT JOIN profiles pr ON pr.user_id = u.id
            WHERE f.follower_id = ${targetId}
            ORDER BY f.created_at DESC
            LIMIT ${limit + 1} OFFSET ${offset}
          `;

      const hasMore = users.length > limit;
      return c.json({ has_more: hasMore, users: users.slice(0, limit) });
    } catch {
      return c.json({ has_more: false, users: [] });
    }
  };

  const handleProfileFollowers = (c: any) => handleFollowList(c, "followers");
  const handleProfileFollowing = (c: any) => handleFollowList(c, "following");

  registerMulti(
    "get",
    [
      "/api/vibe/profiles/:username/followers",
      "/vibe/profiles/:username/followers",
      "/v1/profiles/:username/followers",
      "/profiles/:username/followers",
    ],
    handleProfileFollowers
  );
  registerMulti(
    "get",
    [
      "/api/vibe/profiles/:username/following",
      "/vibe/profiles/:username/following",
      "/v1/profiles/:username/following",
      "/profiles/:username/following",
    ],
    handleProfileFollowing
  );

  // 3. SEARCH USERS
  const handleSearchUsers = async (c: any) => {
    try {
      const q = (c.req.query("q") || "").trim().toLowerCase();
      if (!q || q.length < 1) return c.json({ users: [] });

      const sql = getDb();
      const users = await sql`
        SELECT
          u.id, u.username, u.tier,
          (COALESCE(u.is_verified, FALSE) OR LOWER(COALESCE(u.tier, '')) IN ('plus', 'pro', 'max')) as is_verified,
          pr.display_name, pr.avatar_url, pr.bio,
          pr.followers_count, pr.posts_count
        FROM users u
        LEFT JOIN profiles pr ON pr.user_id = u.id
        WHERE
          LOWER(u.username) LIKE ${`%${q}%`}
          OR LOWER(COALESCE(pr.display_name, '')) LIKE ${`%${q}%`}
        ORDER BY
          CASE WHEN LOWER(u.username) = ${q} THEN 0
               WHEN LOWER(u.username) LIKE ${`${q}%`} THEN 1
               ELSE 2 END,
          COALESCE(pr.followers_count, 0) DESC
        LIMIT 10
      `;
      return c.json({ users });
    } catch {
      return c.json({ users: [] });
    }
  };

  registerMulti(
    "get",
    ["/api/vibe/search/users", "/vibe/search/users", "/v1/search/users"],
    handleSearchUsers
  );

  // 3b. ONBOARDING SUGGESTIONS (10 comptes populaires non suivis)
  const handleOnboardingSuggestions = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      const sql = getDb();
      const users = await sql`
        SELECT u.id, u.username, u.tier,
          (COALESCE(u.is_verified, FALSE) OR LOWER(COALESCE(u.tier, '')) IN ('plus', 'pro', 'max')) as is_verified,
          pr.display_name, pr.avatar_url, pr.bio, pr.followers_count
        FROM users u
        LEFT JOIN profiles pr ON pr.user_id = u.id
        WHERE u.id <> ${userId}
          AND u.id NOT IN (SELECT following_id FROM follows WHERE follower_id = ${userId})
          AND LOWER(u.username) NOT IN ('bot', 'mai')
        ORDER BY COALESCE(pr.followers_count, 0) DESC
        LIMIT 10
      `.catch(() => []);
      return c.json({ users });
    } catch {
      return c.json({ error: "Erreur suggestions onboarding." }, 500);
    }
  };

  registerMulti(
    "get",
    [
      "/api/vibe/onboarding/suggestions",
      "/vibe/onboarding/suggestions",
      "/v1/onboarding/suggestions",
      "/onboarding/suggestions",
    ],
    handleOnboardingSuggestions
  );

  // 3c. ONBOARDING COMPLETE
  const handleOnboardingComplete = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      const sql = getDb();
      await sql`ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE`.catch(
        () => {}
      );
      await sql`
        INSERT INTO user_settings (user_id, onboarding_completed)
        VALUES (${userId}, TRUE)
        ON CONFLICT (user_id) DO UPDATE SET onboarding_completed = TRUE, updated_at = NOW()
      `;
      return c.json({ success: true });
    } catch {
      return c.json({ error: "Erreur validation onboarding." }, 500);
    }
  };

  registerMulti(
    "post",
    [
      "/api/vibe/onboarding/complete",
      "/vibe/onboarding/complete",
      "/v1/onboarding/complete",
      "/onboarding/complete",
    ],
    handleOnboardingComplete
  );

  // 4. GET PROFILE
  const handleGetProfile = async (c: any) => {
    try {
      const rawParam = c.req.param("username") || "";
      const username = rawParam.toLowerCase().trim().replace(/^@/, "");
      const sql = getDb();

      let currentUserId: number | null = null;
      const token = extractToken(c.req.raw);
      if (token) {
        try {
          const payload = await verifyToken(token);
          currentUserId = Number(payload.sub || (payload as any).id);
        } catch {}
      }

      const userRows = await sql`
        SELECT u.id, u.username, u.email, u.tier, u.avatar_url,
               COALESCE(u.created_at, NOW()) as created_at,
               (COALESCE(u.is_verified, FALSE) OR LOWER(COALESCE(u.tier, '')) IN ('plus', 'pro', 'max')) as is_verified,
               pr.display_name, pr.bio, pr.banner_url, pr.website, pr.location, pr.interests, pr.followers_count, pr.following_count, pr.posts_count
        FROM users u
        LEFT JOIN profiles pr ON pr.user_id = u.id
        WHERE LOWER(u.username) = ${username}
        LIMIT 1
      `;

      if (userRows.length === 0) {
        return c.json({ error: "Profil introuvable." }, 404);
      }

      const row = userRows[0];
      let isFollowing = false;
      let blockedByMe = false;
      let blockedMe = false;
      let mutedByMe = false;
      // Coche bleue masquée par le propriétaire (colonne ajoutée paresseusement : requête tolérante)
      let hideVerifiedBadge = false;
      try {
        const settingsRows = await sql`
          SELECT hide_verified_badge FROM user_settings WHERE user_id = ${row.id} LIMIT 1
        `;
        hideVerifiedBadge = Boolean(settingsRows[0]?.hide_verified_badge);
      } catch {}
      if (currentUserId && currentUserId !== Number(row.id)) {
        try {
          const followRows = await sql`
            SELECT 1 FROM follows WHERE follower_id = ${currentUserId} AND following_id = ${row.id} LIMIT 1
          `;
          isFollowing = followRows.length > 0;
        } catch {}
        // Statuts sociaux pour l'UI (bannière de blocage, option « Masquer »)
        try {
          const socialRows = await sql`
            SELECT
              EXISTS (SELECT 1 FROM blocked_users WHERE user_id = ${currentUserId} AND blocked_user_id = ${row.id}) AS blocked_by_me,
              EXISTS (SELECT 1 FROM blocked_users WHERE user_id = ${row.id} AND blocked_user_id = ${currentUserId}) AS blocked_me,
              EXISTS (SELECT 1 FROM muted_users WHERE user_id = ${currentUserId} AND muted_user_id = ${row.id}) AS muted_by_me
          `;
          blockedByMe = Boolean(socialRows[0]?.blocked_by_me);
          blockedMe = Boolean(socialRows[0]?.blocked_me);
          mutedByMe = Boolean(socialRows[0]?.muted_by_me);
        } catch {}
      }

      let posts: any[] = [];
      try {
        // Publication paresseuse des vibes planifiées arrivées à échéance
        await publishDuePosts();
        await ensureCircleTable().catch(() => {});
        await ensureProfilePinnedPostsTable().catch(() => {});
        posts = await sql`
          SELECT p.*, pr.display_name, pr.avatar_url, u.username, u.tier,
                 (COALESCE(u.is_verified, FALSE) OR LOWER(COALESCE(u.tier, '')) IN ('plus', 'pro', 'max')) as is_verified,
                 ${currentUserId ? sql`(SELECT COUNT(*) FROM post_interactions WHERE post_id = p.id AND user_id = ${currentUserId} AND interaction_type = 'like') > 0` : sql`FALSE`} as has_liked,
                 ${currentUserId ? sql`(SELECT COUNT(*) FROM post_interactions WHERE post_id = p.id AND user_id = ${currentUserId} AND interaction_type = 'repost') > 0` : sql`FALSE`} as has_reposted,
                 ${currentUserId ? sql`(SELECT COUNT(*) FROM bookmarks WHERE post_id = p.id AND user_id = ${currentUserId}) > 0` : sql`FALSE`} as has_bookmarked
          FROM posts p
          JOIN users u ON u.id = p.author_id
          LEFT JOIN profiles pr ON pr.user_id = u.id
          WHERE p.author_id = ${row.id}
            AND (COALESCE(p.status, 'published') = 'published' OR ${currentUserId}::bigint = p.author_id)
            AND (
              p.visibility = 'public'
              OR ${
                currentUserId
                  ? sql`p.author_id = ${currentUserId}
                OR (p.visibility = 'followers' AND EXISTS (SELECT 1 FROM follows f3 WHERE f3.follower_id = ${currentUserId} AND f3.following_id = p.author_id))
                OR (p.visibility = 'circle' AND EXISTS (SELECT 1 FROM circle_members cm3 WHERE cm3.user_id = p.author_id AND cm3.member_user_id = ${currentUserId}))`
                  : sql`FALSE`
              }
            )
          ORDER BY p.is_pinned DESC, p.published_at DESC
          LIMIT 40
        `;

        // Posts d'autres comptes mis en avant sur ce profil (max 2 au total,
        // limite contrôlée côté serveur au moment de l'épinglage)
        try {
          const foreignPinned = await sql`
            SELECT p.*, pr.display_name, pr.avatar_url, u.username, u.tier,
                   (COALESCE(u.is_verified, FALSE) OR LOWER(COALESCE(u.tier, '')) IN ('plus', 'pro', 'max')) as is_verified,
                   TRUE AS pinned_by_profile,
                   pu.username AS pinned_by_username,
                   ${currentUserId ? sql`(SELECT COUNT(*) FROM post_interactions WHERE post_id = p.id AND user_id = ${currentUserId} AND interaction_type = 'like') > 0` : sql`FALSE`} as has_liked,
                   ${currentUserId ? sql`(SELECT COUNT(*) FROM post_interactions WHERE post_id = p.id AND user_id = ${currentUserId} AND interaction_type = 'repost') > 0` : sql`FALSE`} as has_reposted,
                   ${currentUserId ? sql`(SELECT COUNT(*) FROM bookmarks WHERE post_id = p.id AND user_id = ${currentUserId}) > 0` : sql`FALSE`} as has_bookmarked
            FROM profile_pinned_posts ppp
            JOIN posts p ON p.id = ppp.post_id
            JOIN users u ON u.id = p.author_id
            LEFT JOIN profiles pr ON pr.user_id = u.id
            LEFT JOIN users pu ON pu.id = ppp.user_id
            WHERE ppp.user_id = ${row.id}
              AND p.author_id <> ${row.id}
              AND p.visibility = 'public'
              AND COALESCE(p.status, 'published') = 'published'
            ORDER BY ppp.created_at DESC
            LIMIT 2
          `;
          if (foreignPinned.length > 0) {
            const ownPinned = posts.filter((p) => p.is_pinned);
            const rest = posts.filter((p) => !p.is_pinned);
            posts = [...ownPinned, ...foreignPinned, ...rest].slice(0, 40);
          }
        } catch {}

        // Charger tous les médias en une seule requête (évite le N+1)
        if (posts.length > 0) {
          const postIds = posts.map((p) => p.id);
          const allMedia = await sql`
            SELECT post_id, url, media_type, alt_text
            FROM media_assets
            WHERE post_id = ANY(${postIds}::uuid[])
          `;
          const mediaByPost = new Map<string, any[]>();
          for (const m of allMedia) {
            const key = String(m.post_id);
            if (!mediaByPost.has(key)) mediaByPost.set(key, []);
            mediaByPost.get(key)!.push({
              alt_text: m.alt_text,
              media_type: m.media_type,
              url: m.url,
            });
          }
          for (const p of posts) {
            p.media_assets = mediaByPost.get(String(p.id)) || [];
          }
        }
        await attachQuotedPosts(posts);
        await attachBookRefs(posts, currentUserId).catch(() => {});
        await attachPollsAndCollabs(posts, currentUserId).catch(() => {});
      } catch (postErr: any) {
        console.error("[Get Profile] Erreur chargement posts:", postErr);
        posts = [];
      }

      return c.json({
        posts,
        profile: {
          avatarUrl: row.avatar_url,
          bannerUrl: row.banner_url,
          bio: row.bio || "",
          blocked_by_me: blockedByMe,
          blocked_me: blockedMe,
          displayName: row.display_name || row.username,
          followersCount: row.followers_count || 0,
          followingCount: row.following_count || 0,
          hide_verified_badge: hideVerifiedBadge,
          id: row.id,
          interests: row.interests || [],
          is_verified: Boolean(row.is_verified),
          isFollowing,
          location: row.location || "",
          muted_by_me: mutedByMe,
          postsCount: row.posts_count || posts.length,
          tier: row.tier || "Free",
          username: row.username,
          website: row.website || "",
        },
      });
    } catch {
      return c.json({ error: "Erreur profil." }, 500);
    }
  };

  registerMulti(
    "get",
    [
      "/api/vibe/profiles/:username",
      "/vibe/profiles/:username",
      "/v1/profiles/:username",
      "/profiles/:username",
      "/profile/:username",
    ],
    handleGetProfile
  );

  // 4b. GET USER LIKED POSTS
  const handleGetUserLikedPosts = async (c: any) => {
    try {
      const rawParam = c.req.param("username") || "";
      const username = rawParam.toLowerCase().trim().replace(/^@/, "");
      const sql = getDb();

      let currentUserId: number | null = null;
      const token = extractToken(c.req.raw);
      if (token) {
        try {
          const payload = await verifyToken(token);
          currentUserId = Number(payload.sub || (payload as any).id);
        } catch {}
      }

      const userRows = await sql`
        SELECT id FROM users WHERE LOWER(username) = ${username} LIMIT 1
      `;
      if (userRows.length === 0) {
        return c.json({ error: "Utilisateur introuvable." }, 404);
      }
      const targetUserId = userRows[0].id;

      const posts = await sql`
        SELECT p.*, pr.display_name, pr.avatar_url, u.username, u.tier,
               (COALESCE(u.is_verified, FALSE) OR LOWER(COALESCE(u.tier, '')) IN ('plus', 'pro', 'max')) as is_verified,
               ${currentUserId ? sql`(SELECT COUNT(*) FROM post_interactions WHERE post_id = p.id AND user_id = ${currentUserId} AND interaction_type = 'like') > 0` : sql`FALSE`} as has_liked,
               ${currentUserId ? sql`(SELECT COUNT(*) FROM post_interactions WHERE post_id = p.id AND user_id = ${currentUserId} AND interaction_type = 'repost') > 0` : sql`FALSE`} as has_reposted,
               ${currentUserId ? sql`(SELECT COUNT(*) FROM bookmarks WHERE post_id = p.id AND user_id = ${currentUserId}) > 0` : sql`FALSE`} as has_bookmarked
        FROM post_interactions pi
        JOIN posts p ON p.id = pi.post_id
        JOIN users u ON u.id = p.author_id
        LEFT JOIN profiles pr ON pr.user_id = u.id
        WHERE pi.user_id = ${targetUserId} AND pi.interaction_type = 'like' AND p.visibility = 'public'
        ORDER BY pi.created_at DESC
        LIMIT 40
      `;

      if (posts.length > 0) {
        const postIds = posts.map((p) => p.id);
        const allMedia = await sql`
          SELECT post_id, url, media_type, alt_text
          FROM media_assets
          WHERE post_id = ANY(${postIds}::uuid[])
        `;
        const mediaByPost = new Map<string, any[]>();
        for (const m of allMedia) {
          const key = String(m.post_id);
          if (!mediaByPost.has(key)) mediaByPost.set(key, []);
          mediaByPost.get(key)!.push({
            alt_text: m.alt_text,
            media_type: m.media_type,
            url: m.url,
          });
        }
        for (const p of posts) {
          p.media_assets = mediaByPost.get(String(p.id)) || [];
        }
      }
      await attachQuotedPosts(posts);
      await attachBookRefs(posts, currentUserId).catch(() => {});
      await attachPollsAndCollabs(posts, currentUserId).catch(() => {});

      return c.json({ posts });
    } catch (err: any) {
      console.error("[Get User Liked Posts] Erreur:", err);
      return c.json({ error: "Erreur récupération des likes." }, 500);
    }
  };

  registerMulti(
    "get",
    [
      "/api/vibe/profiles/:username/likes",
      "/vibe/profiles/:username/likes",
      "/v1/profiles/:username/likes",
      "/profiles/:username/likes",
    ],
    handleGetUserLikedPosts
  );

  // 5. UPDATE PROFILE
  const handleUpdateProfile = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);

      const body = await c.req.json();
      const {
        username,
        displayName,
        bio,
        interests,
        avatarUrl,
        bannerUrl,
        website,
        location,
      } = body;
      const sql = getDb();

      // Vérifier et mettre à jour le nom d'utilisateur avec vérification stricte de non-duplication
      if (username !== undefined && username !== null) {
        const rawUser = String(username).trim();
        if (rawUser) {
          const cleanUser = rawUser.toLowerCase().replace(/^@/, "").trim();
          if (!/^[a-z0-9_]{2,30}$/.test(cleanUser)) {
            return c.json(
              {
                error:
                  "Le nom d'utilisateur doit comporter entre 2 et 30 caractères (lettres minuscules, chiffres, _).",
              },
              400
            );
          }
          const taken = await sql`
            SELECT id FROM users
            WHERE LOWER(username) = ${cleanUser}
              AND id::text != ${String(userId)}
            LIMIT 1
          `;
          if (taken.length > 0) {
            return c.json(
              {
                error:
                  "Ce nom d'utilisateur est déjà pris par un autre compte.",
              },
              400
            );
          }
          await sql`UPDATE users SET username = ${cleanUser} WHERE id::text = ${String(userId)}`;
        }
      }

      if (avatarUrl) {
        await sql`UPDATE users SET avatar_url = ${avatarUrl} WHERE id = ${userId}`;
      }

      // Écriture réelle des champs fournis (les champs vides sont bien enregistrés
      // comme vides au lieu d'être ignorés par l'ancien COALESCE).
      const nextDisplayName =
        displayName === undefined ? undefined : displayName || null;
      const rawBio = bio === undefined ? undefined : String(bio);
      if (rawBio !== undefined && rawBio.length > MAX_BIO_LENGTH) {
        return c.json(
          {
            error: `La biographie est limitée à ${MAX_BIO_LENGTH} caractères.`,
          },
          400
        );
      }
      const nextBio = rawBio === undefined ? undefined : rawBio || null;

      // Centres d'intérêt : tags normalisés (trim, sans #, dédupliqués, max 5×30).
      // Un format invalide renvoie 400 au lieu d'écraser silencieusement la liste.
      let nextInterests: string[] | undefined;
      if (interests !== undefined) {
        if (!Array.isArray(interests)) {
          return c.json(
            { error: "Format des centres d'intérêt invalide." },
            400
          );
        }
        const cleaned: string[] = [];
        const seen = new Set<string>();
        for (const raw of interests) {
          if (typeof raw !== "string") continue;
          const tag = raw.trim().replace(/^#+/, "").trim();
          if (!tag) continue;
          if (tag.length > MAX_INTEREST_LENGTH) {
            return c.json(
              {
                error: `Chaque centre d'intérêt est limité à ${MAX_INTEREST_LENGTH} caractères.`,
              },
              400
            );
          }
          const key = tag.toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          cleaned.push(tag);
        }
        if (cleaned.length > MAX_INTERESTS) {
          return c.json(
            { error: `Maximum ${MAX_INTERESTS} centres d'intérêt.` },
            400
          );
        }
        nextInterests = cleaned;
      }

      const nextAvatarUrl =
        avatarUrl === undefined ? undefined : avatarUrl || null;
      const nextBannerUrl =
        bannerUrl === undefined ? undefined : bannerUrl || null;

      // Site web : « https:// » ajouté si absent, validé par URL, vide → null
      let nextWebsite: string | null | undefined;
      if (website !== undefined) {
        const rawWebsite = String(website).trim();
        if (rawWebsite) {
          const withScheme = /^https?:\/\//i.test(rawWebsite)
            ? rawWebsite
            : `https://${rawWebsite}`;
          let valid = false;
          try {
            const parsed = new URL(withScheme);
            valid = Boolean(parsed.hostname?.includes("."));
          } catch {}
          if (!valid || withScheme.length > MAX_WEBSITE_LENGTH) {
            return c.json(
              { error: "Lien de site invalide (ex. https://exemple.com)." },
              400
            );
          }
          nextWebsite = withScheme;
        } else {
          nextWebsite = null;
        }
      }

      // Localisation : texte court, vide → null
      let nextLocation: string | null | undefined;
      if (location !== undefined) {
        const rawLocation = String(location).trim();
        if (rawLocation.length > MAX_LOCATION_LENGTH) {
          return c.json(
            {
              error: `La localisation est limitée à ${MAX_LOCATION_LENGTH} caractères.`,
            },
            400
          );
        }
        nextLocation = rawLocation || null;
      }

      await sql`
        INSERT INTO profiles (user_id, display_name, bio, interests, avatar_url, banner_url, website, location)
        VALUES (
          ${userId},
          ${nextDisplayName === undefined ? null : nextDisplayName},
          ${nextBio === undefined ? null : nextBio},
          ${nextInterests === undefined ? [] : (nextInterests as string[])},
          ${nextAvatarUrl === undefined ? null : nextAvatarUrl},
          ${nextBannerUrl === undefined ? null : nextBannerUrl},
          ${nextWebsite === undefined ? null : nextWebsite},
          ${nextLocation === undefined ? null : nextLocation}
        )
        ON CONFLICT (user_id)
        DO UPDATE SET
          display_name = ${nextDisplayName === undefined ? sql`profiles.display_name` : nextDisplayName},
          bio = ${nextBio === undefined ? sql`profiles.bio` : nextBio},
          interests = ${nextInterests === undefined ? sql`profiles.interests` : (nextInterests as string[])},
          avatar_url = ${nextAvatarUrl === undefined ? sql`profiles.avatar_url` : nextAvatarUrl},
          banner_url = ${nextBannerUrl === undefined ? sql`profiles.banner_url` : nextBannerUrl},
          website = ${nextWebsite === undefined ? sql`profiles.website` : nextWebsite},
          location = ${nextLocation === undefined ? sql`profiles.location` : nextLocation},
          updated_at = NOW()
      `;

      // Renvoyer le profil à jour (avec le username potentiellement modifié)
      const updated = await sql`
        SELECT u.username, u.avatar_url,
               (COALESCE(u.is_verified, FALSE) OR LOWER(COALESCE(u.tier, '')) IN ('plus', 'pro', 'max')) as is_verified,
               pr.display_name, pr.bio, pr.banner_url, pr.website, pr.location, pr.interests, pr.followers_count, pr.following_count, pr.posts_count
        FROM users u
        LEFT JOIN profiles pr ON pr.user_id = u.id
        WHERE u.id::text = ${String(userId)}
        LIMIT 1
      `;
      const r = updated[0] || {};

      return c.json({
        message: "Profil mis à jour.",
        profile: {
          avatarUrl: r.avatar_url,
          bannerUrl: r.banner_url,
          bio: r.bio || "",
          displayName: r.display_name || r.username,
          followersCount: r.followers_count || 0,
          followingCount: r.following_count || 0,
          interests: r.interests || [],
          is_verified: Boolean(r.is_verified),
          location: r.location || "",
          postsCount: r.posts_count || 0,
          username: r.username,
          website: r.website || "",
        },
        success: true,
      });
    } catch (err: any) {
      console.error("[Update Profile Error]:", err);
      return c.json({ error: "Erreur mise à jour profil." }, 500);
    }
  };

  registerMulti(
    "post",
    ["/api/vibe/profile/update", "/vibe/profile/update", "/v1/profile/update"],
    handleUpdateProfile
  );

  // 6. UPDATE AVATAR
  const handleUpdateAvatar = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      const sql = getDb();

      let avatarUrl = "";

      try {
        const body = await c.req.parseBody();
        const file = body.avatar || body.file;
        if (file instanceof File && file.size > 0) {
          const cleanFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const filename = `avatars/${userId}-${Date.now()}-${cleanFilename}`;
          const primaryNode = selectStorageNode(`avatar-${userId}`);
          const arrayBuffer = await file.arrayBuffer();
          const uploadResult = await uploadWithFallback(
            primaryNode,
            filename,
            arrayBuffer,
            { acl: "public-read", contentType: file.type || "image/jpeg" }
          );
          if (uploadResult.success) {
            avatarUrl = uploadResult.publicUrl;
          }
        }
      } catch {}

      if (!avatarUrl) {
        try {
          const json = await c.req.json();
          avatarUrl = json.avatarUrl || json.avatar_url || "";
        } catch {}
      }

      if (!avatarUrl) {
        return c.json({ error: "Fichier ou URL d'avatar requis." }, 400);
      }

      await sql`UPDATE users SET avatar_url = ${avatarUrl} WHERE id = ${userId}`;
      await sql`
        INSERT INTO profiles (user_id, avatar_url)
        VALUES (${userId}, ${avatarUrl})
        ON CONFLICT (user_id)
        DO UPDATE SET avatar_url = ${avatarUrl}, updated_at = NOW()
      `;

      return c.json({
        avatarUrl,
        message: "Avatar synchronisé avec succès.",
        success: true,
      });
    } catch (err: any) {
      console.error("[Update Avatar Error]:", err);
      return c.json(
        { error: "Erreur lors de la mise à jour de l'avatar." },
        500
      );
    }
  };

  // NB : /upload-avatar et /v1/upload-avatar sont gérés par registerStorageRoutes (storage.ts),
  // seule source de vérité pour l'upload d'avatar. Ici on ne garde que /profile/avatar
  // pour la mise à jour via URL JSON (multipart accepté aussi pour compat).
  registerMulti(
    "post",
    ["/api/vibe/profile/avatar", "/vibe/profile/avatar", "/v1/profile/avatar"],
    handleUpdateAvatar
  );

  // 7. FOLLOW / UNFOLLOW
  const handleFollow = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const currentUserId = Number(payload.sub || (payload as any).id);
      const rawParam = c.req.param("username") || "";
      const targetUsername = rawParam.toLowerCase().trim().replace(/^@/, "");

      const sql = getDb();
      const targetUser =
        await sql`SELECT id FROM users WHERE LOWER(username) = ${targetUsername} LIMIT 1`;
      if (targetUser.length === 0)
        return c.json({ error: "Utilisateur introuvable." }, 404);
      const targetId = Number(targetUser[0].id);

      if (targetId === currentUserId)
        return c.json({ error: "Impossible de se suivre soi-même." }, 400);

      const existing = await sql`
        SELECT 1 FROM follows WHERE follower_id = ${currentUserId} AND following_id = ${targetId}
      `;

      if (existing.length > 0) {
        await sql`DELETE FROM follows WHERE follower_id = ${currentUserId} AND following_id = ${targetId}`;
        await sql`UPDATE profiles SET following_count = GREATEST(0, following_count - 1) WHERE user_id = ${currentUserId}`;
        await sql`UPDATE profiles SET followers_count = GREATEST(0, followers_count - 1) WHERE user_id = ${targetId}`;
        return c.json({ following: false, success: true });
      }
      // Blocage (dans un sens ou l'autre) : interdit de s'abonner
      try {
        const blockRows = await sql`
            SELECT 1 FROM blocked_users
            WHERE (user_id = ${currentUserId} AND blocked_user_id = ${targetId})
               OR (user_id = ${targetId} AND blocked_user_id = ${currentUserId})
            LIMIT 1
          `;
        if (blockRows.length > 0) {
          return c.json(
            {
              blocked: true,
              error: "Impossible de suivre ce compte : un blocage est actif.",
            },
            403
          );
        }
      } catch {}

      await sql`INSERT INTO follows (follower_id, following_id) VALUES (${currentUserId}, ${targetId})`;
      await sql`UPDATE profiles SET following_count = following_count + 1 WHERE user_id = ${currentUserId}`;
      await sql`UPDATE profiles SET followers_count = followers_count + 1 WHERE user_id = ${targetId}`;

      try {
        await sql`
            INSERT INTO notifications (recipient_id, actor_id, type, message)
            VALUES (${targetId}, ${currentUserId}, 'follow', 'a commencé à vous suivre')
          `;
      } catch {}

      return c.json({ following: true, success: true });
    } catch {
      return c.json({ error: "Erreur follow." }, 500);
    }
  };

  registerMulti(
    "post",
    [
      "/api/vibe/profiles/:username/follow",
      "/vibe/profiles/:username/follow",
      "/v1/profiles/:username/follow",
    ],
    handleFollow
  );

  // 7b. POST NOTIFICATIONS SUBSCRIPTION — être notifié des posts d'un compte
  const ensurePostSubscriptionsTable = async (sql: any) => {
    await sql`
      CREATE TABLE IF NOT EXISTS post_subscriptions (
        subscriber_id INTEGER NOT NULL,
        author_id INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (subscriber_id, author_id)
      )
    `;
  };

  // Statut d'abonnement aux notifications de posts d'un compte
  const handleGetSubscription = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const currentUserId = Number(payload.sub || (payload as any).id);
      const rawParam = c.req.param("username") || "";
      const targetUsername = rawParam.toLowerCase().trim().replace(/^@/, "");

      const sql = getDb();
      await ensurePostSubscriptionsTable(sql);
      const targetUser =
        await sql`SELECT id FROM users WHERE LOWER(username) = ${targetUsername} LIMIT 1`;
      if (targetUser.length === 0)
        return c.json({ error: "Utilisateur introuvable." }, 404);

      const rows = await sql`
        SELECT 1 FROM post_subscriptions
        WHERE subscriber_id = ${currentUserId} AND author_id = ${Number(targetUser[0].id)}
      `;
      return c.json({ subscribed: rows.length > 0, success: true });
    } catch (err: any) {
      console.error("[vibe-users] Get subscription error:", err);
      return c.json({ error: "Erreur lecture abonnement." }, 500);
    }
  };
  registerMulti(
    "get",
    [
      "/api/vibe/profiles/:username/subscribe",
      "/vibe/profiles/:username/subscribe",
      "/v1/profiles/:username/subscribe",
    ],
    handleGetSubscription
  );

  // Toggle : s'abonner / se désabonner aux notifications de posts
  const handleToggleSubscription = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const currentUserId = Number(payload.sub || (payload as any).id);
      const rawParam = c.req.param("username") || "";
      const targetUsername = rawParam.toLowerCase().trim().replace(/^@/, "");

      const sql = getDb();
      await ensurePostSubscriptionsTable(sql);
      const targetUser =
        await sql`SELECT id FROM users WHERE LOWER(username) = ${targetUsername} LIMIT 1`;
      if (targetUser.length === 0)
        return c.json({ error: "Utilisateur introuvable." }, 404);
      const targetId = Number(targetUser[0].id);

      if (targetId === currentUserId) {
        return c.json(
          { error: "Impossible de s'abonner à ses propres posts." },
          400
        );
      }

      const existing = await sql`
        SELECT 1 FROM post_subscriptions WHERE subscriber_id = ${currentUserId} AND author_id = ${targetId}
      `;

      if (existing.length > 0) {
        await sql`DELETE FROM post_subscriptions WHERE subscriber_id = ${currentUserId} AND author_id = ${targetId}`;
        return c.json({ subscribed: false, success: true });
      }
      await sql`INSERT INTO post_subscriptions (subscriber_id, author_id) VALUES (${currentUserId}, ${targetId}) ON CONFLICT DO NOTHING`;
      return c.json({ subscribed: true, success: true });
    } catch (err: any) {
      console.error("[vibe-users] Toggle subscription error:", err);
      return c.json({ error: "Erreur abonnement." }, 500);
    }
  };
  registerMulti(
    "post",
    [
      "/api/vibe/profiles/:username/subscribe",
      "/vibe/profiles/:username/subscribe",
      "/v1/profiles/:username/subscribe",
    ],
    handleToggleSubscription
  );

  // 8. MUTE / UNMUTE — masquage silencieux (l'autre compte n'est pas informé)
  // Table créée paresseusement ici + en migration 009 (idempotent).
  let socialTablesReady = false;
  const ensureSocialTables = async () => {
    if (socialTablesReady) return;
    try {
      const sql = getDb();
      await sql`
        CREATE TABLE IF NOT EXISTS muted_users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id BIGINT NOT NULL,
          muted_user_id BIGINT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE (user_id, muted_user_id)
        )
      `;
      socialTablesReady = true;
    } catch (err) {
      console.warn(
        "[vibe-users] ensureSocialTables skipped:",
        (err as any)?.message
      );
    }
  };

  const handleMuteUser = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const currentUserId = Number(payload.sub || (payload as any).id);

      const rawParam = c.req.param("username") || "";
      const targetUsername = rawParam.toLowerCase().trim().replace(/^@/, "");
      const body = await c.req.json().catch(() => ({}) as any);
      const muted = body.muted !== false; // défaut : masquer

      await ensureSocialTables();
      const sql = getDb();
      const targetUser =
        await sql`SELECT id FROM users WHERE LOWER(username) = ${targetUsername} LIMIT 1`;
      if (targetUser.length === 0)
        return c.json({ error: "Utilisateur introuvable." }, 404);
      const targetId = Number(targetUser[0].id);
      if (targetId === currentUserId) {
        return c.json({ error: "Impossible de se masquer soi-même." }, 400);
      }

      if (muted) {
        await sql`
          INSERT INTO muted_users (user_id, muted_user_id)
          VALUES (${currentUserId}, ${targetId})
          ON CONFLICT (user_id, muted_user_id) DO NOTHING
        `;
      } else {
        await sql`DELETE FROM muted_users WHERE user_id = ${currentUserId} AND muted_user_id = ${targetId}`;
      }
      return c.json({ muted, success: true });
    } catch (err: any) {
      console.error("[Mute User Error]:", err);
      return c.json({ error: "Erreur lors du masquage du compte." }, 500);
    }
  };

  registerMulti(
    "post",
    [
      "/api/vibe/users/:username/mute",
      "/vibe/users/:username/mute",
      "/v1/users/:username/mute",
    ],
    handleMuteUser
  );

  const handleListMuted = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const currentUserId = Number(payload.sub || (payload as any).id);

      await ensureSocialTables();
      const sql = getDb();
      const rows = await sql`
        SELECT m.id, m.muted_user_id, u.username AS muted_username,
               COALESCE(pr.display_name, u.username) AS muted_display_name,
               COALESCE(pr.avatar_url, u.avatar_url) AS muted_avatar_url,
               m.created_at
        FROM muted_users m
        JOIN users u ON u.id = m.muted_user_id
        LEFT JOIN profiles pr ON pr.user_id = u.id
        WHERE m.user_id = ${currentUserId}
        ORDER BY m.created_at DESC
      `;
      return c.json({ muted: rows });
    } catch (err: any) {
      console.error("[List Muted Error]:", err);
      return c.json({ muted: [] });
    }
  };

  registerMulti(
    "get",
    ["/api/vibe/users/muted", "/vibe/users/muted", "/v1/users/muted"],
    handleListMuted
  );

  // 9. VISITES PROFIL — tracking + série (isSelf uniquement pour la lecture)
  // Table créée paresseusement ici + migration 017 (idempotent).
  let profileViewsReady = false;
  const ensureProfileViewsTable = async () => {
    if (profileViewsReady) return;
    try {
      const sql = getDb();
      await sql`
        CREATE TABLE IF NOT EXISTS profile_views (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          profile_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          viewer_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
          source TEXT DEFAULT 'profile',
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_profile_views_profile ON profile_views(profile_user_id, created_at DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_profile_views_viewer ON profile_views(viewer_id, created_at DESC)`;
      profileViewsReady = true;
    } catch (err) {
      console.warn(
        "[vibe-users] ensureProfileViewsTable skipped:",
        (err as any)?.message
      );
    }
  };

  const handleTrackProfileView = async (c: any) => {
    try {
      const rawParam = c.req.param("username") || "";
      const targetUsername = rawParam.toLowerCase().trim().replace(/^@/, "");
      if (!targetUsername)
        return c.json({ error: "Utilisateur introuvable." }, 404);
      await ensureProfileViewsTable();
      const sql = getDb();
      const targetUser =
        await sql`SELECT id FROM users WHERE LOWER(username) = ${targetUsername} LIMIT 1`;
      if (targetUser.length === 0)
        return c.json({ error: "Utilisateur introuvable." }, 404);
      const targetId = Number(targetUser[0].id);
      let viewerId: number | null = null;
      try {
        const token = extractToken(c.req.raw);
        if (token) {
          const payload = await verifyToken(token);
          viewerId = Number(payload.sub || (payload as any).id) || null;
        }
      } catch {}
      // Pas d'auto-comptage
      if (viewerId && viewerId === targetId)
        return c.json({ counted: false, success: true });
      if (viewerId && !rateLimit(`pv:${viewerId}:${targetId}`, 1, 60_000)) {
        return c.json({ counted: false, success: true });
      }
      const body = await c.req.json().catch(() => ({}) as any);
      const source = String(body?.source || "profile")
        .toLowerCase()
        .slice(0, 20);
      // Anti-spam : 1 visite / viewer / 24h (anonymes toujours comptés, dédoublonnés côté client)
      if (viewerId) {
        const recent =
          await sql`SELECT 1 FROM profile_views WHERE profile_user_id = ${targetId} AND viewer_id = ${viewerId} AND created_at >= NOW() - INTERVAL '24 hours' LIMIT 1`;
        if (recent.length > 0) return c.json({ counted: false, success: true });
      }
      await sql`INSERT INTO profile_views (profile_user_id, viewer_id, source) VALUES (${targetId}, ${viewerId}, ${source})`;
      return c.json({ counted: true, success: true });
    } catch (err: any) {
      console.warn("[Profile View Error]:", err);
      return c.json({ success: false });
    }
  };

  registerMulti(
    "post",
    [
      "/api/vibe/profiles/:username/view",
      "/vibe/profiles/:username/view",
      "/v1/profiles/:username/view",
    ],
    handleTrackProfileView
  );

  const handleProfileViewsStats = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      const periodParam = String(c.req.query("period") || "30d").toLowerCase();
      const periodDays =
        periodParam === "7d"
          ? 7
          : periodParam === "90d"
            ? 90
            : periodParam === "12m"
              ? 365
              : 30;
      const sinceIso = new Date(
        Date.now() - periodDays * 86_400_000
      ).toISOString();
      await ensureProfileViewsTable();
      const sql = getDb();
      const total =
        await sql`SELECT COUNT(*) AS n FROM profile_views WHERE profile_user_id = ${userId} AND created_at >= ${sinceIso}::timestamptz`;
      const rows =
        await sql`SELECT created_at::date AS day, COUNT(*) AS n FROM profile_views WHERE profile_user_id = ${userId} AND created_at >= ${sinceIso}::timestamptz GROUP BY created_at::date ORDER BY day ASC`;
      const byDay = new Map<string, number>();
      for (const r of rows as any[])
        byDay.set(String(r.day).slice(0, 10), Number(r.n || 0));
      const series: Array<{ day: string; views: number }> = [];
      for (let i = periodDays - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86_400_000)
          .toISOString()
          .slice(0, 10);
        series.push({ day: d, views: byDay.get(d) || 0 });
      }
      return c.json({
        period: periodParam,
        series,
        total: Number((total[0] as any)?.n || 0),
      });
    } catch {
      return c.json({ error: "Erreur visites profil." }, 500);
    }
  };

  registerMulti(
    "get",
    [
      "/api/vibe/users/me/profile-views",
      "/vibe/users/me/profile-views",
      "/v1/users/me/profile-views",
    ],
    handleProfileViewsStats
  );
}
