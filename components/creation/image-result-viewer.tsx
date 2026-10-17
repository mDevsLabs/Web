"use client";

import {
  CopyIcon,
  DownloadIcon,
  EyeIcon,
  ImageIcon,
  Loader2Icon,
  Maximize2Icon,
  Wand2Icon,
} from "@mdevs/icons";
import { toast } from "sonner";
import { downloadImage, formatImageSrc } from "@/lib/utils";
import type { GeneratedImage, ImageModel } from "./types";

export function ImageResultViewer({
  isGenerating,
  currentResult,
  selectedModel,
  onPreviewImage,
  onEditAsSource,
}: {
  isGenerating: boolean;
  currentResult: GeneratedImage | null;
  selectedModel?: ImageModel;
  onPreviewImage: (src: string) => void;
  onEditAsSource: (src: string, prompt?: string) => void;
}) {
  return (
    <div className="flex flex-col gap-5 lg:col-span-7">
      <div className="flex flex-col rounded-2xl border border-border/60 bg-card/60 p-4 shadow-sm backdrop-blur-md min-h-[420px] sm:min-h-[560px] sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <ImageIcon className="size-4 text-primary" />
            <span>Résultat de la génération</span>
          </h3>

          {currentResult && (
            <div className="flex items-center gap-1.5">
              <button
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg border border-border/60 hover:bg-muted/40 transition"
                onClick={() =>
                  onPreviewImage(formatImageSrc(currentResult.image_url))
                }
                title="Plein écran"
                type="button"
              >
                <Maximize2Icon className="size-4" />
              </button>
              <button
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg border border-border/60 hover:bg-muted/40 transition"
                onClick={() =>
                  downloadImage(
                    formatImageSrc(currentResult.image_url),
                    `mai-image-${Date.now()}.png`
                  )
                }
                title="Télécharger l'image"
                type="button"
              >
                <DownloadIcon className="size-4" />
              </button>
            </div>
          )}
        </div>

        {/* Zone d'affichage image */}
        <div className="flex-1 flex flex-col items-center justify-center rounded-xl border border-border/40 bg-muted/10 p-4 relative overflow-hidden">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center gap-3 text-center">
              <div className="relative size-16 flex items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Loader2Icon className="size-8 animate-spin" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  Génération par l'IA en cours
                </h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Le modèle{" "}
                  <span className="font-semibold text-primary">
                    {selectedModel?.name}
                  </span>{" "}
                  calcule les pixels de votre chef-d'œuvre...
                </p>
              </div>
            </div>
          ) : currentResult ? (
            <div className="flex flex-col items-center gap-4 w-full">
              <div
                className="group relative cursor-pointer overflow-hidden rounded-xl border border-border/80 shadow-lg transition hover:shadow-2xl max-h-[460px]"
                onClick={() =>
                  onPreviewImage(formatImageSrc(currentResult.image_url))
                }
              >
                <img
                  alt={currentResult.prompt}
                  className="max-h-[460px] w-auto object-contain rounded-xl transition duration-300 group-hover:scale-[1.01]"
                  src={formatImageSrc(currentResult.image_url)}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <span className="flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                    <EyeIcon className="size-4" /> Agrandir
                  </span>
                </div>
              </div>

              {/* Détails et actions rapides */}
              <div className="w-full flex flex-col gap-2 rounded-xl border border-border/60 bg-background/60 p-3 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-foreground font-medium line-clamp-2">
                    "{currentResult.prompt}"
                  </p>
                  <button
                    className="p-1 text-muted-foreground hover:text-foreground shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(currentResult.prompt);
                      toast.success("Prompt copié dans le presse-papier !");
                    }}
                    title="Copier le prompt"
                    type="button"
                  >
                    <CopyIcon className="size-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                  <span>
                    Modèle :{" "}
                    <strong className="text-foreground">
                      {currentResult.model}
                    </strong>{" "}
                    • {currentResult.width}x{currentResult.height}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      className="text-primary hover:underline font-semibold flex items-center gap-1"
                      onClick={() =>
                        onEditAsSource(
                          formatImageSrc(currentResult.image_url),
                          currentResult.prompt
                        )
                      }
                      type="button"
                    >
                      <Wand2Icon className="size-3" /> Éditer cette image
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 text-center text-muted-foreground py-16">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/40 text-muted-foreground/60 border border-border/60">
                <ImageIcon className="size-7" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  Aucune image générée
                </h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Rédigez un prompt à gauche et cliquez sur Générer pour créer
                  votre première illustration.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
