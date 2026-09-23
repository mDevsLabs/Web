// Source unique de vérité côté Next pour l'affichage des limites par forfait.
// Miroir de TIER_LIMITS / TIER_SPEECH_LIMITS / TIER_DAILY_IMAGE_LIMITS /
// STORAGE_LIMITS_BYTES du backend Val Town (config.ts) — toute évolution de
// forfait doit être répercutée des deux côtés.

export const TIER_KEYS = ["free", "plus", "pro", "max"] as const;
export type TierKey = (typeof TIER_KEYS)[number];

export type TierLimits = {
  label: string;
  chatWeeklyTokens: number;
  speechWeeklyTokens: number;
  imagesPerDay: number;
  storageBytes: number;
  memoryEntries: number;
};

const GiB = 1024 * 1024 * 1024;

export const TIER_LIMITS: Record<TierKey, TierLimits> = {
  free: {
    chatWeeklyTokens: 10_000_000,
    imagesPerDay: 5,
    label: "Free",
    memoryEntries: 50,
    speechWeeklyTokens: 30_000_000,
    storageBytes: 10 * GiB,
  },
  max: {
    chatWeeklyTokens: 50_000_000,
    imagesPerDay: 35,
    label: "Max",
    memoryEntries: 150,
    speechWeeklyTokens: 300_000_000,
    storageBytes: 60 * GiB,
  },
  plus: {
    chatWeeklyTokens: 20_000_000,
    imagesPerDay: 10,
    label: "Plus",
    memoryEntries: 75,
    speechWeeklyTokens: 75_000_000,
    storageBytes: 20 * GiB,
  },
  pro: {
    chatWeeklyTokens: 30_000_000,
    imagesPerDay: 20,
    label: "Pro",
    memoryEntries: 100,
    speechWeeklyTokens: 150_000_000,
    storageBytes: 40 * GiB,
  },
};

export function normalizeTierKey(tier?: string | null): TierKey {
  const t = (tier || "free").toLowerCase().trim();
  if (t === "gratuit") {
    return "free";
  }
  return (TIER_KEYS as readonly string[]).includes(t) ? (t as TierKey) : "free";
}

export function getTierLimits(tier?: string | null): TierLimits {
  return TIER_LIMITS[normalizeTierKey(tier)];
}

export function getTierChatWeeklyLimit(tier?: string | null): number {
  return getTierLimits(tier).chatWeeklyTokens;
}

export function getTierSpeechWeeklyLimit(tier?: string | null): number {
  return getTierLimits(tier).speechWeeklyTokens;
}

export function getTierImageDailyLimit(tier?: string | null): number {
  return getTierLimits(tier).imagesPerDay;
}

export function getTierStorageBytes(tier?: string | null): number {
  return getTierLimits(tier).storageBytes;
}

export function getTierMemoryEntries(tier?: string | null): number {
  return getTierLimits(tier).memoryEntries;
}
