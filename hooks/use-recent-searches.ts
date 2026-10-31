"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Historique des recherches.
 *
 * L'interface ne connaît pas la base : elle lit `/api/mai-search/recent` et
 * ne fait qu'afficher. Le serveur décide de ce qui est visible, et le filtre
 * par compte y est appliqué.
 *
 * Le rechargement est MANUAL. La première page se charge au montage et quand
 * l'onglet redevient visible. Les pages suivantes s'ajoutent sur demande.
 */
export type RecentSearch = {
  createdAt: string;
  hasSummary: boolean;
  id: string;
  pinned: boolean;
  query: string;
  title: string | null;
};

const PAGE = 40;

export function useRecentSearches() {
  const [recent, setRecent] = useState<RecentSearch[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const lirePage = useCallback(async (offset: number, remplacer: boolean) => {
    setIsLoading(true);
    try {
      const reponse = await fetch(
        `/api/mai-search/recent?limit=${PAGE}&offset=${offset}`,
        { cache: "no-store" }
      );
      if (!reponse.ok) {
        return;
      }
      const donnees = (await reponse.json().catch(() => null)) as {
        hasMore?: boolean;
        nextOffset?: number | null;
        queries?: RecentSearch[];
      } | null;
      if (!mountedRef.current) {
        return;
      }
      const page = Array.isArray(donnees?.queries) ? donnees.queries : [];
      setRecent((precedents) => (remplacer ? page : [...precedents, ...page]));
      setHasMore(donnees?.hasMore === true);
      setNextOffset(
        typeof donnees?.nextOffset === "number" ? donnees.nextOffset : null
      );
    } catch {
      // L'historique est un confort : son absence ne doit pas faire échouer
      // la recherche en cours.
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const refresh = useCallback(async () => {
    await lirePage(0, true);
  }, [lirePage]);

  const loadMore = useCallback(async () => {
    if (nextOffset === null) {
      return;
    }
    await lirePage(nextOffset, false);
  }, [lirePage, nextOffset]);

  useEffect(() => {
    void refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  const forget = useCallback(
    async (id: string) => {
      setRecent((precedents) =>
        precedents.filter((entree) => entree.id !== id)
      );
      try {
        await fetch("/api/mai-search/recent", {
          body: JSON.stringify({ id }),
          headers: { "Content-Type": "application/json" },
          method: "DELETE",
        });
      } catch {
        void refresh();
      }
    },
    [refresh]
  );

  const clear = useCallback(async () => {
    setRecent([]);
    setHasMore(false);
    setNextOffset(null);
    try {
      await fetch("/api/mai-search/recent", {
        body: JSON.stringify({ all: true }),
        headers: { "Content-Type": "application/json" },
        method: "DELETE",
      });
    } catch {
      void refresh();
    }
  }, [refresh]);

  const patch = useCallback(
    async (id: string, body: { pinned?: boolean; title?: string | null }) => {
      setRecent((precedents) =>
        precedents.map((entree) =>
          entree.id === id ? { ...entree, ...body } : entree
        )
      );
      try {
        const reponse = await fetch("/api/mai-search/recent", {
          body: JSON.stringify({ id, ...body }),
          headers: { "Content-Type": "application/json" },
          method: "PATCH",
        });
        if (!reponse.ok) {
          void refresh();
        }
      } catch {
        void refresh();
      }
    },
    [refresh]
  );

  const rename = useCallback(
    (id: string, title: string) => patch(id, { title }),
    [patch]
  );

  const pin = useCallback(
    async (id: string, pinned: boolean) => {
      await patch(id, { pinned });
      // L'ordre change : la première page est la vérité.
      await refresh();
    },
    [patch, refresh]
  );

  return {
    clear,
    forget,
    hasMore,
    isLoading,
    loadMore,
    pin,
    recent,
    refresh,
    rename,
  };
}
