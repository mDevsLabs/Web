/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — GLOBAL SEARCH BAR (src/components/layout/GlobalSearchBar.tsx)
 * Barre de recherche universelle : Posts, Utilisateurs, Vibe Books, messages DM.
 * Debounce 300 ms, dropdown 4 sections, Entrée → /explore?q=…, ferme au clic extérieur.
 * ============================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon as Search, FileTextIcon as FileText, UsersIcon as Users, BookHeartIcon as BookHeart, MessageSquareIcon as MessageSquare, Loader2Icon as Loader2, XIcon as X } from "@mdevs/icons";
import { ApiService } from '../../services/api';
import type { UnifiedSearchResult } from '../../types/vibe';
import { makeExcerpt } from '../common/richTextUtils';

interface GlobalSearchBarProps {
  autoFocus?: boolean;
  onNavigate?: () => void;
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({ autoFocus, onNavigate }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UnifiedSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // Fermeture au clic extérieur
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setResults(null);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await ApiService.searchUnified(q, 5);
        setResults(res);
        setIsOpen(true);
      } catch {
        setResults(null);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const go = (path: string) => {
    setIsOpen(false);
    setQuery('');
    setResults(null);
    onNavigate?.();
    navigate(path);
  };

  const submitFullSearch = () => {
    const q = query.trim();
    if (!q) return;
    go(`/explore?q=${encodeURIComponent(q)}`);
  };

  const hasAny =
    results &&
    (results.posts.length > 0 ||
      results.users.length > 0 ||
      results.books.length > 0 ||
      results.messages.length > 0);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex items-center gap-2 rounded-full bg-zinc-950 border border-zinc-800 px-3 py-2 focus-within:border-zinc-600 transition-colors">
        {isSearching ? (
          <Loader2 className="w-4 h-4 text-zinc-500 animate-spin shrink-0" />
        ) : (
          <Search className="w-4 h-4 text-zinc-500 shrink-0" />
        )}
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results && setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitFullSearch();
            if (e.key === 'Escape') setIsOpen(false);
          }}
          placeholder="Rechercher posts, comptes, livres, messages…"
          className="flex-1 min-w-0 bg-transparent outline-none text-sm text-white placeholder:text-zinc-600"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults(null);
              inputRef.current?.focus();
            }}
            className="text-zinc-500 hover:text-white transition-colors"
            title="Effacer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && results && query.trim().length >= 2 && (
        <div className="absolute top-full mt-2 left-0 right-0 xl:right-auto xl:w-96 max-h-[70vh] overflow-y-auto rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl z-50">
          {!hasAny && !isSearching && (
            <div className="p-4 text-center">
              <p className="text-xs text-zinc-500">Aucun résultat pour « {query.trim()} »</p>
              <button
                onClick={submitFullSearch}
                className="mt-2 text-xs font-semibold text-white underline underline-offset-2"
              >
                Voir la recherche complète
              </button>
            </div>
          )}

          {results.posts.length > 0 && (
            <div className="p-2 border-b border-zinc-900">
              <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <FileText className="w-3 h-3" /> Publications
              </p>
              {results.posts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => go(`/post/${p.id}`)}
                  className="w-full text-left px-2 py-1.5 rounded-xl hover:bg-zinc-900 transition-colors"
                >
                  <p className="text-xs text-white truncate">{makeExcerpt(p.content, 80) || '(sans texte)'}</p>
                  <p className="text-[11px] text-zinc-500">@{p.username}</p>
                </button>
              ))}
            </div>
          )}

          {results.users.length > 0 && (
            <div className="p-2 border-b border-zinc-900">
              <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <Users className="w-3 h-3" /> Comptes
              </p>
              {results.users.map((u) => (
                <button
                  key={String(u.id)}
                  onClick={() => go(`/@${u.username}`)}
                  className="w-full text-left px-2 py-1.5 rounded-xl hover:bg-zinc-900 transition-colors"
                >
                  <p className="text-xs text-white font-semibold">@{u.username}</p>
                  {u.display_name && <p className="text-[11px] text-zinc-500 truncate">{u.display_name}</p>}
                </button>
              ))}
            </div>
          )}

          {results.books.length > 0 && (
            <div className="p-2 border-b border-zinc-900">
              <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <BookHeart className="w-3 h-3" /> Livres
              </p>
              {results.books.map((b) => (
                <button
                  key={b.id}
                  onClick={() => go(`/books/${b.id}`)}
                  className="w-full text-left px-2 py-1.5 rounded-xl hover:bg-zinc-900 transition-colors"
                >
                  <p className="text-xs text-white font-semibold truncate">{b.title}</p>
                </button>
              ))}
            </div>
          )}

          {results.messages.length > 0 && (
            <div className="p-2">
              <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3" /> Messages
              </p>
              {results.messages.map((m) => (
                <button
                  key={m.id}
                  onClick={() => go(`/messages?partner=${m.sender_id}`)}
                  className="w-full text-left px-2 py-1.5 rounded-xl hover:bg-zinc-900 transition-colors"
                >
                  <p className="text-xs text-white truncate">{makeExcerpt(m.content, 80)}</p>
                </button>
              ))}
            </div>
          )}

          {hasAny && (
            <button
              onClick={submitFullSearch}
              className="w-full p-2.5 text-center text-xs font-bold text-zinc-300 hover:text-white hover:bg-zinc-900 border-t border-zinc-900 transition-colors"
            >
              Voir tous les résultats ({results.total}) ↵
            </button>
          )}
        </div>
      )}
    </div>
  );
};
