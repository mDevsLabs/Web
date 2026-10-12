"use client";

// SWR associe chaque réponse à sa requête : une réponse ancienne ne remplace
// jamais les résultats de la saisie courante, même après fermeture de la palette.
import { useEffect, useState } from "react";
import useSWR from "swr";
import { readJson } from "@/lib/client/read-json";

export function useQuickSearch<T>(query: string, open: boolean, limit: number) {
  const normalizedQuery = query.trim();
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => setDebouncedQuery(normalizedQuery), 200);
    return () => clearTimeout(timer);
  }, [normalizedQuery, open]);

  const ready = open && normalizedQuery.length >= 2;
  const current = ready && normalizedQuery === debouncedQuery;
  const { data, error, isLoading, isValidating, mutate } = useSWR<T>(
    current
      ? `/api/search?q=${encodeURIComponent(normalizedQuery)}&limit=${limit}`
      : null,
    readJson<T>,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );
  return {
    data: current ? data : undefined,
    error: current ? error : undefined,
    loading: ready && (!current || (isLoading && !error)),
    // SWR affiche l'erreur ; le bouton de reprise ne doit pas en plus produire
    // une promesse rejetée non gérée lorsque la panne persiste.
    retry: () => mutate().catch(() => undefined),
    retrying: isValidating,
  };
}
