import { LibraryIcon } from "@mdevs/icons";
import React from "react";
import { FileCard } from "./file-card";
import { FilesTable } from "./files-table";
import type { CloudFile } from "./library-types";

export function EmptyState({ hint, title }: { hint: string; title: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-border/40 bg-card/30 p-8 py-16 text-center text-muted-foreground">
      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted/60">
        <LibraryIcon className="size-6 text-muted-foreground/60" />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

export function FilesArea({
  currentModelSupportsFiles,
  emptyMessage,
  files,
  onAskAI,
  onCopyLink,
  onDelete,
  onOpenPreview,
  onRename,
  onSelect,
  onTogglePin,
  pinnedIds,
  selectedIds,
  viewMode,
}: {
  currentModelSupportsFiles: boolean;
  emptyMessage: string;
  files: CloudFile[];
  onAskAI: (file: CloudFile) => void;
  onCopyLink: (url: string) => void;
  onDelete: (file: CloudFile) => void;
  onOpenPreview: (file: CloudFile) => void;
  onRename: (file: CloudFile) => void;
  onSelect: (id: string) => void;
  onTogglePin: (id: string) => void;
  pinnedIds: string[];
  selectedIds: string[];
  viewMode: "grid" | "list";
}) {
  if (files.length === 0) {
    return emptyMessage ? (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border/40 bg-card/30 p-8 py-16 text-center text-muted-foreground">
        <LibraryIcon className="mb-3 size-6 text-muted-foreground/60" />
        <p className="text-sm font-medium text-foreground">{emptyMessage}</p>
      </div>
    ) : null;
  }

  if (viewMode === "list") {
    return (
      <FilesTable
        currentModelSupportsFiles={currentModelSupportsFiles}
        files={files}
        onAskAI={onAskAI}
        onCopyLink={onCopyLink}
        onDelete={onDelete}
        onOpenPreview={onOpenPreview}
        onRename={onRename}
        onSelect={onSelect}
        onTogglePin={onTogglePin}
        pinnedIds={pinnedIds}
        selectedIds={selectedIds}
      />
    );
  }

  return (
    <div className="columns-2 gap-4 sm:columns-3 xl:columns-4">
      {files.map((file) => (
        <FileCard
          currentModelSupportsFiles={currentModelSupportsFiles}
          file={file}
          isPinned={pinnedIds.includes(file.id)}
          isSelected={selectedIds.includes(file.id)}
          key={file.id}
          onAskAI={onAskAI}
          onCopyLink={onCopyLink}
          onDelete={onDelete}
          onOpenPreview={onOpenPreview}
          onRename={onRename}
          onSelect={onSelect}
          onTogglePin={onTogglePin}
        />
      ))}
    </div>
  );
}
