import { formatDisplayDateTime } from "@/lib/site/date-format";

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
