export default function VibeLoading() {
  return (
    <div className="flex min-h-dvh flex-col bg-background p-4 sm:p-6 animate-pulse">
      <div className="mx-auto w-full max-w-2xl space-y-5">
        {/* Rail stories skeleton */}
        <div className="flex items-center gap-3 overflow-x-auto py-2 no-scrollbar">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              className="flex flex-col items-center gap-1.5 shrink-0"
              key={i}
            >
              <div className="size-16 rounded-full bg-muted/60 ring-2 ring-border/40" />
              <div className="h-2.5 w-12 rounded bg-muted/40" />
            </div>
          ))}
        </div>

        {/* Feed posts skeleton */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div className="surface-card p-4 sm:p-5 space-y-4" key={i}>
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-muted/60" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 w-32 rounded bg-muted/60" />
                <div className="h-2.5 w-20 rounded bg-muted/40" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-muted/50" />
              <div className="h-4 w-5/6 rounded bg-muted/40" />
            </div>
            <div className="h-48 w-full rounded-xl bg-muted/30" />
            <div className="flex items-center justify-between pt-2 border-t border-border/30">
              <div className="h-7 w-16 rounded-lg bg-muted/40" />
              <div className="h-7 w-16 rounded-lg bg-muted/40" />
              <div className="h-7 w-16 rounded-lg bg-muted/40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
