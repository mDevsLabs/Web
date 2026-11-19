"use client";

import {
  ArrowRightIcon,
  CheckIcon,
  CopyIcon,
  MessageCircleIcon,
  RotateCcwIcon,
  SparklesIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "@mdevs/icons";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { formatModelName } from "@/lib/ai/models";
import type { SummarySource } from "@/lib/search/summary-stream";
import { cn } from "@/lib/utils";

export function modelLabelFromResponse(response: Response): string | null {
  const named = response.headers.get("X-Model-Name")?.trim();
  if (named) {
    return named;
  }
  const id = response.headers.get("X-Model-Id")?.trim();
  return id ? formatModelName(id).name : null;
}

export function AnswerReasoning({
  streaming,
  text,
}: {
  streaming: boolean;
  text: string;
}) {
  const [open, setOpen] = useState(streaming);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    setOpen(streaming);
  }, [streaming]);
  if (!text) {
    return null;
  }
  return (
    <div className="rounded-xl border border-border/50 bg-muted/30 px-3 py-2">
      <div className="flex items-center gap-2">
        <button
          className="cursor-pointer text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
          onClick={() => setOpen((value) => !value)}
          type="button"
        >
          Réflexion
        </button>
        <button
          className="ml-auto text-[11px] text-muted-foreground hover:text-foreground"
          onClick={() => {
            navigator.clipboard
              .writeText(text)
              .then(() => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 2000);
              })
              .catch(() => toast.error("Impossible de copier la réflexion."));
          }}
          type="button"
        >
          {copied ? "Copié" : "Copier"}
        </button>
      </div>
      {open ? (
        <div className="mt-2 text-xs leading-relaxed text-muted-foreground">
          <Streamdown>{text}</Streamdown>
        </div>
      ) : null}
    </div>
  );
}

export function SummarySources({ sources }: { sources: SummarySource[] }) {
  if (sources.length === 0) {
    return null;
  }
  return (
    <div className="mt-4 border-t border-border/40 pt-3">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Sources consultées ({sources.length})
      </p>
      <ol className="space-y-1.5">
        {sources.map((source, index) => (
          <li className="flex gap-2 text-[11px] leading-snug" key={source.url}>
            <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-semibold text-muted-foreground">
              {index + 1}
            </span>
            <a
              className="min-w-0 text-foreground/85 hover:text-primary hover:underline"
              href={source.url}
              rel="noopener noreferrer"
              target="_blank"
              title={source.url}
            >
              <span className="line-clamp-1 font-medium">{source.title}</span>
              <span className="text-[10px] text-muted-foreground">
                {source.domain}
                {source.origin === "wikipedia" ? (
                  <span className="text-info"> · Wikipédia</span>
                ) : null}
              </span>
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}

export interface SearchSummaryCardProps {
  hasCopiedSummary: boolean;
  isSummaryLoading: boolean;
  onCopySummary: () => void;
  onRefineSummary: (length: "short" | "normal" | "long") => void;
  onSendToChat: () => void;
  onVote: (choice: "good" | "bad") => Promise<void> | void;
  summary: string;
  summaryLength: "short" | "normal" | "long";
  summaryModel: string | null;
  summaryReasoning: string;
  summarySources: SummarySource[];
  summarySubstituted: boolean;
  vote: "good" | "bad" | null;
}

export function SearchSummaryCard({
  summaryModel,
  summarySubstituted,
  isSummaryLoading,
  summaryLength,
  onRefineSummary,
  summaryReasoning,
  summary,
  summarySources,
  vote,
  onVote,
  hasCopiedSummary,
  onCopySummary,
  onSendToChat,
}: SearchSummaryCardProps) {
  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      className="surface-card relative overflow-hidden border border-primary/25 bg-gradient-to-b from-primary/[0.04] to-card/60 p-5 sm:p-6 shadow-sm flex flex-col gap-4"
      initial={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20">
            <SparklesIcon className="size-3.5 animate-pulse" />
          </div>
          <span className="text-sm font-semibold text-foreground">
            Synthèse mAI
          </span>
          {summaryModel ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              {summaryModel}
            </span>
          ) : null}
          {summarySubstituted ? (
            <span className="text-[10px] text-muted-foreground">
              Modèle de repli
            </span>
          ) : null}
          {isSummaryLoading ? (
            <span className="text-[11px] text-muted-foreground animate-pulse">
              Génération en cours…
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-1 text-xs">
          <button
            className={cn(
              "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer",
              summaryLength === "short"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted/50"
            )}
            onClick={() => onRefineSummary("short")}
            title="Résumé très concis"
            type="button"
          >
            Plus court
          </button>
          <button
            className={cn(
              "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer",
              summaryLength === "long"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted/50"
            )}
            onClick={() => onRefineSummary("long")}
            title="Synthèse détaillée"
            type="button"
          >
            Plus long
          </button>
          <button
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => onRefineSummary("normal")}
            title="Réessayer"
            type="button"
          >
            <RotateCcwIcon className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Contenu du résumé markdown */}
      <div className="text-sm leading-relaxed text-foreground/90 flex flex-col gap-3">
        <AnswerReasoning streaming={isSummaryLoading} text={summaryReasoning} />
        {summary ? (
          <div className="prose dark:prose-invert max-w-none text-sm">
            {summaryReasoning ? (
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Réponse
              </p>
            ) : null}
            <Streamdown>{summary}</Streamdown>
            <SummarySources sources={summarySources} />
          </div>
        ) : isSummaryLoading ? (
          <div className="space-y-2 py-2">
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted/50" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-muted/50" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted/50" />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            En attente des données de recherche…
          </p>
        )}
      </div>

      {/* Actions sous le résumé */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/30 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">
            Ce résumé vous a-t-il aidé ?
          </span>
          <button
            aria-label="Bien"
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all cursor-pointer",
              vote === "good"
                ? "bg-success/15 border-success/30 text-success"
                : "border-border/60 hover:bg-muted/50 text-muted-foreground hover:text-foreground"
            )}
            onClick={() => void onVote("good")}
            type="button"
          >
            <ThumbsUpIcon className="size-3" />
            <span>Bien</span>
          </button>
          <button
            aria-label="Pas bien"
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all cursor-pointer",
              vote === "bad"
                ? "bg-destructive/15 border-destructive/30 text-destructive"
                : "border-border/60 hover:bg-muted/50 text-muted-foreground hover:text-foreground"
            )}
            onClick={() => void onVote("bad")}
            type="button"
          >
            <ThumbsDownIcon className="size-3" />
            <span>Pas bien</span>
          </button>

          <button
            aria-label="Copier le résumé"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border/60 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors ml-1 cursor-pointer"
            onClick={onCopySummary}
            type="button"
          >
            {hasCopiedSummary ? (
              <CheckIcon className="size-3 text-success" />
            ) : (
              <CopyIcon className="size-3" />
            )}
            <span>{hasCopiedSummary ? "Copié" : "Copier la synthèse"}</span>
          </button>
        </div>

        <button
          className="inline-flex items-center gap-2 rounded-xl bg-foreground text-background px-4 py-2 text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm cursor-pointer ml-auto"
          onClick={onSendToChat}
          type="button"
        >
          <MessageCircleIcon className="size-3.5" />
          <span>Continuer dans le Chat mAI</span>
          <ArrowRightIcon className="size-3" />
        </button>
      </div>
    </motion.section>
  );
}
