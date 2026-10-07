"use client";

import { Image as ImageIcon } from "lucide-react";

import type { UserImageUsageData } from "@/lib/site/image-usage";
import { getTierDailyImageLimit } from "@/lib/site/tiers";
import { formatResetDate } from "./account-utils";
import { QuotaProgress } from "./quota-progress";

export function ImageUsageSection({
  usage,
  tier,
  refreshing,
  onRefresh,
}: {
  usage: UserImageUsageData | null;
  tier?: string;
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
}) {
  const usedToday = usage?.usedToday ?? 0;
  const dailyLimit = usage?.dailyLimit ?? getTierDailyImageLimit(tier);

  return (
    <section
      className="scroll-mt-28 bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 md:p-8 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] space-y-6"
      id="usage-images"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-purple-600" /> Usage Images
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Consommation de vos générations d&apos;images quotidiennes via Comet
            API et Flux.
          </p>
        </div>
      </div>
      <QuotaProgress
        dangerAt={100}
        label="images générées aujourd'hui"
        limit={dailyLimit}
        onRefresh={onRefresh}
        refreshing={refreshing}
        resetLabel={`Réinitialisation automatique : ${formatResetDate(usage?.resetAt)}`}
        tone="image"
        used={usedToday}
      />
    </section>
  );
}
