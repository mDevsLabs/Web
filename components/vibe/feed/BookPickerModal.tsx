/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — BOOK PICKER MODAL (src/components/feed/BookPickerModal.tsx)
 * « Enregistrer dans un Livre » : liste des Livres du compte (max 5),
 * création rapide d'un Livre (titre + icône lucide) et toggle d'enregistrement.
 * ============================================================================
 */

import { AlertCircleIcon as AlertCircle, CheckIcon as Check, Loader2Icon as Loader2, PlusIcon as Plus, UsersIcon as Users, XIcon as X } from "@mdevs/icons";
import type React from "react";
import { useEffect, useState } from "react";
import {
  BOOK_ICON_OPTIONS,
  getBookIcon,
} from "@/components/vibe/common/bookIcons";
import { ApiService } from "@/lib/vibe/services/api";
import { haptics } from "@/lib/vibe/services/haptics";
import { NotificationService } from "@/lib/vibe/services/notificationService";
import type { VibeBook } from "@/lib/vibe/types/vibe";

interface BookPickerModalProps {
  onClose: () => void;
  /** Notifie le parent que l'état « dans un Livre » a changé. */
  onSavedBooksChange?: (bookIds: string[]) => void;
  postId: string;
}

export const BookPickerModal: React.FC<BookPickerModalProps> = ({
  postId,
  onClose,
  onSavedBooksChange,
}) => {
  const [books, setBooks] = useState<VibeBook[]>([]);
  const [maxBooks, setMaxBooks] = useState(5);
  const [ownedCount, setOwnedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [busyBookId, setBusyBookId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newIcon, setNewIcon] = useState("BookHeart");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    ApiService.getBooks(postId)
      .then((res) => {
        if (cancelled) return;
        const list = res.books || [];
        setBooks(list);
        setMaxBooks(res.maxBooks || 5);
        setOwnedCount(
          res.ownedCount ?? list.filter((b) => b.is_owner !== false).length
        );
      })
      .catch(() => {
        if (!cancelled) setError("Impossible de charger vos Livres.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [postId]);

  const notifyParent = (list: VibeBook[]) => {
    onSavedBooksChange?.(list.filter((b) => b.contains_post).map((b) => b.id));
  };

  const handleToggle = async (book: VibeBook) => {
    if (busyBookId) return;
    setBusyBookId(book.id);
    setError(null);
    // Optimiste
    const prev = books;
    setBooks((list) =>
      list.map((b) =>
        b.id === book.id
          ? {
              ...b,
              contains_post: !b.contains_post,
              items_count: Math.max(
                0,
                (b.items_count || 0) + (b.contains_post ? -1 : 1)
              ),
            }
          : b
      )
    );
    try {
      const res = await ApiService.toggleBookItem(book.id, postId);
      const nextList = books.map((b) =>
        b.id === book.id ? { ...b, contains_post: Boolean(res?.saved) } : b
      );
      setBooks((list) =>
        list.map((b) =>
          b.id === book.id ? { ...b, contains_post: Boolean(res?.saved) } : b
        )
      );
      if (res?.saved) {
        haptics.like();
        NotificationService.showInAppToast(
          "Enregistré",
          `Cette Vibe rejoint votre Livre « ${book.title} ».`,
          "success"
        );
      } else {
        haptics.unlike();
        NotificationService.showInAppToast(
          "Retiré",
          `Cette Vibe a été retirée du Livre « ${book.title} ».`,
          "info"
        );
      }
      notifyParent(nextList);
    } catch (err: any) {
      haptics.error();
      setBooks(prev);
      setError(err?.message || "L'enregistrement a échoué.");
    } finally {
      setBusyBookId(null);
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim() || isCreating) return;
    setIsCreating(true);
    setError(null);
    try {
      const res = await ApiService.createBook(newTitle.trim(), newIcon);
      setBooks((list) => [...list, res.book]);
      setOwnedCount((n) => n + 1);
      setShowCreate(false);
      setNewTitle("");
      setNewIcon("BookHeart");
      haptics.success();
      NotificationService.showInAppToast(
        "Livre créé",
        `« ${res.book.title} » est prêt à recevoir vos Vibe.`,
        "success"
      );
    } catch (err: any) {
      haptics.error();
      setError(err?.message || "La création du Livre a échoué.");
    } finally {
      setIsCreating(false);
    }
  };

  const canCreate = ownedCount < maxBooks;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-5 space-y-3 animate-scaleUp max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">
            Enregistrer dans un Livre
          </h3>
          <button
            className="text-zinc-500 hover:text-white"
            onClick={onClose}
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-zinc-500">
          Vos « Vibe préférées » restent dans vos Livres pour être retrouvées
          rapidement.
        </p>

        {error && (
          <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded-xl px-3 py-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-zinc-500">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              {books.length === 0 && (
                <p className="text-xs text-zinc-600 py-3 text-center">
                  Vous n'avez pas encore de Livre — créez-en un pour garder vos
                  Vibe préférées.
                </p>
              )}
              {books.map((book) => {
                const IconComponent = getBookIcon(book.icon);
                const saved = Boolean(book.contains_post);
                return (
                  <button
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl border text-left transition-colors ${
                      saved
                        ? "border-sky-500/50 bg-sky-500/10"
                        : "border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900"
                    }`}
                    disabled={busyBookId === book.id}
                    key={book.id}
                    onClick={() => handleToggle(book)}
                  >
                    <span
                      className={`p-1.5 rounded-xl ${saved ? "text-sky-300" : "text-zinc-400"}`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-1.5">
                        <span className="block text-xs font-semibold text-white truncate">
                          {book.title}
                        </span>
                        {book.is_owner === false && (
                          <span className="shrink-0 flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/30">
                            <Users className="w-2.5 h-2.5" />
                            Partagé
                          </span>
                        )}
                      </span>
                      <span className="block text-[10px] text-zinc-500">
                        {book.items_count || 0} Vibe
                        {(book.members_count || 0) > 1 &&
                          ` · ${book.members_count} membres`}
                      </span>
                    </span>
                    {busyBookId === book.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                    ) : saved ? (
                      <Check className="w-4 h-4 text-sky-300" />
                    ) : (
                      <Plus className="w-4 h-4 text-zinc-500" />
                    )}
                  </button>
                );
              })}
            </div>

            {showCreate ? (
              <div className="border border-zinc-800 rounded-2xl p-3 space-y-2.5 bg-zinc-900/40">
                <input
                  autoFocus
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                  maxLength={60}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                  }}
                  placeholder="Titre du Livre (ex. Inspirations)"
                  type="text"
                  value={newTitle}
                />
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-zinc-500 font-semibold mb-1.5">
                    Icône
                  </p>
                  <div className="grid grid-cols-8 gap-1.5">
                    {BOOK_ICON_OPTIONS.map((opt) => (
                      <button
                        className={`p-1.5 rounded-lg flex items-center justify-center transition-colors ${
                          newIcon === opt.name
                            ? "bg-sky-500/20 text-sky-300 border border-sky-500/50"
                            : "text-zinc-400 hover:text-white hover:bg-zinc-800 border border-transparent"
                        }`}
                        key={opt.name}
                        onClick={() => setNewIcon(opt.name)}
                        title={opt.name}
                        type="button"
                      >
                        <opt.Component className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    className="flex-1 py-2 rounded-xl bg-white text-black text-xs font-bold disabled:opacity-40"
                    disabled={!newTitle.trim() || isCreating}
                    onClick={handleCreate}
                    style={{ backgroundColor: "var(--vibe-accent, #ffffff)" }}
                  >
                    {isCreating ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      "Créer le Livre"
                    )}
                  </button>
                  <button
                    className="px-4 py-2 rounded-xl border border-zinc-800 text-xs text-zinc-400 hover:text-white"
                    onClick={() => setShowCreate(false)}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <button
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border text-xs font-semibold transition-colors ${
                  canCreate
                    ? "border-dashed border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-900"
                    : "border-zinc-900 text-zinc-600 cursor-not-allowed"
                }`}
                disabled={!canCreate}
                onClick={() => setShowCreate(true)}
                title={
                  canCreate
                    ? "Créer un nouveau Livre"
                    : `Limite de ${maxBooks} Livres atteinte`
                }
              >
                <Plus className="w-3.5 h-3.5" />
                {canCreate
                  ? "Nouveau Livre"
                  : `Limite de ${maxBooks} Livres par compte atteinte`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
