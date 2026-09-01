"use client";

import {
  BotIcon,
  BrainIcon,
  CheckIcon,
  CopyIcon,
  FolderKanbanIcon,
  GlobeIcon,
  Loader2Icon,
  PencilIcon,
  SparklesIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MEMORY_CONTENT_MAX_LENGTH } from "@/lib/constants";

type MemoryEntry = {
  agentId: string | null;
  agentName?: string | null;
  content: string;
  createdAt: string;
  id: string;
  projectId: string | null;
  projectName?: string | null;
};

type MemoryCardProps = {
  agentId?: string;
  /** Onglet Mémoire : liste toutes les portées avec un filtre. */
  allScopes?: boolean;
  projectId?: string;
};

type ScopeFilter = "agent" | "all" | "global" | "project";

const SCOPE_FILTERS: { id: ScopeFilter; label: string }[] = [
  { id: "all", label: "Toutes" },
  { id: "global", label: "Globales" },
  { id: "agent", label: "Agents" },
  { id: "project", label: "Projets" },
];

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

function isGlobalScope(entry: MemoryEntry): boolean {
  return !entry.agentId && !entry.projectId;
}

function matchesFilter(entry: MemoryEntry, filter: ScopeFilter): boolean {
  if (filter === "all") {
    return true;
  }
  if (filter === "global") {
    return isGlobalScope(entry);
  }
  if (filter === "agent") {
    return Boolean(entry.agentId);
  }
  return Boolean(entry.projectId);
}

function scopeLabel(entry: MemoryEntry): string {
  if (entry.agentId) {
    return entry.agentName ? `Agent · ${entry.agentName}` : "Agent";
  }
  if (entry.projectId) {
    return entry.projectName ? `Projet · ${entry.projectName}` : "Projet";
  }
  return "Globale";
}

export function MemoryCard({
  agentId,
  allScopes,
  projectId,
}: MemoryCardProps) {
  const scopeQuery = agentId
    ? `?agentId=${agentId}`
    : projectId
      ? `?projectId=${projectId}`
      : "";
  const { data, mutate, isLoading } = useSWR(
    allScopes ? "/api/memory?scope=all" : `/api/memory${scopeQuery}`,
    (url: string) => fetch(url).then((r) => r.json()),
    { dedupingInterval: 10_000 }
  );
  const memories: MemoryEntry[] = data?.memories || [];
  const limit: number = typeof data?.limit === "number" ? data.limit : 50;

  // L'ajout se fait toujours dans la portée de la carte : globale quand toutes
  // les portées sont affichées. Le quota se juge sur cette portée uniquement.
  const scopeCount = allScopes
    ? memories.filter(isGlobalScope).length
    : memories.length;
  const isAtLimit = scopeCount >= limit;

  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("all");
  const [newContent, setNewContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<MemoryEntry | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Résumé IA de la mémoire
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [summaryCount, setSummaryCount] = useState(0);

  const handleSummarize = async () => {
    setIsSummarizing(true);
    try {
      const res = await fetch("/api/memory/summary", {
        body: JSON.stringify({
          ...(agentId ? { agentId } : {}),
          ...(projectId ? { projectId } : {}),
          scope: allScopes ? scopeFilter : undefined,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erreur lors de la génération du résumé");
        return;
      }
      setSummaryText(data.summary || "");
      setSummaryCount(data.count || 0);
      setSummaryModalOpen(true);
      toast.success("Résumé de mémoire généré avec succès !");
    } catch {
      toast.error("Erreur de communication avec le serveur");
    } finally {
      setIsSummarizing(false);
    }
  };

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

  const handleUpdate = async () => {
    const content = editContent.trim();
    if (!editingId || !content) {
      return;
    }
    setIsUpdating(true);
    try {
      const res = await fetch("/api/memory", {
        body: JSON.stringify({ content, id: editingId }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      const resp = await res.json();
      if (!res.ok) {
        toast.error(resp.message || resp.cause || "Erreur de modification");
        return;
      }
      toast.success("Mémoire mise à jour");
      setEditingId(null);
      setEditContent("");
      await mutate();
    } catch {
      toast.error("Erreur de modification");
    } finally {
      setIsUpdating(false);
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
      setPendingDelete(null);
    }
  };

  const visibleMemories = allScopes
    ? memories.filter((m) => matchesFilter(m, scopeFilter))
    : memories;

  const title = allScopes
    ? "Mémoire"
    : `Mémoire ${agentId ? "de l'agent" : projectId ? "du projet" : "personnalisée"}`;
  const scopeLabelHeader = agentId
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
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">
            {scopeLabelHeader.charAt(0).toUpperCase() +
              scopeLabelHeader.slice(1)}{" "}
            — injectées automatiquement dans les réponses de l'IA.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-xs hover:from-sky-600 hover:to-indigo-700 text-xs h-8 px-3"
            disabled={isSummarizing || memories.length === 0}
            onClick={handleSummarize}
            size="sm"
            type="button"
          >
            {isSummarizing ? (
              <Loader2Icon className="size-3.5 animate-spin" />
            ) : (
              <SparklesIcon className="size-3.5" />
            )}
            <span>Résumer</span>
          </Button>
          <span className="text-[11px] text-muted-foreground font-medium">
            {scopeCount}/{limit}
          </span>
        </div>
      </div>

      {allScopes ? (
        <div className="flex items-center gap-1.5 flex-wrap">
          {SCOPE_FILTERS.map((filter) => {
            const count = memories.filter((m) =>
              matchesFilter(m, filter.id)
            ).length;
            return (
              <button
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-medium transition-colors cursor-pointer ${
                  scopeFilter === filter.id
                    ? "bg-sky-600 text-white"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                key={filter.id}
                onClick={() => setScopeFilter(filter.id)}
                type="button"
              >
                {filter.label}
                <span className="opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <textarea
          className="w-full rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-y"
          maxLength={MEMORY_CONTENT_MAX_LENGTH}
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
            {newContent.length}/{MEMORY_CONTENT_MAX_LENGTH}
            {allScopes ? " — enregistré en mémoire globale" : ""} — Ctrl+Entrée
            pour enregistrer
          </span>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 text-white px-4 py-2 text-sm font-medium transition-all hover:opacity-90 active:scale-95 shadow-sm cursor-pointer disabled:opacity-50"
            disabled={isSaving || !newContent.trim() || isAtLimit}
            onClick={handleAdd}
            title={
              isAtLimit
                ? `Limite de ${limit} mémoires atteinte pour ce scope`
                : undefined
            }
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
      ) : visibleMemories.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">
          {memories.length === 0
            ? "Aucune mémoire pour le moment. Vous pouvez aussi demander à l'IA dans le chat via la mention @Memory (« retiens que... »)."
            : "Aucune mémoire dans cette portée."}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {visibleMemories.map((m) => {
            const isEditing = editingId === m.id;
            return (
              <div
                className="rounded-xl border border-border/40 bg-muted/20 px-3 py-2.5"
                key={m.id}
              >
                {isEditing ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      className="w-full rounded-lg border border-border/60 bg-background px-2.5 py-2 text-[13px] outline-none focus:ring-2 focus:ring-primary/20 resize-y"
                      maxLength={MEMORY_CONTENT_MAX_LENGTH}
                      onChange={(e) => setEditContent(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                          handleUpdate();
                        }
                        if (e.key === "Escape") {
                          setEditingId(null);
                        }
                      }}
                      rows={3}
                      value={editContent}
                    />
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10.5px] text-muted-foreground">
                        {editContent.length}/{MEMORY_CONTENT_MAX_LENGTH}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          aria-label="Annuler la modification"
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                          onClick={() => setEditingId(null)}
                          type="button"
                        >
                          <XIcon className="size-3.5" />
                          Annuler
                        </button>
                        <button
                          className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 text-white px-3 py-1.5 text-[12px] font-medium transition-all hover:opacity-90 cursor-pointer disabled:opacity-50"
                          disabled={isUpdating || !editContent.trim()}
                          onClick={handleUpdate}
                          type="button"
                        >
                          {isUpdating ? (
                            <Loader2Icon className="size-3.5 animate-spin" />
                          ) : (
                            <CheckIcon className="size-3.5" />
                          )}
                          Enregistrer
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <BrainIcon className="size-3.5 text-sky-600 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-foreground break-words">
                        {m.content}
                      </p>
                      <span className="text-[10.5px] text-muted-foreground">
                        {allScopes ? (
                          <>
                            {m.agentId ? (
                              <BotIcon className="size-3 inline -mt-0.5 mr-0.5" />
                            ) : m.projectId ? (
                              <FolderKanbanIcon className="size-3 inline -mt-0.5 mr-0.5" />
                            ) : (
                              <GlobeIcon className="size-3 inline -mt-0.5 mr-0.5" />
                            )}
                            {scopeLabel(m)} ·{" "}
                          </>
                        ) : null}
                        {formatMemoryDate(m.createdAt)}
                      </span>
                    </div>
                    <button
                      aria-label="Modifier cette mémoire"
                      className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => {
                        setEditingId(m.id);
                        setEditContent(m.content);
                      }}
                      title="Modifier"
                      type="button"
                    >
                      <PencilIcon className="size-3.5" />
                    </button>
                    <button
                      aria-label="Supprimer cette mémoire"
                      className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      disabled={deletingId === m.id}
                      onClick={() => setPendingDelete(m)}
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
                )}
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog
        onOpenChange={(open) => {
          if (!open) {
            setPendingDelete(null);
          }
        }}
        open={Boolean(pendingDelete)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette mémoire ?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `« ${pendingDelete.content.slice(0, 160)}${
                    pendingDelete.content.length > 160 ? "…" : ""
                  } » ne sera plus injectée dans les réponses de l'IA.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) {
                  handleDelete(pendingDelete.id);
                }
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal interactif de résumé IA de la mémoire */}
      <Dialog onOpenChange={setSummaryModalOpen} open={summaryModalOpen}>
        <DialogContent className="sm:max-w-[620px] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600">
                <BrainIcon className="size-4" />
              </span>
              <DialogTitle>Synthèse de votre Mémoire 🧠</DialogTitle>
            </div>
            <DialogDescription>
              Synthèse structurée de vos {summaryCount} informations mémorisées, organisée par sections par l'IA.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto max-h-[50vh] rounded-xl border border-border/50 bg-muted/20 p-4 text-xs leading-relaxed text-foreground space-y-3 whitespace-pre-wrap font-sans">
            {summaryText}
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between pt-2">
            <Button
              className="gap-1.5"
              onClick={() => {
                navigator.clipboard.writeText(summaryText);
                toast.success("Synthèse copiée dans le presse-papiers !");
              }}
              size="sm"
              type="button"
              variant="outline"
            >
              <CopyIcon className="size-3.5" />
              <span>Copier la synthèse</span>
            </Button>
            <Button
              onClick={() => setSummaryModalOpen(false)}
              size="sm"
              type="button"
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
