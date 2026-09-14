"use client";

import { CalendarClockIcon, FileTextIcon, TableIcon } from "lucide-react";
import { useState } from "react";

type DocumentParserOutput = {
  contentType?: string;
  error?: string;
  headings?: string[];
  isTruncated?: boolean;
  length?: number;
  pages?: number;
  rows?: number;
  structure?: Array<{
    column?: number;
    name?: string;
    page?: number;
    preview?: string;
  }>;
  tables?: string[];
  text?: string;
  url?: string;
};

export function DocumentParserCard({
  output,
  state,
}: {
  output?: DocumentParserOutput;
  state?: string;
}) {
  const [showPreview, setShowPreview] = useState(false);

  if (state !== "output-available") {
    return (
      <div className="flex w-fit items-center gap-2 rounded-xl border border-border/50 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <FileTextIcon className="size-3.5 animate-pulse" />
        Analyse du document…
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

  const isPdf = (output?.contentType ?? "").includes("pdf");
  const isCsv = (output?.contentType ?? "") === "text/csv";
  const isDocx = (output?.contentType ?? "").includes("wordprocessingml");
  const kindLabel = isPdf
    ? "PDF"
    : isCsv
      ? "CSV"
      : isDocx
        ? "DOCX"
        : "Document";
  const tableCount = output?.tables?.length ?? 0;

  return (
    <div className="w-[min(100%,520px)] overflow-hidden rounded-xl border border-border/50 bg-card/60 shadow-xs">
      <div className="flex items-center gap-2 border-b border-border/40 px-3 py-2">
        <FileTextIcon className="size-3.5 shrink-0 text-primary" />
        <span className="truncate text-[12.5px] font-semibold">
          {output?.url?.split("/").pop()?.split("?")[0] || "Document analysé"}
        </span>
        <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 font-mono text-[9.5px] uppercase text-muted-foreground">
          {kindLabel}
        </span>
      </div>

      <div className="space-y-2 px-3 py-2.5 text-[12px]">
        <div className="flex flex-wrap gap-1.5">
          {typeof output?.pages === "number" && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] text-muted-foreground">
              {output.pages} pages
            </span>
          )}
          {typeof output?.rows === "number" && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] text-muted-foreground">
              {output.rows} lignes
            </span>
          )}
          {typeof output?.length === "number" && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] text-muted-foreground">
              {Math.round(output.length / 1000)}k caractères
            </span>
          )}
          {tableCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10.5px] font-medium text-emerald-600 dark:text-emerald-400">
              <TableIcon className="size-3" />
              {tableCount} tableau{tableCount > 1 ? "x" : ""} extrait
              {tableCount > 1 ? "s" : ""}
            </span>
          )}
          {output?.isTruncated && (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10.5px] text-amber-600 dark:text-amber-400">
              tronqué
            </span>
          )}
        </div>

        {output?.headings && output.headings.length > 0 ? (
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
              Chapitres détectés
            </p>
            <ul className="mt-1 space-y-0.5 text-[11.5px] text-foreground/85">
              {output.headings.slice(0, 8).map((h, i) => (
                <li className="truncate" key={i}>
                  • {h}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {output?.text ? (
          <>
            <button
              className="text-[11px] font-semibold text-primary underline underline-offset-2"
              onClick={() => setShowPreview((v) => !v)}
              type="button"
            >
              {showPreview ? "Masquer" : "Aperçu du texte extrait"}
            </button>
            {showPreview ? (
              <pre className="max-h-40 overflow-auto rounded-lg border border-border/40 bg-muted/40 p-2 font-mono text-[10.5px] whitespace-pre-wrap">
                {output.text.slice(0, 2000)}
              </pre>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
