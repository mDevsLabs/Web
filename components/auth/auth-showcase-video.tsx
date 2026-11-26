"use client";

import { useEffect, useRef } from "react";

// Vidéo d'illustration des pages de connexion et d'inscription.
// Muette (condition d'autoplay des navigateurs), en boucle, sans contrôles.
// `prefers-reduced-motion` : mise en pause pour ne pas imposer d'animation.
export function AuthShowcaseVideo() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      if (reduce.matches) {
        ref.current?.pause();
      } else {
        ref.current?.play().catch(() => {
          // Lecture refusée par le navigateur : la première image reste affichée.
        });
      }
    };
    apply();
    reduce.addEventListener("change", apply);
    return () => reduce.removeEventListener("change", apply);
  }, []);

  return (
    <video
      aria-hidden="true"
      autoPlay
      className="size-full rounded-tl-2xl object-cover"
      loop
      muted
      playsInline
      preload="metadata"
      ref={ref}
    >
      <source src="/preview.mp4" type="video/mp4" />
    </video>
  );
}
