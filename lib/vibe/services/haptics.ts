/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — HAPTIC SERVICE (src/services/haptics.ts)
 * Moteur de retour haptique & vibrations pour mobile (PWA, Web, Capacitor iOS/Android)
 * ============================================================================
 */

export type HapticType =
  | "light"
  | "medium"
  | "heavy"
  | "like"
  | "unlike"
  | "success"
  | "warning"
  | "error"
  | "selection"
  | "pullRefresh";

class HapticService {
  private readonly storageKey = "vibe_haptics_enabled";
  private enabled = true;
  private readonly lastAt: Partial<Record<HapticType, number>> = {};
  private readonly minIntervalMs = 35;

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(this.storageKey);
        this.enabled = saved === null ? true : saved === "true";
      } catch {
        this.enabled = true;
      }
    }
  }

  /**
   * Vérifie si le retour haptique est activé par l'utilisateur.
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Active ou désactive le retour haptique et sauvegarde le choix.
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    try {
      localStorage.setItem(this.storageKey, enabled ? "true" : "false");
      window.dispatchEvent(
        new CustomEvent("vibe:haptics_changed", { detail: { enabled } })
      );
    } catch {}
  }

  /**
   * Vérifie si l'environnement natif Capacitor (iOS/Android) expose le plugin Haptics.
   */
  supportsNative(): boolean {
    if (typeof window === "undefined") return false;
    return Boolean(
      (window as any).Capacitor?.Plugins?.Haptics ||
        (window as any).Capacitor?.isNativePlatform?.()
    );
  }

  /**
   * Vérifie si l'appareil supporte les vibrations (Web API ou Capacitor).
   */
  isSupported(): boolean {
    if (typeof window === "undefined") return false;
    const hasVibrate =
      typeof navigator !== "undefined" && "vibrate" in navigator;
    return this.supportsNative() || hasVibrate;
  }

  /**
   * Déclenche une vibration selon le motif demandé.
   */
  trigger(type: HapticType = "light"): void {
    if (!this.enabled || typeof window === "undefined") return;

    // Anti-doublon : évite les vibrations en rafale sur taps rapprochés
    const now = Date.now();
    if (now - (this.lastAt[type] || 0) < this.minIntervalMs) return;
    this.lastAt[type] = now;

    try {
      // 1. Support natif Capacitor (iOS / Android)
      const capHaptics = (window as any).Capacitor?.Plugins?.Haptics;
      if (capHaptics) {
        switch (type) {
          case "light":
            capHaptics.impact?.({ style: "LIGHT" }).catch(() => {});
            return;
          case "selection":
            capHaptics.selectionChanged?.().catch(() => {});
            return;
          case "medium":
          case "pullRefresh":
            capHaptics.impact?.({ style: "MEDIUM" }).catch(() => {});
            return;
          case "heavy":
            capHaptics.impact?.({ style: "HEAVY" }).catch(() => {});
            return;
          case "like":
            // Double impulsion pour simuler le battement de cœur
            capHaptics
              .impact?.({ style: "MEDIUM" })
              .then(() => {
                setTimeout(() => {
                  capHaptics.impact?.({ style: "HEAVY" }).catch(() => {});
                }, 45);
              })
              .catch(() => {});
            return;
          case "unlike":
            capHaptics.impact?.({ style: "LIGHT" }).catch(() => {});
            return;
          case "success":
            capHaptics.notification?.({ type: "SUCCESS" }).catch(() => {});
            return;
          case "warning":
            capHaptics.notification?.({ type: "WARNING" }).catch(() => {});
            return;
          case "error":
            capHaptics.notification?.({ type: "ERROR" }).catch(() => {});
            return;
        }
      }

      // 2. Web Vibration API (Android Chrome, Firefox, PWA, etc.)
      if (
        typeof navigator !== "undefined" &&
        typeof navigator.vibrate === "function"
      ) {
        switch (type) {
          case "light":
            navigator.vibrate(10);
            break;
          case "selection":
            navigator.vibrate(6);
            break;
          case "medium":
            navigator.vibrate(22);
            break;
          case "heavy":
            navigator.vibrate(45);
            break;
          case "like":
            // Motif « heartbeat » (battement de cœur : poum-poum !)
            navigator.vibrate([18, 40, 26]);
            break;
          case "unlike":
            navigator.vibrate(12);
            break;
          case "pullRefresh":
            navigator.vibrate(20);
            break;
          case "success":
            navigator.vibrate([15, 45, 20, 45, 30]);
            break;
          case "warning":
            navigator.vibrate([28, 45, 28]);
            break;
          case "error":
            navigator.vibrate([40, 60, 40, 60, 40]);
            break;
          default:
            navigator.vibrate(15);
        }
      }
    } catch {
      // Ignoré silencieusement si la politique de l'OS bloque la vibration
    }
  }

  // Raccourcis pratiques
  light(): void {
    this.trigger("light");
  }
  medium(): void {
    this.trigger("medium");
  }
  heavy(): void {
    this.trigger("heavy");
  }
  like(): void {
    this.trigger("like");
  }
  unlike(): void {
    this.trigger("unlike");
  }
  success(): void {
    this.trigger("success");
  }
  warning(): void {
    this.trigger("warning");
  }
  error(): void {
    this.trigger("error");
  }
  selection(): void {
    this.trigger("selection");
  }
  pullRefresh(): void {
    this.trigger("pullRefresh");
  }
}

export const haptics = new HapticService();
