"use client";

import {
  FolderKanbanIcon,
  LayoutGridIcon,
  ListIcon,
  PlusIcon,
  SearchIcon,
} from "@mdevs/icons";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { type RenderCheckboxProps, renderCheckbox } from "react-data-grid";
import { toast } from "sonner";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { useDebounceValue } from "usehooks-ts";
import {
  revalidateChatHistories,
  useChatHistoryReset,
} from "@/hooks/revalidate-chat-histories";
import "react-data-grid/lib/styles.css";
import { PageBackButton } from "@/components/chat/page-back-button";
import { PROJECT_ICON_KEYS, ProjectIcon } from "@/components/chat/project-icon";
import { BulkActionBar } from "@/components/projects/bulk-action-bar";
import { BulkTagDialog } from "@/components/projects/bulk-tag-dialog";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";
import { EditProjectDialog } from "@/components/projects/edit-project-dialog";
import { ProjectsChatsDataGrid } from "@/components/projects/projects-chats-data-grid";
import {
  ProjectsGridView,
  type ProjectViewItem,
} from "@/components/projects/projects-grid-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ModelCapabilities } from "@/lib/ai/models";
import { extractApiErrorMessage } from "@/lib/api/client-error";
import { fetcher } from "@/lib/utils";

type Project = {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  customInstructions?: string;
  defaultModel?: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  chatCount?: number;
};

type Chat = {
  id: string;
  title: string;
  projectId: string | null;
  isArchived: boolean;
  pinned: boolean;
  tags: string[];
  createdAt: string;
  visibility: string;
};

const _PROJECT_COLORS = [
  "#6366f1",
  "#ec4899",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#8b5cf6",
  "#84cc16",
];
const _PROJECT_ICONS = PROJECT_ICON_KEYS;

// Conserver la sélection et l’état indéterminé du tableau avec des libellés français.
const _CHAT_GRID_RENDERERS = {
  renderCheckbox: (props: RenderCheckboxProps) =>
    renderCheckbox({
      ...props,
      "aria-label":
        props["aria-label"] === "Select All"
          ? "Sélectionner toutes les discussions"
          : "Sélectionner cette discussion",
    }),
};

export default function ProjectsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-muted-foreground">Chargement…</div>
      }
    >
      <ProjectsPageInner />
    </Suspense>
  );
}

function ProjectsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resolvedTheme } = useTheme();
  const { data: modelsData } = useSWR<{
    capabilities?: Record<string, ModelCapabilities>;
    models: Array<{ id: string; name?: string }>;
  }>("/api/models", fetcher);
  // Le sélecteur compact attend des modèles à nom obligatoire (SharedModel).
  const availableModels = useMemo(
    () =>
      (modelsData?.models ?? []).map((modele) => ({
        id: modele.id,
        name: modele.name ?? modele.id,
      })),
    [modelsData]
  );

  const [viewMode, setViewMode] = useState<"grid" | "list">(
    (searchParams.get("view") as "grid" | "list") || "grid"
  );
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>(
    searchParams.get("project") || "all"
  );
  const [includeArchived, _setIncludeArchived] = useState(
    searchParams.get("archived") === "true"
  );
  const [tagFilter, setTagFilter] = useState(searchParams.get("tag") || "");
  const [debouncedSearch] = useDebounceValue(search, 300);
  const [debouncedTag] = useDebounceValue(tagFilter, 300);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectViewItem | null>(
    null
  );
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [deleteWithChats, setDeleteWithChats] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newIcon, setNewIcon] = useState("folder");
  const [newColor, setNewColor] = useState("#6366f1");
  const [newInstructions, setNewInstructions] = useState("");
  const [newDefaultModel, setNewDefaultModel] = useState("");
  const [selectedChatIds, setSelectedChatIds] = useState<Set<string>>(
    new Set()
  );
  const [bulkTagInput, setBulkTagInput] = useState("");
  const [showBulkTagDialog, setShowBulkTagDialog] = useState(false);

  // Sync filters to URL (shareable)
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) {
      params.set("q", debouncedSearch);
    }
    if (selectedProjectFilter !== "all") {
      params.set("project", selectedProjectFilter);
    }
    if (debouncedTag) {
      params.set("tag", debouncedTag);
    }
    if (includeArchived) {
      params.set("archived", "true");
    }
    if (viewMode !== "grid") {
      params.set("view", viewMode);
    }
    const qs = params.toString();
    router.replace(`/projects${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [
    debouncedSearch,
    selectedProjectFilter,
    debouncedTag,
    includeArchived,
    viewMode,
    router,
  ]);

  const {
    data: projectsData,
    mutate: mutateProjects,
    isLoading: isProjectsLoading,
    error: projectsError,
  } = useSWR(
    `/api/projects?includeArchived=${includeArchived}${debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : ""}`,
    fetcher,
    { dedupingInterval: 5000, keepPreviousData: true }
  );
  const projects: Project[] = projectsData?.projects ?? [];
  const _unassignedCount: number = projectsData?.unassignedCount ?? 0;

  const getChatKey = useCallback(
    (pageIndex: number, prev: { chats: Chat[]; hasMore: boolean } | null) => {
      if (prev && (prev.hasMore === false || !Array.isArray(prev.chats))) {
        return null;
      }
      const params = new URLSearchParams();
      params.set("limit", "20");
      params.set("includeArchived", String(includeArchived));
      if (selectedProjectFilter !== "all") {
        if (selectedProjectFilter === "none") {
          params.set("projectId", "null");
        } else {
          params.set("projectId", selectedProjectFilter);
        }
      }
      if (debouncedSearch) {
        params.set("search", debouncedSearch);
      }
      if (debouncedTag) {
        params.set("tag", debouncedTag);
      }
      if (prev && pageIndex > 0) {
        const last = prev.chats?.at(-1);
        if (!last) {
          return null;
        }
        params.set("ending_before", last.id);
      }
      return `/api/history?${params.toString()}`;
    },
    [includeArchived, debouncedSearch, selectedProjectFilter, debouncedTag]
  );

  const {
    data: chatPages,
    size,
    setSize,
    mutate: mutateChats,
    isLoading: chatsLoading,
    error: chatsError,
  } = useSWRInfinite<{ chats: Chat[]; hasMore: boolean }>(getChatKey, fetcher);
  const resetHistoryPage = useCallback(() => {
    setSize(1);
  }, [setSize]);
  useChatHistoryReset(resetHistoryPage);

  const chats: Chat[] = useMemo(
    () =>
      chatPages?.flatMap((p) => (Array.isArray(p?.chats) ? p.chats : [])) ?? [],
    [chatPages]
  );
  const hasMore = chatPages?.at(-1)?.hasMore ?? false;

  const projectMap = useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects]
  );

  const handleCreateProject = async () => {
    if (!newName.trim()) {
      toast.error("Nom requis");
      return;
    }
    const res = await fetch("/api/projects", {
      body: JSON.stringify({
        color: newColor,
        customInstructions: newInstructions.trim() || undefined,
        defaultModel: newDefaultModel.trim() || undefined,
        description: newDesc.trim(),
        icon: newIcon,
        name: newName.trim(),
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(extractApiErrorMessage(data) || "Erreur création");
      return;
    }
    toast.success("Projet créé");
    setCreateOpen(false);
    setNewName("");
    setNewDesc("");
    setNewInstructions("");
    setNewDefaultModel("");
    mutateProjects();
  };

  const handleUpdateProject = async () => {
    if (!editingProject) {
      return;
    }
    const res = await fetch(`/api/projects/${editingProject.id}`, {
      body: JSON.stringify({
        color: newColor,
        customInstructions: newInstructions.trim() || null,
        defaultModel: newDefaultModel.trim() || null,
        description: newDesc.trim(),
        icon: newIcon,
        name: newName.trim(),
      }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    if (!res.ok) {
      const d = await res.json();
      toast.error(extractApiErrorMessage(d) || "Erreur");
      return;
    }
    toast.success("Projet mis à jour");
    setEditingProject(null);
    mutateProjects();
  };

  const handleDeleteProject = async () => {
    if (!deleteProjectId) {
      return;
    }
    const res = await fetch(
      `/api/projects/${deleteProjectId}?deleteChats=${deleteWithChats}`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      toast.error("Erreur suppression");
      return;
    }
    toast.success(
      deleteWithChats ? "Projet et discussions supprimés" : "Projet supprimé"
    );
    setDeleteProjectId(null);
    setDeleteWithChats(false);
    mutateProjects();
    await revalidateChatHistories();
  };

  const _toggleChatSelection = (id: string) => {
    setSelectedChatIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBulkAction = async (
    action:
      | "move"
      | "archive"
      | "unarchive"
      | "pin"
      | "unpin"
      | "tag"
      | "delete",
    extra?: string[] | string | null
  ) => {
    if (selectedChatIds.size === 0) {
      return;
    }
    const chatIds = Array.from(selectedChatIds);
    const body: {
      action: string;
      chatIds: string[];
      projectId?: string | null;
      tags?: string[];
    } = { action, chatIds };
    if (action === "move") {
      body.projectId = typeof extra === "string" ? extra : null;
    }
    if (action === "tag") {
      body.tags = Array.isArray(extra) ? extra : [];
    }
    const res = await fetch("/api/history/bulk", {
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    if (!res.ok) {
      const d = await res.json();
      toast.error(extractApiErrorMessage(d) || "Erreur bulk");
      return;
    }
    toast.success(`${chatIds.length} discussion(s) mise(s) à jour`);
    setSelectedChatIds(new Set());
    mutateChats();
    mutateProjects();
    await revalidateChatHistories();
  };

  const handleSingleAction = useCallback(
    async (chatId: string, patch: Record<string, unknown>) => {
      try {
        const res = await fetch(`/api/chats/${chatId}`, {
          body: JSON.stringify(patch),
          headers: { "Content-Type": "application/json" },
          method: "PATCH",
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          toast.error(extractApiErrorMessage(d) || "Erreur");
          return;
        }
        toast.success("Mis à jour");
        mutateChats();
        mutateProjects();
        await revalidateChatHistories();
      } catch {
        toast.error("Impossible de mettre à jour la discussion. Réessayez.");
      }
    },
    [mutateChats, mutateProjects]
  );

  const handleTagSelected = async () => {
    const tags = bulkTagInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 10);
    await handleBulkAction("tag", tags);
    setShowBulkTagDialog(false);
    setBulkTagInput("");
  };

  const selectedRows = useMemo(() => {
    const s = new Set<string>();
    selectedChatIds.forEach((id) => s.add(id));
    return s;
  }, [selectedChatIds]);

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background">
      {/* En-tête Studio Projets — même design que Planification / Audio / Images */}
      <div className="border-b border-border/40 px-6 py-6 sm:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3 min-w-0">
            <PageBackButton />
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-xs">
                  <FolderKanbanIcon className="size-5" />
                </span>
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                  Projets & Espaces de travail
                </h1>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Organisez vos discussions par thématique et configurez des
                instructions dédiées.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <Button
              className="gap-2 shadow-xs"
              onClick={() => {
                setNewName("");
                setNewDesc("");
                setNewIcon("folder");
                setNewColor("#6366f1");
                setCreateOpen(true);
              }}
              size="sm"
            >
              <PlusIcon className="size-4" /> Nouveau projet
            </Button>
            <div className="flex border rounded-md">
              <Button
                aria-label="Vue grille"
                aria-pressed={viewMode === "grid"}
                className="h-8 w-8 rounded-r-none"
                onClick={() => setViewMode("grid")}
                size="icon"
                variant={viewMode === "grid" ? "secondary" : "ghost"}
              >
                <LayoutGridIcon className="size-4" />
              </Button>
              <Button
                aria-label="Vue liste"
                aria-pressed={viewMode === "list"}
                className="h-8 w-8 rounded-l-none"
                onClick={() => setViewMode("list")}
                size="icon"
                variant={viewMode === "list" ? "secondary" : "ghost"}
              >
                <ListIcon className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Filtres & Recherche — même rangée que Planification */}
        <div className="mt-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                aria-label="Rechercher une discussion"
                className="h-8 w-[200px] pl-8 text-xs"
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher..."
                value={search}
              />
            </div>
            <Input
              aria-label="Filtrer les discussions par tag"
              className="h-8 w-[120px] text-xs"
              onChange={(e) => setTagFilter(e.target.value)}
              placeholder="Tag..."
              value={tagFilter}
            />
          </div>

          <Select
            onValueChange={setSelectedProjectFilter}
            value={selectedProjectFilter}
          >
            <SelectTrigger
              aria-label="Filtrer par projet"
              className="h-8 w-[200px] text-xs"
            >
              <SelectValue placeholder="Filtrer projet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les projets</SelectItem>
              <SelectItem value="none">Sans dossier</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <div className="flex items-center gap-2">
                    <ProjectIcon
                      className="size-3.5 shrink-0"
                      name={p.icon}
                      style={{ color: p.color }}
                    />
                    <span>{p.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 p-6 sm:p-8 flex flex-col gap-6">
        {/* Projects Grid/List */}
        {isProjectsLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                className="h-28 rounded-xl border bg-card p-4 animate-pulse flex flex-col justify-between"
                key={i}
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-muted" />
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="h-4 w-28 bg-muted rounded" />
                    <div className="h-3 w-40 bg-muted/60 rounded" />
                  </div>
                </div>
                <div className="h-4 w-20 bg-muted/40 rounded" />
              </div>
            ))}
          </div>
        ) : projectsError ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
            <p className="text-sm text-destructive font-medium mb-3">
              Impossible de charger les projets.
            </p>
            <Button
              onClick={() => mutateProjects()}
              size="sm"
              variant="outline"
            >
              Réessayer
            </Button>
          </div>
        ) : (
          <ProjectsGridView
            availableModels={availableModels}
            onCreateClick={() => setCreateOpen(true)}
            onDeleteClick={(id) => setDeleteProjectId(id)}
            onEditClick={(p) => {
              setEditingProject(p);
              setNewName(p.name);
              setNewDesc(p.description);
              setNewIcon(p.icon || "folder");
              setNewColor(p.color);
              setNewInstructions(p.customInstructions || "");
              setNewDefaultModel(p.defaultModel || "");
            }}
            onToggleArchive={async (p) => {
              await fetch(`/api/projects/${p.id}`, {
                body: JSON.stringify({ isArchived: !p.isArchived }),
                headers: { "Content-Type": "application/json" },
                method: "PATCH",
              });
              mutateProjects();
            }}
            projects={projects}
            viewMode={viewMode}
          />
        )}

        {/* Bulk bar */}
        <BulkActionBar
          onBulkAction={handleBulkAction}
          onClearSelection={() => setSelectedChatIds(new Set())}
          onOpenBulkTagDialog={() => setShowBulkTagDialog(true)}
          projects={projects}
          selectedCount={selectedChatIds.size}
        />

        {/* Chats DataGrid */}
        <ProjectsChatsDataGrid
          chats={chats}
          chatsError={chatsError}
          chatsLoading={chatsLoading}
          hasMore={hasMore}
          mutateChats={mutateChats}
          onOpenBulkTagForChat={(chatId) => {
            setSelectedChatIds(new Set([chatId]));
            setShowBulkTagDialog(true);
          }}
          onSelectedChatIdsChange={(ids) => setSelectedChatIds(new Set(ids))}
          onSingleAction={handleSingleAction}
          projectMap={projectMap}
          resolvedTheme={resolvedTheme}
          selectedChatIds={selectedRows}
          setSize={setSize}
          size={size}
        />

        {/* Dialogs */}
        <CreateProjectDialog
          availableModels={availableModels}
          color={newColor}
          defaultModel={newDefaultModel}
          desc={newDesc}
          icon={newIcon}
          instructions={newInstructions}
          modelsData={modelsData}
          name={newName}
          onCreate={handleCreateProject}
          onOpenChange={setCreateOpen}
          open={createOpen}
          setColor={setNewColor}
          setDefaultModel={setNewDefaultModel}
          setDesc={setNewDesc}
          setIcon={setNewIcon}
          setInstructions={setNewInstructions}
          setName={setNewName}
        />

        <EditProjectDialog
          availableModels={availableModels}
          color={newColor}
          defaultModel={newDefaultModel}
          desc={newDesc}
          icon={newIcon}
          instructions={newInstructions}
          modelsData={modelsData}
          name={newName}
          onOpenChange={(o) => !o && setEditingProject(null)}
          onUpdate={handleUpdateProject}
          project={editingProject}
          setColor={setNewColor}
          setDefaultModel={setNewDefaultModel}
          setDesc={setNewDesc}
          setIcon={setNewIcon}
          setInstructions={setNewInstructions}
          setName={setNewName}
        />

        <DeleteProjectDialog
          chatCount={
            projects.find((p) => p.id === deleteProjectId)?.chatCount ?? 0
          }
          deleteWithChats={deleteWithChats}
          onDelete={handleDeleteProject}
          onOpenChange={(o) => !o && setDeleteProjectId(null)}
          open={Boolean(deleteProjectId)}
          setDeleteWithChats={setDeleteWithChats}
        />

        <BulkTagDialog
          onApply={handleTagSelected}
          onOpenChange={setShowBulkTagDialog}
          open={showBulkTagDialog}
          setTagInput={setBulkTagInput}
          tagInput={bulkTagInput}
        />
      </div>
    </div>
  );
}
