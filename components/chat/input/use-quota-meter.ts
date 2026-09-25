"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useDataStream } from "@/components/chat/data-stream-provider";
import { useSettings } from "@/hooks/use-settings";
import { getTierChatWeeklyLimit } from "@/lib/plans/tier-limits";

// Live cost: fetch settings once + dataStream usage
export function useQuotaMeter() {
  const { data: costSettings, error: costSettingsError } = useSettings({
    dedupingInterval: 60_000,
    revalidateOnFocus: false,
  });
  const { dataStream } = useDataStream();
  const [liveSessionTokens, setLiveSessionTokens] = useState(0);
  useEffect(() => {
    if (!dataStream?.length) {
      return;
    }
    const last = dataStream.at(-1) as any;
    if (last?.type === "data-usage" && last?.data?.tokens) {
      setLiveSessionTokens((prev) => prev + Number(last.data.tokens));
    }
  }, [dataStream]);
  const quotaStatus = costSettingsError
    ? "error"
    : costSettings?.aiUsage
      ? "ready"
      : "loading";
  const quotaKnown = quotaStatus === "ready";
  const costAiUsed = quotaKnown
    ? (costSettings?.aiUsage?.tokensUsed ?? 0) + liveSessionTokens
    : 0;
  const costAiLimit = quotaKnown
    ? (costSettings?.aiUsage?.limit ??
      getTierChatWeeklyLimit(costSettings?.aiUsage?.tier))
    : 0;
  const isQuotaExhausted =
    quotaKnown && costAiLimit > 0 && costAiUsed >= costAiLimit;
  const costPercent =
    quotaKnown && costAiLimit > 0
      ? Math.min(100, Math.round((costAiUsed / costAiLimit) * 100))
      : 0;
  useEffect(() => {
    if (quotaKnown && costPercent >= 90 && costAiLimit > 0) {
      toast.error(
        `Tu as utilisé ${costPercent}% de ton quota mAI (${costAiUsed.toLocaleString()}/${costAiLimit.toLocaleString()} tokens) — mise à niveau recommandée.`
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [costPercent, costAiUsed.toLocaleString, costAiLimit, quotaKnown]);

  return {
    costAiLimit,
    costAiUsed,
    costPercent,
    isQuotaExhausted,
    liveSessionTokens,
    quotaStatus,
  };
}
