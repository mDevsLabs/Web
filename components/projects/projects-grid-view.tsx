"use client";

import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  Edit2Icon,
  FolderIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SparklesIcon,
  Trash2Icon,
} from "@mdevs/icons";
import Link from "next/link";
import { ProjectIcon } from "@/components/chat/project-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ProjectViewItem = {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  isArchived: boolean;
  chatCount?: number;
  customInstructions?: string | null;
  defaultModel?: string | null;
};

type ProjectsGridViewProps = {
  projects: ProjectViewItem[];
  viewMode: "grid" | "list";
  availableModels: Array<{ id: string; name?: string }>;
  onCreateClick: () => void;
  onEditClick: (p: ProjectViewItem) => void;
  onDeleteClick: (id: string) => void;
  onToggleArchive: (p: ProjectViewItem) => void;
};

export function ProjectsGridView({
  projects,
  viewMode,
  availableModels,
  onCreateClick,
  onEditClick,
  onDeleteClick,
  onToggleArchive,
}: ProjectsGridViewProps) {
  if (projects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <FolderIcon className="mx-auto size-8 text-muted-foreground mb-3" />
        <h3 className="font-semibold">Aucun projet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Créez votre premier dossier pour ranger vos discussions.
        </p>
        <Button onClick={onCreateClick}>
          <PlusIcon className="size-4 mr-2" /> Créer un projet
        </Button>
      </div>
    );
  }

  if (viewMode === "grid") {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <div
            className="group relative rounded-2xl border border-border/60 bg-card p-5 shadow-xs transition hover:border-border hover:shadow-sm"
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
                  <DropdownMenuItem onClick={() => onEditClick(p)}>
                    <Edit2Icon className="size-3.5 mr-2" /> Modifier
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onToggleArchive(p)}>
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
                    onClick={() => onDeleteClick(p.id)}
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
                  {availableModels.find((m) => m.id === p.defaultModel)?.name ||
                    p.defaultModel}
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
    );
  }

  return (
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
  );
}
