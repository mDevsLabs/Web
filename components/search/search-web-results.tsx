"use client";

import {
  BookIcon,
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  GlobeIcon,
  SparklesIcon,
} from "@mdevs/icons";
import { motion } from "framer-motion";
import { SearchSafeImage } from "@/components/search/search-safe-image";
import type { SearchWebHit } from "@/lib/search/you-client";

export interface SearchWebResultsProps {
  activeTab: "web" | "wikipedia";
  copiedUrl: string | null;
  domainFilter: string | null;
  durationMs: number | null;
  filteredResults: SearchWebHit[];
  onCopyLink: (url: string) => void;
  onRequestTargetSummary: (target: {
    snippet?: string;
    source?: string;
    title: string;
    type: "web";
    url: string;
  }) => void;
  requestedCount: number | null;
  setDomainFilter: (domain: string) => void;
  submittedQuery: string;
  truncated: boolean;
  wikiFirst: boolean;
}

export function SearchWebResults({
  activeTab,
  wikiFirst,
  filteredResults,
  submittedQuery,
  truncated,
  requestedCount,
  durationMs,
  domainFilter: _domainFilter,
  setDomainFilter,
  copiedUrl,
  onCopyLink,
  onRequestTargetSummary,
}: SearchWebResultsProps) {
  return (
    <div className="flex flex-col gap-4">
      {wikiFirst && activeTab === "web" ? (
        <p className="flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground">
          <BookIcon className="size-3.5 shrink-0" />
          <span>
            Les articles de Wikipédia sont en tête : la requête ressemble à une
            recherche factuelle.
          </span>
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground px-1">
        <span>
          {filteredResults.length} résultat
          {filteredResults.length > 1 ? "s" : ""} trouvé
          {filteredResults.length > 1 ? "s" : ""}
          {truncated && requestedCount ? (
            <span className="text-warning">
              {" "}
              · sur {requestedCount} demandés
            </span>
          ) : null}
        </span>
        {durationMs !== null && durationMs > 2000 ? (
          <span title="Durée de la recherche">
            {(durationMs / 1000).toFixed(1)} s
          </span>
        ) : null}
      </div>

      {filteredResults.length === 0 ? (
        <div className="surface-card p-8 text-center text-sm text-muted-foreground">
          {activeTab === "wikipedia"
            ? `Aucun article Wikipédia pour « ${submittedQuery} ».`
            : `Aucun résultat web trouvé pour « ${submittedQuery} ».`}
        </div>
      ) : (
        filteredResults.map((item, index) => {
          let hostname = "";
          try {
            hostname = new URL(item.url).hostname;
          } catch {
            hostname = item.url;
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
                    fallback={<GlobeIcon className="size-4 shrink-0" />}
                    src={item.favicon_url}
                  />
                  <button
                    className="truncate font-mono text-[11px] hover:text-foreground text-left"
                    onClick={() => setDomainFilter(hostname)}
                    title={`Filtrer par ${hostname}`}
                    type="button"
                  >
                    {hostname}
                  </button>
                  {item.origin === "wikipedia" ? (
                    <span
                      className="chip shrink-0 bg-info/10 px-2 py-0.5 text-[10px] font-medium text-info"
                      data-static="true"
                    >
                      Wikipédia
                    </span>
                  ) : (
                    <span
                      className="chip shrink-0 bg-muted/60 px-2 py-0.5 text-[10px] text-muted-foreground"
                      data-static="true"
                    >
                      Web
                    </span>
                  )}
                  {item.isDisambiguation ? (
                    <span
                      className="chip shrink-0 bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning"
                      data-static="true"
                      title="Cette page liste plusieurs sujets possibles. Choisissez le bon article dans Wikipédia."
                    >
                      Désambiguïsation
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    aria-label="Résumer ce site avec mAI"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-all cursor-pointer ring-1 ring-primary/20"
                    onClick={() =>
                      onRequestTargetSummary({
                        snippet: item.snippet,
                        source: hostname,
                        title: item.title,
                        type: "web",
                        url: item.url,
                      })
                    }
                    title="Demander à mAI de résumer ce site et discuter"
                    type="button"
                  >
                    <SparklesIcon className="size-3" />
                    <span>Résumer</span>
                  </button>

                  <button
                    aria-label="Copier le lien"
                    className="p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    onClick={() => onCopyLink(item.url)}
                    title="Copier l'adresse"
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
