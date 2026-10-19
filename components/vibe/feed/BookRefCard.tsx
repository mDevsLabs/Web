/**
 * ============================================================================
 * VIBE — CARTE DE RÉFÉRENCE DE LIVRE (src/components/feed/BookRefCard.tsx)
 * Affiche les Livres référencés dans un post (@livre / attachement) sous son
 * contenu : icône, titre, propriétaire, nombre de Vibes — cliquable vers la
 * page du Livre. Masquée si le Livre est privé pour le lecteur (can_view).
 * ============================================================================
 */

import type React from "react";
import { getBookIcon } from "@/components/vibe/common/bookIcons";
import type { BookRef } from "@/lib/vibe/types/vibe";
import { useNavigate } from "../router";

interface BookRefCardProps {
  books: BookRef[];
}

export const BookRefCard: React.FC<BookRefCardProps> = ({ books }) => {
  const navigate = useNavigate();
  const visible = (books || []).filter((b) => b && b.can_view !== false);
  if (visible.length === 0) return null;

  return (
    <div className="space-y-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
      {visible.map((book) => {
        const BookIcon = getBookIcon(book.icon || "BookHeart");
        return (
          <button
            className="w-full flex items-center gap-3 p-2.5 rounded-2xl border border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 transition-colors text-left"
            key={book.id}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/books/${book.id}`);
            }}
            title={`Livre « ${book.title} »`}
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
                Livre de @{book.owner_username || "vibe"} ·{" "}
                {book.items_count || 0} Vibe
                {(book.items_count || 0) > 1 ? "s" : ""}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
};
