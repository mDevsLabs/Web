"use client";

import {
  ClockIcon,
  FileIcon,
  FolderKanbanIcon,
  MessageSquareIcon,
  PinIcon,
  SearchIcon,
  XIcon,
} from "@mdevs/icons";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getFileIcon } from "@/app/(chat)/library/page";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuickSearch } from "@/hooks/use-quick-search";
import { countQuickSearchResults } from "@/lib/chat/quick-search";
import { cn } from "@/lib/utils";

type SearchResult = {
  chats: any[];
  messages: any[];
  projects: any[];
  files: any[];
};

type SearchFilter = "all" | "chats" | "messages" | "projects" | "files";

/**
 * Résultats demandés par catégorie à la barre de recherche rapide.
 *
 * La route plafonne à 30 ; on ne demande pas le maximum, parce qu'une palette
 * se lit en diagonale : au-delà d'une trentaine de lignes, l'utilisateur fait
 * défiler au lieu de reconnaître. Quand une catégorie sature, la liste le dit
 * explicitement plutôt que de laisser croire qu'elle est exhaustive.
 */
const SEARCH_LIMIT = 25;

export function SearchDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<SearchFilter>("all");
  const { data, error, loading, retry, retrying } =
    useQuickSearch<SearchResult>(query, open, SEARCH_LIMIT);
  const results = data ?? {
    chats: [],
    files: [],
    messages: [],
    projects: [],
  };

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("open-search-dialog", handleOpen as any);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("open-search-dialog", handleOpen as any);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSelectChat = (id: string) => {
    setOpen(false);
    router.push(`/chat/${id}`);
  };
  const handleSelectProject = (id: string) => {
    setOpen(false);
    router.push(`/projects/${id}`);
  };
  const handleSelectFile = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
    setOpen(false);
  };
  const handleSelectMessage = (chatId: string) => {
    setOpen(false);
    router.push(`/chat/${chatId}`);
  };

  const showChats = filter === "all" || filter === "chats";
  const showMessages = filter === "all" || filter === "messages";
  const showProjects = filter === "all" || filter === "projects";
  const showFiles = filter === "all" || filter === "files";

  const totalResults = countQuickSearchResults(results, "all");
  const visibleResults = countQuickSearchResults(results, filter);

  const hasAny = totalResults > 0;

  // Une catégorie qui rend exactement `SEARCH_LIMIT` en a probablement
  // davantage : on le dit, sinon l'utilisateur conclut à tort que la barre
  // contient tout son historique.
  const isSaturated =
    (showChats && results.chats.length === SEARCH_LIMIT) ||
    (showMessages && results.messages.length === SEARCH_LIMIT) ||
    (showProjects && results.projects.length === SEARCH_LIMIT) ||
    (showFiles && results.files.length === SEARCH_LIMIT);

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogContent
        className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Rechercher</DialogTitle>
          <DialogDescription>
            Rechercher conversations, messages, projets et fichiers.
          </DialogDescription>
        </DialogHeader>
        <Command className="min-h-0" shouldFilter={false}>
          <div className="flex flex-col border-b border-border/50">
            <CommandInput
              aria-label="Rechercher dans le compte"
              className="pr-14"
              onValueChange={setQuery}
              placeholder="Rechercher mots-clés, messages, tags, projets..."
              value={query}
            />
            {/* Filtres de catégorie */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/20 text-xs overflow-x-auto no-scrollbar">
              <button
                aria-pressed={filter === "all"}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer shrink-0",
                  filter === "all"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                onClick={() => setFilter("all")}
                type="button"
              >
                Tous {hasAny && `(${totalResults})`}
              </button>
              <button
                aria-pressed={filter === "chats"}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 flex items-center gap-1",
                  filter === "chats"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                onClick={() => setFilter("chats")}
                type="button"
              >
                <MessageSquareIcon className="size-3" />
                Discussions{" "}
                {results.chats.length > 0 && `(${results.chats.length})`}
              </button>
              <button
                aria-pressed={filter === "messages"}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 flex items-center gap-1",
                  filter === "messages"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                onClick={() => setFilter("messages")}
                type="button"
              >
                <ClockIcon className="size-3" />
                Messages{" "}
                {results.messages.length > 0 && `(${results.messages.length})`}
              </button>
              <button
                aria-pressed={filter === "projects"}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 flex items-center gap-1",
                  filter === "projects"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                onClick={() => setFilter("projects")}
                type="button"
              >
                <FolderKanbanIcon className="size-3" />
                Projets{" "}
                {results.projects.length > 0 && `(${results.projects.length})`}
              </button>
              <button
                aria-pressed={filter === "files"}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 flex items-center gap-1",
                  filter === "files"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                onClick={() => setFilter("files")}
                type="button"
              >
                <FileIcon className="size-3" />
                Fichiers{" "}
                {results.files.length > 0 && `(${results.files.length})`}
              </button>
            </div>
          </div>

          <CommandList className="min-h-0 max-h-[60dvh] flex-1">
            {!visibleResults &&
              query.trim().length >= 2 &&
              !loading &&
              !error && (
                <CommandEmpty>
                  Aucun résultat{" "}
                  {filter === "all" ? "" : "dans cette catégorie "}pour «{" "}
                  {query} »
                </CommandEmpty>
              )}
            {error && (
              <div
                className="flex flex-col items-center gap-2 p-6 text-center text-sm"
                role="alert"
              >
                <p className="text-destructive">
                  Impossible de charger les résultats.
                </p>
                <Button
                  disabled={retrying}
                  onClick={() => void retry()}
                  size="sm"
                  variant="outline"
                >
                  Réessayer
                </Button>
              </div>
            )}
            {!hasAny && query.trim().length < 2 && (
              <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                <SearchIcon className="size-5 text-muted-foreground/50" />
                <span>
                  Tapez 2 caractères minimum pour rechercher dans vos
                  discussions, messages et projets.
                </span>
              </div>
            )}
            {loading && (
              <div className="py-4 text-center text-xs text-muted-foreground">
                Recherche en cours...
              </div>
            )}

            {showChats && results.chats.length > 0 && (
              <CommandGroup heading={`Conversations (${results.chats.length})`}>
                {results.chats.map((c) => (
                  <CommandItem
                    className="flex items-center gap-2.5 py-2"
                    key={c.id}
                    onSelect={() => handleSelectChat(c.id)}
                    value={`chat-${c.id}-${c.title}`}
                  >
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <MessageSquareIcon className="size-3.5" />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-medium text-sm text-foreground">
                          {c.title}
                        </span>
                        {c.pinned && (
                          <span
                            className="shrink-0 flex items-center text-warning text-[10px]"
                            title="Épinglée"
                          >
                            <PinIcon className="size-3 fill-current" />
                          </span>
                        )}
                      </div>
                      {c.tags && c.tags.length > 0 && (
                        <div className="flex items-center gap-1 mt-0.5">
                          {c.tags.slice(0, 3).map((t: string) => (
                            <span
                              className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.2 rounded"
                              key={t}
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="ml-auto text-[10px] text-muted-foreground shrink-0">
                      {new Date(c.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {showMessages && results.messages.length > 0 && (
              <CommandGroup heading={`Messages (${results.messages.length})`}>
                {results.messages.map((m) => {
                  const snippet =
                    m.snippet ||
                    (() => {
                      try {
                        const parts = m.parts as any[];
                        const t =
                          parts?.find((p) => p.type === "text")?.text || "";
                        return t.slice(0, 80);
                      } catch {
                        return "";
                      }
                    })();
                  return (
                    <CommandItem
                      className="flex items-start gap-2.5 py-2"
                      key={m.id}
                      onSelect={() => handleSelectMessage(m.chatId)}
                      value={`msg-${m.id}-${snippet}`}
                    >
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground mt-0.5">
                        <ClockIcon className="size-3.5" />
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-xs text-foreground font-medium line-clamp-2">
                          {snippet || "Message sans texte"}
                        </span>
                        <span className="text-[11px] text-muted-foreground mt-0.5 truncate">
                          Dans :{" "}
                          <strong className="text-foreground/80 font-medium">
                            {m.chatTitle || "Discussion"}
                          </strong>
                        </span>
                      </div>
                      <span className="ml-auto text-[10px] text-muted-foreground shrink-0 mt-0.5">
                        {new Date(m.createdAt).toLocaleDateString("fr-FR")}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {showProjects && results.projects.length > 0 && (
              <CommandGroup heading={`Projets (${results.projects.length})`}>
                {results.projects.map((p) => (
                  <CommandItem
                    className="flex items-center gap-2.5 py-2"
                    key={p.id}
                    onSelect={() => handleSelectProject(p.id)}
                    value={`proj-${p.id}-${p.name}`}
                  >
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-info/10 text-info">
                      <FolderKanbanIcon className="size-3.5" />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-medium text-sm text-foreground truncate">
                        {p.name}
                      </span>
                      {p.description && (
                        <span className="text-[11px] text-muted-foreground truncate">
                          {p.description}
                        </span>
                      )}
                    </div>
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      {p.chatCount === undefined ? "" : `${p.chatCount} chats`}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {showFiles && results.files.length > 0 && (
              <CommandGroup heading={`Fichiers (${results.files.length})`}>
                {results.files.map((f: any) => (
                  <CommandItem
                    className="flex items-center gap-2.5 py-2"
                    key={f.id}
                    onSelect={() => handleSelectFile(f.url)}
                    value={`file-${f.id}-${f.original_name}`}
                  >
                    <span className="shrink-0 size-7 flex items-center justify-center rounded-lg bg-muted/60">
                      {getFileIcon(f.mime_type, f.original_name)}
                    </span>
                    <span className="truncate text-xs font-medium text-foreground">
                      {f.original_name}
                    </span>
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      {f.mime_type?.split("/")[1] || ""}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {isSaturated && (
              <p className="px-3 py-2 text-center text-[11px] text-muted-foreground">
                Davantage de résultats. Affinez la recherche, ou ouvrez la
                recherche globale depuis l'icône de la barre latérale pour
                croiser Skills, MCP, bots, modèles, images, audio et
                statistiques.
              </p>
            )}
          </CommandList>
          <div className="border-t border-border/50 px-3 py-2 text-[10px] text-muted-foreground flex items-center justify-between">
            <span className="flex items-center gap-1">
              <SearchIcon className="size-3" /> Cmd+K ou Ctrl+K
            </span>
            <span>↵ ouvrir • esc fermer</span>
          </div>
        </Command>
        <DialogClose asChild>
          <Button
            aria-label="Fermer la recherche"
            className="absolute right-2 top-2"
            size="icon-sm"
            variant="ghost"
          >
            <XIcon />
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
