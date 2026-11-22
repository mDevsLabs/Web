/**
 * Squelettes de chargement structurels du portail d'assistance (/site/support).
 * Reproduisent la géométrie exacte des vues finales pendant le streaming SSR (`<Suspense>`)
 * et lors des rechargements filtrés côté client.
 */

function SkeletonBlock({ className }: { className: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-xl bg-slate-100 ${className}`}
    />
  );
}

export function SupportStatsCardsSkeleton() {
  return (
    <div aria-hidden="true" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {[0, 1, 2, 3].map((item) => (
        <div
          className="space-y-2.5 rounded-2xl border border-black/5 bg-white p-5 shadow-2xs"
          key={item}
        >
          <SkeletonBlock className="h-3 w-24 rounded-md" />
          <SkeletonBlock className="h-8 w-14 rounded-lg" />
          <SkeletonBlock className="h-3 w-28 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function SupportActiveTicketsSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-3">
      {[0, 1, 2].map((item) => (
        <div
          className="flex flex-col justify-between gap-3 rounded-2xl border border-black/5 bg-white p-4 sm:flex-row sm:items-center sm:p-5"
          key={item}
        >
          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <SkeletonBlock className="h-5 w-16 rounded-md" />
              <SkeletonBlock className="h-5 w-14 rounded-md" />
              <SkeletonBlock className="h-5 w-20 rounded-md" />
            </div>
            <SkeletonBlock className="h-4 w-2/3 rounded-md" />
          </div>
          <SkeletonBlock className="h-7 w-24 shrink-0 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function SupportHistoryListSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-2.5">
      {[0, 1, 2].map((item) => (
        <div
          className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50 p-3"
          key={item}
        >
          <div className="flex gap-2">
            <SkeletonBlock className="h-4 w-10 rounded-md bg-slate-200/70" />
            <SkeletonBlock className="h-4 w-16 rounded-md bg-slate-200/70" />
          </div>
          <SkeletonBlock className="h-3.5 w-3/4 rounded-md bg-slate-200/70" />
          <SkeletonBlock className="h-3 w-1/2 rounded-md bg-slate-200/70" />
        </div>
      ))}
    </div>
  );
}

export function SupportServiceStatusSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="space-y-4 rounded-3xl border border-black/5 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-11 w-11 rounded-2xl" />
          <div className="space-y-2">
            <SkeletonBlock className="h-4 w-28 rounded-md" />
            <SkeletonBlock className="h-3 w-44 rounded-md" />
          </div>
        </div>
        <SkeletonBlock className="h-3 w-32 rounded-md" />
      </div>
      <div className="grid gap-2 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <SkeletonBlock
            className="h-12 rounded-2xl border border-slate-100 bg-slate-50"
            key={item}
          />
        ))}
      </div>
    </div>
  );
}

export function SupportDashboardSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Chargement du centre de support"
      className="space-y-8"
      role="status"
    >
      <SupportStatsCardsSkeleton />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <SkeletonBlock className="h-6 w-44 rounded-lg" />
            <SkeletonBlock className="h-4 w-20 rounded-md" />
          </div>
          <SupportActiveTicketsSkeleton />
        </div>
        <div className="space-y-4 lg:col-span-1">
          <div className="flex items-center justify-between">
            <SkeletonBlock className="h-4 w-24 rounded-md" />
            <SkeletonBlock className="h-4 w-16 rounded-md" />
          </div>
          <div className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm">
            <SupportHistoryListSkeleton />
          </div>
        </div>
      </div>
      <SupportServiceStatusSkeleton />
    </div>
  );
}

export function SupportStatsSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Chargement des statistiques du support"
      className="space-y-8"
      role="status"
    >
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <SkeletonBlock className="h-7 w-72 rounded-lg" />
          <SkeletonBlock className="h-4 w-80 max-w-full rounded-md" />
        </div>
        <SkeletonBlock className="h-9 w-28 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[0, 1, 2, 3, 4].map((item) => (
          <div
            className="space-y-3 rounded-3xl border border-black/5 bg-white p-5 shadow-2xs"
            key={item}
          >
            <SkeletonBlock className="h-3 w-24 rounded-md" />
            <SkeletonBlock className="h-8 w-16 rounded-lg" />
            <SkeletonBlock className="h-3 w-28 rounded-md" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-72 rounded-3xl border border-black/5 bg-white p-6 shadow-2xs">
          <SkeletonBlock className="mb-4 h-5 w-40 rounded-md" />
          <SkeletonBlock className="h-52 w-full rounded-2xl" />
        </div>
        <div className="h-72 rounded-3xl border border-black/5 bg-white p-6 shadow-2xs">
          <SkeletonBlock className="mb-4 h-5 w-44 rounded-md" />
          <SkeletonBlock className="h-52 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export function TicketsListCardsSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Chargement des tickets"
      className="space-y-3"
      role="status"
    >
      {[0, 1, 2, 3].map((item) => (
        <div
          className="rounded-2xl border border-black/5 bg-white p-5"
          key={item}
        >
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div className="flex-1 space-y-2.5">
              <div className="flex gap-2">
                <SkeletonBlock className="h-5 w-20 rounded-md" />
                <SkeletonBlock className="h-5 w-16 rounded-md" />
                <SkeletonBlock className="h-5 w-24 rounded-md" />
              </div>
              <SkeletonBlock className="h-5 w-2/3 rounded-md" />
              <SkeletonBlock className="h-3.5 w-48 rounded-md" />
            </div>
            <SkeletonBlock className="h-8 w-28 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TicketsListSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Chargement de la liste des tickets"
      className="space-y-6"
      role="status"
    >
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <SkeletonBlock className="h-7 w-52 rounded-lg" />
          <SkeletonBlock className="h-4 w-72 rounded-md" />
        </div>
        <SkeletonBlock className="h-10 w-36 rounded-xl" />
      </div>
      <div className="space-y-3 rounded-3xl border border-black/5 bg-white p-4 shadow-2xs">
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4].map((item) => (
            <SkeletonBlock className="h-8 w-24 rounded-full" key={item} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
          <SkeletonBlock className="h-9 rounded-xl sm:col-span-6" />
          <SkeletonBlock className="h-9 rounded-xl sm:col-span-3" />
          <SkeletonBlock className="h-9 rounded-xl sm:col-span-3" />
        </div>
      </div>
      <TicketsListCardsSkeleton />
    </div>
  );
}

export function TicketDetailSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Chargement du dossier de support"
      className="mx-auto max-w-4xl space-y-6"
      role="status"
    >
      <div className="flex items-center justify-between gap-3">
        <SkeletonBlock className="h-5 w-36 rounded-md" />
        <SkeletonBlock className="h-8 w-24 rounded-xl" />
      </div>
      <div className="space-y-4 rounded-3xl border border-black/5 bg-white p-6 shadow-2xs">
        <div className="flex flex-wrap gap-2">
          <SkeletonBlock className="h-5 w-20 rounded-md" />
          <SkeletonBlock className="h-5 w-16 rounded-md" />
          <SkeletonBlock className="h-5 w-24 rounded-md" />
        </div>
        <SkeletonBlock className="h-7 w-3/4 rounded-lg" />
        <SkeletonBlock className="h-4 w-64 rounded-md" />
      </div>
      <div className="space-y-4">
        {[0, 1].map((item) => (
          <div
            className="space-y-3 rounded-3xl border border-black/5 bg-white p-5 shadow-2xs"
            key={item}
          >
            <div className="flex items-center justify-between">
              <SkeletonBlock className="h-4 w-36 rounded-md" />
              <SkeletonBlock className="h-3 w-24 rounded-md" />
            </div>
            <SkeletonBlock className="h-16 w-full rounded-xl" />
          </div>
        ))}
      </div>
      <div className="h-36 rounded-3xl border border-black/5 bg-white p-6 shadow-2xs">
        <SkeletonBlock className="h-full w-full rounded-2xl" />
      </div>
    </div>
  );
}
