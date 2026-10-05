/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — HOME PAGE (src/pages/HomePage.tsx)
 * Timeline: Pour Vous, Abonnements & Tendances avec scroll infini,
 * pull-to-refresh mobile et bouton « nouvelles vibes »
 * ============================================================================
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, PenSquare, TrendingUp, X, ArrowUp } from 'lucide-react';
import { PostComposer } from '../components/feed/PostComposer';
import { PostCard } from '../components/feed/PostCard';
import { ExplainModal } from '../components/feed/ExplainModal';
import { PostCardSkeleton } from '../components/common/PageSkeleton';
import { VibeLogo } from '../components/layout/VibeLogo';
import type { Post } from '../types/vibe';
import { ApiService } from '../services/api';
import { useInfiniteFeed } from '../hooks/useInfiniteFeed';
import { haptics } from '../services/haptics';
import { useMotionPrefs } from '../hooks/useMotionPrefs';

interface HomePageProps {
  onOpenThread: (post: Post) => void;
  onOpenProfile: (username: string) => void;
}

/** Pull-to-refresh mobile : déclenché au-delà de 60px de sur-scroll avec retour haptique. */
function usePullToRefresh(onRefresh: () => void, enabled: boolean) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const hasTriggeredThresholdHaptic = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY <= 0) {
        startY.current = e.touches[0].clientY;
        hasTriggeredThresholdHaptic.current = false;
      } else {
        startY.current = null;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (startY.current == null || isRefreshing) return;
      const dist = e.touches[0].clientY - startY.current;
      if (dist > 0 && window.scrollY <= 0) {
        const calculated = Math.min(90, dist * 0.5);
        setPullDistance(calculated);
        if (calculated >= 60 && !hasTriggeredThresholdHaptic.current) {
          hasTriggeredThresholdHaptic.current = true;
          haptics.pullRefresh();
        } else if (calculated < 60 && hasTriggeredThresholdHaptic.current) {
          hasTriggeredThresholdHaptic.current = false;
        }
      }
    };
    const onTouchEnd = async () => {
      if (pullDistance >= 60 && !isRefreshing) {
        setIsRefreshing(true);
        try {
          await onRefresh();
          haptics.success();
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
      }
      startY.current = null;
      hasTriggeredThresholdHaptic.current = false;
    };
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [enabled, onRefresh, pullDistance, isRefreshing]);

  return { pullDistance, isRefreshing };
}

export const HomePage: React.FC<HomePageProps> = ({ onOpenThread, onOpenProfile }) => {
  const [feedType, setFeedType] = useState<'for_you' | 'stream' | 'trending'>('for_you');
  const { animationsEnabled } = useMotionPrefs();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [trends, setTrends] = useState<Array<{ tag: string; category?: string; posts: string }>>([]);
  const [selectedPostForExplain, setSelectedPostForExplain] = useState<Post | null>(null);

  const fetchPage = useCallback(
    async (cursor?: string) => {
      const data = await ApiService.getFeed(feedType, selectedTag || undefined, cursor);
      if (!cursor) ApiService.prefetchProfiles(data.posts || []);
      return { items: (data.posts || []) as Post[], nextCursor: data.nextCursor };
    },
    [feedType, selectedTag]
  );

  const {
    items: posts,
    isLoading,
    isLoadingMore,
    error: fetchError,
    sentinelRef,
    refresh,
    prependItems,
    removeItem,
  } = useInfiniteFeed<Post>({ fetchPage, resetKey: `${feedType}:${selectedTag}` });

  const { pullDistance, isRefreshing } = usePullToRefresh(refresh, feedType === 'for_you');

  // Bouton « N nouvelles vibes » : détection discrète de nouveaux posts
  const [newCount, setNewCount] = useState(0);
  const lastTopIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (posts.length > 0 && !lastTopIdRef.current) lastTopIdRef.current = String(posts[0].id);
  }, [posts]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (document.hidden || isLoading) return;
      try {
        const data = await ApiService.getFeed(feedType, selectedTag || undefined);
        const fresh = data.posts || [];
        const topId = lastTopIdRef.current;
        if (!topId) return;
        const count = fresh.findIndex((p) => String(p.id) === topId);
        setNewCount(count === -1 ? Math.min(20, fresh.length) : count);
      } catch {}
    }, 45000);
    return () => clearInterval(interval);
  }, [feedType, selectedTag, isLoading]);

  // Événements « feed_refresh » (composer, mAI) : prepend du nouveau post si fourni,
  // sinon rafraîchissement complet
  useEffect(() => {
    const handleRefresh = (e: any) => {
      if (e?.detail?.post) {
        lastTopIdRef.current = String(e.detail.post.id);
        setNewCount(0);
        prependItems([e.detail.post]);
      } else {
        refresh();
      }
    };
    window.addEventListener('vibe:feed_refresh', handleRefresh);
    return () => window.removeEventListener('vibe:feed_refresh', handleRefresh);
  }, [refresh, prependItems]);

  useEffect(() => {
    ApiService.getTrends()
      .then((res) => {
        if (res?.trends) setTrends(res.trends);
      })
      .catch(() => {});
  }, []);

  const handlePostDeleted = useCallback(
    (postId: string) => removeItem(postId),
    [removeItem]
  );

  const handleOpenExplain = useCallback(
    (p: Post) => setSelectedPostForExplain(p),
    []
  );

  const handleSelectTag = (tag: string) => {
    haptics.light();
    if (selectedTag === tag) {
      setSelectedTag(null);
    } else {
      setSelectedTag(tag);
      setFeedType('trending');
    }
  };

  const showNewPosts = () => {
    haptics.light();
    lastTopIdRef.current = null;
    setNewCount(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    refresh();
  };

  return (
    <div className="flex-1 min-h-screen border-r border-zinc-800 bg-black pb-8 select-none">
      {/* Pull-to-refresh (mobile) */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="flex justify-center items-center overflow-hidden transition-[height]"
          style={{ height: isRefreshing ? 44 : pullDistance }}
        >
          <RefreshIcon spinning={isRefreshing || pullDistance >= 60} />
        </div>
      )}

      {/* Sticky Top Header with 3 Feed Tabs */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-black/80 border-b border-zinc-800">
        <div className="flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="sm:hidden shrink-0">
              <VibeLogo size={24} showText={false} />
            </div>
            <h1 className="text-base font-bold text-white tracking-tight">Accueil</h1>
            {selectedTag && (
              <span className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-700 text-white font-mono">
                <span>{selectedTag}</span>
                <button
                  onClick={() => {
                    haptics.light();
                    setSelectedTag(null);
                  }}
                  className="hover:text-zinc-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
          <button
            onClick={() => {
              haptics.light();
              refresh();
            }}
            title="Rafraîchir le flux"
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <RefreshIcon spinning={isLoading} />
          </button>
        </div>

        {/* Mode Switcher: Pour Vous vs Abonnements vs Tendances */}
        <div className="flex border-t border-zinc-800 bg-zinc-950/60">
          <button
            onClick={() => {
              haptics.light();
              setSelectedTag(null);
              setFeedType('for_you');
            }}
            className="flex-1 py-3 text-center text-xs font-semibold uppercase tracking-wider relative transition-colors hover:bg-zinc-900/50"
          >
            <span className={feedType === 'for_you' ? 'text-white font-bold' : 'text-zinc-500'}>
              Pour Vous
            </span>
            {feedType === 'for_you' && (
              animationsEnabled ? (
                <motion.div layoutId="home-tab-indicator" transition={{ type: 'spring', stiffness: 500, damping: 32 }} className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-white rounded-full" />
              ) : (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-white rounded-full" />
              )
            )}
          </button>

          <button
            onClick={() => {
              haptics.light();
              setSelectedTag(null);
              setFeedType('stream');
            }}
            className="flex-1 py-3 text-center text-xs font-semibold uppercase tracking-wider relative transition-colors hover:bg-zinc-900/50"
          >
            <span className={feedType === 'stream' ? 'text-white font-bold' : 'text-zinc-500'}>
              Abonnements
            </span>
            {feedType === 'stream' && (
              animationsEnabled ? (
                <motion.div layoutId="home-tab-indicator" transition={{ type: 'spring', stiffness: 500, damping: 32 }} className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-white rounded-full" />
              ) : (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-white rounded-full" />
              )
            )}
          </button>

          <button
            onClick={() => {
              haptics.light();
              setFeedType('trending');
            }}
            className="flex-1 py-3 text-center text-xs font-semibold uppercase tracking-wider relative transition-colors hover:bg-zinc-900/50 flex items-center justify-center gap-1.5"
          >
            <TrendingUp className={`w-3.5 h-3.5 ${feedType === 'trending' ? 'text-white' : 'text-zinc-500'}`} />
            <span className={feedType === 'trending' ? 'text-white font-bold' : 'text-zinc-500'}>
              Tendances
            </span>
            {feedType === 'trending' && (
              animationsEnabled ? (
                <motion.div layoutId="home-tab-indicator" transition={{ type: 'spring', stiffness: 500, damping: 32 }} className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-white rounded-full" />
              ) : (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-white rounded-full" />
              )
            )}
          </button>
        </div>
      </header>

      {/* Main Post Composer */}
      <PostComposer
        onPostCreated={() => {
          // Le composer émet vibe:feed_refresh avec le post créé
        }}
      />

      {/* Bouton « N nouvelles vibes » */}
      {newCount > 0 && (
        <div className="sticky top-[104px] z-15 flex justify-center pointer-events-none animate-slideDown">
          <button
            onClick={showNewPosts}
            className="pointer-events-auto -mt-3 mb-2 px-4 py-1.5 rounded-full bg-white text-black text-xs font-bold shadow-xl hover:brightness-90 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            {newCount} nouvelle{newCount > 1 ? 's' : ''} vibe{newCount > 1 ? 's' : ''}
          </button>
        </div>
      )}

      {/* Trending Hashtags Quick Strip */}
      {feedType === 'trending' && trends.length > 0 && (
        <div className="p-3 bg-zinc-950/80 border-b border-zinc-900 overflow-x-auto flex items-center gap-2 no-scrollbar">
          <span className="text-[11px] font-mono text-zinc-500 uppercase shrink-0 pl-1">Hashtags du moment :</span>
          {trends.map((item) => {
            const isSelected = selectedTag === item.tag;
            return (
              <button
                key={item.tag}
                onClick={() => handleSelectTag(item.tag)}
                className={`px-3 py-1 rounded-full text-xs font-mono transition-all shrink-0 flex items-center gap-1 ${
                  isSelected
                    ? 'bg-white text-black font-bold'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-white'
                }`}
              >
                <span>{item.tag}</span>
                <span className={`text-[10px] ${isSelected ? 'text-zinc-600' : 'text-zinc-500'}`}>
                  {item.posts.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Feed Stream */}
      <div className="divide-y divide-zinc-900">
        {fetchError && (
          <div className="p-6 m-4 rounded-3xl bg-zinc-950 border border-zinc-800 text-center space-y-3">
            <AlertCircle className="w-5 h-5 mx-auto text-zinc-400" />
            <p className="text-xs text-zinc-400">{fetchError}</p>
            <button
              onClick={refresh}
              className="py-1.5 px-4 rounded-full bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-all"
            >
              Réessayer
            </button>
          </div>
        )}

        {isLoading && posts.length === 0
          ? [0, 1, 2, 3].map((i) => <PostCardSkeleton key={i} />)
          : posts.map((post, i) => (
              <div
                key={post.id}
                className="vibe-stagger-item"
                style={{ '--vibe-delay': `${Math.min(i, 8) * 35}ms` } as React.CSSProperties}
              >
                <PostCard
                  post={post}
                  onOpenThread={onOpenThread}
                  onOpenProfile={onOpenProfile}
                  onPostDeleted={handlePostDeleted}
                  onOpenExplain={handleOpenExplain}
                />
              </div>
            ))}

        {/* Sentinelle du scroll infini + loader de fin de liste */}
        <div ref={sentinelRef} className="h-1" />
        {isLoadingMore && <div className="feed-end-loader" aria-label="Chargement" />}

        {!isLoading && posts.length === 0 && !fetchError && (
          <div className="p-12 sm:p-16 text-center space-y-4 max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
              <PenSquare className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                {feedType === 'trending' ? 'Aucune tendance pour le moment' : 'Aucune vibe'}
              </h3>
              <p className="text-xs text-zinc-500">
                {feedType === 'trending'
                  ? 'Soyez le premier à lancer un sujet populaire avec un #hashtag !'
                  : 'Poster votre première vibe ci-dessus pour animer votre communauté.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* AI Explain Modal */}
      {selectedPostForExplain && (
        <ExplainModal
          post={selectedPostForExplain}
          isOpen={!!selectedPostForExplain}
          onClose={() => setSelectedPostForExplain(null)}
        />
      )}
    </div>
  );
};

const RefreshIcon: React.FC<{ spinning?: boolean }> = ({ spinning }) => (
  <svg
    className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 1 1-2.64-6.36" />
    <path d="M21 3v6h-6" />
  </svg>
);
