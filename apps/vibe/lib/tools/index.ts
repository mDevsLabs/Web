/**
 * ============================================================================
 * VIBE — CATALOGUE D'OUTILS mAI (lib/tools/index.ts)
 * Source de vérité = index.json (même dossier). Expose :
 *  - MAI_TOOLS_CATALOG : entrées typées du catalogue
 *  - getToolDeclarations() : déclarations function-calling filtrées
 *  - isToolEnabledForUser(userId) : lit user_settings.mai_enabled_tools
 *    (NULL/[] = tous les outils activés par défaut)
 * Chaque fichier d'outil délègue l'exécution à MAIAgentFleet (vibe-mai-fleet.ts),
 * qui reste le moteur unique : le catalogue décrit et filtre, il ne duplique pas.
 * ============================================================================
 */
import { getDb } from "../../config.ts";
import { execute as generateImage } from "./generateImage.ts";
import { execute as searchWeb } from "./searchWeb.ts";
import { execute as factCheck } from "./factCheck.ts";
import { execute as rewritePost } from "./rewritePost.ts";
import { execute as translateText } from "./translate.ts";
import { execute as createPost } from "./createPost.ts";
import { execute as deletePost } from "./deletePost.ts";
import { execute as suggestPost } from "./suggestPost.ts";
import { execute as analyzeTrends } from "./analyzeTrends.ts";
import { execute as searchPosts } from "./searchPosts.ts";
import { execute as getAccountStats } from "./getAccountStats.ts";
import { execute as analyzeCreatorStats } from "./analyzeCreatorStats.ts";
import { execute as getPostStats } from "./getPostStats.ts";
import { execute as checkQuotas } from "./checkQuotas.ts";
import { execute as followUser } from "./followUser.ts";
import { execute as getNotifications } from "./getNotifications.ts";
import { execute as likePost } from "./likePost.ts";
import { execute as sendMessage } from "./sendMessage.ts";
import { execute as updateSettings } from "./updateSettings.ts";
import { execute as updateProfile } from "./updateProfile.ts";
import { execute as bookmarkPost } from "./bookmarkPost.ts";
import { execute as repostPost } from "./repostPost.ts";
import { execute as commentPost } from "./commentPost.ts";
import { execute as analyzeAudience } from "./analyzeAudience.ts";
import { execute as bestTimeToPost } from "./bestTimeToPost.ts";
import { execute as comparePeriods } from "./comparePeriods.ts";
import { execute as predictPostPerformance } from "./predictPostPerformance.ts";
import { execute as analyzeContentPerformance } from "./analyzeContentPerformance.ts";
import { execute as analyzeDmActivity } from "./analyzeDmActivity.ts";
import { execute as analyzeBookStats } from "./analyzeBookStats.ts";
import { execute as analyzeHashtags } from "./analyzeHashtags.ts";

import catalogJson from "./index.json" with { type: "json" };

export interface MAICatalogTool {
  id: string;
  name: string;
  slash_command: string;
  mention_tag: string;
  description: string;
  icon_name: string;
  category: "creation" | "search" | "analysis" | "account";
  sensitive: boolean;
  enabled: boolean;
  file: string;
}

/** Catalogue chargé depuis index.json (source déclarative unique). */
export const MAI_TOOLS_CATALOG: MAICatalogTool[] = (catalogJson as any).tools as MAICatalogTool[];

/** Version du catalogue (index.json). */
export const MAI_CATALOG_VERSION: string = String((catalogJson as any).version || "1.0.0");

/** Registre d'exécution : id → implémentation (fichier dédié par outil). */
export const TOOL_EXECUTORS: Record<string, (userId: number | string, args: any) => Promise<any>> = {
  generate_vibe_image: generateImage,
  search_web: searchWeb,
  fact_check: factCheck,
  rewrite_post: rewritePost,
  translate: translateText,
  create_post: createPost,
  delete_post: deletePost,
  suggest_post: suggestPost,
  analyze_trends: analyzeTrends,
  search_posts: searchPosts,
  get_account_stats: getAccountStats,
  analyze_creator_stats: analyzeCreatorStats,
  get_post_stats: getPostStats,
  check_quotas: checkQuotas,
  follow_user: followUser,
  get_notifications: getNotifications,
  like_post: likePost,
  send_message: sendMessage,
  update_settings: updateSettings,
  update_profile: updateProfile,
  bookmark_post: bookmarkPost,
  repost_post: repostPost,
  comment_post: commentPost,
  analyze_audience: analyzeAudience,
  best_time_to_post: bestTimeToPost,
  compare_periods: comparePeriods,
  predict_post_performance: predictPostPerformance,
  analyze_content_performance: analyzeContentPerformance,
  analyze_dm_activity: analyzeDmActivity,
  analyze_book_stats: analyzeBookStats,
  analyze_hashtags: analyzeHashtags,
};

/** Cache des outils activés par utilisateur (TTL 60 s, miroir userModelCache). */
const userToolsCache = new Map<string, { ids: string[] | null; expiresAt: number }>();

/**
 * Liste des outils activés pour un utilisateur.
 * - user_settings.mai_enabled_tools = NULL ou [] → tous les outils du catalogue
 * - sinon → l'intersection catalogue ∩ liste choisie dans les Paramètres
 */
export async function loadUserEnabledTools(userId: number | string): Promise<string[]> {
  const key = String(userId);
  const cached = userToolsCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.ids ?? MAI_TOOLS_CATALOG.filter((t) => t.enabled).map((t) => t.id);
  }
  let enabledIds: string[] | null = null;
  try {
    const sql = getDb();
    await sql`ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS mai_enabled_tools JSONB DEFAULT NULL`.catch(() => {});
    const rows = await sql`SELECT mai_enabled_tools FROM user_settings WHERE user_id = ${Number(key)} LIMIT 1`;
    const raw = rows[0]?.mai_enabled_tools;
    if (Array.isArray(raw) && raw.length > 0) {
      const valid = new Set(MAI_TOOLS_CATALOG.filter((t) => t.enabled).map((t) => t.id));
      enabledIds = raw.map(String).filter((id) => valid.has(id));
    }
  } catch {}
  userToolsCache.set(key, { ids: enabledIds, expiresAt: Date.now() + 60_000 });
  return enabledIds ?? MAI_TOOLS_CATALOG.filter((t) => t.enabled).map((t) => t.id);
}

/** Indique si un outil est activé pour l'utilisateur (défaut : oui). */
export async function isToolEnabledForUser(userId: number | string, toolId: string): Promise<boolean> {
  const enabled = await loadUserEnabledTools(userId);
  return enabled.includes(toolId);
}

/**
 * Déclarations function-calling filtrées par les outils activés.
 * Utilisée pour la négociation d'outils côté modèle et pour GET /v1/mai/tools.
 */
export function getToolDeclarations(enabledIds?: string[]) {
  const ids = enabledIds ?? MAI_TOOLS_CATALOG.filter((t) => t.enabled).map((t) => t.id);
  return MAI_TOOLS_CATALOG.filter((t) => ids.includes(t.id)).map((t) => ({
    id: t.id,
    name: t.name,
    slash_command: t.slash_command,
    mention_tag: t.mention_tag,
    description: t.description,
    icon_name: t.icon_name,
    category: t.category,
    sensitive: t.sensitive,
  }));
}

/** Invalide le cache d'outils d'un utilisateur (après mise à jour des réglages). */
export function invalidateUserToolsCache(userId: number | string): void {
  userToolsCache.delete(String(userId));
}
