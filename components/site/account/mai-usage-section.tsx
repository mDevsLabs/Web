"use client";

import { GaugeIcon as Gauge } from "@mdevs/icons";

import { formatResetDate } from "./account-utils";
import { QuotaProgress } from "./quota-progress";

interface MaiUsage {
  limit: number;
  resetAt?: string | null;
  tokensUsed: number;
}

export function MaiUsageSection({
  usage,
  tier,
  percent,
  refreshing,
  onRefresh,
}: {
  usage: MaiUsage | null;
  tier?: string;
  percent: number;
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
}) {
  return (
    <section
      className="scroll-mt-28 bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 md:p-8 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] space-y-4"
      id="usage-mai"
    >
      <div>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Gauge className="w-5 h-5 text-purple-600" /> Utilisation de l&apos;IA
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Consommation calculée sur vos invites et réponses générées.
        </p>
      </div>

      {usage ? (
        <QuotaProgress
          limit={usage.limit}
          onRefresh={onRefresh}
          percentOverride={percent}
          refreshing={refreshing}
          resetLabel={`Réinitialisation hebdomadaire : ${formatResetDate(usage.resetAt)}`}
          tier={tier}
          tone="purple"
          used={usage.tokensUsed}
        />
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            Impossible de charger le quota.
          </p>
          <button
            className="text-xs font-bold text-purple-600 hover:text-purple-700 disabled:opacity-50 cursor-pointer"
            disabled={refreshing}
            onClick={onRefresh}
            type="button"
          >
            Réessayer
          </button>
        </div>
      )}
    </section>
  );
}
