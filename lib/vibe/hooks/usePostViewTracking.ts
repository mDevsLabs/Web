/**
 * ============================================================================
 * VIBE — HOOK COMPTAGE DE VUES (src/hooks/usePostViewTracking.ts)
 * IntersectionObserver léger : compte une « impression » quand le post reste
 * visible ≥ VIEW_DWELL_MS (1 s) à au moins VIEW_VISIBILITY_THRESHOLD (50 %).
 * Dédoublonnage par session navigateur (src/algorithms/viewTracking.ts),
 * appel API fire-and-forget. Un observeur par carte, détaché au démontage.
 * ============================================================================
 */
import { useEffect, useRef, useState } from "react";
import {
  hasCountedView,
  markViewCounted,
  VIEW_DWELL_MS,
  VIEW_VISIBILITY_THRESHOLD,
} from "@/lib/vibe/algorithms";
import { ApiService } from "@/lib/vibe/services/api";

interface UsePostViewTrackingOptions {
  /** Désactive le tracking (ex : post déjà compté, aperçu, hors écran). */
  enabled?: boolean;
  /** Source de trafic (feed|profile|detail|search|dm|trends). Défaut 'feed'. */
  source?: string;
}

interface UsePostViewTrackingResult {
  /** À attacher à l'élément racine de la carte de post. */
  ref: React.RefObject<HTMLElement | null>;
  /** Compteur local affiché (post.views_count + 1 après comptage). */
  viewsCount: number;
}

export function usePostViewTracking(
  postId: string | undefined,
  initialViews: number | undefined,
  options: UsePostViewTrackingOptions = {}
): UsePostViewTrackingResult {
  const { enabled = true, source = "feed" } = options;
  const ref = useRef<HTMLElement | null>(null);
  const [viewsCount, setViewsCount] = useState<number>(
    Number(initialViews) || 0
  );
  const [counted, setCounted] = useState<boolean>(
    Boolean(postId && hasCountedView(postId))
  );

  useEffect(() => {
    const next = Number(initialViews) || 0;
    setViewsCount((prev) => (prev === next ? prev : next));
  }, [postId, initialViews]);

  useEffect(() => {
    const element = ref.current;
    if (!element || !postId || !enabled || counted) return;
    if (typeof IntersectionObserver === "undefined") return;

    let dwellTimer: ReturnType<typeof setTimeout> | null = null;
    let enterTime: number | null = null;
    let totalVisibleMs = 0;
    let sent = false;

    const sendView = (final = false) => {
      if (sent && !final) return;
      if (hasCountedView(postId) && !final) {
        setCounted(true);
        return;
      }
      const duration = Math.round(totalVisibleMs || VIEW_DWELL_MS);
      // Seuil : 1s pour compter, envoi final si >3s (vrai signal temporel)
      if (duration < VIEW_DWELL_MS && !final) return;
      if (!final) {
        markViewCounted(postId);
        setCounted(true);
        setViewsCount((v) => v + 1);
        sent = true;
      }
      // Fire-and-forget : l'échec réseau est ignoré volontairement
      ApiService.viewPost(postId, {
        duration_ms: duration,
        dwell_ms: duration,
        source,
        visible_ratio: VIEW_VISIBILITY_THRESHOLD,
      }).catch(() => {});
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (
            entry.isIntersecting &&
            entry.intersectionRatio >= VIEW_VISIBILITY_THRESHOLD
          ) {
            enterTime = Date.now();
            if (dwellTimer === null && !sent) {
              dwellTimer = setTimeout(() => {
                if (enterTime) totalVisibleMs += Date.now() - enterTime;
                sendView(false);
              }, VIEW_DWELL_MS);
            }
          } else {
            if (enterTime) {
              totalVisibleMs += Date.now() - enterTime;
              enterTime = null;
            }
            if (dwellTimer !== null) {
              // Sorti de l'écran avant la fin du dwell : on annule
              clearTimeout(dwellTimer);
              dwellTimer = null;
            }
            // Envoi final du temps cumulé si significatif (>3s) même après comptage
            if (totalVisibleMs >= 3000) {
              ApiService.viewPost(postId, {
                duration_ms: Math.round(totalVisibleMs),
                dwell_ms: Math.round(totalVisibleMs),
                source,
                visible_ratio: entry.intersectionRatio,
              }).catch(() => {});
              totalVisibleMs = 0;
            }
          }
        }
      },
      { threshold: [VIEW_VISIBILITY_THRESHOLD] }
    );

    observer.observe(element);
    return () => {
      if (enterTime) totalVisibleMs += Date.now() - enterTime;
      // Envoi final à la sortie si temps significatif
      if (totalVisibleMs >= 3000) {
        ApiService.viewPost(postId, {
          duration_ms: Math.round(totalVisibleMs),
          dwell_ms: Math.round(totalVisibleMs),
          source,
          visible_ratio: VIEW_VISIBILITY_THRESHOLD,
        }).catch(() => {});
      }
      observer.disconnect();
      if (dwellTimer !== null) {
        clearTimeout(dwellTimer);
        dwellTimer = null;
      }
    };
  }, [postId, enabled, counted, source]);

  return { ref, viewsCount };
}
