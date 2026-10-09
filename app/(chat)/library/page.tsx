"use client";

// Page Bibliothèque (ex-« Stockage de fichiers »).
// Pourquoi cette refonte : l'ancienne page empilait un bandeau quota lourd,
// une zone de dépôt envahissante et huit filtres à puces. La maquette cible
// impose un en-tête unique (tri, vue, recherche, « Nouveau »), cinq onglets
// simples et une grille masonry. Les couleurs restent achromatiques : une
// pastille ne porte une couleur que si elle transporte une information
// (épinglage → `--warning`, erreur → `--destructive`).

import {
  AlertCircleIcon,
  ArchiveIcon,
  ArrowLeftIcon,
  CheckSquareIcon,
  ChevronDownIcon,
  CloudUploadIcon,
  CodeIcon,
  CopyIcon,
  DownloadIcon,
  Edit2Icon,
  EyeIcon,
  FileIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  FolderIcon,
  ImageIcon,
  LayoutGridIcon,
  LibraryIcon,
  ListFilterIcon,
  ListIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  MusicIcon,
  PinIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  SquareIcon,
  Trash2Icon,
  VideoIcon,
  XIcon,
} from "@mdevs/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { BotGlyph } from "@/components/agents/bot-avatar";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DEFAULT_CHAT_MODEL, getModelCapabilities } from "@/lib/ai/models";
import { extractApiErrorMessage } from "@/lib/api/client-error";
import { MAI_PENDING_ATTACHMENT_KEY, MAI_UPGRADE_URL } from "@/lib/constants";
import { fetcher } from "@/lib/utils";

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

type FileCategory =
  | "archive"
  | "audio"
  | "code"
  | "document"
  | "image"
  | "other"
  | "video";

// Libellés français des catégories — dossiers virtuels et messages.
const CATEGORY_LABELS: Record<FileCategory, string> = {
  archive: "Archives",
  audio: "Audio",
  code: "Code",
  document: "Documents",
  image: "Images",
  other: "Autres",
  video: "Vidéos",
};

const CATEGORY_ICONS: Record<FileCategory, typeof FileIcon> = {
  archive: ArchiveIcon,
  audio: MusicIcon,
  code: CodeIcon,
  document: FileTextIcon,
  image: ImageIcon,
  other: FileIcon,
  video: VideoIcon,
};

// Dossiers virtuels proposés dans l'onglet « Dossiers » (hors images, qui a
// son propre onglet). Les dossiers vides sont masqués : un dossier fantôme
// n'aide personne à classer.
const FOLDER_CATEGORIES: FileCategory[] = [
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

type LibraryTab = "dossiers" | "favoris" | "images" | "suggestions" | "tout";
type ExtraCategory = FileCategory | null;
type Period = "all" | "30d" | "7d";
type SortKey =
  | "date-asc"
  | "date-desc"
  | "name-asc"
  | "name-desc"
  | "size-asc"
  | "size-desc";

const SORT_LABELS: Record<SortKey, string> = {
  "date-asc": "Plus anciens d'abord",
  "date-desc": "Plus récents d'abord",
  "name-asc": "Nom (A → Z)",
  "name-desc": "Nom (Z → A)",
  "size-asc": "Taille (croissante)",
  "size-desc": "Taille (décroissante)",
};

const PERIOD_LABELS: Record<Period, string> = {
  "7d": "7 derniers jours",
  "30d": "30 derniers jours",
  all: "Toujours",
};

const EXTRA_CATEGORY_OPTIONS: FileCategory[] = [
  "document",
  "code",
  "audio",
  "video",
  "archive",
];

const TABS: { id: LibraryTab; label: string }[] = [
  { id: "suggestions", label: "Suggestions" },
  { id: "favoris", label: "Favoris" },
  { id: "dossiers", label: "Dossiers" },
  { id: "images", label: "Images" },
  { id: "tout", label: "Tout" },
];

export default function LibraryPage() {
  const router = useRouter();
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [storage, setStorage] = useState<StorageUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Le modèle actuel (cookie chat-model) accepte-t-il les fichiers ?
  const { data: modelsCapData } = useSWR(
    `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/models`,
    fetcher,
    { dedupingInterval: 60_000, revalidateOnFocus: false }
  );
  const currentModelSupportsFiles = useMemo(() => {
    if (typeof document === "undefined") {
      return false;
    }
    const cookieModel = document.cookie
      .split("; ")
      .find((row) => row.startsWith("chat-model="))
      ?.split("=")[1];
    const modelId = cookieModel
      ? decodeURIComponent(cookieModel)
      : DEFAULT_CHAT_MODEL;
    const caps =
      modelsCapData?.capabilities?.[modelId] || getModelCapabilities(modelId);
    return Boolean(caps?.file || caps?.vision || caps?.image);
  }, [modelsCapData]);

  const handleAskAIWithFile = useCallback(
    (file: CloudFile) => {
      if (!currentModelSupportsFiles) {
        toast.error(
          "Le modèle actuel ne prend pas en charge les fichiers. Changez de modèle dans la barre de chat."
        );
        return;
      }
      const prompt = `Voici mon fichier hébergé sur le Cloud mAI : ${file.original_name}. Analyse son contenu, donne un aperçu clair et réponds à mes questions.`;
      try {
        sessionStorage.setItem(
          MAI_PENDING_ATTACHMENT_KEY,
          JSON.stringify({
            mediaType: file.mime_type,
            name: file.original_name,
            prompt,
            url: file.url,
          })
        );
      } catch {}
      router.push("/");
    },
    [router, currentModelSupportsFiles]
  );

  const handleSummarizeFile = useCallback(
    (file: CloudFile) => {
      if (!currentModelSupportsFiles) {
        toast.error(
          "Le modèle actuel ne prend pas en charge les fichiers. Changez de modèle dans la barre de chat."
        );
        return;
      }
      const prompt = `Fais un résumé structuré, clair et synthétique du document ${file.original_name} avec les points clés essentiels.`;
      try {
        sessionStorage.setItem(
          MAI_PENDING_ATTACHMENT_KEY,
          JSON.stringify({
            mediaType: file.mime_type,
            name: file.original_name,
            prompt,
            url: file.url,
          })
        );
      } catch {}
      router.push("/");
    },
    [router, currentModelSupportsFiles]
  );

  // Favoris (ex-épinglés : persistance dans le stockage local)
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
        isPinned
          ? "Retiré des favoris"
          : "Ajouté aux favoris — visible dans l'onglet Favoris"
      );
      return updated;
    });
  }, []);

  // Multi-sélection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Vue Grille / Liste — la maquette met la grille en premier choix.
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Onglets simples + filtres avancés (panneau réglages)
  const [activeTab, setActiveTab] = useState<LibraryTab>("suggestions");
  const [extraCategory, setExtraCategory] = useState<ExtraCategory>(null);
  const [period, setPeriod] = useState<Period>("all");
  const [folderFilter, setFolderFilter] = useState<FileCategory | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>("date-desc");

  // Upload
  const [uploadingFiles, setUploadingFiles] = useState<
    { name: string; size: number; progress: number; error?: string }[]
  >([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

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
      if (!res.ok) {
        throw new Error("Impossible de charger les fichiers");
      }
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
        toast.error(
          extractApiErrorMessage(data) ||
            `Échec de l'importation de ${file.name}`
        );
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
        toast.error(
          extractApiErrorMessage(data) || "Erreur lors de la suppression."
        );
        return;
      }

      toast.success("Fichier supprimé de votre bibliothèque.");
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

    toast.success(`${deletedCount} fichier(s) supprimé(s).`);
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
        ? "Fichiers sélectionnés ajoutés aux favoris"
        : "Fichiers sélectionnés retirés des favoris"
    );
    setSelectedIds([]);
  };

  // Multi-sélection helpers
  const toggleSelectFile = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // ── Filtrage et tri ──────────────────────────────────────────────────────
  // Pipeline : recherche → onglet → filtres avancés (format, période) → tri.
  const filteredAndSortedFiles = useMemo(() => {
    const now = Date.now();
    const periodCutoff =
      period === "7d"
        ? now - 7 * 24 * 60 * 60 * 1000
        : period === "30d"
          ? now - 30 * 24 * 60 * 60 * 1000
          : 0;

    const result = files.filter((f) => {
      const matchesSearch =
        f.original_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.mime_type.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) {
        return false;
      }

      if (
        periodCutoff > 0 &&
        new Date(f.uploaded_at).getTime() < periodCutoff
      ) {
        return false;
      }

      // Dossier virtuel ouvert dans l'onglet Dossiers : ne montrer que lui.
      if (activeTab === "dossiers" && folderFilter) {
        return getFileCategory(f.mime_type, f.original_name) === folderFilter;
      }

      if (extraCategory) {
        return getFileCategory(f.mime_type, f.original_name) === extraCategory;
      }

      switch (activeTab) {
        case "favoris":
          return pinnedIds.includes(f.id);
        case "images":
          return getFileCategory(f.mime_type, f.original_name) === "image";
        case "suggestions": {
          // Suggestions = favoris d'abord, puis récents (7 jours). Le tri
          // remet les favoris devant, donc ici on garde favoris ∪ récents.
          const isPinned = pinnedIds.includes(f.id);
          const isRecent =
            new Date(f.uploaded_at).getTime() >= now - 7 * 24 * 60 * 60 * 1000;
          return isPinned || isRecent;
        }
        default:
          return true;
      }
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
  }, [
    files,
    searchQuery,
    activeTab,
    folderFilter,
    extraCategory,
    period,
    pinnedIds,
    sortBy,
  ]);

  // Dossiers virtuels : comptages et poids par catégorie (recherche incluse,
  // pour rester cohérent avec ce que voit l'utilisateur).
  const folders = useMemo(() => {
    const byCategory = new Map<
      FileCategory,
      { bytes: number; count: number }
    >();
    const search = searchQuery.toLowerCase();
    files
      .filter(
        (f) =>
          f.original_name.toLowerCase().includes(search) ||
          f.mime_type.toLowerCase().includes(search)
      )
      .forEach((f) => {
        const cat = getFileCategory(f.mime_type, f.original_name);
        const entry = byCategory.get(cat) ?? { bytes: 0, count: 0 };
        entry.bytes += f.size_bytes;
        entry.count += 1;
        byCategory.set(cat, entry);
      });
    return byCategory;
  }, [files, searchQuery]);

  const activeFolder = folderFilter
    ? {
        bytes: folders.get(folderFilter)?.bytes ?? 0,
        count: folders.get(folderFilter)?.count ?? 0,
      }
    : null;

  // Dossiers non vides — une bibliothèque d'images pures n'a aucun dossier à
  // montrer (les images ont leur propre onglet).
  const visibleFolders = FOLDER_CATEGORIES.filter(
    (cat) => (folders.get(cat)?.count ?? 0) > 0
  );

  const hasAdvancedFilters = extraCategory !== null || period !== "all";
  const resetAdvancedFilters = () => {
    setExtraCategory(null);
    setPeriod("all");
  };

  // Fichiers en cours d'envoi ?
  const isUploading = uploadingFiles.length > 0;

  return (
    <div
      className={`flex h-full flex-1 flex-col overflow-y-auto bg-background p-4 sm:p-6 md:p-8 ${isDragging ? "bg-muted/30" : ""}`}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        className="hidden"
        multiple
        onChange={(e) => handleFilesSelected(e.target.files)}
        ref={fileInputRef}
        type="file"
      />
      <input
        className="hidden"
        multiple
        onChange={(e) => handleFilesSelected(e.target.files)}
        ref={(el) => {
          // `webkitdirectory` n'est pas un attribut React typé : posé à la main.
          if (el) {
            el.setAttribute("webkitdirectory", "");
            el.setAttribute("directory", "");
          }
          folderInputRef.current = el;
        }}
        type="file"
      />

      {/* En-tête : titre + outils, sur une seule ligne comme la maquette */}
      <header className="flex flex-col gap-4 border-b border-border/50 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <PageBackButton />
            <LibraryIcon className="size-6 shrink-0 text-foreground" />
            <h1 className="truncate text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Bibliothèque
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Tri */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Trier les fichiers"
                  className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  title={`Tri : ${SORT_LABELS[sortBy]}`}
                  type="button"
                >
                  <ListFilterIcon className="size-4.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Trier par</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                  <DropdownMenuItem
                    className={cnSortItem(sortBy === key)}
                    key={key}
                    onClick={() => setSortBy(key)}
                  >
                    {SORT_LABELS[key]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Bascule Grille / Liste — <fieldset> sémantique (groupement
                de boutons) ; le style neutralise la bordure native */}
            <fieldset
              aria-label="Mode d'affichage"
              className="m-0 flex items-center rounded-full border border-border bg-muted/40 p-0.5"
            >
              <button
                aria-label="Vue grille"
                aria-pressed={viewMode === "grid"}
                className={`flex size-8 cursor-pointer items-center justify-center rounded-full transition-colors ${
                  viewMode === "grid"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setViewMode("grid")}
                title="Vue grille"
                type="button"
              >
                <LayoutGridIcon className="size-4" />
              </button>
              <button
                aria-label="Vue liste"
                aria-pressed={viewMode === "list"}
                className={`flex size-8 cursor-pointer items-center justify-center rounded-full transition-colors ${
                  viewMode === "list"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setViewMode("list")}
                title="Vue liste"
                type="button"
              >
                <ListIcon className="size-4" />
              </button>
            </fieldset>

            {/* Recherche */}
            <div className="relative w-full min-w-44 sm:w-64">
              <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-10 rounded-full border-border/60 bg-card pl-10 pr-3 text-sm"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Chercher dans Bibliothèque"
                type="text"
                value={searchQuery}
              />
            </div>

            {/* Nouveau : import fichiers ou dossier entier */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full bg-foreground px-4 text-sm font-medium text-background transition-all hover:opacity-90 active:scale-95"
                  type="button"
                >
                  Nouveau
                  <ChevronDownIcon className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem
                  className="cursor-pointer gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <CloudUploadIcon className="size-4" />
                  Importer des fichiers
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer gap-2"
                  onClick={() => folderInputRef.current?.click()}
                >
                  <FolderIcon className="size-4" />
                  Importer un dossier
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Filtres avancés : format complémentaire + période */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  aria-label="Filtres avancés"
                  className={`relative inline-flex size-9 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-muted hover:text-foreground ${
                    hasAdvancedFilters
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                  title="Filtres avancés"
                  type="button"
                >
                  <SlidersHorizontalIcon className="size-4.5" />
                  {hasAdvancedFilters && (
                    <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary" />
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-foreground">
                      Format complémentaire
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {EXTRA_CATEGORY_OPTIONS.map((cat) => {
                        const Icon = CATEGORY_ICONS[cat];
                        return (
                          <button
                            className="chip"
                            data-active={extraCategory === cat}
                            key={cat}
                            onClick={() =>
                              setExtraCategory(
                                extraCategory === cat ? null : cat
                              )
                            }
                            type="button"
                          >
                            <Icon className="size-3" />
                            {CATEGORY_LABELS[cat]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-foreground">
                      Période
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(Object.keys(PERIOD_LABELS) as Period[]).map((key) => (
                        <button
                          className="chip"
                          data-active={period === key}
                          key={key}
                          onClick={() => setPeriod(key)}
                          type="button"
                        >
                          {PERIOD_LABELS[key]}
                        </button>
                      ))}
                    </div>
                  </div>
                  {hasAdvancedFilters && (
                    <Button
                      onClick={resetAdvancedFilters}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Réinitialiser les filtres
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Quota : une ligne discrète, la barre complète vivait mal */}
        {storage && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {formatBytes(storage.bytes_used)} sur{" "}
              {formatBytes(storage.bytes_limit)} utilisés
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {storage.files_count ?? 0} fichier
              {(storage.files_count ?? 0) > 1 ? "s" : ""}
            </span>
            <span aria-hidden="true">·</span>
            <span>Forfait {storage.tier}</span>
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted sm:w-48">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  storage.percent_used > 90
                    ? "bg-destructive"
                    : storage.percent_used > 75
                      ? "bg-warning"
                      : "bg-foreground/70"
                }`}
                style={{
                  width: `${Math.min(100, Math.max(1, storage.percent_used))}%`,
                }}
              />
            </div>
            {storage.percent_used >= 90 && (
              <span className="flex items-center gap-1 text-warning">
                <AlertCircleIcon className="size-3.5" />
                Presque plein —{" "}
                <Link
                  className="font-semibold underline underline-offset-2 hover:text-foreground"
                  href={MAI_UPGRADE_URL}
                  target="_blank"
                >
                  mettre à niveau
                </Link>
              </span>
            )}
          </div>
        )}

        {/* Onglets simples */}
        <nav
          aria-label="Filtres de la bibliothèque"
          className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar"
        >
          {TABS.map((tab) => (
            <button
              className="chip px-3.5 py-1.5 text-xs"
              data-active={activeTab === tab.id}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
          {isUploading && (
            <span className="ml-2 flex items-center gap-1.5 text-[11px] text-primary">
              <Loader2Icon className="size-3 animate-spin" />
              {uploadingFiles.length} import(s) en cours
            </span>
          )}
        </nav>
      </header>

      {/* Zone d'import compacte : le dépôt fonctionne aussi sur toute la page */}
      <button
        className={`mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed px-4 py-3 text-xs transition-all ${
          isDragging
            ? "border-primary bg-primary/5 text-foreground"
            : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
        }`}
        onClick={() => fileInputRef.current?.click()}
        type="button"
      >
        <CloudUploadIcon className="size-4" />
        <span>
          Glissez-déposez vos fichiers ici, ou parcourez votre appareil — PDF,
          documents, code, images, audio, vidéo, archives.
        </span>
      </button>

      {/* Barre d'actions groupées */}
      {selectedIds.length > 0 && (
        <div className="sticky top-4 z-20 mt-4 flex items-center justify-between rounded-2xl bg-foreground p-3 text-background shadow-xl animate-in fade-in-0 slide-in-from-top-2">
          <div className="flex items-center gap-2 px-2 text-xs font-medium">
            <CheckSquareIcon className="size-4" />
            <span>{selectedIds.length} fichier(s) sélectionné(s)</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <button
              className="flex cursor-pointer items-center gap-1 rounded-lg bg-background/15 px-2.5 py-1.5 transition-colors hover:bg-background/25"
              onClick={() => handleBulkPin(true)}
              title="Ajouter la sélection aux favoris"
              type="button"
            >
              <PinIcon className="size-3.5" />
              <span className="hidden sm:inline">Favoris</span>
            </button>

            <button
              className="flex cursor-pointer items-center gap-1 rounded-lg bg-background/15 px-2.5 py-1.5 transition-colors hover:bg-background/25"
              onClick={() => handleBulkPin(false)}
              title="Retirer la sélection des favoris"
              type="button"
            >
              <XIcon className="size-3.5" />
              <span className="hidden sm:inline">Retirer</span>
            </button>

            <button
              className="flex cursor-pointer items-center gap-1 rounded-lg bg-background/15 px-2.5 py-1.5 transition-colors hover:bg-background/25"
              onClick={handleBulkDownload}
              title="Télécharger la sélection"
              type="button"
            >
              <DownloadIcon className="size-3.5" />
              <span className="hidden sm:inline">Télécharger</span>
            </button>

            <button
              className="flex cursor-pointer items-center gap-1 rounded-lg bg-destructive/80 px-2.5 py-1.5 text-background transition-colors hover:bg-destructive"
              onClick={() => setBulkDeleteDialogOpen(true)}
              title="Supprimer la sélection"
              type="button"
            >
              <Trash2Icon className="size-3.5" />
              <span className="hidden sm:inline">Supprimer</span>
            </button>

            <button
              className="ml-1 cursor-pointer rounded-lg p-1.5 transition-colors hover:bg-background/20"
              onClick={() => setSelectedIds([])}
              title="Désélectionner tout"
              type="button"
            >
              <XIcon className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* Fichiers en cours d'envoi */}
      {isUploading && (
        <div className="mt-4 flex flex-col gap-2">
          {uploadingFiles.map((up) => (
            <div
              className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs"
              key={up.name}
            >
              <div className="flex min-w-0 items-center gap-2.5 truncate">
                <Loader2Icon className="size-4 shrink-0 animate-spin text-primary" />
                <span className="truncate font-medium text-foreground">
                  {up.name}
                </span>
                <span className="text-muted-foreground">
                  ({formatBytes(up.size)})
                </span>
              </div>
              <span className="shrink-0 font-medium text-primary">
                Téléversement…
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Contenu principal ─────────────────────────────────────────────── */}
      <div className="mt-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
            <Loader2Icon className="size-6 animate-spin text-primary" />
            <span className="text-sm">Chargement de votre bibliothèque…</span>
          </div>
        ) : activeTab === "dossiers" && folderFilter ? (
          /* Dossier ouvert : fichiers de ce type virtuel */
          <div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <button
                  className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  onClick={() => setFolderFilter(null)}
                  type="button"
                >
                  <ArrowLeftIcon className="size-3.5" />
                  Tous les dossiers
                </button>
                <h2 className="text-base font-semibold text-foreground">
                  {CATEGORY_LABELS[folderFilter]}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {activeFolder?.count} fichier(s) ·{" "}
                  {formatBytes(activeFolder?.bytes ?? 0)}
                </span>
              </div>
            </div>
            <FilesArea
              currentModelSupportsFiles={currentModelSupportsFiles}
              emptyMessage={
                searchQuery
                  ? "Aucun fichier de ce dossier ne correspond à la recherche."
                  : "Ce dossier est vide pour l'instant."
              }
              files={filteredAndSortedFiles}
              onAskAI={handleAskAIWithFile}
              onCopyLink={copyFileLink}
              onDelete={setFileToDelete}
              onOpenPreview={setPreviewFile}
              onRename={openRenameModal}
              onSelect={toggleSelectFile}
              onTogglePin={togglePin}
              pinnedIds={pinnedIds}
              selectedIds={selectedIds}
              viewMode={viewMode}
            />
          </div>
        ) : activeTab === "dossiers" ? (
          /* Onglet Dossiers : cartes dossier virtuelles par type */
          folders.size === 0 || visibleFolders.length === 0 ? (
            <EmptyState
              hint="Importez vos premiers documents pour voir apparaître des dossiers."
              title="Aucun dossier pour l'instant"
            />
          ) : (
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {visibleFolders.map((cat) => {
                const Icon = CATEGORY_ICONS[cat];
                const entry = folders.get(cat);
                return (
                  <button
                    className="group flex cursor-pointer items-center gap-3.5 rounded-2xl border border-border/60 bg-card/60 p-4 text-left transition-all hover:border-border hover:shadow-sm"
                    key={cat}
                    onClick={() => setFolderFilter(cat)}
                    type="button"
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-border/50 text-foreground">
                      <Icon className="size-5" />
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium text-foreground">
                        {CATEGORY_LABELS[cat]}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {entry?.count} fichier(s) ·{" "}
                        {formatBytes(entry?.bytes ?? 0)}
                      </span>
                    </span>
                    <ChevronDownIcon className="ml-auto size-4 -rotate-90 text-muted-foreground/50 transition-colors group-hover:text-foreground" />
                  </button>
                );
              })}
            </div>
          )
        ) : filteredAndSortedFiles.length === 0 ? (
          <EmptyState
            hint={
              searchQuery || hasAdvancedFilters
                ? "Essayez de modifier votre recherche ou vos filtres pour afficher vos documents."
                : "Importez vos premiers documents et médias pour les organiser et les utiliser dans vos discussions."
            }
            title={
              searchQuery || hasAdvancedFilters
                ? "Aucun fichier correspondant aux critères sélectionnés"
                : activeTab === "favoris"
                  ? "Aucun favori pour l'instant"
                  : activeTab === "suggestions"
                    ? "Aucune suggestion pour l'instant"
                    : "Votre bibliothèque est vide"
            }
          />
        ) : (
          <FilesArea
            currentModelSupportsFiles={currentModelSupportsFiles}
            emptyMessage=""
            files={filteredAndSortedFiles}
            onAskAI={handleAskAIWithFile}
            onCopyLink={copyFileLink}
            onDelete={setFileToDelete}
            onOpenPreview={setPreviewFile}
            onRename={openRenameModal}
            onSelect={toggleSelectFile}
            onTogglePin={togglePin}
            pinnedIds={pinnedIds}
            selectedIds={selectedIds}
            viewMode={viewMode}
          />
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
                placeholder="Nouveau nom de fichier…"
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
                {isRenaming ? "Enregistrement…" : "Renommer"}
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
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="truncate pr-4">
              {previewFile?.original_name}
            </DialogTitle>
            <DialogDescription>
              {previewFile && formatBytes(previewFile.size_bytes)} •{" "}
              {previewFile?.mime_type}
            </DialogDescription>
          </DialogHeader>

          <div className="my-3 flex min-h-48 flex-col items-center justify-center overflow-hidden rounded-xl border border-border/40 bg-muted/30 p-4">
            {previewFile?.mime_type.startsWith("image/") ? (
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
                className="h-[60vh] w-full rounded-lg border bg-white"
                src={previewFile.url}
                title={previewFile.original_name}
              />
            ) : previewFile?.mime_type.startsWith("text/") ||
              previewFile?.mime_type === "application/json" ||
              previewFile?.original_name.endsWith(".md") ||
              previewFile?.original_name.endsWith(".csv") ||
              previewFile?.original_name.endsWith(".txt") ? (
              <div className="max-h-80 w-full overflow-auto whitespace-pre-wrap rounded-lg border bg-background p-3 font-mono text-xs">
                <a
                  className="mb-2 inline-block text-xs text-primary underline"
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
              <div className="flex flex-col items-center gap-3 p-6 text-center">
                <div className="rounded-2xl bg-muted/80 p-4">
                  {previewFile &&
                    getFileIcon(
                      previewFile.mime_type,
                      previewFile.original_name
                    )}
                </div>
                <p className="max-w-xs text-xs text-muted-foreground">
                  Aperçu direct non disponible pour ce format. Vous pouvez
                  l'ouvrir ou le télécharger directement.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col items-stretch justify-between gap-2.5 border-t border-border/40 pt-2 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                className="gap-1.5 rounded-xl text-xs"
                disabled={!currentModelSupportsFiles}
                onClick={() => previewFile && handleAskAIWithFile(previewFile)}
                size="sm"
                type="button"
                variant="default"
              >
                <BotGlyph className="size-3.5" />
                Discuter avec ce fichier
              </Button>

              <Button
                className="gap-1.5 rounded-xl text-xs"
                disabled={!currentModelSupportsFiles}
                onClick={() => previewFile && handleSummarizeFile(previewFile)}
                size="sm"
                type="button"
                variant="secondary"
              >
                <SparklesIcon className="size-3.5" />
                Résumé IA
              </Button>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                className="gap-1.5 rounded-xl text-xs"
                onClick={() => previewFile && copyFileLink(previewFile.url)}
                size="sm"
                type="button"
                variant="outline"
              >
                <CopyIcon className="size-3.5" />
                Copier lien
              </Button>

              <a
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-foreground px-3 py-2 text-xs font-medium text-background transition-opacity hover:opacity-90"
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
              <strong>{fileToDelete?.original_name}</strong> de votre
              bibliothèque ? Cette action libérera{" "}
              {fileToDelete && formatBytes(fileToDelete.size_bytes)} d'espace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={confirmDelete}
            >
              {isDeleting ? "Suppression…" : "Supprimer définitivement"}
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
              votre bibliothèque ? Cette action est irréversible.
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
                ? "Suppression en cours…"
                : "Supprimer la sélection"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** Classe conditionnelle de l'item de tri actif ( coche devant le libellé). */
function cnSortItem(active: boolean) {
  return active ? "bg-muted/60 font-medium text-foreground" : "cursor-pointer";
}

/** État vide réutilisé par les onglets et la recherche. */
function EmptyState({ hint, title }: { hint: string; title: string }) {
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

/**
 * Zone d'affichage des fichiers : grille masonry (colonnes CSS — les cartes
 * gardent leur hauteur propre, comme la maquette) ou liste tableau.
 */
function FilesArea({
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

/**
 * Carte masonry : vignette réelle pour les images, grande icône pour les
 * autres formats. Les actions arrivent au survol (toujours visibles sur
 * tactile) ; le clic ouvre l'aperçu.
 */
function FileCard({
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

/**
 * Vue liste : tableau complet (nom, taille, format, date, actions) conservé
 * de l'ancienne page — c'est la vue dense pour trier et nettoyer.
 */
function FilesTable({
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
