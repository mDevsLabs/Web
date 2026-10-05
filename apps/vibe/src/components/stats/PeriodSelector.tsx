/**
 * ============================================================================
 * VIBE — SÉLECTEUR DE PÉRIODE STATS (src/components/stats/PeriodSelector.tsx)
 * Segmented control 7J / 30J / 90J / 12M, style dark zinc, mobile-first.
 * ============================================================================
 */
import type { StatsPeriod } from '../../services/api';

export const STATS_PERIODS: Array<{ value: StatsPeriod; label: string }> = [
  { value: '7d', label: '7J' },
  { value: '30d', label: '30J' },
  { value: '90d', label: '90J' },
  { value: '12m', label: '12M' },
];

interface PeriodSelectorProps {
  period: StatsPeriod;
  onChange: (period: StatsPeriod) => void;
}

export function PeriodSelector({ period, onChange }: PeriodSelectorProps) {
  return (
    <div
      role="tablist"
      aria-label="Période des statistiques"
      data-tour="stats-period"
      className="inline-flex items-center gap-1 p-1 rounded-2xl bg-zinc-950 border border-zinc-800"
    >
      {STATS_PERIODS.map((p) => {
        const active = p.value === period;
        return (
          <button
            key={p.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(p.value)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              active
                ? 'bg-white text-black'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
