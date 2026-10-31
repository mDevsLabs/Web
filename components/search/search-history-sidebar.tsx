"use client";

import {
  Edit2Icon,
  MoreHorizontalIcon,
  PinIcon,
  PinOffIcon,
  SearchIcon,
  Share2Icon,
  XIcon,
} from "@mdevs/icons";
import { useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { RecentSearch } from "@/hooks/use-recent-searches";
import { cn } from "@/lib/utils";

/**
 * Barre latérale de l'historique mAI Search.
 *
 * Elle reste visible sur l'accueil et sur les résultats. Ouvrir une entrée
 * est décidé par le parent : une synthèse enregistrée se restaure, sinon la
 * recherche est relancée.
 */
export function SearchHistorySidebar({
  hasMore,
  isLoading,
  onClear,
  onForget,
  onLoadMore,
  onOpen,
  onPin,
  onRename,
  onShare,
  recent,
}: {
  hasMore: boolean;
  isLoading: boolean;
  onClear: () => void;
  onForget: (id: string) => void;
  onLoadMore: () => void;
  onOpen: (id: string) => void;
  onPin: (id: string, pinned: boolean) => void;
  onRename: (id: string, title: string) => void;
  onShare: (query: string) => void;
  recent: RecentSearch[];
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const fermerMobile = () => setMobileOpen(false);

  return (
    <>
      <button
        className="fixed bottom-4 left-4 z-30 rounded-xl border border-border/60 bg-card px-3 py-2 text-xs font-medium shadow-md md:hidden"
        onClick={() => setMobileOpen(true)}
        type="button"
      >
        Historique
      </button>
      {mobileOpen ? (
        <button
          aria-label="Fermer l'historique"
          className="fixed inset-0 z-40 bg-background/60 md:hidden"
          onClick={fermerMobile}
          type="button"
        />
      ) : null}
      <aside
        className={cn(
          "z-40 w-72 shrink-0 flex-col border-r border-border/60 bg-background",
          mobileOpen
            ? "fixed inset-y-0 left-0 flex"
            : "hidden md:flex md:sticky md:top-0 md:h-dvh"
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-border/50 px-3 py-3">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Historique
          </span>
          <div className="flex items-center gap-1">
            {recent.length > 0 ? (
              <button
                className="text-[11px] text-muted-foreground hover:text-foreground"
                onClick={onClear}
                type="button"
              >
                Tout effacer
              </button>
            ) : null}
            <button
              aria-label="Fermer l'historique"
              className="rounded-md p-1 text-muted-foreground hover:bg-muted md:hidden"
              onClick={fermerMobile}
              type="button"
            >
              <XIcon className="size-4" />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {recent.length === 0 && !isLoading ? (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">
              Aucune recherche pour l'instant.
            </p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {recent.map((entree) => {
                const libelle = entree.title?.trim() || entree.query;
                const enEdition = editingId === entree.id;
                return (
                  <li
                    className="group flex items-center gap-0.5"
                    key={entree.id}
                  >
                    {enEdition ? (
                      <form
                        className="min-w-0 flex-1"
                        onSubmit={(event) => {
                          event.preventDefault();
                          onRename(entree.id, draft);
                          setEditingId(null);
                        }}
                      >
                        <input
                          aria-label="Nouveau titre"
                          className="field-input w-full px-2 py-1.5 text-xs"
                          onChange={(event) => setDraft(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Escape") {
                              setEditingId(null);
                            }
                          }}
                          value={draft}
                        />
                      </form>
                    ) : (
                      <button
                        className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] text-foreground/80 hover:bg-muted/60"
                        onClick={() => {
                          onOpen(entree.id);
                          fermerMobile();
                        }}
                        type="button"
                      >
                        {entree.pinned ? (
                          <PinIcon className="size-3.5 shrink-0 text-warning" />
                        ) : (
                          <SearchIcon className="size-3.5 shrink-0 text-muted-foreground" />
                        )}
                        <span className="truncate">{libelle}</span>
                      </button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          aria-label={`Options pour ${libelle}`}
                          className="rounded-md p-1 text-muted-foreground opacity-0 hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                          type="button"
                        >
                          <MoreHorizontalIcon className="size-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setDraft(entree.title?.trim() || entree.query);
                            setEditingId(entree.id);
                          }}
                        >
                          <Edit2Icon className="size-3.5" />
                          Renommer
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onPin(entree.id, !entree.pinned)}
                        >
                          {entree.pinned ? (
                            <PinOffIcon className="size-3.5" />
                          ) : (
                            <PinIcon className="size-3.5" />
                          )}
                          {entree.pinned ? "Désépingler" : "Épingler"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onShare(entree.query)}>
                          <Share2Icon className="size-3.5" />
                          Partager
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => onForget(entree.id)}
                        >
                          <XIcon className="size-3.5" />
                          Retirer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </li>
                );
              })}
            </ul>
          )}
          {hasMore ? (
            <button
              className="mt-2 w-full rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
              disabled={isLoading}
              onClick={onLoadMore}
              type="button"
            >
              {isLoading ? "Chargement…" : "Voir la suite"}
            </button>
          ) : null}
        </div>
      </aside>
    </>
  );
}

export async function shareSearchQuery(query: string) {
  const shareUrl = `${window.location.origin}/search?q=${encodeURIComponent(query)}`;
  if (navigator.share) {
    try {
      await navigator.share({
        text: `Recherche sur mAI Search : ${query}`,
        title: `mAI Search — ${query}`,
        url: shareUrl,
      });
      return;
    } catch {
      // L'annulation du partage natif retombe sur le presse-papiers.
    }
  }
  try {
    await navigator.clipboard.writeText(shareUrl);
    toast.success("Lien de la recherche copié dans le presse-papiers !");
  } catch {
    toast.error("Impossible de partager le lien.");
  }
}
