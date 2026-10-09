"use client";

/**
 * Vidéo vitrine pour les couvertures d'articles : lecture automatique en
 * boucle, avec son lorsque le navigateur l'autorise (sinon repli muet) et
 * un petit bouton pour couper / réactiver le son.
 */

import { Volume2Icon as Volume2, VolumeXIcon as VolumeX } from "@mdevs/icons";
import { useEffect, useRef, useState } from "react";

export function NewsVideo({
  src,
  alt,
  className = "w-full h-full object-cover",
  fill = false,
  sound = false,
}: {
  src: string;
  alt: string;
  className?: string;
  /** Étire la vidéo sur son conteneur (position absolute). */
  fill?: boolean;
  /** Tente une lecture avec son ; repli muet automatique si bloquée. */
  sound?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(!sound);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!sound) {
      video.muted = true;
      void video.play().catch(() => {});
      return;
    }

    // Effet vitrine : lecture avec son si le navigateur l'autorise,
    // repli muet automatique sinon (politique d'autoplay des navigateurs).
    video.muted = false;
    video.play().catch(() => {
      video.muted = true;
      setMuted(true);
      void video.play().catch(() => {});
    });
  }, [sound]);

  const toggleMuted = () => {
    const video = videoRef.current;
    if (!video) return;
    const next = !video.muted;
    video.muted = next;
    setMuted(next);
    if (!next) void video.play().catch(() => {});
  };

  const layout = fill ? "absolute inset-0 h-full w-full" : "";

  return (
    <span
      className={`block overflow-hidden ${fill ? "absolute inset-0" : "relative"}`}
    >
      <video
        aria-label={alt}
        autoPlay
        className={`${layout} ${className}`}
        loop
        muted={muted}
        playsInline
        preload="metadata"
        ref={videoRef}
        src={src}
      />
      <button
        aria-label={muted ? "Activer le son" : "Couper le son"}
        className="absolute bottom-3 right-3 z-10 inline-flex items-center justify-center rounded-full bg-black/55 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/75"
        onClick={(e) => {
          // Le média peut être rendu à l'intérieur d'un <Link> de carte : ne pas déclencher la navigation
          e.preventDefault();
          e.stopPropagation();
          toggleMuted();
        }}
        title={muted ? "Activer le son" : "Couper le son"}
        type="button"
      >
        {muted ? (
          <VolumeX className="h-3.5 w-3.5" />
        ) : (
          <Volume2 className="h-3.5 w-3.5" />
        )}
      </button>
    </span>
  );
}
