import {
  CheckSquareIcon,
  DownloadIcon,
  PinIcon,
  Trash2Icon,
  XIcon,
} from "@mdevs/icons";
import React from "react";

export function BulkActionsBar({
  selectedCount,
  onBulkPin,
  onBulkDownload,
  onOpenBulkDelete,
  onClearSelection,
}: {
  selectedCount: number;
  onBulkPin: (pin: boolean) => void;
  onBulkDownload: () => void;
  onOpenBulkDelete: () => void;
  onClearSelection: () => void;
}) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="sticky top-4 z-20 mt-4 flex items-center justify-between rounded-2xl bg-foreground p-3 text-background shadow-xl animate-in fade-in-0 slide-in-from-top-2">
      <div className="flex items-center gap-2 px-2 text-xs font-medium">
        <CheckSquareIcon className="size-4" />
        <span>{selectedCount} fichier(s) sélectionné(s)</span>
      </div>

      <div className="flex items-center gap-1.5 text-xs">
        <button
          className="flex cursor-pointer items-center gap-1 rounded-lg bg-background/15 px-2.5 py-1.5 transition-colors hover:bg-background/25"
          onClick={() => onBulkPin(true)}
          title="Ajouter la sélection aux favoris"
          type="button"
        >
          <PinIcon className="size-3.5" />
          <span className="hidden sm:inline">Favoris</span>
        </button>

        <button
          className="flex cursor-pointer items-center gap-1 rounded-lg bg-background/15 px-2.5 py-1.5 transition-colors hover:bg-background/25"
          onClick={() => onBulkPin(false)}
          title="Retirer la sélection des favoris"
          type="button"
        >
          <XIcon className="size-3.5" />
          <span className="hidden sm:inline">Retirer</span>
        </button>

        <button
          className="flex cursor-pointer items-center gap-1 rounded-lg bg-background/15 px-2.5 py-1.5 transition-colors hover:bg-background/25"
          onClick={onBulkDownload}
          title="Télécharger la sélection"
          type="button"
        >
          <DownloadIcon className="size-3.5" />
          <span className="hidden sm:inline">Télécharger</span>
        </button>

        <button
          className="flex cursor-pointer items-center gap-1 rounded-lg bg-destructive/80 px-2.5 py-1.5 text-background transition-colors hover:bg-destructive"
          onClick={onOpenBulkDelete}
          title="Supprimer la sélection"
          type="button"
        >
          <Trash2Icon className="size-3.5" />
          <span className="hidden sm:inline">Supprimer</span>
        </button>

        <button
          className="ml-1 cursor-pointer rounded-lg p-1.5 transition-colors hover:bg-background/20"
          onClick={onClearSelection}
          title="Désélectionner tout"
          type="button"
        >
          <XIcon className="size-4" />
        </button>
      </div>
    </div>
  );
}
