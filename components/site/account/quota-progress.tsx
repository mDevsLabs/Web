"use client";

import { RefreshCwIcon as RefreshCw } from "@mdevs/icons";
import { motion } from "motion/react";

interface QuotaProgressProps {
  dangerAt?: number;
  label: string;
  limit: number;
  onRefresh?: () => void;
  refreshing?: boolean;
  resetLabel?: string;
  showSummary?: boolean;
  tone?: "purple" | "image" | "audio" | "cloud";
  used: number;
}

const TONES = {
  audio: "from-indigo-500 via-purple-500 to-pink-500",
  cloud: "from-purple-500 to-blue-500",
  image: "from-pink-500 via-purple-500 to-indigo-500",
  purple: "from-purple-500 to-blue-500",
} as const;

export function QuotaProgress({
  used,
  limit,
  label,
  resetLabel,
  refreshing = false,
  onRefresh,
  tone = "purple",
  dangerAt = 90,
  showSummary = true,
}: QuotaProgressProps) {
  const safeLimit = Math.max(1, limit);
  const percent = Math.min(100, Math.round((used / safeLimit) * 100));
  const danger = percent >= dangerAt;
  const warning = !danger && percent >= 70;

  return (
    <div className="space-y-2">
      {showSummary && (
        <div className="flex items-end justify-between gap-3 text-sm">
          <p className="text-slate-600">
            <span className="font-bold text-slate-900">
              {used.toLocaleString("fr-FR")}
            </span>{" "}
            / {limit.toLocaleString("fr-FR")} {label}
          </p>
          <div className="flex items-center gap-2">
            <p
              className={`font-semibold ${danger ? "text-red-600" : "text-slate-900"}`}
            >
              {percent}%
            </p>
            {onRefresh && (
              <button
                aria-label="Actualiser l'utilisation"
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
            )}
          </div>
        </div>
      )}
      <div className="w-full bg-slate-200/80 rounded-full h-3 overflow-hidden">
        <motion.div
          animate={{ width: `${percent}%` }}
          className={`h-full rounded-full ${
            danger
              ? "bg-red-500"
              : warning
                ? "bg-amber-500"
                : `bg-gradient-to-r ${TONES[tone]}`
          }`}
          initial={{ width: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      {resetLabel && <p className="text-xs text-slate-500">{resetLabel}</p>}
    </div>
  );
}
