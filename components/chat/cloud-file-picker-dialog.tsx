"use client";

import {
  CheckSquareIcon,
  CloudIcon,
  Loader2Icon,
  SearchIcon,
  SparklesIcon,
  SquareIcon,
  UploadIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  type CloudFile,
  formatBytes,
  formatDate,
  getFileIcon,
} from "@/app/(chat)/library/page";
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
import type { Attachment } from "@/lib/types";

type CloudFilePickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectAttachments: (attachments: Attachment[]) => void;
};

export function CloudFilePickerDialog({
  open,
  onOpenChange,
  onSelectAttachments,
}: CloudFilePickerDialogProps) {
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchCloudFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/library");
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Impossible de charger les fichiers de la bibliothèque.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchCloudFiles();
      setSelectedIds([]);
      setSearchQuery("");
    }
  }, [open, fetchCloudFiles]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredFiles = useMemo(
    () =>
      files.filter(
        (f) =>
          f.original_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.mime_type.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [files, searchQuery]
  );

  const handleConfirm = () => {
    const selectedFiles = files.filter((f) => selectedIds.includes(f.id));
    if (selectedFiles.length === 0) {
      return;
    }

    const attachments: Attachment[] = selectedFiles.map((f) => ({
      contentType: f.mime_type || "application/octet-stream",
      name: f.original_name,
      url: f.url,
    }));

    onSelectAttachments(attachments);
    toast.success(
      `${attachments.length} fichier(s) Cloud ajouté(s) comme contexte !`
    );
    onOpenChange(false);
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-6 gap-4">
        <DialogHeader className="gap-1">
          <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
            <CloudIcon className="size-4" />
            Bibliothèque Cloud
          </div>
          <DialogTitle className="text-xl">
            Sélectionner des fichiers pour l'IA
          </DialogTitle>
          <DialogDescription className="text-xs">
            Choisissez un ou plusieurs fichiers de votre Cloud pour les inclure
            dans le contexte du modèle sélectionné.
          </DialogDescription>
        </DialogHeader>

        {/* Barre de recherche */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            className="h-9 pl-9 pr-3 rounded-xl border-border/60 bg-muted/30 text-xs"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un fichier Cloud..."
            type="text"
            value={searchQuery}
          />
        </div>

        {/* Liste des fichiers */}
        <div className="flex-1 min-h-[260px] max-h-[360px] overflow-y-auto rounded-xl border border-border/50 divide-y divide-border/40 bg-muted/10 p-1">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <Loader2Icon className="size-6 animate-spin text-primary" />
              <span className="text-xs">
                Chargement de votre bibliothèque...
              </span>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="py-14 flex flex-col items-center justify-center text-muted-foreground text-center p-6 gap-2">
              <SparklesIcon className="size-6 text-muted-foreground/50 mb-1" />
              <p className="text-xs font-medium text-foreground">
                {searchQuery
                  ? "Aucun résultat trouvé"
                  : "Votre bibliothèque est vide"}
              </p>
              <p className="text-[11px] text-muted-foreground max-w-xs">
                {searchQuery
                  ? "Modifiez votre recherche pour retrouver vos fichiers."
                  : "Importez d'abord des fichiers dans la section Bibliothèque pour les retrouver ici."}
              </p>
            </div>
          ) : (
            filteredFiles.map((file) => {
              const isSelected = selectedIds.includes(file.id);

              return (
                <div
                  className={`flex items-center justify-between p-2.5 rounded-lg transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-primary/10 border-primary/30"
                      : "hover:bg-muted/40"
                  }`}
                  key={file.id}
                  onClick={() => toggleSelect(file.id)}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <button
                      className="text-muted-foreground hover:text-foreground shrink-0"
                      type="button"
                    >
                      {isSelected ? (
                        <CheckSquareIcon className="size-4 text-primary" />
                      ) : (
                        <SquareIcon className="size-4" />
                      )}
                    </button>

                    <div className="p-1.5 rounded-lg bg-muted/60 shrink-0">
                      {getFileIcon(file.mime_type, file.original_name)}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-medium text-foreground truncate block">
                        {file.original_name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatBytes(file.size_bytes)} •{" "}
                        {formatDate(file.uploaded_at)}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted/70 text-muted-foreground shrink-0">
                    {file.original_name.split(".").pop()?.toUpperCase() ||
                      "FICHIER"}
                  </span>
                </div>
              );
            })
          )}
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between items-center pt-2 border-t border-border/40">
          <span className="text-xs text-muted-foreground">
            {selectedIds.length} fichier(s) sélectionné(s)
          </span>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => onOpenChange(false)}
              size="sm"
              type="button"
              variant="outline"
            >
              Annuler
            </Button>
            <Button
              className="gap-1.5"
              disabled={selectedIds.length === 0}
              onClick={handleConfirm}
              size="sm"
              type="button"
            >
              <UploadIcon className="size-3.5" />
              Ajouter au contexte ({selectedIds.length})
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
