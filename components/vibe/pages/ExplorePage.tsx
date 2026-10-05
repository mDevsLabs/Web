/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — EXPLORE PAGE (src/pages/ExplorePage.tsx)
 * Recherche multi-catégories : Comptes, Hashtags, Publications
 * Découverte : Top Vibe, Top Vibers, Tendances (6 en grille), Vibers à découvrir
 * ============================================================================
 */

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ChevronRight,
  Crown,
  FileText,
  Hash,
  Heart,
  Loader2,
  Search,
  Sparkles,
  TrendingUp,
  Trophy,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ProfileAvatar } from "@/components/vibe/common/ProfileAvatar";
import { makeExcerpt } from "@/components/vibe/common/richTextUtils";
import { VerifiedBadge } from "@/components/vibe/common/VerifiedBadge";
import { PostCard } from "@/components/vibe/feed/PostCard";
import { formatCompactCount } from "@/lib/vibe/algorithms";
import { ApiService } from "@/lib/vibe/services/api";
import { haptics } from "@/lib/vibe/services/haptics";
import { NotificationService } from "@/lib/vibe/services/notificationService";
import type { Post } from "@/lib/vibe/types/vibe";
import { useLocation } from "../router";

interface ExplorePageProps {
  onOpenProfile: (username: string) => void;
  onOpenThread: (post: Post) => void;
}

type SearchTab = "posts" | "accounts" | "hashtags";

interface UserResult {
  avatar_url?: string;
  bio?: string;
  display_name?: string;
  followers_count?: number;
  id: number;
  is_following?: boolean;
  is_verified?: boolean;
  username: string;
}

interface TrendItem {
  category?: string;
  post_count?: number;
  posts: string;
  tag: string;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({
  onOpenProfile,
  onOpenThread,
}) => {
  const location = useLocation();
  const [query, setQuery] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get("q") || "";
    } catch {
      return "";
    }
  });
  const [activeTab, setActiveTab] = useState<SearchTab>("posts");
  const [hasSearched, setHasSearched] = useState(false);

  // Results
  const [postResults, setPostResults] = useState<Post[]>([]);
  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [hashtagResults, setHashtagResults] = useState<TrendItem[]>([]);

  // Loading states
  const [isSearching, setIsSearching] = useState(false);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [isLoadingTrends, setIsLoadingTrends] = useState(true);

  // Découverte : Top Vibe, Top Vibers, Vibers à découvrir
  const [topPosts, setTopPosts] = useState<Post[]>([]);
  const [topVibers, setTopVibers] = useState<UserResult[]>([]);
  const [discoverVibers, setDiscoverVibers] = useState<UserResult[]>([]);
  const [isLoadingDiscovery, setIsLoadingDiscovery] = useState(true);
  const [followOverrides, setFollowOverrides] = useState<
    Record<string, boolean>
  >({});
  const [followBusy, setFollowBusy] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Chargement des tendances réelles ────────────────────────────────────
  const fetchTrends = useCallback(async () => {
    setIsLoadingTrends(true);
    try {
      const res = await ApiService.getTrends();
      if (res?.trends) setTrends(res.trends);
      else setTrends([]);
    } catch {
      setTrends([]);
    } finally {
      setIsLoadingTrends(false);
    }
  }, []);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  // ─── Chargement de la découverte (Top Vibe / Top Vibers / suggestions) ───
  const fetchDiscovery = useCallback(async () => {
    setIsLoadingDiscovery(true);
    const [postsRes, vibersRes, suggestionsRes] = await Promise.allSettled([
      ApiService.getTopPosts(5, 30),
      // Jusqu'à 10 lignes : les comptes à 0 abonné figurent dans le classement
      // tant que moins de 10 comptes ont des abonnés (tri décroissant conservé).
      ApiService.getTopVibers(10),
      ApiService.getOnboardingSuggestions(),
    ]);
    if (postsRes.status === "fulfilled")
      setTopPosts(postsRes.value?.posts || []);
    if (vibersRes.status === "fulfilled")
      setTopVibers(vibersRes.value?.users || []);
    if (suggestionsRes.status === "fulfilled")
      setDiscoverVibers((suggestionsRes.value?.users || []).slice(0, 5));
    setIsLoadingDiscovery(false);
  }, []);

  useEffect(() => {
    fetchDiscovery();
  }, [fetchDiscovery]);

  const isFollowingUser = useCallback(
    (u: UserResult) => followOverrides[u.username] ?? Boolean(u.is_following),
    [followOverrides]
  );

  const handleToggleFollow = async (u: UserResult) => {
    if (followBusy) return;
    haptics.light();
    const next = !isFollowingUser(u);
    setFollowOverrides((m) => ({ ...m, [u.username]: next }));
    setFollowBusy(u.username);
    try {
      const res = await ApiService.toggleFollow(u.username);
      setFollowOverrides((m) => ({
        ...m,
        [u.username]: Boolean(res?.following ?? next),
      }));
    } catch {
      setFollowOverrides((m) => {
        const copy = { ...m };
        delete copy[u.username];
        return copy;
      });
      haptics.error();
      NotificationService.showInAppToast(
        "Erreur",
        "Impossible de mettre à jour l'abonnement.",
        "error"
      );
    } finally {
      setFollowBusy(null);
    }
  };

  // ─── Recherche multi-catégories ────────────────────────────────────────────
  const performSearch = useCallback(
    async (q: string, overrideTab?: SearchTab) => {
      if (!q.trim()) {
        setHasSearched(false);
        setPostResults([]);
        setUserResults([]);
        setHashtagResults([]);
        return;
      }

      setIsSearching(true);
      setHasSearched(true);

      const cleanQ = q.trim();
      const isHashtag = cleanQ.startsWith("#");
      const searchQ = isHashtag ? cleanQ.replace(/^#/, "") : cleanQ;

      // Lance les 3 recherches en parallèle
      const [postsRes, usersRes, trendsRes] = await Promise.allSettled([
        // Publications — nouvelle API recherche backend dédiée avec fallback
        ApiService.searchPosts(cleanQ)
          .then((res) => {
            if (res?.posts && res.posts.length > 0) return res.posts;
            return ApiService.getFeed(
              "trending",
              isHashtag ? searchQ : undefined
            ).then((f) => {
              if (!f?.posts) return [];
              if (isHashtag) return f.posts;
              return f.posts.filter(
                (p) =>
                  (p.content || "")
                    .toLowerCase()
                    .includes(cleanQ.toLowerCase()) ||
                  (p.username || "")
                    .toLowerCase()
                    .includes(cleanQ.toLowerCase()) ||
                  (p.display_name || "")
                    .toLowerCase()
                    .includes(cleanQ.toLowerCase())
              );
            });
          })
          .catch(async () => {
            const f = await ApiService.getFeed(
              "trending",
              isHashtag ? searchQ : undefined
            );
            return f?.posts || [];
          }),

        // Comptes
        ApiService.searchUsers(cleanQ).then((res) => res?.users || []),

        // Hashtags — depuis les tendances courantes
        ApiService.getTrends().then((res) => {
          if (!res?.trends) return [];
          return res.trends.filter((t) =>
            t.tag.toLowerCase().includes(searchQ.toLowerCase())
          );
        }),
      ]);

      setPostResults(postsRes.status === "fulfilled" ? postsRes.value : []);
      setUserResults(usersRes.status === "fulfilled" ? usersRes.value : []);
      setHashtagResults(
        trendsRes.status === "fulfilled" ? trendsRes.value : []
      );

      // Sélectionner l'onglet demandé ou le plus pertinent
      if (overrideTab) {
        setActiveTab(overrideTab);
      } else if (isHashtag) {
        setActiveTab("hashtags");
      } else if (
        usersRes.status === "fulfilled" &&
        usersRes.value.length >
          (postsRes.status === "fulfilled" ? postsRes.value.length : 0)
      ) {
        setActiveTab("accounts");
      } else {
        setActiveTab("posts");
      }

      setIsSearching(false);
    },
    []
  );

  // Détection des URL query params (ex: ?q=%23tech&tab=hashtags)
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const urlQ = params.get("q");
      const urlTab = params.get("tab") as SearchTab | null;
      if (urlQ && urlQ !== query) {
        setQuery(urlQ);
        performSearch(urlQ, urlTab || undefined);
      } else if (urlQ && !hasSearched) {
        performSearch(urlQ, urlTab || undefined);
      }
    } catch {}
  }, [location.search, performSearch, query, hasSearched]);

  // Debounce automatique à la frappe
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (query.trim().length >= 1) performSearch(query);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, performSearch]);

  const handleClear = () => {
    haptics.light();
    setQuery("");
    setHasSearched(false);
    setPostResults([]);
    setUserResults([]);
    setHashtagResults([]);
    inputRef.current?.focus();
  };

  const handleTrendClick = (tag: string) => {
    haptics.light();
    const formattedTag = tag.startsWith("#") ? tag : `#${tag}`;
    setQuery(formattedTag);
    performSearch(formattedTag, "hashtags");
  };

  const handleInputChange = (val: string) => {
    setQuery(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") performSearch(query);
  };

  // ─── Ligne « Viber » (Top Vibers & suggestions) ───────────────────────────
  const renderViberRow = (u: UserResult, idx: number, showRank: boolean) => {
    const following = isFollowingUser(u);
    return (
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-900/60 cursor-pointer transition-colors"
        initial={{ opacity: 0, y: 6 }}
        key={u.username}
        onClick={() => onOpenProfile(u.username)}
        transition={{ delay: idx * 0.04, duration: 0.25 }}
      >
        {showRank && (
          <span
            className={`w-6 text-center font-mono text-xs font-bold shrink-0 ${
              idx === 0
                ? "text-amber-300"
                : idx === 1
                  ? "text-zinc-300"
                  : "text-zinc-600"
            }`}
          >
            #{idx + 1}
          </span>
        )}
        <ProfileAvatar
          alt={u.username}
          fallbackName={u.username}
          size="sm"
          src={u.avatar_url}
        />
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-white truncate">
              {u.display_name || `@${u.username}`}
            </span>
            <VerifiedBadge isVerified={u.is_verified} size="xs" />
          </span>
          <span className="block text-[10px] text-zinc-500 truncate">
            @{u.username} · {formatCompactCount(u.followers_count)} abonné
            {(u.followers_count || 0) > 1 ? "s" : ""}
          </span>
        </span>
        <button
          className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors disabled:opacity-50 ${
            following
              ? "border-zinc-700 text-zinc-300 bg-zinc-800/80 hover:bg-zinc-800"
              : "border-sky-500/40 text-sky-300 bg-sky-500/10 hover:bg-sky-500/20"
          }`}
          disabled={followBusy === u.username}
          onClick={(e) => {
            e.stopPropagation();
            handleToggleFollow(u);
          }}
          title={following ? "Ne plus suivre" : "Suivre"}
        >
          {followBusy === u.username ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : following ? (
            <UserCheck className="w-3 h-3" />
          ) : (
            <UserPlus className="w-3 h-3" />
          )}
          {following ? "Suivi" : "Suivre"}
        </button>
      </motion.div>
    );
  };

  // ─── Onglets de résultats ─────────────────────────────────────────────────
  const tabs: {
    id: SearchTab;
    label: string;
    icon: React.ReactNode;
    count: number;
  }[] = [
    {
      count: postResults.length,
      icon: <FileText className="w-3.5 h-3.5" />,
      id: "posts",
      label: "Publications",
    },
    {
      count: userResults.length,
      icon: <Users className="w-3.5 h-3.5" />,
      id: "accounts",
      label: "Comptes",
    },
    {
      count: hashtagResults.length,
      icon: <Hash className="w-3.5 h-3.5" />,
      id: "hashtags",
      label: "Hashtags",
    },
  ];

  return (
    <div className="flex-1 min-h-screen border-r border-zinc-800 bg-black pb-8 select-none">
      {/* ─── Sticky Header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-black/90 border-b border-zinc-800/80 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 space-y-3">
        {/* Barre de recherche */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            className="w-full pl-10 pr-9 py-2.5 rounded-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-white transition-colors"
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher sur Vibe..."
            ref={inputRef}
            type="text"
            value={query}
          />
          {query && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
              onClick={handleClear}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Onglets de résultats — visibles seulement si recherche active */}
        {hasSearched && (
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? "bg-white text-black"
                    : "bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
                key={tab.id}
                onClick={() => {
                  haptics.light();
                  setActiveTab(tab.id);
                }}
              >
                {tab.icon}
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                      activeTab === tab.id
                        ? "bg-black/20 text-black"
                        : "bg-zinc-800 text-zinc-500"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ─── Loader de recherche ───────────────────────────────────────────── */}
      {isSearching && (
        <div className="p-8 text-center flex items-center justify-center gap-2 text-xs text-zinc-400">
          <Loader2 className="w-4 h-4 animate-spin text-white" />
          <span>Recherche en cours...</span>
        </div>
      )}

      {/* ─── Résultats de recherche ────────────────────────────────────────── */}
      {hasSearched && !isSearching && (
        <div>
          {/* Header résultats */}
          <div className="px-4 py-3 border-b border-zinc-900 flex items-center justify-between">
            <span className="text-xs text-zinc-500">
              Résultats pour{" "}
              <span className="text-white font-semibold">« {query} »</span>
            </span>
            <span className="text-[11px] text-zinc-600 font-mono">
              {postResults.length + userResults.length + hashtagResults.length}{" "}
              résultat(s)
            </span>
          </div>

          {/* ── Onglet Comptes ─────────────────────────────────────────── */}
          {activeTab === "accounts" && (
            <div className="divide-y divide-zinc-900">
              {userResults.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-500">
                  <Users className="w-8 h-8 text-zinc-800 mx-auto mb-2" />
                  Aucun compte trouvé pour « {query} »
                </div>
              ) : (
                userResults.map((u) => (
                  <button
                    className="w-full flex items-center gap-3 p-4 hover:bg-zinc-900/60 transition-colors text-left"
                    key={u.id}
                    onClick={() => onOpenProfile(u.username)}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {u.avatar_url ? (
                        <img
                          alt={u.username}
                          className="w-11 h-11 rounded-full object-cover bg-zinc-800"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              `https://api.dicebear.com/7.x/initials/svg?seed=${u.username}`;
                          }}
                          src={u.avatar_url}
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-zinc-800 flex items-center justify-center">
                          <span className="text-sm font-bold text-zinc-400">
                            {(u.display_name ||
                              u.username ||
                              "?")[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-white truncate">
                          {u.display_name || u.username}
                        </span>
                        <VerifiedBadge
                          isVerified={u.is_verified}
                          size="xs"
                          tier={(u as any).tier}
                        />
                      </div>
                      <div className="text-xs text-zinc-500">@{u.username}</div>
                      {u.bio && (
                        <div className="text-xs text-zinc-400 mt-0.5 truncate">
                          {u.bio}
                        </div>
                      )}
                      {/* `followers_count` est optionnel : le test de type couvre null ET undefined, ce que `!== null` ne faisait pas. */}
                      {typeof u.followers_count === "number" &&
                        u.followers_count > 0 && (
                          <div className="text-[11px] text-zinc-600 mt-0.5 font-mono">
                            {u.followers_count.toLocaleString("fr-FR")} abonnés
                          </div>
                        )}
                    </div>

                    <ChevronRight className="w-4 h-4 text-zinc-700 flex-shrink-0" />
                  </button>
                ))
              )}
            </div>
          )}

          {/* ── Onglet Hashtags ────────────────────────────────────────── */}
          {activeTab === "hashtags" && (
            <div className="divide-y divide-zinc-900">
              {hashtagResults.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-500">
                  <Hash className="w-8 h-8 text-zinc-800 mx-auto mb-2" />
                  Aucun hashtag trouvé pour « {query} »
                </div>
              ) : (
                hashtagResults.map((item) => (
                  <button
                    className="w-full p-4 hover:bg-zinc-900/60 transition-colors flex items-center justify-between group text-left"
                    key={item.tag}
                    onClick={() => {
                      const tag = item.tag.startsWith("#")
                        ? item.tag
                        : `#${item.tag}`;
                      setQuery(tag);
                      performSearch(tag, "posts");
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0">
                        <Hash className="w-4 h-4 text-zinc-400" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-sm font-bold text-white group-hover:underline">
                          {item.tag}
                        </div>
                        <div className="text-[11px] text-zinc-600 font-mono">
                          {item.posts}
                        </div>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
                  </button>
                ))
              )}
            </div>
          )}

          {/* ── Onglet Publications ────────────────────────────────────── */}
          {activeTab === "posts" && (
            <div>
              {postResults.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-500">
                  <FileText className="w-8 h-8 text-zinc-800 mx-auto mb-2" />
                  Aucune publication trouvée pour « {query} »
                </div>
              ) : (
                <div className="divide-y divide-zinc-900">
                  {postResults.map((post) => (
                    <PostCard
                      key={post.id}
                      onOpenProfile={onOpenProfile}
                      onOpenThread={onOpenThread}
                      post={post}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── Page de découverte (avant toute recherche) ────────────────────── */}
      {!hasSearched && !isSearching && (
        <div className="p-4 space-y-5">
          {/* Top Vibe & Top Vibers côte à côte */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Vibe — meilleures publications (30 jours) */}
            <section className="rounded-3xl bg-zinc-950 border border-zinc-800/90 overflow-hidden">
              <div className="flex items-center gap-2 px-4 pt-4 pb-1">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold text-white">Top Vibe</h2>
                <span className="ml-auto text-[10px] text-zinc-600 font-mono">
                  30 derniers jours
                </span>
              </div>
              {isLoadingDiscovery ? (
                <div className="p-4 space-y-3">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      className="flex items-center gap-3 animate-pulse"
                      key={i}
                    >
                      <div className="w-6 h-3 rounded bg-zinc-800" />
                      <div className="w-8 h-8 rounded-full bg-zinc-800" />
                      <div className="flex-1 h-3 rounded bg-zinc-800" />
                    </div>
                  ))}
                </div>
              ) : topPosts.length === 0 ? (
                <p className="px-4 pb-4 pt-1 text-[11px] text-zinc-600">
                  Pas encore assez d'activité pour un Top Vibe — publiez et
                  engagez !
                </p>
              ) : (
                <div className="pb-2">
                  {topPosts.map((post, idx) => (
                    <motion.button
                      animate={{ opacity: 1, y: 0 }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-900/60 transition-colors text-left"
                      initial={{ opacity: 0, y: 6 }}
                      key={post.id}
                      onClick={() => onOpenThread(post)}
                      transition={{ delay: idx * 0.04, duration: 0.25 }}
                    >
                      <span
                        className={`w-6 text-center font-mono text-xs font-bold shrink-0 ${
                          idx === 0
                            ? "text-amber-300"
                            : idx === 1
                              ? "text-zinc-300"
                              : "text-zinc-600"
                        }`}
                      >
                        #{idx + 1}
                      </span>
                      <ProfileAvatar
                        alt={post.username || "Auteur"}
                        fallbackName={post.username}
                        size="xs"
                        src={post.avatar_url}
                      />
                      <span className="flex-1 min-w-0">
                        <span className="block text-xs text-zinc-200 truncate">
                          {makeExcerpt(post.content, 60) || "Publication"}
                        </span>
                        <span className="block text-[10px] text-zinc-500 truncate">
                          @{post.username}
                        </span>
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-rose-400 shrink-0">
                        <Heart className="w-3 h-3" />
                        {formatCompactCount(post.likes_count)}
                      </span>
                    </motion.button>
                  ))}
                </div>
              )}
            </section>

            {/* Top Vibers — comptes les plus suivis */}
            <section className="rounded-3xl bg-zinc-950 border border-zinc-800/90 overflow-hidden">
              <div className="flex items-center gap-2 px-4 pt-4 pb-1">
                <Crown className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold text-white">Top Vibers</h2>
                <span className="ml-auto text-[10px] text-zinc-600 font-mono">
                  Plus d'abonnés
                </span>
              </div>
              {isLoadingDiscovery ? (
                <div className="p-4 space-y-3">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      className="flex items-center gap-3 animate-pulse"
                      key={i}
                    >
                      <div className="w-6 h-3 rounded bg-zinc-800" />
                      <div className="w-8 h-8 rounded-full bg-zinc-800" />
                      <div className="flex-1 h-3 rounded bg-zinc-800" />
                    </div>
                  ))}
                </div>
              ) : topVibers.length === 0 ? (
                <p className="px-4 pb-4 pt-1 text-[11px] text-zinc-600">
                  Aucun Viber à classer pour le moment.
                </p>
              ) : (
                <div className="pb-2">
                  {topVibers.map((u, idx) => renderViberRow(u, idx, true))}
                </div>
              )}
            </section>
          </div>

          {/* Tendances — 6 max, grille 3 colonnes, effets #1 / #2 */}
          <section>
            <div className="flex items-center gap-2 text-white font-bold text-sm mb-3">
              <TrendingUp className="w-4 h-4 text-white" />
              <span>Tendances</span>
            </div>

            {isLoadingTrends ? (
              <div className="p-6 text-center">
                <Loader2 className="w-5 h-5 text-zinc-600 animate-spin mx-auto" />
              </div>
            ) : trends.length === 0 ? (
              <div className="rounded-3xl bg-zinc-950 border border-zinc-800/90 p-8 text-center space-y-2">
                <TrendingUp className="w-8 h-8 text-zinc-700 mx-auto" />
                <p className="text-xs text-zinc-500">
                  Les tendances apparaissent quand les hashtags deviennent
                  populaires dans les publications.
                </p>
                <p className="text-[11px] text-zinc-600">
                  Publiez des posts avec des{" "}
                  <span className="text-zinc-400">#hashtags</span> pour faire
                  émerger des tendances !
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {trends.slice(0, 6).map((item, idx) => (
                  <button
                    className={`relative p-3 rounded-2xl border text-left transition-all group overflow-hidden ${
                      idx === 0
                        ? "border-amber-400/50 bg-gradient-to-br from-amber-500/10 to-zinc-950 shadow-[0_0_28px_-8px_rgba(251,191,36,0.5)]"
                        : idx === 1
                          ? "border-zinc-400/40 bg-gradient-to-br from-zinc-400/10 to-zinc-950"
                          : "border-zinc-800/90 bg-zinc-950 hover:bg-zinc-900/70"
                    }`}
                    key={item.tag}
                    onClick={() => handleTrendClick(item.tag)}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-mono text-[11px] font-bold ${
                          idx === 0
                            ? "text-amber-300"
                            : idx === 1
                              ? "text-zinc-300"
                              : "text-zinc-600"
                        }`}
                      >
                        #{idx + 1}
                      </span>
                      {idx === 0 ? (
                        <Sparkles className="w-3 h-3 text-amber-300" />
                      ) : (
                        <ArrowUpRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-white transition-colors" />
                      )}
                    </div>
                    <div className="mt-1.5 text-sm font-bold text-white truncate group-hover:underline">
                      {item.tag}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono truncate">
                      {item.posts}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Vibers à découvrir */}
          {discoverVibers.length > 0 && (
            <section className="rounded-3xl bg-zinc-950 border border-zinc-800/90 overflow-hidden">
              <div className="flex items-center gap-2 px-4 pt-4 pb-1">
                <Sparkles className="w-4 h-4 text-sky-300" />
                <h2 className="text-sm font-bold text-white">
                  Vibers à découvrir
                </h2>
              </div>
              <div className="pb-2">
                {discoverVibers.map((u, idx) => renderViberRow(u, idx, false))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
