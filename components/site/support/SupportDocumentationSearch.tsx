"use client";

import {
  BookOpen,
  ExternalLink,
  FileText,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import Link from "@/components/site/router";
import type { SearchEntry } from "@/lib/site/search-types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDocEntry(value: unknown): value is SearchEntry {
  return (
    isRecord(value) &&
    value.type === "doc" &&
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    typeof value.href === "string" &&
    (value.meta === undefined || typeof value.meta === "string")
  );
}

function documentationHref(href: string): string {
  // L'index historique renvoie /docs/<slug>, tandis que le hub App Router
  // sélectionne le document via la query string.
  const match = href.match(/^\/docs\/([^/?#]+)/);
  return match ? `/docs?doc=${encodeURIComponent(match[1])}` : href;
}

function isAbortError(reason: unknown): boolean {
  return (
    (reason instanceof DOMException && reason.name === "AbortError") ||
    (reason instanceof Error && reason.name === "AbortError")
  );
}

export function SupportDocumentationSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvedQuery, setResolvedQuery] = useState("");

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setResolvedQuery("");
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          limit: "6",
          q: trimmed,
          type: "doc",
        });
        const response = await fetch(`/api/site/search?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`La recherche a répondu ${response.status}.`);
        }
        const payload: unknown = await response.json();
        if (!isRecord(payload) || !Array.isArray(payload.results)) {
          throw new Error("Réponse de recherche invalide.");
        }
        const nextResults = payload.results.filter(isDocEntry);
        if (!cancelled) {
          setResults(nextResults);
          setResolvedQuery(trimmed);
        }
      } catch (reason: unknown) {
        if (isAbortError(reason)) return;
        if (!cancelled) {
          setResults([]);
          setResolvedQuery(trimmed);
          setError("La documentation ne répond pas pour le moment.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 260);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const showResults = query.trim().length >= 2;
  const isFresh = resolvedQuery === query.trim();

  return (
    <section aria-labelledby="support-docs-search-title" className="space-y-4">
      <div>
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600">
          <FileText aria-hidden="true" className="h-4 w-4" />
          Documentation
        </p>
        <h2
          className="mt-1 text-lg font-extrabold text-slate-900"
          id="support-docs-search-title"
        >
          Trouver une réponse dans les guides
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Recherchez dans la documentation publiée par mAI. La recherche attend
          quelques instants après la saisie.
        </p>
      </div>

      <div className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm sm:p-5">
        <label className="sr-only" htmlFor="support-doc-search">
          Rechercher dans la documentation
        </label>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          />
          <input
            aria-controls="support-doc-results"
            aria-describedby="support-doc-search-help"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            id="support-doc-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ex. authentification, quota, image…"
            type="search"
            value={query}
          />
          {query ? (
            <button
              aria-label="Effacer la recherche documentaire"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              onClick={() => setQuery("")}
              type="button"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <p
          className="mt-2 text-[11px] text-slate-400"
          id="support-doc-search-help"
        >
          Astuce : saisissez au moins deux caractères.
        </p>

        <div
          aria-busy={loading}
          aria-live="polite"
          className="mt-4"
          id="support-doc-results"
        >
          {showResults ? (
            loading && !isFresh ? (
              <div className="flex items-center justify-center gap-2 rounded-2xl bg-slate-50 px-4 py-6 text-xs text-slate-500">
                <Loader2
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin text-blue-600"
                />
                Recherche en cours…
              </div>
            ) : error ? (
              <div
                className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-xs text-amber-800"
                role="alert"
              >
                {error}
              </div>
            ) : results.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 px-4 py-5 text-center text-xs text-slate-500">
                Aucun document ne correspond à cette recherche.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {results.length} résultat{results.length > 1 ? "s" : ""}
                  </p>
                  {loading ? (
                    <Loader2
                      aria-label="Actualisation de la recherche"
                      className="h-3.5 w-3.5 animate-spin text-blue-500"
                    />
                  ) : null}
                </div>
                {results.map((result) => (
                  <Link
                    className="group flex items-start justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 transition hover:border-blue-200 hover:bg-blue-50/50"
                    href={documentationHref(result.href)}
                    key={`${result.type}-${result.href}-${result.title}`}
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-slate-800 group-hover:text-blue-700">
                        {result.title}
                      </span>
                      <span className="mt-1 block line-clamp-2 text-xs leading-relaxed text-slate-500">
                        {result.description}
                      </span>
                      {result.meta ? (
                        <span className="mt-1.5 inline-block text-[10px] font-bold uppercase tracking-wider text-blue-600">
                          {result.meta}
                        </span>
                      ) : null}
                    </span>
                    <ExternalLink
                      aria-hidden="true"
                      className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 group-hover:text-blue-600"
                    />
                  </Link>
                ))}
              </div>
            )
          ) : (
            <div className="rounded-2xl bg-slate-50 px-4 py-5 text-center">
              <BookOpen
                aria-hidden="true"
                className="mx-auto h-7 w-7 text-slate-300"
              />
              <p className="mt-2 text-xs text-slate-500">
                Les suggestions apparaîtront ici.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
