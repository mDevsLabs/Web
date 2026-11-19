"use client";

import { RotateCcwIcon } from "@mdevs/icons";
import { useState } from "react";
import trendingSuggestions from "@/lib/search/trending-suggestions.json";
import { pickTrends } from "@/lib/search/trends";

export const TRENDING = trendingSuggestions.suggestions;

export function HomeTrends({
  onPick,
}: {
  onPick: (suggestion: string) => void;
}) {
  const [items, setItems] = useState(() => pickTrends(TRENDING));
  return (
    <div className="mt-4 w-full max-w-3xl">
      <div className="mb-2 flex items-center gap-2 px-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Tendances
        </p>
        <button
          className="chip ml-auto inline-flex cursor-pointer items-center gap-1.5 px-2.5 py-1 text-[11px]"
          onClick={() => setItems((current) => pickTrends(TRENDING, current))}
          type="button"
        >
          <RotateCcwIcon className="size-3" />
          <span>Rafraîchir</span>
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <button
            className="chip shrink-0 cursor-pointer px-3 py-1.5 text-xs"
            key={item}
            onClick={() => onPick(item)}
            type="button"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
