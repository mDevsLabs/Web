"use client";

import {
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  NewspaperIcon,
  SparklesIcon,
} from "@mdevs/icons";
import { motion } from "framer-motion";
import { SearchSafeImage } from "@/components/search/search-safe-image";
import type { SearchNewsHit } from "@/lib/search/you-client";

export interface SearchNewsViewProps {
  copiedUrl: string | null;
  onCopyLink: (url: string) => void;
  onRequestTargetSummary: (target: {
    snippet?: string;
    source?: string;
    title: string;
    type: "news";
    url: string;
  }) => void;
  orderedNews: SearchNewsHit[];
  submittedQuery: string;
}

export function SearchNewsView({
  orderedNews,
  submittedQuery,
  copiedUrl,
  onCopyLink,
  onRequestTargetSummary,
}: SearchNewsViewProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>
          {orderedNews.length} article
          {orderedNews.length > 1 ? "s" : ""} d'actualité trouvé
          {orderedNews.length > 1 ? "s" : ""}
        </span>
      </div>

      {orderedNews.length === 0 ? (
        <div className="surface-card p-8 text-center text-sm text-muted-foreground">
          Aucune actualité trouvée pour « {submittedQuery} ».
        </div>
      ) : (
        orderedNews.map((item, index) => {
          let domain = item.source || "";
          if (!domain) {
            try {
              domain = new URL(item.url).hostname;
            } catch {
              domain = item.url;
            }
          }

          return (
            <motion.article
              animate={{ opacity: 1, y: 0 }}
              className="surface-card flex flex-col gap-2.5 p-4 sm:p-5 hover:border-foreground/30 transition-all hover:shadow-sm group"
              initial={{ opacity: 0, y: 12 }}
              key={`${item.url}-${index}`}
              transition={{ delay: index * 0.03, duration: 0.25 }}
            >
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2 min-w-0">
                  <SearchSafeImage
                    alt=""
                    className="size-4 rounded-sm object-contain shrink-0"
                    fallback={
                      <NewspaperIcon className="size-4 shrink-0 text-primary" />
                    }
                    src={item.favicon_url}
                  />
                  <span className="font-semibold text-[11px] text-foreground/80 truncate">
                    {domain}
                  </span>
                  <span
                    className="chip shrink-0 bg-info/10 px-2 py-0.5 text-[10px] font-medium text-info"
                    data-static="true"
                  >
                    Actualité
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    aria-label="Résumer cet article avec mAI"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-all cursor-pointer ring-1 ring-primary/20"
                    onClick={() =>
                      onRequestTargetSummary({
                        snippet: item.snippet,
                        source: domain,
                        title: item.title,
                        type: "news",
                        url: item.url,
                      })
                    }
                    title="Demander à mAI de résumer cet article et discuter"
                    type="button"
                  >
                    <SparklesIcon className="size-3" />
                    <span>Résumer</span>
                  </button>

                  <button
                    aria-label="Copier le lien"
                    className="p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    onClick={() => onCopyLink(item.url)}
                    title="Copier le lien de l'article"
                    type="button"
                  >
                    {copiedUrl === item.url ? (
                      <CheckIcon className="size-3.5 text-success" />
                    ) : (
                      <CopyIcon className="size-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <a
                className="text-base font-semibold text-foreground group-hover:text-primary group-hover:underline flex items-center gap-1.5 transition-colors"
                href={item.url}
                rel="noopener noreferrer"
                target="_blank"
              >
                <span>{item.title}</span>
                <ExternalLinkIcon className="size-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </a>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-3">
                {item.snippet}
              </p>
            </motion.article>
          );
        })
      )}
    </div>
  );
}
