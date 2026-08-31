"use client";

import { BrainIcon, Loader2Icon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

type MemoryEntry = {
  agentId: string | null;
  content: string;
  createdAt: string;
  id: string;
  projectId: string | null;
};

type MemoryCardProps = {
  agentId?: string;
  projectId?: string;
};

function formatMemoryDate(value: string): string {
  try {
    return new Date(value).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function MemoryCard({ agentId, projectId }: MemoryCardProps) {
  const scopeQuery = agentId
    ? `?agentId=${agentId}`
    : projectId
      ? `?projectId=${projectId}`
      : "";
  const { data, mutate, isLoading } = useSWR(
    `/api/memory${scopeQuery}`,
    (url: string) => fetch(url).then((r) => r.json()),
    { dedupingInterval: 10_000 }
  );
  const memories: MemoryEntry[] = data?.memories || [];
  const limit: number = typeof data?.limit === "number" ? data.limit : 50;
  const isAtLimit = memories.length >= limit;

  const [newContent, setNewContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = async () => {
    const content = newContent.trim();
    if (!content) {
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/memory", {
        body: JSON.stringify({
          content,
          ...(agentId ? { agentId } : {}),
          ...(projectId ? { projectId } : {}),
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const resp = await res.json();
      if (!res.ok) {
        toast.error(resp.message || resp.cause || "Erreur d'enregistrement");
        return;
      }
      setNewContent("");
      toast.success("Mémoire enregistrée");
      await mutate();
    } catch {
      toast.error("Erreur d'enregistrement");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/memory?id=${id}`, { method: "DELETE" });
      const resp = await res.json();
      if (!res.ok) {
        toast.error(resp.message || resp.cause || "Erreur de suppression");
        return;
      }
      toast.success("Mémoire supprimée");
      await mutate();
    } catch {
      toast.error("Erreur de suppression");
    } finally {
      setDeletingId(null);
    }
  };

  const scopeLabel = agentId
    ? "mémoires de cet agent"
    : projectId
      ? "mémoires de ce projet"
      : "informations que mAI retient sur vous";

  return (
    <div className="p-4 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md flex flex-col gap-4 sm:p-6">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 ring-1 ring-sky-500/20">
          <BrainIcon className="size-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-foreground">
            Mémoire {agentId ? "de l'agent" : projectId ? "du projet" : "personnalisée"}
          </h3>
          <p className="text-xs text-muted-foreground">
            {scopeLabel.charAt(0).toUpperCase() + scopeLabel.slice(1)} —
            injectées automatiquement dans les réponses de l'IA.
          </p>
        </div>
        <span className="text-[11px] text-muted-foreground font-medium">
          {memories.length}/{limit}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <textarea
          className="w-full rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-y"
          maxLength={2000}
          onChange={(e) => setNewContent(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              handleAdd();
            }
          }}
          placeholder="Ex : Je m'appelle Mathias, je préfère les réponses en français et du code TypeScript. Mon projet principal est mAI Web..."
          rows={3}
          value={newContent}
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] text-muted-foreground text-left">
            {newContent.length}/2000 — Ctrl+Entrée pour enregistrer
          </span>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 text-white px-4 py-2 text-sm font-medium transition-all hover:opacity-90 active:scale-95 shadow-sm cursor-pointer disabled:opacity-50"
            disabled={isSaving || !newContent.trim() || isAtLimit}
            onClick={handleAdd}
            title={isAtLimit ? `Limite de ${limit} mémoires atteinte pour ce scope` : undefined}
            type="button"
          >
            {isAtLimit
              ? "Limite atteinte"
              : isSaving
                ? (<Loader2Icon className="size-4 animate-spin" />)
                : ("Retenir cette information")}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-4 text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
        </div>
      ) : memories.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">
          Aucune mémoire pour le moment. Vous pouvez aussi demander à l'IA dans
          le chat via la mention @Memory (« retiens que... »).
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {memories.map((m) => (
            <div
              className="flex items-start gap-3 rounded-xl border border-border/40 bg-muted/20 px-3 py-2.5"
              key={m.id}
            >
              <BrainIcon className="size-3.5 text-sky-600 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-foreground break-words">
                  {m.content}
                </p>
                <span className="text-[10.5px] text-muted-foreground">
                  {formatMemoryDate(m.createdAt)}
                </span>
              </div>
              <button
                aria-label="Supprimer cette mémoire"
                className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                disabled={deletingId === m.id}
                onClick={() => handleDelete(m.id)}
                title="Supprimer"
                type="button"
              >
                {deletingId === m.id ? (
                  <Loader2Icon className="size-3.5 animate-spin" />
                ) : (
                  <Trash2Icon className="size-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
