import { CopyIcon, DownloadIcon, SparklesIcon } from "@mdevs/icons";
import React from "react";
import { BotGlyph } from "@/components/agents/bot-avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type CloudFile, formatBytes, getFileIcon } from "./library-types";

export function PreviewModal({
  previewFile,
  setPreviewFile,
  currentModelSupportsFiles,
  handleAskAIWithFile,
  handleSummarizeFile,
  copyFileLink,
}: {
  previewFile: CloudFile | null;
  setPreviewFile: (file: CloudFile | null) => void;
  currentModelSupportsFiles: boolean;
  handleAskAIWithFile: (file: CloudFile) => void;
  handleSummarizeFile: (file: CloudFile) => void;
  copyFileLink: (url: string) => void;
}) {
  return (
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
                  getFileIcon(previewFile.mime_type, previewFile.original_name)}
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
  );
}
