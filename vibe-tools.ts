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
  category: "creation" | "search" | "analysis" | "account";
  description: string;
  enabled: boolean;
  file: string;
  icon_name: string;
  id: string;
  mention_tag: string;
  name: string;
  sensitive: boolean;
  slash_command: string;
}

/** Catalogue officiel des outils mAI (miroir de lib/tools/index.json). */
export const MAI_TOOLS_CATALOG: MAICatalogTool[] = [
  {
    category: "creation",
    description:
      "Génère une image IA artistique en haute résolution (ratios 1:1, 16:9, 4:5, 9:16).",
    enabled: true,
    file: "lib/tools/generateImage.ts",
    icon_name: "Image",
    id: "generate_vibe_image",
    mention_tag: "@image",
    name: "Génération d'Image",
    sensitive: false,
    slash_command: "/image",
  },
  {
    category: "search",
    description:
      "Recherche sur le web des informations vérifiées et actualités récentes.",
    enabled: true,
    file: "lib/tools/searchWeb.ts",
    icon_name: "Globe",
    id: "search_web",
    mention_tag: "@search",
    name: "Recherche Web en Direct",
    sensitive: false,
    slash_command: "/search",
  },
  {
    category: "analysis",
    description:
      "Analyse et vérifie la véracité d'une information avec sources et indice de confiance.",
    enabled: true,
    file: "lib/tools/factCheck.ts",
    icon_name: "ShieldCheck",
    id: "fact_check",
    mention_tag: "@fact_check",
    name: "Vérification des Faits",
    sensitive: false,
    slash_command: "/fact_check",
  },
  {
    category: "creation",
    description:
      "Reformule un texte (Viral, Professionnel, Humoristique, Concis, Poétique).",
    enabled: true,
    file: "lib/tools/rewritePost.ts",
    icon_name: "Sparkles",
    id: "rewrite_post",
    mention_tag: "@rewrite",
    name: "Reformulation de Style",
    sensitive: false,
    slash_command: "/rewrite",
  },
  {
    category: "creation",
    description:
      "Traduit un texte dans la langue souhaitée via DeepL (repli mAI).",
    enabled: true,
    file: "lib/tools/translate.ts",
    icon_name: "Languages",
    id: "translate",
    mention_tag: "@translate",
    name: "Traduction Instantanée",
    sensitive: false,
    slash_command: "/translate",
  },
  {
    category: "creation",
    description:
      "Publie directement une publication sur le profil Vibe de l'utilisateur.",
    enabled: true,
    file: "lib/tools/createPost.ts",
    icon_name: "Send",
    id: "create_post",
    mention_tag: "@publish",
    name: "Publier un Post",
    sensitive: true,
    slash_command: "/publish",
  },
  {
    category: "account",
    description: "Supprime une publication appartenant à l'utilisateur.",
    enabled: true,
    file: "lib/tools/deletePost.ts",
    icon_name: "Trash2",
    id: "delete_post",
    mention_tag: "@delete_post",
    name: "Supprimer un Post",
    sensitive: true,
    slash_command: "/delete_post",
  },
  {
    category: "creation",
    description:
      "Génère des idées de publications originales sur un thème (sans les publier).",
    enabled: true,
    file: "lib/tools/suggestPost.ts",
    icon_name: "Lightbulb",
    id: "suggest_post",
    mention_tag: "@inspire",
    name: "Idées de Posts",
    sensitive: false,
    slash_command: "/inspire",
  },
  {
    category: "analysis",
    description:
      "Détecte les sujets chauds et discussions émergentes de la plateforme.",
    enabled: true,
    file: "lib/tools/analyzeTrends.ts",
    icon_name: "TrendingUp",
    id: "analyze_trends",
    mention_tag: "@trends",
    name: "Tendances en Temps Réel",
    sensitive: false,
    slash_command: "/trends",
  },
  {
    category: "search",
    description:
      "Recherche des publications Vibe par mot-clé (titre, contenu).",
    enabled: true,
    file: "lib/tools/searchPosts.ts",
    icon_name: "Search",
    id: "search_posts",
    mention_tag: "@find",
    name: "Recherche de Posts",
    sensitive: false,
    slash_command: "/find",
  },
  {
    category: "account",
    description:
      "Affiche réputation, nombre de posts, abonnés et forfait du compte.",
    enabled: true,
    file: "lib/tools/getAccountStats.ts",
    icon_name: "BarChart3",
    id: "get_account_stats",
    mention_tag: "@stats",
    name: "Statistiques du Compte",
    sensitive: false,
    slash_command: "/stats",
  },
  {
    category: "analysis",
    description:
      "Analyse approfondie des stats créateur (vues, engagement, sources) et produit des recommandations concrètes.",
    enabled: true,
    file: "lib/tools/analyzeCreatorStats.ts",
    icon_name: "Activity",
    id: "analyze_creator_stats",
    mention_tag: "@analyze_stats",
    name: "Analyse des Statistiques Créateur",
    sensitive: false,
    slash_command: "/analyze_stats",
  },
  {
    category: "analysis",
    description:
      "Analyse vues, likes, engagement détaillé d'une publication précise.",
    enabled: true,
    file: "lib/tools/getPostStats.ts",
    icon_name: "Activity",
    id: "get_post_stats",
    mention_tag: "@analyze",
    name: "Analyser un Post",
    sensitive: false,
    slash_command: "/analyze",
  },
  {
    category: "account",
    description:
      "Consulte l'état des tokens mAI hebdomadaires et images quotidiennes.",
    enabled: true,
    file: "lib/tools/checkQuotas.ts",
    icon_name: "Zap",
    id: "check_quotas",
    mention_tag: "@quotas",
    name: "Vérifier mes Quotas",
    sensitive: false,
    slash_command: "/quotas",
  },
  {
    category: "account",
    description:
      "Suit (ou ne suit plus) un compte Vibe désigné par son @username.",
    enabled: true,
    file: "lib/tools/followUser.ts",
    icon_name: "UserPlus",
    id: "follow_user",
    mention_tag: "@follow",
    name: "Suivre un Compte",
    sensitive: true,
    slash_command: "/follow",
  },
  {
    category: "account",
    description:
      "Affiche les dernières notifications (likes, réponses, follows, DMs).",
    enabled: true,
    file: "lib/tools/getNotifications.ts",
    icon_name: "Bell",
    id: "get_notifications",
    mention_tag: "@notifications",
    name: "Mes Notifications",
    sensitive: false,
    slash_command: "/notifications",
  },
  {
    category: "account",
    description: "Like (ou unlike) une publication par son UUID.",
    enabled: true,
    file: "lib/tools/likePost.ts",
    icon_name: "Heart",
    id: "like_post",
    mention_tag: "@like",
    name: "Liker un Post",
    sensitive: false,
    slash_command: "/like",
  },
  {
    category: "account",
    description:
      "Envoie un message privé à un @username (approbation requise).",
    enabled: true,
    file: "lib/tools/sendMessage.ts",
    icon_name: "MessageCircle",
    id: "send_message",
    mention_tag: "@dm",
    name: "Envoyer un DM",
    sensitive: true,
    slash_command: "/dm",
  },
  {
    category: "account",
    description:
      "Modifie thème, langue, fil, notifications, mAI (approbation requise).",
    enabled: true,
    file: "lib/tools/updateSettings.ts",
    icon_name: "Settings",
    id: "update_settings",
    mention_tag: "@settings",
    name: "Modifier mes Paramètres",
    sensitive: true,
    slash_command: "/settings",
  },
  {
    category: "account",
    description: "Met à jour le nom affiché et/ou la bio du profil Vibe.",
    enabled: true,
    file: "lib/tools/updateProfile.ts",
    icon_name: "User",
    id: "update_profile",
    mention_tag: "@profile",
    name: "Modifier mon Profil",
    sensitive: true,
    slash_command: "/profile",
  },
  {
    category: "account",
    description:
      "Ajoute (ou retire) une publication des favoris de l'utilisateur.",
    enabled: true,
    file: "lib/tools/bookmarkPost.ts",
    icon_name: "Bookmark",
    id: "bookmark_post",
    mention_tag: "@bookmark",
    name: "Sauvegarder un Post",
    sensitive: false,
    slash_command: "/bookmark",
  },
  {
    category: "account",
    description:
      "Republie (ou annule) une publication sur le profil de l'utilisateur.",
    enabled: true,
    file: "lib/tools/repostPost.ts",
    icon_name: "Repeat2",
    id: "repost_post",
    mention_tag: "@repost",
    name: "Reposter",
    sensitive: true,
    slash_command: "/repost",
  },
  {
    category: "creation",
    description: "Commente une publication via mAI (approbation requise).",
    enabled: true,
    file: "lib/tools/commentPost.ts",
    icon_name: "MessageSquare",
    id: "comment_post",
    mention_tag: "@comment",
    name: "Commenter un Post",
    sensitive: true,
    slash_command: "/comment",
  },
  {
    category: "analysis",
    description:
      "Sources de vues, visiteurs uniques, heures de pointe et followers les plus engagés.",
    enabled: true,
    file: "lib/tools/analyzeAudience.ts",
    icon_name: "Users",
    id: "analyze_audience",
    mention_tag: "@audience",
    name: "Analyse d'Audience",
    sensitive: false,
    slash_command: "/audience",
  },
  {
    category: "analysis",
    description:
      "Meilleures heures et jours de publication selon tes vues et ton engagement réels.",
    enabled: true,
    file: "lib/tools/bestTimeToPost.ts",
    icon_name: "Clock",
    id: "best_time_to_post",
    mention_tag: "@besttime",
    name: "Meilleur Moment pour Publier",
    sensitive: false,
    slash_command: "/besttime",
  },
  {
    category: "analysis",
    description:
      "Croissance vs période précédente : vues, likes, reposts, réponses, followers, visites de profil.",
    enabled: true,
    file: "lib/tools/comparePeriods.ts",
    icon_name: "ArrowLeftRight",
    id: "compare_periods",
    mention_tag: "@compare",
    name: "Comparaison de Périodes",
    sensitive: false,
    slash_command: "/compare",
  },
  {
    category: "analysis",
    description:
      "Score et estimation de portée/engagement d'un brouillon avant publication.",
    enabled: true,
    file: "lib/tools/predictPostPerformance.ts",
    icon_name: "Target",
    id: "predict_post_performance",
    mention_tag: "@predict",
    name: "Prévision de Performance",
    sensitive: false,
    slash_command: "/predict",
  },
  {
    category: "analysis",
    description:
      "Performance par format (texte, image, sondage, citation) et par hashtag.",
    enabled: true,
    file: "lib/tools/analyzeContentPerformance.ts",
    icon_name: "LayoutGrid",
    id: "analyze_content_performance",
    mention_tag: "@formats",
    name: "Performance par Format",
    sensitive: false,
    slash_command: "/formats",
  },
  {
    category: "analysis",
    description:
      "Volumes de messages, conversations actives, temps de réponse moyen, top correspondants.",
    enabled: true,
    file: "lib/tools/analyzeDmActivity.ts",
    icon_name: "MessagesSquare",
    id: "analyze_dm_activity",
    mention_tag: "@dmstats",
    name: "Activité de Messagerie",
    sensitive: false,
    slash_command: "/dmstats",
  },
  {
    category: "analysis",
    description:
      "Livres collaboratifs : contributions par membre, activité récente, posts populaires.",
    enabled: true,
    file: "lib/tools/analyzeBookStats.ts",
    icon_name: "BookOpen",
    id: "analyze_book_stats",
    mention_tag: "@bookstats",
    name: "Statistiques des Livres",
    sensitive: false,
    slash_command: "/bookstats",
  },
  {
    category: "analysis",
    description:
      "Tes hashtags : vues et likes moyens, meilleurs performers, suggestions tendance.",
    enabled: true,
    file: "lib/tools/analyzeHashtags.ts",
    icon_name: "Hash",
    id: "analyze_hashtags",
    mention_tag: "@hashtags",
    name: "Analyse des Hashtags",
    sensitive: false,
    slash_command: "/hashtags",
  },
];

/** Version du catalogue (index.json). */
export const MAI_CATALOG_VERSION = "1.1.0";

/** Exécuteur générique : délègue l'outil `id` à la flotte MAIAgentFleet. */
const fleetExecutor =
  (id: string) =>
  (userId: number | string, args: any): Promise<any> =>
    MAIAgentFleet.executeTool(id, args, userId);

/** Registre d'exécution : id → implémentation. */
export const TOOL_EXECUTORS: Record<
  string,
  (userId: number | string, args: any) => Promise<any>
> = {
  analyze_audience: fleetExecutor("analyze_audience"),
  analyze_book_stats: fleetExecutor("analyze_book_stats"),
  analyze_content_performance: fleetExecutor("analyze_content_performance"),
  analyze_creator_stats: analyzeCreatorStats,
  analyze_dm_activity: fleetExecutor("analyze_dm_activity"),
  analyze_hashtags: fleetExecutor("analyze_hashtags"),
  // Ces outils ignorent leurs arguments (ex. flotte : {}, pas args).
  analyze_trends: (userId) =>
    MAIAgentFleet.executeTool("analyze_trends", {}, userId),
  best_time_to_post: fleetExecutor("best_time_to_post"),
  bookmark_post: fleetExecutor("bookmark_post"),
  check_quotas: (userId) =>
    MAIAgentFleet.executeTool("check_quotas", {}, userId),
  comment_post: fleetExecutor("comment_post"),
  compare_periods: fleetExecutor("compare_periods"),
  create_post: fleetExecutor("create_post"),
  delete_post: fleetExecutor("delete_post"),
  fact_check: fleetExecutor("fact_check"),
  follow_user: fleetExecutor("follow_user"),
  generate_vibe_image: fleetExecutor("generate_vibe_image"),
  get_account_stats: (userId) =>
    MAIAgentFleet.executeTool("get_account_stats", {}, userId),
  get_notifications: (userId) =>
    MAIAgentFleet.executeTool("get_notifications", {}, userId),
  get_post_stats: fleetExecutor("get_post_stats"),
  like_post: fleetExecutor("like_post"),
  predict_post_performance: fleetExecutor("predict_post_performance"),
  repost_post: fleetExecutor("repost_post"),
  rewrite_post: fleetExecutor("rewrite_post"),
  search_posts: fleetExecutor("search_posts"),
  search_web: fleetExecutor("search_web"),
  send_message: fleetExecutor("send_message"),
  suggest_post: fleetExecutor("suggest_post"),
  translate: fleetExecutor("translate"),
  update_profile: fleetExecutor("update_profile"),
  update_settings: fleetExecutor("update_settings"),
};

/** Cache des outils activés par utilisateur (TTL 60 s, miroir userModelCache). */
const userToolsCache = new Map<
  string,
  { ids: string[] | null; expiresAt: number }
>();

/**
 * Liste des outils activés pour un utilisateur.
 * - user_settings.mai_enabled_tools = NULL ou [] → tous les outils du catalogue
 * - sinon → l'intersection catalogue ∩ liste choisie dans les Paramètres
 */
export async function loadUserEnabledTools(
  userId: number | string
): Promise<string[]> {
  const key = String(userId);
  const cached = userToolsCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return (
      cached.ids ?? MAI_TOOLS_CATALOG.filter((t) => t.enabled).map((t) => t.id)
    );
  }
  let enabledIds: string[] | null = null;
  try {
    const sql = getDb();
    await sql`ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS mai_enabled_tools JSONB DEFAULT NULL`.catch(
      () => {}
    );
    const rows =
      await sql`SELECT mai_enabled_tools FROM user_settings WHERE user_id = ${Number(key)} LIMIT 1`;
    const raw = rows[0]?.mai_enabled_tools;
    if (Array.isArray(raw) && raw.length > 0) {
      const valid = new Set(
        MAI_TOOLS_CATALOG.filter((t) => t.enabled).map((t) => t.id)
      );
      enabledIds = raw.map(String).filter((id) => valid.has(id));
    }
  } catch {}
  userToolsCache.set(key, { expiresAt: Date.now() + 60_000, ids: enabledIds });
  return (
    enabledIds ?? MAI_TOOLS_CATALOG.filter((t) => t.enabled).map((t) => t.id)
  );
}

/** Indique si un outil est activé pour l'utilisateur (défaut : oui). */
export async function isToolEnabledForUser(
  userId: number | string,
  toolId: string
): Promise<boolean> {
  const enabled = await loadUserEnabledTools(userId);
  return enabled.includes(toolId);
}

/**
 * Déclarations function-calling filtrées par les outils activés.
 * Utilisée pour la négociation d'outils côté modèle et pour GET /v1/mai/tools.
 */
export function getToolDeclarations(enabledIds?: string[]) {
  const ids =
    enabledIds ?? MAI_TOOLS_CATALOG.filter((t) => t.enabled).map((t) => t.id);
  return MAI_TOOLS_CATALOG.filter((t) => ids.includes(t.id)).map((t) => ({
    category: t.category,
    description: t.description,
    icon_name: t.icon_name,
    id: t.id,
    mention_tag: t.mention_tag,
    name: t.name,
    sensitive: t.sensitive,
    slash_command: t.slash_command,
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
async function analyzeCreatorStats(
  userId: number | string,
  args: { period?: "7d" | "30d" | "90d" | "12m" } = {}
) {
  try {
    const sql = getDb();
    const periodDays =
      args.period === "7d"
        ? 7
        : args.period === "90d"
          ? 90
          : args.period === "12m"
            ? 365
            : 30;
    const sinceIso = new Date(
      Date.now() - periodDays * 86_400_000
    ).toISOString();

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
    const engagementRate =
      views > 0
        ? Math.round(((likes + reposts * 2 + replies * 2) / views) * 1000) / 10
        : 0;

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
      sources = (s as any[]).map((r) => ({
        source: String(r.source),
        views: Number(r.views || 0),
      }));
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
      if (d[0])
        bestDay = {
          day: String(d[0].day).slice(0, 10),
          views: Number(d[0].views || 0),
        };
    } catch {}

    // Recommandations générées à partir des chiffres
    const recommendations: string[] = [];
    if (posts === 0)
      recommendations.push(
        "Publiez au moins une publication sur la période pour générer des données analysables."
      );
    if (engagementRate < 2 && views > 0)
      recommendations.push(
        "Engagement faible : posez des questions ou ajoutez un sondage pour stimuler les réponses."
      );
    if (replies === 0 && views > 50)
      recommendations.push(
        "Aucune réponse : terminez vos publications par une question ouverte."
      );
    if (reposts < likes / 10 && likes > 10)
      recommendations.push(
        "Peu de reposts : visez des contenus utiles/partenables (listes, conseils)."
      );
    if (bestDay && bestDay.views > 0)
      recommendations.push(
        `Votre meilleur jour est le ${bestDay.day} (${bestDay.views} vues) : publiez aux heures similaires.`
      );
    if (sources.length > 1)
      recommendations.push(
        `Source dominante : ${sources[0].source} — amplifiez ce canal.`
      );
    if (recommendations.length === 0)
      recommendations.push(
        "Vos métriques sont équilibrées : continuez et testez de nouveaux formats."
      );

    return {
      result: {
        best_day: bestDay,
        engagement_rate_percent: engagementRate,
        period_days: periodDays,
        recommendations,
        sources,
        top_posts: (top as any[]).map((p) => ({
          content: String(p.content || "").slice(0, 120),
          id: String(p.id),
          likes: Number(p.likes_count || 0),
          replies: Number(p.replies_count || 0),
          reposts: Number(p.reposts_count || 0),
          views: Number(p.views_count || 0),
        })),
        totals: { likes, posts, replies, reposts, views },
      },
      success: true,
    };
  } catch (err: any) {
    return {
      error: err?.message || "Erreur analyse statistiques.",
      success: false,
    };
  }
}
