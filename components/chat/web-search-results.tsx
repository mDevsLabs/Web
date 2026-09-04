"use client";

import {
  ExternalLinkIcon,
  GlobeIcon,
  LayoutGridIcon,
  ListIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

export interface WebSearchResultItem {
  snippet?: string;
  source?: string;
  title: string;
  url: string;
}

export interface WebSearchResultsProps {
  query?: string;
  results: WebSearchResultItem[];
}

function extractDomain(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function getFaviconUrl(domain: string): string {
  if (!domain) return "";
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;
}

function HighlightedSnippet({
  snippet,
  query,
}: {
  snippet: string;
  query?: string;
}) {
  const elements = useMemo(() => {
    if (!query?.trim()) return snippet;
    const words = query
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 2);
    if (words.length === 0) return snippet;

    const escaped = words
      .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|");
    const regex = new RegExp(`(${escaped})`, "gi");
    const parts = snippet.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark
          className="rounded bg-sky-500/25 px-0.5 font-medium text-foreground dark:bg-sky-400/25"
          key={i}
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  }, [snippet, query]);

  return (
    <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground line-clamp-2">
      {elements}
    </p>
  );
}

function FaviconImage({ domain }: { domain: string }) {
  const [error, setError] = useState(false);
  const src = getFaviconUrl(domain);

  if (error || !src) {
    return <GlobeIcon className="size-3.5 shrink-0 text-muted-foreground" />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={domain}
      className="size-4 shrink-0 rounded-xs object-contain"
      loading="lazy"
      onError={() => setError(true)}
      src={src}
    />
  );
}

export function WebSearchResults({ query, results }: WebSearchResultsProps) {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  if (!results || results.length === 0) {
    return null;
  }

  return (
    <div className="w-[min(100%,560px)] overflow-hidden rounded-2xl border border-sky-500/30 bg-card shadow-sm backdrop-blur-xs transition">
      {/* En-tête enrichi */}
      <div className="flex items-center justify-between gap-2 border-b border-sky-500/20 bg-sky-500/10 px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-sky-500/20 text-sky-600 dark:text-sky-400">
            <GlobeIcon className="size-4" />
          </span>
          <div className="flex flex-col">
            <span className="font-semibold text-[13px] text-foreground">
              Recherche Web
            </span>
            {query && (
              <span className="max-w-[180px] truncate text-[11px] text-muted-foreground sm:max-w-[260px]">
                « {query} »
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[10.5px] font-semibold text-sky-700 dark:text-sky-300">
            {results.length} source{results.length > 1 ? "s" : ""}
          </span>
          <div className="flex items-center rounded-lg border border-border/40 bg-background/60 p-0.5">
            <Button
              className={`h-6 w-6 p-0 rounded-sm ${viewMode === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setViewMode("list")}
              size="icon"
              title="Vue liste"
              type="button"
              variant="ghost"
            >
              <ListIcon className="size-3.5" />
            </Button>
            <Button
              className={`h-6 w-6 p-0 rounded-sm ${viewMode === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setViewMode("grid")}
              size="icon"
              title="Vue grille"
              type="button"
              variant="ghost"
            >
              <LayoutGridIcon className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Contenu : Vue Liste ou Vue Grille */}
      {viewMode === "grid" ? (
        <div className="grid max-h-80 grid-cols-1 gap-2 overflow-y-auto p-2.5 sm:grid-cols-2">
          {results.map((result, idx) => {
            const domain = extractDomain(result.url);
            return (
              <a
                className="group flex flex-col justify-between rounded-xl border border-border/50 bg-background/50 p-2.5 transition-all hover:border-sky-500/40 hover:bg-muted/30"
                href={result.url}
                key={result.url || idx}
                rel="noopener noreferrer"
                target="_blank"
              >
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <FaviconImage domain={domain} />
                    <span className="truncate font-medium">
                      {result.source || domain}
                    </span>
                    <ExternalLinkIcon className="ml-auto size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 text-sky-500" />
                  </div>
                  <h4 className="mt-1 font-medium text-[12.5px] leading-snug text-foreground transition-colors group-hover:text-sky-600 line-clamp-2 dark:group-hover:text-sky-400">
                    {result.title}
                  </h4>
                </div>
                {result.snippet && (
                  <HighlightedSnippet query={query} snippet={result.snippet} />
                )}
              </a>
            );
          })}
        </div>
      ) : (
        <ul className="divide-y divide-border/30 max-h-72 overflow-y-auto">
          {results.map((result, idx) => {
            const domain = extractDomain(result.url);
            return (
              <li
                className="p-3 transition-colors hover:bg-muted/30"
                key={result.url || idx}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-1.5">
                      <FaviconImage domain={domain} />
                      <span className="truncate text-[11px] font-medium text-muted-foreground">
                        {result.source || domain}
                      </span>
                    </div>
                    <a
                      className="font-semibold text-[13px] text-foreground transition-colors hover:text-sky-600 line-clamp-1 dark:hover:text-sky-400"
                      href={result.url}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {result.title}
                    </a>
                  </div>
                  <a
                    aria-label="Ouvrir le lien"
                    className="shrink-0 p-1 text-muted-foreground hover:text-foreground"
                    href={result.url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <ExternalLinkIcon className="size-3.5" />
                  </a>
                </div>
                {result.snippet && (
                  <HighlightedSnippet query={query} snippet={result.snippet} />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
