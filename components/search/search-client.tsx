"use client";

import {
  ArrowRightIcon,
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  GlobeIcon,
  ImageIcon,
  MessageCircleIcon,
  NewspaperIcon,
  RotateCcwIcon,
  SearchIcon,
  Share2Icon,
  SparklesIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  VideoIcon,
  XIcon,
} from "@mdevs/icons";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import type {
  SearchImageHit,
  SearchNewsHit,
  SearchVideoHit,
  SearchWebHit,
} from "@/lib/search/you-client";
import { cn } from "@/lib/utils";

type SearchTab = "web" | "news" | "images" | "videos";

export function SearchClient() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchTab>("web");

  const [isLoading, setIsLoading] = useState(false);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [results, setResults] = useState<SearchWebHit[]>([]);
  const [images, setImages] = useState<SearchImageHit[]>([]);
  const [news, setNews] = useState<SearchNewsHit[]>([]);
  const [videos, setVideos] = useState<SearchVideoHit[]>([]);
  const [searchId, setSearchId] = useState<string | null>(null);

  const [summary, setSummary] = useState("");
  const [summaryModel, setSummaryModel] = useState<string | null>(null);
  const [summaryLength, setSummaryLength] = useState<
    "normal" | "short" | "long"
  >("normal");
  const [vote, setVote] = useState<"good" | "bad" | null>(null);
  const [hasCopiedSummary, setHasCopiedSummary] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Visionneuse Lightbox pour les images
  const [selectedImage, setSelectedImage] = useState<SearchImageHit | null>(null);

  // Filtre par domaine optionnel
  const [domainFilter, setDomainFilter] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Focus initial sur la barre de recherche
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Déclenchement du streaming de résumé
  const fetchSummary = useCallback(
    async (
      searchQuery: string,
      currentSearchId: string | null,
      currentResults: SearchWebHit[],
      length: "normal" | "short" | "long" = "normal"
    ) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsSummaryLoading(true);
      setSummary("");
      setVote(null);

      try {
        const response = await fetch("/api/mai-search/summary", {
          body: JSON.stringify({
            length,
            query: searchQuery,
            searchId: currentSearchId,
            searchResults: currentResults,
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Impossible de générer le résumé.");
        }

        const modelHeader = response.headers.get("X-Model-Id");
        if (modelHeader) setSummaryModel(modelHeader);

        const reader = response.body?.getReader();
        if (!reader) return;

        const decoder = new TextDecoder();
        let done = false;
        let textAccumulator = "";

        while (!done) {
          const { done: readerDone, value } = await reader.read();
          done = readerDone;
          if (value) {
            const chunk = decoder.decode(value, { stream: !done });
            textAccumulator += chunk;
            setSummary(textAccumulator);
          }
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("[SearchClient] Erreur résumé:", err);
          setSummary(
            "Le résumé IA n'a pas pu être finalisé. Vous pouvez réessayer ci-dessous."
          );
        }
      } finally {
        setIsSummaryLoading(false);
      }
    },
    []
  );

  // Exécution de la recherche principale
  const handleSearch = useCallback(
    async (overrideQuery?: string) => {
      const q = (overrideQuery ?? query).trim();
      if (!q) return;

      setSubmittedQuery(q);
      setIsLoading(true);
      setResults([]);
      setImages([]);
      setNews([]);
      setVideos([]);
      setSummary("");
      setSummaryModel(null);
      setVote(null);
      setDomainFilter(null);

      try {
        const res = await fetch("/api/mai-search", {
          body: JSON.stringify({ count: 25, query: q, type: "all" }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });

        if (!res.ok) {
          throw new Error("Erreur lors de la recherche");
        }

        const data = await res.json();
        const searchResults: SearchWebHit[] = data.results || [];
        const searchImages: SearchImageHit[] = data.images || [];
        const searchNews: SearchNewsHit[] = data.news || [];
        const searchVideos: SearchVideoHit[] = data.videos || [];

        setResults(searchResults);
        setImages(searchImages);
        setNews(searchNews);
        setVideos(searchVideos);
        setSearchId(data.searchId || null);

        // Lancer immédiatement la synthèse IA en parallèle
        void fetchSummary(q, data.searchId || null, searchResults, "normal");
      } catch (err: any) {
        toast.error(err.message || "Impossible d'effectuer la recherche.");
      } finally {
        setIsLoading(false);
      }
    },
    [query, fetchSummary]
  );

  // Soumission via Entrée
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void handleSearch();
    }
  };

  // Vote
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
        // Silencieux
      }
    }
  };

  // Copier le résumé
  const handleCopySummary = async () => {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary);
      setHasCopiedSummary(true);
      toast.success("Résumé copié dans le presse-papiers !");
      setTimeout(() => setHasCopiedSummary(false), 2000);
    } catch {
      toast.error("Impossible de copier.");
    }
  };

  // Copier un lien
  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      toast.success("Lien copié !");
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch {
      toast.error("Impossible de copier le lien.");
    }
  };

  // Partager la recherche
  const handleShareSearch = async () => {
    const shareUrl = `${window.location.origin}/search?q=${encodeURIComponent(submittedQuery)}`;
    if (navigator.share) {
      try {
        await navigator.share({
          text: `Recherche sur mAI Search : ${submittedQuery}`,
          title: `mAI Search — ${submittedQuery}`,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback presse-papier
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Lien de la recherche copié dans le presse-papiers !");
    } catch {
      toast.error("Impossible de partager le lien.");
    }
  };

  // Actions d'affinage du résumé
  const handleRefineSummary = (length: "short" | "long" | "normal") => {
    setSummaryLength(length);
    void fetchSummary(submittedQuery, searchId, results, length);
  };

  // Redirection vers le Chat mAI avec pré-remplissage
  const handleSendToChat = () => {
    if (!submittedQuery) return;
    const prefilled = `Je faisais une recherche sur "${submittedQuery}".\n\nVoici la synthèse trouvée :\n${summary || "Recherche effectuée sur mAI Search."}\n\nPeux-tu approfondir ce sujet et m'en dire plus ?`;

    try {
      sessionStorage.setItem("mai_pending_chat_prompt", prefilled);
    } catch {}

    router.push(`/?prompt=${encodeURIComponent(prefilled)}`);
  };

  // Filtrage par domaine
  const filteredResults = useMemo(() => {
    if (!domainFilter) return results;
    return results.filter((r) => {
      try {
        return new URL(r.url).hostname.includes(domainFilter);
      } catch {
        return true;
      }
    });
  }, [results, domainFilter]);

  const hasSearched = Boolean(submittedQuery);

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] bg-background text-foreground">
      {/* ─── Mode Résultats (Barre en haut + Contenu) ─── */}
      {hasSearched ? (
        <div className="flex flex-col w-full">
          {/* En-tête / Barre de recherche supérieure élargie */}
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
                  disabled={!query.trim() || isLoading}
                  onClick={() => void handleSearch()}
                  type="button"
                >
                  {isLoading ? "Recherche..." : "Rechercher"}
                </button>
              </div>

              {/* Bouton Partager la recherche */}
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

            {/* Onglets de filtrage élargis (Tous, Actualités, Images, Vidéos) */}
            <div className="max-w-6xl mx-auto flex items-center gap-1.5 pt-3 overflow-x-auto w-full no-scrollbar">
              <button
                className={cn(
                  "chip text-xs inline-flex items-center gap-1.5 py-1.5 px-3 cursor-pointer shrink-0",
                  activeTab === "web" && "bg-foreground text-background font-medium"
                )}
                onClick={() => setActiveTab("web")}
                type="button"
              >
                <GlobeIcon className="size-3.5" />
                <span>Tous ({results.length})</span>
              </button>

              <button
                className={cn(
                  "chip text-xs inline-flex items-center gap-1.5 py-1.5 px-3 cursor-pointer shrink-0",
                  activeTab === "news" && "bg-foreground text-background font-medium"
                )}
                onClick={() => setActiveTab("news")}
                type="button"
              >
                <NewspaperIcon className="size-3.5" />
                <span>Actualités ({news.length})</span>
              </button>

              <button
                className={cn(
                  "chip text-xs inline-flex items-center gap-1.5 py-1.5 px-3 cursor-pointer shrink-0",
                  activeTab === "images" && "bg-foreground text-background font-medium"
                )}
                onClick={() => setActiveTab("images")}
                type="button"
              >
                <ImageIcon className="size-3.5" />
                <span>Images ({images.length})</span>
              </button>

              <button
                className={cn(
                  "chip text-xs inline-flex items-center gap-1.5 py-1.5 px-3 cursor-pointer shrink-0",
                  activeTab === "videos" && "bg-foreground text-background font-medium"
                )}
                onClick={() => setActiveTab("videos")}
                type="button"
              >
                <VideoIcon className="size-3.5" />
                <span>Vidéos ({videos.length})</span>
              </button>

              {domainFilter ? (
                <div className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-medium shrink-0">
                  <span>Site : {domainFilter}</span>
                  <button
                    onClick={() => setDomainFilter(null)}
                    type="button"
                    className="hover:opacity-70 p-0.5"
                  >
                    <XIcon className="size-3" />
                  </button>
                </div>
              ) : null}
            </div>
          </header>

          {/* Corps des résultats */}
          <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col gap-6">
            {/* État de chargement initial */}
            {isLoading ? (
              <div className="flex flex-col gap-4 py-8">
                <div className="h-6 w-48 animate-pulse rounded bg-muted/60" />
                <div className="h-28 w-full animate-pulse rounded-2xl bg-muted/30" />
                <div className="h-20 w-3/4 animate-pulse rounded-xl bg-muted/30" />
                <div className="h-20 w-5/6 animate-pulse rounded-xl bg-muted/30" />
              </div>
            ) : null}

            {/* ─── Onglet Tous (Web + Synthèse mAI) ─── */}
            {activeTab === "web" && !isLoading ? (
              <div className="flex flex-col gap-6">
                {/* ─── Carte Résumé IA ─── */}
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
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono font-medium">
                          {summaryModel}
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
                        onClick={() => handleRefineSummary("short")}
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
                        onClick={() => handleRefineSummary("long")}
                        title="Synthèse détaillée"
                        type="button"
                      >
                        Plus long
                      </button>
                      <button
                        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => handleRefineSummary("normal")}
                        title="Réessayer"
                        type="button"
                      >
                        <RotateCcwIcon className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Contenu du résumé markdown */}
                  <div className="text-sm leading-relaxed text-foreground/90">
                    {summary ? (
                      <div className="prose dark:prose-invert max-w-none text-sm">
                        <Streamdown>{summary}</Streamdown>
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

                  {/* Barre d'actions sous le résumé */}
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
                        onClick={() => void handleVote("good")}
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
                        onClick={() => void handleVote("bad")}
                        type="button"
                      >
                        <ThumbsDownIcon className="size-3" />
                        <span>Pas bien</span>
                      </button>

                      <button
                        aria-label="Copier le résumé"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border/60 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors ml-1 cursor-pointer"
                        onClick={handleCopySummary}
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
                      onClick={handleSendToChat}
                      type="button"
                    >
                      <MessageCircleIcon className="size-3.5" />
                      <span>Continuer dans le Chat mAI</span>
                      <ArrowRightIcon className="size-3" />
                    </button>
                  </div>
                </motion.section>

                {/* ─── Liste des résultats Web ─── */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                    <span>
                      {filteredResults.length} résultat{filteredResults.length > 1 ? "s" : ""} trouvé{filteredResults.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  {filteredResults.length === 0 ? (
                    <div className="surface-card p-8 text-center text-sm text-muted-foreground">
                      Aucun résultat web trouvé pour « {submittedQuery} ».
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
                          className="surface-card flex flex-col gap-2 p-4 sm:p-5 hover:border-foreground/30 transition-all hover:shadow-sm group"
                          initial={{ opacity: 0, y: 12 }}
                          key={`${item.url}-${index}`}
                          transition={{ delay: index * 0.03, duration: 0.25 }}
                        >
                          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2 min-w-0">
                              {item.favicon_url ? (
                                <img
                                  alt=""
                                  className="size-4 rounded-sm object-contain shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = "none";
                                  }}
                                  referrerPolicy="no-referrer"
                                  src={item.favicon_url}
                                />
                              ) : (
                                <GlobeIcon className="size-4 shrink-0" />
                              )}
                              <button
                                onClick={() => setDomainFilter(hostname)}
                                title={`Filtrer par ${hostname}`}
                                type="button"
                                className="truncate font-mono text-[11px] hover:text-foreground text-left"
                              >
                                {hostname}
                              </button>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {item.page_age ? (
                                <span className="text-[10px] text-muted-foreground/70">
                                  {item.page_age}
                                </span>
                              ) : null}
                              <button
                                aria-label="Copier le lien"
                                className="p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                onClick={() => handleCopyLink(item.url)}
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
              </div>
            ) : null}

            {/* ─── Onglet Actualités (News) ─── */}
            {activeTab === "news" && !isLoading ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                  <span>
                    {news.length} article{news.length > 1 ? "s" : ""} d'actualité trouvé{news.length > 1 ? "s" : ""}
                  </span>
                </div>

                {news.length === 0 ? (
                  <div className="surface-card p-8 text-center text-sm text-muted-foreground">
                    Aucune actualité trouvée pour « {submittedQuery} ».
                  </div>
                ) : (
                  news.map((item, index) => {
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
                        className="surface-card flex flex-col gap-2 p-4 sm:p-5 hover:border-foreground/30 transition-all hover:shadow-sm group"
                        initial={{ opacity: 0, y: 12 }}
                        key={`${item.url}-${index}`}
                        transition={{ delay: index * 0.03, duration: 0.25 }}
                      >
                        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2 min-w-0">
                            {item.favicon_url ? (
                              <img
                                alt=""
                                className="size-4 rounded-sm object-contain shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                                referrerPolicy="no-referrer"
                                src={item.favicon_url}
                              />
                            ) : (
                              <NewspaperIcon className="size-4 shrink-0 text-primary" />
                            )}
                            <span className="font-semibold text-[11px] text-foreground/80">
                              {domain}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {item.page_age ? (
                              <span className="text-[10px] text-muted-foreground/70">
                                {item.page_age}
                              </span>
                            ) : null}
                            <button
                              aria-label="Copier le lien"
                              className="p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                              onClick={() => handleCopyLink(item.url)}
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
            ) : null}

            {/* ─── Onglet Images avec Lightbox & Visualisation Source ─── */}
            {activeTab === "images" && !isLoading ? (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
                initial={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
              >
                {images.length === 0 ? (
                  <p className="col-span-full text-center py-12 text-sm text-muted-foreground">
                    Aucune image trouvée pour « {submittedQuery} ».
                  </p>
                ) : (
                  images.map((img, i) => {
                    let domain = "";
                    try {
                      domain = new URL(img.page_url || img.image_url).hostname;
                    } catch {}

                    return (
                      <div
                        className="group relative flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card/60 hover:border-foreground/30 transition-all hover:shadow-md cursor-pointer"
                        key={`${img.image_url}-${i}`}
                        onClick={() => setSelectedImage(img)}
                      >
                        <div className="relative aspect-video w-full overflow-hidden bg-muted/30 flex items-center justify-center">
                          <img
                            alt={img.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.style.display = "none";
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = "flex";
                            }}
                            referrerPolicy="no-referrer"
                            src={img.thumbnail || img.image_url}
                          />
                          <div
                            className="hidden size-full items-center justify-center p-3 text-center flex-col gap-1.5 bg-muted/40"
                          >
                            <ImageIcon className="size-6 text-muted-foreground/60" />
                            <span className="text-[10px] text-muted-foreground line-clamp-2">
                              {img.title}
                            </span>
                          </div>
                        </div>
                        <div className="p-2.5 flex flex-col gap-1">
                          <span className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                            {img.title}
                          </span>
                          {domain ? (
                            <span className="text-[10px] text-muted-foreground truncate">
                              {domain}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                )}
              </motion.div>
            ) : null}

            {/* ─── Onglet Vidéos ─── */}
            {activeTab === "videos" && !isLoading ? (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
                initial={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
              >
                {videos.length === 0 ? (
                  <p className="col-span-full text-center py-12 text-sm text-muted-foreground">
                    Aucune vidéo trouvée pour « {submittedQuery} ».
                  </p>
                ) : (
                  videos.map((vid, i) => (
                    <a
                      className="group flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card/60 hover:border-foreground/30 transition-all hover:shadow-md"
                      href={vid.page_url}
                      key={`${vid.page_url}-${i}`}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <div className="relative aspect-video w-full overflow-hidden bg-muted/40 flex items-center justify-center">
                        {vid.thumbnail ? (
                          <img
                            alt={vid.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            src={vid.thumbnail}
                          />
                        ) : (
                          <VideoIcon className="size-8 text-muted-foreground/60" />
                        )}
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <div className="size-10 rounded-full bg-background/90 text-foreground flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <VideoIcon className="size-5 text-primary ml-0.5" />
                          </div>
                        </div>
                        {vid.platform ? (
                          <span className="absolute bottom-2 right-2 text-[10px] font-semibold bg-background/90 text-foreground px-1.5 py-0.5 rounded shadow">
                            {vid.platform}
                          </span>
                        ) : null}
                      </div>
                      <div className="p-3 flex flex-col gap-1">
                        <span className="text-xs font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                          {vid.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <ExternalLinkIcon className="size-2.5" />
                          Ouvrir la vidéo
                        </span>
                      </div>
                    </a>
                  ))
                )}
              </motion.div>
            ) : null}
          </main>
        </div>
      ) : (
        /* ─── Mode Initial (Centré, barre plus large, sans suggestions) ─── */
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 max-w-4xl mx-auto w-full">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 text-center mb-8"
            initial={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-3">
              <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20 shadow-sm">
                <SearchIcon className="size-7" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
                mAI <span className="text-primary">Search</span>
              </h1>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl leading-relaxed">
              Moteur de recherche web, actualités et images instantané, synthétisé par votre intelligence artificielle mAI.
            </p>
          </motion.div>

          <motion.div
            animate={{ opacity: 1, scale: 1 }}
            className="w-full relative max-w-3xl"
            initial={{ opacity: 0, scale: 0.98 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <div className="relative flex items-center w-full rounded-2xl border border-border/70 bg-card/80 backdrop-blur-md shadow-md transition-all focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 hover:border-foreground/30 p-1">
              <SearchIcon className="size-5 text-muted-foreground ml-4 shrink-0" />
              <input
                aria-label="Recherche mAI"
                className="w-full bg-transparent px-3.5 py-4 text-base sm:text-lg outline-none placeholder:text-muted-foreground/60"
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Rechercher sur le web avec mAI..."
                ref={inputRef}
                type="text"
                value={query}
              />
              {query ? (
                <button
                  aria-label="Effacer"
                  className="p-2 text-muted-foreground hover:text-foreground mr-1 rounded-lg transition-colors cursor-pointer"
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  type="button"
                >
                  <XIcon className="size-4" />
                </button>
              ) : null}
              <button
                className="mr-2 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold transition-all hover:opacity-90 active:scale-95 shadow-sm cursor-pointer disabled:opacity-40"
                disabled={!query.trim() || isLoading}
                onClick={() => void handleSearch()}
                type="button"
              >
                Rechercher
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ─── Modale Lightbox d'Image (Agrandissement + Visiter le site) ─── */}
      <AnimatePresence>
        {selectedImage ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              className="relative max-w-4xl w-full max-h-[90vh] rounded-2xl border border-border/80 bg-card shadow-2xl flex flex-col overflow-hidden"
              exit={{ opacity: 0, scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* En-tête Lightbox */}
              <div className="flex items-center justify-between p-4 border-b border-border/40 bg-muted/20">
                <div className="flex items-center gap-2 min-w-0 pr-4">
                  <span className="font-semibold text-sm text-foreground truncate">
                    {selectedImage.title}
                  </span>
                </div>
                <button
                  aria-label="Fermer"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
                  onClick={() => setSelectedImage(null)}
                  type="button"
                >
                  <XIcon className="size-4" />
                </button>
              </div>

              {/* Image en grand */}
              <div className="relative flex-1 bg-black/10 dark:bg-black/30 flex items-center justify-center p-4 min-h-[300px] max-h-[60vh] overflow-hidden">
                <img
                  alt={selectedImage.title}
                  className="max-h-full max-w-full object-contain rounded-lg shadow-sm"
                  referrerPolicy="no-referrer"
                  src={selectedImage.image_url || selectedImage.thumbnail}
                />
              </div>

              {/* Pied de Lightbox : Lien vers le site source et actions */}
              <div className="p-4 border-t border-border/40 bg-card flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground truncate w-full sm:w-auto">
                  <GlobeIcon className="size-4 shrink-0" />
                  <span className="truncate max-w-[280px]">
                    {selectedImage.page_url
                      ? new URL(selectedImage.page_url).hostname
                      : "Source web"}
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    className="chip text-xs inline-flex items-center gap-1.5 py-1.5 px-3 cursor-pointer"
                    onClick={() => handleCopyLink(selectedImage.page_url || selectedImage.image_url)}
                    type="button"
                  >
                    <CopyIcon className="size-3.5" />
                    <span>Copier le lien</span>
                  </button>

                  <a
                    className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm cursor-pointer"
                    href={selectedImage.page_url || selectedImage.image_url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <span>Visiter le site</span>
                    <ExternalLinkIcon className="size-3.5" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
