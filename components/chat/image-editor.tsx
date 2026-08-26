import cn from "classnames";
import { useState } from "react";
import { downloadImage, formatImageSrc } from "@/lib/utils";
import { DownloadIcon, EyeIcon, LoaderIcon } from "./icons";

type ImageEditorProps = {
  title: string;
  content: string;
  isCurrentVersion: boolean;
  currentVersionIndex: number;
  status: string;
  isInline: boolean;
};

export function ImageEditor({
  title,
  content,
  status,
  isInline,
}: ImageEditorProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const imageSrc = formatImageSrc(content);

  if (status === "streaming" && !content) {
    return (
      <div
        className={cn("flex w-full flex-row items-center justify-center", {
          "h-[200px]": isInline,
          "h-[calc(100dvh-60px)]": !isInline,
        })}
      >
        <div className="flex flex-row items-center gap-4">
          {!isInline && (
            <div className="animate-spin">
              <LoaderIcon />
            </div>
          )}
          <div className="text-sm font-medium text-muted-foreground">
            Génération de l'image en cours...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("group relative flex w-full flex-col items-center justify-center p-4", {
        "h-[200px]": isInline,
        "min-h-[calc(100dvh-60px)]": !isInline,
      })}
    >
      <div className="relative flex max-w-[800px] items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-lg">
        <picture>
          <img
            alt={title || "Image générée"}
            className={cn("h-auto max-h-[80vh] w-full object-contain transition duration-300", {
              "max-h-[180px]": isInline,
            })}
            src={imageSrc}
          />
        </picture>

        {!isInline && imageSrc && (
          <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-xl bg-black/60 p-1.5 opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100">
            <button
              className="rounded-lg p-1.5 text-white/90 transition hover:bg-white/20 hover:text-white"
              onClick={() => setIsFullscreen(true)}
              title="Agrandir"
              type="button"
            >
              <EyeIcon size={16} />
            </button>
            <button
              className="rounded-lg p-1.5 text-white/90 transition hover:bg-white/20 hover:text-white"
              onClick={() => downloadImage(imageSrc, `${title || "mai-image"}.png`)}
              title="Télécharger"
              type="button"
            >
              <DownloadIcon size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Modale Plein Écran */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
          onClick={() => setIsFullscreen(false)}
        >
          <div
            className="relative flex max-h-[90vh] max-w-[90vw] flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              alt={title || "Image agrandie"}
              className="max-h-[85vh] max-w-[85vw] rounded-2xl border border-white/10 object-contain shadow-2xl"
              src={imageSrc}
            />
            <div className="flex items-center gap-3">
              <button
                className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-white/30"
                onClick={() => downloadImage(imageSrc, `${title || "mai-image"}.png`)}
                type="button"
              >
                <DownloadIcon size={16} />
                <span>Télécharger</span>
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-white/20"
                onClick={() => setIsFullscreen(false)}
                type="button"
              >
                <span>Fermer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
