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
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2Icon as BarChart2, BookmarkIcon as Bookmark, EyeIcon as Eye, HeartIcon as Heart, MessageCircleIcon as MessageCircle, Repeat2Icon as Repeat2, TrendingUpIcon as TrendingUp, TrendingDownIcon as TrendingDown, UsersIcon as Users, SparklesIcon as Sparkles, CalendarDaysIcon as CalendarDays, ClockIcon as Clock, FlameIcon as Flame, DownloadIcon as Download } from "@mdevs/icons";
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
} from 'recharts';
import { PeriodSelector } from '../components/stats/PeriodSelector';
import { RichContent } from '../components/common/RichContent';
import { useCreatorStats } from '../hooks/useCreatorStats';
import { formatCompactCount } from '../algorithms';
import { downloadTextFile } from '../services/mediaActions';
import { NotificationService } from '../services/notificationService';
import type { StatsPeriod } from '../services/api';

const TOOLTIP_STYLE = {
  backgroundColor: '#09090b',
  border: '1px solid #27272a',
  borderRadius: 12,
  fontSize: 12,
  color: '#fff',
} as const;

function shortDay(day: string) {
  // '2026-09-12' -> '12/09'
  const parts = day.slice(0, 10).split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}` : day.slice(5);
}

function growthPct(current: number, previous: number | undefined): number | null {
  if (previous === undefined || previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function StatsPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<StatsPeriod>('30d');
  const { stats, profileViews, loading, error, refetch } = useCreatorStats(period);

  const engagement =
    stats && stats.total_views > 0
      ? Math.round(((stats.total_likes + stats.total_reposts + stats.total_replies) / stats.total_views) * 1000) / 10
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
    stats && stats.posts_count > 0 ? Math.round(stats.total_views / stats.posts_count) : 0;

  // Nombre de cartes d'insights affichées pour équilibrer la grille sur toute la largeur
  const insightCardsCount = [
    Boolean(bestDay),
    Boolean(bestPublishDay),
    stats?.posts_per_week !== undefined,
    true, // vues par post toujours affiché
  ].filter(Boolean).length;

  const insightsGridClass =
    insightCardsCount === 1
      ? 'grid-cols-1'
      : insightCardsCount === 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : insightCardsCount === 3
      ? 'grid-cols-1 sm:grid-cols-3'
      : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4';

  /** Export JSON complet des statistiques affichées (données brutes incluses). */
  const handleExportStats = () => {
    if (!stats) return;
    try {
      const periodLabel = stats.period || period;
      const payload = {
        format: 'vibe.stats.export',
        version: 1,
        exported_at: new Date().toISOString(),
        period: periodLabel,
        profile_views: profileViews ?? null,
        stats,
      };
      const date = new Date().toISOString().slice(0, 10);
      downloadTextFile(
        `vibe-stats-${periodLabel}-${date}.json`,
        JSON.stringify(payload, null, 2),
        'application/json;charset=utf-8'
      );
      NotificationService.showInAppToast('Export', 'Vos statistiques ont été exportées en JSON.', 'success');
    } catch (err: any) {
      NotificationService.showInAppToast('Export', err?.message || "L'export a échoué.", 'error');
    }
  };

  // Construction du prompt mAI (bouton « Analyser avec mAI »)
  const maiPrompt = stats
    ? [
        '/analyze_stats Analyse mes statistiques de créateur sur la période ' + (stats.period || period) + ' :',
        `- ${formatCompactCount(stats.total_views)} vues (engagement ${stats.engagement_rate ?? engagement} %)`,
        `- ${formatCompactCount(stats.total_likes)} likes · ${formatCompactCount(stats.total_reposts)} reposts · ${formatCompactCount(stats.total_replies)} réponses`,
        `- ${stats.posts_count} publications (${stats.posts_per_week ?? 0}/semaine) · ${formatCompactCount(profileViews?.total ?? stats.profile_views ?? 0)} visites de profil`,
        viewsGrowth !== null ? `- Croissance vues : ${viewsGrowth > 0 ? '+' : ''}${viewsGrowth}% vs période précédente` : '',
        sources.length > 0 ? `- Sources principales : ${sources.slice(0, 3).map((s) => `${s.source} (${s.views})`).join(', ')}` : '',
        bestDay ? `- Meilleur jour : ${bestDay.day} (${bestDay.views} vues)` : '',
        '',
        'Donne-moi une analyse complète et des recommandations concrètes pour progresser.',
      ]
        .filter(Boolean)
        .join('\n')
    : '';

  const kpis = stats
    ? [
        { label: 'Vues', value: stats.total_views, icon: Eye, growth: viewsGrowth },
        { label: 'Likes', value: stats.total_likes, icon: Heart, growth: likesGrowth },
        { label: 'Reposts', value: stats.total_reposts, icon: Repeat2 },
        { label: 'Réponses', value: stats.total_replies, icon: MessageCircle },
        { label: 'Visites profil', value: profileViews?.total ?? stats.profile_views ?? 0, icon: Users },
        { label: 'Engagement', value: `${stats.engagement_rate ?? engagement} %`, icon: TrendingUp, raw: true },
      ]
    : [];

  return (
    <div className="flex-1 w-full min-h-screen bg-black text-white sm:border-r sm:border-zinc-800">
      <header className="sticky top-0 z-20 backdrop-blur-md bg-black/80 border-b border-zinc-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <BarChart2 className="w-5 h-5 shrink-0" />
          <div className="min-w-0">
            <h1 className="font-bold text-base leading-tight truncate">Statistiques</h1>
            <p className="text-xs text-zinc-500">Performances de vos Vibes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PeriodSelector period={period} onChange={setPeriod} />
          {stats && (
            <button
              type="button"
              onClick={handleExportStats}
              className="flex items-center gap-1.5 py-2 px-3.5 rounded-full border border-zinc-700 text-zinc-300 text-xs font-bold hover:text-white hover:border-zinc-500 transition-colors shrink-0"
              title="Exporter les statistiques (JSON)"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exporter</span>
            </button>
          )}
          {stats && (
            <button
              type="button"
              onClick={() => navigate('/mai?new=' + Date.now() + '&prefill=' + encodeURIComponent(maiPrompt))}
              className="flex items-center gap-1.5 py-2 px-3.5 rounded-full bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-colors shrink-0"
              title="Envoyer les statistiques à mAI pour analyse"
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
          <div className="space-y-3 sm:space-y-4" aria-busy="true">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-20 rounded-2xl bg-zinc-950 border border-zinc-800 animate-pulse" />
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
              onClick={refetch}
              className="py-2 px-5 rounded-2xl bg-white text-black text-xs font-bold hover:bg-zinc-200"
            >
              Réessayer
            </button>
          </div>
        )}

        {stats && (
          <>
            <section data-tour="stats-kpi" className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
              {kpis.map((k) => (
                <div key={k.label} className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                  <div className="flex items-center gap-1.5 text-zinc-500">
                    <k.icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[11px] font-semibold uppercase tracking-wide truncate">{k.label}</span>
                  </div>
                  <p className="mt-1 text-xl sm:text-2xl font-extrabold">
                    {k.raw ? k.value : formatCompactCount(Number(k.value))}
                  </p>
                  {'growth' in k && k.growth !== null && k.growth !== undefined && (
                    <p
                      className={`mt-0.5 text-[10px] font-bold flex items-center gap-0.5 ${
                        k.growth >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {k.growth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {k.growth >= 0 ? '+' : ''}
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
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Meilleur jour</p>
                    <p className="text-sm font-extrabold">{shortDay(bestDay.day)}</p>
                    <p className="text-[11px] text-zinc-500">{formatCompactCount(bestDay.views)} vues ce jour</p>
                  </div>
                </div>
              )}
              {bestPublishDay && (
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-start gap-3 w-full h-full">
                  <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Meilleure publication</p>
                    <p className="text-sm font-extrabold">{shortDay(bestPublishDay.day)}</p>
                    <p className="text-[11px] text-zinc-500">
                      {bestPublishDay.posts} post(s), {formatCompactCount(bestPublishDay.views)} vues cumulées
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
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Fréquence</p>
                    <p className="text-sm font-extrabold">{stats.posts_per_week} posts/semaine</p>
                    <p className="text-[11px] text-zinc-500">Régularité = visibilité accrue</p>
                  </div>
                </div>
              )}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-start gap-3 w-full h-full">
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Eye className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Vues par post</p>
                  <p className="text-sm font-extrabold">
                    {stats.posts_count > 0 ? `${formatCompactCount(avgViewsPerPost)} vues/post` : '—'}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    {stats.posts_count > 0
                      ? `Moyenne sur ${stats.posts_count} publication${stats.posts_count > 1 ? 's' : ''}`
                      : 'Aucune publication sur la période'}
                  </p>
                </div>
              </div>
            </section>

            {/* Graphiques : deux colonnes sur grand écran, empilés sur mobile */}
            <div className="grid gap-4 sm:gap-5 xl:grid-cols-2">
              <section data-tour="stats-chart" className="p-4 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold">Vues quotidiennes</h2>
                  <span className="text-[11px] text-zinc-500">{series.length} jours</span>
                </div>
                {series.length > 0 ? (
                  <div className="h-44 sm:h-52 xl:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={series} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
                        <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="day" tickFormatter={shortDay} tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={24} />
                        <YAxis tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} width={40} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(d) => String(d)} />
                        <Area type="monotone" dataKey="views" name="Vues" stroke="#fff" strokeWidth={2} fill="#fff" fillOpacity={0.15} />
                        <Area type="monotone" dataKey="profile_views" name="Visites profil" stroke="#a1a1aa" strokeWidth={1.5} strokeDasharray="4 3" fill="transparent" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500">Pas encore de données sur cette période.</p>
                )}
              </section>

              <section className="p-4 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-2">
                <h2 className="text-sm font-bold">Réactions quotidiennes</h2>
                {series.length > 0 ? (
                  <div className="h-44 sm:h-52 xl:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={series} margin={{ top: 4, right: 4, bottom: 0, left: -18 }} barCategoryGap="30%">
                        <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="day" tickFormatter={shortDay} tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={24} />
                        <YAxis tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} width={40} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#18181b' }} />
                        <Bar dataKey="likes" name="Likes" fill="#fff" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="reposts" name="Reposts" fill="#52525b" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="replies" name="Réponses" fill="#a1a1aa" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500">Pas encore de données sur cette période.</p>
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
                    Publiez vers {hourly.reduce((best, h) => (h.views > best.views ? h : best), hourly[0]).hour}h pour maximiser la portée
                  </span>
                </div>
                <div className="h-40 sm:h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hourly} margin={{ top: 4, right: 4, bottom: 0, left: -18 }} barCategoryGap="15%">
                      <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="hour" tickFormatter={(h) => `${h}h`} tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={8} />
                      <YAxis tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} width={40} />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        cursor={{ fill: '#18181b' }}
                        labelFormatter={(h) => `${h}h — ${hourly[Number(h)]?.views ?? 0} vues`}
                      />
                      <Bar dataKey="views" name="Vues" fill="#fff" radius={[3, 3, 0, 0]} />
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
                    <li key={p.id} className="flex items-start gap-3 p-2.5 rounded-2xl bg-zinc-900/50 border border-zinc-800/60">
                      <span className="w-6 h-6 rounded-full bg-white text-black text-[11px] font-extrabold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <RichContent content={p.content} className="text-xs line-clamp-2" />
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-zinc-500">
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{formatCompactCount(Number(p.views_count || 0))}</span>
                          <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{formatCompactCount(Number(p.likes_count || 0))}</span>
                          <span className="flex items-center gap-1"><Repeat2 className="w-3 h-3" />{formatCompactCount(Number(p.reposts_count || 0))}</span>
                          <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{formatCompactCount(Number(p.replies_count || 0))}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/post/${p.id}`)}
                        className="text-[11px] font-bold text-white hover:underline shrink-0"
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
                  <section className={`p-4 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-2 ${topPost ? '' : 'xl:col-span-2'}`}>
                    <h2 className="text-sm font-bold">Sources de trafic</h2>
                    <ul className="space-y-1.5">
                      {sources.map((s) => {
                        const pct = Math.round((s.views / sourcesTotal) * 100);
                        return (
                          <li key={s.source} className="flex items-center gap-2 text-xs">
                            <span className="w-20 capitalize text-zinc-400">{s.source}</span>
                            <div className="flex-1 h-2 rounded-full bg-zinc-900 overflow-hidden">
                              <div className="h-full bg-white rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-14 text-right text-zinc-300 font-semibold">{formatCompactCount(s.views)}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                )}

                {topPost && (
                  <section data-tour="stats-top" className={`p-4 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-2 ${sources.length > 0 ? '' : 'xl:col-span-2'}`}>
                    <h2 className="text-sm font-bold flex items-center gap-1.5">
                      <Bookmark className="w-4 h-4" /> Top publication
                    </h2>
                    <RichContent content={topPost.content} className="line-clamp-3 text-xs sm:text-sm" />
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
                        onClick={() => navigate(`/post/${topPost.id}`)}
                        className="ml-auto text-white font-bold hover:underline"
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
