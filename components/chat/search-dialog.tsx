"use client";

import {
  ClockIcon,
  FileIcon,
  FolderKanbanIcon,
  MessageSquareIcon,
  PinIcon,
  SearchIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getFileIcon } from "@/app/(chat)/library/page";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

type SearchResult = {
  chats: any[];
  messages: any[];
  projects: any[];
  files: any[];
};

type SearchFilter = "all" | "chats" | "messages" | "projects" | "files";

export function SearchDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<SearchFilter>("all");
  const [results, setResults] = useState<SearchResult>({
    chats: [],
    files: [],
    messages: [],
    projects: [],
  });
  const [loading, setLoading] = useState(false);

  const fetchSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults({ chats: [], files: [], messages: [], projects: [] });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(q)}&limit=12`
      );
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchSearch(query), 200);
    return () => clearTimeout(timer);
  }, [query, fetchSearch]);

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
    window.open(url, "_blank");
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

  const totalResults =
    results.chats.length +
    results.messages.length +
    results.projects.length +
    results.files.length;

  const hasAny = totalResults > 0;

  return (
    <CommandDialog
      description="Rechercher conversations, messages, projets, fichiers"
      onOpenChange={setOpen}
      open={open}
      title="Rechercher"
    >
      <div className="flex flex-col border-b border-border/50">
        <CommandInput
          onValueChange={setQuery}
          placeholder="Rechercher mots-clés, messages, tags, projets..."
          value={query}
        />
        {/* Filtres de catégorie */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/20 text-xs overflow-x-auto no-scrollbar">
          <button
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
            Fichiers {results.files.length > 0 && `(${results.files.length})`}
          </button>
        </div>
      </div>

      <CommandList className="max-h-[480px]">
        {!hasAny && query.trim().length >= 2 && !loading && (
          <CommandEmpty>Aucun résultat pour "{query}"</CommandEmpty>
        )}
        {!hasAny && query.trim().length < 2 && (
          <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
            <SearchIcon className="size-5 text-muted-foreground/50" />
            <span>
              Tapez 2 caractères minimum pour rechercher dans vos discussions,
              messages et projets.
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
                        className="shrink-0 flex items-center text-amber-500 text-[10px]"
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
                    const t = parts?.find((p) => p.type === "text")?.text || "";
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
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
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
      </CommandList>
      <div className="border-t border-border/50 px-3 py-2 text-[10px] text-muted-foreground flex items-center justify-between">
        <span className="flex items-center gap-1">
          <SearchIcon className="size-3" /> Cmd+K ou Ctrl+K
        </span>
        <span>↵ ouvrir • esc fermer</span>
      </div>
    </CommandDialog>
  );
}
