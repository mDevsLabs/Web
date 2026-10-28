"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Historique des recherches récentes.
 *
 * L'interface ne connaît pas la base : elle lit `/api/mai-search/recent` et
 * ne fait qu'afficher. Le serveur décide de ce qui est visible, et le filtre
 * par compte y est appliqué — l'interface ne reçoit jamais la requête d'un
 * autre compte, même par une route malveillante.
 *
 * Le rechargement est MANUAL : l'historique ne bouge pas tout seul pendant
 * que l'utilisateur cherche. Il se recharge quand la page redevient visible
 * (l'utilisateur a peut-être cherché depuis un autre onglet) et après chaque
 * recherche.
 */
export type RecentSearch = {
  createdAt: string;
  id: string;
  query: string;
};

export function useRecentSearches() {
  const [recent, setRecent] = useState<RecentSearch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const reponse = await fetch("/api/mai-search/recent", {
        cache: "no-store",
      });
      if (!reponse.ok) {
        return;
      }
      const donnees = (await reponse.json().catch(() => null)) as {
        queries?: RecentSearch[];
      } | null;
      if (!mountedRef.current) {
        return;
      }
      setRecent(Array.isArray(donnees?.queries) ? donnees.queries : []);
    } catch {
      // L'historique est un confort : son absence ne doit pas faire échouer
      // la recherche en cours.
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Chargement au montage, puis à la reprise de l'onglet : la recherche a
  // pu être faite ailleurs. `visibilitychange` ne se déclenche pas à
  // l'ouverture, donc le premier appel est explicite.
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

  /**
   * Retire une recherche de l'historique.
   *
   * L'état local est mis à jour TOUT DE SUITE, avant la confirmation du
   * serveur : l'interface ne doit pas faire attendre un clic pour un
   * élément qui disparaît. Si le serveur refuse, un rechargement remet
   * la vérité en place.
   */
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

  /** Vide tout l'historique. */
  const clear = useCallback(async () => {
    setRecent([]);
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

  return { clear, forget, isLoading, recent, refresh };
}
