/**
 * Utilitaires de libération du DOM pour neutraliser tout gel résiduel causé par
 * des modales, dropdowns ou focus-traps Radix UI / react-remove-scroll.
 */

export function forceUnlockDOM(): void {
  if (typeof document === "undefined") {
    return;
  }

  try {
    // 1. Libérer les événements de pointeur et le défilement sur body et html
    if (document.body.style.pointerEvents === "none") {
      document.body.style.pointerEvents = "";
    }
    if (document.body.style.overflow === "hidden") {
      document.body.style.overflow = "";
    }
    if (document.documentElement.style.pointerEvents === "none") {
      document.documentElement.style.pointerEvents = "";
    }
    if (document.documentElement.style.overflow === "hidden") {
      document.documentElement.style.overflow = "";
    }
    if (document.body.hasAttribute("data-scroll-locked")) {
      document.body.removeAttribute("data-scroll-locked");
    }

    // 2. Nettoyer les aria-hidden accidentellement laissés sur les conteneurs applicatifs
    const hiddenElements = document.querySelectorAll(
      'body > [aria-hidden="true"], [data-sidebar-wrapper][aria-hidden="true"], .md-root[aria-hidden="true"]'
    );
    for (const el of hiddenElements) {
      if (el.tagName !== "SVG" && !el.closest("svg")) {
        el.removeAttribute("aria-hidden");
      }
    }
  } catch {
    // Ne jamais laisser une exception DOM bloquer le runtime
  }
}

/**
 * Planifie plusieurs passes de déverrouillage pour couvrir toute durée d'animation
 * CSS de sortie des composants modaux (immédiat, 50ms, 150ms, 350ms).
 */
export function forceUnlockDOMSchedule(): void {
  forceUnlockDOM();
  if (typeof window === "undefined") {
    return;
  }
  setTimeout(forceUnlockDOM, 50);
  setTimeout(forceUnlockDOM, 150);
  setTimeout(forceUnlockDOM, 350);
}
