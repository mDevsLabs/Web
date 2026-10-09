/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — MULTI-PLATFORM STORAGE ADAPTER (src/services/storageAdapter.ts)
 * Gestion unifiée du stockage persistant : Web (localStorage) + Mobile (Capacitor)
 * ============================================================================
 */

export class AppStorage {
  private static readonly memoryCache = new Map<string, string>();

  /**
   * Récupère une valeur de manière synchrone depuis le cache mémoire / localStorage.
   */
  static getItem(key: string): string | null {
    if (AppStorage.memoryCache.has(key)) {
      return AppStorage.memoryCache.get(key) || null;
    }

    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const val = window.localStorage.getItem(key);
        if (val !== null) {
          AppStorage.memoryCache.set(key, val);
          return val;
        }
      }
    } catch {
      // Ignorer les erreurs d'accès au localStorage (ex: mode privé strict)
    }

    return null;
  }

  /**
   * Enregistre une valeur dans le cache mémoire et persiste dans le stockage disponible.
   */
  static setItem(key: string, value: string): void {
    AppStorage.memoryCache.set(key, value);

    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // Stockage local plein ou non disponible
    }

    // Persistance asynchrone pour Capacitor si le plugin Preferences ou le bridge natif est injecté
    const cap = typeof window !== "undefined" && (window as any).Capacitor;
    if (cap?.Plugins?.Preferences) {
      cap.Plugins.Preferences.set({ key, value }).catch(() => {});
    }
  }

  /**
   * Supprime une clé du stockage.
   */
  static removeItem(key: string): void {
    AppStorage.memoryCache.delete(key);

    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {}

    const cap = typeof window !== "undefined" && (window as any).Capacitor;
    if (cap?.Plugins?.Preferences) {
      cap.Plugins.Preferences.remove({ key }).catch(() => {});
    }
  }

  /**
   * Récupère et désérialise un objet JSON avec valeur par défaut sécurisée.
   */
  static getJSON<T>(key: string, fallback: T): T {
    const raw = AppStorage.getItem(key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  /**
   * Sérialise et enregistre un objet JSON.
   */
  static setJSON(key: string, value: unknown): void {
    try {
      AppStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("[AppStorage] Erreur sérialisation JSON pour", key, e);
    }
  }
}
