"use client";

import {
  ArchiveRestoreIcon,
  CopyIcon,
  Edit2Icon,
  Loader2Icon,
  SearchIcon,
  TrashIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { PageBackButton } from "@/components/chat/page-back-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetcher } from "@/lib/utils";

type ArchivedChat = {
  id: string;
  title: string;
  createdAt: string;
  archivedAt: string | null;
  isArchived: boolean;
  pinned: boolean;
  userId: string;
};

export default function ArchivedPage() {
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const query = search.trim()
    ? `/api/history?isArchived=true&limit=50&search=${encodeURIComponent(search.trim())}`
    : `/api/history?isArchived=true&limit=50`;

  const { data, isLoading, mutate } = useSWR<{ chats: ArchivedChat[] }>(
    query,
    fetcher
  );
  const chats = data?.chats ?? [];

  const handleUnarchive = useCallback(
    async (id: string) => {
      setLoadingId(id);
      const res = await fetch(`/api/chats/${id}`, {
        body: JSON.stringify({ isArchived: false }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      setLoadingId(null);
      if (res.ok) {
        toast.success("Conversation désarchivée");
        mutate();
      } else toast.error("Erreur désarchivage");
    },
    [mutate]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("Supprimer définitivement cette conversation archivée ?")) return;
      setLoadingId(id);
      const res = await fetch(`/api/chat?id=${id}`, { method: "DELETE" });
      setLoadingId(null);
      if (res.ok) {
        toast.success("Supprimée");
        mutate();
      } else toast.error("Erreur suppression");
    },
    [mutate]
  );

  const handleCopyId = useCallback(async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      toast.success("ID copié : " + id);
    } catch {
      toast.error("Impossible de copier");
    }
  }, []);

  const handleRename = useCallback(
    async (id: string) => {
      const v = editValue.trim();
      if (!v) {
        setEditingId(null);
        return;
      }
      setLoadingId(id);
      const res = await fetch(`/api/chats/${id}`, {
        body: JSON.stringify({ title: v }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      setLoadingId(null);
      if (res.ok) {
        toast.success("Renommée");
        setEditingId(null);
        mutate();
      } else toast.error("Erreur renommage");
    },
    [editValue, mutate]
  );

  return (
    <div className="flex flex-1 flex-col h-full overflow-y-auto bg-background p-4 sm:p-6 md:p-10 max-w-5xl mx-auto w-full">
      <div className="pb-6 border-b border-border/50">
        <div className="flex items-start gap-3">
          <PageBackButton />
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase mb-1">
              <span className="flex size-2 rounded-full bg-primary animate-pulse" />
              <ArchiveRestoreIcon className="size-4" />
              Messages Archivés
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Conversations archivées
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Retrouvez vos discussions archivées. Vous pouvez les renommer,
              copier leur ID, les désarchiver ou les supprimer.
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              className="pl-9 h-9 rounded-xl border-border/60 bg-muted/20 text-sm"
              placeholder="Rechercher dans les archivés..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {chats.length} {chats.length > 1 ? "conversations" : "conversation"}
          </span>
        </div>
      </div>

      <div className="py-6 flex flex-col gap-3">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <Loader2Icon className="size-6 animate-spin text-primary" />
            <span className="text-sm">Chargement des archivés...</span>
          </div>
        ) : chats.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center border border-dashed border-border/50 rounded-2xl bg-muted/10">
            <ArchiveRestoreIcon className="size-8 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-foreground">
              Aucune conversation archivée
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Archivez une discussion depuis l'historique ou les options de
              conversation pour la retrouver ici.
            </p>
            <Link
              href="/"
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90"
            >
              Nouvelle discussion
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {chats.map((c) => (
              <div
                key={c.id}
                className="group flex items-center gap-3 p-3 rounded-2xl border border-border/60 bg-card/60 hover:bg-card hover:shadow-sm transition-all"
              >
                <div className="flex-1 min-w-0">
                  {editingId === c.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        autoFocus
                        className="h-8 text-sm"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename(c.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        maxLength={100}
                      />
                      <Button
                        size="sm"
                        className="h-8 px-3"
                        onClick={() => handleRename(c.id)}
                        disabled={loadingId === c.id}
                      >
                        OK
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8"
                        onClick={() => setEditingId(null)}
                      >
                        Annuler
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Link
                        href={`/chat/${c.id}`}
                        className="block truncate text-sm font-semibold text-foreground hover:text-primary"
                      >
                        {c.title || "Sans titre"}
                      </Link>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                        <span className="font-mono truncate max-w-[180px]">
                          {c.id}
                        </span>
                        <span>•</span>
                        <span>
                          {c.archivedAt
                            ? new Date(c.archivedAt).toLocaleDateString("fr-FR")
                            : new Date(c.createdAt).toLocaleDateString("fr-FR")}
                        </span>
                        {c.pinned && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[10px] font-medium">
                            Épinglé
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="size-8 rounded-lg"
                    onClick={() => handleCopyId(c.id)}
                    title="Copier l'ID"
                  >
                    <CopyIcon className="size-4" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="size-8 rounded-lg"
                    onClick={() => {
                      setEditingId(c.id);
                      setEditValue(c.title);
                    }}
                    title="Renommer"
                  >
                    <Edit2Icon className="size-4" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="size-8 rounded-lg"
                    onClick={() => handleUnarchive(c.id)}
                    disabled={loadingId === c.id}
                    title="Désarchiver"
                  >
                    {loadingId === c.id ? (
                      <Loader2Icon className="size-4 animate-spin" />
                    ) : (
                      <ArchiveRestoreIcon className="size-4" />
                    )}
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="size-8 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleDelete(c.id)}
                    title="Supprimer"
                  >
                    <TrashIcon className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
