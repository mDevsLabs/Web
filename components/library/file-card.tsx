import React from "react";
import {
  CheckSquareIcon,
  CopyIcon,
  DownloadIcon,
  Edit2Icon,
  EyeIcon,
  MoreHorizontalIcon,
  PinIcon,
  SparklesIcon,
  SquareIcon,
  Trash2Icon,
} from "@mdevs/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CATEGORY_ICONS,
  type CloudFile,
  formatBytes,
  formatDate,
  getFileCategory,
} from "./library-types";

export function FileCard({
  currentModelSupportsFiles,
  file,
  isPinned,
  isSelected,
  onAskAI,
  onCopyLink,
  onDelete,
  onOpenPreview,
  onRename,
  onSelect,
  onTogglePin,
}: {
  currentModelSupportsFiles: boolean;
  file: CloudFile;
  isPinned: boolean;
  isSelected: boolean;
  onAskAI: (file: CloudFile) => void;
  onCopyLink: (url: string) => void;
  onDelete: (file: CloudFile) => void;
  onOpenPreview: (file: CloudFile) => void;
  onRename: (file: CloudFile) => void;
  onSelect: (id: string) => void;
  onTogglePin: (id: string) => void;
}) {
  const isImage = file.mime_type.startsWith("image/");
  const category = getFileCategory(file.mime_type, file.original_name);
  const CategoryIcon = CATEGORY_ICONS[category];

  return (
    <div
      className={`group relative mb-4 break-inside-avoid overflow-hidden rounded-2xl border bg-card/60 backdrop-blur-md transition-all ${
        isSelected
          ? "border-primary ring-1 ring-primary"
          : "border-border/60 hover:shadow-sm"
      }`}
    >
      {/* Sélection (au survol, ou toujours si la sélection est active) */}
      <button
        className={`absolute left-2 top-2 z-10 rounded-md bg-background/80 p-1 shadow-xs backdrop-blur-sm transition-opacity ${
          isSelected
            ? "opacity-100"
            : "cursor-pointer opacity-0 group-hover:opacity-100"
        }`}
        onClick={() => onSelect(file.id)}
        title={isSelected ? "Désélectionner" : "Sélectionner"}
        type="button"
      >
        {isSelected ? (
          <CheckSquareIcon className="size-4 text-primary" />
        ) : (
          <SquareIcon className="size-4 text-muted-foreground" />
        )}
      </button>

      {/* Actions rapides au survol */}
      <div className="absolute right-2 top-2 z-10 flex items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
        <button
          className={`cursor-pointer rounded-md bg-background/80 p-1 shadow-xs backdrop-blur-sm transition-colors ${
            isPinned
              ? "text-warning"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => onTogglePin(file.id)}
          title={isPinned ? "Retirer des favoris" : "Ajouter aux favoris"}
          type="button"
        >
          <PinIcon className={`size-4 ${isPinned ? "fill-warning" : ""}`} />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="Actions du fichier"
              className="cursor-pointer rounded-md bg-background/80 p-1 text-muted-foreground shadow-xs backdrop-blur-sm transition-colors hover:text-foreground"
              title="Plus d'actions"
              type="button"
            >
              <MoreHorizontalIcon className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem
              className="cursor-pointer gap-2"
              onClick={() => onOpenPreview(file)}
            >
              <EyeIcon className="size-4" />
              Aperçu
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer gap-2"
              disabled={!currentModelSupportsFiles}
              onClick={() => onAskAI(file)}
            >
              <SparklesIcon className="size-4" />
              Analyser avec l'IA
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer gap-2"
              onClick={() => onRename(file)}
            >
              <Edit2Icon className="size-4" />
              Renommer
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer gap-2"
              onClick={() => onCopyLink(file.url)}
            >
              <CopyIcon className="size-4" />
              Copier le lien
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer gap-2">
              <a href={file.url} rel="noopener noreferrer" target="_blank">
                <DownloadIcon className="size-4" />
                Télécharger
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer gap-2 text-destructive focus:text-destructive"
              onClick={() => onDelete(file)}
            >
              <Trash2Icon className="size-4" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Vignette : le clic ouvre l'aperçu */}
      <button
        className="block w-full cursor-pointer text-left"
        onClick={() => onOpenPreview(file)}
        type="button"
      >
        {isImage ? (
          <img
            alt={file.original_name}
            className="max-h-56 w-full bg-muted/30 object-cover"
            loading="lazy"
            src={file.url}
          />
        ) : (
          <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 bg-muted/30 text-muted-foreground">
            <CategoryIcon className="size-8" />
            <span className="px-3 text-[10px] font-mono uppercase tracking-wider">
              {file.original_name.split(".").pop() || "fichier"}
            </span>
          </div>
        )}
      </button>

      <figcaption className="flex flex-col gap-0.5 p-3">
        <span
          className="cursor-pointer truncate text-xs font-medium text-foreground hover:underline"
          onClick={() => onOpenPreview(file)}
          title={file.original_name}
        >
          {file.original_name}
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {formatBytes(file.size_bytes)}
          <span aria-hidden="true">·</span>
          {formatDate(file.uploaded_at)}
          {isPinned && (
            <span className="ml-auto flex items-center gap-0.5 text-warning">
              <PinIcon className="size-3 fill-warning" />
              Favori
            </span>
          )}
        </span>
      </figcaption>
    </div>
  );
}
