/**
 * Outil mAI — Analyse approfondie des statistiques créateur.
 * Agrège les mêmes données que GET /v1/users/me/creator-stats, puis produit
 * une synthèse analytique (période la plus forte, engagement, sources, reco).
 * Catalogue : lib/tools/index.json → id "analyze_creator_stats".
 */
import { getDb, getWeekData } from "../../config.ts";

export interface AnalyzeCreatorStatsArgs {
  period?: "7d" | "30d" | "90d" | "12m";
}

export async function execute(userId: number | string, args: AnalyzeCreatorStatsArgs = {}) {
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

export const declaration = {
  name: "analyze_creator_stats",
  description: "Analyse approfondie des statistiques créateur et produit des recommandations concrètes.",
  parameters: {
    type: "object",
    properties: {
      period: { type: "string", enum: ["7d", "30d", "90d", "12m"], description: "Période d'analyse (défaut 30d)" },
    },
  },
};
