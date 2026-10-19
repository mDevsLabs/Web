"use client";

import {
  CheckIcon,
  DownloadIcon,
  Loader2Icon,
  PencilIcon,
  Wand2Icon,
  XIcon,
} from "@mdevs/icons";
import { downloadImage, formatImageSrc } from "@/lib/utils";

export function ImagePreviewModal({
  previewImage,
  onClose,
  onEditAsSource,
}: {
  previewImage: string | null;
  onClose: () => void;
  onEditAsSource: (imgUrl: string) => void;
}) {
  if (!previewImage) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] max-w-[90vw] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white rounded-full transition"
          onClick={onClose}
          type="button"
        >
          <XIcon className="size-6" />
        </button>

        <img
          alt="Prévisualisation plein écran"
          className="max-h-[85vh] max-w-[85vw] object-contain rounded-2xl shadow-2xl border border-white/10"
          src={formatImageSrc(previewImage)}
        />

        <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
          <button
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white px-4 py-2 text-xs font-semibold backdrop-blur-md transition"
            onClick={() =>
              downloadImage(
                formatImageSrc(previewImage),
                `mai-image-${Date.now()}.png`
              )
            }
            type="button"
          >
            <DownloadIcon className="size-4" /> Télécharger l'original
          </button>
          <button
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-white px-4 py-2 text-xs font-semibold transition"
            onClick={() => {
              onEditAsSource(formatImageSrc(previewImage));
              onClose();
            }}
            type="button"
          >
            <Wand2Icon className="size-4" /> Éditer dans Images
          </button>
        </div>
      </div>
    </div>
  );
}

export function ImageRenameModal({
  editingImage,
  editTitleInput,
  isSavingRename,
  onClose,
  onTitleChange,
  onSave,
}: {
  editingImage: { id: string; title: string } | null;
  editTitleInput: string;
  isSavingRename: boolean;
  onClose: () => void;
  onTitleChange: (val: string) => void;
  onSave: () => void;
}) {
  if (!editingImage) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border/80 bg-card p-5 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <PencilIcon className="size-4" />
            </div>
            <h3 className="text-sm font-bold text-foreground">
              Renommer l'image
            </h3>
          </div>
          <button
            className="p-1 text-muted-foreground hover:text-foreground rounded-lg"
            onClick={onClose}
            type="button"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Titre personnalisé
          </label>
          <input
            autoFocus
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            onChange={(e) => onTitleChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onSave();
              } else if (e.key === "Escape") {
                onClose();
              }
            }}
            placeholder="Ex: Concept futuriste cyber..."
            value={editTitleInput}
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            className="rounded-xl px-3.5 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/40 transition"
            onClick={onClose}
            type="button"
          >
            Annuler
          </button>
          <button
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50"
            disabled={isSavingRename}
            onClick={onSave}
            type="button"
          >
            {isSavingRename ? (
              <Loader2Icon className="size-3.5 animate-spin" />
            ) : (
              <CheckIcon className="size-3.5" />
            )}
            <span>Enregistrer</span>
          </button>
        </div>
      </div>
    </div>
  );
}
