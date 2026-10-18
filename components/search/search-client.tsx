"use client";

import {
  ArrowRightIcon,
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  GlobeIcon,
  ImageIcon,
  MessageCircleIcon,
  RotateCcwIcon,
  SearchIcon,
  SparklesIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  XIcon,
} from "@mdevs/icons";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import type { SearchImageHit, SearchWebHit } from "@/lib/search/you-client";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Dernières avancées en intelligence artificielle",
  "Nouveautés Next.js 16 et React 19",
  "TypeScript : astuces et bonnes pratiques",
  "Actualités spatiales et découvertes",
  "Technologies web éco-responsables",
];

export function SearchClient() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"web" | "images">("web");

  const [isLoading, setIsLoading] = useState(false);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [results, setResults] = useState<SearchWebHit[]>([]);
  const [images, setImages] = useState<SearchImageHit[]>([]);
  const [searchId, setSearchId] = useState<string | null>(null);
  const [provider, setProvider] = useState<string>("you.com");

  const [summary, setSummary] = useState("");
  const [summaryModel, setSummaryModel] = useState<string | null>(null);
  const [summaryLength, setSummaryLength] = useState<
    "normal" | "short" | "long"
  >("normal");
  const [vote, setVote] = useState<"good" | "bad" | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

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
      setSummary("");
      setSummaryModel(null);
      setVote(null);

      try {
        const res = await fetch("/api/mai-search", {
          body: JSON.stringify({ query: q, type: "all" }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });

        if (!res.ok) {
          throw new Error("Erreur lors de la recherche");
        }

        const data = await res.json();
        const searchResults: SearchWebHit[] = data.results || [];
        const searchImages: SearchImageHit[] = data.images || [];

        setResults(searchResults);
        setImages(searchImages);
        setSearchId(data.searchId || null);
        setProvider(data.provider || "you.com");

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

  // Vote Bien / Pas bien
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
      setHasCopied(true);
      toast.success("Résumé copié dans le presse-papiers !");
      setTimeout(() => setHasCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier.");
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

  const hasSearched = Boolean(submittedQuery);

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] bg-background text-foreground">
      {/* ─── Mode Initial (Centré style Google) ─── */}
      {hasSearched ? (
        /* ─── Mode Résultats (Barre en haut + Contenu) ─── */
        <div className="flex flex-col w-full">
          {/* En-tête / Barre de recherche supérieure */}
          <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/40 px-4 py-3 sm:px-6">
            <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-3 w-full">
              <div
                className="flex items-center gap-2 mr-2 cursor-pointer select-none"
                onClick={() => {
                  setSubmittedQuery("");
                  setQuery("");
                  setResults([]);
                  setImages([]);
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
                  className="mr-1.5 inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold hover:opacity-90 active:scale-95 cursor-pointer disabled:opacity-40"
                  disabled={!query.trim() || isLoading}
                  onClick={() => void handleSearch()}
                  type="button"
                >
                  {isLoading ? "Recherche..." : "Rechercher"}
                </button>
              </div>

              {/* Onglets de filtrage */}
              <div className="flex items-center gap-1 sm:ml-2 shrink-0">
                <button
                  className={cn(
                    "chip text-xs inline-flex items-center gap-1.5 py-1.5 px-3 cursor-pointer",
                    activeTab === "web" &&
                      "bg-foreground text-background font-medium"
                  )}
                  onClick={() => setActiveTab("web")}
                  type="button"
                >
                  <GlobeIcon className="size-3.5" />
                  <span>Tous</span>
                </button>
                <button
                  className={cn(
                    "chip text-xs inline-flex items-center gap-1.5 py-1.5 px-3 cursor-pointer",
                    activeTab === "images" &&
                      "bg-foreground text-background font-medium"
                  )}
                  onClick={() => setActiveTab("images")}
                  type="button"
                >
                  <ImageIcon className="size-3.5" />
                  <span>Images ({images.length})</span>
                </button>
              </div>
            </div>
          </header>

          {/* Corps des résultats */}
          <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col gap-6">
            {/* État de chargement initial */}
            {isLoading ? (
              <div className="flex flex-col gap-4 py-8">
                <div className="h-6 w-48 animate-pulse rounded bg-muted/60" />
                <div className="h-28 w-full animate-pulse rounded-2xl bg-muted/30" />
                <div className="h-20 w-3/4 animate-pulse rounded-xl bg-muted/30" />
                <div className="h-20 w-5/6 animate-pulse rounded-xl bg-muted/30" />
              </div>
            ) : null}

            {/* Onglet Images */}
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
                  images.map((img, i) => (
                    <a
                      className="group relative flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card/60 hover:border-foreground/30 transition-all hover:shadow-md"
                      href={img.page_url || img.image_url}
                      key={`${img.image_url}-${i}`}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <div className="relative aspect-video w-full overflow-hidden bg-muted/30">
                        <img
                          alt={img.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          src={img.thumbnail || img.image_url}
                        />
                      </div>
                      <div className="p-2.5 flex flex-col gap-1">
                        <span className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {img.title}
                        </span>
                        {img.page_url ? (
                          <span className="text-[10px] text-muted-foreground truncate">
                            {new URL(img.page_url).hostname}
                          </span>
                        ) : null}
                      </div>
                    </a>
                  ))
                )}
              </motion.div>
            ) : null}

            {/* Onglet Tous (Web + Résumé IA) */}
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
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-border/60 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors ml-1 cursor-pointer"
                        onClick={handleCopySummary}
                        type="button"
                      >
                        {hasCopied ? (
                          <CheckIcon className="size-3 text-success" />
                        ) : (
                          <CopyIcon className="size-3" />
                        )}
                        <span>{hasCopied ? "Copié" : "Copier"}</span>
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
                      {results.length} résultat{results.length > 1 ? "s" : ""}{" "}
                      trouvé{results.length > 1 ? "s" : ""}
                    </span>
                    <span className="text-[10px] uppercase font-mono">
                      Source : {provider}
                    </span>
                  </div>

                  {results.length === 0 ? (
                    <div className="surface-card p-8 text-center text-sm text-muted-foreground">
                      Aucun résultat web trouvé pour « {submittedQuery} ».
                    </div>
                  ) : (
                    results.map((item, index) => (
                      <motion.article
                        animate={{ opacity: 1, y: 0 }}
                        className="surface-card flex flex-col gap-1.5 p-4 sm:p-5 hover:border-foreground/30 transition-all hover:shadow-sm group"
                        initial={{ opacity: 0, y: 12 }}
                        key={`${item.url}-${index}`}
                        transition={{ delay: index * 0.04, duration: 0.25 }}
                      >
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {item.favicon_url ? (
                            <img
                              alt=""
                              className="size-3.5 rounded-sm object-contain"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display =
                                  "none";
                              }}
                              src={item.favicon_url}
                            />
                          ) : (
                            <GlobeIcon className="size-3.5" />
                          )}
                          <span className="truncate max-w-[280px] sm:max-w-md font-mono text-[11px]">
                            {new URL(item.url).hostname}
                          </span>
                          {item.page_age ? (
                            <span className="text-[10px] text-muted-foreground/60 ml-auto">
                              {item.page_age}
                            </span>
                          ) : null}
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
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </main>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-2xl mx-auto w-full">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 text-center mb-8"
            initial={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20 shadow-sm">
                <SearchIcon className="size-6" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                mAI <span className="text-primary">Search</span>
              </h1>
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              Moteur de recherche web et d'images instantané propulsé par
              You.com et synthétisé par votre IA.
            </p>
          </motion.div>

          <motion.div
            animate={{ opacity: 1, scale: 1 }}
            className="w-full relative"
            initial={{ opacity: 0, scale: 0.98 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <div className="relative flex items-center w-full rounded-2xl border border-border/70 bg-card/80 backdrop-blur-md shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 hover:border-foreground/30">
              <SearchIcon className="size-5 text-muted-foreground ml-4 shrink-0" />
              <input
                aria-label="Recherche mAI"
                className="w-full bg-transparent px-3 py-4 text-sm sm:text-base outline-none placeholder:text-muted-foreground/60"
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
                className="mr-2 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs sm:text-sm font-semibold transition-all hover:opacity-90 active:scale-95 shadow-sm cursor-pointer disabled:opacity-40"
                disabled={!query.trim() || isLoading}
                onClick={() => void handleSearch()}
                type="button"
              >
                Rechercher
              </button>
            </div>
          </motion.div>

          {/* Suggestions rapides */}
          <motion.div
            animate={{ opacity: 1 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-2 max-w-lg"
            initial={{ opacity: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <span className="text-xs text-muted-foreground/80 mr-1 flex items-center gap-1">
              <SparklesIcon className="size-3 text-primary" /> Suggestions :
            </span>
            {SUGGESTIONS.map((item) => (
              <button
                className="chip text-[11px] hover:border-foreground/30 transition-all cursor-pointer"
                key={item}
                onClick={() => {
                  setQuery(item);
                  void handleSearch(item);
                }}
                type="button"
              >
                {item}
              </button>
            ))}
          </motion.div>
        </div>
      )}
    </div>
  );
}
