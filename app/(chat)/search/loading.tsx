export default function SearchLoading() {
  return (
    <div className="flex min-h-dvh flex-col bg-background p-4 sm:p-6 md:p-8 animate-pulse">
      <div className="mx-auto w-full max-w-4xl space-y-6 pt-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="size-12 rounded-2xl bg-muted/60" />
          <div className="h-8 w-48 rounded-lg bg-muted/60" />
          <div className="h-4 w-72 rounded bg-muted/40" />
        </div>

        <div className="h-14 w-full rounded-2xl bg-card border border-border/40" />

        <div className="flex justify-center gap-2 pt-2">
          <div className="h-7 w-20 rounded-full bg-muted/40" />
          <div className="h-7 w-24 rounded-full bg-muted/40" />
          <div className="h-7 w-20 rounded-full bg-muted/40" />
        </div>

        <div className="space-y-4 pt-6">
          <div className="surface-card p-5 space-y-3">
            <div className="h-4 w-1/4 rounded bg-muted/50" />
            <div className="h-5 w-3/4 rounded bg-muted/60" />
            <div className="h-4 w-5/6 rounded bg-muted/40" />
          </div>
          <div className="surface-card p-5 space-y-3">
            <div className="h-4 w-1/4 rounded bg-muted/50" />
            <div className="h-5 w-2/3 rounded bg-muted/60" />
            <div className="h-4 w-4/5 rounded bg-muted/40" />
          </div>
        </div>
      </div>
    </div>
  );
}
