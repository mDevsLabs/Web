/**
 * ============================================================================
 * VIBE — CARROUSEL MÉDIA (src/components/feed/MediaCarousel.tsx)
 * Défilement horizontal avec scroll-snap pour les posts multi-images :
 * compteur, points indicateurs, flèches desktop et légende du média actif.
 * ============================================================================
 */

import React, { useRef, useState } from 'react';
import { ChevronLeftIcon as ChevronLeft, ChevronRightIcon as ChevronRight } from "@mdevs/icons";
import { haptics } from '../../services/haptics';

export interface CarouselMedia {
  url: string;
  alt_text?: string | null;
}

interface MediaCarouselProps {
  images: CarouselMedia[];
  onOpen: (index: number) => void;
}

export const MediaCarousel: React.FC<MediaCarouselProps> = ({ images, onOpen }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const lastIndexRef = useRef(0);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el || el.clientWidth === 0) return;
    const next = Math.round(el.scrollLeft / el.clientWidth);
    if (next !== lastIndexRef.current) {
      lastIndexRef.current = next;
      setIndex(next);
      haptics.selection();
    }
  };

  const goTo = (i: number) => {
    const el = containerRef.current;
    if (!el) return;
    const clamp = Math.max(0, Math.min(images.length - 1, i));
    el.scrollTo({ left: clamp * el.clientWidth, behavior: 'smooth' });
  };

  const activeCaption = images[index]?.alt_text;

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950">
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none' }}
        >
          {images.map((img, i) => (
            <button
              key={img.url + i}
              type="button"
              onClick={() => {
                haptics.light();
                onOpen(i);
              }}
              className="snap-center shrink-0 w-full cursor-zoom-in"
              aria-label={img.alt_text || `Image ${i + 1}`}
            >
              <img
                src={img.url}
                alt={img.alt_text || `Image ${i + 1}`}
                loading="lazy"
                className="w-full max-h-[32rem] object-cover"
              />
            </button>
          ))}
        </div>

        {/* Compteur */}
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/70 text-white text-[10px] font-bold pointer-events-none">
          {index + 1}/{images.length}
        </div>

        {/* Flèches desktop */}
        {index > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goTo(index - 1);
            }}
            className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white items-center justify-center hover:bg-black/80 transition-colors"
            title="Image précédente"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        {index < images.length - 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goTo(index + 1);
            }}
            className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white items-center justify-center hover:bg-black/80 transition-colors"
            title="Image suivante"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Points indicateurs */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goTo(i);
              }}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${i === index ? 'bg-white' : 'bg-white/40'}`}
              aria-label={`Aller à l'image ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Légende du média actif */}
      {activeCaption && <p className="text-[11px] text-zinc-500 pt-1.5">{activeCaption}</p>}
    </div>
  );
};
