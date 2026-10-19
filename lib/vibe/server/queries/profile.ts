/**
 * ============================================================================
 * VIBE — LECTEUR PROFIL (lib/vibe/server/queries/profile.ts)
 * ============================================================================
 *
 * Réplique serveur de `GET /v1/profiles/:username` (`vibe-users.ts:437-643`) :
 * carte d'identité (`users ⨝ profiles`), opt-out du badge, statuts sociaux du
 * visiteur (abonnement, blocages, masquages), puis les 40 dernières publications
 * avec leurs épingles étrangères, médias, citations, livres et sondages.
 *
 * Deux différences avec le backend, toutes deux voulues :
 * 1. RIEN n'est écrit : pas de `publishDuePosts()` dans cette lecture (la
 *    publication des programmés est déportée au cron `app/api/cron/vibe`). Un
 *    post programmé peut donc apparaître une fois de plus sur la base de
 *    l'API mobile — jamais l'inverse.
 * 2. Pas de `ensure*` DDL : si une table de visibilité (`circle_members`)
 *    manque encore, le lecteur RETOURNE null — la page refait alors son appel
 *    API, qui déclenche au passage la création de la table côté backend.
 *
 * Confidentialité : l'identité vient du cookie (`resolveVibeIdentity`), jamais
 * d'un paramètre. Les clauses de visibilité (`public`/`followers`/`circle`)
 * sont reproduites à l'identique, visiteur anonymisé compris.
 */
import "server-only";
import { vibeSql } from "../db";
import type { VibeIdentity } from "../identity";
import { columnExists, tableExists } from "../schema";
import { isoDeep } from "../shape";
import {
  attachBookRefs,
  attachPollsAndCollabs,
  attachQuotedPosts,
  fetchPostMedia,
} from "./post-hydrate";

export type VibeProfilePayload = {
  posts: any[];
  profile: Record<string, unknown>;
};

export async function readProfile(
  username: string,
  identity: VibeIdentity | null
): Promise<VibeProfilePayload | null> {
  const sql = vibeSql();
  if (!sql) {
    return null;
  }
  const clean = username.toLowerCase().trim().replace(/^@/, "");
  if (!clean) {
    return null;
  }

  const userRows = await sql`
    SELECT u.id, u.username, u.email, u.tier, u.avatar_url,
           COALESCE(u.created_at, NOW()) as created_at,
           (COALESCE(u.is_verified, FALSE) OR LOWER(COALESCE(u.tier, '')) IN ('plus', 'pro', 'max')) as is_verified,
           pr.display_name, pr.bio, pr.banner_url, pr.website, pr.location, pr.interests, pr.followers_count, pr.following_count, pr.posts_count
    FROM users u
    LEFT JOIN profiles pr ON pr.user_id = u.id
    WHERE LOWER(u.username) = ${clean}
    LIMIT 1
  `;
  const row = userRows[0];
  if (!row) {
    return null;
  }
  const ownerId = Number(row.id);
  // Le visiteur n'est pas le profil demandé : ses flags sociaux ne se
  // calculent que pour un tiers (le handler fait de même).
  const viewerId =
    identity && /^\d+$/.test(String(identity.userId))
      ? Number(identity.userId)
      : null;

  let isFollowing = false;
  let blockedByMe = false;
  let blockedMe = false;
  let mutedByMe = false;
  let hideVerifiedBadge = false;

  if (await columnExists("user_settings", "hide_verified_badge")) {
    const settingsRows = await sql`
      SELECT hide_verified_badge FROM user_settings WHERE user_id = ${ownerId} LIMIT 1
    `.catch(() => []);
    hideVerifiedBadge = Boolean(settingsRows[0]?.hide_verified_badge);
  }

  if (viewerId && viewerId !== ownerId) {
    const followRows = await sql`
      SELECT 1 FROM follows WHERE follower_id = ${viewerId} AND following_id = ${ownerId} LIMIT 1
    `.catch(() => []);
    isFollowing = followRows.length > 0;
    const socialRows = await sql`
      SELECT
        EXISTS (SELECT 1 FROM blocked_users WHERE user_id = ${viewerId} AND blocked_user_id = ${ownerId}) AS blocked_by_me,
        EXISTS (SELECT 1 FROM blocked_users WHERE user_id = ${ownerId} AND blocked_user_id = ${viewerId}) AS blocked_me,
        EXISTS (SELECT 1 FROM muted_users WHERE user_id = ${viewerId} AND muted_user_id = ${ownerId}) AS muted_by_me
    `.catch(() => []);
    blockedByMe = Boolean(socialRows[0]?.blocked_by_me);
    blockedMe = Boolean(socialRows[0]?.blocked_me);
    mutedByMe = Boolean(socialRows[0]?.muted_by_me);
  }

  let posts: any[];
  try {
    if (viewerId) {
      posts = await sql`
        SELECT p.*, pr.display_name, pr.avatar_url, u.username, u.tier,
               (COALESCE(u.is_verified, FALSE) OR LOWER(COALESCE(u.tier, '')) IN ('plus', 'pro', 'max')) as is_verified,
               (SELECT COUNT(*) FROM post_interactions WHERE post_id = p.id AND user_id = ${viewerId} AND interaction_type = 'like') > 0 as has_liked,
               (SELECT COUNT(*) FROM post_interactions WHERE post_id = p.id AND user_id = ${viewerId} AND interaction_type = 'repost') > 0 as has_reposted,
               (SELECT COUNT(*) FROM bookmarks WHERE post_id = p.id AND user_id = ${viewerId}) > 0 as has_bookmarked
        FROM posts p
        JOIN users u ON u.id = p.author_id
        LEFT JOIN profiles pr ON pr.user_id = u.id
        WHERE p.author_id = ${ownerId}
          AND (COALESCE(p.status, 'published') = 'published' OR ${viewerId} = p.author_id)
          AND (
            p.visibility = 'public'
            OR p.author_id = ${viewerId}
            OR (p.visibility = 'followers' AND EXISTS (SELECT 1 FROM follows f3 WHERE f3.follower_id = ${viewerId} AND f3.following_id = p.author_id))
            OR (p.visibility = 'circle' AND EXISTS (SELECT 1 FROM circle_members cm3 WHERE cm3.user_id = p.author_id AND cm3.member_user_id = ${viewerId}))
          )
        ORDER BY p.is_pinned DESC, p.published_at DESC
        LIMIT 40
      `;
    } else {
      posts = await sql`
        SELECT p.*, pr.display_name, pr.avatar_url, u.username, u.tier,
               (COALESCE(u.is_verified, FALSE) OR LOWER(COALESCE(u.tier, '')) IN ('plus', 'pro', 'max')) as is_verified,
               FALSE as has_liked, FALSE as has_reposted, FALSE as has_bookmarked
        FROM posts p
        JOIN users u ON u.id = p.author_id
        LEFT JOIN profiles pr ON pr.user_id = u.id
        WHERE p.author_id = ${ownerId}
          AND COALESCE(p.status, 'published') = 'published'
          AND p.visibility = 'public'
        ORDER BY p.is_pinned DESC, p.published_at DESC
        LIMIT 40
      `;
    }
  } catch (err) {
    // Les publications sont le cœur du profil : sans elles, mieux vaut laisser
    // la page passer par l'API (qui réparera au passage le schéma).
    if (process.env.NODE_ENV !== "production") {
      console.warn("[vibe-server] readProfile posts:", err);
    }
    return null;
  }

  // Posts d'autres comptes mis en avant sur ce profil (max 2).
  if (await tableExists("profile_pinned_posts")) {
    try {
      const foreignPinned: any[] = viewerId
        ? await sql`
            SELECT p.*, pr.display_name, pr.avatar_url, u.username, u.tier,
                   (COALESCE(u.is_verified, FALSE) OR LOWER(COALESCE(u.tier, '')) IN ('plus', 'pro', 'max')) as is_verified,
                   TRUE AS pinned_by_profile,
                   pu.username AS pinned_by_username,
                   (SELECT COUNT(*) FROM post_interactions WHERE post_id = p.id AND user_id = ${viewerId} AND interaction_type = 'like') > 0 as has_liked,
                   (SELECT COUNT(*) FROM post_interactions WHERE post_id = p.id AND user_id = ${viewerId} AND interaction_type = 'repost') > 0 as has_reposted,
                   (SELECT COUNT(*) FROM bookmarks WHERE post_id = p.id AND user_id = ${viewerId}) > 0 as has_bookmarked
            FROM profile_pinned_posts ppp
            JOIN posts p ON p.id = ppp.post_id
            JOIN users u ON u.id = p.author_id
            LEFT JOIN profiles pr ON pr.user_id = u.id
            LEFT JOIN users pu ON pu.id = ppp.user_id
            WHERE ppp.user_id = ${ownerId}
              AND p.author_id <> ${ownerId}
              AND p.visibility = 'public'
              AND COALESCE(p.status, 'published') = 'published'
            ORDER BY ppp.created_at DESC
            LIMIT 2
          `
        : await sql`
            SELECT p.*, pr.display_name, pr.avatar_url, u.username, u.tier,
                   (COALESCE(u.is_verified, FALSE) OR LOWER(COALESCE(u.tier, '')) IN ('plus', 'pro', 'max')) as is_verified,
                   TRUE AS pinned_by_profile,
                   pu.username AS pinned_by_username,
                   FALSE as has_liked, FALSE as has_reposted, FALSE as has_bookmarked
            FROM profile_pinned_posts ppp
            JOIN posts p ON p.id = ppp.post_id
            JOIN users u ON u.id = p.author_id
            LEFT JOIN profiles pr ON pr.user_id = u.id
            LEFT JOIN users pu ON pu.id = ppp.user_id
            WHERE ppp.user_id = ${ownerId}
              AND p.author_id <> ${ownerId}
              AND p.visibility = 'public'
              AND COALESCE(p.status, 'published') = 'published'
            ORDER BY ppp.created_at DESC
            LIMIT 2
          `;
      if (foreignPinned.length > 0) {
        const ownPinned = posts.filter((p: any) => p.is_pinned);
        const rest = posts.filter((p: any) => !p.is_pinned);
        posts = [...ownPinned, ...foreignPinned, ...rest].slice(0, 40);
      }
    } catch {
      // Comme le handler : une erreur d'épingles étrangères ne vide pas le profil.
    }
  }

  if (posts.length > 0) {
    await fetchPostMedia(posts);
    await attachQuotedPosts(posts);
    await attachBookRefs(posts, viewerId).catch(() => {});
    await attachPollsAndCollabs(posts, viewerId).catch(() => {});
  }

  return {
    posts: isoDeep(posts),
    profile: isoDeep({
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
    }),
  };
}
