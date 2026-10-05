/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — POST STATS MODAL (src/components/feed/PostStatsModal.tsx)
 * Statistiques créateur d'un post : vues, likes, reposts, réponses, bookmarks,
 * taux d'engagement + mini-graphe 7 jours (CSS pur).
 * ============================================================================
 */

import React, { useEffect, useState } from 'react';
import { X, Loader2, Eye, Heart, Repeat, MessageSquare, Bookmark, TrendingUp } from 'lucide-react';
import { ApiService } from '../../services/api';

interface PostStatsModalProps {
  postId: string;
  onClose: () => void;
}

interface StatsData {
  views: number;
  likes: number;
  reposts: number;
  replies: number;
  bookmarks: number;
  engagement_rate: number;
  reach_7d: Array<{ day?: string; views?: number }>;
  top_referrers: Array<{ referrer?: string; count?: number }>;
}

export const PostStatsModal: React.FC<PostStatsModalProps> = ({ postId, onClose }) => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    ApiService.getPostStats(postId)
      .then((res: any) => {
        if (!cancelled) {
          setStats(res);
          setIsLoading(false);
        }
      })
      .catch((err: any) => {
        if (!cancelled) {
          setError(err?.message || 'Statistiques indisponibles.');
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [postId]);

  const maxReach = stats?.reach_7d?.length
    ? Math.max(1, ...stats.reach_7d.map((d) => Number(d.views || 0)))
    : 1;

  const cards = stats
    ? [
        { icon: Eye, label: 'Vues', value: stats.views },
        { icon: Heart, label: 'Likes', value: stats.likes },
        { icon: Repeat, label: 'Reposts', value: stats.reposts },
        { icon: MessageSquare, label: 'Réponses', value: stats.replies },
        { icon: Bookmark, label: 'Favoris', value: stats.bookmarks },
        { icon: TrendingUp, label: "Taux d'engagement", value: `${stats.engagement_rate} %` },
      ]
    : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl animate-scaleUp max-h-[90dvh] overflow-y-auto">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center sticky top-0 bg-zinc-950">
          <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
            Statistiques du post
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-10 text-zinc-400 text-sm">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Chargement des statistiques…</span>
            </div>
          )}
          {error && !isLoading && (
            <p className="py-10 text-center text-sm text-red-400">{error}</p>
          )}
          {stats && !isLoading && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {cards.map((c) => (
                  <div key={c.label} className="rounded-2xl bg-zinc-900 border border-zinc-800 p-3">
                    <c.icon className="w-4 h-4 text-zinc-400" />
                    <p className="mt-1.5 text-lg font-bold text-white">{c.value}</p>
                    <p className="text-[11px] text-zinc-500">{c.label}</p>
                  </div>
                ))}
              </div>

              <p className="mt-4 mb-2 text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                Portée — 7 derniers jours
              </p>
              {stats.reach_7d?.length > 0 ? (
                <div className="flex items-end gap-1.5 h-24 rounded-2xl bg-zinc-900 border border-zinc-800 p-3">
                  {stats.reach_7d.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                      <div
                        className="w-full rounded-t-md bg-white/80"
                        style={{ height: `${Math.max(4, (Number(d.views || 0) / maxReach) * 100)}%` }}
                        title={`${d.day || ''} : ${d.views || 0} vues`}
                      />
                      <span className="text-[9px] font-mono text-zinc-600 truncate w-full text-center">
                        {(d.day || '').slice(5)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-600 rounded-2xl bg-zinc-900 border border-zinc-800 p-3">
                  Historique détaillé bientôt disponible — les compteurs ci-dessus sont en direct.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
