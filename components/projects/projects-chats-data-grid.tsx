"use client";

import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  MoreHorizontalIcon,
  PinIcon,
  PinOffIcon,
  Trash2Icon,
} from "@mdevs/icons";
import Link from "next/link";
import { useMemo } from "react";
import {
  type Column,
  DataGrid,
  type RenderCheckboxProps,
  type Renderers,
  renderCheckbox,
  SelectColumn,
} from "react-data-grid";
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
/** Vue minimale d'une discussion, telle que consommée par `/api/history`. */
export type ChatGridRow = {
  createdAt: string | Date;
  id: string;
  isArchived: boolean;
  pinned: boolean;
  projectId: string | null;
  tags: string[] | null;
  title: string;
};

/** Vue minimale d'un projet pour la colonne « Projet ». */
export type ProjectGridRef = {
  color: string | null;
  icon: string | null;
  id: string;
  name: string;
};

// Cases à cocher avec des libellés français, comme dans la page Projets.
const CHAT_GRID_RENDERERS: Renderers<ChatGridRow, unknown> = {
  renderCheckbox: (props: RenderCheckboxProps) =>
    renderCheckbox({
      ...props,
      "aria-label":
        props["aria-label"] === "Select All"
          ? "Sélectionner toutes les discussions"
          : "Sélectionner cette discussion",
    }),
};

export interface ProjectsChatsDataGridProps {
  chats: ChatGridRow[];
  chatsError: unknown;
  chatsLoading: boolean;
  hasMore: boolean;
  mutateChats: () => void;
  onOpenBulkTagForChat: (chatId: string) => void;
  onSelectedChatIdsChange: (ids: ReadonlySet<string>) => void;
  onSingleAction: (
    chatId: string,
    patch: Record<string, unknown>
  ) => Promise<void>;
  projectMap: Map<string, ProjectGridRef>;
  resolvedTheme?: string;
  selectedChatIds: ReadonlySet<string>;
  setSize: (size: number) => void;
  size: number;
}

export function ProjectsChatsDataGrid({
  chats,
  chatsLoading,
  chatsError,
  hasMore,
  size,
  setSize,
  mutateChats,
  projectMap,
  selectedChatIds,
  onSelectedChatIdsChange,
  onSingleAction,
  onOpenBulkTagForChat,
  resolvedTheme,
}: ProjectsChatsDataGridProps) {
  const columns = useMemo<readonly Column<ChatGridRow>[]>(
    () => [
      SelectColumn,
      {
        key: "title",
        name: "Discussion",
        renderCell: ({ row }: { row: ChatGridRow }) => (
          <div className="flex items-center gap-2 truncate">
            {row.pinned && <PinIcon className="size-3 text-warning shrink-0" />}
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
        renderCell: ({ row }: { row: ChatGridRow }) => {
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
                style={{ color: p.color ?? undefined }}
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
        renderCell: ({ row }: { row: ChatGridRow }) =>
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
        renderCell: ({ row }: { row: ChatGridRow }) => (
          <span className="text-xs text-muted-foreground">
            {new Date(row.createdAt).toLocaleDateString("fr-FR")}
          </span>
        ),
        width: 140,
      },
      {
        key: "actions",
        name: "",
        renderCell: ({ row }: { row: ChatGridRow }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              className="h-7 w-7"
              onClick={async () => {
                await onSingleAction(row.id, { pinned: !row.pinned });
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
                await onSingleAction(row.id, {
                  isArchived: !row.isArchived,
                });
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
                <Button
                  aria-label={`Options de ${row.title}`}
                  className="h-7 w-7"
                  size="icon"
                  variant="ghost"
                >
                  <MoreHorizontalIcon className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onOpenBulkTagForChat(row.id)}>
                  Gérer les tags
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={async () => {
                    if (
                      !confirm(
                        "Supprimer cette discussion ? Cette action est irréversible."
                      )
                    ) {
                      return;
                    }
                    await fetch(`/api/chat/${row.id}`, { method: "DELETE" });
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
    ],
    [mutateChats, onOpenBulkTagForChat, onSingleAction, projectMap]
  );

  return (
    <div className="rounded-2xl border border-border/60 shadow-xs overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-muted/20">
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
            onSelectedRowsChange={onSelectedChatIdsChange}
            renderers={CHAT_GRID_RENDERERS}
            rowKeyGetter={(row: ChatGridRow) => row.id}
            rows={chats}
            selectedRows={selectedChatIds}
            style={{ height: 500 }}
          />
        )}
      </div>
    </div>
  );
}
