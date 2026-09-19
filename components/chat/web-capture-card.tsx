"use client";

import { CameraIcon, ExternalLinkIcon, ShieldCheckIcon } from "lucide-react";

type WebCaptureOutput = {
  description?: string;
  error?: string;
  h1s?: string[];
  lang?: string;
  ogImage?: string;
  robots?: string;
  screenshotFallbackUrl?: string;
  screenshotUrl?: string;
  technologies?: string[];
  title?: string;
  url?: string;
};

function MetaRow({ label, value }: { label: string; value?: string }) {
  if (!value) {
    return null;
  }
  return (
    <div className="flex gap-2 text-[11.5px]">
      <span className="w-24 shrink-0 font-semibold text-muted-foreground">
        {label}
      </span>
      <span className="min-w-0 flex-1 break-words">{value}</span>
    </div>
  );
}

export function WebCaptureCard({
  output,
  state,
}: {
  output?: WebCaptureOutput;
  state?: string;
}) {
  if (state !== "output-available") {
    return (
      <div className="flex w-fit items-center gap-2 rounded-xl border border-border/50 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <CameraIcon className="size-3.5 animate-pulse" />
        Capture de la page…
      </div>
    );
  }

  if (output?.error) {
    return (
      <div className="w-[min(100%,450px)] rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-600">
        {output.error}
      </div>
    );
  }

  const shot = (output?.screenshotUrl ?? "").trim();

  return (
    <div className="w-[min(100%,520px)] overflow-hidden rounded-xl border border-border/50 bg-card/60 shadow-xs">
      <div className="flex items-center gap-2 border-b border-border/40 px-3 py-2">
        <CameraIcon className="size-3.5 shrink-0 text-sky-500" />
        <span className="truncate text-[12.5px] font-semibold">
          {output?.title || output?.url}
        </span>
        {output?.url ? (
          <a
            className="ml-auto shrink-0 rounded-md border border-border/50 p-1 hover:bg-muted"
            href={output.url}
            rel="noreferrer"
            target="_blank"
            title="Ouvrir la page"
          >
            <ExternalLinkIcon className="size-3" />
          </a>
        ) : null}
      </div>

      {shot ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={`Capture de ${output?.url}`}
          className="max-h-72 w-full bg-white object-cover object-top"
          onError={(e) => {
            const fallback = output?.screenshotFallbackUrl;
            if (fallback && e.currentTarget.src !== fallback) {
              e.currentTarget.src = fallback;
            } else {
              e.currentTarget.style.display = "none";
            }
          }}
          referrerPolicy="no-referrer"
          src={shot}
        />
      ) : (
        <div className="flex h-28 items-center justify-center text-xs text-muted-foreground">
          Capture indisponible — métadonnées seules.
        </div>
      )}

      <div className="space-y-1.5 px-3 py-2.5">
        <MetaRow label="Description" value={output?.description} />
        <MetaRow label="Langue" value={output?.lang} />
        <MetaRow label="Robots" value={output?.robots} />
        {output?.h1s && output.h1s.length > 0 ? (
          <MetaRow label="H1" value={output.h1s.join(" · ")} />
        ) : null}
        {output?.technologies && output.technologies.length > 0 ? (
          <div className="flex flex-wrap gap-1 pt-1">
            {output.technologies.map((t) => (
              <span
                className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                key={t}
              >
                {t}
              </span>
            ))}
          </div>
        ) : null}
        <div className="flex items-center gap-1 pt-1 text-[10px] text-muted-foreground">
          <ShieldCheckIcon className="size-3" />
          Analyse anti-SSRF · capture via service tiers
        </div>
      </div>
    </div>
  );
}
