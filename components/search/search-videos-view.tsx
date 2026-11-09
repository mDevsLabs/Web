"use client";

import {
  CopyIcon,
  ExternalLinkIcon,
  PlayIcon,
  SparklesIcon,
  VideoIcon,
  XIcon,
} from "@mdevs/icons";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { SearchSafeImage } from "@/components/search/search-safe-image";
import type { SearchVideoHit } from "@/lib/search/you-client";

/**
 * Détection et génération de l'embed pour la modale vidéo intégrée
 */
export function getVideoEmbed(video: SearchVideoHit): {
  type: "iframe" | "video" | "external";
  embedUrl: string | null;
  directUrl: string;
} {
  const url = video.page_url || "";

  // 1. YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch?.[1]) {
    return {
      directUrl: url,
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0`,
      type: "iframe",
    };
  }

  // 2. Dailymotion
  const dmMatch = url.match(
    /(?:dailymotion\.com\/video\/|dai\.ly\/)([a-zA-Z0-9]+)/
  );
  if (dmMatch?.[1]) {
    return {
      directUrl: url,
      embedUrl: `https://www.dailymotion.com/embed/video/${dmMatch[1]}?autoplay=1`,
      type: "iframe",
    };
  }

  // 3. Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch?.[1]) {
    return {
      directUrl: url,
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`,
      type: "iframe",
    };
  }

  // 4. Fichier direct (MP4, WebM)
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) {
    return {
      directUrl: url,
      embedUrl: url,
      type: "video",
    };
  }

  return {
    directUrl: url,
    embedUrl: null,
    type: "external",
  };
}

export interface SearchVideosViewProps {
  onCopyLink: (url: string) => void;
  onRequestTargetSummary: (target: {
    snippet?: string;
    source?: string;
    title: string;
    type: "video";
    url: string;
  }) => void;
  orderedVideos: SearchVideoHit[];
  submittedQuery: string;
}

export function SearchVideosView({
  orderedVideos,
  submittedQuery,
  onCopyLink,
  onRequestTargetSummary,
}: SearchVideosViewProps) {
  const [selectedVideo, setSelectedVideo] = useState<SearchVideoHit | null>(
    null
  );

  return (
    <>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.3 }}
      >
        {orderedVideos.length === 0 ? (
          <p className="col-span-full text-center py-12 text-sm text-muted-foreground">
            Aucune vidéo trouvée pour « {submittedQuery} ».
          </p>
        ) : (
          orderedVideos.map((vid, i) => (
            <div
              className="group flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card/60 hover:border-foreground/30 transition-all hover:shadow-md"
              key={`${vid.page_url}-${i}`}
            >
              <button
                className="w-full cursor-pointer text-left"
                onClick={() => setSelectedVideo(vid)}
                type="button"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-muted/40 flex items-center justify-center">
                  <SearchSafeImage
                    alt={vid.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    fallback={
                      <div className="flex size-full items-center justify-center bg-muted/40">
                        <VideoIcon className="size-8 text-muted-foreground/60" />
                      </div>
                    }
                    src={vid.thumbnail}
                  />

                  {/* Bouton lecture central */}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="size-11 rounded-full bg-background/90 text-foreground flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <PlayIcon className="size-5 text-primary ml-0.5 fill-primary" />
                    </div>
                  </div>

                  {/* Tags Plateforme & Vidéo */}
                  <span className="absolute top-2 left-2 text-[10px] font-semibold bg-background/90 text-foreground px-1.5 py-0.5 rounded shadow">
                    Vidéo
                  </span>

                  {vid.platform ? (
                    <span className="absolute bottom-2 right-2 text-[10px] font-semibold bg-background/90 text-foreground px-1.5 py-0.5 rounded shadow">
                      {vid.platform}
                    </span>
                  ) : null}
                </div>

                <div className="p-3 flex flex-col gap-2">
                  <span className="text-xs font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                    {vid.title}
                  </span>

                  <span className="inline-flex items-center gap-1 border-t border-border/30 pt-1 text-[11px] font-medium text-primary">
                    <PlayIcon className="size-3 fill-primary" />
                    <span>Lire la vidéo</span>
                  </span>
                </div>
              </button>
              <div className="flex justify-end px-3 pb-3">
                <button
                  aria-label="Résumer la vidéo"
                  className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary transition-colors hover:bg-primary/20"
                  onClick={() => {
                    onRequestTargetSummary({
                      snippet: vid.title,
                      source: vid.platform || "Vidéo",
                      title: vid.title,
                      type: "video",
                      url: vid.page_url,
                    });
                  }}
                  title="Résumer la vidéo avec mAI"
                  type="button"
                >
                  <SparklesIcon className="size-3" />
                  <span>Résumer</span>
                </button>
              </div>
            </div>
          ))
        )}
      </motion.div>

      <AnimatePresence>
        {selectedVideo ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
            onClick={() => setSelectedVideo(null)}
          >
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              className="relative max-w-4xl w-full max-h-[90vh] rounded-2xl border border-border/80 bg-card shadow-2xl flex flex-col overflow-hidden"
              exit={{ opacity: 0, scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* En-tête Lightbox Vidéo */}
              <div className="flex items-center justify-between p-4 border-b border-border/40 bg-muted/20">
                <div className="flex items-center gap-2 min-w-0 pr-4">
                  <span className="chip text-[10px] py-0.5 px-2 bg-primary/10 text-primary font-medium shrink-0">
                    {selectedVideo.platform || "Vidéo"}
                  </span>
                  <span className="font-semibold text-sm text-foreground truncate">
                    {selectedVideo.title}
                  </span>
                </div>
                <button
                  aria-label="Fermer"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
                  onClick={() => setSelectedVideo(null)}
                  type="button"
                >
                  <XIcon className="size-4" />
                </button>
              </div>

              {/* Lecteur Vidéo Interactif */}
              <div className="relative flex-1 bg-black flex items-center justify-center min-h-[350px] max-h-[65vh] w-full overflow-hidden">
                {(() => {
                  const embed = getVideoEmbed(selectedVideo);

                  if (embed.type === "iframe" && embed.embedUrl) {
                    return (
                      <iframe
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="w-full h-full border-0"
                        src={embed.embedUrl}
                        title={selectedVideo.title}
                      />
                    );
                  }

                  if (embed.type === "video" && embed.embedUrl) {
                    return (
                      <video
                        autoPlay
                        className="w-full h-full object-contain"
                        controls
                        src={embed.embedUrl}
                      >
                        Votre navigateur ne supporte pas la lecture de cette
                        vidéo.
                      </video>
                    );
                  }

                  // Fallback si la plateforme ne supporte pas l'embed direct
                  return (
                    <div className="flex flex-col items-center justify-center p-6 text-center gap-3">
                      <VideoIcon className="size-12 text-muted-foreground/60" />
                      <p className="text-sm text-foreground max-w-md">
                        Cette vidéo ne permet pas l'intégration directe, mais
                        vous pouvez la regarder directement sur le site source.
                      </p>
                      <a
                        className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:opacity-90 transition-all shadow-sm cursor-pointer"
                        href={selectedVideo.page_url}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <span>
                          Regarder sur{" "}
                          {selectedVideo.platform || "le site source"}
                        </span>
                        <ExternalLinkIcon className="size-3.5" />
                      </a>
                    </div>
                  );
                })()}
              </div>

              {/* Pied de Lightbox Vidéo */}
              <div className="p-4 border-t border-border/40 bg-card flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground truncate w-full sm:w-auto">
                  <PlayIcon className="size-4 shrink-0 text-primary" />
                  <span className="truncate max-w-[280px]">
                    {selectedVideo.platform
                      ? `Plateforme : ${selectedVideo.platform}`
                      : selectedVideo.page_url}
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    aria-label="Résumer cette vidéo avec mAI"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary/20 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-all cursor-pointer"
                    onClick={() => {
                      const vid = selectedVideo;
                      setSelectedVideo(null);
                      onRequestTargetSummary({
                        snippet: vid.title,
                        source: vid.platform || "Vidéo",
                        title: vid.title,
                        type: "video",
                        url: vid.page_url,
                      });
                    }}
                    type="button"
                  >
                    <SparklesIcon className="size-3.5" />
                    <span>Résumer la vidéo</span>
                  </button>

                  <button
                    className="chip text-xs inline-flex items-center gap-1.5 py-1.5 px-3 cursor-pointer"
                    onClick={() => onCopyLink(selectedVideo.page_url)}
                    type="button"
                  >
                    <CopyIcon className="size-3.5" />
                    <span>Copier le lien</span>
                  </button>

                  <a
                    className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm cursor-pointer"
                    href={selectedVideo.page_url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <span>Ouvrir la page</span>
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
