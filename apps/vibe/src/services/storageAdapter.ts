/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — MULTI-PLATFORM STORAGE ADAPTER (src/services/storageAdapter.ts)
 * Gestion unifiée du stockage persistant : Web (localStorage) + Mobile (Capacitor)
 * ============================================================================
 */

export class AppStorage {
  private static memoryCache = new Map<string, string>();

  /**
   * Récupère une valeur de manière synchrone depuis le cache mémoire / localStorage.
   */
  public static getItem(key: string): string | null {
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key) || null;
    }

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const val = window.localStorage.getItem(key);
        if (val !== null) {
          this.memoryCache.set(key, val);
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
  public static setItem(key: string, value: string): void {
    this.memoryCache.set(key, value);

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // Stockage local plein ou non disponible
    }

    // Persistance asynchrone pour Capacitor si le plugin Preferences ou le bridge natif est injecté
    const cap = (typeof window !== 'undefined' && (window as any).Capacitor);
    if (cap && cap.Plugins && cap.Plugins.Preferences) {
      cap.Plugins.Preferences.set({ key, value }).catch(() => {});
    }
  }

  /**
   * Supprime une clé du stockage.
   */
  public static removeItem(key: string): void {
    this.memoryCache.delete(key);

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {}

    const cap = (typeof window !== 'undefined' && (window as any).Capacitor);
    if (cap && cap.Plugins && cap.Plugins.Preferences) {
      cap.Plugins.Preferences.remove({ key }).catch(() => {});
    }
  }

  /**
   * Récupère et désérialise un objet JSON avec valeur par défaut sécurisée.
   */
  public static getJSON<T>(key: string, fallback: T): T {
    const raw = this.getItem(key);
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
  public static setJSON(key: string, value: unknown): void {
    try {
      this.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('[AppStorage] Erreur sérialisation JSON pour', key, e);
    }
  }
}
