"use client";

// Page Bibliothèque (ex-« Stockage de fichiers »).
// Refactorisée et modularisée : logique d'en-tête, tableau, cartes masonry,
// modales de renommage, prévisualisation et suppression extraites dans @/components/library.

import {
  ArrowLeftIcon,
  ChevronDownIcon,
  CloudUploadIcon,
  Loader2Icon,
} from "@mdevs/icons";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import {
  BulkActionsBar,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  type CloudFile,
  DeleteModals,
  EmptyState,
  type ExtraCategory,
  type FileCategory,
  FilesArea,
  FOLDER_CATEGORIES,
  formatBytes,
  formatDate,
  getFileCategory,
  getFileIcon,
  LibraryHeader,
  type LibraryTab,
  type Period,
  PreviewModal,
  RenameModal,
  type SortKey,
  type StorageUsage,
} from "@/components/library";
import { DEFAULT_CHAT_MODEL, getModelCapabilities } from "@/lib/ai/models";
import { extractApiErrorMessage } from "@/lib/api/client-error";
import { MAI_PENDING_ATTACHMENT_KEY } from "@/lib/constants";
import { fetcher } from "@/lib/utils";

// Rétrocompatibilité pour les composants qui importent depuis cette page
export type { CloudFile, StorageUsage };
export { formatBytes, formatDate, getFileCategory, getFileIcon };

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

  // Favoris (persistance dans le stockage local)
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

  // Vue Grille / Liste
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Onglets simples + filtres avancés
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

  // Filtrage et tri
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

  // Dossiers virtuels
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

  const visibleFolders = FOLDER_CATEGORIES.filter(
    (cat) => (folders.get(cat)?.count ?? 0) > 0
  );

  const hasAdvancedFilters = extraCategory !== null || period !== "all";
  const resetAdvancedFilters = () => {
    setExtraCategory(null);
    setPeriod("all");
  };

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
          if (el) {
            el.setAttribute("webkitdirectory", "");
            el.setAttribute("directory", "");
          }
          folderInputRef.current = el;
        }}
        type="file"
      />

      <LibraryHeader
        activeTab={activeTab}
        extraCategory={extraCategory}
        hasAdvancedFilters={hasAdvancedFilters}
        isUploading={isUploading}
        onImportFilesClick={() => fileInputRef.current?.click()}
        onImportFolderClick={() => folderInputRef.current?.click()}
        period={period}
        resetAdvancedFilters={resetAdvancedFilters}
        searchQuery={searchQuery}
        setActiveTab={setActiveTab}
        setExtraCategory={setExtraCategory}
        setPeriod={setPeriod}
        setSearchQuery={setSearchQuery}
        setSortBy={setSortBy}
        setViewMode={setViewMode}
        sortBy={sortBy}
        storage={storage}
        uploadingFilesCount={uploadingFiles.length}
        viewMode={viewMode}
      />

      {/* Zone d'import compacte */}
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
      <BulkActionsBar
        onBulkDownload={handleBulkDownload}
        onBulkPin={handleBulkPin}
        onClearSelection={() => setSelectedIds([])}
        onOpenBulkDelete={() => setBulkDeleteDialogOpen(true)}
        selectedCount={selectedIds.length}
      />

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

      {/* Contenu principal */}
      <div className="mt-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
            <Loader2Icon className="size-6 animate-spin text-primary" />
            <span className="text-sm">Chargement de votre bibliothèque…</span>
          </div>
        ) : activeTab === "dossiers" && folderFilter ? (
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
      <RenameModal
        fileToRename={fileToRename}
        handleRenameSubmit={handleRenameSubmit}
        isRenaming={isRenaming}
        newName={newName}
        setFileToRename={setFileToRename}
        setNewName={setNewName}
      />

      {/* Modale de Prévisualisation */}
      <PreviewModal
        copyFileLink={copyFileLink}
        currentModelSupportsFiles={currentModelSupportsFiles}
        handleAskAIWithFile={handleAskAIWithFile}
        handleSummarizeFile={handleSummarizeFile}
        previewFile={previewFile}
        setPreviewFile={setPreviewFile}
      />

      {/* Modales de Suppression */}
      <DeleteModals
        bulkDeleteDialogOpen={bulkDeleteDialogOpen}
        confirmBulkDelete={confirmBulkDelete}
        confirmDelete={confirmDelete}
        fileToDelete={fileToDelete}
        isBulkDeleting={isBulkDeleting}
        isDeleting={isDeleting}
        selectedIds={selectedIds}
        setBulkDeleteDialogOpen={setBulkDeleteDialogOpen}
        setFileToDelete={setFileToDelete}
      />
    </div>
  );
}
