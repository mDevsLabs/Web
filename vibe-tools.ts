/**
 * ============================================================================
 * VIBE — CATALOGUE D'OUTILS mAI (vibe-tools.ts — fichier racine de l'API)
 * Miroir embarqué de lib/tools/index.json (catalogue v1.1.0 du 2026-09-12) :
 * l'API Val Town (mai.val.run) est un projet plat, sans sous-dossier lib/.
 * Expose :
 *  - MAI_TOOLS_CATALOG : entrées typées du catalogue
 *  - getToolDeclarations() : déclarations function-calling filtrées
 *  - isToolEnabledForUser(userId) : lit user_settings.mai_enabled_tools
 *    (NULL/[] = tous les outils activés par défaut)
 * Chaque outil délègue l'exécution à MAIAgentFleet (vibe-mai-fleet.ts),
 * qui reste le moteur unique : le catalogue décrit et filtre, il ne duplique pas.
 * ============================================================================
 */
import { getDb } from "./config.ts";
import { MAIAgentFleet } from "./vibe-mai-fleet.ts";

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

/** Catalogue officiel des outils mAI (miroir de lib/tools/index.json). */
export const MAI_TOOLS_CATALOG: MAICatalogTool[] = [
  {
    id: "generate_vibe_image",
    name: "Génération d'Image",
    slash_command: "/image",
    mention_tag: "@image",
    description: "Génère une image IA artistique en haute résolution (ratios 1:1, 16:9, 4:5, 9:16).",
    icon_name: "Image",
    category: "creation",
    sensitive: false,
    enabled: true,
    file: "lib/tools/generateImage.ts",
  },
  {
    id: "search_web",
    name: "Recherche Web en Direct",
    slash_command: "/search",
    mention_tag: "@search",
    description: "Recherche sur le web des informations vérifiées et actualités récentes.",
    icon_name: "Globe",
    category: "search",
    sensitive: false,
    enabled: true,
    file: "lib/tools/searchWeb.ts",
  },
  {
    id: "fact_check",
    name: "Vérification des Faits",
    slash_command: "/fact_check",
    mention_tag: "@fact_check",
    description: "Analyse et vérifie la véracité d'une information avec sources et indice de confiance.",
    icon_name: "ShieldCheck",
    category: "analysis",
    sensitive: false,
    enabled: true,
    file: "lib/tools/factCheck.ts",
  },
  {
    id: "rewrite_post",
    name: "Reformulation de Style",
    slash_command: "/rewrite",
    mention_tag: "@rewrite",
    description: "Reformule un texte (Viral, Professionnel, Humoristique, Concis, Poétique).",
    icon_name: "Sparkles",
    category: "creation",
    sensitive: false,
    enabled: true,
    file: "lib/tools/rewritePost.ts",
  },
  {
    id: "translate",
    name: "Traduction Instantanée",
    slash_command: "/translate",
    mention_tag: "@translate",
    description: "Traduit un texte dans la langue souhaitée via DeepL (repli mAI).",
    icon_name: "Languages",
    category: "creation",
    sensitive: false,
    enabled: true,
    file: "lib/tools/translate.ts",
  },
  {
    id: "create_post",
    name: "Publier un Post",
    slash_command: "/publish",
    mention_tag: "@publish",
    description: "Publie directement une publication sur le profil Vibe de l'utilisateur.",
    icon_name: "Send",
    category: "creation",
    sensitive: true,
    enabled: true,
    file: "lib/tools/createPost.ts",
  },
  {
    id: "delete_post",
    name: "Supprimer un Post",
    slash_command: "/delete_post",
    mention_tag: "@delete_post",
    description: "Supprime une publication appartenant à l'utilisateur.",
    icon_name: "Trash2",
    category: "account",
    sensitive: true,
    enabled: true,
    file: "lib/tools/deletePost.ts",
  },
  {
    id: "suggest_post",
    name: "Idées de Posts",
    slash_command: "/inspire",
    mention_tag: "@inspire",
    description: "Génère des idées de publications originales sur un thème (sans les publier).",
    icon_name: "Lightbulb",
    category: "creation",
    sensitive: false,
    enabled: true,
    file: "lib/tools/suggestPost.ts",
  },
  {
    id: "analyze_trends",
    name: "Tendances en Temps Réel",
    slash_command: "/trends",
    mention_tag: "@trends",
    description: "Détecte les sujets chauds et discussions émergentes de la plateforme.",
    icon_name: "TrendingUp",
    category: "analysis",
    sensitive: false,
    enabled: true,
    file: "lib/tools/analyzeTrends.ts",
  },
  {
    id: "search_posts",
    name: "Recherche de Posts",
    slash_command: "/find",
    mention_tag: "@find",
    description: "Recherche des publications Vibe par mot-clé (titre, contenu).",
    icon_name: "Search",
    category: "search",
    sensitive: false,
    enabled: true,
    file: "lib/tools/searchPosts.ts",
  },
  {
    id: "get_account_stats",
    name: "Statistiques du Compte",
    slash_command: "/stats",
    mention_tag: "@stats",
    description: "Affiche réputation, nombre de posts, abonnés et forfait du compte.",
    icon_name: "BarChart3",
    category: "account",
    sensitive: false,
    enabled: true,
    file: "lib/tools/getAccountStats.ts",
  },
  {
    id: "analyze_creator_stats",
    name: "Analyse des Statistiques Créateur",
    slash_command: "/analyze_stats",
    mention_tag: "@analyze_stats",
    description: "Analyse approfondie des stats créateur (vues, engagement, sources) et produit des recommandations concrètes.",
    icon_name: "Activity",
    category: "analysis",
    sensitive: false,
    enabled: true,
    file: "lib/tools/analyzeCreatorStats.ts",
  },
  {
    id: "get_post_stats",
    name: "Analyser un Post",
    slash_command: "/analyze",
    mention_tag: "@analyze",
    description: "Analyse vues, likes, engagement détaillé d'une publication précise.",
    icon_name: "Activity",
    category: "analysis",
    sensitive: false,
    enabled: true,
    file: "lib/tools/getPostStats.ts",
  },
  {
    id: "check_quotas",
    name: "Vérifier mes Quotas",
    slash_command: "/quotas",
    mention_tag: "@quotas",
    description: "Consulte l'état des tokens mAI hebdomadaires et images quotidiennes.",
    icon_name: "Zap",
    category: "account",
    sensitive: false,
    enabled: true,
    file: "lib/tools/checkQuotas.ts",
  },
  {
    id: "follow_user",
    name: "Suivre un Compte",
    slash_command: "/follow",
    mention_tag: "@follow",
    description: "Suit (ou ne suit plus) un compte Vibe désigné par son @username.",
    icon_name: "UserPlus",
    category: "account",
    sensitive: true,
    enabled: true,
    file: "lib/tools/followUser.ts",
  },
  {
    id: "get_notifications",
    name: "Mes Notifications",
    slash_command: "/notifications",
    mention_tag: "@notifications",
    description: "Affiche les dernières notifications (likes, réponses, follows, DMs).",
    icon_name: "Bell",
    category: "account",
    sensitive: false,
    enabled: true,
    file: "lib/tools/getNotifications.ts",
  },
  {
    id: "like_post",
    name: "Liker un Post",
    slash_command: "/like",
    mention_tag: "@like",
    description: "Like (ou unlike) une publication par son UUID.",
    icon_name: "Heart",
    category: "account",
    sensitive: false,
    enabled: true,
    file: "lib/tools/likePost.ts",
  },
  {
    id: "send_message",
    name: "Envoyer un DM",
    slash_command: "/dm",
    mention_tag: "@dm",
    description: "Envoie un message privé à un @username (approbation requise).",
    icon_name: "MessageCircle",
    category: "account",
    sensitive: true,
    enabled: true,
    file: "lib/tools/sendMessage.ts",
  },
  {
    id: "update_settings",
    name: "Modifier mes Paramètres",
    slash_command: "/settings",
    mention_tag: "@settings",
    description: "Modifie thème, langue, fil, notifications, mAI (approbation requise).",
    icon_name: "Settings",
    category: "account",
    sensitive: true,
    enabled: true,
    file: "lib/tools/updateSettings.ts",
  },
  {
    id: "update_profile",
    name: "Modifier mon Profil",
    slash_command: "/profile",
    mention_tag: "@profile",
    description: "Met à jour le nom affiché et/ou la bio du profil Vibe.",
    icon_name: "User",
    category: "account",
    sensitive: true,
    enabled: true,
    file: "lib/tools/updateProfile.ts",
  },
  {
    id: "bookmark_post",
    name: "Sauvegarder un Post",
    slash_command: "/bookmark",
    mention_tag: "@bookmark",
    description: "Ajoute (ou retire) une publication des favoris de l'utilisateur.",
    icon_name: "Bookmark",
    category: "account",
    sensitive: false,
    enabled: true,
    file: "lib/tools/bookmarkPost.ts",
  },
  {
    id: "repost_post",
    name: "Reposter",
    slash_command: "/repost",
    mention_tag: "@repost",
    description: "Republie (ou annule) une publication sur le profil de l'utilisateur.",
    icon_name: "Repeat2",
    category: "account",
    sensitive: true,
    enabled: true,
    file: "lib/tools/repostPost.ts",
  },
  {
    id: "comment_post",
    name: "Commenter un Post",
    slash_command: "/comment",
    mention_tag: "@comment",
    description: "Commente une publication via mAI (approbation requise).",
    icon_name: "MessageSquare",
    category: "creation",
    sensitive: true,
    enabled: true,
    file: "lib/tools/commentPost.ts",
  },
  {
    id: "analyze_audience",
    name: "Analyse d'Audience",
    slash_command: "/audience",
    mention_tag: "@audience",
    description: "Sources de vues, visiteurs uniques, heures de pointe et followers les plus engagés.",
    icon_name: "Users",
    category: "analysis",
    sensitive: false,
    enabled: true,
    file: "lib/tools/analyzeAudience.ts",
  },
  {
    id: "best_time_to_post",
    name: "Meilleur Moment pour Publier",
    slash_command: "/besttime",
    mention_tag: "@besttime",
    description: "Meilleures heures et jours de publication selon tes vues et ton engagement réels.",
    icon_name: "Clock",
    category: "analysis",
    sensitive: false,
    enabled: true,
    file: "lib/tools/bestTimeToPost.ts",
  },
  {
    id: "compare_periods",
    name: "Comparaison de Périodes",
    slash_command: "/compare",
    mention_tag: "@compare",
    description: "Croissance vs période précédente : vues, likes, reposts, réponses, followers, visites de profil.",
    icon_name: "ArrowLeftRight",
    category: "analysis",
    sensitive: false,
    enabled: true,
    file: "lib/tools/comparePeriods.ts",
  },
  {
    id: "predict_post_performance",
    name: "Prévision de Performance",
    slash_command: "/predict",
    mention_tag: "@predict",
    description: "Score et estimation de portée/engagement d'un brouillon avant publication.",
    icon_name: "Target",
    category: "analysis",
    sensitive: false,
    enabled: true,
    file: "lib/tools/predictPostPerformance.ts",
  },
  {
    id: "analyze_content_performance",
    name: "Performance par Format",
    slash_command: "/formats",
    mention_tag: "@formats",
    description: "Performance par format (texte, image, sondage, citation) et par hashtag.",
    icon_name: "LayoutGrid",
    category: "analysis",
    sensitive: false,
    enabled: true,
    file: "lib/tools/analyzeContentPerformance.ts",
  },
  {
    id: "analyze_dm_activity",
    name: "Activité de Messagerie",
    slash_command: "/dmstats",
    mention_tag: "@dmstats",
    description: "Volumes de messages, conversations actives, temps de réponse moyen, top correspondants.",
    icon_name: "MessagesSquare",
    category: "analysis",
    sensitive: false,
    enabled: true,
    file: "lib/tools/analyzeDmActivity.ts",
  },
  {
    id: "analyze_book_stats",
    name: "Statistiques des Livres",
    slash_command: "/bookstats",
    mention_tag: "@bookstats",
    description: "Livres collaboratifs : contributions par membre, activité récente, posts populaires.",
    icon_name: "BookOpen",
    category: "analysis",
    sensitive: false,
    enabled: true,
    file: "lib/tools/analyzeBookStats.ts",
  },
  {
    id: "analyze_hashtags",
    name: "Analyse des Hashtags",
    slash_command: "/hashtags",
    mention_tag: "@hashtags",
    description: "Tes hashtags : vues et likes moyens, meilleurs performers, suggestions tendance.",
    icon_name: "Hash",
    category: "analysis",
    sensitive: false,
    enabled: true,
    file: "lib/tools/analyzeHashtags.ts",
  },
];

/** Version du catalogue (index.json). */
export const MAI_CATALOG_VERSION = "1.1.0";

/** Exécuteur générique : délègue l'outil `id` à la flotte MAIAgentFleet. */
const fleetExecutor = (id: string) =>
  (userId: number | string, args: any): Promise<any> => MAIAgentFleet.executeTool(id, args, userId);

/** Registre d'exécution : id → implémentation. */
export const TOOL_EXECUTORS: Record<string, (userId: number | string, args: any) => Promise<any>> = {
  generate_vibe_image: fleetExecutor("generate_vibe_image"),
  search_web: fleetExecutor("search_web"),
  fact_check: fleetExecutor("fact_check"),
  rewrite_post: fleetExecutor("rewrite_post"),
  translate: fleetExecutor("translate"),
  create_post: fleetExecutor("create_post"),
  delete_post: fleetExecutor("delete_post"),
  suggest_post: fleetExecutor("suggest_post"),
  // Ces outils ignorent leurs arguments (ex. flotte : {}, pas args).
  analyze_trends: (userId) => MAIAgentFleet.executeTool("analyze_trends", {}, userId),
  search_posts: fleetExecutor("search_posts"),
  get_account_stats: (userId) => MAIAgentFleet.executeTool("get_account_stats", {}, userId),
  analyze_creator_stats: analyzeCreatorStats,
  get_post_stats: fleetExecutor("get_post_stats"),
  check_quotas: (userId) => MAIAgentFleet.executeTool("check_quotas", {}, userId),
  follow_user: fleetExecutor("follow_user"),
  get_notifications: (userId) => MAIAgentFleet.executeTool("get_notifications", {}, userId),
  like_post: fleetExecutor("like_post"),
  send_message: fleetExecutor("send_message"),
  update_settings: fleetExecutor("update_settings"),
  update_profile: fleetExecutor("update_profile"),
  bookmark_post: fleetExecutor("bookmark_post"),
  repost_post: fleetExecutor("repost_post"),
  comment_post: fleetExecutor("comment_post"),
  analyze_audience: fleetExecutor("analyze_audience"),
  best_time_to_post: fleetExecutor("best_time_to_post"),
  compare_periods: fleetExecutor("compare_periods"),
  predict_post_performance: fleetExecutor("predict_post_performance"),
  analyze_content_performance: fleetExecutor("analyze_content_performance"),
  analyze_dm_activity: fleetExecutor("analyze_dm_activity"),
  analyze_book_stats: fleetExecutor("analyze_book_stats"),
  analyze_hashtags: fleetExecutor("analyze_hashtags"),
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

/**
 * Outil analyze_creator_stats — seule implémentation directe (pas de case
 * dans la flotte). Agrège les mêmes données que GET /v1/users/me/creator-stats,
 * puis produit une synthèse analytique (période la plus forte, engagement,
 * sources, recommandations).
 */
async function analyzeCreatorStats(userId: number | string, args: { period?: "7d" | "30d" | "90d" | "12m" } = {}) {
  try {
    const sql = getDb();
    const periodDays = args.period === "7d" ? 7 : args.period === "90d" ? 90 : args.period === "12m" ? 365 : 30;
    const sinceIso = new Date(Date.now() - periodDays * 86400000).toISOString();

    const agg = await sql`
      SELECT COALESCE(SUM(views_count), 0) AS total_views,
             COALESCE(SUM(likes_count), 0) AS total_likes,
             COALESCE(SUM(reposts_count), 0) AS total_reposts,
             COALESCE(SUM(replies_count), 0) AS total_replies,
             COUNT(*) AS posts_count
      FROM posts WHERE author_id = ${Number(userId)} AND published_at >= ${sinceIso}::timestamptz
    `.catch(() => []);
    const a = agg[0] || {};
    const views = Number(a.total_views || 0);
    const likes = Number(a.total_likes || 0);
    const reposts = Number(a.total_reposts || 0);
    const replies = Number(a.total_replies || 0);
    const posts = Number(a.posts_count || 0);
    const engagementRate = views > 0 ? Math.round(((likes + reposts * 2 + replies * 2) / views) * 1000) / 10 : 0;

    const top = await sql`
      SELECT id, content, views_count, likes_count, reposts_count, replies_count, published_at
      FROM posts WHERE author_id = ${Number(userId)} AND published_at >= ${sinceIso}::timestamptz
      ORDER BY (COALESCE(likes_count,0) + COALESCE(reposts_count,0)*2 + COALESCE(replies_count,0)*2) DESC
      LIMIT 3
    `.catch(() => []);

    let sources: Array<{ source: string; views: number }> = [];
    try {
      const s = await sql`
        SELECT COALESCE(pv.source, 'feed') AS source, COUNT(*) AS views
        FROM post_views pv JOIN posts p ON p.id = pv.post_id
        WHERE p.author_id = ${Number(userId)} AND pv.created_at >= ${sinceIso}::timestamptz
        GROUP BY 1 ORDER BY views DESC LIMIT 5
      `;
      sources = (s as any[]).map((r) => ({ source: String(r.source), views: Number(r.views || 0) }));
    } catch {}

    // Meilleur jour de la période (vues par jour)
    let bestDay: { day: string; views: number } | null = null;
    try {
      const d = await sql`
        SELECT created_at::date AS day, COUNT(*) AS views
        FROM post_views pv JOIN posts p ON p.id = pv.post_id
        WHERE p.author_id = ${Number(userId)} AND pv.created_at >= ${sinceIso}::timestamptz
        GROUP BY 1 ORDER BY views DESC LIMIT 1
      `;
      if (d[0]) bestDay = { day: String(d[0].day).slice(0, 10), views: Number(d[0].views || 0) };
    } catch {}

    // Recommandations générées à partir des chiffres
    const recommendations: string[] = [];
    if (posts === 0) recommendations.push("Publiez au moins une publication sur la période pour générer des données analysables.");
    if (engagementRate < 2 && views > 0) recommendations.push("Engagement faible : posez des questions ou ajoutez un sondage pour stimuler les réponses.");
    if (replies === 0 && views > 50) recommendations.push("Aucune réponse : terminez vos publications par une question ouverte.");
    if (reposts < likes / 10 && likes > 10) recommendations.push("Peu de reposts : visez des contenus utiles/partenables (listes, conseils).");
    if (bestDay && bestDay.views > 0) recommendations.push(`Votre meilleur jour est le ${bestDay.day} (${bestDay.views} vues) : publiez aux heures similaires.`);
    if (sources.length > 1) recommendations.push(`Source dominante : ${sources[0].source} — amplifiez ce canal.`);
    if (recommendations.length === 0) recommendations.push("Vos métriques sont équilibrées : continuez et testez de nouveaux formats.");

    return {
      success: true,
      result: {
        period_days: periodDays,
        totals: { views, likes, reposts, replies, posts },
        engagement_rate_percent: engagementRate,
        top_posts: (top as any[]).map((p) => ({
          id: String(p.id),
          content: String(p.content || "").slice(0, 120),
          views: Number(p.views_count || 0),
          likes: Number(p.likes_count || 0),
          reposts: Number(p.reposts_count || 0),
          replies: Number(p.replies_count || 0),
        })),
        sources,
        best_day: bestDay,
        recommendations,
      },
    };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erreur analyse statistiques." };
  }
}
