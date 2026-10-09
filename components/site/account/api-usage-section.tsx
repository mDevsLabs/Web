"use client";

import { KeyRoundIcon as KeyRound, RefreshCwIcon as RefreshCw } from "@mdevs/icons";
import Link from "@/components/site/router";

import { getTierQuotaLimit } from "@/lib/site/tiers";
import { type ApiUsageStat, getWeeklyResetDate } from "./account-utils";
import { QuotaProgress } from "./quota-progress";

export function ApiUsageSection({
  stats,
  tier,
  apiBoost,
  refreshing,
  onRefresh,
}: {
  stats: ApiUsageStat[];
  tier?: string;
  apiBoost: number;
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
}) {
  if (stats.length === 0) {
    return (
      <section
        className="scroll-mt-28 bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 md:p-8 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]"
        id="usage-api"
      >
        <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <KeyRound className="w-5 h-5 text-purple-600" /> Usage API
        </div>
        <div className="text-center py-6">
          <p className="text-sm text-slate-500">
            Aucune clé API active pour le moment.
          </p>
          <Link
            className="mt-4 inline-flex px-4 py-2 text-sm text-purple-600 font-medium bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            href="/account/keys"
          >
            Gérer mes clés API
          </Link>
        </div>
      </section>
    );
  }

  const totalRequests = stats.reduce(
    (total, item) => total + item.requestCount,
    0
  );
  const limit = getTierQuotaLimit(tier) + apiBoost;

  return (
    <section
      className="scroll-mt-28 bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 md:p-8 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] space-y-4"
      id="usage-api"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <KeyRound className="w-5 h-5 text-purple-600" /> Usage API
        </div>
        <button
          aria-label="Actualiser l'usage API"
          className="p-2 rounded-xl border border-slate-200 hover:bg-white/80 text-slate-600 transition-colors disabled:opacity-50 cursor-pointer"
          disabled={refreshing}
          onClick={onRefresh}
          title="Actualiser"
          type="button"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>
      <div className="space-y-2 pt-2">
        <div className="flex items-end justify-between gap-3 text-sm">
          <p className="text-slate-600">
            <span className="font-bold text-slate-900">
              {totalRequests.toLocaleString("fr-FR")}
            </span>{" "}
            / {limit.toLocaleString("fr-FR")} requêtes
            {apiBoost > 0 && (
              <span className="ml-2 inline-flex items-center text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                +{apiBoost} Boost
              </span>
            )}
            <span className="ml-2 font-semibold text-slate-900">
              {Math.min(
                100,
                Math.round((totalRequests / Math.max(1, limit)) * 100)
              )}
              %
            </span>
          </p>
        </div>
        <QuotaProgress
          dangerAt={90}
          label="requêtes"
          limit={limit}
          onRefresh={onRefresh}
          refreshing={refreshing}
          showSummary={false}
          used={totalRequests}
        />
        <p className="text-xs text-slate-500">
          Réinitialisation hebdomadaire : {getWeeklyResetDate()}
        </p>
      </div>
    </section>
  );
}
