"use client";

import {
  AlertCircleIcon,
  BotIcon,
  BrainIcon,
  CheckIcon,
  CodeIcon,
  CopyIcon,
  DownloadIcon,
  FileJsonIcon,
  FolderKanbanIcon,
  GlobeIcon,
  LightbulbIcon,
  Loader2Icon,
  PencilIcon,
  PowerIcon,
  ScrollTextIcon,
  SearchIcon,
  Settings2Icon,
  SparklesIcon,
  StarIcon,
  TagIcon,
  Trash2Icon,
  UploadIcon,
  UserIcon,
  XIcon,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MEMORY_CONTENT_MAX_LENGTH } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type MemoryEntry = {
  agentId: string | null;
  agentName?: string | null;
  category?: string | null;
  content: string;
  createdAt: string;
  id: string;
  isEnabled?: boolean;
  isImportant?: boolean;
  projectId: string | null;
  projectName?: string | null;
  tags?: string[] | null;
  updatedAt?: string;
};

type MemoryCardProps = {
  agentId?: string;
  /** Onglet Mémoire : liste toutes les portées avec un filtre. */
  allScopes?: boolean;
  projectId?: string;
};

type ScopeFilter = "agent" | "all" | "global" | "project";

const SCOPE_FILTERS: { id: ScopeFilter; label: string }[] = [
  { id: "all", label: "Toutes les portées" },
  { id: "global", label: "Globales" },
  { id: "agent", label: "Agents" },
  { id: "project", label: "Projets" },
];

export const MEMORY_CATEGORIES = [
  { icon: LightbulbIcon, id: "general", label: "Général" },
  { icon: Settings2Icon, id: "preferences", label: "Préférences" },
  { icon: CodeIcon, id: "dev", label: "Code & Dev" },
  { icon: FolderKanbanIcon, id: "projects", label: "Projets" },
  { icon: UserIcon, id: "personal", label: "Personnel" },
  { icon: ScrollTextIcon, id: "rules", label: "Règles" },
] as const;

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

function matchesScopeFilter(entry: MemoryEntry, filter: ScopeFilter): boolean {
  if (filter === "all") return true;
  if (filter === "global") return isGlobalScope(entry);
  if (filter === "agent") return Boolean(entry.agentId);
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

function normalizeStr(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function MemoryCard({ agentId, allScopes, projectId }: MemoryCardProps) {
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

  const scopeCount = allScopes
    ? memories.filter(isGlobalScope).length
    : memories.length;
  const isAtLimit = scopeCount >= limit;

  // Filtres & Recherche
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Ajout / Édition
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<string>("general");
  const [newTagsInput, setNewTagsInput] = useState("");
  const [newIsImportant, setNewIsImportant] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState<string>("general");
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
  const filteredMemories = useMemo(() => {
    return memories.filter((m) => {
      // Filtre scope
      if (allScopes && !matchesScopeFilter(m, scopeFilter)) {
        return false;
      }
      // Filtre catégorie / important
      if (categoryFilter === "important") {
        if (!m.isImportant) return false;
      } else if (categoryFilter !== "all") {
        if ((m.category || "general") !== categoryFilter) return false;
      }
      // Filtre recherche textuelle
      if (searchQuery.trim()) {
        const q = normalizeStr(searchQuery);
        const contentMatch = normalizeStr(m.content).includes(q);
        const catMatch = normalizeStr(m.category || "").includes(q);
        const tagsMatch = (m.tags || []).some((t) =>
          normalizeStr(t).includes(q)
        );
        const agentMatch = m.agentName
          ? normalizeStr(m.agentName).includes(q)
          : false;
        const projMatch = m.projectName
          ? normalizeStr(m.projectName).includes(q)
          : false;
        if (
          !contentMatch &&
          !catMatch &&
          !tagsMatch &&
          !agentMatch &&
          !projMatch
        ) {
          return false;
        }
      }
      return true;
    });
  }, [memories, allScopes, scopeFilter, categoryFilter, searchQuery]);

  // Ajouter une mémoire
  const handleAdd = async () => {
    const content = newContent.trim();
    if (!content) return;
    setIsSaving(true);
    try {
      const tags = newTagsInput
        .split(",")
        .map((t) => t.replace(/^[#\s]+/, "").trim())
        .filter(Boolean);

      const res = await fetch("/api/memory", {
        body: JSON.stringify({
          category: newCategory,
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
      toast.success("Mémoire enregistrée avec succès ! ✨");
      await mutate();
    } catch {
      toast.error("Erreur d'enregistrement");
    } finally {
      setIsSaving(false);
    }
  };

  // Mettre à jour une mémoire
  const handleUpdate = async () => {
    const content = editContent.trim();
    if (!editingId || !content) return;
    setIsUpdating(true);
    try {
      const tags = editTagsInput
        .split(",")
        .map((t) => t.replace(/^[#\s]+/, "").trim())
        .filter(Boolean);

      const res = await fetch("/api/memory", {
        body: JSON.stringify({
          category: editCategory,
          content,
          id: editingId,
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

  // Basculer l'état Important (Étoile)
  const handleToggleImportant = async (m: MemoryEntry) => {
    const nextVal = !m.isImportant;
    // Mise à jour optimiste
    mutate((curr: any) => {
      if (!curr?.memories) return curr;
      return {
        ...curr,
        memories: curr.memories.map((item: MemoryEntry) =>
          item.id === m.id ? { ...item, isImportant: nextVal } : item
        ),
      };
    }, false);

    try {
      const res = await fetch("/api/memory", {
        body: JSON.stringify({ id: m.id, isImportant: nextVal }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (!res.ok) {
        toast.error("Échec de la modification de priorité");
        await mutate();
        return;
      }
      toast.success(
        nextVal
          ? "Marqué comme important ⭐ (injecté en priorité)"
          : "Retiré des mémoires importantes"
      );
      await mutate();
    } catch {
      toast.error("Erreur de communication avec le serveur");
      await mutate();
    }
  };

  // Basculer l'état Activé / Désactivé (Interrupteur)
  const handleToggleEnabled = async (m: MemoryEntry) => {
    const nextVal = !(m.isEnabled ?? true);
    // Mise à jour optimiste
    mutate((curr: any) => {
      if (!curr?.memories) return curr;
      return {
        ...curr,
        memories: curr.memories.map((item: MemoryEntry) =>
          item.id === m.id ? { ...item, isEnabled: nextVal } : item
        ),
      };
    }, false);

    try {
      const res = await fetch("/api/memory", {
        body: JSON.stringify({ id: m.id, isEnabled: nextVal }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (!res.ok) {
        toast.error("Échec de l'activation/désactivation");
        await mutate();
        return;
      }
      toast.success(
        nextVal ? "Mémoire activée ⚡" : "Mémoire suspendue (non injectée) ⏸️"
      );
      await mutate();
    } catch {
      toast.error("Erreur de communication");
      await mutate();
    }
  };

  // Supprimer une mémoire
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

  // Synthèse IA
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
      toast.success("Résumé de mémoire généré avec succès ! 🧠");
    } catch {
      toast.error("Erreur de communication avec le serveur");
    } finally {
      setIsSummarizing(false);
    }
  };

  // Export JSON (JSON seulement)
  const handleExportJson = () => {
    if (memories.length === 0) {
      toast.error("Aucune mémoire à exporter.");
      return;
    }
    const exportPayload = {
      count: memories.length,
      exportedAt: new Date().toISOString(),
      memories: memories.map((m) => ({
        category: m.category || "general",
        content: m.content,
        createdAt: m.createdAt,
        isEnabled: m.isEnabled ?? true,
        isImportant: m.isImportant ?? false,
        scope: m.agentId ? "agent" : m.projectId ? "project" : "global",
        tags: m.tags || [],
      })),
      version: "1.0",
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mAI-memoire-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Mémoire exportée en format JSON ! 📤");
  };

  // Sélection de fichier JSON pour Import
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      toast.error(
        "Seuls les fichiers JSON (.json) sont autorisés pour l'import."
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const rawList = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed?.memories)
            ? parsed.memories
            : null;

        if (!rawList || rawList.length === 0) {
          toast.error("Fichier JSON invalide ou sans aucune mémoire.");
          return;
        }

        const validItems: MemoryEntry[] = rawList
          .map((item: any, idx: number) => ({
            agentId: item.agentId || null,
            category: item.category || "general",
            content:
              typeof item === "string" ? item : String(item.content || ""),
            createdAt: item.createdAt || new Date().toISOString(),
            id: `temp-${idx}`,
            isEnabled: item.isEnabled !== false,
            isImportant: Boolean(item.isImportant),
            projectId: item.projectId || null,
            tags: Array.isArray(item.tags) ? item.tags : [],
          }))
          .filter((item: MemoryEntry) => item.content.trim().length > 0);

        if (validItems.length === 0) {
          toast.error("Aucune mémoire valide trouvée dans ce JSON.");
          return;
        }

        setPendingImportData(validItems);
        setImportModalOpen(true);
      } catch {
        toast.error("Erreur de lecture du fichier JSON. Format corrompu.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Exécution de l'Import JSON
  const handleConfirmImport = async () => {
    if (!pendingImportData || pendingImportData.length === 0) return;
    setIsImporting(true);
    try {
      const res = await fetch("/api/memory/import", {
        body: JSON.stringify({ memories: pendingImportData }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erreur lors de l'import");
        return;
      }
      toast.success(
        `Import réussi ! 🎉 ${data.count} mémoires ajoutées${data.skipped ? ` (${data.skipped} doublons ignorés)` : ""}.`
      );
      setImportModalOpen(false);
      setPendingImportData(null);
      await mutate();
    } catch {
      toast.error("Erreur de connexion au serveur.");
    } finally {
      setIsImporting(false);
    }
  };

  const title = allScopes
    ? "Mémoire"
    : `Mémoire ${agentId ? "de l'agent" : projectId ? "du projet" : "personnalisée"}`;
  const scopeLabelHeader = agentId
    ? "mémoires de cet agent"
    : projectId
      ? "mémoires de ce projet"
      : "informations que mAI retient sur vous";

  const remainingSlots = Math.max(0, limit - scopeCount);

  return (
    <div className="p-4 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md flex flex-col gap-4 sm:p-6">
      {/* En-tête */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 ring-1 ring-sky-500/20">
          <BrainIcon className="size-5" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">
            {scopeLabelHeader.charAt(0).toUpperCase() +
              scopeLabelHeader.slice(1)}{" "}
            — injectées intelligemment dans les réponses de l'IA.
          </p>
        </div>

        {/* Actions header : Import/Export, Résumé, Quota */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Export JSON */}
          <Button
            className="h-8 px-2.5 text-xs gap-1.5 rounded-xl cursor-pointer"
            disabled={memories.length === 0}
            onClick={handleExportJson}
            size="sm"
            title="Exporter vos mémoires en fichier JSON"
            type="button"
            variant="outline"
          >
            <DownloadIcon className="size-3.5" />
            <span className="hidden sm:inline">Exporter (JSON)</span>
          </Button>

          {/* Import JSON */}
          <input
            accept=".json,application/json"
            className="hidden"
            onChange={handleFileChange}
            ref={fileInputRef}
            type="file"
          />
          <Button
            className="h-8 px-2.5 text-xs gap-1.5 rounded-xl cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            size="sm"
            title="Importer des mémoires depuis un fichier JSON"
            type="button"
            variant="outline"
          >
            <UploadIcon className="size-3.5" />
            <span className="hidden sm:inline">Importer (JSON)</span>
          </Button>

          {/* Résumer IA */}
          <Button
            className="gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-xs hover:from-sky-600 hover:to-indigo-700 text-xs h-8 px-3 cursor-pointer"
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

          {/* Badge quota */}
          <span className="text-[11px] bg-muted/60 px-2.5 py-1 rounded-lg text-muted-foreground font-semibold">
            {scopeCount}/{limit}
          </span>
        </div>
      </div>

      {/* Barre de recherche & Filtres */}
      <div className="flex flex-col gap-2.5 pt-1 border-t border-border/40">
        <div className="flex items-center gap-2">
          {/* Input de recherche */}
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              className="pl-9 pr-8 h-9 text-xs rounded-xl bg-muted/30 border-border/60"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher dans la mémoire (texte, #tag, catégorie)..."
              value={searchQuery}
            />
            {searchQuery ? (
              <button
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                onClick={() => setSearchQuery("")}
                type="button"
              >
                <XIcon className="size-3.5" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Filtres par portée (si allScopes) */}
        {allScopes ? (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-muted-foreground font-medium mr-1">
              Portée :
            </span>
            {SCOPE_FILTERS.map((filter) => {
              const count = memories.filter((m) =>
                matchesScopeFilter(m, filter.id)
              ).length;
              return (
                <button
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11.5px] font-medium transition-colors cursor-pointer",
                    scopeFilter === filter.id
                      ? "bg-sky-600 text-white shadow-xs"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  key={filter.id}
                  onClick={() => setScopeFilter(filter.id)}
                  type="button"
                >
                  {filter.label}
                  <span className="opacity-70 text-[10px]">{count}</span>
                </button>
              );
            })}
          </div>
        ) : null}

        {/* Filtres par Catégorie & Favoris */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-muted-foreground font-medium mr-1">
            Catégorie :
          </span>
          <button
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer",
              categoryFilter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            onClick={() => setCategoryFilter("all")}
            type="button"
          >
            <GlobeIcon className="size-3" />
            <span>Toutes</span>
          </button>
          <button
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer",
              categoryFilter === "important"
                ? "bg-amber-500 text-white"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
            )}
            onClick={() => setCategoryFilter("important")}
            type="button"
          >
            <StarIcon className="size-3 fill-current" />
            <span>Important</span>
          </button>
          {MEMORY_CATEGORIES.map((cat) => {
            const CatIcon = cat.icon;
            return (
              <button
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer",
                  categoryFilter === cat.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                type="button"
              >
                <CatIcon className="size-3" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Formulaire d'ajout */}
      <div className="flex flex-col gap-2.5 p-3 rounded-xl border border-border/60 bg-muted/20">
        <textarea
          className="w-full rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-y"
          maxLength={MEMORY_CONTENT_MAX_LENGTH}
          onChange={(e) => setNewContent(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              handleAdd();
            }
          }}
          placeholder="Ex : Je m'appelle Mathias, je préfère les réponses concises en français et du code TypeScript..."
          rows={2}
          value={newContent}
        />

        {/* Options de catégorisation & tags */}
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Sélecteur de catégorie */}
            <select
              aria-label="Catégorie de la mémoire"
              className="h-7 rounded-lg border border-border/60 bg-background px-2 text-[11.5px] text-foreground outline-none cursor-pointer"
              onChange={(e) => setNewCategory(e.target.value)}
              value={newCategory}
            >
              {MEMORY_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>

            {/* Input de tags */}
            <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-background px-2 h-7">
              <TagIcon className="size-3 text-muted-foreground" />
              <input
                className="w-28 text-[11px] bg-transparent outline-none placeholder:text-muted-foreground/60"
                onChange={(e) => setNewTagsInput(e.target.value)}
                placeholder="Tags (#ui, #ts)..."
                value={newTagsInput}
              />
            </div>

            {/* Étoile importante */}
            <button
              className={cn(
                "inline-flex items-center gap-1 h-7 px-2 rounded-lg text-[11px] font-medium transition cursor-pointer border",
                newIsImportant
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
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
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-600 text-white px-3.5 py-1.5 text-xs font-medium transition-all hover:opacity-90 active:scale-95 shadow-xs cursor-pointer disabled:opacity-50"
              disabled={isSaving || !newContent.trim() || isAtLimit}
              onClick={handleAdd}
              type="button"
            >
              {isAtLimit ? (
                "Limite atteinte"
              ) : isSaving ? (
                <Loader2Icon className="size-3.5 animate-spin" />
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
      {isLoading ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Loader2Icon className="size-5 animate-spin" />
        </div>
      ) : filteredMemories.length === 0 ? (
        <div className="text-center py-6 text-xs text-muted-foreground space-y-1">
          <p>
            {memories.length === 0
              ? "Aucune mémoire enregistrée. Ajoutez des faits ou utilisez @Memory dans le chat."
              : "Aucune mémoire ne correspond aux filtres ou à la recherche."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredMemories.map((m) => {
            const isEditing = editingId === m.id;
            const isEnabled = m.isEnabled !== false;
            const isImportant = Boolean(m.isImportant);
            const catObj = MEMORY_CATEGORIES.find(
              (c) => c.id === (m.category || "general")
            );

            return (
              <div
                className={cn(
                  "rounded-xl border transition-all p-3",
                  !isEnabled && "opacity-60 bg-muted/10 border-border/30",
                  isEnabled &&
                    (isImportant
                      ? "bg-amber-500/5 border-amber-500/30 shadow-xs"
                      : "bg-muted/20 border-border/40 hover:border-border/70")
                )}
                key={m.id}
              >
                {isEditing ? (
                  /* Mode Édition */
                  <div className="flex flex-col gap-2.5">
                    <textarea
                      className="w-full rounded-lg border border-border/60 bg-background px-2.5 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20 resize-y"
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

                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <select
                          aria-label="Modifier la catégorie"
                          className="h-7 rounded-lg border border-border/60 bg-background px-2 text-[11px] outline-none cursor-pointer"
                          onChange={(e) => setEditCategory(e.target.value)}
                          value={editCategory}
                        >
                          {MEMORY_CATEGORIES.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                        <input
                          className="h-7 w-32 rounded-lg border border-border/60 bg-background px-2 text-[11px] outline-none"
                          onChange={(e) => setEditTagsInput(e.target.value)}
                          placeholder="Tags séparés par virgule"
                          value={editTagsInput}
                        />
                      </div>

                      <div className="flex items-center gap-1.5 ml-auto">
                        <Button
                          className="h-7 px-2 text-xs gap-1"
                          onClick={() => setEditingId(null)}
                          size="sm"
                          type="button"
                          variant="ghost"
                        >
                          <XIcon className="size-3" /> Annuler
                        </Button>
                        <Button
                          className="h-7 px-3 text-xs gap-1 bg-sky-600 text-white hover:bg-sky-700"
                          disabled={isUpdating || !editContent.trim()}
                          onClick={handleUpdate}
                          size="sm"
                          type="button"
                        >
                          {isUpdating ? (
                            <Loader2Icon className="size-3 animate-spin" />
                          ) : (
                            <CheckIcon className="size-3" />
                          )}
                          Enregistrer
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Mode Visualisation */
                  <div className="flex items-start gap-2.5">
                    {/* Bouton Étoile (Important) */}
                    <button
                      className={cn(
                        "mt-0.5 p-1 rounded-md transition-colors cursor-pointer shrink-0",
                        isImportant
                          ? "text-amber-500 fill-amber-500 hover:text-amber-600"
                          : "text-muted-foreground/40 hover:text-amber-500"
                      )}
                      onClick={() => handleToggleImportant(m)}
                      title={
                        isImportant
                          ? "Mémoire Importante (injectée en priorité)"
                          : "Marquer comme importante"
                      }
                      type="button"
                    >
                      <StarIcon
                        className={cn("size-4", isImportant && "fill-current")}
                      />
                    </button>

                    {/* Contenu et Métadonnées */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-xs leading-relaxed text-foreground break-words",
                          !isEnabled && "line-through text-muted-foreground"
                        )}
                      >
                        {m.content}
                      </p>

                      {/* Badges : Catégorie, Tags, Scope, Date */}
                      <div className="flex items-center gap-1.5 flex-wrap mt-1.5 text-[10.5px]">
                        {/* Badge Catégorie */}
                        {catObj ? (
                          <span className="inline-flex items-center gap-1 bg-muted/60 text-muted-foreground px-1.5 py-0.5 rounded font-medium">
                            <catObj.icon className="size-3 text-muted-foreground" />
                            <span>{catObj.label}</span>
                          </span>
                        ) : null}

                        {/* Badges Tags */}
                        {m.tags && m.tags.length > 0
                          ? m.tags.map((t) => (
                              <span
                                className="bg-sky-500/10 text-sky-600 dark:text-sky-400 px-1.5 py-0.5 rounded font-mono text-[10px]"
                                key={t}
                              >
                                #{t}
                              </span>
                            ))
                          : null}

                        {/* Scope */}
                        {allScopes ? (
                          <span className="text-muted-foreground">
                            {m.agentId ? (
                              <BotIcon className="size-3 inline -mt-0.5 mr-0.5" />
                            ) : m.projectId ? (
                              <FolderKanbanIcon className="size-3 inline -mt-0.5 mr-0.5" />
                            ) : (
                              <GlobeIcon className="size-3 inline -mt-0.5 mr-0.5" />
                            )}
                            {scopeLabel(m)} ·{" "}
                          </span>
                        ) : null}

                        {/* Date */}
                        <span className="text-muted-foreground/70">
                          {formatMemoryDate(m.createdAt)}
                        </span>

                        {/* Badge statut Suspendue */}
                        {isEnabled ? null : (
                          <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold px-1.5 py-0.5 rounded">
                            Suspendue
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions sur la carte : Interrupteur On/Off, Modifier, Supprimer */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Interrupteur On/Off */}
                      <button
                        className={cn(
                          "p-1.5 rounded-lg transition-colors cursor-pointer",
                          isEnabled
                            ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                            : "text-muted-foreground hover:bg-muted"
                        )}
                        onClick={() => handleToggleEnabled(m)}
                        title={
                          isEnabled
                            ? "Désactiver temporairement cette mémoire"
                            : "Réactiver cette mémoire"
                        }
                        type="button"
                      >
                        <PowerIcon className="size-3.5" />
                      </button>

                      {/* Modifier */}
                      <button
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                        onClick={() => {
                          setEditingId(m.id);
                          setEditContent(m.content);
                          setEditCategory(m.category || "general");
                          setEditTagsInput((m.tags || []).join(", "));
                        }}
                        title="Modifier"
                        type="button"
                      >
                        <PencilIcon className="size-3.5" />
                      </button>

                      {/* Supprimer */}
                      <button
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
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
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Dialogue de suppression */}
      <AlertDialog
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
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

      {/* Modal de Résumé IA */}
      <Dialog onOpenChange={setSummaryModalOpen} open={summaryModalOpen}>
        <DialogContent className="sm:max-w-[620px] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600">
                <BrainIcon className="size-4" />
              </span>
              <DialogTitle>Synthèse de votre Mémoire</DialogTitle>
            </div>
            <DialogDescription>
              Synthèse structurée de vos {summaryCount} informations mémorisées,
              organisée par sections.
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

      {/* Modal d'Importation JSON (avec limite de forfait) */}
      <Dialog onOpenChange={setImportModalOpen} open={importModalOpen}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600">
                <FileJsonIcon className="size-4" />
              </span>
              <DialogTitle>Importer des mémoires (JSON)</DialogTitle>
            </div>
            <DialogDescription>
              Vérifiez les éléments à importer dans votre profil mAI.
            </DialogDescription>
          </DialogHeader>

          {pendingImportData ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-muted/30 p-3 border border-border/50 text-xs">
                <div>
                  <p className="font-semibold text-foreground">
                    {pendingImportData.length} élément(s) détecté(s)
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Quota actuel : {scopeCount}/{limit} ({remainingSlots}{" "}
                    place(s) restante(s))
                  </p>
                </div>
                {pendingImportData.length > remainingSlots ? (
                  <span className="text-[11px] bg-destructive/10 text-destructive font-semibold px-2 py-1 rounded-md">
                    Dépassement de quota
                  </span>
                ) : (
                  <span className="text-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-1 rounded-md">
                    Compatible
                  </span>
                )}
              </div>

              {pendingImportData.length > remainingSlots ? (
                <div className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircleIcon className="size-4 shrink-0 mt-0.5" />
                  <p>
                    Le fichier contient plus de mémoires que votre quota
                    disponible. Veuillez passer à un forfait supérieur (Plus,
                    Pro ou Max) ou réduire le fichier JSON.
                  </p>
                </div>
              ) : null}

              {/* Aperçu des premiers éléments */}
              <div className="max-h-48 overflow-y-auto space-y-1.5 rounded-xl border border-border/40 p-2.5 bg-background">
                {pendingImportData.slice(0, 5).map((item, i) => (
                  <div
                    className="rounded-lg bg-muted/20 p-2 text-[11.5px] text-foreground border border-border/30 flex items-start gap-2"
                    key={i}
                  >
                    <span className="text-muted-foreground font-mono">
                      {i + 1}.
                    </span>
                    <span className="flex-1 line-clamp-2">{item.content}</span>
                    {item.isImportant ? (
                      <StarIcon className="size-3 fill-amber-500 text-amber-500 shrink-0 mt-0.5" />
                    ) : null}
                  </div>
                ))}
                {pendingImportData.length > 5 ? (
                  <p className="text-center text-[10.5px] text-muted-foreground pt-1">
                    ... et {pendingImportData.length - 5} autre(s) mémoire(s).
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              onClick={() => {
                setImportModalOpen(false);
                setPendingImportData(null);
              }}
              type="button"
              variant="outline"
            >
              Annuler
            </Button>
            <Button
              className="bg-sky-600 text-white hover:bg-sky-700 gap-1.5"
              disabled={
                isImporting ||
                !pendingImportData ||
                pendingImportData.length === 0 ||
                pendingImportData.length > remainingSlots
              }
              onClick={handleConfirmImport}
              type="button"
            >
              {isImporting ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : (
                <UploadIcon className="size-3.5" />
              )}
              <span>Confirmer l'import</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
