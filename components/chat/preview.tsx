"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { suggestions } from "@/lib/constants";

function PreviewSuggestionButton({
  suggestion,
  onAction,
}: {
  suggestion: string;
  onAction: (query?: string) => void;
}) {
  const handleClick = useCallback(() => {
    onAction(suggestion);
  }, [onAction, suggestion]);

  return (
    <button
      className="rounded-xl border border-border/40 bg-card/40 px-3 py-2.5 text-left text-[12px] leading-relaxed text-muted-foreground transition-all duration-200 hover:border-border/80 hover:bg-card/70 hover:text-foreground cursor-pointer shadow-sm"
      onClick={handleClick}
      type="button"
    >
      {suggestion}
    </button>
  );
}

export function Preview() {
  const router = useRouter();

  const handleAction = useCallback(
    (query?: string) => {
      const url = query ? `/?query=${encodeURIComponent(query)}` : "/";
      router.push(url);
    },
    [router]
  );

  const handleDefaultAction = useCallback(() => {
    handleAction();
  }, [handleAction]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-tl-2xl bg-background">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border/20 px-5">
        <div className="flex size-6 items-center justify-center rounded-lg overflow-hidden ring-1 ring-border/50">
          <Image alt="mAI" height={24} src="/logo.png" width={24} />
        </div>
        <span className="text-[13px] font-semibold text-foreground">
          mAI Assistant
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8">
        <div className="text-center flex flex-col items-center">
          <div className="size-14 relative mb-3">
            <Image
              alt="mAI"
              className="rounded-2xl shadow-md"
              height={56}
              src="/logo.png"
              width={56}
            />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Comment puis-je vous aider aujourd'hui ?
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-sm">
            Posez vos questions du quotidien, rédigez des documents ou explorez
            vos idées avec mAI.
          </p>
        </div>

        <div className="grid w-full max-w-md grid-cols-2 gap-2.5">
          {suggestions.map((suggestion) => (
            <PreviewSuggestionButton
              key={suggestion}
              onAction={handleAction}
              suggestion={suggestion}
            />
          ))}
        </div>
      </div>

      <div className="shrink-0 px-5 pb-5">
        <button
          className="flex w-full items-center rounded-2xl border border-border/40 bg-card/30 px-4 py-3 text-left text-[13px] text-muted-foreground/60 transition-colors hover:border-border/60 hover:text-foreground cursor-pointer"
          onClick={handleDefaultAction}
          type="button"
        >
          Poser une question à mAI...
        </button>
      </div>
    </div>
  );
}
