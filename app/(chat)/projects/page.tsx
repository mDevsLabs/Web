"use client";

import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  Edit2Icon,
  FolderIcon,
  LayoutGridIcon,
  ListIcon,
  MoreHorizontalIcon,
  PinIcon,
  PinOffIcon,
  PlusIcon,
  SearchIcon,
  TagIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useDebounceValue } from "usehooks-ts";
import { useTheme } from "next-themes";
import useSWR, { mutate as globalMutate } from "swr";
import useSWRInfinite from "swr/infinite";
import DataGrid, { SelectColumn } from "react-data-grid";
import "react-data-grid/lib/styles.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

const PROJECT_COLORS = ["#6366f1", "#ec4899", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#8b5cf6", "#84cc16"];
const PROJECT_ICONS = ["📁", "💼", "🚀", "🧠", "📚", "💡", "🎯", "🔬", "📝", "⚡"];

export default function ProjectsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resolvedTheme } = useTheme();
  const [viewMode, setViewMode] = useState<"grid" | "list">(
    (searchParams.get("view") as "grid" | "list") || "grid"
  );
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>(searchParams.get("project") || "all");
  const [includeArchived, setIncludeArchived] = useState(searchParams.get("archived") === "true");
  const [tagFilter, setTagFilter] = useState(searchParams.get("tag") || "");
  const [debouncedSearch] = useDebounceValue(search, 300);
  const [debouncedTag] = useDebounceValue(tagFilter, 300);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [deleteWithChats, setDeleteWithChats] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newIcon, setNewIcon] = useState("📁");
  const [newColor, setNewColor] = useState("#6366f1");
  const [newInstructions, setNewInstructions] = useState("");
  const [selectedChatIds, setSelectedChatIds] = useState<Set<string>>(new Set());
  const [bulkTagInput, setBulkTagInput] = useState("");
  const [showBulkTagDialog, setShowBulkTagDialog] = useState(false);

  // Sync filters to URL (shareable)
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (selectedProjectFilter !== "all") params.set("project", selectedProjectFilter);
    if (debouncedTag) params.set("tag", debouncedTag);
    if (includeArchived) params.set("archived", "true");
    if (viewMode !== "grid") params.set("view", viewMode);
    const qs = params.toString();
    router.replace(`/projects${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [debouncedSearch, selectedProjectFilter, debouncedTag, includeArchived, viewMode, router]);

  const { data: projectsData, mutate: mutateProjects } = useSWR(
    `/api/projects?includeArchived=${includeArchived}${debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : ""}`,
    fetcher,
    { dedupingInterval: 5000, keepPreviousData: true }
  );
  const projects: Project[] = projectsData?.projects ?? [];
  const unassignedCount: number = projectsData?.unassignedCount ?? 0;

  const getChatKey = useCallback(
    (pageIndex: number, prev: { chats: Chat[]; hasMore: boolean } | null) => {
      if (prev && !prev.hasMore) return null;
      const params = new URLSearchParams();
      params.set("limit", "20");
      params.set("includeArchived", String(includeArchived));
      if (selectedProjectFilter !== "all") {
        if (selectedProjectFilter === "none") params.set("projectId", "null");
        else params.set("projectId", selectedProjectFilter);
      }
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (debouncedTag) params.set("tag", debouncedTag);
      if (prev && pageIndex > 0) {
        const last = prev.chats.at(-1);
        if (!last) return null;
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
  } = useSWRInfinite<{ chats: Chat[]; hasMore: boolean }>(getChatKey, fetcher);

  const chats: Chat[] = useMemo(() => chatPages?.flatMap((p) => p.chats) ?? [], [chatPages]);
  const hasMore = chatPages?.at(-1)?.hasMore ?? false;

  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  const handleCreateProject = async () => {
    if (!newName.trim()) {
      toast.error("Nom requis");
      return;
    }
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        color: newColor,
        customInstructions: newInstructions.trim() || undefined,
        description: newDesc.trim(),
        icon: newIcon,
        name: newName.trim(),
      }),
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
    mutateProjects();
  };

  const handleUpdateProject = async () => {
    if (!editingProject) return;
    const res = await fetch(`/api/projects/${editingProject.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        color: newColor,
        customInstructions: newInstructions.trim() || null,
        description: newDesc.trim(),
        icon: newIcon,
        name: newName.trim(),
      }),
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
    if (!deleteProjectId) return;
    const res = await fetch(`/api/projects/${deleteProjectId}?deleteChats=${deleteWithChats}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Erreur suppression");
      return;
    }
    toast.success(deleteWithChats ? "Projet et discussions supprimés" : "Projet supprimé");
    setDeleteProjectId(null);
    setDeleteWithChats(false);
    mutateProjects();
    mutateChats();
  };

  const toggleChatSelection = (id: string) => {
    setSelectedChatIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkAction = async (action: "move" | "archive" | "unarchive" | "pin" | "unpin" | "tag" | "delete", extra?: any) => {
    if (selectedChatIds.size === 0) return;
    const chatIds = Array.from(selectedChatIds);
    const body: any = { action, chatIds };
    if (action === "move") body.projectId = extra ?? null;
    if (action === "tag") body.tags = extra ?? [];
    const res = await fetch("/api/history/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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
    globalMutate((key) => typeof key === "string" && key.includes("/api/history"));
  };

  const handleSingleAction = useCallback(
    async (chatId: string, patch: Record<string, unknown>) => {
      const res = await fetch(`/api/chats/${chatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || "Erreur");
        return;
      }
      toast.success("Mis à jour");
      mutateChats();
      mutateProjects();
      globalMutate((key) => typeof key === "string" && key.includes("/api/history"));
    },
    [mutateChats, mutateProjects]
  );

  const handleTagSelected = async () => {
    const tags = bulkTagInput.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 10);
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
        width: 320,
        resizable: true,
        sortable: false,
        renderCell: ({ row }: { row: Chat }) => (
          <div className="flex items-center gap-2 truncate">
            {row.pinned && <PinIcon className="size-3 text-amber-500 shrink-0" />}
            {row.isArchived && <ArchiveIcon className="size-3 text-muted-foreground shrink-0" />}
            <Link href={`/chat/${row.id}`} className="truncate hover:underline text-[13px]">
              {row.title}
            </Link>
          </div>
        ),
      },
      {
        key: "projectId",
        name: "Projet",
        width: 160,
        renderCell: ({ row }: { row: Chat }) => {
          const p = row.projectId ? projectMap.get(row.projectId) : null;
          if (!p) return <span className="text-xs text-muted-foreground">— Sans dossier —</span>;
          return (
            <span className="inline-flex items-center gap-1.5 text-xs">
              <span className="text-sm">{p.icon}</span>
              <span className="truncate">{p.name}</span>
            </span>
          );
        },
      },
      {
        key: "tags",
        name: "Tags",
        width: 180,
        renderCell: ({ row }: { row: Chat }) =>
          row.tags?.length ? (
            <div className="flex gap-1 flex-wrap">
              {row.tags.slice(0, 2).map((t) => (
                <Badge key={t} variant="secondary" className="text-[10px] px-1 py-0">
                  {t}
                </Badge>
              ))}
              {row.tags.length > 2 && <span className="text-[10px] text-muted-foreground">+{row.tags.length - 2}</span>}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        key: "createdAt",
        name: "Créé",
        width: 140,
        renderCell: ({ row }: { row: Chat }) => (
          <span className="text-xs text-muted-foreground">{new Date(row.createdAt).toLocaleDateString("fr-FR")}</span>
        ),
      },
      {
        key: "actions",
        name: "",
        width: 80,
        renderCell: ({ row }: { row: Chat }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Actions">
                <MoreHorizontalIcon className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toggleChatSelection(row.id)}>Sélectionner</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleSingleAction(row.id, { pinned: !row.pinned })}> {row.pinned ? <PinOffIcon className="size-3 mr-2" /> : <PinIcon className="size-3 mr-2" />} {row.pinned ? "Désépingler" : "Épingler"} </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSingleAction(row.id, { isArchived: !row.isArchived })}> {row.isArchived ? <ArchiveRestoreIcon className="size-3 mr-2" /> : <ArchiveIcon className="size-3 mr-2" />} {row.isArchived ? "Désarchiver" : "Archiver"} </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSelectedChatIds(new Set([row.id])); setShowBulkTagDialog(true); }}> <TagIcon className="size-3 mr-2" /> Étiqueter </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={async () => {
                await fetch(`/api/chat?id=${row.id}`, { method: "DELETE" });
                mutateChats();
                mutateProjects();
                globalMutate((k) => typeof k === "string" && k.includes("/api/history"));
                toast.success("Supprimé");
              }}>
                <Trash2Icon className="size-3 mr-2" /> Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ];
    return cols;
  }, [projectMap, handleSingleAction]);

  const selectedRows = useMemo(() => {
    const s = new Set<string>();
    selectedChatIds.forEach((id) => s.add(id));
    return s;
  }, [selectedChatIds]);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1200px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FolderIcon className="size-6 text-primary" /> Projets
        </h1>
        <p className="text-sm text-muted-foreground">Organisez vos discussions en dossiers, avec tags, archivage et actions en lot.</p>
      </div>

      {/* Stats + Controls */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">{projects.length} projets</Badge>
          <Badge variant="outline">{chats.length} discussions chargées</Badge>
          <Badge variant="outline">{unassignedCount} sans dossier</Badge>
          {!includeArchived && <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setIncludeArchived(true)}>Afficher archivés</Button>}
          {includeArchived && <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setIncludeArchived(false)}>Masquer archivés</Button>}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input placeholder="Rechercher..." className="pl-8 h-8 w-[220px]" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={selectedProjectFilter} onValueChange={setSelectedProjectFilter}>
            <SelectTrigger className="h-8 w-[180px]">
              <SelectValue placeholder="Filtrer projet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les projets</SelectItem>
              <SelectItem value="none">Sans dossier</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.icon} {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input placeholder="Tag..." className="h-8 w-[120px]" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} />
          <Button onClick={() => { setNewName(""); setNewDesc(""); setNewIcon("📁"); setNewColor("#6366f1"); setCreateOpen(true); }} size="sm" className="h-8">
            <PlusIcon className="size-4 mr-1" /> Nouveau projet
          </Button>
          <div className="flex border rounded-md ml-1">
            <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" className="h-8 w-8 rounded-r-none" onClick={() => setViewMode("grid")}>
              <LayoutGridIcon className="size-4" />
            </Button>
            <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" className="h-8 w-8 rounded-l-none" onClick={() => setViewMode("list")}>
              <ListIcon className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Projects Grid/List */}
      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <FolderIcon className="mx-auto size-8 text-muted-foreground mb-3" />
          <h3 className="font-semibold">Aucun projet</h3>
          <p className="text-sm text-muted-foreground mb-4">Créez votre premier dossier pour ranger vos discussions.</p>
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon className="size-4 mr-2" /> Créer un projet
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <div
              key={p.id}
              className="group relative rounded-xl border bg-card p-4 hover:shadow-md transition-shadow"
              style={{ borderLeft: `4px solid ${p.color}` }}
            >
              <Link href={`/projects/${p.id}`} className="absolute inset-0" />
              <div className="flex items-start justify-between gap-2 relative z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-9 rounded-lg flex items-center justify-center text-lg shrink-0" style={{ background: `${p.color}15` }}>
                    {p.icon}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm truncate">{p.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{p.description || "—"}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 relative z-20" onClick={(e) => e.preventDefault()}>
                      <MoreHorizontalIcon className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem onClick={() => { setEditingProject(p); setNewName(p.name); setNewDesc(p.description); setNewIcon(p.icon); setNewColor(p.color); setNewInstructions(p.customInstructions || ""); }}>
                      <Edit2Icon className="size-3.5 mr-2" /> Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={async () => {
                      await fetch(`/api/projects/${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isArchived: !p.isArchived }) });
                      mutateProjects();
                    }}>
                      {p.isArchived ? <ArchiveRestoreIcon className="size-3.5 mr-2" /> : <ArchiveIcon className="size-3.5 mr-2" />} {p.isArchived ? "Désarchiver" : "Archiver"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onClick={() => setDeleteProjectId(p.id)}>
                      <Trash2Icon className="size-3.5 mr-2" /> Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="mt-3 flex items-center gap-2 relative z-10">
                <Badge variant="secondary" className="text-xs">{p.chatCount ?? 0} discussions</Badge>
                {p.isArchived && <Badge variant="outline" className="text-xs">Archivé</Badge>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <div className="divide-y">
            {projects.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`} className="flex items-center justify-between p-4 hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{p.icon}</span>
                  <div>
                    <div className="font-medium text-sm">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{p.chatCount ?? 0}</Badge>
                  <div className="size-3 rounded-full" style={{ background: p.color }} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Bulk bar */}
      {selectedChatIds.size > 0 && (
        <div className="sticky bottom-4 z-30 mx-auto flex flex-wrap items-center gap-2 rounded-xl border bg-background/95 backdrop-blur p-2 shadow-xl">
          <span className="text-sm font-medium px-2">{selectedChatIds.size} sélectionnée(s)</span>
          <div className="h-4 w-px bg-border" />
          <Select onValueChange={(v) => handleBulkAction("move", v === "none" ? null : v)}>
            <SelectTrigger className="h-8 w-[160px]">
              <SelectValue placeholder="Déplacer vers..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sans dossier</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.icon} {p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => handleBulkAction("archive")}>
            <ArchiveIcon className="size-3.5 mr-1" /> Archiver
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleBulkAction("unarchive")}>
            <ArchiveRestoreIcon className="size-3.5 mr-1" /> Désarchiver
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleBulkAction("pin")}>
            <PinIcon className="size-3.5 mr-1" /> Épingler
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowBulkTagDialog(true)}>
            <TagIcon className="size-3.5 mr-1" /> Tags
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleBulkAction("delete")}>
            <Trash2Icon className="size-3.5 mr-1" /> Supprimer
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedChatIds(new Set())}>Effacer</Button>
        </div>
      )}

      {/* Chats DataGrid */}
      <div className="rounded-xl border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
          <h2 className="font-semibold text-sm">Discussions</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{chats.length} {hasMore ? "+" : ""} affichées</span>
            {hasMore && <Button variant="outline" size="sm" className="h-7" onClick={() => setSize(size + 1)}>Charger plus</Button>}
          </div>
        </div>
        <div className="min-h-[300px]">
          {chatsLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Chargement...</div>
          ) : chats.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Aucune discussion ne correspond aux filtres.</div>
          ) : (
            <DataGrid
              columns={columns}
              rows={chats}
              rowKeyGetter={(row: Chat) => row.id}
              selectedRows={selectedRows}
              onSelectedRowsChange={setSelectedChatIds as any}
              className={resolvedTheme === "dark" ? "rdg-dark" : "rdg-light"}
              style={{ height: 500 } as any}
              enableVirtualization={true}
              defaultColumnOptions={{ resizable: true }}
            />
          )}
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau projet</DialogTitle>
            <DialogDescription>Créez un dossier pour organiser vos discussions.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Nom</Label>
              <Input placeholder="Ex: Travail, Études..." value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={100} />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Input placeholder="Optionnel" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} maxLength={500} />
            </div>
            <div className="grid gap-2">
              <Label>Instructions personnalisées (optionnel)</Label>
              <textarea
                placeholder="Ex: Répondre toujours en tant qu'expert TypeScript senior..."
                value={newInstructions}
                onChange={(e) => setNewInstructions(e.target.value)}
                maxLength={4000}
                rows={3}
                className="w-full rounded-md border border-input bg-background p-2 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <span className="text-[11px] text-muted-foreground">Ces instructions seront appliquées à toutes les discussions créées dans ce dossier.</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Icône</Label>
                <div className="flex flex-wrap gap-1.5">
                  {PROJECT_ICONS.map((ic) => (
                    <button key={ic} onClick={() => setNewIcon(ic)} className={`size-8 rounded border flex items-center justify-center text-lg ${newIcon === ic ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}>{ic}</button>
                  ))}
                </div>
                <Input value={newIcon} onChange={(e) => setNewIcon(e.target.value)} maxLength={10} className="mt-1" />
              </div>
              <div className="grid gap-2">
                <Label>Couleur</Label>
                <div className="flex flex-wrap gap-1.5">
                  {PROJECT_COLORS.map((c) => (
                    <button key={c} onClick={() => setNewColor(c)} className={`size-8 rounded-full border-2 ${newColor === c ? "border-foreground scale-110" : "border-transparent"}`} style={{ background: c }} />
                  ))}
                </div>
                <Input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="h-9 p-1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Annuler</Button>
            <Button onClick={handleCreateProject}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingProject} onOpenChange={(o) => !o && setEditingProject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier projet</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Nom</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Instructions personnalisées du dossier</Label>
              <textarea
                placeholder="Ex: Contexte, rôle IA, règles spécifiques..."
                value={newInstructions}
                onChange={(e) => setNewInstructions(e.target.value)}
                maxLength={4000}
                rows={3}
                className="w-full rounded-md border border-input bg-background p-2 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <span className="text-[11px] text-muted-foreground">Injectées automatiquement comme contexte pour les échanges dans ce projet.</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Icône</Label>
                <div className="flex flex-wrap gap-1.5">
                  {PROJECT_ICONS.map((ic) => (
                    <button key={ic} onClick={() => setNewIcon(ic)} className={`size-8 rounded border flex items-center justify-center ${newIcon === ic ? "bg-primary text-primary-foreground" : ""}`}>{ic}</button>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Couleur</Label>
                <div className="flex flex-wrap gap-1.5">
                  {PROJECT_COLORS.map((c) => (
                    <button key={c} onClick={() => setNewColor(c)} className={`size-8 rounded-full border-2 ${newColor === c ? "border-foreground" : "border-transparent"}`} style={{ background: c }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProject(null)}>Annuler</Button>
            <Button onClick={handleUpdateProject}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteProjectId} onOpenChange={(o) => !o && setDeleteProjectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le projet ?</AlertDialogTitle>
            <AlertDialogDescription>Les discussions ne seront pas supprimées sauf si vous cochez l&apos;option. Elles redeviendront &quot;Sans dossier&quot;.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center gap-2 py-2">
            <input type="checkbox" id="deleteChats" checked={deleteWithChats} onChange={(e) => setDeleteWithChats(e.target.checked)} />
            <label htmlFor="deleteChats" className="text-sm">Supprimer aussi les {projects.find((p) => p.id === deleteProjectId)?.chatCount ?? 0} discussions du projet</label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProject} className="bg-destructive text-destructive-foreground">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showBulkTagDialog} onOpenChange={setShowBulkTagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Étiqueter les discussions</DialogTitle>
            <DialogDescription>Séparez les tags par des virgules (max 10, 30 caractères).</DialogDescription>
          </DialogHeader>
          <Input placeholder="ex: urgent, travail, perso" value={bulkTagInput} onChange={(e) => setBulkTagInput(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkTagDialog(false)}>Annuler</Button>
            <Button onClick={handleTagSelected}>Appliquer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
