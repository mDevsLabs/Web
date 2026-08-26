"use client";

import {
  AlertCircleIcon,
  ArchiveIcon,
  BotIcon,
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
  MessageSquareIcon,
  MusicIcon,
  PinIcon,
  PinOffIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  Share2Icon,
  SlidersHorizontalIcon,
  SparklesIcon,
  SquareIcon,
  Trash2Icon,
  TrendingUpIcon,
  VideoIcon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { PageBackButton } from "@/components/chat/page-back-button";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MAI_UPGRADE_URL } from "@/lib/constants";

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

export function getFileCategory(
  mimeType: string,
  filename: string
): "image" | "video" | "audio" | "document" | "code" | "archive" | "other" {
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
    return <ImageIcon className="size-5 text-blue-500" />;
  }
  if (category === "video") {
    return <VideoIcon className="size-5 text-purple-500" />;
  }
  if (category === "audio") {
    return <MusicIcon className="size-5 text-pink-500" />;
  }
  if (category === "code") {
    return <CodeIcon className="size-5 text-emerald-500" />;
  }
  if (category === "archive") {
    return <ArchiveIcon className="size-5 text-amber-500" />;
  }
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
  const router = useRouter();
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [storage, setStorage] = useState<StorageUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const handleAskAIWithFile = useCallback(
    (file: CloudFile) => {
      const prompt = `Voici mon fichier hébergé sur le Stockage Cloud mAI : ${file.original_name} (${file.url}). Analyse son contenu, donne un aperçu clair et réponds à mes questions.`;
      router.push(`/?query=${encodeURIComponent(prompt)}`);
    },
    [router]
  );

  const handleSummarizeFile = useCallback(
    (file: CloudFile) => {
      const prompt = `Fais un résumé structuré, clair et synthétique du document ${file.original_name} (${file.url}) avec les points clés essentiels.`;
      router.push(`/?query=${encodeURIComponent(prompt)}`);
    },
    [router]
  );

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
        localStorage.setItem("mai_pinned_cloud_files", JSON.stringify(updated));
      } catch {}
      toast.success(
        isPinned ? "Fichier désépinglé" : "Fichier épinglé en tête de liste"
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

  // Charger les données du stockage
  const fetchLibraryData = useCallback(async () => {
    try {
      const res = await fetch("/api/library");
      if (!res.ok) {
        throw new Error("Impossible de charger les fichiers");
      }
      const data = await res.json();
      setFiles(data.files || []);
      setStorage(data.storage || null);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la récupération de votre stockage.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLibraryData();
  }, [fetchLibraryData]);

  // Upload d'un fichier individuel
  const uploadSingleFile = async (file: File) => {
    if (!storage) {
      return;
    }

    const remainingBytes = Math.max(
      0,
      storage.bytes_limit - storage.bytes_used
    );
    if (file.size > remainingBytes) {
      toast.error(
        `Espace insuffisant pour "${file.name}" (${formatBytes(file.size)}). Espace restant : ${formatBytes(remainingBytes)}.`
      );
      return;
    }

    setUploadingFiles((prev) => [
      ...prev,
      { name: file.name, progress: 30, size: file.size },
    ]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/library", {
        body: formData,
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.error || `Échec de l'importation de ${file.name}`);
        setUploadingFiles((prev) => prev.filter((f) => f.name !== file.name));
        return;
      }

      toast.success(`Fichier "${file.name}" importé avec succès !`);
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
    if (!selectedFiles || selectedFiles.length === 0) {
      return;
    }
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
    if (!fileToDelete) {
      return;
    }
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
        const newUsed = Math.max(
          0,
          storage.bytes_used - fileToDelete.size_bytes
        );
        const newPercent =
          Math.round((newUsed / storage.bytes_limit) * 10_000) / 100;
        setStorage({
          ...storage,
          bytes_used: newUsed,
          files_count: Math.max(0, storage.files_count - 1),
          over_limit: newUsed >= storage.bytes_limit,
          percent_used: newPercent,
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
    if (selectedIds.length === 0) {
      return;
    }
    setIsBulkDeleting(true);

    let deletedCount = 0;
    let freedBytes = 0;

    for (const id of selectedIds) {
      const targetFile = files.find((f) => f.id === id);
      try {
        const res = await fetch(`/api/library?id=${id}`, { method: "DELETE" });
        if (res.ok) {
          deletedCount++;
          if (targetFile) {
            freedBytes += targetFile.size_bytes;
          }
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
        Math.round((newUsed / storage.bytes_limit) * 10_000) / 100;
      setStorage({
        ...storage,
        bytes_used: newUsed,
        files_count: Math.max(0, storage.files_count - deletedCount),
        over_limit: newUsed >= storage.bytes_limit,
        percent_used: newPercent,
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
    if (!fileToRename || !newName.trim()) {
      return;
    }

    const trimmed = newName.trim();
    if (trimmed === fileToRename.original_name) {
      setFileToRename(null);
      return;
    }

    setIsRenaming(true);
    try {
      const res = await fetch("/api/library", {
        body: JSON.stringify({ id: fileToRename.id, name: trimmed }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
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
      toast.success("Fichier renommé avec succès !");
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
    toast.success("Lien direct copié dans le presse-papier !");
  };

  // Téléchargement groupé
  const handleBulkDownload = () => {
    const selectedFiles = files.filter((f) => selectedIds.includes(f.id));
    selectedFiles.forEach((file) => {
      window.open(file.url, "_blank");
    });
    toast.success(
      `Téléchargement de ${selectedFiles.length} fichier(s) lancé.`
    );
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
      pin
        ? "Fichiers sélectionnés épinglés"
        : "Fichiers sélectionnés désépinglés"
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
      if (!matchesSearch) {
        return false;
      }

      if (selectedCategory === "all") {
        return true;
      }
      if (selectedCategory === "pinned") {
        return pinnedIds.includes(f.id);
      }

      const category = getFileCategory(f.mime_type, f.original_name);
      return category === selectedCategory;
    });

    result.sort((a, b) => {
      const aPinned = pinnedIds.includes(a.id);
      const bPinned = pinnedIds.includes(b.id);
      if (aPinned && !bPinned) {
        return -1;
      }
      if (!aPinned && bPinned) {
        return 1;
      }

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

  // Compteurs et poids par catégorie
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

  const categoryBytes = useMemo(() => {
    const b = {
      archive: 0,
      audio: 0,
      code: 0,
      document: 0,
      image: 0,
      other: 0,
      video: 0,
    };
    files.forEach((f) => {
      const cat = getFileCategory(f.mime_type, f.original_name);
      if (cat in b) {
        b[cat as keyof typeof b] += f.size_bytes;
      } else {
        b.other += f.size_bytes;
      }
    });
    return b;
  }, [files]);

  return (
    <div className="flex flex-1 flex-col h-full overflow-y-auto bg-background p-4 sm:p-6 md:p-10 max-w-6xl mx-auto w-full">
      {/* En-tête Studio Cloud & Quota en haut */}
      <div className="flex flex-col gap-5 pb-6 border-b border-border/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <PageBackButton />
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase mb-1">
                <span className="flex size-2 rounded-full bg-primary animate-pulse" />
                <CloudIcon className="size-4" />
                mAI Cloud Studio
              </div>
              <h1 className="text-2xl truncate md:text-3xl font-bold tracking-tight text-foreground">
                Stockage de fichiers
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Importez, prévisualisez et analysez vos documents, médias et codes avec l'IA.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground text-background px-4 py-2.5 text-sm font-medium transition-all hover:opacity-90 active:scale-95 shadow-sm cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <CloudUploadIcon className="size-4" />
              <span>Importer des fichiers</span>
            </button>

            <Link
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border/60 bg-muted/30 px-3.5 py-2.5 text-xs font-medium text-foreground transition-all hover:bg-muted active:scale-95"
              href={MAI_UPGRADE_URL}
              target="_blank"
            >
              <SparklesIcon className="size-3.5 text-amber-400" />
              <span>Forfaits</span>
              <ExternalLinkIcon className="size-3 text-muted-foreground" />
            </Link>
          </div>

          <input
            className="hidden"
            multiple
            onChange={(e) => handleFilesSelected(e.target.files)}
            ref={fileInputRef}
            type="file"
          />
        </div>

        {/* Barre de progression d'usage en haut de l'interface */}
        {storage && (
          <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-4 sm:p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2.5">
                <span className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <TrendingUpIcon className="size-4 text-primary" />
                  Espace utilisé
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                  Forfait {storage.tier}
                </span>
              </div>
              <div className="text-xs sm:text-sm font-medium text-muted-foreground">
                <strong className="text-foreground">
                  {formatBytes(storage.bytes_used)}
                </strong>{" "}
                sur <strong>{formatBytes(storage.bytes_limit)}</strong> (
                {storage.percent_used || 0}%) •{" "}
                <span className="text-foreground font-medium">
                  {storage.files_count ?? 0}
                </span>{" "}
                {(storage.files_count ?? 0) > 1 ? "fichiers" : "fichier"}
              </div>
            </div>

            {/* Barre de progression globale */}
            <div className="h-3 w-full rounded-full bg-muted/60 overflow-hidden relative">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  storage.percent_used > 90
                    ? "bg-red-500"
                    : storage.percent_used > 75
                      ? "bg-amber-500"
                      : "bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600"
                }`}
                style={{ width: `${Math.min(100, Math.max(1, storage.percent_used))}%` }}
              />
            </div>

            {/* Répartition visuelle par types de fichiers */}
            {files.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-3 pt-2.5 border-t border-border/40 text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground">Répartition :</span>
                {categoryBytes.document > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-red-500" />
                    Docs: {formatBytes(categoryBytes.document)}
                  </span>
                )}
                {categoryBytes.image > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-blue-500" />
                    Images: {formatBytes(categoryBytes.image)}
                  </span>
                )}
                {categoryBytes.code > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    Code: {formatBytes(categoryBytes.code)}
                  </span>
                )}
                {categoryBytes.audio > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-pink-500" />
                    Audio: {formatBytes(categoryBytes.audio)}
                  </span>
                )}
                {categoryBytes.video > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-purple-500" />
                    Vidéos: {formatBytes(categoryBytes.video)}
                  </span>
                )}
                {categoryBytes.archive > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-amber-500" />
                    Archives: {formatBytes(categoryBytes.archive)}
                  </span>
                )}
              </div>
            )}

            {storage.percent_used >= 90 && (
              <div className="mt-3 flex items-center justify-between text-xs text-amber-500 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                <div className="flex items-center gap-2">
                  <AlertCircleIcon className="size-4 shrink-0" />
                  <span>Vous approchez de votre limite de stockage Cloud.</span>
                </div>
                <Link
                  className="font-semibold underline hover:text-amber-400 shrink-0 flex items-center gap-1"
                  href={MAI_UPGRADE_URL}
                  target="_blank"
                >
                  Mettre à niveau
                  <ExternalLinkIcon className="size-3" />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Zone de Drag & Drop */}
      <div
        className={`my-2 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-7 text-center transition-all cursor-pointer ${
          isDragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border/60 bg-muted/20 hover:bg-muted/40 hover:border-border"
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="size-11 rounded-2xl bg-muted/80 flex items-center justify-center text-muted-foreground mb-2.5 ring-1 ring-border/50">
          <CloudUploadIcon className="size-5 text-primary" />
        </div>
        <p className="text-sm font-medium text-foreground">
          Glissez-déposez vos fichiers ici, ou{" "}
          <span className="text-primary underline">
            parcourez votre appareil
          </span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Tous formats supportés : PDF, Documents, Code, Images, Audio, Vidéo,
          Archives...
        </p>
      </div>

      {/* Fichiers en cours d'envoi */}
      {uploadingFiles.length > 0 && (
        <div className="my-4 flex flex-col gap-2">
          {uploadingFiles.map((up) => (
            <div
              className="flex items-center justify-between p-3 rounded-xl border border-primary/30 bg-primary/5 text-xs animate-pulse"
              key={up.name}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Loader2Icon className="size-4 animate-spin text-primary shrink-0" />
                <span className="font-medium truncate text-foreground">
                  {up.name}
                </span>
                <span className="text-muted-foreground">
                  ({formatBytes(up.size)})
                </span>
              </div>
              <span className="text-primary font-medium shrink-0">
                Téléversement...
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Filtres par catégorie */}
      <div className="mt-6 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
            selectedCategory === "all"
              ? "bg-foreground text-background shadow-xs"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
          onClick={() => setSelectedCategory("all")}
        >
          <span>Tous</span>
          <span className="opacity-70 text-[10px]">({categoryCounts.all})</span>
        </button>

        <button
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
            selectedCategory === "pinned"
              ? "bg-foreground text-background shadow-xs"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
          onClick={() => setSelectedCategory("pinned")}
        >
          <PinIcon className="size-3" />
          <span>Épinglés</span>
          <span className="opacity-70 text-[10px]">
            ({categoryCounts.pinned})
          </span>
        </button>

        <button
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
            selectedCategory === "document"
              ? "bg-foreground text-background shadow-xs"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
          onClick={() => setSelectedCategory("document")}
        >
          <FileTextIcon className="size-3 text-red-500" />
          <span>Documents</span>
          <span className="opacity-70 text-[10px]">
            ({categoryCounts.document})
          </span>
        </button>

        <button
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
            selectedCategory === "image"
              ? "bg-foreground text-background shadow-xs"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
          onClick={() => setSelectedCategory("image")}
        >
          <ImageIcon className="size-3 text-blue-500" />
          <span>Images</span>
          <span className="opacity-70 text-[10px]">
            ({categoryCounts.image})
          </span>
        </button>

        <button
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
            selectedCategory === "code"
              ? "bg-foreground text-background shadow-xs"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
          onClick={() => setSelectedCategory("code")}
        >
          <CodeIcon className="size-3 text-emerald-500" />
          <span>Code</span>
          <span className="opacity-70 text-[10px]">
            ({categoryCounts.code})
          </span>
        </button>

        <button
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
            selectedCategory === "archive"
              ? "bg-foreground text-background shadow-xs"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
          onClick={() => setSelectedCategory("archive")}
        >
          <ArchiveIcon className="size-3 text-amber-500" />
          <span>Archives</span>
          <span className="opacity-70 text-[10px]">
            ({categoryCounts.archive})
          </span>
        </button>
      </div>

      {/* Barre d'outils (Recherche, Tri, Vue) */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            className="h-9 pl-9 pr-3 rounded-xl border-border/60 bg-muted/30 text-xs"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom ou format..."
            type="text"
            value={searchQuery}
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Sélecteur de tri */}
          <select
            className="h-9 px-3 rounded-xl border border-border/60 bg-muted/30 text-xs text-foreground font-medium cursor-pointer outline-none hover:bg-muted/50"
            onChange={(e) => setSortBy(e.target.value as any)}
            value={sortBy}
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
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "table"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setViewMode("table")}
              title="Vue Liste"
            >
              <ListIcon className="size-4" />
            </button>
            <button
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setViewMode("grid")}
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
              className="px-2.5 py-1.5 rounded-lg bg-background/15 hover:bg-background/25 transition-colors cursor-pointer flex items-center gap-1"
              onClick={() => handleBulkPin(true)}
              title="Épingler la sélection"
            >
              <PinIcon className="size-3.5" />
              <span className="hidden sm:inline">Épingler</span>
            </button>

            <button
              className="px-2.5 py-1.5 rounded-lg bg-background/15 hover:bg-background/25 transition-colors cursor-pointer flex items-center gap-1"
              onClick={() => handleBulkPin(false)}
              title="Désépingler la sélection"
            >
              <PinOffIcon className="size-3.5" />
              <span className="hidden sm:inline">Désépingler</span>
            </button>

            <button
              className="px-2.5 py-1.5 rounded-lg bg-background/15 hover:bg-background/25 transition-colors cursor-pointer flex items-center gap-1"
              onClick={handleBulkDownload}
              title="Télécharger la sélection"
            >
              <DownloadIcon className="size-3.5" />
              <span className="hidden sm:inline">Télécharger</span>
            </button>

            <button
              className="px-2.5 py-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors cursor-pointer flex items-center gap-1"
              onClick={() => setBulkDeleteDialogOpen(true)}
              title="Supprimer la sélection"
            >
              <Trash2Icon className="size-3.5" />
              <span className="hidden sm:inline">Supprimer</span>
            </button>

            <button
              className="p-1.5 rounded-lg hover:bg-background/20 transition-colors cursor-pointer ml-1"
              onClick={() => setSelectedIds([])}
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
            <span className="text-sm">Chargement de votre stockage...</span>
          </div>
        ) : filteredAndSortedFiles.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-muted-foreground rounded-2xl border border-border/40 bg-card/30 p-8 text-center">
            <div className="size-12 rounded-full bg-muted/60 flex items-center justify-center mb-3">
              <SparklesIcon className="size-6 text-muted-foreground/60" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {searchQuery || selectedCategory !== "all"
                ? "Aucun fichier correspondant aux critères sélectionnés"
                : "Votre stockage est vide"}
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
                        className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                        onClick={toggleSelectAllVisible}
                        title={
                          allVisibleSelected
                            ? "Tout désélectionner"
                            : "Tout sélectionner"
                        }
                        type="button"
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
                        className={`transition-colors group ${
                          isSelected ? "bg-primary/5" : "hover:bg-muted/30"
                        }`}
                        key={file.id}
                      >
                        <td className="py-3 px-3 text-center">
                          <button
                            className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                            onClick={() => toggleSelectFile(file.id)}
                            type="button"
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
                                <span className="absolute -top-1 -right-1 size-3.5 bg-amber-500 rounded-full ring-2 ring-background flex items-center justify-center text-white">
                                  <PinIcon className="size-2 fill-white text-white" />
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
                            {/* Analyser avec l'IA */}
                            <button
                              className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                              onClick={() => handleAskAIWithFile(file)}
                              title="Analyser avec l'IA"
                            >
                              <SparklesIcon className="size-3.5" />
                            </button>

                            {/* Épingler */}
                            <button
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isPinned
                                  ? "text-amber-500 bg-amber-500/10 hover:bg-amber-500/20"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
                              }`}
                              onClick={() => togglePin(file.id)}
                              title={
                                isPinned ? "Désépingler" : "Épingler en tête"
                              }
                            >
                              <PinIcon
                                className={`size-3.5 ${
                                  isPinned ? "fill-amber-500" : ""
                                }`}
                              />
                            </button>

                            {/* Aperçu */}
                            <button
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                              onClick={() => setPreviewFile(file)}
                              title="Aperçu rapide"
                            >
                              <EyeIcon className="size-3.5" />
                            </button>

                            {/* Renommer */}
                            <button
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                              onClick={() => openRenameModal(file)}
                              title="Renommer"
                            >
                              <Edit2Icon className="size-3.5" />
                            </button>

                            {/* Copier le lien */}
                            <button
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                              onClick={() => copyFileLink(file.url)}
                              title="Copier le lien"
                            >
                              <CopyIcon className="size-3.5" />
                            </button>

                            {/* Télécharger */}
                            <a
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                              href={file.url}
                              rel="noopener noreferrer"
                              target="_blank"
                              title="Télécharger"
                            >
                              <DownloadIcon className="size-3.5" />
                            </a>

                            {/* Supprimer */}
                            <button
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                              onClick={() => setFileToDelete(file)}
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
                  className={`relative flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200 bg-card/60 backdrop-blur-md ${
                    isSelected
                      ? "border-primary ring-1 ring-primary shadow-md bg-primary/5"
                      : "border-border/60 hover:border-border hover:shadow-sm"
                  }`}
                  key={file.id}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <button
                        className="p-0.5 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                        onClick={() => toggleSelectFile(file.id)}
                        type="button"
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
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isPinned
                            ? "text-amber-500 bg-amber-500/10 hover:bg-amber-500/20"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                        onClick={() => togglePin(file.id)}
                        title={isPinned ? "Désépingler" : "Épingler"}
                      >
                        <PinIcon
                          className={`size-3.5 ${
                            isPinned ? "fill-amber-500" : ""
                          }`}
                        />
                      </button>

                      <button
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                        onClick={() => openRenameModal(file)}
                        title="Renommer"
                      >
                        <Edit2Icon className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="my-1">
                    <h3
                      className="font-medium text-xs text-foreground truncate cursor-pointer hover:underline"
                      onClick={() => setPreviewFile(file)}
                      title={file.original_name}
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
                        className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                        onClick={() => handleAskAIWithFile(file)}
                        title="Analyser avec l'IA"
                      >
                        <SparklesIcon className="size-3.5" />
                      </button>

                      <button
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                        onClick={() => copyFileLink(file.url)}
                        title="Copier le lien"
                      >
                        <CopyIcon className="size-3.5" />
                      </button>

                      <a
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                        href={file.url}
                        rel="noopener noreferrer"
                        target="_blank"
                        title="Télécharger"
                      >
                        <DownloadIcon className="size-3.5" />
                      </a>

                      <button
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        onClick={() => setFileToDelete(file)}
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
        onOpenChange={(open) => !open && setFileToRename(null)}
        open={Boolean(fileToRename)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Renommer le fichier</DialogTitle>
            <DialogDescription>
              Modifiez le nom d'affichage de votre document Cloud.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4 py-2" onSubmit={handleRenameSubmit}>
            <div className="space-y-2">
              <Input
                autoFocus
                className="rounded-xl text-xs"
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nouveau nom de fichier..."
                value={newName}
              />
            </div>
            <DialogFooter>
              <Button
                disabled={isRenaming}
                onClick={() => setFileToRename(null)}
                type="button"
                variant="outline"
              >
                Annuler
              </Button>
              <Button disabled={isRenaming || !newName.trim()} type="submit">
                {isRenaming ? "Enregistrement..." : "Renommer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modale de Prévisualisation */}
      <Dialog
        onOpenChange={(open) => !open && setPreviewFile(null)}
        open={Boolean(previewFile)}
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
                alt={previewFile.original_name}
                className="max-h-80 w-auto rounded-lg object-contain shadow-sm"
                loading="lazy"
                src={previewFile.url}
              />
            ) : previewFile?.mime_type.startsWith("video/") ? (
              <video className="max-h-80 w-full rounded-lg" controls>
                <source src={previewFile.url} type={previewFile.mime_type} />
                Votre navigateur ne prend pas en charge la lecture de vidéos.
              </video>
            ) : previewFile?.mime_type.startsWith("audio/") ? (
              <audio className="w-full" controls>
                <source src={previewFile.url} type={previewFile.mime_type} />
                Votre navigateur ne prend pas en charge la lecture audio.
              </audio>
            ) : previewFile?.mime_type === "application/pdf" ? (
              <iframe
                className="w-full h-[60vh] rounded-lg border bg-white"
                src={previewFile.url}
                title={previewFile.original_name}
              />
            ) : previewFile?.mime_type.startsWith("text/") ||
              previewFile?.mime_type === "application/json" ||
              previewFile?.original_name.endsWith(".md") ||
              previewFile?.original_name.endsWith(".csv") ||
              previewFile?.original_name.endsWith(".txt") ? (
              <div className="w-full max-h-80 overflow-auto rounded-lg bg-background border p-3 text-xs font-mono whitespace-pre-wrap">
                <a
                  className="text-primary underline text-xs mb-2 inline-block"
                  href={previewFile.url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Ouvrir le fichier texte
                </a>
                <div className="text-muted-foreground">
                  Aperçu texte disponible via ouverture.
                </div>
              </div>
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
                  Aperçu direct non disponible pour ce format. Vous pouvez
                  l'ouvrir ou le télécharger directement.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row justify-between gap-2.5 items-stretch sm:items-center pt-2 border-t border-border/40">
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                className="gap-1.5 text-xs rounded-xl"
                onClick={() => previewFile && handleAskAIWithFile(previewFile)}
                size="sm"
                type="button"
                variant="default"
              >
                <BotIcon className="size-3.5" />
                Discuter avec ce fichier
              </Button>

              <Button
                className="gap-1.5 text-xs rounded-xl"
                onClick={() => previewFile && handleSummarizeFile(previewFile)}
                size="sm"
                type="button"
                variant="secondary"
              >
                <SparklesIcon className="size-3.5 text-amber-400" />
                Résumé IA
              </Button>
            </div>

            <div className="flex items-center gap-2 justify-end">
              <Button
                className="gap-1.5 text-xs rounded-xl"
                onClick={() => previewFile && copyFileLink(previewFile.url)}
                size="sm"
                type="button"
                variant="outline"
              >
                <CopyIcon className="size-3.5" />
                Copier lien
              </Button>

              <a
                className="inline-flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl bg-foreground text-background hover:opacity-90 transition-opacity"
                href={previewFile?.url}
                rel="noopener noreferrer"
                target="_blank"
              >
                <DownloadIcon className="size-3.5" />
                Ouvrir
              </a>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modale de confirmation de suppression individuelle */}
      <AlertDialog
        onOpenChange={(open) => !open && setFileToDelete(null)}
        open={Boolean(fileToDelete)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce fichier ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer définitivement{" "}
              <strong>{fileToDelete?.original_name}</strong> de votre Cloud ?
              Cette action libérera{" "}
              {fileToDelete && formatBytes(fileToDelete.size_bytes)} d'espace de
              stockage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={confirmDelete}
            >
              {isDeleting ? "Suppression..." : "Supprimer définitivement"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modale de confirmation de suppression groupée */}
      <AlertDialog
        onOpenChange={(open) => !open && setBulkDeleteDialogOpen(false)}
        open={bulkDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Supprimer les fichiers sélectionnés ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer définitivement les{" "}
              <strong>{selectedIds.length} fichier(s)</strong> sélectionnés de
              votre Cloud ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isBulkDeleting}
              onClick={confirmBulkDelete}
            >
              {isBulkDeleting
                ? "Suppression en cours..."
                : "Supprimer la sélection"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
