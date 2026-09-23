"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useDataStream } from "@/components/chat/data-stream-provider";
import { useSettings } from "@/hooks/use-settings";
import { getTierChatWeeklyLimit } from "@/lib/plans/tier-limits";

// Live cost: fetch settings once + dataStream usage
export function useQuotaMeter() {
  const { data: costSettings } = useSettings({
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
  const costAiUsed =
    (costSettings?.aiUsage?.tokensUsed ?? 0) + liveSessionTokens;
  const costAiLimit =
    costSettings?.aiUsage?.limit ??
    getTierChatWeeklyLimit(costSettings?.aiUsage?.tier);
  const isQuotaExhausted = costAiLimit > 0 && costAiUsed >= costAiLimit;
  const costPercent =
    costAiLimit > 0
      ? Math.min(100, Math.round((costAiUsed / costAiLimit) * 100))
      : 0;
  useEffect(() => {
    if (costPercent >= 90 && costAiLimit > 0) {
      toast.error(
        `Tu as utilisé ${costPercent}% de ton quota mAI (${costAiUsed.toLocaleString()}/${costAiLimit.toLocaleString()} tokens) — mise à niveau recommandée.`
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [costPercent, costAiUsed.toLocaleString, costAiLimit]);

  return {
    costAiLimit,
    costAiUsed,
    costPercent,
    isQuotaExhausted,
    liveSessionTokens,
  };
}
