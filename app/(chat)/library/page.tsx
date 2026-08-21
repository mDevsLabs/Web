"use client";

import {
  AlertCircleIcon,
  ArchiveIcon,
  CheckIcon,
  CheckSquareIcon,
  CloudIcon,
  CloudUploadIcon,
  CodeIcon,
  CopyIcon,
  DownloadIcon,
  Edit2Icon,
  ExternalLinkIcon,
  EyeIcon,
  FileIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  GridIcon,
  ImageIcon,
  ListIcon,
  Loader2Icon,
  MusicIcon,
  PinIcon,
  PinOffIcon,
  SearchIcon,
  SparklesIcon,
  SquareIcon,
  Trash2Icon,
  VideoIcon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { MAI_UPGRADE_URL } from "@/lib/constants";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
  if (!bytes || bytes === 0) return "0 Octet";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Octets", "Ko", "Mo", "Go", "To"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function getFileCategory(
  mimeType: string,
  filename: string
): "image" | "video" | "audio" | "document" | "code" | "archive" | "other" {
  const lowerName = filename.toLowerCase();
  if (
    mimeType.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i.test(lowerName)
  )
    return "image";
  if (
    mimeType.startsWith("video/") ||
    /\.(mp4|webm|mov|avi|mkv)$/i.test(lowerName)
  )
    return "video";
  if (
    mimeType.startsWith("audio/") ||
    /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(lowerName)
  )
    return "audio";
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
  if (category === "image")
    return <ImageIcon className="size-5 text-blue-500" />;
  if (category === "video")
    return <VideoIcon className="size-5 text-purple-500" />;
  if (category === "audio")
    return <MusicIcon className="size-5 text-pink-500" />;
  if (category === "code")
    return <CodeIcon className="size-5 text-emerald-500" />;
  if (category === "archive")
    return <ArchiveIcon className="size-5 text-amber-500" />;
  if (category === "document") {
    if (
      mimeType.includes("sheet") ||
      mimeType.includes("excel") ||
      filename.endsWith(".csv")
    ) {
      return <FileSpreadsheetIcon className="size-5 text-green-500" />;
    }
    return <FileTextIcon className="size-5 text-red-500" />;
  }
  return <FileIcon className="size-5 text-muted-foreground" />;
}

export default function LibraryPage() {
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [storage, setStorage] = useState<StorageUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Épinglage (persistance dans le stockage local)
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("mai_pinned_cloud_files");
      if (saved) {
        setPinnedIds(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const togglePin = useCallback((id: string) => {
    setPinnedIds((prev) => {
      const isPinned = prev.includes(id);
      const updated = isPinned
        ? prev.filter((item) => item !== id)
        : [id, ...prev];
      try {
        localStorage.setItem(
          "mai_pinned_cloud_files",
          JSON.stringify(updated)
        );
      } catch {}
      toast.success(
        isPinned
          ? "Fichier désépinglé"
          : "Fichier épinglé en tête de liste 📌"
      );
      return updated;
    });
  }, []);

  // Multi-sélection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Vue Liste / Grille
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Filtre par catégorie & Tri
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<
    | "date-desc"
    | "date-asc"
    | "name-asc"
    | "name-desc"
    | "size-desc"
    | "size-asc"
  >("date-desc");

  // Upload
  const [uploadingFiles, setUploadingFiles] = useState<
    { name: string; size: number; progress: number; error?: string }[]
  >([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Suppression
  const [fileToDelete, setFileToDelete] = useState<CloudFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  // Renommage
  const [fileToRename, setFileToRename] = useState<CloudFile | null>(null);
  const [newName, setNewName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  // Prévisualisation
  const [previewFile, setPreviewFile] = useState<CloudFile | null>(null);

  // Charger les données de la bibliothèque
  const fetchLibraryData = useCallback(async () => {
    try {
      const res = await fetch("/api/library");
      if (!res.ok) throw new Error("Impossible de charger les fichiers");
      const data = await res.json();
      setFiles(data.files || []);
      setStorage(data.storage || null);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la récupération de votre bibliothèque.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLibraryData();
  }, [fetchLibraryData]);

  // Upload d'un fichier individuel
  const uploadSingleFile = async (file: File) => {
    if (!storage) return;

    const remainingBytes = Math.max(0, storage.bytes_limit - storage.bytes_used);
    if (file.size > remainingBytes) {
      toast.error(
        `Espace insuffisant pour "${file.name}" (${formatBytes(file.size)}). Espace restant : ${formatBytes(remainingBytes)}.`
      );
      return;
    }

    setUploadingFiles((prev) => [
      ...prev,
      { name: file.name, size: file.size, progress: 30 },
    ]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/library", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.error || `Échec de l'importation de ${file.name}`);
        setUploadingFiles((prev) => prev.filter((f) => f.name !== file.name));
        return;
      }

      toast.success(`Fichier "${file.name}" importé avec succès ! ✨`);
      if (data.file) {
        setFiles((prev) => [data.file, ...prev]);
      }
      if (data.storage) {
        setStorage(data.storage);
      } else {
        fetchLibraryData();
      }
    } catch {
      toast.error(`Erreur réseau lors de l'envoi de ${file.name}`);
    } finally {
      setUploadingFiles((prev) => prev.filter((f) => f.name !== file.name));
    }
  };

  const handleFilesSelected = (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    Array.from(selectedFiles).forEach((file) => uploadSingleFile(file));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesSelected(e.dataTransfer.files);
  };

  // Suppression d'un fichier unique
  const confirmDelete = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/library?id=${fileToDelete.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Erreur lors de la suppression.");
        return;
      }

      toast.success("Fichier supprimé de votre Cloud.");
      setFiles((prev) => prev.filter((f) => f.id !== fileToDelete.id));
      setSelectedIds((prev) => prev.filter((id) => id !== fileToDelete.id));
      setPinnedIds((prev) => {
        const next = prev.filter((id) => id !== fileToDelete.id);
        localStorage.setItem("mai_pinned_cloud_files", JSON.stringify(next));
        return next;
      });

      if (storage) {
        const newUsed = Math.max(0, storage.bytes_used - fileToDelete.size_bytes);
        const newPercent =
          Math.round((newUsed / storage.bytes_limit) * 10000) / 100;
        setStorage({
          ...storage,
          bytes_used: newUsed,
          files_count: Math.max(0, storage.files_count - 1),
          percent_used: newPercent,
          over_limit: newUsed >= storage.bytes_limit,
        });
      }
    } catch {
      toast.error("Impossible de supprimer le fichier.");
    } finally {
      setIsDeleting(false);
      setFileToDelete(null);
    }
  };

  // Suppression groupée
  const confirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleting(true);

    let deletedCount = 0;
    let freedBytes = 0;

    for (const id of selectedIds) {
      const targetFile = files.find((f) => f.id === id);
      try {
        const res = await fetch(`/api/library?id=${id}`, { method: "DELETE" });
        if (res.ok) {
          deletedCount++;
          if (targetFile) freedBytes += targetFile.size_bytes;
        }
      } catch {}
    }

    setFiles((prev) => prev.filter((f) => !selectedIds.includes(f.id)));
    setPinnedIds((prev) => {
      const next = prev.filter((id) => !selectedIds.includes(id));
      localStorage.setItem("mai_pinned_cloud_files", JSON.stringify(next));
      return next;
    });

    if (storage && freedBytes > 0) {
      const newUsed = Math.max(0, storage.bytes_used - freedBytes);
      const newPercent =
        Math.round((newUsed / storage.bytes_limit) * 10000) / 100;
      setStorage({
        ...storage,
        bytes_used: newUsed,
        files_count: Math.max(0, storage.files_count - deletedCount),
        percent_used: newPercent,
        over_limit: newUsed >= storage.bytes_limit,
      });
    }

    toast.success(`${deletedCount} fichier(s) supprimé(s) de votre Cloud.`);
    setSelectedIds([]);
    setIsBulkDeleting(false);
    setBulkDeleteDialogOpen(false);
  };

  // Renommage
  const openRenameModal = (file: CloudFile) => {
    setFileToRename(file);
    setNewName(file.original_name);
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileToRename || !newName.trim()) return;

    const trimmed = newName.trim();
    if (trimmed === fileToRename.original_name) {
      setFileToRename(null);
      return;
    }

    setIsRenaming(true);
    try {
      const res = await fetch("/api/library", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: fileToRename.id, name: trimmed }),
      });

      if (!res.ok) {
        toast.error("Erreur lors du renommage");
        return;
      }

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileToRename.id ? { ...f, original_name: trimmed } : f
        )
      );
      toast.success("Fichier renommé avec succès ! ✏️");
      setFileToRename(null);
    } catch {
      toast.error("Impossible de renommer le fichier");
    } finally {
      setIsRenaming(false);
    }
  };

  // Copie de l'URL
  const copyFileLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Lien direct copié dans le presse-papier ! 📋");
  };

  // Téléchargement groupé
  const handleBulkDownload = () => {
    const selectedFiles = files.filter((f) => selectedIds.includes(f.id));
    selectedFiles.forEach((file) => {
      window.open(file.url, "_blank");
    });
    toast.success(`Téléchargement de ${selectedFiles.length} fichier(s) lancé.`);
  };

  // Épinglage groupé
  const handleBulkPin = (pin: boolean) => {
    setPinnedIds((prev) => {
      const next = pin
        ? Array.from(new Set([...selectedIds, ...prev]))
        : prev.filter((id) => !selectedIds.includes(id));
      try {
        localStorage.setItem("mai_pinned_cloud_files", JSON.stringify(next));
      } catch {}
      return next;
    });
    toast.success(
      pin ? "Fichiers sélectionnés épinglés 📌" : "Fichiers sélectionnés désépinglés"
    );
    setSelectedIds([]);
  };

  // Multi-sélection helpers
  const toggleSelectFile = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Filtrage et tri
  const filteredAndSortedFiles = useMemo(() => {
    const result = files.filter((f) => {
      const matchesSearch =
        f.original_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.mime_type.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (selectedCategory === "all") return true;
      if (selectedCategory === "pinned") return pinnedIds.includes(f.id);

      const category = getFileCategory(f.mime_type, f.original_name);
      return category === selectedCategory;
    });

    result.sort((a, b) => {
      const aPinned = pinnedIds.includes(a.id);
      const bPinned = pinnedIds.includes(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      switch (sortBy) {
        case "date-asc":
          return (
            new Date(a.uploaded_at).getTime() -
            new Date(b.uploaded_at).getTime()
          );
        case "date-desc":
          return (
            new Date(b.uploaded_at).getTime() -
            new Date(a.uploaded_at).getTime()
          );
        case "name-asc":
          return a.original_name.localeCompare(b.original_name, "fr", {
            sensitivity: "base",
          });
        case "name-desc":
          return b.original_name.localeCompare(a.original_name, "fr", {
            sensitivity: "base",
          });
        case "size-desc":
          return b.size_bytes - a.size_bytes;
        case "size-asc":
          return a.size_bytes - b.size_bytes;
        default:
          return 0;
      }
    });

    return result;
  }, [files, searchQuery, selectedCategory, pinnedIds, sortBy]);

  const allVisibleSelected =
    filteredAndSortedFiles.length > 0 &&
    filteredAndSortedFiles.every((f) => selectedIds.includes(f.id));

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !filteredAndSortedFiles.some((f) => f.id === id))
      );
    } else {
      const visibleIds = filteredAndSortedFiles.map((f) => f.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  // Compteurs par catégorie
  const categoryCounts = useMemo(() => {
    const counts = {
      all: files.length,
      archive: 0,
      code: 0,
      document: 0,
      image: 0,
      pinned: files.filter((f) => pinnedIds.includes(f.id)).length,
      video: 0,
    };
    files.forEach((f) => {
      const cat = getFileCategory(f.mime_type, f.original_name);
      if (cat in counts) {
        counts[cat as keyof typeof counts]++;
      }
    });
    return counts;
  }, [files, pinnedIds]);

  return (
    <div className="flex flex-1 flex-col h-full overflow-y-auto bg-background p-6 md:p-10 max-w-6xl mx-auto w-full">
      {/* En-tête de la page */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/50">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase mb-1">
            <CloudIcon className="size-4" />
            Stockage Cloud Sécurisé
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Bibliothèque de fichiers
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Importez, épinglez et gérez vos documents, médias et codes pour alimenter l'IA.
          </p>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground text-background px-4 py-2.5 text-sm font-medium transition-all hover:opacity-90 active:scale-95 shadow-sm cursor-pointer"
        >
          <CloudUploadIcon className="size-4" />
          <span>Importer des fichiers</span>
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => handleFilesSelected(e.target.files)}
          multiple
          className="hidden"
        />
      </div>

      {/* Carte Quota & Forfait */}
      {storage && (
        <div className="my-6 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-semibold text-foreground">Espace utilisé</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                Forfait {storage.tier}
              </span>
            </div>
            <div className="text-xs sm:text-sm font-medium text-muted-foreground">
              <strong className="text-foreground">{formatBytes(storage.bytes_used)}</strong> sur{" "}
              <strong>{formatBytes(storage.bytes_limit)}</strong> ({storage.percent_used}%) •{" "}
              {storage.files_count} {storage.files_count > 1 ? "fichiers" : "fichier"}
            </div>
          </div>

          {/* Barre de progression */}
          <div className="h-2.5 w-full rounded-full bg-muted/60 overflow-hidden relative">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                storage.percent_used > 90
                  ? "bg-red-500"
                  : storage.percent_used > 75
                  ? "bg-amber-500"
                  : "bg-gradient-to-r from-blue-500 to-indigo-600"
              }`}
              style={{ width: `${Math.min(100, storage.percent_used)}%` }}
            />
          </div>

          {storage.percent_used >= 90 && (
            <div className="mt-3 flex items-center justify-between text-xs text-amber-500 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
              <div className="flex items-center gap-2">
                <AlertCircleIcon className="size-4 shrink-0" />
                <span>Vous approchez de votre limite de stockage.</span>
              </div>
              <Link
                href={MAI_UPGRADE_URL}
                target="_blank"
                className="font-semibold underline hover:text-amber-400 shrink-0 flex items-center gap-1"
              >
                Mettre à niveau
                <ExternalLinkIcon className="size-3" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Zone de Drag & Drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`my-2 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-7 text-center transition-all cursor-pointer ${
          isDragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border/60 bg-muted/20 hover:bg-muted/40 hover:border-border"
        }`}
      >
        <div className="size-11 rounded-2xl bg-muted/80 flex items-center justify-center text-muted-foreground mb-2.5 ring-1 ring-border/50">
          <CloudUploadIcon className="size-5 text-primary" />
        </div>
        <p className="text-sm font-medium text-foreground">
          Glissez-déposez vos fichiers ici, ou <span className="text-primary underline">parcourez votre appareil</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Tous formats supportés : PDF, Documents, Code, Images, Audio, Vidéo, Archives...
        </p>
      </div>

      {/* Fichiers en cours d'envoi */}
      {uploadingFiles.length > 0 && (
        <div className="my-4 flex flex-col gap-2">
          {uploadingFiles.map((up) => (
            <div
              key={up.name}
              className="flex items-center justify-between p-3 rounded-xl border border-primary/30 bg-primary/5 text-xs animate-pulse"
            >
              <div className="flex items-center gap-2.5 truncate">
                <Loader2Icon className="size-4 animate-spin text-primary shrink-0" />
                <span className="font-medium truncate text-foreground">{up.name}</span>
                <span className="text-muted-foreground">({formatBytes(up.size)})</span>
              </div>
              <span className="text-primary font-medium shrink-0">Téléversement...</span>
            </div>
          ))}
        </div>
      )}

      {/* Filtres par catégorie */}
      <div className="mt-6 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
            selectedCategory === "all"
              ? "bg-foreground text-background shadow-xs"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <span>Tous</span>
          <span className="opacity-70 text-[10px]">({categoryCounts.all})</span>
        </button>

        <button
          onClick={() => setSelectedCategory("pinned")}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
            selectedCategory === "pinned"
              ? "bg-foreground text-background shadow-xs"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <PinIcon className="size-3" />
          <span>Épinglés</span>
          <span className="opacity-70 text-[10px]">({categoryCounts.pinned})</span>
        </button>

        <button
          onClick={() => setSelectedCategory("document")}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
            selectedCategory === "document"
              ? "bg-foreground text-background shadow-xs"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <FileTextIcon className="size-3 text-red-500" />
          <span>Documents</span>
          <span className="opacity-70 text-[10px]">({categoryCounts.document})</span>
        </button>

        <button
          onClick={() => setSelectedCategory("image")}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
            selectedCategory === "image"
              ? "bg-foreground text-background shadow-xs"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <ImageIcon className="size-3 text-blue-500" />
          <span>Images</span>
          <span className="opacity-70 text-[10px]">({categoryCounts.image})</span>
        </button>

        <button
          onClick={() => setSelectedCategory("code")}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
            selectedCategory === "code"
              ? "bg-foreground text-background shadow-xs"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <CodeIcon className="size-3 text-emerald-500" />
          <span>Code</span>
          <span className="opacity-70 text-[10px]">({categoryCounts.code})</span>
        </button>

        <button
          onClick={() => setSelectedCategory("archive")}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
            selectedCategory === "archive"
              ? "bg-foreground text-background shadow-xs"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <ArchiveIcon className="size-3 text-amber-500" />
          <span>Archives</span>
          <span className="opacity-70 text-[10px]">({categoryCounts.archive})</span>
        </button>
      </div>

      {/* Barre d'outils (Recherche, Tri, Vue) */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher par nom ou format..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-9 pr-3 rounded-xl border-border/60 bg-muted/30 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Sélecteur de tri */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-9 px-3 rounded-xl border border-border/60 bg-muted/30 text-xs text-foreground font-medium cursor-pointer outline-none hover:bg-muted/50"
          >
            <option value="date-desc">Plus récents</option>
            <option value="date-asc">Plus anciens</option>
            <option value="name-asc">Nom (A-Z)</option>
            <option value="name-desc">Nom (Z-A)</option>
            <option value="size-desc">Taille (Décroissante)</option>
            <option value="size-asc">Taille (Croissante)</option>
          </select>

          {/* Bascule Grille / Liste */}
          <div className="flex items-center p-0.5 rounded-xl border border-border/60 bg-muted/30">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "table"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Vue Liste"
            >
              <ListIcon className="size-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Vue Grille"
            >
              <GridIcon className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Barre d'actions groupées flottante */}
      {selectedIds.length > 0 && (
        <div className="sticky top-4 z-20 my-3 flex items-center justify-between p-3 rounded-2xl bg-foreground text-background shadow-xl backdrop-blur-md animate-in fade-in-0 slide-in-from-top-2">
          <div className="flex items-center gap-2 text-xs font-medium px-2">
            <CheckSquareIcon className="size-4" />
            <span>{selectedIds.length} fichier(s) sélectionné(s)</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => handleBulkPin(true)}
              className="px-2.5 py-1.5 rounded-lg bg-background/15 hover:bg-background/25 transition-colors cursor-pointer flex items-center gap-1"
              title="Épingler la sélection"
            >
              <PinIcon className="size-3.5" />
              <span className="hidden sm:inline">Épingler</span>
            </button>

            <button
              onClick={() => handleBulkPin(false)}
              className="px-2.5 py-1.5 rounded-lg bg-background/15 hover:bg-background/25 transition-colors cursor-pointer flex items-center gap-1"
              title="Désépingler la sélection"
            >
              <PinOffIcon className="size-3.5" />
              <span className="hidden sm:inline">Désépingler</span>
            </button>

            <button
              onClick={handleBulkDownload}
              className="px-2.5 py-1.5 rounded-lg bg-background/15 hover:bg-background/25 transition-colors cursor-pointer flex items-center gap-1"
              title="Télécharger la sélection"
            >
              <DownloadIcon className="size-3.5" />
              <span className="hidden sm:inline">Télécharger</span>
            </button>

            <button
              onClick={() => setBulkDeleteDialogOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors cursor-pointer flex items-center gap-1"
              title="Supprimer la sélection"
            >
              <Trash2Icon className="size-3.5" />
              <span className="hidden sm:inline">Supprimer</span>
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="p-1.5 rounded-lg hover:bg-background/20 transition-colors cursor-pointer ml-1"
              title="Désélectionner tout"
            >
              <XIcon className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* Affichage des fichiers */}
      <div className="mt-4">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <Loader2Icon className="size-6 animate-spin text-primary" />
            <span className="text-sm">Chargement de votre bibliothèque...</span>
          </div>
        ) : filteredAndSortedFiles.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-muted-foreground rounded-2xl border border-border/40 bg-card/30 p-8 text-center">
            <div className="size-12 rounded-full bg-muted/60 flex items-center justify-center mb-3">
              <SparklesIcon className="size-6 text-muted-foreground/60" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {searchQuery || selectedCategory !== "all"
                ? "Aucun fichier correspondant aux critères sélectionnés"
                : "Votre bibliothèque est vide"}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              {searchQuery || selectedCategory !== "all"
                ? "Essayez de modifier votre recherche ou vos filtres pour afficher vos documents."
                : "Importez vos premiers documents et médias pour les organiser et les utiliser dans vos discussions."}
            </p>
          </div>
        ) : viewMode === "table" ? (
          /* VUE TABLEAU */
          <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/40 text-muted-foreground font-medium">
                    <th className="py-3 px-3 w-10 text-center">
                      <button
                        type="button"
                        onClick={toggleSelectAllVisible}
                        className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                        title={
                          allVisibleSelected
                            ? "Tout désélectionner"
                            : "Tout sélectionner"
                        }
                      >
                        {allVisibleSelected ? (
                          <CheckSquareIcon className="size-4 text-primary" />
                        ) : (
                          <SquareIcon className="size-4" />
                        )}
                      </button>
                    </th>
                    <th className="py-3 px-3">Nom du fichier</th>
                    <th className="py-3 px-4">Taille</th>
                    <th className="py-3 px-4 hidden sm:table-cell">Format</th>
                    <th className="py-3 px-4 hidden md:table-cell">
                      Date d'ajout
                    </th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredAndSortedFiles.map((file) => {
                    const isPinned = pinnedIds.includes(file.id);
                    const isSelected = selectedIds.includes(file.id);

                    return (
                      <tr
                        key={file.id}
                        className={`transition-colors group ${
                          isSelected ? "bg-primary/5" : "hover:bg-muted/30"
                        }`}
                      >
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleSelectFile(file.id)}
                            className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquareIcon className="size-4 text-primary" />
                            ) : (
                              <SquareIcon className="size-4" />
                            )}
                          </button>
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <div className="relative p-1.5 rounded-lg bg-muted/60 ring-1 ring-border/50 shrink-0">
                              {getFileIcon(file.mime_type, file.original_name)}
                              {isPinned && (
                                <span className="absolute -top-1 -right-1 size-3 bg-amber-500 rounded-full ring-2 ring-background flex items-center justify-center text-[8px] text-white">
                                  📌
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span
                                className="font-medium text-foreground truncate max-w-[200px] sm:max-w-xs md:max-w-md block"
                                title={file.original_name}
                              >
                                {file.original_name}
                              </span>
                              {isPinned && (
                                <span className="text-[10px] text-amber-500 font-medium flex items-center gap-0.5">
                                  <PinIcon className="size-2.5 fill-amber-500" />{" "}
                                  Épinglé
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-muted-foreground font-mono whitespace-nowrap">
                          {formatBytes(file.size_bytes)}
                        </td>

                        <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-muted text-[11px] font-mono uppercase">
                            {file.original_name.split(".").pop() || "fichier"}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-muted-foreground hidden md:table-cell whitespace-nowrap">
                          {formatDate(file.uploaded_at)}
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {/* Épingler */}
                            <button
                              onClick={() => togglePin(file.id)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isPinned
                                  ? "text-amber-500 bg-amber-500/10 hover:bg-amber-500/20"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
                              }`}
                              title={isPinned ? "Désépingler" : "Épingler en tête"}
                            >
                              <PinIcon
                                className={`size-3.5 ${
                                  isPinned ? "fill-amber-500" : ""
                                }`}
                              />
                            </button>

                            {/* Aperçu */}
                            <button
                              onClick={() => setPreviewFile(file)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                              title="Aperçu rapide"
                            >
                              <EyeIcon className="size-3.5" />
                            </button>

                            {/* Renommer */}
                            <button
                              onClick={() => openRenameModal(file)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                              title="Renommer"
                            >
                              <Edit2Icon className="size-3.5" />
                            </button>

                            {/* Copier le lien */}
                            <button
                              onClick={() => copyFileLink(file.url)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                              title="Copier le lien"
                            >
                              <CopyIcon className="size-3.5" />
                            </button>

                            {/* Télécharger */}
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                              title="Télécharger"
                            >
                              <DownloadIcon className="size-3.5" />
                            </a>

                            {/* Supprimer */}
                            <button
                              onClick={() => setFileToDelete(file)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                              title="Supprimer"
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
        ) : (
          /* VUE GRILLE */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredAndSortedFiles.map((file) => {
              const isPinned = pinnedIds.includes(file.id);
              const isSelected = selectedIds.includes(file.id);

              return (
                <div
                  key={file.id}
                  className={`relative flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200 bg-card/60 backdrop-blur-md ${
                    isSelected
                      ? "border-primary ring-1 ring-primary shadow-md bg-primary/5"
                      : "border-border/60 hover:border-border hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => toggleSelectFile(file.id)}
                        className="p-0.5 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {isSelected ? (
                          <CheckSquareIcon className="size-4 text-primary" />
                        ) : (
                          <SquareIcon className="size-4" />
                        )}
                      </button>
                      <div className="p-2 rounded-xl bg-muted/60 ring-1 ring-border/50">
                        {getFileIcon(file.mime_type, file.original_name)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => togglePin(file.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isPinned
                            ? "text-amber-500 bg-amber-500/10 hover:bg-amber-500/20"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                        title={isPinned ? "Désépingler" : "Épingler"}
                      >
                        <PinIcon
                          className={`size-3.5 ${
                            isPinned ? "fill-amber-500" : ""
                          }`}
                        />
                      </button>

                      <button
                        onClick={() => openRenameModal(file)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                        title="Renommer"
                      >
                        <Edit2Icon className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="my-1">
                    <h3
                      className="font-medium text-xs text-foreground truncate cursor-pointer hover:underline"
                      title={file.original_name}
                      onClick={() => setPreviewFile(file)}
                    >
                      {file.original_name}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1">
                      <span>{formatBytes(file.size_bytes)}</span>
                      <span>•</span>
                      <span>{formatDate(file.uploaded_at)}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-muted text-[10px] font-mono uppercase">
                      {file.original_name.split(".").pop() || "fichier"}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => copyFileLink(file.url)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                        title="Copier le lien"
                      >
                        <CopyIcon className="size-3.5" />
                      </button>

                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                        title="Télécharger"
                      >
                        <DownloadIcon className="size-3.5" />
                      </a>

                      <button
                        onClick={() => setFileToDelete(file)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2Icon className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modale de Renommage */}
      <Dialog
        open={Boolean(fileToRename)}
        onOpenChange={(open) => !open && setFileToRename(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Renommer le fichier</DialogTitle>
            <DialogDescription>
              Modifiez le nom d'affichage de votre document Cloud.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRenameSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nouveau nom de fichier..."
                autoFocus
                className="rounded-xl text-xs"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFileToRename(null)}
                disabled={isRenaming}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isRenaming || !newName.trim()}>
                {isRenaming ? "Enregistrement..." : "Renommer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modale de Prévisualisation */}
      <Dialog
        open={Boolean(previewFile)}
        onOpenChange={(open) => !open && setPreviewFile(null)}
      >
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="truncate pr-4">
              {previewFile?.original_name}
            </DialogTitle>
            <DialogDescription>
              {previewFile && formatBytes(previewFile.size_bytes)} •{" "}
              {previewFile?.mime_type}
            </DialogDescription>
          </DialogHeader>

          <div className="my-3 flex flex-col items-center justify-center rounded-xl bg-muted/30 border border-border/40 p-4 min-h-48 overflow-hidden">
            {previewFile?.mime_type.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewFile.url}
                alt={previewFile.original_name}
                className="max-h-80 w-auto rounded-lg object-contain shadow-sm"
              />
            ) : previewFile?.mime_type.startsWith("video/") ? (
              <video controls className="max-h-80 w-full rounded-lg">
                <source src={previewFile.url} type={previewFile.mime_type} />
                Votre navigateur ne prend pas en charge la lecture de vidéos.
              </video>
            ) : previewFile?.mime_type.startsWith("audio/") ? (
              <audio controls className="w-full">
                <source src={previewFile.url} type={previewFile.mime_type} />
                Votre navigateur ne prend pas en charge la lecture audio.
              </audio>
            ) : (
              <div className="flex flex-col items-center gap-3 text-center p-6">
                <div className="p-4 rounded-2xl bg-muted/80">
                  {previewFile &&
                    getFileIcon(
                      previewFile.mime_type,
                      previewFile.original_name
                    )}
                </div>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Aperçu direct non disponible pour ce format. Vous pouvez l'ouvrir ou le télécharger directement.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="flex-row justify-between sm:justify-between items-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => previewFile && copyFileLink(previewFile.url)}
              className="gap-1.5 text-xs"
            >
              <CopyIcon className="size-3.5" />
              Copier le lien
            </Button>

            <a
              href={previewFile?.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-foreground text-background hover:opacity-90 transition-opacity"
            >
              <DownloadIcon className="size-3.5" />
              Ouvrir / Télécharger
            </a>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modale de confirmation de suppression individuelle */}
      <AlertDialog
        open={Boolean(fileToDelete)}
        onOpenChange={(open) => !open && setFileToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce fichier ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer définitivement{" "}
              <strong>{fileToDelete?.original_name}</strong> de votre Cloud ? Cette action libérera{" "}
              {fileToDelete && formatBytes(fileToDelete.size_bytes)} d'espace de stockage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Suppression..." : "Supprimer définitivement"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modale de confirmation de suppression groupée */}
      <AlertDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={(open) => !open && setBulkDeleteDialogOpen(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer les fichiers sélectionnés ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer définitivement les{" "}
              <strong>{selectedIds.length} fichier(s)</strong> sélectionnés de votre Cloud ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              disabled={isBulkDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isBulkDeleting ? "Suppression en cours..." : "Supprimer la sélection"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
