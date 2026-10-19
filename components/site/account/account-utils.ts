import {
  getApiKeyRef,
  isPublicApiKeyRef,
  MAX_PUBLIC_PREFIX_LENGTH,
} from "@/lib/site/api-key-ref";
import { formatDisplayDateTime } from "@/lib/site/date-format";

export interface ApiUsageStat {
  keyRef: string;
  limit: number;
  name: string;
  prefix: string;
  requestCount: number;
}

export interface AudioUsageData {
  plan: string;
  requestsCount: number;
  resetAt: string;
  tokensUsed: number;
  weeklyLimit: number;
}

export function formatTokens(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
  }
  return String(value);
}

export function formatResetDate(iso?: string | null): string {
  if (!iso) return "—";
  return formatDisplayDateTime(
    iso,
    { dateStyle: "medium", timeStyle: "short" },
    iso
  );
}

export function getWeeklyResetDate(): string {
  const now = new Date();
  const day = now.getUTCDay() || 7;
  const nextMonday = new Date(now);
  nextMonday.setUTCDate(now.getUTCDate() + (8 - day));
  nextMonday.setUTCHours(0, 0, 0, 0);
  return formatDisplayDateTime(nextMonday, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function getSafeKeyPrefix(value: unknown, fallback: string): string {
  if (typeof value !== "string" || !value.trim()) return fallback;
  const cleaned = value.trim();

  // Cas courant : on reçoit un secret et on n'en garde que la référence publique.
  const ref = getApiKeyRef(cleaned);
  if (ref) return ref;

  // Déjà une référence publique (sans segment secret) : rien à retirer.
  if (isPublicApiKeyRef(cleaned)) return cleaned;

  // Format hérité non reconnu : on borne à la longueur publique documentée.
  // Le plafond précédent exposait 16 caractères, soit 5 de plus que le préfixe
  // officiel — et la quasi-totalité du secret pour une clé de 19 caractères.
  if (cleaned.length <= MAX_PUBLIC_PREFIX_LENGTH) return cleaned;
  return cleaned.substring(0, MAX_PUBLIC_PREFIX_LENGTH);
}
