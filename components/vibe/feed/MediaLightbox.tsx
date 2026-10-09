/**
 * ============================================================================
 * VIBE — VISIONNEUSE PLEIN ÉCRAN (src/components/feed/MediaLightbox.tsx)
 * Lightbox d'un média de post : navigation clavier/swipe, légende et actions
 * (télécharger, partager, ouvrir dans un onglet, copier le lien).
 * ============================================================================
 */

import { ChevronLeftIcon as ChevronLeft, ChevronRightIcon as ChevronRight, DownloadIcon as Download, ExternalLinkIcon as ExternalLink, Link2Icon as Link2, Share2Icon as Share2, XIcon as X } from "@mdevs/icons";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { haptics } from "@/lib/vibe/services/haptics";
import { downloadMedia, shareMedia } from "@/lib/vibe/services/mediaActions";
import { NotificationService } from "@/lib/vibe/services/notificationService";

export interface LightboxMedia {
  alt_text?: string | null;
  media_type?: string;
  url: string;
}

interface MediaLightboxProps {
  initialIndex: number;
  items: LightboxMedia[];
  onClose: () => void;
}

function isVideoItem(item: LightboxMedia): boolean {
  return (
    String(item.media_type || "").startsWith("video") ||
    /\.(mp4|webm|mov)(\?|#|$)/i.test(item.url)
  );
}

export const MediaLightbox: React.FC<MediaLightboxProps> = ({
  items,
  initialIndex,
  onClose,
}) => {
  const [index, setIndex] = useState(initialIndex);
  const touchStartX = useRef<number | null>(null);

  const current = items[index];

  const goTo = useCallback(
    (i: number) => {
      setIndex((prev) => {
        const next = Math.max(0, Math.min(items.length - 1, i));
        if (next !== prev) haptics.selection();
        return next;
      });
    },
    [items.length]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") goTo(index - 1);
      else if (e.key === "ArrowRight") goTo(index + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, goTo, onClose]);

  if (!current) return null;

  const isVideo = isVideoItem(current);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(current.url);
      haptics.success();
      NotificationService.showInAppToast(
        "Lien copié",
        "Lien du média copié dans le presse-papiers.",
        "info"
      );
    } catch {}
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[80] bg-black/95 flex flex-col"
      onClick={onClose}
      onTouchEnd={(e) => {
        const startX = touchStartX.current;
        touchStartX.current = null;
        if (startX === null) return;
        const dx = (e.changedTouches[0]?.clientX ?? startX) - startX;
        if (Math.abs(dx) > 60) goTo(dx < 0 ? index + 1 : index - 1);
      }}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]?.clientX ?? null;
      }}
    >
      {/* Barre du haut */}
      <div
        className="flex items-center justify-between px-4 py-3 pt-safe shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-xs text-zinc-400 font-mono">
          {index + 1}/{items.length}
        </span>
        <button
          className="p-2 rounded-full text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
          onClick={onClose}
          title="Fermer (Échap)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Média */}
      <div
        className="flex-1 flex items-center justify-center min-h-0 px-2"
        onClick={(e) => e.stopPropagation()}
      >
        {index > 0 && (
          <button
            className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors shrink-0 mr-2"
            onClick={() => goTo(index - 1)}
            title="Précédent (←)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {isVideo ? (
          <video
            autoPlay
            className="max-h-full max-w-full rounded-xl"
            controls
            src={current.url}
          />
        ) : (
          <img
            alt={current.alt_text || `Média ${index + 1}`}
            className="max-h-full max-w-full object-contain rounded-xl"
            src={current.url}
          />
        )}
        {index < items.length - 1 && (
          <button
            className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors shrink-0 ml-2"
            onClick={() => goTo(index + 1)}
            title="Suivant (→)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Légende + actions */}
      <div
        className="px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 space-y-2 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {current.alt_text && (
          <p className="text-xs text-zinc-300 text-center">
            {current.alt_text}
          </p>
        )}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-black text-[11px] font-bold hover:bg-zinc-200 transition-colors"
            onClick={() => downloadMedia(current.url)}
          >
            <Download className="w-3.5 h-3.5" />
            Télécharger
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800 text-white text-[11px] font-bold hover:bg-zinc-700 transition-colors"
            onClick={() => shareMedia(current.url, "Vibe")}
          >
            <Share2 className="w-3.5 h-3.5" />
            Partager
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800 text-white text-[11px] font-bold hover:bg-zinc-700 transition-colors"
            onClick={() =>
              window.open(current.url, "_blank", "noopener,noreferrer")
            }
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Ouvrir
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800 text-white text-[11px] font-bold hover:bg-zinc-700 transition-colors"
            onClick={copyLink}
          >
            <Link2 className="w-3.5 h-3.5" />
            Copier le lien
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
