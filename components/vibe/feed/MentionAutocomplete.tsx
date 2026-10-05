/**
 * ============================================================================
 * VIBE — POPOVER AUTOCOMPLETE MENTIONS (src/components/feed/MentionAutocomplete.tsx)
 * Mini-liste de comptes suggérés lors de la saisie de « @ » dans un post ou
 * un commentaire (avatar, nom, @username, badge) + section « Livres publics »
 * (mention @livre). Même mécanique d'affichage que ToolAutocomplete (outils
 * mAI) : popover absolu ancré au-dessus du champ, animation scaleUp, z-50.
 * ============================================================================
 */

import type React from "react";
import { getBookIcon } from "@/components/vibe/common/bookIcons";
import { ProfileAvatar } from "@/components/vibe/common/ProfileAvatar";
import { VerifiedBadge } from "@/components/vibe/common/VerifiedBadge";

export interface MentionUser {
  avatar_url?: string;
  display_name?: string;
  id: number | string;
  is_verified?: boolean;
  username: string;
}

export interface MentionBook {
  icon?: string;
  id: string;
  owner_display_name?: string;
  owner_username?: string;
  title: string;
}

interface MentionAutocompleteProps {
  books?: MentionBook[];
  highlightedIndex: number;
  onSelect: (user: MentionUser) => void;
  onSelectBook?: (book: MentionBook) => void;
  users: MentionUser[];
}

export const MentionAutocomplete: React.FC<MentionAutocompleteProps> = ({
  users,
  books = [],
  highlightedIndex,
  onSelect,
  onSelectBook,
}) => {
  if (users.length === 0 && books.length === 0) return null;

  return (
    <div className="absolute bottom-full left-0 mb-2 w-full max-w-sm vibe-menu rounded-2xl shadow-2xl overflow-hidden z-50 animate-scaleUp">
      <div className="p-2 border-b border-zinc-200 vibe-dark:border-zinc-800 bg-black/5 vibe-dark:bg-zinc-900/50 flex items-center justify-between text-[11px] font-mono text-zinc-600 vibe-dark:text-zinc-400">
        <span>Mentions</span>
        <span>{users.length + books.length} suggéré(s)</span>
      </div>

      <div className="divide-y divide-zinc-100 vibe-dark:divide-zinc-900 max-h-56 overflow-y-auto">
        {users.map((user, index) => (
          <button
            className={`w-full p-2.5 flex items-center gap-3 text-left transition-colors ${
              index === highlightedIndex
                ? "bg-black/10 vibe-dark:bg-zinc-900"
                : "hover:bg-black/5 vibe-dark:hover:bg-zinc-900"
            }`}
            key={user.id}
            onClick={() => onSelect(user)}
            // preventDefault : conserve le focus et la sélection dans
            // l'éditeur contentEditable jusqu'au clic (insertion fiable)
            onMouseDown={(e) => e.preventDefault()}
            type="button"
          >
            <ProfileAvatar
              alt={user.username}
              fallbackName={user.username}
              size="sm"
              src={user.avatar_url}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-zinc-900 vibe-dark:text-white truncate">
                  {user.display_name || user.username}
                </span>
                <VerifiedBadge isVerified={user.is_verified} size="xs" />
              </div>
              <span className="text-[11px] text-zinc-500 truncate block">
                @{user.username}
              </span>
            </div>
          </button>
        ))}

        {books.length > 0 && onSelectBook && (
          <>
            <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-black/5 vibe-dark:bg-zinc-900/40 flex items-center gap-1.5">
              <span>Livres publics</span>
            </div>
            {books.map((book, bookIndex) => {
              const BookIcon = getBookIcon(book.icon || "BookHeart");
              const index = users.length + bookIndex;
              return (
                <button
                  className={`w-full p-2.5 flex items-center gap-3 text-left transition-colors ${
                    index === highlightedIndex
                      ? "bg-black/10 vibe-dark:bg-zinc-900"
                      : "hover:bg-black/5 vibe-dark:hover:bg-zinc-900"
                  }`}
                  key={book.id}
                  onClick={() => onSelectBook(book)}
                  onMouseDown={(e) => e.preventDefault()}
                  type="button"
                >
                  <span className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center shrink-0">
                    <BookIcon className="w-4 h-4 text-white" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-zinc-900 vibe-dark:text-white truncate block">
                      {book.title}
                    </span>
                    <span className="text-[11px] text-zinc-500 truncate block">
                      @{book.owner_username || "livre"} · livre public
                    </span>
                  </div>
                </button>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};
