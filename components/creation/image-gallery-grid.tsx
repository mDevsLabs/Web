"use client";

import {
  DownloadIcon,
  EyeIcon,
  ImageIcon,
  Loader2Icon,
  PencilIcon,
  PinIcon,
  PinOffIcon,
  PlusIcon,
  RefreshCwIcon,
  Trash2Icon,
  Wand2Icon,
} from "@mdevs/icons";
import {
  cn,
  downloadImage,
  formatImageModelName,
  formatImageSrc,
} from "@/lib/utils";
import type { GeneratedImage } from "./types";

export function ImageGalleryGrid({
  history,
  isLoadingHistory,
  onRefresh,
  onSwitchToCreate,
  onPreviewImage,
  onTogglePin,
  onStartRename,
  onEditAsSource,
  onDelete,
}: {
  history: GeneratedImage[];
  isLoadingHistory: boolean;
  onRefresh: () => void;
  onSwitchToCreate: () => void;
  onPreviewImage: (src: string) => void;
  onTogglePin: (id: string, currentPinned: boolean) => void;
  onStartRename: (image: { id: string; title: string }) => void;
  onEditAsSource: (src: string, prompt?: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground">
            Historique de vos créations
          </h2>
          <p className="text-xs text-muted-foreground">
            Retrouvez toutes les images générées avec votre compte mAI
          </p>
        </div>

        <button
          className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/40 transition"
          onClick={onRefresh}
          type="button"
        >
          <RefreshCwIcon className="size-3.5" />
          <span>Actualiser</span>
        </button>
      </div>

      {isLoadingHistory ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <Loader2Icon className="size-8 animate-spin text-primary" />
          <span className="text-xs">Chargement de votre galerie...</span>
        </div>
      ) : history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center border border-dashed border-border/60 rounded-2xl bg-card/40">
          <div className="flex size-12 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground">
            <ImageIcon className="size-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Votre galerie est vide
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Générez des images depuis la page Images pour les retrouver
              sauvegardées ici.
            </p>
          </div>
          <button
            className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
            onClick={onSwitchToCreate}
            type="button"
          >
            <PlusIcon className="size-4" /> Créer une image
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {history.map((item) => (
            <div
              className={cn(
                "group relative flex flex-col rounded-2xl border bg-card/60 overflow-hidden shadow-sm hover:shadow-md transition backdrop-blur-md",
                item.pinned
                  ? "border-warning/50 bg-warning/5 dark:bg-warning/10 shadow-amber-500/5"
                  : "border-border/60"
              )}
              key={item.id}
            >
              {/* Badge épinglé */}
              {item.pinned && (
                <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 rounded-full bg-warning/90 text-white px-2 py-0.5 text-[10px] font-bold shadow-md backdrop-blur-sm">
                  <PinIcon className="size-3 fill-current" />
                  <span>Épinglé</span>
                </div>
              )}

              <div
                className="relative aspect-square cursor-pointer overflow-hidden bg-black/10"
                onClick={() => onPreviewImage(formatImageSrc(item.image_url))}
              >
                <img
                  alt={item.prompt}
                  className="size-full object-cover transition duration-300 group-hover:scale-105"
                  src={formatImageSrc(item.image_url)}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <EyeIcon className="size-6 text-white" />
                </div>
              </div>

              <div className="p-3.5 flex flex-col gap-2 flex-1 justify-between text-xs">
                <div>
                  {item.title && (
                    <p className="text-foreground font-semibold text-xs line-clamp-1">
                      {item.title}
                    </p>
                  )}
                  <p
                    className={cn(
                      "line-clamp-2",
                      item.title
                        ? "text-[11px] text-muted-foreground mt-0.5 font-normal"
                        : "text-foreground font-medium"
                    )}
                    title={item.prompt}
                  >
                    {item.prompt}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
                  <span
                    className="truncate max-w-[100px] font-medium text-foreground/80"
                    title={formatImageModelName(item.model)}
                  >
                    {formatImageModelName(item.model)}
                  </span>
                  <div className="flex items-center gap-0.5">
                    {/* Bouton Épingler */}
                    <button
                      className={cn(
                        "p-1.5 rounded-lg transition",
                        item.pinned
                          ? "text-warning hover:text-warning bg-warning/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                      )}
                      onClick={() => onTogglePin(item.id, Boolean(item.pinned))}
                      title={
                        item.pinned
                          ? "Désépingler de la galerie"
                          : "Épingler en haut de la galerie"
                      }
                      type="button"
                    >
                      {item.pinned ? (
                        <PinOffIcon className="size-3.5" />
                      ) : (
                        <PinIcon className="size-3.5" />
                      )}
                    </button>

                    {/* Bouton Renommer */}
                    <button
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition"
                      onClick={() =>
                        onStartRename({
                          id: item.id,
                          title: item.title || item.prompt,
                        })
                      }
                      title="Renommer l'image"
                      type="button"
                    >
                      <PencilIcon className="size-3.5" />
                    </button>

                    <button
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted/40 transition"
                      onClick={() =>
                        onEditAsSource(
                          formatImageSrc(item.image_url),
                          item.prompt
                        )
                      }
                      title="Utiliser comme source"
                      type="button"
                    >
                      <Wand2Icon className="size-3.5" />
                    </button>
                    <button
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition"
                      onClick={() =>
                        downloadImage(
                          formatImageSrc(item.image_url),
                          `mai-image-${item.id}.png`
                        )
                      }
                      title="Télécharger"
                      type="button"
                    >
                      <DownloadIcon className="size-3.5" />
                    </button>
                    <button
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                      onClick={() => onDelete(item.id)}
                      title="Supprimer"
                      type="button"
                    >
                      <Trash2Icon className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
