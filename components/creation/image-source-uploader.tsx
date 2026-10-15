"use client";

import type React from "react";
import { UploadCloudIcon, XIcon } from "@mdevs/icons";
import { formatImageSrc } from "@/lib/utils";

export function ImageSourceUploader({
  sourceImage,
  sourceImageFile,
  supportsImageToImage,
  fileInputRef,
  onFileSelect,
  onRemoveSource,
}: {
  sourceImage: string | null;
  sourceImageFile: File | null;
  supportsImageToImage: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveSource: () => void;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border/80 bg-muted/10 p-3.5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <UploadCloudIcon className="size-4 text-info" />
          <span>Image de référence / Édition</span>
        </span>
        {supportsImageToImage && (
          <span className="text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded">
            Édition supportée
          </span>
        )}
      </div>

      {sourceImage ? (
        <div className="relative flex items-center gap-3 rounded-lg border border-border/60 bg-background/80 p-2">
          <div className="relative size-16 overflow-hidden rounded-md border border-border">
            <img
              alt="Source"
              className="size-full object-cover"
              src={formatImageSrc(sourceImage)}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">
              {sourceImageFile?.name || "Image importée"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Utilisée comme base pour la modification
            </p>
          </div>
          <button
            className="p-1.5 text-muted-foreground hover:text-destructive rounded-md transition"
            onClick={onRemoveSource}
            title="Retirer l'image"
            type="button"
          >
            <XIcon className="size-4" />
          </button>
        </div>
      ) : (
        <div>
          <input
            accept="image/*"
            className="hidden"
            id="image-upload"
            onChange={onFileSelect}
            ref={fileInputRef}
            type="file"
          />
          <label
            className="flex flex-col items-center justify-center gap-1 py-3 cursor-pointer rounded-lg hover:bg-muted/30 transition text-center"
            htmlFor="image-upload"
          >
            <UploadCloudIcon className="size-5 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground">
              Importer une image source
            </span>
            <span className="text-[10px] text-muted-foreground">
              Optionnel : transformez ou modifiez une image existante
            </span>
          </label>
        </div>
      )}
    </div>
  );
}
