"use client";

import {
  CopyIcon,
  ExternalLinkIcon,
  GlobeIcon,
  ImageIcon,
  SparklesIcon,
  XIcon,
} from "@mdevs/icons";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { SearchSafeImage } from "@/components/search/search-safe-image";
import type { SearchImageHit } from "@/lib/search/you-client";

export interface SearchImagesViewProps {
  onCopyLink: (url: string) => void;
  onRequestTargetSummary: (target: {
    snippet?: string;
    source?: string;
    title: string;
    type: "image";
    url: string;
  }) => void;
  orderedImages: SearchImageHit[];
  submittedQuery: string;
}

export function SearchImagesView({
  orderedImages,
  submittedQuery,
  onCopyLink,
  onRequestTargetSummary,
}: SearchImagesViewProps) {
  const [selectedImage, setSelectedImage] = useState<SearchImageHit | null>(
    null
  );

  return (
    <>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.3 }}
      >
        {orderedImages.length === 0 ? (
          <p className="col-span-full text-center py-12 text-sm text-muted-foreground">
            Aucune image trouvée pour « {submittedQuery} ».
          </p>
        ) : (
          orderedImages.map((img, i) => {
            let domain = "";
            try {
              domain = new URL(img.page_url || img.image_url).hostname;
            } catch {}

            return (
              <div
                className="group relative flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card/60 hover:border-foreground/30 transition-all hover:shadow-md cursor-pointer"
                key={`${img.image_url}-${i}`}
                onClick={() => setSelectedImage(img)}
              >
                <div className="relative aspect-video w-full overflow-hidden bg-muted/30 flex items-center justify-center">
                  <SearchSafeImage
                    alt={img.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    fallback={
                      <div className="flex size-full items-center justify-center p-3 text-center flex-col gap-1.5 bg-muted/40">
                        <ImageIcon className="size-6 text-muted-foreground/60" />
                        <span className="text-[10px] text-muted-foreground line-clamp-2">
                          {img.title}
                        </span>
                      </div>
                    }
                    src={img.thumbnail || img.image_url}
                  />

                  {/* Badge tag Image */}
                  <span className="absolute top-2 left-2 text-[10px] font-semibold bg-background/90 text-foreground px-1.5 py-0.5 rounded shadow">
                    Image
                  </span>

                  {/* Bouton rapide Résumé d'image au survol */}
                  <button
                    aria-label="Résumer le sujet de l'image"
                    className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold bg-background/90 text-primary shadow hover:bg-background cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRequestTargetSummary({
                        snippet: img.title,
                        source: domain,
                        title: img.title,
                        type: "image",
                        url: img.page_url || img.image_url,
                      });
                    }}
                    title="Résumer le sujet avec mAI"
                    type="button"
                  >
                    <SparklesIcon className="size-3" />
                    <span>Résumer</span>
                  </button>
                </div>
                <div className="p-2.5 flex flex-col gap-1">
                  <span className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {img.title}
                  </span>
                  {domain ? (
                    <span className="text-[10px] text-muted-foreground truncate">
                      {domain}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </motion.div>

      <AnimatePresence>
        {selectedImage ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              className="relative max-w-4xl w-full max-h-[90vh] rounded-2xl border border-border/80 bg-card shadow-2xl flex flex-col overflow-hidden"
              exit={{ opacity: 0, scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* En-tête Lightbox */}
              <div className="flex items-center justify-between p-4 border-b border-border/40 bg-muted/20">
                <div className="flex items-center gap-2 min-w-0 pr-4">
                  <span className="chip text-[10px] py-0.5 px-2 bg-primary/10 text-primary font-medium shrink-0">
                    Image
                  </span>
                  <span className="font-semibold text-sm text-foreground truncate">
                    {selectedImage.title}
                  </span>
                </div>
                <button
                  aria-label="Fermer"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
                  onClick={() => setSelectedImage(null)}
                  type="button"
                >
                  <XIcon className="size-4" />
                </button>
              </div>

              {/* Image en grand */}
              <div className="relative flex-1 bg-black/10 dark:bg-black/30 flex items-center justify-center p-4 min-h-[300px] max-h-[60vh] overflow-hidden">
                <SearchSafeImage
                  alt={selectedImage.title}
                  className="max-h-full max-w-full object-contain rounded-lg shadow-sm"
                  fallback={
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <ImageIcon className="size-12" />
                      <span className="text-xs">Image non disponible</span>
                    </div>
                  }
                  src={selectedImage.image_url || selectedImage.thumbnail}
                />
              </div>

              {/* Pied de Lightbox : Résumé + Actions */}
              <div className="p-4 border-t border-border/40 bg-card flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground truncate w-full sm:w-auto">
                  <GlobeIcon className="size-4 shrink-0" />
                  <span className="truncate max-w-[280px]">
                    {selectedImage.page_url
                      ? new URL(selectedImage.page_url).hostname
                      : "Source web"}
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    aria-label="Résumer avec mAI"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary/20 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-all cursor-pointer"
                    onClick={() => {
                      const img = selectedImage;
                      setSelectedImage(null);
                      onRequestTargetSummary({
                        snippet: img.title,
                        source: img.page_url
                          ? new URL(img.page_url).hostname
                          : "Image",
                        title: img.title,
                        type: "image",
                        url: img.page_url || img.image_url,
                      });
                    }}
                    type="button"
                  >
                    <SparklesIcon className="size-3.5" />
                    <span>Résumer le sujet</span>
                  </button>

                  <button
                    className="chip text-xs inline-flex items-center gap-1.5 py-1.5 px-3 cursor-pointer"
                    onClick={() =>
                      onCopyLink(
                        selectedImage.page_url || selectedImage.image_url
                      )
                    }
                    type="button"
                  >
                    <CopyIcon className="size-3.5" />
                    <span>Copier le lien</span>
                  </button>

                  <a
                    className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm cursor-pointer"
                    href={selectedImage.page_url || selectedImage.image_url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <span>Visiter le site</span>
                    <ExternalLinkIcon className="size-3.5" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
