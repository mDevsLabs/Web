/**
 * ============================================================================
 * VIBE — PAGE STATISTIQUES CRÉATEUR (src/pages/StatsPage.tsx)
 * Accessible via le header Profil (isSelf), PAS dans la barre de navigation.
 * Route /stats déclarée avant /:username dans App.tsx.
 * Graphiques recharts (Area + Bar), période 7J/30J/90J/12M.
 * Nouveautés 019 : croissance vs période précédente, meilleur jour, heures
 * optimales (barres 24 h), top 5 publications, fréquence, et bouton mAI
 * qui ouvre MAI Studio avec un prompt d'analyse prérempli.
 * Pleine largeur : grille adaptative mobile → desktop, sans bouton Retour.
 * ============================================================================
 */

import { BarChart2Icon as BarChart2, BookmarkIcon as Bookmark, CalendarDaysIcon as CalendarDays, ClockIcon as Clock, DownloadIcon as Download, EyeIcon as Eye, FlameIcon as Flame, HeartIcon as Heart, MessageCircleIcon as MessageCircle, Repeat2Icon as Repeat2, SparklesIcon as Sparkles, TrendingDownIcon as TrendingDown, TrendingUpIcon as TrendingUp, UsersIcon as Users } from "@mdevs/icons";
import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { RichContent } from "@/components/vibe/common/RichContent";
import { PeriodSelector } from "@/components/vibe/stats/PeriodSelector";
import { formatCompactCount } from "@/lib/vibe/algorithms";
import { useCreatorStats } from "@/lib/vibe/hooks/useCreatorStats";
import type { StatsPeriod } from "@/lib/vibe/services/api";
import { downloadTextFile } from "@/lib/vibe/services/mediaActions";
import { NotificationService } from "@/lib/vibe/services/notificationService";
import { useNavigate } from "../router";

const TOOLTIP_STYLE = {
  backgroundColor: "#09090b",
  border: "1px solid #27272a",
  borderRadius: 12,
  color: "#fff",
  fontSize: 12,
} as const;

function shortDay(day: string) {
  // '2026-09-12' -> '12/09'
  const parts = day.slice(0, 10).split("-");
  return parts.length === 3 ? `${parts[2]}/${parts[1]}` : day.slice(5);
}

function growthPct(
  current: number,
  previous: number | undefined
): number | null {
  if (previous === undefined || previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function StatsPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<StatsPeriod>("30d");
  const { stats, profileViews, loading, error, refetch } =
    useCreatorStats(period);

  const engagement =
    stats && stats.total_views > 0
      ? Math.round(
          ((stats.total_likes + stats.total_reposts + stats.total_replies) /
            stats.total_views) *
            1000
        ) / 10
      : 0;

  const series = stats?.series ?? [];
  const prev = stats?.previous_period ?? null;
  const viewsGrowth = growthPct(stats?.total_views ?? 0, prev?.total_views);
  const likesGrowth = growthPct(stats?.total_likes ?? 0, prev?.total_likes);
  const hourly = stats?.hourly ?? [];
  const topPosts = stats?.top_posts ?? [];
  const bestDay = stats?.best_day ?? null;
  const bestPublishDay = stats?.best_publish_day ?? null;
  const sources = stats?.sources ?? [];
  const sourcesTotal = sources.reduce((n, s) => n + s.views, 0) || 1;
  const topPost = stats?.top_post ?? null;

  // Dernière statistique des insights : vues moyennes par publication
  const avgViewsPerPost =
    stats && stats.posts_count > 0
      ? Math.round(stats.total_views / stats.posts_count)
      : 0;

  // Nombre de cartes d'insights affichées pour équilibrer la grille sur toute la largeur
  const insightCardsCount = [
    Boolean(bestDay),
    Boolean(bestPublishDay),
    stats?.posts_per_week !== undefined,
    true, // vues par post toujours affiché
  ].filter(Boolean).length;

  const insightsGridClass =
    insightCardsCount === 1
      ? "grid-cols-1"
      : insightCardsCount === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : insightCardsCount === 3
          ? "grid-cols-1 sm:grid-cols-3"
          : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4";

  /** Export JSON complet des statistiques affichées (données brutes incluses). */
  const handleExportStats = () => {
    if (!stats) return;
    try {
      const periodLabel = stats.period || period;
      const payload = {
        exported_at: new Date().toISOString(),
        format: "vibe.stats.export",
        period: periodLabel,
        profile_views: profileViews ?? null,
        stats,
        version: 1,
      };
      const date = new Date().toISOString().slice(0, 10);
      downloadTextFile(
        `vibe-stats-${periodLabel}-${date}.json`,
        JSON.stringify(payload, null, 2),
        "application/json;charset=utf-8"
      );
      NotificationService.showInAppToast(
        "Export",
        "Vos statistiques ont été exportées en JSON.",
        "success"
      );
    } catch (err: any) {
      NotificationService.showInAppToast(
        "Export",
        err?.message || "L'export a échoué.",
        "error"
      );
    }
  };

  // Construction du prompt mAI (bouton « Analyser avec mAI »)
  const maiPrompt = stats
    ? [
        "/analyze_stats Analyse mes statistiques de créateur sur la période " +
          (stats.period || period) +
          " :",
        `- ${formatCompactCount(stats.total_views)} vues (engagement ${stats.engagement_rate ?? engagement} %)`,
        `- ${formatCompactCount(stats.total_likes)} likes · ${formatCompactCount(stats.total_reposts)} reposts · ${formatCompactCount(stats.total_replies)} réponses`,
        `- ${stats.posts_count} publications (${stats.posts_per_week ?? 0}/semaine) · ${formatCompactCount(profileViews?.total ?? stats.profile_views ?? 0)} visites de profil`,
        viewsGrowth === null
          ? ""
          : `- Croissance vues : ${viewsGrowth > 0 ? "+" : ""}${viewsGrowth}% vs période précédente`,
        sources.length > 0
          ? `- Sources principales : ${sources
              .slice(0, 3)
              .map((s) => `${s.source} (${s.views})`)
              .join(", ")}`
          : "",
        bestDay
          ? `- Meilleur jour : ${bestDay.day} (${bestDay.views} vues)`
          : "",
        "",
        "Donne-moi une analyse complète et des recommandations concrètes pour progresser.",
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  const kpis = stats
    ? [
        {
          growth: viewsGrowth,
          icon: Eye,
          label: "Vues",
          value: stats.total_views,
        },
        {
          growth: likesGrowth,
          icon: Heart,
          label: "Likes",
          value: stats.total_likes,
        },
        { icon: Repeat2, label: "Reposts", value: stats.total_reposts },
        { icon: MessageCircle, label: "Réponses", value: stats.total_replies },
        {
          icon: Users,
          label: "Visites profil",
          value: profileViews?.total ?? stats.profile_views ?? 0,
        },
        {
          icon: TrendingUp,
          label: "Engagement",
          raw: true,
          value: `${stats.engagement_rate ?? engagement} %`,
        },
      ]
    : [];

  return (
    <div className="flex-1 w-full min-h-screen bg-black text-white sm:border-r sm:border-zinc-800">
      <header className="sticky top-0 z-20 backdrop-blur-md bg-black/80 border-b border-zinc-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <BarChart2 className="w-5 h-5 shrink-0" />
          <div className="min-w-0">
            <h1 className="font-bold text-base leading-tight truncate">
              Statistiques
            </h1>
            <p className="text-xs text-zinc-500">Performances de vos Vibes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PeriodSelector onChange={setPeriod} period={period} />
          {stats && (
            <button
              className="flex items-center gap-1.5 py-2 px-3.5 rounded-full border border-zinc-700 text-zinc-300 text-xs font-bold hover:text-white hover:border-zinc-500 transition-colors shrink-0"
              onClick={handleExportStats}
              title="Exporter les statistiques (JSON)"
              type="button"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exporter</span>
            </button>
          )}
          {stats && (
            <button
              className="flex items-center gap-1.5 py-2 px-3.5 rounded-full bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-colors shrink-0"
              onClick={() =>
                navigate(
                  "/mai?new=" +
                    Date.now() +
                    "&prefill=" +
                    encodeURIComponent(maiPrompt)
                )
              }
              title="Envoyer les statistiques à mAI pour analyse"
              type="button"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Analyser avec mAI</span>
              <span className="sm:hidden">mAI</span>
            </button>
          )}
        </div>
      </header>

      <main className="p-4 sm:p-6 space-y-4 sm:space-y-5 pb-24">
        {loading && !stats && (
          <div aria-busy="true" className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  className="h-20 rounded-2xl bg-zinc-950 border border-zinc-800 animate-pulse"
                  key={i}
                />
              ))}
            </div>
            <div className="grid gap-4 sm:gap-5 xl:grid-cols-2">
              <div className="h-44 sm:h-52 xl:h-64 rounded-3xl bg-zinc-950 border border-zinc-800 animate-pulse" />
              <div className="h-44 sm:h-52 xl:h-64 rounded-3xl bg-zinc-950 border border-zinc-800 animate-pulse" />
            </div>
          </div>
        )}

        {error && !stats && (
          <div className="p-5 rounded-3xl bg-zinc-950 border border-zinc-800 text-center space-y-3">
            <p className="text-sm text-zinc-400">{error}</p>
            <button
              className="py-2 px-5 rounded-2xl bg-white text-black text-xs font-bold hover:bg-zinc-200"
              onClick={refetch}
            >
              Réessayer
            </button>
          </div>
        )}

        {stats && (
          <>
            <section
              className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3"
              data-tour="stats-kpi"
            >
              {kpis.map((k) => (
                <div
                  className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800"
                  key={k.label}
                >
                  <div className="flex items-center gap-1.5 text-zinc-500">
                    <k.icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[11px] font-semibold uppercase tracking-wide truncate">
                      {k.label}
                    </span>
                  </div>
                  <p className="mt-1 text-xl sm:text-2xl font-extrabold">
                    {k.raw ? k.value : formatCompactCount(Number(k.value))}
                  </p>
                  {"growth" in k &&
                    k.growth !== null &&
                    k.growth !== undefined && (
                      <p
                        className={`mt-0.5 text-[10px] font-bold flex items-center gap-0.5 ${
                          k.growth >= 0 ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {k.growth >= 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {k.growth >= 0 ? "+" : ""}
                        {k.growth}% vs période précédente
                      </p>
                    )}
                </div>
              ))}
            </section>

            {/* Insights rapides : meilleur jour, heures optimales, fréquence, vues/post (largeur équilibrée) */}
            <section className={`grid ${insightsGridClass} gap-3`}>
              {bestDay && (
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-start gap-3 w-full h-full">
                  <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <CalendarDays className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                      Meilleur jour
                    </p>
                    <p className="text-sm font-extrabold">
                      {shortDay(bestDay.day)}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      {formatCompactCount(bestDay.views)} vues ce jour
                    </p>
                  </div>
                </div>
              )}
              {bestPublishDay && (
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-start gap-3 w-full h-full">
                  <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                      Meilleure publication
                    </p>
                    <p className="text-sm font-extrabold">
                      {shortDay(bestPublishDay.day)}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      {bestPublishDay.posts} post(s),{" "}
                      {formatCompactCount(bestPublishDay.views)} vues cumulées
                    </p>
                  </div>
                </div>
              )}
              {stats.posts_per_week !== undefined && (
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-start gap-3 w-full h-full">
                  <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                      Fréquence
                    </p>
                    <p className="text-sm font-extrabold">
                      {stats.posts_per_week} posts/semaine
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      Régularité = visibilité accrue
                    </p>
                  </div>
                </div>
              )}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-start gap-3 w-full h-full">
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Eye className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                    Vues par post
                  </p>
                  <p className="text-sm font-extrabold">
                    {stats.posts_count > 0
                      ? `${formatCompactCount(avgViewsPerPost)} vues/post`
                      : "—"}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    {stats.posts_count > 0
                      ? `Moyenne sur ${stats.posts_count} publication${stats.posts_count > 1 ? "s" : ""}`
                      : "Aucune publication sur la période"}
                  </p>
                </div>
              </div>
            </section>

            {/* Graphiques : deux colonnes sur grand écran, empilés sur mobile */}
            <div className="grid gap-4 sm:gap-5 xl:grid-cols-2">
              <section
                className="p-4 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-2"
                data-tour="stats-chart"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold">Vues quotidiennes</h2>
                  <span className="text-[11px] text-zinc-500">
                    {series.length} jours
                  </span>
                </div>
                {series.length > 0 ? (
                  <div className="h-44 sm:h-52 xl:h-64">
                    <ResponsiveContainer height="100%" width="100%">
                      <AreaChart
                        data={series}
                        margin={{ bottom: 0, left: -18, right: 4, top: 4 }}
                      >
                        <CartesianGrid
                          stroke="#27272a"
                          strokeDasharray="3 3"
                          vertical={false}
                        />
                        <XAxis
                          axisLine={false}
                          dataKey="day"
                          minTickGap={24}
                          tick={{ fill: "#71717a", fontSize: 10 }}
                          tickFormatter={shortDay}
                          tickLine={false}
                        />
                        <YAxis
                          allowDecimals={false}
                          axisLine={false}
                          tick={{ fill: "#71717a", fontSize: 10 }}
                          tickLine={false}
                          width={40}
                        />
                        <Tooltip
                          contentStyle={TOOLTIP_STYLE}
                          labelFormatter={(d) => String(d)}
                        />
                        <Area
                          dataKey="views"
                          fill="#fff"
                          fillOpacity={0.15}
                          name="Vues"
                          stroke="#fff"
                          strokeWidth={2}
                          type="monotone"
                        />
                        <Area
                          dataKey="profile_views"
                          fill="transparent"
                          name="Visites profil"
                          stroke="#a1a1aa"
                          strokeDasharray="4 3"
                          strokeWidth={1.5}
                          type="monotone"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500">
                    Pas encore de données sur cette période.
                  </p>
                )}
              </section>

              <section className="p-4 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-2">
                <h2 className="text-sm font-bold">Réactions quotidiennes</h2>
                {series.length > 0 ? (
                  <div className="h-44 sm:h-52 xl:h-64">
                    <ResponsiveContainer height="100%" width="100%">
                      <BarChart
                        barCategoryGap="30%"
                        data={series}
                        margin={{ bottom: 0, left: -18, right: 4, top: 4 }}
                      >
                        <CartesianGrid
                          stroke="#27272a"
                          strokeDasharray="3 3"
                          vertical={false}
                        />
                        <XAxis
                          axisLine={false}
                          dataKey="day"
                          minTickGap={24}
                          tick={{ fill: "#71717a", fontSize: 10 }}
                          tickFormatter={shortDay}
                          tickLine={false}
                        />
                        <YAxis
                          allowDecimals={false}
                          axisLine={false}
                          tick={{ fill: "#71717a", fontSize: 10 }}
                          tickLine={false}
                          width={40}
                        />
                        <Tooltip
                          contentStyle={TOOLTIP_STYLE}
                          cursor={{ fill: "#18181b" }}
                        />
                        <Bar
                          dataKey="likes"
                          fill="#fff"
                          name="Likes"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="reposts"
                          fill="#52525b"
                          name="Reposts"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="replies"
                          fill="#a1a1aa"
                          name="Réponses"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500">
                    Pas encore de données sur cette période.
                  </p>
                )}
              </section>
            </div>

            {/* Heures optimales de publication (répartition 24 h des vues) */}
            {hourly.some((h) => h.views > 0) && (
              <section className="p-4 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold flex items-center gap-1.5">
                    <Clock className="w-4 h-4" /> Heures les plus vues
                  </h2>
                  <span className="text-[11px] text-zinc-500">
                    Publiez vers{" "}
                    {
                      hourly.reduce(
                        (best, h) => (h.views > best.views ? h : best),
                        hourly[0]
                      ).hour
                    }
                    h pour maximiser la portée
                  </span>
                </div>
                <div className="h-40 sm:h-48">
                  <ResponsiveContainer height="100%" width="100%">
                    <BarChart
                      barCategoryGap="15%"
                      data={hourly}
                      margin={{ bottom: 0, left: -18, right: 4, top: 4 }}
                    >
                      <CartesianGrid
                        stroke="#27272a"
                        strokeDasharray="3 3"
                        vertical={false}
                      />
                      <XAxis
                        axisLine={false}
                        dataKey="hour"
                        minTickGap={8}
                        tick={{ fill: "#71717a", fontSize: 10 }}
                        tickFormatter={(h) => `${h}h`}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        axisLine={false}
                        tick={{ fill: "#71717a", fontSize: 10 }}
                        tickLine={false}
                        width={40}
                      />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        cursor={{ fill: "#18181b" }}
                        labelFormatter={(h) =>
                          `${h}h — ${hourly[Number(h)]?.views ?? 0} vues`
                        }
                      />
                      <Bar
                        dataKey="views"
                        fill="#fff"
                        name="Vues"
                        radius={[3, 3, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}

            {/* Top 5 des publications les plus engageantes */}
            {topPosts.length > 1 && (
              <section className="p-4 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-3">
                <h2 className="text-sm font-bold flex items-center gap-1.5">
                  <Flame className="w-4 h-4" /> Top 5 publications de la période
                </h2>
                <ol className="space-y-2.5">
                  {topPosts.map((p, i) => (
                    <li
                      className="flex items-start gap-3 p-2.5 rounded-2xl bg-zinc-900/50 border border-zinc-800/60"
                      key={p.id}
                    >
                      <span className="w-6 h-6 rounded-full bg-white text-black text-[11px] font-extrabold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <RichContent
                          className="text-xs line-clamp-2"
                          content={p.content}
                        />
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-zinc-500">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {formatCompactCount(Number(p.views_count || 0))}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {formatCompactCount(Number(p.likes_count || 0))}
                          </span>
                          <span className="flex items-center gap-1">
                            <Repeat2 className="w-3 h-3" />
                            {formatCompactCount(Number(p.reposts_count || 0))}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            {formatCompactCount(Number(p.replies_count || 0))}
                          </span>
                        </div>
                      </div>
                      <button
                        className="text-[11px] font-bold text-white hover:underline shrink-0"
                        onClick={() => navigate(`/post/${p.id}`)}
                      >
                        Voir
                      </button>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {(sources.length > 0 || topPost) && (
              <div className="grid gap-4 sm:gap-5 xl:grid-cols-2">
                {sources.length > 0 && (
                  <section
                    className={`p-4 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-2 ${topPost ? "" : "xl:col-span-2"}`}
                  >
                    <h2 className="text-sm font-bold">Sources de trafic</h2>
                    <ul className="space-y-1.5">
                      {sources.map((s) => {
                        const pct = Math.round((s.views / sourcesTotal) * 100);
                        return (
                          <li
                            className="flex items-center gap-2 text-xs"
                            key={s.source}
                          >
                            <span className="w-20 capitalize text-zinc-400">
                              {s.source}
                            </span>
                            <div className="flex-1 h-2 rounded-full bg-zinc-900 overflow-hidden">
                              <div
                                className="h-full bg-white rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-14 text-right text-zinc-300 font-semibold">
                              {formatCompactCount(s.views)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                )}

                {topPost && (
                  <section
                    className={`p-4 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-2 ${sources.length > 0 ? "" : "xl:col-span-2"}`}
                    data-tour="stats-top"
                  >
                    <h2 className="text-sm font-bold flex items-center gap-1.5">
                      <Bookmark className="w-4 h-4" /> Top publication
                    </h2>
                    <RichContent
                      className="line-clamp-3 text-xs sm:text-sm"
                      content={topPost.content}
                    />
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {formatCompactCount(Number(topPost.views_count || 0))}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5" />
                        {formatCompactCount(Number(topPost.likes_count || 0))}
                      </span>
                      <button
                        className="ml-auto text-white font-bold hover:underline"
                        onClick={() => navigate(`/post/${topPost.id}`)}
                      >
                        Voir le post
                      </button>
                    </div>
                  </section>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
