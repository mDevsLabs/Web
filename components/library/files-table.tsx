import React from "react";
import {
  CheckSquareIcon,
  CopyIcon,
  DownloadIcon,
  Edit2Icon,
  EyeIcon,
  PinIcon,
  SparklesIcon,
  SquareIcon,
  Trash2Icon,
} from "@mdevs/icons";
import {
  type CloudFile,
  formatBytes,
  formatDate,
  getFileIcon,
} from "./library-types";

export function FilesTable({
  currentModelSupportsFiles,
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
}: {
  currentModelSupportsFiles: boolean;
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
}) {
  const allSelected =
    files.length > 0 && files.every((f) => selectedIds.includes(f.id));

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/60 shadow-sm backdrop-blur-md">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border/50 bg-muted/40 font-medium text-muted-foreground">
              <th className="w-10 px-3 py-3 text-center">
                <button
                  className="cursor-pointer rounded p-1 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    if (allSelected) {
                      files.forEach((f) => onSelect(f.id));
                    } else {
                      files.forEach((f) => {
                        if (!selectedIds.includes(f.id)) {
                          onSelect(f.id);
                        }
                      });
                    }
                  }}
                  title={
                    allSelected ? "Tout désélectionner" : "Tout sélectionner"
                  }
                  type="button"
                >
                  {allSelected ? (
                    <CheckSquareIcon className="size-4 text-primary" />
                  ) : (
                    <SquareIcon className="size-4" />
                  )}
                </button>
              </th>
              <th className="px-3 py-3">Nom du fichier</th>
              <th className="px-4 py-3">Taille</th>
              <th className="hidden px-4 py-3 sm:table-cell">Format</th>
              <th className="hidden px-4 py-3 md:table-cell">Date d'ajout</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {files.map((file) => {
              const isPinned = pinnedIds.includes(file.id);
              const isSelected = selectedIds.includes(file.id);

              return (
                <tr
                  className={`group transition-colors ${
                    isSelected ? "bg-primary/5" : "hover:bg-muted/30"
                  }`}
                  key={file.id}
                >
                  <td className="px-3 py-3 text-center">
                    <button
                      className="cursor-pointer rounded p-1 text-muted-foreground hover:text-foreground"
                      onClick={() => onSelect(file.id)}
                      type="button"
                    >
                      {isSelected ? (
                        <CheckSquareIcon className="size-4 text-primary" />
                      ) : (
                        <SquareIcon className="size-4" />
                      )}
                    </button>
                  </td>

                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0 rounded-lg bg-muted/60 p-1.5 ring-1 ring-border/50">
                        {getFileIcon(file.mime_type, file.original_name)}
                        {isPinned && (
                          <span className="absolute -right-1 -top-1 flex size-3.5 items-center justify-center rounded-full bg-warning ring-2 ring-background">
                            <PinIcon className="size-2 fill-warning text-warning" />
                          </span>
                        )}
                      </div>
                      <div className="flex min-w-0 flex-col">
                        <button
                          className="block max-w-[200px] cursor-pointer truncate text-left font-medium text-foreground hover:underline sm:max-w-xs md:max-w-md"
                          onClick={() => onOpenPreview(file)}
                          title={file.original_name}
                          type="button"
                        >
                          {file.original_name}
                        </button>
                        {isPinned && (
                          <span className="flex items-center gap-0.5 text-[10px] font-medium text-warning">
                            <PinIcon className="size-2.5 fill-warning" />
                            Favori
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 font-mono text-muted-foreground">
                    {formatBytes(file.size_bytes)}
                  </td>

                  <td className="hidden whitespace-nowrap px-4 py-3 text-muted-foreground sm:table-cell">
                    <span className="rounded bg-muted px-2 py-0.5 font-mono text-[11px] uppercase">
                      {file.original_name.split(".").pop() || "fichier"}
                    </span>
                  </td>

                  <td className="hidden whitespace-nowrap px-4 py-3 text-muted-foreground md:table-cell">
                    {formatDate(file.uploaded_at)}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className={`cursor-pointer rounded-lg p-1.5 transition-colors ${
                          currentModelSupportsFiles
                            ? "text-primary hover:bg-primary/10"
                            : "bg-muted/30 text-muted-foreground/40 opacity-60"
                        }`}
                        disabled={!currentModelSupportsFiles}
                        onClick={() => onAskAI(file)}
                        title={
                          currentModelSupportsFiles
                            ? "Analyser avec l'IA"
                            : "Ce modèle ne prend pas en charge les fichiers"
                        }
                        type="button"
                      >
                        <SparklesIcon className="size-3.5" />
                      </button>

                      <button
                        className={`cursor-pointer rounded-lg p-1.5 transition-colors ${
                          isPinned
                            ? "bg-warning/10 text-warning hover:bg-warning/20"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                        onClick={() => onTogglePin(file.id)}
                        title={
                          isPinned
                            ? "Retirer des favoris"
                            : "Ajouter aux favoris"
                        }
                        type="button"
                      >
                        <PinIcon
                          className={`size-3.5 ${isPinned ? "fill-warning" : ""}`}
                        />
                      </button>

                      <button
                        className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        onClick={() => onOpenPreview(file)}
                        title="Aperçu rapide"
                        type="button"
                      >
                        <EyeIcon className="size-3.5" />
                      </button>

                      <button
                        className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        onClick={() => onRename(file)}
                        title="Renommer"
                        type="button"
                      >
                        <Edit2Icon className="size-3.5" />
                      </button>

                      <button
                        className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        onClick={() => onCopyLink(file.url)}
                        title="Copier le lien"
                        type="button"
                      >
                        <CopyIcon className="size-3.5" />
                      </button>

                      <a
                        className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        href={file.url}
                        rel="noopener noreferrer"
                        target="_blank"
                        title="Télécharger"
                      >
                        <DownloadIcon className="size-3.5" />
                      </a>

                      <button
                        className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => onDelete(file)}
                        title="Supprimer"
                        type="button"
                      >
                        <Trash2Icon className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
