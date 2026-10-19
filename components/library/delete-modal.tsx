import React from "react";
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
import { type CloudFile, formatBytes } from "./library-types";

export function DeleteModals({
  fileToDelete,
  setFileToDelete,
  isDeleting,
  confirmDelete,
  bulkDeleteDialogOpen,
  setBulkDeleteDialogOpen,
  selectedIds,
  isBulkDeleting,
  confirmBulkDelete,
}: {
  fileToDelete: CloudFile | null;
  setFileToDelete: (file: CloudFile | null) => void;
  isDeleting: boolean;
  confirmDelete: () => void;
  bulkDeleteDialogOpen: boolean;
  setBulkDeleteDialogOpen: (open: boolean) => void;
  selectedIds: string[];
  isBulkDeleting: boolean;
  confirmBulkDelete: () => void;
}) {
  return (
    <>
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
    </>
  );
}
