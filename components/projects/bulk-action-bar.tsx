"use client";

import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  PinIcon,
  TagIcon,
  Trash2Icon,
} from "@mdevs/icons";
import { ProjectIcon } from "@/components/chat/project-icon";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
/** Vue minimale d'un projet, telle que consommée par l'API `/api/projects`. */
export type ProjectOption = {
  color: string | null;
  icon: string | null;
  id: string;
  name: string;
};

export interface BulkActionBarProps {
  onBulkAction: (
    action: "move" | "archive" | "unarchive" | "pin" | "delete",
    targetProjectId?: string | null
  ) => void;
  onClearSelection: () => void;
  onOpenBulkTagDialog: () => void;
  projects: ProjectOption[];
  selectedCount: number;
}

export function BulkActionBar({
  selectedCount,
  projects,
  onBulkAction,
  onOpenBulkTagDialog,
  onClearSelection,
}: BulkActionBarProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="sticky bottom-4 z-30 mx-auto flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-background/95 backdrop-blur p-2 shadow-xl">
      <span className="text-sm font-medium px-2">
        {selectedCount} sélectionnée(s)
      </span>
      <div className="h-4 w-px bg-border" />
      <Select
        onValueChange={(v) => onBulkAction("move", v === "none" ? null : v)}
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
                  style={{ color: p.color ?? undefined }}
                />
                <span>{p.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        onClick={() => onBulkAction("archive")}
        size="sm"
        variant="outline"
      >
        <ArchiveIcon className="size-3.5 mr-1" /> Archiver
      </Button>
      <Button
        onClick={() => onBulkAction("unarchive")}
        size="sm"
        variant="outline"
      >
        <ArchiveRestoreIcon className="size-3.5 mr-1" /> Désarchiver
      </Button>
      <Button onClick={() => onBulkAction("pin")} size="sm" variant="outline">
        <PinIcon className="size-3.5 mr-1" /> Épingler
      </Button>
      <Button onClick={onOpenBulkTagDialog} size="sm" variant="outline">
        <TagIcon className="size-3.5 mr-1" /> Tags
      </Button>
      <Button
        onClick={() => onBulkAction("delete")}
        size="sm"
        variant="destructive"
      >
        <Trash2Icon className="size-3.5 mr-1" /> Supprimer
      </Button>
      <Button onClick={onClearSelection} size="sm" variant="ghost">
        Effacer
      </Button>
    </div>
  );
}
