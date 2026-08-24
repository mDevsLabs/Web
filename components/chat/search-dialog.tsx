"use client";

import {
  ClockIcon,
  FolderKanbanIcon,
  MessageSquareIcon,
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

type SearchResult = {
  chats: any[];
  messages: any[];
  projects: any[];
  files: any[];
};

export function SearchDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
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
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=6`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchSearch(query), 300);
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

  const hasAny =
    results.chats.length > 0 ||
    results.messages.length > 0 ||
    results.projects.length > 0 ||
    results.files.length > 0;

  return (
    <CommandDialog
      description="Rechercher conversations, projets, fichiers"
      onOpenChange={setOpen}
      open={open}
      title="Rechercher"
    >
      <CommandInput
        onValueChange={setQuery}
        placeholder="Rechercher titres, messages, projets, fichiers..."
        value={query}
      />
      <CommandList className="max-h-[480px]">
        {!hasAny && query.trim().length >= 2 && !loading && (
          <CommandEmpty>Aucun résultat pour "{query}"</CommandEmpty>
        )}
        {!hasAny && query.trim().length < 2 && (
          <div className="py-6 text-center text-xs text-muted-foreground">
            Tape au moins 2 caractères — titres, contenu des messages, projets
            et fichiers.
          </div>
        )}
        {loading && (
          <div className="py-3 text-center text-xs text-muted-foreground">
            Recherche...
          </div>
        )}

        {results.chats.length > 0 && (
          <CommandGroup heading={`Conversations (${results.chats.length})`}>
            {results.chats.map((c) => (
              <CommandItem
                key={c.id}
                onSelect={() => handleSelectChat(c.id)}
                value={`chat-${c.id}-${c.title}`}
              >
                <MessageSquareIcon className="size-4 text-muted-foreground" />
                <span className="truncate">{c.title}</span>
                <span className="ml-auto text-[10px] text-muted-foreground">
                  {new Date(c.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.messages.length > 0 && (
          <CommandGroup heading={`Messages (${results.messages.length})`}>
            {results.messages.map((m) => {
              const txt = (() => {
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
                  key={m.id}
                  onSelect={() => handleSelectMessage(m.chatId)}
                  value={`msg-${m.id}-${txt}`}
                >
                  <ClockIcon className="size-4 text-muted-foreground" />
                  <span className="truncate">
                    {txt || "Message"} —{" "}
                    <span className="text-muted-foreground text-xs">
                      {m.chatTitle}
                    </span>
                  </span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {results.projects.length > 0 && (
          <CommandGroup heading={`Projets (${results.projects.length})`}>
            {results.projects.map((p) => (
              <CommandItem
                key={p.id}
                onSelect={() => handleSelectProject(p.id)}
                value={`proj-${p.id}-${p.name}`}
              >
                <FolderKanbanIcon className="size-4 text-muted-foreground" />
                <span>{p.name}</span>
                <span className="ml-auto text-[10px] text-muted-foreground">
                  {p.chatCount ?? ""}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.files.length > 0 && (
          <CommandGroup heading={`Fichiers (${results.files.length})`}>
            {results.files.map((f: any) => (
              <CommandItem
                key={f.id}
                onSelect={() => handleSelectFile(f.url)}
                value={`file-${f.id}-${f.original_name}`}
              >
                <span className="shrink-0">
                  {getFileIcon(f.mime_type, f.original_name)}
                </span>
                <span className="truncate">{f.original_name}</span>
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
          <SearchIcon className="size-3" /> /search ou Cmd+K
        </span>
        <span>↵ ouvrir • esc fermer</span>
      </div>
    </CommandDialog>
  );
}
