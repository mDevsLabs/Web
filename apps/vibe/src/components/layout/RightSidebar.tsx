/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — RIGHT SIDEBAR (src/components/layout/RightSidebar.tsx)
 * Search Bar, Real Dynamic Trends & Suggested Accounts (Quotas Removed)
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, ArrowUpRight } from 'lucide-react';
import { ApiService } from '../../services/api';
import { ProfileAvatar } from '../common/ProfileAvatar';
import { VerifiedBadge } from '../common/VerifiedBadge';

interface RightSidebarProps {
  onSearch?: (query: string) => void;
  onSelectTopic?: (topic: string) => void;
  onOpenProfile?: (username: string) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  onSearch,
  onSelectTopic,
  onOpenProfile,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [trends, setTrends] = useState<Array<{ tag: string; category?: string; posts: string }>>([]);
  const [isLoadingTrends, setIsLoadingTrends] = useState(false);

  useEffect(() => {
    // Load suggested users
    ApiService.getSuggestedUsers()
      .then((res) => {
        if (res?.users) {
          setSuggestedUsers(res.users);
        }
      })
      .catch(() => {});

    // Load real dynamic trends from DB
    setIsLoadingTrends(true);
    ApiService.getTrends()
      .then((res) => {
        if (res?.trends) {
          setTrends(res.trends);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingTrends(false));
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim() && onSearch) {
      onSearch(searchInput.trim());
    }
  };

  return (
    <aside className="hidden lg:flex flex-col w-80 xl:w-96 p-4 space-y-4 border-l border-zinc-800 bg-black min-h-screen sticky top-0 select-none">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Rechercher sur Vibe ou par #tag..."
          className="w-full pl-10 pr-4 py-2.5 rounded-full bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
        />
      </form>

      {/* Real Dynamic Trends */}
      <div className="p-4 rounded-3xl bg-zinc-950 border border-zinc-800/90 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-white" />
            <h3 className="text-sm font-bold text-white tracking-tight">Tendances pour vous</h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">Temps réel</span>
        </div>

        <div className="divide-y divide-zinc-900">
          {trends.map((item) => (
            <div
              key={item.tag}
              onClick={() => onSelectTopic && onSelectTopic(item.tag)}
              className="py-2.5 flex items-center justify-between group cursor-pointer"
            >
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-white group-hover:underline flex items-center gap-1">
                  {item.tag}
                </p>
                <span className="text-[11px] text-zinc-500">{item.posts}</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:border-zinc-600 transition-all">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
          ))}

          {trends.length === 0 && (
            <div className="py-6 text-center text-xs text-zinc-500">
              {isLoadingTrends ? 'Chargement des tendances...' : 'Aucune tendance pour le moment.'}
            </div>
          )}
        </div>
      </div>

      {/* Real Registered Accounts Suggestions */}
      {suggestedUsers.length > 0 && (
        <div className="p-4 rounded-3xl bg-zinc-950 border border-zinc-800/90 space-y-3">
          <h3 className="text-sm font-bold text-white tracking-tight">Comptes à découvrir</h3>
          <div className="divide-y divide-zinc-900">
            {suggestedUsers.map((acc) => (
              <div
                key={acc.id}
                className="py-2.5 flex items-center justify-between gap-3 group cursor-pointer"
                onClick={() => onOpenProfile && onOpenProfile(acc.username)}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <ProfileAvatar
                    src={acc.avatar_url}
                    alt={acc.username}
                    fallbackName={acc.username}
                    size="md"
                    className="border border-zinc-800 shrink-0"
                  />
                  <div className="truncate">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-white group-hover:underline truncate">
                        {acc.display_name || acc.username}
                      </span>
                      <VerifiedBadge isVerified={acc.is_verified} tier={acc.tier} size="xs" />
                    </div>
                    <span className="text-[11px] text-zinc-500 font-mono">@{acc.username}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onOpenProfile) onOpenProfile(acc.username);
                  }}
                  className="py-1 px-3 rounded-full bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-all shrink-0"
                >
                  Voir
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};
