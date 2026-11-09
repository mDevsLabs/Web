"use client";

import {
  BrainIcon,
  CheckIcon,
  DownloadIcon,
  Loader2Icon,
  SearchIcon,
  SparklesIcon,
  StarIcon,
  TagIcon,
  UploadIcon,
  XIcon,
} from "@mdevs/icons";
import { type ChangeEvent, useMemo, useRef, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { useTier } from "@/hooks/use-tier";
import { extractApiErrorMessage } from "@/lib/api/client-error";
import { memoryLimitForTier } from "@/lib/auth/plan";
import { readJson } from "@/lib/client/read-json";
import { MEMORY_CONTENT_MAX_LENGTH } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { MemoryEntryRow } from "./memory/memory-entry-row";
import { MemoryImportDialog } from "./memory/memory-import-dialog";
import { MemorySummaryDialog } from "./memory/memory-summary-dialog";
import {
  isGlobalScope,
  type MemoryCardProps,
  type MemoryEntry,
  matchesScopeFilter,
  normalizeStr,
  SCOPE_FILTERS,
  type ScopeFilter,
} from "./memory/types";

export type { MemoryCardProps, MemoryEntry, ScopeFilter } from "./memory/types";

export function MemoryCard({ agentId, allScopes, projectId }: MemoryCardProps) {
  const { raw: tierRaw } = useTier();
  const fallbackLimit = memoryLimitForTier(tierRaw);
  const scopeQuery = agentId
    ? `?agentId=${agentId}`
    : projectId
      ? `?projectId=${projectId}`
      : "";
  const { data, error, mutate, isLoading, isValidating } = useSWR(
    allScopes ? "/api/memory?scope=all" : `/api/memory${scopeQuery}`,
    readJson<{ memories: MemoryEntry[]; limit?: number }>,
    { dedupingInterval: 10_000 }
  );

  const memories: MemoryEntry[] = Array.isArray(data?.memories)
    ? data.memories
    : [];
  const limit: number =
    typeof data?.limit === "number" && data.limit > 0
      ? data.limit
      : fallbackLimit;

  const scopeCount = allScopes
    ? memories.filter(isGlobalScope).length
    : memories.length;
  const isAtLimit = limit > 0 && scopeCount >= limit;

  // Filtres & Recherche
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("all");
  const [importantOnly, setImportantOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Ajout / Édition
  const [newContent, setNewContent] = useState("");
  const [newTagsInput, setNewTagsInput] = useState("");
  const [newIsImportant, setNewIsImportant] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editTagsInput, setEditTagsInput] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<MemoryEntry | null>(null);

  // Résumé IA
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [summaryCount, setSummaryCount] = useState(0);

  // Import / Export JSON
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<
    MemoryEntry[] | null
  >(null);

  // Filtrage avancé
  const importantCount = useMemo(
    () => memories.filter((m) => m.isImportant).length,
    [memories]
  );
  const filteredMemories = useMemo(
    () =>
      memories.filter((m) => {
        if (allScopes && !matchesScopeFilter(m, scopeFilter)) {
          return false;
        }
        if (importantOnly && !m.isImportant) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = normalizeStr(searchQuery);
          const contentMatch = normalizeStr(m.content).includes(q);
          const tagsMatch = (m.tags || []).some((t) =>
            normalizeStr(t).includes(q)
          );
          const agentMatch = m.agentName
            ? normalizeStr(m.agentName).includes(q)
            : false;
          const projMatch = m.projectName
            ? normalizeStr(m.projectName).includes(q)
            : false;
          if (!contentMatch && !tagsMatch && !agentMatch && !projMatch) {
            return false;
          }
        }
        return true;
      }),
    [memories, allScopes, scopeFilter, importantOnly, searchQuery]
  );

  // Ajouter une mémoire
  const handleAdd = async () => {
    const content = newContent.trim();
    if (!content || isSaving || isAtLimit || isLoading || (!data && error))
      return;
    setIsSaving(true);
    try {
      const tags = newTagsInput
        .split(",")
        .map((t) => t.replace(/^[#\s]+/, "").trim())
        .filter(Boolean);

      const res = await fetch("/api/memory", {
        body: JSON.stringify({
          content,
          isImportant: newIsImportant,
          tags,
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
      setNewTagsInput("");
      setNewIsImportant(false);
      await mutate();
      toast.success("Mémoire enregistrée");
    } catch {
      toast.error("Impossible de contacter le serveur");
    } finally {
      setIsSaving(false);
    }
  };

  // Mettre à jour le texte / tags
  const handleUpdate = async () => {
    if (!editingId || isUpdating || !editContent.trim()) return;
    setIsUpdating(true);
    try {
      const tags = editTagsInput
        .split(",")
        .map((t) => t.replace(/^[#\s]+/, "").trim())
        .filter(Boolean);

      const res = await fetch(`/api/memory/${editingId}`, {
        body: JSON.stringify({
          content: editContent.trim(),
          tags,
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      const resp = await res.json();
      if (!res.ok) {
        toast.error(resp.message || resp.cause || "Erreur de modification");
        return;
      }
      setEditingId(null);
      await mutate();
      toast.success("Mémoire mise à jour");
    } catch {
      toast.error("Impossible de contacter le serveur");
    } finally {
      setIsUpdating(false);
    }
  };

  // Basculer suspension On / Off
  const handleToggleEnabled = async (m: MemoryEntry) => {
    const nextState = m.isEnabled === false;
    try {
      const res = await fetch(`/api/memory/${m.id}`, {
        body: JSON.stringify({ isEnabled: nextState }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (!res.ok) {
        toast.error("Impossible de modifier l'état de la mémoire");
        return;
      }
      await mutate();
      toast.success(nextState ? "Mémoire réactivée" : "Mémoire suspendue");
    } catch {
      toast.error("Erreur réseau");
    }
  };

  // Basculer Étoile / Important
  const handleToggleImportant = async (m: MemoryEntry) => {
    const nextState = !m.isImportant;
    try {
      const res = await fetch(`/api/memory/${m.id}`, {
        body: JSON.stringify({ isImportant: nextState }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (!res.ok) {
        toast.error("Impossible de modifier l'importance");
        return;
      }
      await mutate();
      toast.success(
        nextState ? "Marquée comme importante ⭐" : "Importance retirée"
      );
    } catch {
      toast.error("Erreur réseau");
    }
  };

  // Supprimer
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/memory/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Erreur de suppression");
        return;
      }
      await mutate();
      toast.success("Mémoire effacée");
    } catch {
      toast.error("Impossible de contacter le serveur");
    } finally {
      setDeletingId(null);
      setPendingDelete(null);
    }
  };

  // Export JSON
  const handleExport = () => {
    if (memories.length === 0) {
      toast.error("Aucune mémoire à exporter.");
      return;
    }
    const exportData = {
      exportedAt: new Date().toISOString(),
      memories: memories.map((m) => ({
        content: m.content,
        createdAt: m.createdAt,
        isImportant: Boolean(m.isImportant),
        tags: m.tags || [],
      })),
      version: 1,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mai-memoire-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${memories.length} mémoires exportées.`);
  };

  // Sélection fichier JSON
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const rawList = Array.isArray(json)
          ? json
          : Array.isArray(json?.memories)
            ? json.memories
            : null;

        if (!rawList) {
          toast.error("Format de fichier JSON non reconnu.");
          return;
        }

        const validEntries: MemoryEntry[] = [];
        for (const item of rawList) {
          if (typeof item?.content === "string" && item.content.trim()) {
            validEntries.push({
              agentId: null,
              content: item.content.trim().slice(0, MEMORY_CONTENT_MAX_LENGTH),
              createdAt: item.createdAt || new Date().toISOString(),
              id: item.id || `temp-${Math.random()}`,
              isImportant: Boolean(item.isImportant),
              projectId: null,
              tags: Array.isArray(item.tags)
                ? item.tags.filter((t: unknown) => typeof t === "string")
                : [],
            });
          }
        }

        if (validEntries.length === 0) {
          toast.error("Aucune mémoire valide trouvée dans ce fichier.");
          return;
        }

        setPendingImportData(validEntries);
        setImportModalOpen(true);
      } catch {
        toast.error("Fichier JSON invalide.");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  // Confirmer l'importation
  const handleConfirmImport = async () => {
    if (!pendingImportData || pendingImportData.length === 0) return;
    setIsImporting(true);
    let successCount = 0;
    try {
      for (const item of pendingImportData) {
        const res = await fetch("/api/memory", {
          body: JSON.stringify({
            content: item.content,
            isImportant: item.isImportant,
            tags: item.tags,
            ...(agentId ? { agentId } : {}),
            ...(projectId ? { projectId } : {}),
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
        if (res.ok) {
          successCount++;
        }
      }
      await mutate();
      setImportModalOpen(false);
      setPendingImportData(null);
      toast.success(`${successCount} mémoire(s) importée(s) avec succès!`);
    } catch {
      toast.error("Erreur lors de l'importation");
    } finally {
      setIsImporting(false);
    }
  };

  // Résumé IA
  const handleSummarize = async () => {
    if (memories.length === 0) {
      toast.error("Aucune mémoire à synthétiser.");
      return;
    }
    setIsSummarizing(true);
    try {
      const res = await fetch("/api/memory/summary", {
        body: JSON.stringify({
          ...(agentId ? { agentId } : {}),
          ...(projectId ? { projectId } : {}),
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(extractApiErrorMessage(data) ?? "Erreur de génération");
      }
      setSummaryText(data.summary);
      setSummaryCount(data.memoryCount || memories.length);
      setSummaryModalOpen(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur de génération";
      toast.error(msg);
    } finally {
      setIsSummarizing(false);
    }
  };

  const remainingSlots = Math.max(0, limit - scopeCount);

  return (
    <div className="surface-card flex flex-col gap-4">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BrainIcon className="size-5" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Mémoire personnalisée
            </h3>
            <p className="text-xs text-muted-foreground">
              Faits et préférences mémorisés pour adapter les réponses à votre
              contexte.
            </p>
          </div>
        </div>

        {/* Boutons d'action : Synthèse IA, Import, Export, Quota */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border/60 bg-background/50 hover:bg-muted text-xs font-medium text-foreground transition cursor-pointer disabled:opacity-50"
            disabled={isSummarizing || memories.length === 0}
            onClick={handleSummarize}
            title="Générer une vue d'ensemble IA de vos mémoires"
            type="button"
          >
            {isSummarizing ? (
              <Loader2Icon className="size-3.5 animate-spin text-primary" />
            ) : (
              <SparklesIcon className="size-3.5 text-primary" />
            )}
            <span className="hidden sm:inline">Synthèse</span>
          </button>

          <button
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border/60 bg-background/50 hover:bg-muted text-xs font-medium text-foreground transition cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            title="Importer des mémoires depuis un fichier JSON"
            type="button"
          >
            <UploadIcon className="size-3.5" />
            <span className="hidden sm:inline">Importer</span>
          </button>
          <input
            accept=".json,application/json"
            aria-label="Fichier JSON de mémoires à importer"
            className="hidden"
            onChange={handleFileChange}
            ref={fileInputRef}
            type="file"
          />

          <button
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border/60 bg-background/50 hover:bg-muted text-xs font-medium text-foreground transition cursor-pointer disabled:opacity-50"
            disabled={memories.length === 0}
            onClick={handleExport}
            title="Exporter vos mémoires au format JSON"
            type="button"
          >
            <DownloadIcon className="size-3.5" />
            <span className="hidden sm:inline">Exporter</span>
          </button>

          <span
            className={cn(
              "text-xs px-2.5 py-1 rounded-full font-medium ml-1",
              isAtLimit
                ? "bg-destructive/10 text-destructive"
                : "bg-muted text-muted-foreground"
            )}
          >
            {scopeCount} / {limit > 0 ? limit : "∞"}
          </span>
        </div>
      </div>

      {/* Barre de Recherche et Filtres */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1 border-t border-border/40">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            aria-label="Rechercher dans les mémoires"
            className="pl-8 h-8 text-xs bg-background/50"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par contenu, #tag, bot..."
            value={searchQuery}
          />
          {searchQuery ? (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground"
              onClick={() => setSearchQuery("")}
              type="button"
            >
              <XIcon className="size-3" />
            </button>
          ) : null}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {allScopes ? (
            <div className="flex items-center rounded-lg border border-border/60 bg-muted/40 p-0.5 text-xs">
              {SCOPE_FILTERS.map((f) => (
                <button
                  className={cn(
                    "px-2 py-1 rounded-md text-[11px] font-medium transition cursor-pointer",
                    scopeFilter === f.id
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  key={f.id}
                  onClick={() => setScopeFilter(f.id)}
                  type="button"
                >
                  {f.label}
                </button>
              ))}
            </div>
          ) : null}

          <button
            aria-pressed={importantOnly}
            className={cn(
              "inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-medium transition cursor-pointer border",
              importantOnly
                ? "bg-warning/15 text-warning border-warning/30"
                : "bg-background/50 text-muted-foreground border-border/60 hover:text-foreground"
            )}
            onClick={() => setImportantOnly(!importantOnly)}
            type="button"
          >
            <StarIcon
              className={cn("size-3.5", importantOnly && "fill-current")}
            />
            <span className="hidden xs:inline">Importantes</span>
            <span className="opacity-70 text-[10px]">{importantCount}</span>
          </button>
        </div>
      </div>

      {/* Formulaire d'ajout */}
      <div className="flex flex-col gap-2.5 p-3 rounded-xl border border-border/60 bg-muted/20">
        <textarea
          aria-label="Nouvelle mémoire"
          className="w-full rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-y"
          maxLength={MEMORY_CONTENT_MAX_LENGTH}
          onChange={(e) => setNewContent(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              handleAdd();
            }
          }}
          placeholder="Ex: Je m'appelle Mathias, je préfère les réponses concises en français et du code TypeScript..."
          rows={2}
          value={newContent}
        />

        {/* Tags & importance */}
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-background px-2 h-7">
              <TagIcon className="size-3 text-muted-foreground" />
              <input
                aria-label="Tags de la nouvelle mémoire"
                className="w-28 text-[11px] bg-transparent outline-none placeholder:text-muted-foreground/60"
                onChange={(e) => setNewTagsInput(e.target.value)}
                placeholder="Tags (#ui, #ts)..."
                value={newTagsInput}
              />
            </div>

            <button
              aria-pressed={newIsImportant}
              className={cn(
                "inline-flex items-center gap-1 h-7 px-2 rounded-lg text-[11px] font-medium transition cursor-pointer border",
                newIsImportant
                  ? "bg-warning/15 text-warning border-warning/30"
                  : "bg-background text-muted-foreground border-border/60 hover:text-foreground"
              )}
              onClick={() => setNewIsImportant(!newIsImportant)}
              type="button"
            >
              <StarIcon
                className={cn("size-3.5", newIsImportant && "fill-current")}
              />
              <span>Important</span>
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-[10.5px] text-muted-foreground hidden sm:inline">
              {newContent.length}/{MEMORY_CONTENT_MAX_LENGTH}
            </span>
            <button
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-3.5 py-1.5 text-xs font-medium transition-all hover:opacity-90 active:scale-95 shadow-xs cursor-pointer disabled:opacity-50"
              disabled={
                isSaving ||
                !newContent.trim() ||
                isAtLimit ||
                isLoading ||
                (!data && Boolean(error))
              }
              onClick={handleAdd}
              type="button"
            >
              {isAtLimit ? (
                "Limite atteinte"
              ) : isSaving ? (
                <>
                  <Loader2Icon className="size-3.5 animate-spin" />
                  <span>Enregistrement…</span>
                </>
              ) : (
                <>
                  <CheckIcon className="size-3.5" />
                  <span>Enregistrer</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Liste des mémoires */}
      {error && (
        <div
          className="surface-muted flex flex-wrap items-center justify-between gap-3 text-sm"
          role="alert"
        >
          <p className="text-destructive">
            Impossible de charger la mémoire. Vos données n’ont pas été
            supprimées.
          </p>
          <Button
            disabled={isValidating}
            onClick={() => void mutate().catch(() => undefined)}
            size="sm"
            variant="outline"
          >
            Réessayer
          </Button>
        </div>
      )}
      {isLoading && !error ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Loader2Icon className="size-5 animate-spin" />
        </div>
      ) : !data && error ? null : filteredMemories.length === 0 ? (
        <div className="text-center py-6 text-xs text-muted-foreground space-y-1">
          <p>
            {memories.length === 0
              ? "Aucune mémoire enregistrée. Ajoutez des faits ou utilisez @Memory dans le chat."
              : "Aucune mémoire ne correspond aux filtres ou à la recherche."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredMemories.map((m) => (
            <MemoryEntryRow
              allScopes={allScopes}
              deletingId={deletingId}
              editContent={editContent}
              editTagsInput={editTagsInput}
              entry={m}
              isEditing={editingId === m.id}
              isUpdating={isUpdating}
              key={m.id}
              onCancelEdit={() => setEditingId(null)}
              onChangeContent={setEditContent}
              onChangeTags={setEditTagsInput}
              onRequestDelete={setPendingDelete}
              onSaveEdit={handleUpdate}
              onStartEdit={(entry) => {
                setEditingId(entry.id);
                setEditContent(entry.content);
                setEditTagsInput((entry.tags || []).join(", "));
              }}
              onToggleEnabled={handleToggleEnabled}
              onToggleImportant={handleToggleImportant}
            />
          ))}
        </div>
      )}

      {/* Dialogue de confirmation de suppression */}
      <AlertDialog
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        open={Boolean(pendingDelete)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette mémoire?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `« ${pendingDelete.content.slice(0, 160)}${
                    pendingDelete.content.length > 160 ? "…" : ""
                  }» ne sera plus injectée dans les réponses de l'IA.`
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

      {/* Modal de Résumé IA */}
      <MemorySummaryDialog
        onOpenChange={setSummaryModalOpen}
        open={summaryModalOpen}
        summaryCount={summaryCount}
        summaryText={summaryText}
      />

      {/* Modal d'Importation JSON */}
      <MemoryImportDialog
        isImporting={isImporting}
        limit={limit}
        onCancel={() => {
          setImportModalOpen(false);
          setPendingImportData(null);
        }}
        onConfirmImport={handleConfirmImport}
        onOpenChange={setImportModalOpen}
        open={importModalOpen}
        pendingImportData={pendingImportData}
        remainingSlots={remainingSlots}
        scopeCount={scopeCount}
      />
    </div>
  );
}
