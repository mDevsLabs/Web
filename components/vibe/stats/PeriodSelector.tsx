/**
 * ============================================================================
 * VIBE — SÉLECTEUR DE PÉRIODE STATS (src/components/stats/PeriodSelector.tsx)
 * Segmented control 7J / 30J / 90J / 12M, style dark zinc, mobile-first.
 * ============================================================================
 */
import type { StatsPeriod } from "@/lib/vibe/services/api";

export const STATS_PERIODS: Array<{ value: StatsPeriod; label: string }> = [
  { label: "7J", value: "7d" },
  { label: "30J", value: "30d" },
  { label: "90J", value: "90d" },
  { label: "12M", value: "12m" },
];

interface PeriodSelectorProps {
  onChange: (period: StatsPeriod) => void;
  period: StatsPeriod;
}

export function PeriodSelector({ period, onChange }: PeriodSelectorProps) {
  return (
    <div
      aria-label="Période des statistiques"
      className="inline-flex items-center gap-1 p-1 rounded-2xl bg-zinc-950 border border-zinc-800"
      data-tour="stats-period"
      role="tablist"
    >
      {STATS_PERIODS.map((p) => {
        const active = p.value === period;
        return (
          <button
            aria-selected={active}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              active
                ? "bg-white text-black"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            }`}
            key={p.value}
            onClick={() => onChange(p.value)}
            role="tab"
            type="button"
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
