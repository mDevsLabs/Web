"use client";

import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  Edit2Icon,
  FolderIcon,
  FolderKanbanIcon,
  LayoutGridIcon,
  ListIcon,
  MoreHorizontalIcon,
  PinIcon,
  PinOffIcon,
  PlusIcon,
  SearchIcon,
  SparklesIcon,
  TagIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useMemo, useState } from "react";
import DataGrid, { SelectColumn } from "react-data-grid";
import { toast } from "sonner";
import useSWR, { mutate as globalMutate } from "swr";
import useSWRInfinite from "swr/infinite";
import { useDebounceValue } from "usehooks-ts";
import "react-data-grid/lib/styles.css";
import { PageBackButton } from "@/components/chat/page-back-button";
import { ModelSelectorCompact } from "@/components/chat/model-selector-compact";
import {
  PROJECT_ICON_KEYS,
  PROJECT_ICON_LIST,
  ProjectIcon,
} from "@/components/chat/project-icon";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

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

const PROJECT_COLORS = [
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

export default function ProjectsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resolvedTheme } = useTheme();
  const { data: modelsData } = useSWR<{ models: any[] }>(
    "/api/models",
    fetcher
  );
  const availableModels: any[] = modelsData?.models || [];

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
  const [editingProject, setEditingProject] = useState<Project | null>(null);
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
      toast.error(data.error || "Erreur création");
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
      toast.error(d.error || "Erreur");
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
    mutateChats();
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
    extra?: any
  ) => {
    if (selectedChatIds.size === 0) {
      return;
    }
    const chatIds = Array.from(selectedChatIds);
    const body: any = { action, chatIds };
    if (action === "move") {
      body.projectId = extra ?? null;
    }
    if (action === "tag") {
      body.tags = extra ?? [];
    }
    const res = await fetch("/api/history/bulk", {
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    if (!res.ok) {
      const d = await res.json();
      toast.error(d.error || "Erreur bulk");
      return;
    }
    toast.success(`${chatIds.length} discussion(s) mise(s) à jour`);
    setSelectedChatIds(new Set());
    mutateChats();
    mutateProjects();
    // Invalidate sidebar history
    globalMutate(
      (key) => typeof key === "string" && key.includes("/api/history")
    );
  };

  const _handleSingleAction = useCallback(
    async (chatId: string, patch: Record<string, unknown>) => {
      const res = await fetch(`/api/chats/${chatId}`, {
        body: JSON.stringify(patch),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || "Erreur");
        return;
      }
      toast.success("Mis à jour");
      mutateChats();
      mutateProjects();
      globalMutate(
        (key) => typeof key === "string" && key.includes("/api/history")
      );
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

  // DataGrid columns for chats
  const columns = useMemo(() => {
    const cols: any[] = [
      SelectColumn,
      {
        key: "title",
        name: "Discussion",
        renderCell: ({ row }: { row: Chat }) => (
          <div className="flex items-center gap-2 truncate">
            {row.pinned && (
              <PinIcon className="size-3 text-amber-500 shrink-0" />
            )}
            {row.isArchived && (
              <ArchiveIcon className="size-3 text-muted-foreground shrink-0" />
            )}
            <Link
              className="truncate hover:underline text-[13px]"
              href={`/chat/${row.id}`}
            >
              {row.title}
            </Link>
          </div>
        ),
        resizable: true,
        sortable: false,
        width: 320,
      },
      {
        key: "projectId",
        name: "Projet",
        renderCell: ({ row }: { row: Chat }) => {
          const p = row.projectId ? projectMap.get(row.projectId) : null;
          if (!p) {
            return (
              <span className="text-xs text-muted-foreground">
                — Sans dossier —
              </span>
            );
          }
          return (
            <span className="inline-flex items-center gap-1.5 text-xs">
              <ProjectIcon
                className="size-3.5 shrink-0"
                name={p.icon}
                style={{ color: p.color }}
              />
              <span className="truncate">{p.name}</span>
            </span>
          );
        },
        width: 160,
      },
      {
        key: "tags",
        name: "Tags",
        renderCell: ({ row }: { row: Chat }) =>
          row.tags?.length ? (
            <div className="flex gap-1 flex-wrap">
              {row.tags.slice(0, 2).map((t) => (
                <Badge
                  className="text-[10px] px-1 py-0"
                  key={t}
                  variant="secondary"
                >
                  {t}
                </Badge>
              ))}
              {row.tags.length > 2 && (
                <span className="text-[10px] text-muted-foreground">
                  +{row.tags.length - 2}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
        width: 180,
      },
      {
        key: "createdAt",
        name: "Créé",
        renderCell: ({ row }: { row: Chat }) => (
          <span className="text-xs text-muted-foreground">
            {new Date(row.createdAt).toLocaleDateString("fr-FR")}
          </span>
        ),
        width: 140,
      },
      {
        key: "actions",
        name: "",
        renderCell: ({ row }: { row: Chat }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              className="h-7 w-7"
              onClick={async () => {
                await fetch(`/api/chats/${row.id}`, {
                  body: JSON.stringify({ pinned: !row.pinned }),
                  headers: { "Content-Type": "application/json" },
                  method: "PATCH",
                });
                mutateChats();
              }}
              size="icon"
              title={row.pinned ? "Désépingler" : "Épingler"}
              variant="ghost"
            >
              {row.pinned ? (
                <PinOffIcon className="size-3.5" />
              ) : (
                <PinIcon className="size-3.5" />
              )}
            </Button>
            <Button
              className="h-7 w-7"
              onClick={async () => {
                await fetch(`/api/chats/${row.id}`, {
                  body: JSON.stringify({ isArchived: !row.isArchived }),
                  headers: { "Content-Type": "application/json" },
                  method: "PATCH",
                });
                mutateChats();
              }}
              size="icon"
              title={row.isArchived ? "Désarchiver" : "Archiver"}
              variant="ghost"
            >
              {row.isArchived ? (
                <ArchiveRestoreIcon className="size-3.5" />
              ) : (
                <ArchiveIcon className="size-3.5" />
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="h-7 w-7" size="icon" variant="ghost">
                  <MoreHorizontalIcon className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedChatIds(new Set([row.id]));
                    setShowBulkTagDialog(true);
                  }}
                >
                  <TagIcon className="size-3.5 mr-2" /> Gérer tags
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={async () => {
                    if (!confirm("Supprimer définitivement cette conversation ?")) {
                      return;
                    }
                    const res = await fetch(`/api/chat?id=${row.id}`, {
                      method: "DELETE",
                    });
                    if (res.ok) {
                      toast.success("Conversation supprimée");
                      setSelectedChatIds((prev) => {
                        const next = new Set(prev);
                        next.delete(row.id);
                        return next;
                      });
                    } else {
                      toast.error("Erreur lors de la suppression");
                    }
                    mutateChats();
                  }}
                >
                  <Trash2Icon className="size-3.5 mr-2" /> Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
        width: 140,
      },
    ];
    return cols;
  }, [projectMap, mutateChats]);

  const selectedRows = useMemo(() => {
    const s = new Set<string>();
    selectedChatIds.forEach((id) => s.add(id));
    return s;
  }, [selectedChatIds]);

  return (
    <div className="flex flex-1 flex-col h-full overflow-y-auto bg-background p-4 sm:p-6 md:p-10 max-w-7xl mx-auto w-full gap-6">
      {/* En-tête Studio Projets */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/50">
        <div className="flex items-start gap-3 min-w-0">
          <PageBackButton />
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase mb-1">
              <span className="flex size-2 rounded-full bg-primary animate-pulse" />
              <FolderKanbanIcon className="size-4" />
              mAI Projects Workspace
            </div>
            <h1 className="text-2xl truncate md:text-3xl font-bold tracking-tight text-foreground">
              Projets & Espaces de travail
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Organisez vos discussions par thématique et configurez des
              instructions dédiées.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              className="pl-8 h-8 w-[220px]"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              value={search}
            />
          </div>
          <Select
            onValueChange={setSelectedProjectFilter}
            value={selectedProjectFilter}
          >
            <SelectTrigger className="h-8 w-[180px]">
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
          <Input
            className="h-8 w-[120px]"
            onChange={(e) => setTagFilter(e.target.value)}
            placeholder="Tag..."
            value={tagFilter}
          />
          <Button
            className="h-8"
            onClick={() => {
              setNewName("");
              setNewDesc("");
              setNewIcon("folder");
              setNewColor("#6366f1");
              setCreateOpen(true);
            }}
            size="sm"
          >
            <PlusIcon className="size-4 mr-1" /> Nouveau projet
          </Button>
          <div className="flex border rounded-md ml-1">
            <Button
              className="h-8 w-8 rounded-r-none"
              onClick={() => setViewMode("grid")}
              size="icon"
              variant={viewMode === "grid" ? "secondary" : "ghost"}
            >
              <LayoutGridIcon className="size-4" />
            </Button>
            <Button
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
          <Button onClick={() => mutateProjects()} size="sm" variant="outline">
            Réessayer
          </Button>
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <FolderIcon className="mx-auto size-8 text-muted-foreground mb-3" />
          <h3 className="font-semibold">Aucun projet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Créez votre premier dossier pour ranger vos discussions.
          </p>
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon className="size-4 mr-2" /> Créer un projet
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <div
              className="group relative rounded-xl border bg-card p-4 hover:shadow-md transition-shadow"
              key={p.id}
              style={{ borderLeft: `4px solid ${p.color}` }}
            >
              <Link className="absolute inset-0" href={`/projects/${p.id}`} />
              <div className="flex items-start justify-between gap-2 relative z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="size-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${p.color}15` }}
                  >
                    <ProjectIcon
                      className="size-5"
                      name={p.icon}
                      style={{ color: p.color }}
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm truncate">{p.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {p.description || "—"}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      className="h-7 w-7 shrink-0 relative z-20"
                      onClick={(e) => e.preventDefault()}
                      size="icon"
                      variant="ghost"
                    >
                      <MoreHorizontalIcon className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenuItem
                      onClick={() => {
                        setEditingProject(p);
                        setNewName(p.name);
                        setNewDesc(p.description);
                        setNewIcon(p.icon || "folder");
                        setNewColor(p.color);
                        setNewInstructions(p.customInstructions || "");
                        setNewDefaultModel(p.defaultModel || "");
                      }}
                    >
                      <Edit2Icon className="size-3.5 mr-2" /> Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={async () => {
                        await fetch(`/api/projects/${p.id}`, {
                          body: JSON.stringify({ isArchived: !p.isArchived }),
                          headers: { "Content-Type": "application/json" },
                          method: "PATCH",
                        });
                        mutateProjects();
                      }}
                    >
                      {p.isArchived ? (
                        <ArchiveRestoreIcon className="size-3.5 mr-2" />
                      ) : (
                        <ArchiveIcon className="size-3.5 mr-2" />
                      )}{" "}
                      {p.isArchived ? "Désarchiver" : "Archiver"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeleteProjectId(p.id)}
                    >
                      <Trash2Icon className="size-3.5 mr-2" /> Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 relative z-10">
                <Badge className="text-xs" variant="secondary">
                  {p.chatCount ?? 0} discussions
                </Badge>
                {p.defaultModel && (
                  <Badge
                    className="text-[11px] bg-primary/10 text-primary border-primary/20 gap-1 font-normal"
                    variant="secondary"
                  >
                    <SparklesIcon className="size-3 text-amber-500" />
                    {availableModels.find((m) => m.id === p.defaultModel)
                      ?.name || p.defaultModel}
                  </Badge>
                )}
                {p.isArchived && (
                  <Badge className="text-xs" variant="outline">
                    Archivé
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <div className="divide-y">
            {projects.map((p) => (
              <Link
                className="flex items-center justify-between p-4 hover:bg-muted/50"
                href={`/projects/${p.id}`}
                key={p.id}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="size-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${p.color}15` }}
                  >
                    <ProjectIcon
                      className="size-4"
                      name={p.icon}
                      style={{ color: p.color }}
                    />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{p.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.description}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{p.chatCount ?? 0}</Badge>
                  <div
                    className="size-3 rounded-full"
                    style={{ background: p.color }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Bulk bar */}
      {selectedChatIds.size > 0 && (
        <div className="sticky bottom-4 z-30 mx-auto flex flex-wrap items-center gap-2 rounded-xl border bg-background/95 backdrop-blur p-2 shadow-xl">
          <span className="text-sm font-medium px-2">
            {selectedChatIds.size} sélectionnée(s)
          </span>
          <div className="h-4 w-px bg-border" />
          <Select
            onValueChange={(v) =>
              handleBulkAction("move", v === "none" ? null : v)
            }
          >
            <SelectTrigger className="h-8 w-[160px]">
              <SelectValue placeholder="Déplacer vers..." />
            </SelectTrigger>
            <SelectContent>
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
          <Button
            onClick={() => handleBulkAction("archive")}
            size="sm"
            variant="outline"
          >
            <ArchiveIcon className="size-3.5 mr-1" /> Archiver
          </Button>
          <Button
            onClick={() => handleBulkAction("unarchive")}
            size="sm"
            variant="outline"
          >
            <ArchiveRestoreIcon className="size-3.5 mr-1" /> Désarchiver
          </Button>
          <Button
            onClick={() => handleBulkAction("pin")}
            size="sm"
            variant="outline"
          >
            <PinIcon className="size-3.5 mr-1" /> Épingler
          </Button>
          <Button
            onClick={() => setShowBulkTagDialog(true)}
            size="sm"
            variant="outline"
          >
            <TagIcon className="size-3.5 mr-1" /> Tags
          </Button>
          <Button
            onClick={() => handleBulkAction("delete")}
            size="sm"
            variant="destructive"
          >
            <Trash2Icon className="size-3.5 mr-1" /> Supprimer
          </Button>
          <Button
            onClick={() => setSelectedChatIds(new Set())}
            size="sm"
            variant="ghost"
          >
            Effacer
          </Button>
        </div>
      )}

      {/* Chats DataGrid */}
      <div className="rounded-xl border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
          <h2 className="font-semibold text-sm">Discussions</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {chats.length} {hasMore ? "+" : ""} affichées
            </span>
            {hasMore && (
              <Button
                className="h-7"
                onClick={() => setSize(size + 1)}
                size="sm"
                variant="outline"
              >
                Charger plus
              </Button>
            )}
          </div>
        </div>
        <div className="min-h-[300px]">
          {chatsLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Chargement...
            </div>
          ) : chatsError ? (
            <div className="p-8 text-center text-sm text-destructive flex flex-col items-center gap-2">
              <span>Impossible de charger les discussions.</span>
              <Button onClick={() => mutateChats()} size="sm" variant="outline">
                Réessayer
              </Button>
            </div>
          ) : chats.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Aucune discussion ne correspond aux filtres.
            </div>
          ) : (
            <DataGrid
              className={resolvedTheme === "dark" ? "rdg-dark" : "rdg-light"}
              columns={columns}
              defaultColumnOptions={{ resizable: true }}
              enableVirtualization={true}
              onSelectedRowsChange={setSelectedChatIds as any}
              rowKeyGetter={(row: Chat) => row.id}
              rows={chats}
              selectedRows={selectedRows}
              style={{ height: 500 } as any}
            />
          )}
        </div>
      </div>

      {/* Dialogs */}
      <Dialog onOpenChange={setCreateOpen} open={createOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau projet</DialogTitle>
            <DialogDescription>
              Créez un dossier pour organiser vos discussions.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Nom</Label>
              <Input
                maxLength={100}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Travail, Études..."
                value={newName}
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Input
                maxLength={500}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Optionnel"
                value={newDesc}
              />
            </div>
            <div className="grid gap-2">
              <Label>Instructions personnalisées (optionnel)</Label>
              <textarea
                className="w-full rounded-md border border-input bg-background p-2 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                maxLength={4000}
                onChange={(e) => setNewInstructions(e.target.value)}
                placeholder="Ex: Répondre toujours en tant qu'expert TypeScript senior..."
                rows={3}
                value={newInstructions}
              />
              <span className="text-[11px] text-muted-foreground">
                Ces instructions seront appliquées à toutes les discussions
                créées dans ce dossier.
              </span>
            </div>
            <div className="grid gap-2">
              <Label>Modèle d'IA par défaut (optionnel)</Label>
              <ModelSelectorCompact
                allowEmpty
                capabilities={modelsData?.capabilities}
                fallbackModels={availableModels}
                models={availableModels.length > 0 ? availableModels : undefined}
                onModelChange={setNewDefaultModel}
                selectedModelId={newDefaultModel}
                variant="block"
              />
              <span className="text-[11px] text-muted-foreground">
                Modèle utilisé par défaut pour chaque nouvelle discussion lancée
                dans ce projet.
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Icône</Label>
                <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto p-1 rounded-lg border bg-muted/20">
                  {PROJECT_ICON_LIST.map(({ id, label, icon: IconComp }) => (
                    <button
                      className={`h-8 rounded flex items-center justify-center gap-1.5 text-xs transition-all border ${newIcon === id ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold" : "bg-card border-border/50 hover:bg-muted text-muted-foreground hover:text-foreground"}`}
                      key={id}
                      onClick={() => setNewIcon(id)}
                      title={label}
                      type="button"
                    >
                      <IconComp className="size-3.5 shrink-0" />
                      <span className="truncate">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Couleur</Label>
                <div className="flex flex-wrap gap-1.5">
                  {PROJECT_COLORS.map((c) => (
                    <button
                      className={`size-8 rounded-full border-2 ${newColor === c ? "border-foreground scale-110" : "border-transparent"}`}
                      key={c}
                      onClick={() => setNewColor(c)}
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <Input
                  className="h-9 p-1"
                  onChange={(e) => setNewColor(e.target.value)}
                  type="color"
                  value={newColor}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setCreateOpen(false)} variant="outline">
              Annuler
            </Button>
            <Button onClick={handleCreateProject}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(o) => !o && setEditingProject(null)}
        open={!!editingProject}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier projet</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Nom</Label>
              <Input
                onChange={(e) => setNewName(e.target.value)}
                value={newName}
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Input
                onChange={(e) => setNewDesc(e.target.value)}
                value={newDesc}
              />
            </div>
            <div className="grid gap-2">
              <Label>Instructions personnalisées du dossier</Label>
              <textarea
                className="w-full rounded-md border border-input bg-background p-2 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                maxLength={4000}
                onChange={(e) => setNewInstructions(e.target.value)}
                placeholder="Ex: Contexte, rôle IA, règles spécifiques..."
                rows={3}
                value={newInstructions}
              />
              <span className="text-[11px] text-muted-foreground">
                Injectées automatiquement comme contexte pour les échanges dans
                ce projet.
              </span>
            </div>
            <div className="grid gap-2">
              <Label>Modèle d'IA par défaut</Label>
              <ModelSelectorCompact
                allowEmpty
                capabilities={modelsData?.capabilities}
                fallbackModels={availableModels}
                models={availableModels.length > 0 ? availableModels : undefined}
                onModelChange={setNewDefaultModel}
                selectedModelId={newDefaultModel}
                variant="block"
              />
              <span className="text-[11px] text-muted-foreground">
                Modèle utilisé par défaut pour chaque nouvelle discussion lancée
                dans ce projet.
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Icône</Label>
                <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto p-1 rounded-lg border bg-muted/20">
                  {PROJECT_ICON_LIST.map(({ id, label, icon: IconComp }) => (
                    <button
                      className={`h-8 rounded flex items-center justify-center gap-1.5 text-xs transition-all border ${newIcon === id ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold" : "bg-card border-border/50 hover:bg-muted text-muted-foreground hover:text-foreground"}`}
                      key={id}
                      onClick={() => setNewIcon(id)}
                      title={label}
                      type="button"
                    >
                      <IconComp className="size-3.5 shrink-0" />
                      <span className="truncate">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Couleur</Label>
                <div className="flex flex-wrap gap-1.5">
                  {PROJECT_COLORS.map((c) => (
                    <button
                      className={`size-8 rounded-full border-2 ${newColor === c ? "border-foreground" : "border-transparent"}`}
                      key={c}
                      onClick={() => setNewColor(c)}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setEditingProject(null)} variant="outline">
              Annuler
            </Button>
            <Button onClick={handleUpdateProject}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        onOpenChange={(o) => !o && setDeleteProjectId(null)}
        open={!!deleteProjectId}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le projet ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les discussions ne seront pas supprimées sauf si vous cochez
              l&apos;option. Elles redeviendront &quot;Sans dossier&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center gap-2 py-2">
            <input
              checked={deleteWithChats}
              id="deleteChats"
              onChange={(e) => setDeleteWithChats(e.target.checked)}
              type="checkbox"
            />
            <label className="text-sm" htmlFor="deleteChats">
              Supprimer aussi les{" "}
              {projects.find((p) => p.id === deleteProjectId)?.chatCount ?? 0}{" "}
              discussions du projet
            </label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={handleDeleteProject}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog onOpenChange={setShowBulkTagDialog} open={showBulkTagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Étiqueter les discussions</DialogTitle>
            <DialogDescription>
              Séparez les tags par des virgules (max 10, 30 caractères).
            </DialogDescription>
          </DialogHeader>
          <Input
            onChange={(e) => setBulkTagInput(e.target.value)}
            placeholder="ex: urgent, travail, perso"
            value={bulkTagInput}
          />
          <DialogFooter>
            <Button
              onClick={() => setShowBulkTagDialog(false)}
              variant="outline"
            >
              Annuler
            </Button>
            <Button onClick={handleTagSelected}>Appliquer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
