/**
 * ============================================================================
 * VIBE — ALGORITHMES FORMATAGE (src/algorithms/format.ts)
 * Compteurs compacts à la française : 950 → « 950 », 14 200 → « 14,2k »,
 * 2 400 000 → « 2,4M ».
 * ============================================================================
 */

function compact(value: number, suffix: string): string {
  if (value >= 100) return `${Math.round(value)}${suffix}`;
  const fixed = value.toFixed(1).replace('.', ',').replace(',0', '');
  return `${fixed}${suffix}`;
}

export function formatCompactCount(count: number | undefined | null): string {
  const n = Number(count) || 0;
  if (!Number.isFinite(n)) return '0';
  const abs = Math.abs(n);
  if (abs < 1000) return String(Math.round(n));
  if (abs < 1_000_000) return compact(n / 1000, 'k');
  return compact(n / 1_000_000, 'M');
}
