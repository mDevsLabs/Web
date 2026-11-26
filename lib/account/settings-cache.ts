import "server-only";

import type { UsageBundle } from "@/lib/account/usage";

// Cache mémoire court de `/api/settings`, indexé par jeton de session.
// Extrait du handler de route afin d'être invalidé lors d'un changement de forfait.
const settingsCache = new Map<
  string,
  { data: UsageBundle; expiresAt: number }
>();

const SETTINGS_CACHE_TTL_MS = 300_000; // 5 minutes de cache
const SETTINGS_CACHE_MAX_ENTRIES = 500;

export function getCachedSettings(token: string): UsageBundle | null {
  const cached = settingsCache.get(token);
  if (!cached) {
    return null;
  }
  if (Date.now() >= cached.expiresAt) {
    settingsCache.delete(token);
    return null;
  }
  return cached.data;
}

export function setCachedSettings(token: string, data: UsageBundle): void {
  if (settingsCache.size >= SETTINGS_CACHE_MAX_ENTRIES) {
    const oldest = settingsCache.keys().next().value as string | undefined;
    if (oldest) {
      settingsCache.delete(oldest);
    }
  }
  settingsCache.set(token, {
    data,
    expiresAt: Date.now() + SETTINGS_CACHE_TTL_MS,
  });
}

export function invalidateSettingsCache(token: string): void {
  settingsCache.delete(token);
}
