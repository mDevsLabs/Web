import {
  ArchiveIcon,
  CodeIcon,
  FileIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  ImageIcon,
  MusicIcon,
  VideoIcon,
} from "@mdevs/icons";
import React from "react";

export type CloudFile = {
  id: string;
  filename: string;
  original_name: string;
  url: string;
  size_bytes: number;
  mime_type: string;
  uploaded_at: string;
};

export type StorageUsage = {
  tier: string;
  bytes_used: number;
  bytes_limit: number;
  files_count: number;
  percent_used: number;
  over_limit: boolean;
};

export function formatBytes(bytes: number, decimals = 2) {
  if (!bytes || bytes === 0) {
    return "0 Octet";
  }
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Octets", "Ko", "Mo", "Go", "To"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
}

export function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

export type FileCategory =
  | "archive"
  | "audio"
  | "code"
  | "document"
  | "image"
  | "other"
  | "video";

export const CATEGORY_LABELS: Record<FileCategory, string> = {
  archive: "Archives",
  audio: "Audio",
  code: "Code",
  document: "Documents",
  image: "Images",
  other: "Autres",
  video: "Vidéos",
};

export const CATEGORY_ICONS: Record<FileCategory, typeof FileIcon> = {
  archive: ArchiveIcon,
  audio: MusicIcon,
  code: CodeIcon,
  document: FileTextIcon,
  image: ImageIcon,
  other: FileIcon,
  video: VideoIcon,
};

export const FOLDER_CATEGORIES: FileCategory[] = [
  "document",
  "video",
  "audio",
  "code",
  "archive",
  "other",
];

export function getFileCategory(
  mimeType: string,
  filename: string
): FileCategory {
  const lowerName = filename.toLowerCase();
  if (
    mimeType.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i.test(lowerName)
  ) {
    return "image";
  }
  if (
    mimeType.startsWith("video/") ||
    /\.(mp4|webm|mov|avi|mkv)$/i.test(lowerName)
  ) {
    return "video";
  }
  if (
    mimeType.startsWith("audio/") ||
    /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(lowerName)
  ) {
    return "audio";
  }
  if (
    mimeType.includes("pdf") ||
    mimeType.includes("word") ||
    mimeType.includes("document") ||
    mimeType.includes("sheet") ||
    mimeType.includes("excel") ||
    /\.(pdf|docx?|pptx?|xlsx?|csv|txt|rtf|md)$/i.test(lowerName)
  ) {
    return "document";
  }
  if (
    mimeType.includes("javascript") ||
    mimeType.includes("typescript") ||
    mimeType.includes("json") ||
    mimeType.includes("html") ||
    mimeType.includes("css") ||
    /\.(ts|tsx|js|jsx|py|json|html|css|sql|sh|rs|go|c|cpp|java|php)$/i.test(
      lowerName
    )
  ) {
    return "code";
  }
  if (
    mimeType.includes("zip") ||
    mimeType.includes("tar") ||
    mimeType.includes("rar") ||
    mimeType.includes("7z") ||
    /\.(zip|tar|gz|rar|7z|bz2)$/i.test(lowerName)
  ) {
    return "archive";
  }
  return "other";
}

export function getFileIcon(mimeType: string, filename: string) {
  const category = getFileCategory(mimeType, filename);
  if (category === "image") {
    return <ImageIcon className="size-5 text-muted-foreground" />;
  }
  if (category === "video") {
    return <VideoIcon className="size-5 text-muted-foreground" />;
  }
  if (category === "audio") {
    return <MusicIcon className="size-5 text-muted-foreground" />;
  }
  if (category === "code") {
    return <CodeIcon className="size-5 text-muted-foreground" />;
  }
  if (category === "archive") {
    return <ArchiveIcon className="size-5 text-muted-foreground" />;
  }
  if (category === "document") {
    if (
      mimeType.includes("sheet") ||
      mimeType.includes("excel") ||
      filename.endsWith(".csv")
    ) {
      return <FileSpreadsheetIcon className="size-5 text-muted-foreground" />;
    }
    return <FileTextIcon className="size-5 text-muted-foreground" />;
  }
  return <FileIcon className="size-5 text-muted-foreground" />;
}

export type LibraryTab =
  | "dossiers"
  | "favoris"
  | "images"
  | "suggestions"
  | "tout";
export type ExtraCategory = FileCategory | null;
export type Period = "all" | "30d" | "7d";
export type SortKey =
  | "date-asc"
  | "date-desc"
  | "name-asc"
  | "name-desc"
  | "size-asc"
  | "size-desc";

export const SORT_LABELS: Record<SortKey, string> = {
  "date-asc": "Plus anciens d'abord",
  "date-desc": "Plus récents d'abord",
  "name-asc": "Nom (A → Z)",
  "name-desc": "Nom (Z → A)",
  "size-asc": "Taille (croissante)",
  "size-desc": "Taille (décroissante)",
};

export const PERIOD_LABELS: Record<Period, string> = {
  "7d": "7 derniers jours",
  "30d": "30 derniers jours",
  all: "Toujours",
};

export const EXTRA_CATEGORY_OPTIONS: FileCategory[] = [
  "document",
  "code",
  "audio",
  "video",
  "archive",
];

export const TABS: { id: LibraryTab; label: string }[] = [
  { id: "suggestions", label: "Suggestions" },
  { id: "favoris", label: "Favoris" },
  { id: "dossiers", label: "Dossiers" },
  { id: "images", label: "Images" },
  { id: "tout", label: "Tout" },
];

export function cnSortItem(active: boolean) {
  return active ? "bg-muted/60 font-medium text-foreground" : "cursor-pointer";
}
