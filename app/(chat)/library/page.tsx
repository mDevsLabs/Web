"use client";

import {
  AlertCircleIcon,
  ArchiveIcon,
  CloudIcon,
  CloudUploadIcon,
  CodeIcon,
  DownloadIcon,
  ExternalLinkIcon,
  FileIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  ImageIcon,
  Loader2Icon,
  MusicIcon,
  SearchIcon,
  SparklesIcon,
  Trash2Icon,
  VideoIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { Input } from "@/components/ui/input";

type CloudFile = {
  id: string;
  filename: string;
  original_name: string;
  url: string;
  size_bytes: number;
  mime_type: string;
  uploaded_at: string;
};

type StorageUsage = {
  tier: string;
  bytes_used: number;
  bytes_limit: number;
  files_count: number;
  percent_used: number;
  over_limit: boolean;
};

function formatBytes(bytes: number, decimals = 2) {
  if (!bytes || bytes === 0) return "0 Octet";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Octets", "Ko", "Mo", "Go", "To"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function formatDate(dateStr: string) {
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

function getFileIcon(mimeType: string, filename: string) {
  if (mimeType.startsWith("image/")) return <ImageIcon className="size-5 text-blue-500" />;
  if (mimeType.startsWith("video/")) return <VideoIcon className="size-5 text-purple-500" />;
  if (mimeType.startsWith("audio/")) return <MusicIcon className="size-5 text-pink-500" />;
  if (mimeType.includes("pdf")) return <FileTextIcon className="size-5 text-red-500" />;
  if (mimeType.includes("zip") || mimeType.includes("tar") || mimeType.includes("rar"))
    return <ArchiveIcon className="size-5 text-amber-500" />;
  if (
    mimeType.includes("javascript") ||
    mimeType.includes("typescript") ||
    mimeType.includes("json") ||
    mimeType.includes("html") ||
    filename.endsWith(".ts") ||
    filename.endsWith(".tsx") ||
    filename.endsWith(".py")
  )
    return <CodeIcon className="size-5 text-emerald-500" />;
  if (mimeType.includes("sheet") || mimeType.includes("excel") || filename.endsWith(".csv"))
    return <FileSpreadsheetIcon className="size-5 text-green-500" />;

  return <FileIcon className="size-5 text-muted-foreground" />;
}

export default function LibraryPage() {
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [storage, setStorage] = useState<StorageUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [uploadingFiles, setUploadingFiles] = useState<
    { name: string; size: number; progress: number; error?: string }[]
  >([]);
  const [isDragging, setIsDragging] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<CloudFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
      // Mettre à jour l'état local
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

  // Suppression d'un fichier
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
      if (storage) {
        const newUsed = Math.max(0, storage.bytes_used - fileToDelete.size_bytes);
        const newPercent = Math.round((newUsed / storage.bytes_limit) * 10000) / 100;
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

  const filteredFiles = files.filter(
    (f) =>
      f.original_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.mime_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            Importez et organisez vos documents, codes, médias et fichiers pour mAI Web.
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
        className={`my-2 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
          isDragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border/60 bg-muted/20 hover:bg-muted/40 hover:border-border"
        }`}
      >
        <div className="size-12 rounded-2xl bg-muted/80 flex items-center justify-center text-muted-foreground mb-3 ring-1 ring-border/50">
          <CloudUploadIcon className="size-6 text-primary" />
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

      {/* Barre de recherche et liste des fichiers */}
      <div className="mt-6 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-foreground">
            Fichiers enregistrés ({filteredFiles.length})
          </h2>

          <div className="relative w-full max-w-xs">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher un fichier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 pr-3 rounded-xl border-border/60 bg-muted/30 text-xs"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <Loader2Icon className="size-6 animate-spin text-primary" />
            <span className="text-sm">Chargement de votre bibliothèque...</span>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-muted-foreground rounded-2xl border border-border/40 bg-card/30 p-8 text-center">
            <div className="size-12 rounded-full bg-muted/60 flex items-center justify-center mb-3">
              <SparklesIcon className="size-6 text-muted-foreground/60" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {searchQuery ? "Aucun fichier correspondant à votre recherche" : "Votre bibliothèque est vide"}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              {searchQuery
                ? "Essayez un autre mot-clé pour retrouver vos fichiers."
                : "Commencez par importer vos premiers documents pour les retrouver à tout moment."}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/40 text-muted-foreground font-medium">
                    <th className="py-3 px-4">Nom du fichier</th>
                    <th className="py-3 px-4">Taille</th>
                    <th className="py-3 px-4 hidden sm:table-cell">Format</th>
                    <th className="py-3 px-4 hidden md:table-cell">Date d'ajout</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredFiles.map((file) => (
                    <tr
                      key={file.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-lg bg-muted/60 ring-1 ring-border/50 shrink-0">
                            {getFileIcon(file.mime_type, file.original_name)}
                          </div>
                          <span
                            className="font-medium text-foreground truncate max-w-[200px] sm:max-w-xs md:max-w-md block"
                            title={file.original_name}
                          >
                            {file.original_name}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-muted-foreground font-mono whitespace-nowrap">
                        {formatBytes(file.size_bytes)}
                      </td>

                      <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-muted text-[11px] font-mono">
                          {file.mime_type.split("/").pop() || "inconnu"}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-muted-foreground hidden md:table-cell whitespace-nowrap">
                        {formatDate(file.uploaded_at)}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                            title="Ouvrir / Télécharger"
                          >
                            <DownloadIcon className="size-4" />
                          </a>

                          <button
                            onClick={() => setFileToDelete(file)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2Icon className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modale de confirmation de suppression */}
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
    </div>
  );
}
