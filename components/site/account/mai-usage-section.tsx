"use client";

import { Gauge, RefreshCw } from "lucide-react";
import { motion } from "motion/react";

import { formatResetDate, formatTokens } from "./account-utils";

interface MaiUsage {
  limit: number;
  resetAt?: string | null;
  tokensUsed: number;
}

export function MaiUsageSection({
  usage,
  percent,
  refreshing,
  onRefresh,
}: {
  usage: MaiUsage | null;
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
          <Gauge className="w-5 h-5 text-purple-600" /> Usage mAI
        </h2>
      </div>

      {usage ? (
        <>
          <div className="flex items-end justify-between gap-3 text-sm">
            <p className="text-slate-600">
              <span className="font-bold text-slate-900">
                {formatTokens(usage.tokensUsed)}
              </span>{" "}
              / {formatTokens(usage.limit)} tokens
            </p>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-slate-900">{percent}%</p>
              <button
                aria-label="Actualiser l'usage mAI"
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
          </div>
          <div className="w-full bg-slate-200/80 rounded-full h-3 overflow-hidden">
            <motion.div
              animate={{ width: `${percent}%` }}
              className={`h-full rounded-full ${
                percent >= 90
                  ? "bg-red-500"
                  : percent >= 70
                    ? "bg-amber-500"
                    : "bg-gradient-to-r from-purple-500 to-blue-500"
              }`}
              initial={{ width: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <p className="text-xs text-slate-500">
            Réinitialisation hebdomadaire : {formatResetDate(usage.resetAt)}
          </p>
        </>
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
