/**
 * ============================================================================
 * VIBE — LECTEURS EXPLORER (lib/vibe/server/queries/explore.ts)
 * ============================================================================
 *
 * Le premier écran de `/vibe/explore` est entièrement déterministe :
 * tendances par hashtags (`handleGetTrends`, `vibe-feed.ts:579-684`), Top
 * Vibe (`handleTopPosts`, `vibe-feed.ts:695-770`), Top Vibers
 * (`handleTopVibers`, `vibe-users.ts:180-221`) et suggestions d'onboarding
 * (`handleOnboardingSuggestions`, `vibe-users.ts:367-390`). Rien d'IA ici —
 * que du SQL et du classement local : le cas idéal de la pré-hydratation.
 *
 * Le scorage des tendances (fenêtre 48 h → repli 30 j, boost de fraîcheur,
 * catégories par mot-clé) est copié méthode par méthode : un écart
 * d'arrondi suffirait à désordonner la liste entre deux renders.
 *
 * Pas de `publishDuePosts()` : la publication des programmés appartient au
 * cron (`app/api/cron/vibe`), pas à une lecture.
 */
import "server-only";
import { vibeSql } from "../db";
import type { VibeIdentity } from "../identity";
import { isoDeep } from "../shape";
import { resolveHiddenUserIds } from "./hidden-users";
import {
  attachBookRefs,
  attachPollsAndCollabs,
  attachQuotedPosts,
  fetchPostMedia,
} from "./post-hydrate";

export type VibeExploreSeed = {
  onboardingSuggestions: { users: any[] } | null;
  topPosts: { posts: any[]; success: boolean } | null;
  topVibers: { users: any[] } | null;
  trends: { success: boolean; trends: any[] } | null;
};

function viewerIdOf(identity: VibeIdentity | null): number | null {
  return identity && /^\d+$/.test(String(identity.userId))
    ? Number(identity.userId)
    : null;
}

// ── Tendances ───────────────────────────────────────────────────────────────

// Le tagged-template Neon paramètre tout ${} : le SQL brut ne peut pas être
// injecté ainsi. Les variantes 48 h et 30 j sont donc écrites en clair.
async function readTrends(): Promise<VibeExploreSeed["trends"]> {
  const sql = vibeSql();
  if (!sql) {
    return null;
  }
  try {
    let recentPosts: any[] = await sql`
      SELECT content, likes_count, reposts_count, replies_count, views_count, published_at
      FROM posts
      WHERE published_at > NOW() - INTERVAL '48 hours'
        AND visibility = 'public' AND status = 'published'
      ORDER BY (likes_count * 2 + reposts_count * 3 + replies_count) DESC
      LIMIT 300
    `;
    if (recentPosts.length < 5) {
      recentPosts = await sql`
        SELECT content, likes_count, reposts_count, replies_count, views_count, published_at
        FROM posts
        WHERE published_at > NOW() - INTERVAL '30 days'
          AND visibility = 'public' AND status = 'published'
        ORDER BY (likes_count * 2 + reposts_count * 3 + replies_count) DESC
        LIMIT 300
      `;
    }

    const tagMap: Record<
      string,
      { count: number; engagement: number; recencyBoost: number }
    > = {};
    const now = Date.now();

    for (const p of recentPosts) {
      const text = p.content || "";
      const matches = text.match(/#[\p{L}\p{N}_]+/gu) || [];
      const eng =
        Number(p.likes_count || 0) * 2 +
        Number(p.reposts_count || 0) * 3 +
        Number(p.replies_count || 0) * 2 +
        Number(p.views_count || 0) * 0.1 +
        1;
      const ageHours =
        (now - new Date(p.published_at).getTime()) / (1000 * 3600);
      const recency = ageHours < 6 ? 3 : ageHours < 24 ? 1.5 : 1;

      for (const rawTag of matches) {
        const normalized = rawTag.toLowerCase().trim();
        if (normalized.length <= 1 || normalized.length > 35) {
          continue;
        }
        if (!tagMap[rawTag]) {
          tagMap[rawTag] = { count: 0, engagement: 0, recencyBoost: 0 };
        }
        tagMap[rawTag].count += 1;
        tagMap[rawTag].engagement += eng;
        tagMap[rawTag].recencyBoost += recency;
      }
    }

    const sortedTrends = Object.entries(tagMap)
      .map(([tag, data]) => {
        const score = data.engagement * data.recencyBoost + data.count * 5;
        const formatted =
          data.count > 1000
            ? `${(data.count / 1000).toFixed(1)}k`
            : `${data.count}`;
        const lc = tag.toLowerCase();
        const category =
          lc.includes("mai") ||
          lc.includes("ia") ||
          lc.includes("ai") ||
          lc.includes("llm") ||
          lc.includes("gpt")
            ? "Intelligence Artificielle"
            : lc.includes("tech") ||
                lc.includes("dev") ||
                lc.includes("code") ||
                lc.includes("web")
              ? "Technologie"
              : lc.includes("design") ||
                  lc.includes("art") ||
                  lc.includes("photo") ||
                  lc.includes("ux")
                ? "Design & Création"
                : lc.includes("vibe") ||
                    lc.includes("social") ||
                    lc.includes("community")
                  ? "Communauté"
                  : "Tendances";
        return {
          category,
          post_count: data.count,
          posts: `${formatted} publications`,
          score,
          tag,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return { success: true, trends: sortedTrends };
  } catch {
    return { success: true, trends: [] };
  }
}

// ── Top Vibe ────────────────────────────────────────────────────────────────

async function readTopPosts(
  viewerId: number | null,
  limit = 5,
  days = 30
): Promise<VibeExploreSeed["topPosts"]> {
  const sql = vibeSql();
  if (!sql) {
    return null;
  }
  const cappedLimit = Math.min(10, Math.max(1, limit));
  const cappedDays = Math.min(90, Math.max(1, days));
  try {
    const posts: any[] = viewerId
      ? await sql`
          SELECT p.*, pr.display_name, pr.avatar_url, u.username, u.tier,
                 (COALESCE(u.is_verified, FALSE) OR LOWER(COALESCE(u.tier, '')) IN ('plus', 'pro', 'max')) as is_verified,
                 (SELECT COUNT(*) FROM post_interactions WHERE post_id = p.id AND user_id = ${viewerId} AND interaction_type = 'like') > 0 as has_liked,
                 (SELECT COUNT(*) FROM post_interactions WHERE post_id = p.id AND user_id = ${viewerId} AND interaction_type = 'repost') > 0 as has_reposted,
                 (SELECT COUNT(*) FROM bookmarks WHERE post_id = p.id AND user_id = ${viewerId}) > 0 as has_bookmarked,
                 (SELECT pi.interaction_type FROM post_interactions pi WHERE pi.post_id = p.id AND pi.user_id = ${viewerId} AND pi.interaction_type IN ('interest_more', 'interest_less') LIMIT 1) as my_feedback
          FROM posts p
          JOIN users u ON u.id = p.author_id
          LEFT JOIN profiles pr ON pr.user_id = u.id
          WHERE p.visibility = 'public' AND COALESCE(p.status, 'published') = 'published'
            AND p.published_at > NOW() - (${cappedDays} * INTERVAL '1 day')
          ORDER BY (COALESCE(p.likes_count, 0) * 1.0
                  + COALESCE(p.reposts_count, 0) * 2.5
                  + COALESCE(p.replies_count, 0) * 2.0
                  + COALESCE(p.views_count, 0) * 0.1) DESC,
                   p.published_at DESC
          LIMIT ${cappedLimit}
        `
      : await sql`
          SELECT p.*, pr.display_name, pr.avatar_url, u.username, u.tier,
                 (COALESCE(u.is_verified, FALSE) OR LOWER(COALESCE(u.tier, '')) IN ('plus', 'pro', 'max')) as is_verified,
                 FALSE as has_liked, FALSE as has_reposted, FALSE as has_bookmarked, NULL as my_feedback
          FROM posts p
          JOIN users u ON u.id = p.author_id
          LEFT JOIN profiles pr ON pr.user_id = u.id
          WHERE p.visibility = 'public' AND COALESCE(p.status, 'published') = 'published'
            AND p.published_at > NOW() - (${cappedDays} * INTERVAL '1 day')
          ORDER BY (COALESCE(p.likes_count, 0) * 1.0
                  + COALESCE(p.reposts_count, 0) * 2.5
                  + COALESCE(p.replies_count, 0) * 2.0
                  + COALESCE(p.views_count, 0) * 0.1) DESC,
                   p.published_at DESC
          LIMIT ${cappedLimit}
        `;

    await fetchPostMedia(posts);
    await attachQuotedPosts(posts);
    await attachBookRefs(posts, viewerId).catch(() => {});
    await attachPollsAndCollabs(posts, viewerId).catch(() => {});

    const { mutedIds, blockedIds } = await resolveHiddenUserIds(viewerId);
    const hidden = new Set<number>([...mutedIds, ...blockedIds]);
    const visible = posts.filter((p: any) => !hidden.has(Number(p.author_id)));
    return { posts: isoDeep(visible), success: true };
  } catch {
    return { posts: [], success: true };
  }
}

// ── Top Vibers ──────────────────────────────────────────────────────────────

async function readTopVibers(
  viewerId: number | null,
  limit = 10
): Promise<VibeExploreSeed["topVibers"]> {
  const sql = vibeSql();
  if (!sql) {
    return null;
  }
  const cappedLimit = Math.min(20, Math.max(1, limit));
  try {
    const rows = viewerId
      ? await sql`
          SELECT u.id, u.username, u.tier,
                 (COALESCE(u.is_verified, FALSE) OR LOWER(COALESCE(u.tier, '')) IN ('plus', 'pro', 'max')) as is_verified,
                 COALESCE(pr.display_name, u.username) as display_name,
                 COALESCE(pr.avatar_url, u.avatar_url) as avatar_url,
                 COALESCE(pr.bio, 'Membre Vibe') as bio,
                 COALESCE(pr.followers_count, 0) as followers_count,
                 EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = ${viewerId} AND f.following_id = u.id) as is_following
          FROM users u
          LEFT JOIN profiles pr ON pr.user_id = u.id
          WHERE u.id != ${viewerId}
            AND LOWER(u.username) NOT IN ('bot', 'mai')
          ORDER BY COALESCE(pr.followers_count, 0) DESC, u.id DESC
          LIMIT ${cappedLimit}
        `
      : await sql`
          SELECT u.id, u.username, u.tier,
                 (COALESCE(u.is_verified, FALSE) OR LOWER(COALESCE(u.tier, '')) IN ('plus', 'pro', 'max')) as is_verified,
                 COALESCE(pr.display_name, u.username) as display_name,
                 COALESCE(pr.avatar_url, u.avatar_url) as avatar_url,
                 COALESCE(pr.bio, 'Membre Vibe') as bio,
                 COALESCE(pr.followers_count, 0) as followers_count,
                 FALSE as is_following
          FROM users u
          LEFT JOIN profiles pr ON pr.user_id = u.id
          WHERE LOWER(u.username) NOT IN ('bot', 'mai')
          ORDER BY COALESCE(pr.followers_count, 0) DESC, u.id DESC
          LIMIT ${cappedLimit}
        `;
    return { users: isoDeep(rows) };
  } catch {
    return { users: [] };
  }
}

// ── Suggestions d'onboarding ────────────────────────────────────────────────

async function readOnboardingSuggestions(
  viewerId: number | null
): Promise<VibeExploreSeed["onboardingSuggestions"]> {
  const sql = vibeSql();
  if (!sql || !viewerId) {
    // Le handler répond 401 sans jeton ; le client traduisait déjà en liste vide.
    return { users: [] };
  }
  try {
    const users = await sql`
      SELECT u.id, u.username, u.tier,
        (COALESCE(u.is_verified, FALSE) OR LOWER(COALESCE(u.tier, '')) IN ('plus', 'pro', 'max')) as is_verified,
        pr.display_name, pr.avatar_url, pr.bio, pr.followers_count
      FROM users u
      LEFT JOIN profiles pr ON pr.user_id = u.id
      WHERE u.id <> ${viewerId}
        AND u.id NOT IN (SELECT following_id FROM follows WHERE follower_id = ${viewerId})
        AND LOWER(u.username) NOT IN ('bot', 'mai')
      ORDER BY COALESCE(pr.followers_count, 0) DESC
      LIMIT 10
    `.catch(() => []);
    return { users: isoDeep(users) };
  } catch {
    return null;
  }
}

// ── Seed composite ──────────────────────────────────────────────────────────

/**
 * Les quatre panneaux d'Explorer, lus en parallèle. Chaque compartiment tombe
 * à `null` individuellement : le client ne retente que celui-là via l'API.
 */
export async function readExplore(
  identity: VibeIdentity | null
): Promise<VibeExploreSeed> {
  const viewerId = viewerIdOf(identity);
  const [trends, topPosts, topVibers, onboardingSuggestions] =
    await Promise.all([
      readTrends(),
      readTopPosts(viewerId),
      readTopVibers(viewerId),
      readOnboardingSuggestions(viewerId),
    ]);
  return { onboardingSuggestions, topPosts, topVibers, trends };
}
