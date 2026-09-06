"use client";

import { CalendarPlusIcon, DownloadIcon } from "lucide-react";
import { toast } from "sonner";

type CalendarOutput = {
  attendees?: string[];
  description?: string | null;
  endDate?: string | null;
  error?: string;
  filename?: string;
  googleUrl?: string;
  ics?: string;
  location?: string | null;
  outlookUrl?: string;
  startDate?: string;
  title?: string;
};

function formatFr(iso?: string | null): string {
  if (!iso) {
    return "";
  }
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      dateStyle: "full",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function CalendarReminderCard({
  output,
  state,
}: {
  output?: CalendarOutput;
  state?: string;
}) {
  if (state !== "output-available") {
    return (
      <div className="flex w-fit items-center gap-2 rounded-xl border border-border/50 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <CalendarPlusIcon className="size-3.5 animate-pulse" />
        Préparation de l'événement…
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

  const downloadIcs = () => {
    if (!output?.ics) {
      return;
    }
    const blob = new Blob([output.ics], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = output.filename || "evenement.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Fichier .ics téléchargé");
  };

  return (
    <div className="w-[min(100%,460px)] overflow-hidden rounded-xl border border-border/50 bg-card/60 shadow-xs">
      <div className="flex items-center gap-2 border-b border-border/40 bg-gradient-to-r from-emerald-500/10 to-transparent px-3 py-2.5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          <CalendarPlusIcon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold">
            {output?.title || "Événement"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {formatFr(output?.startDate)}
            {output?.endDate ? ` → ${formatFr(output.endDate)}` : ""}
          </p>
        </div>
      </div>

      <div className="space-y-1.5 px-3 py-2.5 text-[11.5px]">
        {output?.location ? (
          <p>
            <span className="font-semibold text-muted-foreground">Lieu :</span>{" "}
            {output.location}
          </p>
        ) : null}
        {output?.description ? (
          <p className="line-clamp-3 text-muted-foreground">
            {output.description}
          </p>
        ) : null}
        {output?.attendees && output.attendees.length > 0 ? (
          <p>
            <span className="font-semibold text-muted-foreground">
              Participants :
            </span>{" "}
            {output.attendees.join(", ")}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border/40 px-3 py-2.5">
        <button
          className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-2.5 py-1.5 text-[11.5px] font-semibold text-background transition-opacity hover:opacity-85"
          onClick={downloadIcs}
          type="button"
        >
          <DownloadIcon className="size-3.5" />
          Télécharger .ics
        </button>
        {output?.googleUrl ? (
          <a
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 px-2.5 py-1.5 text-[11.5px] font-semibold hover:bg-muted"
            href={output.googleUrl}
            rel="noreferrer"
            target="_blank"
          >
            Google Calendar
          </a>
        ) : null}
        {output?.outlookUrl ? (
          <a
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 px-2.5 py-1.5 text-[11.5px] font-semibold hover:bg-muted"
            href={output.outlookUrl}
            rel="noreferrer"
            target="_blank"
          >
            Outlook
          </a>
        ) : null}
      </div>
    </div>
  );
}
