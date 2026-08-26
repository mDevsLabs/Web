"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { AnimatePresence, motion } from "framer-motion";
import { RotateCwIcon, SparklesIcon } from "lucide-react";
import { memo, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useSettings } from "@/hooks/use-settings";
import { suggestions } from "@/lib/constants";
import type { ChatMessage } from "@/lib/types";
import { Suggestion } from "../ai-elements/suggestion";
import type { VisibilityType } from "./visibility-selector";

type SuggestedActionsProps = {
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  selectedVisibilityType: VisibilityType;
};

function getRandomSuggestions(count = 4, exclude: string[] = []): string[] {
  const available = suggestions.filter((s) => !exclude.includes(s));
  const pool = available.length >= count ? available : suggestions;
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function PureSuggestedActions({ chatId, sendMessage }: SuggestedActionsProps) {
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([]);
  const [isRotating, setIsRotating] = useState(false);
  const { data: costSettings } = useSettings();
  const costAiUsed = costSettings?.aiUsage?.tokensUsed ?? 0;
  const costAiLimit = costSettings?.aiUsage?.limit ?? 2_000_000;
  const isQuotaExhausted = costAiLimit > 0 && costAiUsed >= costAiLimit;

  useEffect(() => {
    setCurrentSuggestions(getRandomSuggestions(4));
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRotating(true);
    setCurrentSuggestions((prev) => getRandomSuggestions(4, prev));
    setTimeout(() => setIsRotating(false), 400);
  }, []);

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      if (isQuotaExhausted) {
        toast.error(
          `Votre quota hebdomadaire mAI est atteint (${costAiUsed.toLocaleString()}/${costAiLimit.toLocaleString()} tokens). Mettez à niveau votre forfait pour continuer !`
        );
        return;
      }
      window.history.pushState(
        {},
        "",
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/chat/${chatId}`
      );
      sendMessage({
        parts: [{ text: suggestion, type: "text" }],
        role: "user",
      });
    },
    [chatId, sendMessage, isQuotaExhausted, costAiUsed, costAiLimit]
  );

  const displayedList =
    currentSuggestions.length > 0
      ? currentSuggestions
      : suggestions.slice(0, 4);

  return (
    <div
      className="flex flex-col gap-2.5 w-full"
      data-testid="suggested-actions"
    >
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground/80">
          <SparklesIcon className="size-3.5 text-primary/70" />
          <span>Suggestions</span>
        </div>
        <button
          className="flex items-center gap-1 text-[11px] text-muted-foreground/60 hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted/40 cursor-pointer"
          onClick={handleRefresh}
          title="Nouvelles suggestions"
          type="button"
        >
          <RotateCwIcon
            className={`size-3 transition-transform ${isRotating ? "animate-spin" : ""}`}
          />
          <span>Actualiser</span>
        </button>
      </div>

      <div className="flex w-full gap-2.5 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible no-scrollbar">
        <AnimatePresence mode="popLayout">
          {displayedList.map((suggestedAction, index) => (
            <motion.div
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="min-w-[220px] shrink-0 sm:min-w-0 sm:shrink"
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              key={suggestedAction}
              transition={{
                delay: 0.04 * index,
                duration: 0.25,
                ease: "easeOut",
              }}
            >
              <Suggestion
                className="h-full w-full whitespace-nowrap rounded-xl border border-border/40 bg-card/40 backdrop-blur-xs px-4 py-3 text-left text-[12px] leading-relaxed text-muted-foreground transition-all duration-200 sm:whitespace-normal sm:p-3.5 sm:text-[13px] hover:-translate-y-0.5 hover:bg-card/80 hover:text-foreground hover:border-border/80 hover:shadow-[var(--shadow-card)]"
                onClick={handleSuggestionClick}
                suggestion={suggestedAction}
              >
                {suggestedAction}
              </Suggestion>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) {
      return false;
    }
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) {
      return false;
    }

    return true;
  }
);
