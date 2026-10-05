/**
 * VIBE — Préférences d'animations (src/services/animationPrefs.ts)
 * Combine : toggle utilisateur + prefers-reduced-motion.
 * Pilote l'attribut `data-animations` sur <html> pour couper le CSS,
 * et expose un event `vibe:animations_changed`.
 */

const STORAGE_KEY = "vibe_animations_enabled";

function getSystemReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function")
    return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export function getAnimationsEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) return saved === "true";
  } catch {}
  // Par défaut : suit l'OS
  return !getSystemReducedMotion();
}

export function setAnimationsEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "true" : "false");
  } catch {}
  applyAnimationsAttribute();
  try {
    window.dispatchEvent(
      new CustomEvent("vibe:animations_changed", { detail: { enabled } })
    );
  } catch {}
}

/**
 * Pose `data-animations` sur la RACINE VIBE, pas sur `<html>`.
 *
 * Le CSS de Vibe est re-ancré sous `.vibe-root` (scripts/build-vibe-css.mjs) :
 * la règle qui coupe les animations vise `.vibe-root[data-animations="off"] *`.
 * Écrire l'attribut sur `documentElement` — comme le faisait la version Vite —
 * ne la déclencherait donc jamais, et l'utilisateur qui désactive les
 * animations continuerait de les voir.
 *
 * Avant le montage de React, la racine n'existe pas encore : l'attribut est
 * alors posé sur `documentElement`, simple repli (aucun style Vibe n'est monté
 * à cet instant, et VibeApp réapplique la valeur au montage).
 */
export function applyAnimationsAttribute(): void {
  if (typeof document === "undefined") return;
  try {
    const enabled = getAnimationsEnabled();
    // Si l'OS demande reduced-motion, on force OFF même si le toggle est ON
    const forcedOff = getSystemReducedMotion();
    const effective = enabled && !forcedOff;
    const racine = document.querySelector(".vibe-root");
    if (!racine) {
      document.documentElement.setAttribute(
        "data-animations",
        effective ? "on" : "off"
      );
      return;
    }
    racine.setAttribute("data-animations", effective ? "on" : "off");
    // Le repli posé avant le montage n'a plus de lecteur : on le retire.
    document.documentElement.removeAttribute("data-animations");
  } catch {}
}

export function isReducedMotion(): boolean {
  return !getAnimationsEnabled() || getSystemReducedMotion();
}

// Applique au boot (importé une fois dans App.tsx)
if (typeof window !== "undefined") {
  try {
    applyAnimationsAttribute();
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    mq?.addEventListener?.("change", () => applyAnimationsAttribute());
  } catch {}
}
