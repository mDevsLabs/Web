"use client";

import { ExternalLinkIcon, SearchIcon, XIcon } from "@mdevs/icons";
import { motion } from "framer-motion";
import type React from "react";
import { HomeTrends } from "@/components/search/search-home-trends";
import { isSearchableQuery, looksLikeUrl } from "@/lib/search/query";

export interface SearchHomeLandingProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  isLoading: boolean;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onRunSearch: (override?: string) => Promise<void> | void;
  query: string;
  setQuery: (query: string) => void;
}

export function SearchHomeLanding({
  query,
  setQuery,
  isLoading,
  onKeyDown,
  inputRef,
  onRunSearch,
}: SearchHomeLandingProps) {
  return (
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
          Moteur de recherche web, actualités, vidéos et images instantané,
          synthétisé par votre intelligence artificielle mAI.
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
            onKeyDown={onKeyDown}
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
            disabled={!isSearchableQuery(query) || isLoading}
            onClick={() => void onRunSearch()}
            type="button"
          >
            Rechercher
          </button>
        </div>
      </motion.div>

      <HomeTrends
        onPick={(suggestion) => {
          setQuery(suggestion);
          void onRunSearch(suggestion);
        }}
      />

      {/* ─── Raccourci d'adresse ─── */}
      {looksLikeUrl(query) ? (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-3xl mt-4"
          initial={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.2 }}
        >
          <div className="surface-muted flex flex-wrap items-center justify-between gap-3 p-3 text-xs">
            <span className="text-muted-foreground">
              Cette saisie est une adresse. L'ouvrir directement évite une
              recherche qui ne renverrait que des pages « à propos » de cette
              adresse.
            </span>
            <a
              className="inline-flex items-center gap-1.5 rounded-lg bg-foreground text-background px-3 py-1.5 text-xs font-semibold hover:opacity-90 active:scale-95 transition-all"
              href={
                query.trim().startsWith("http")
                  ? query.trim()
                  : `https://${query.trim()}`
              }
              rel="noopener noreferrer"
              target="_blank"
            >
              <span>Ouvrir l'adresse</span>
              <ExternalLinkIcon className="size-3" />
            </a>
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}
