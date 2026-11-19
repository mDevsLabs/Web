"use client";

import {
  BookIcon,
  GlobeIcon,
  ImageIcon,
  NewspaperIcon,
  RotateCcwIcon,
  SearchIcon,
  Share2Icon,
  VideoIcon,
  XIcon,
} from "@mdevs/icons";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { SearchDrawerConversation } from "@/components/search/search-drawer-conversation";
import {
  SearchHistorySidebar,
  shareSearchQuery,
} from "@/components/search/search-history-sidebar";
import { SearchHomeLanding } from "@/components/search/search-home-landing";
import { SearchImagesView } from "@/components/search/search-images-view";
import { SearchNewsView } from "@/components/search/search-news-view";
import {
  modelLabelFromResponse,
  SearchSummaryCard,
} from "@/components/search/search-summary-card";
import { SearchVideosView } from "@/components/search/search-videos-view";
import { SearchWebResults } from "@/components/search/search-web-results";
import { useTargetConversation } from "@/components/search/use-target-conversation";
import { useRecentSearches } from "@/hooks/use-recent-searches";
import { isSearchableQuery } from "@/lib/search/query";
import {
  orderResults,
  type ResultPeriod,
  type ResultSort,
} from "@/lib/search/result-order";
import {
  mergeStreamText,
  readSummaryStream,
  type SummarySource,
} from "@/lib/search/summary-stream";
import { isWikipediaArticleUrl } from "@/lib/search/wikipedia";
import type {
  SearchImageHit,
  SearchNewsHit,
  SearchVideoHit,
  SearchWebHit,
} from "@/lib/search/you-client";

type SearchTab = "web" | "news" | "images" | "videos" | "wikipedia";

function isWikipediaHit(hit: { origin?: string; url: string }): boolean {
  return hit.origin === "wikipedia" || isWikipediaArticleUrl(hit.url);
}

export function SearchClient() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchTab>("web");
  const [sort, _setSort] = useState<ResultSort>("relevance");
  const [period, _setPeriod] = useState<ResultPeriod>("all");

  const [isLoading, setIsLoading] = useState(false);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [results, setResults] = useState<SearchWebHit[]>([]);
  const [images, setImages] = useState<SearchImageHit[]>([]);
  const [news, setNews] = useState<SearchNewsHit[]>([]);
  const [videos, setVideos] = useState<SearchVideoHit[]>([]);
  const [searchId, setSearchId] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [selectedModelId, setSelectedModelId] = useState<string>("mai-2-mini");

  // Synthèse globale
  const [summary, setSummary] = useState("");
  const [summaryReasoning, setSummaryReasoning] = useState("");
  const [summarySources, setSummarySources] = useState<SummarySource[]>([]);
  const [summaryModel, setSummaryModel] = useState<string | null>(null);
  const [summarySubstituted, setSummarySubstituted] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [summaryLength, setSummaryLength] = useState<
    "normal" | "short" | "long"
  >("normal");
  const [vote, setVote] = useState<"good" | "bad" | null>(null);
  const [hasCopiedSummary, setHasCopiedSummary] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const [portalReady, setPortalReady] = useState(false);
  useEffect(() => setPortalReady(true), []);
  useEffect(() => {
    if (window.matchMedia("(min-width: 768px)").matches) {
      setHistoryOpen(true);
    }
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [requestedCount, setRequestedCount] = useState<number | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [wikiFirst, setWikiFirst] = useState(false);
  const [domainFilter, setDomainFilter] = useState<string | null>(null);

  const {
    clear: clearRecent,
    forget: forgetRecent,
    hasMore: historyHasMore,
    isLoading: historyLoading,
    loadMore: loadMoreHistory,
    pin: pinRecent,
    recent,
    refresh: refreshRecent,
    rename: renameRecent,
  } = useRecentSearches();

  const {
    drawerAbortControllerRef,
    followupInput,
    handleCloseTargetConversation,
    handleCopyDrawerContent,
    handleRequestTargetSummary,
    handleSendDrawerToChat,
    handleSendFollowupMessage,
    hasCopiedDrawer,
    setFollowupInput,
    targetConversation,
  } = useTargetConversation({
    selectedModelId,
    submittedQuery,
  });

  const fetchSummary = useCallback(
    async (
      q: string,
      currentSearchId: string | null,
      hits: SearchWebHit[],
      length: "normal" | "short" | "long" = "normal"
    ) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsSummaryLoading(true);
      setSummary("");
      setSummaryReasoning("");
      setSummarySources([]);
      setSummaryLength(length);
      setSummaryModel(null);
      setSummarySubstituted(false);

      try {
        const response = await fetch("/api/mai-search/summary", {
          body: JSON.stringify({
            length,
            modelId: selectedModelId,
            query: q,
            searchId: currentSearchId,
            sources: hits,
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Impossible de générer le résumé.");
        }

        const modelLabel = modelLabelFromResponse(response);
        if (modelLabel) {
          setSummaryModel(modelLabel);
        }
        setSummarySubstituted(
          response.headers.get("X-Model-Substituted") === "true"
        );

        let accumulated = "";
        let reasoningAccumulator = "";
        await readSummaryStream(response, (event) => {
          if (event.type === "reasoning-delta") {
            reasoningAccumulator = mergeStreamText(
              reasoningAccumulator,
              event.delta
            );
            setSummaryReasoning(reasoningAccumulator);
          } else if (event.type === "text-delta") {
            accumulated = mergeStreamText(accumulated, event.delta);
            setSummary(accumulated);
          } else if (event.type === "sources") {
            setSummarySources(event.sources);
          } else if (event.type === "error") {
            throw new Error(event.message);
          }
        });
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        const message =
          err instanceof Error
            ? err.message
            : "Impossible de synthétiser la recherche.";
        setSummary(`Erreur lors de la génération de la synthèse : ${message}`);
      } finally {
        if (!controller.signal.aborted) {
          setIsSummaryLoading(false);
        }
      }
    },
    [selectedModelId]
  );

  const runSearch = useCallback(
    async (
      overrideQuery?: string,
      options?: {
        historyId?: string;
        keepSummary?: boolean;
        vote?: "good" | "bad" | null;
      }
    ) => {
      const q = (overrideQuery ?? query).trim();
      if (!isSearchableQuery(q)) {
        return;
      }

      setSubmittedQuery(q);
      setIsLoading(true);
      setSearchError(null);
      setDomainFilter(null);
      setVote(options?.vote ?? null);

      if (typeof window !== "undefined") {
        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.set("q", q);
        window.history.replaceState({}, "", nextUrl.toString());
      }

      if (searchAbortRef.current) {
        searchAbortRef.current.abort();
      }
      const controller = new AbortController();
      searchAbortRef.current = controller;

      try {
        const res = await fetch("/api/mai-search", {
          body: JSON.stringify({
            historyId: options?.historyId,
            query: q,
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
          signal: controller.signal,
        });

        if (!res.ok) {
          const errData = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(
            errData.error ||
              `Erreur ${res.status} lors de l'appel au moteur de recherche.`
          );
        }

        const data = (await res.json()) as {
          durationMs?: number;
          error?: string;
          images?: SearchImageHit[];
          news?: SearchNewsHit[];
          provider?: string;
          requestedCount?: number;
          searchId?: string;
          truncated?: boolean;
          videos?: SearchVideoHit[];
          web?: SearchWebHit[];
          wikiFirst?: boolean;
        };

        const searchResults = Array.isArray(data.web) ? data.web : [];
        setResults(searchResults);
        setImages(Array.isArray(data.images) ? data.images : []);
        setNews(Array.isArray(data.news) ? data.news : []);
        setVideos(Array.isArray(data.videos) ? data.videos : []);
        setSearchId(data.searchId || null);
        setProvider(data.provider || null);
        setRequestedCount(
          typeof data.requestedCount === "number" ? data.requestedCount : null
        );
        setTruncated(data.truncated === true);
        setWikiFirst(data.wikiFirst === true);
        setDurationMs(
          typeof data.durationMs === "number" ? data.durationMs : null
        );

        void refreshRecent();

        const usable = searchResults.filter((hit) => !hit.isDisambiguation);
        if (!options?.keepSummary && usable.length === 0) {
          setSummary(
            "Les résultats ne contiennent aucune source à synthétiser."
          );
          setSummarySubstituted(false);
        } else if (!options?.keepSummary) {
          void fetchSummary(q, data.searchId || null, searchResults, "normal");
        } else if (data.searchId) {
          setSearchId(data.searchId);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        const message =
          err instanceof Error
            ? err.message
            : "Impossible d'effectuer la recherche.";
        setSearchError(message);
        toast.error(message);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [fetchSummary, query, refreshRecent]
  );

  const openHistoryEntry = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/mai-search/recent?id=${id}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          return;
        }
        const data = (await response.json()) as {
          query?: {
            id: string;
            query: string;
            reasoning?: string | null;
            summary?: string | null;
            vote?: "good" | "bad" | null;
          };
        };
        const row = data.query;
        if (!row?.query) {
          return;
        }
        setQuery(row.query);
        if (row.summary) {
          setSummary(row.summary);
          setSummaryReasoning(row.reasoning ?? "");
          setSearchId(row.id);
          void runSearch(row.query, {
            historyId: row.id,
            keepSummary: true,
            vote: row.vote ?? null,
          });
          return;
        }
        void runSearch(row.query);
      } catch {
        toast.error("Impossible d'ouvrir cette recherche.");
      }
    },
    [runSearch]
  );

  const initialQueryRef = useRef<string | null>(null);
  const searchRef = useRef(runSearch);
  searchRef.current = runSearch;
  useEffect(() => {
    if (initialQueryRef.current !== null) {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const depuisUrl = params.get("q")?.trim() ?? "";
    if (!depuisUrl) {
      return;
    }
    initialQueryRef.current = depuisUrl;
    setQuery(depuisUrl);
    void searchRef.current(depuisUrl);
  }, []);

  useEffect(
    () => () => {
      searchAbortRef.current?.abort();
      abortControllerRef.current?.abort();
      drawerAbortControllerRef.current?.abort();
    },
    [drawerAbortControllerRef]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void runSearch();
    }
  };

  const handleVote = async (newVote: "good" | "bad") => {
    if (vote === newVote) return;
    setVote(newVote);
    toast.success(
      newVote === "good"
        ? "Merci pour votre retour positif !"
        : "Merci, retour pris en compte pour améliorer les synthèses."
    );

    if (searchId) {
      try {
        await fetch("/api/mai-search/vote", {
          body: JSON.stringify({ searchId, vote: newVote }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
      } catch {
        toast.error("Impossible d'enregistrer votre retour.");
      }
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopiedUrl(url);
        window.setTimeout(() => setCopiedUrl(null), 2000);
        toast.success("Lien copié dans le presse-papier !");
      })
      .catch(() => toast.error("Impossible de copier le lien."));
  };

  const handleShareSearch = () => {
    if (typeof window !== "undefined") {
      const url = window.location.href;
      navigator.clipboard
        .writeText(url)
        .then(() => {
          toast.success("Lien de la recherche copié !");
        })
        .catch(() => {
          toast.error("Impossible de copier le lien.");
        });
    }
  };

  const handleCopySummary = () => {
    if (!summary) return;
    navigator.clipboard
      .writeText(summary)
      .then(() => {
        setHasCopiedSummary(true);
        window.setTimeout(() => setHasCopiedSummary(false), 2000);
        toast.success("Synthèse copiée dans le presse-papier !");
      })
      .catch(() => {
        toast.error("Impossible de copier la synthèse.");
      });
  };

  const handleRefineSummary = (length: "short" | "normal" | "long") => {
    if (!submittedQuery) return;
    void fetchSummary(submittedQuery, searchId, results, length);
  };

  const handleSendToChat = () => {
    if (!submittedQuery || !summary) return;
    const prefilled = `Bonjour mAI, voici ce que j'ai trouvé sur mAI Search pour ma recherche "${submittedQuery}" :

${summary}

Peux-tu m'aider à analyser ou approfondir cela ?`;

    try {
      sessionStorage.setItem("mai_pending_chat_prompt", prefilled);
    } catch {}

    router.push(`/?prompt=${encodeURIComponent(prefilled)}`);
  };

  const wikipediaCount = useMemo(
    () => results.filter((result) => isWikipediaHit(result)).length,
    [results]
  );

  const filteredResults = useMemo(() => {
    const scoped =
      activeTab === "wikipedia"
        ? results.filter((result) => isWikipediaHit(result))
        : results;
    const byDomain = domainFilter
      ? scoped.filter((result) => {
          try {
            return new URL(result.url).hostname.includes(domainFilter);
          } catch {
            return true;
          }
        })
      : scoped;
    return orderResults(byDomain, sort, period);
  }, [activeTab, domainFilter, period, results, sort]);

  const orderedNews = useMemo(
    () => orderResults(news, sort, period),
    [news, period, sort]
  );

  const orderedImages = useMemo(() => {
    if (sort !== "title") {
      return images;
    }
    return [...images].sort((a, b) =>
      a.title.localeCompare(b.title, "fr", { sensitivity: "base" })
    );
  }, [images, sort]);

  const orderedVideos = useMemo(() => {
    if (sort !== "title") {
      return videos;
    }
    return [...videos].sort((a, b) =>
      a.title.localeCompare(b.title, "fr", { sensitivity: "base" })
    );
  }, [sort, videos]);

  const hasSearched = Boolean(submittedQuery);

  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      <SearchHistorySidebar
        hasMore={historyHasMore}
        isLoading={historyLoading}
        onClear={() => void clearRecent()}
        onForget={(id) => void forgetRecent(id)}
        onLoadMore={() => void loadMoreHistory()}
        onOpen={(id) => void openHistoryEntry(id)}
        onOpenChange={setHistoryOpen}
        onPin={(id, pinned) => void pinRecent(id, pinned)}
        onRename={(id, title) => void renameRecent(id, title)}
        onShare={(texte) => void shareSearchQuery(texte)}
        open={historyOpen}
        recent={recent}
      />
      <div className="relative flex min-h-dvh min-w-0 flex-1 flex-col">
        {hasSearched ? (
          <div className="flex flex-col w-full">
            <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/40 px-4 py-3 sm:px-6">
              <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-3 w-full">
                <div
                  className="flex items-center gap-2 mr-2 cursor-pointer select-none shrink-0"
                  onClick={() => {
                    setSubmittedQuery("");
                    setQuery("");
                    setResults([]);
                    setImages([]);
                    setNews([]);
                    setVideos([]);
                    setSummary("");
                  }}
                >
                  <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20">
                    <SearchIcon className="size-4" />
                  </div>
                  <span className="font-bold text-sm tracking-tight hidden sm:inline">
                    mAI <span className="text-primary">Search</span>
                  </span>
                </div>

                <div className="relative flex-1 w-full flex items-center rounded-xl border border-border/70 bg-card/90 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50">
                  <SearchIcon className="size-4 text-muted-foreground ml-3 shrink-0" />
                  <input
                    aria-label="Recherche mAI"
                    className="w-full bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/60"
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Rechercher..."
                    ref={inputRef}
                    type="text"
                    value={query}
                  />
                  {query ? (
                    <button
                      aria-label="Effacer"
                      className="p-1.5 text-muted-foreground hover:text-foreground mr-1 rounded-md transition-colors cursor-pointer"
                      onClick={() => setQuery("")}
                      type="button"
                    >
                      <XIcon className="size-3.5" />
                    </button>
                  ) : null}
                  <button
                    className="mr-1.5 inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-3.5 py-1.5 text-xs font-semibold hover:opacity-90 active:scale-95 cursor-pointer disabled:opacity-40"
                    disabled={!isSearchableQuery(query) || isLoading}
                    onClick={() => void runSearch()}
                    type="button"
                  >
                    {isLoading ? "Recherche..." : "Rechercher"}
                  </button>
                </div>

                <button
                  className="chip text-xs inline-flex items-center gap-1.5 py-1.5 px-3 cursor-pointer shrink-0"
                  onClick={handleShareSearch}
                  title="Partager cette recherche"
                  type="button"
                >
                  <Share2Icon className="size-3.5" />
                  <span>Partager</span>
                </button>
              </div>

              <div className="max-w-6xl mx-auto flex items-center gap-1.5 pt-3 overflow-x-auto w-full no-scrollbar">
                <button
                  className="chip text-xs inline-flex items-center gap-1.5 py-1.5 px-3 cursor-pointer shrink-0"
                  data-active={activeTab === "web" ? "true" : undefined}
                  onClick={() => setActiveTab("web")}
                  type="button"
                >
                  <GlobeIcon className="size-3.5" />
                  <span>Tous ({results.length})</span>
                </button>

                <button
                  className="chip text-xs inline-flex items-center gap-1.5 py-1.5 px-3 cursor-pointer shrink-0"
                  data-active={activeTab === "news" ? "true" : undefined}
                  onClick={() => setActiveTab("news")}
                  type="button"
                >
                  <NewspaperIcon className="size-3.5" />
                  <span>Actualités ({news.length})</span>
                </button>

                <button
                  className="chip text-xs inline-flex items-center gap-1.5 py-1.5 px-3 cursor-pointer shrink-0"
                  data-active={activeTab === "images" ? "true" : undefined}
                  onClick={() => setActiveTab("images")}
                  type="button"
                >
                  <ImageIcon className="size-3.5" />
                  <span>Images ({images.length})</span>
                </button>

                <button
                  className="chip text-xs inline-flex items-center gap-1.5 py-1.5 px-3 cursor-pointer shrink-0"
                  data-active={activeTab === "videos" ? "true" : undefined}
                  onClick={() => setActiveTab("videos")}
                  type="button"
                >
                  <VideoIcon className="size-3.5" />
                  <span>Vidéos ({videos.length})</span>
                </button>

                <button
                  className="chip text-xs inline-flex items-center gap-1.5 py-1.5 px-3 cursor-pointer shrink-0"
                  data-active={activeTab === "wikipedia" ? "true" : undefined}
                  onClick={() => setActiveTab("wikipedia")}
                  type="button"
                >
                  <BookIcon className="size-3.5" />
                  <span>Wikipédia ({wikipediaCount})</span>
                </button>

                {provider ? (
                  <span
                    className="chip ml-auto text-[10px] text-muted-foreground"
                    data-static="true"
                    title="Moteur ayant servi les résultats"
                  >
                    Source : {provider}
                  </span>
                ) : null}
              </div>
            </header>

            <main className="max-w-6xl mx-auto w-full p-4 sm:p-6 flex flex-col gap-6">
              {searchError ? (
                <div className="surface-card p-6 flex flex-col items-center justify-center gap-3 text-center border-destructive/40 bg-destructive/5">
                  <p className="text-sm font-semibold text-destructive">
                    {searchError}
                  </p>
                  <button
                    className="chip text-xs inline-flex items-center gap-1.5 py-1.5 px-3 cursor-pointer"
                    onClick={() => void runSearch()}
                    type="button"
                  >
                    <RotateCcwIcon className="size-3.5" />
                    <span>Réessayer la recherche</span>
                  </button>
                </div>
              ) : null}

              {(activeTab === "web" || activeTab === "wikipedia") &&
              !isLoading ? (
                <div className="flex flex-col gap-6">
                  {activeTab === "web" ? (
                    <SearchSummaryCard
                      hasCopiedSummary={hasCopiedSummary}
                      isSummaryLoading={isSummaryLoading}
                      onCopySummary={handleCopySummary}
                      onRefineSummary={handleRefineSummary}
                      onSendToChat={handleSendToChat}
                      onVote={handleVote}
                      summary={summary}
                      summaryLength={summaryLength}
                      summaryModel={summaryModel}
                      summaryReasoning={summaryReasoning}
                      summarySources={summarySources}
                      summarySubstituted={summarySubstituted}
                      vote={vote}
                    />
                  ) : null}

                  <SearchWebResults
                    activeTab={activeTab}
                    copiedUrl={copiedUrl}
                    domainFilter={domainFilter}
                    durationMs={durationMs}
                    filteredResults={filteredResults}
                    onCopyLink={handleCopyLink}
                    onRequestTargetSummary={handleRequestTargetSummary}
                    requestedCount={requestedCount}
                    setDomainFilter={setDomainFilter}
                    submittedQuery={submittedQuery}
                    truncated={truncated}
                    wikiFirst={wikiFirst}
                  />
                </div>
              ) : null}

              {activeTab === "news" && !isLoading ? (
                <SearchNewsView
                  copiedUrl={copiedUrl}
                  onCopyLink={handleCopyLink}
                  onRequestTargetSummary={handleRequestTargetSummary}
                  orderedNews={orderedNews}
                  submittedQuery={submittedQuery}
                />
              ) : null}

              {activeTab === "images" && !isLoading ? (
                <SearchImagesView
                  onCopyLink={handleCopyLink}
                  onRequestTargetSummary={handleRequestTargetSummary}
                  orderedImages={orderedImages}
                  submittedQuery={submittedQuery}
                />
              ) : null}

              {activeTab === "videos" && !isLoading ? (
                <SearchVideosView
                  onCopyLink={handleCopyLink}
                  onRequestTargetSummary={handleRequestTargetSummary}
                  orderedVideos={orderedVideos}
                  submittedQuery={submittedQuery}
                />
              ) : null}
            </main>
          </div>
        ) : (
          <SearchHomeLanding
            inputRef={inputRef}
            isLoading={isLoading}
            onKeyDown={handleKeyDown}
            onRunSearch={runSearch}
            query={query}
            setQuery={setQuery}
          />
        )}

        {portalReady
          ? createPortal(
              <SearchDrawerConversation
                followupInput={followupInput}
                hasCopiedDrawer={hasCopiedDrawer}
                onClose={handleCloseTargetConversation}
                onCopyDrawerContent={handleCopyDrawerContent}
                onFollowupInputChange={setFollowupInput}
                onModelChange={setSelectedModelId}
                onSendDrawerToChat={handleSendDrawerToChat}
                onSendFollowupMessage={handleSendFollowupMessage}
                selectedModelId={selectedModelId}
                targetConversation={targetConversation}
              />,
              document.body
            )
          : null}
      </div>
    </div>
  );
}
