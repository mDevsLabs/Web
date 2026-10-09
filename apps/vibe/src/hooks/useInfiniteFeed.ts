/**
 * useInfiniteFeed — scroll infini avec curseur côté serveur.
 * Gère le premier chargement, les pages suivantes via une sentinelle
 * IntersectionObserver, la garde anti-doublon et les erreurs.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseInfiniteFeedOptions<T> {
  /** Charge une page : reçoit le curseur courant (undefined = première page). */
  fetchPage: (cursor?: string) => Promise<{ items: T[]; nextCursor?: string | null }>;
  /** Dépendances qui réinitialisent le flux (onglet, filtre…). */
  resetKey?: string | number | null;
  /** Désactive le chargement automatique (ex : onglet non actif). */
  enabled?: boolean;
}

export function useInfiniteFeed<T extends { id?: string | number }>({
  fetchPage,
  resetKey,
  enabled = true,
}: UseInfiniteFeedOptions<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const cursorRef = useRef<string | undefined>(undefined);
  const hasMoreRef = useRef(true);
  const inFlightRef = useRef(false);
  const fetchPageRef = useRef(fetchPage);

  // Synchronisation de la dernière version de fetchPage sans relancer le flux
  useEffect(() => {
    fetchPageRef.current = fetchPage;
  }, [fetchPage]);

  const load = useCallback(async (cursor?: string, isInitial = false) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    if (isInitial) setIsLoading(true);
    else setIsLoadingMore(true);
    setError(null);
    try {
      const res = await fetchPageRef.current(cursor);
      setItems((prev) => {
        if (isInitial) return res.items;
        // Garde anti-doublon (posts éventuellement rejoués par le rang)
        const seen = new Set(prev.map((p) => String(p.id)));
        return [...prev, ...res.items.filter((p) => !seen.has(String(p.id)))];
      });
      cursorRef.current = res.nextCursor || undefined;
      hasMoreRef.current = Boolean(res.nextCursor);
      setHasMore(Boolean(res.nextCursor));
    } catch (err: any) {
      setError(err?.message || 'Impossible de charger le fil.');
    } finally {
      inFlightRef.current = false;
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  // (Re)chargement initial à chaque changement de resetKey
  useEffect(() => {
    if (!enabled) return;
    cursorRef.current = undefined;
    hasMoreRef.current = true;
    setHasMore(true);
    load(undefined, true);
  }, [resetKey, enabled, load]);

  const loadMore = useCallback(() => {
    if (!enabled || !hasMoreRef.current || inFlightRef.current || isLoading) return;
    load(cursorRef.current, false);
  }, [enabled, isLoading, load]);

  // Sentinelle : charge la page suivante quand elle devient visible
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !enabled) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadMore();
      },
      { rootMargin: '800px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled, loadMore]);

  const refresh = useCallback(() => {
    cursorRef.current = undefined;
    hasMoreRef.current = true;
    setHasMore(true);
    return load(undefined, true);
  }, [load]);

  const prependItems = useCallback((newItems: T[]) => {
    setItems((prev) => {
      const seen = new Set(prev.map((p) => String(p.id)));
      return [...newItems.filter((p) => !seen.has(String(p.id))), ...prev];
    });
  }, []);

  const removeItem = useCallback((id: string | number) => {
    setItems((prev) => prev.filter((p) => String(p.id) !== String(id)));
  }, []);

  return {
    items,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    sentinelRef,
    refresh,
    prependItems,
    removeItem,
  };
}
