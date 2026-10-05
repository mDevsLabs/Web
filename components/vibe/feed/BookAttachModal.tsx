/**
 * ============================================================================
 * VIBE — MODALE D'ATTACHEMENT D'UN LIVRE (src/components/feed/BookAttachModal.tsx)
 * Choisir un Livre à référencer dans un post : « Mes Livres » (possédés +
 * rejoints) ou recherche dans les « Livres publics ». Le choix insère une
 * ancre @livre (<a data-book-id>) dans l'éditeur du composeur.
 * ============================================================================
 */

import { BookMarked, Globe, Loader2, Search, X } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { getBookIcon } from "@/components/vibe/common/bookIcons";
import { ApiService } from "@/lib/vibe/services/api";
import { haptics } from "@/lib/vibe/services/haptics";
import type { VibeBook } from "@/lib/vibe/types/vibe";

interface PublicBook {
  icon?: string;
  id: string;
  items_count?: number;
  members_count?: number;
  owner_display_name?: string;
  owner_username?: string;
  title: string;
}

interface BookAttachModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (book: { id: string; title: string }) => void;
}

export const BookAttachModal: React.FC<BookAttachModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const [tab, setTab] = useState<"mine" | "public">("mine");
  const [myBooks, setMyBooks] = useState<VibeBook[]>([]);
  const [isLoadingMine, setIsLoadingMine] = useState(false);
  const [query, setQuery] = useState("");
  const [publicBooks, setPublicBooks] = useState<PublicBook[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTab("mine");
    setQuery("");
    setPublicBooks([]);
    setIsLoadingMine(true);
    ApiService.getBooks()
      .then((res) => setMyBooks(res?.books || []))
      .catch(() => setMyBooks([]))
      .finally(() => setIsLoadingMine(false));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || tab !== "public") return;
    const q = query.trim();
    if (q.length < 2) {
      setPublicBooks([]);
      return;
    }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    setIsSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await ApiService.searchPublicBooks(q);
        setPublicBooks((res as any)?.books || []);
      } catch {
        setPublicBooks([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [isOpen, tab, query]);

  if (!isOpen) return null;

  const handlePick = (book: { id: string; title: string }) => {
    haptics.success();
    onSelect(book);
    onClose();
  };

  const renderBookRow = (
    book: { id: string; title: string; icon?: string },
    subtitle: string
  ) => {
    const BookIcon = getBookIcon(book.icon || "BookHeart");
    return (
      <button
        className="w-full flex items-center gap-3 p-2.5 rounded-2xl border border-zinc-800 bg-zinc-950/60 hover:border-zinc-600 transition-colors text-left"
        key={book.id}
        onClick={() => handlePick(book)}
        type="button"
      >
        <span className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center shrink-0">
          <BookIcon className="w-4 h-4 text-white" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-bold text-white truncate">
            {book.title}
          </span>
          <span className="block text-[11px] text-zinc-500 truncate">
            {subtitle}
          </span>
        </span>
      </button>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn h-dvh"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl animate-scaleUp flex flex-col max-h-[80dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-black/60 shrink-0">
          <span className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
            <BookMarked className="w-4 h-4" />
            Référencer un Livre
          </span>
          <button
            className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Onglets */}
        <div className="flex border-b border-zinc-800 shrink-0">
          <button
            className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
              tab === "mine"
                ? "text-white bg-zinc-900/60"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
            onClick={() => setTab("mine")}
            type="button"
          >
            <BookMarked className="w-3.5 h-3.5" />
            Mes Livres
          </button>
          <button
            className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
              tab === "public"
                ? "text-white bg-zinc-900/60"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
            onClick={() => setTab("public")}
            type="button"
          >
            <Globe className="w-3.5 h-3.5" />
            Livres publics
          </button>
        </div>

        {/* Corps */}
        <div className="p-3 space-y-2 overflow-y-auto">
          {tab === "mine" ? (
            isLoadingMine ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
              </div>
            ) : myBooks.length === 0 ? (
              <p className="text-center text-[11px] text-zinc-500 py-8">
                Aucun Livre pour le moment. Créez-en un depuis l'onglet Livres.
              </p>
            ) : (
              myBooks.map((book) =>
                renderBookRow(
                  book,
                  `${book.items_count || 0} Vibe${(book.items_count || 0) > 1 ? "s" : ""} · ${book.is_owner ? "votre Livre" : "membre"}`
                )
              )
            )
          ) : (
            <>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  autoFocus
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                  maxLength={50}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher un Livre public…"
                  type="text"
                  value={query}
                />
                {isSearching && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2" />
                )}
              </div>
              {query.trim().length < 2 ? (
                <p className="text-center text-[11px] text-zinc-500 py-6">
                  Tapez au moins 2 caractères pour rechercher un Livre public.
                </p>
              ) : publicBooks.length === 0 && !isSearching ? (
                <p className="text-center text-[11px] text-zinc-500 py-6">
                  Aucun Livre public trouvé.
                </p>
              ) : (
                publicBooks.map((book) =>
                  renderBookRow(
                    book,
                    `Livre de @${book.owner_username || "vibe"} · ${book.items_count || 0} Vibe${(book.items_count || 0) > 1 ? "s" : ""}`
                  )
                )
              )}
            </>
          )}
        </div>

        <p className="px-4 py-2.5 text-[10px] text-zinc-500 border-t border-zinc-800 shrink-0">
          Le Livre apparaîtra en carte sous votre Vibe, avec un lien vers sa
          page.
        </p>
      </div>
    </div>
  );
};
