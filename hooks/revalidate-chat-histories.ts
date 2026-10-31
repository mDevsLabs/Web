"use client";

import { useEffect } from "react";
import { mutate } from "swr";

/**
 * Les listes de conversations ne partagent pas la même clé SWR : la barre
 * latérale pagine `/api/history?limit=…`, Projets ajoute filtres et recherche.
 * Après une suppression, les deux doivent repartir de la première page, sinon
 * le curseur `ending_before` reste celui d'une ligne qui n'existe plus.
 */

const resets = new Set<() => void>();

export function registerChatHistoryReset(reset: () => void): () => void {
  resets.add(reset);
  return () => {
    resets.delete(reset);
  };
}

export function useChatHistoryReset(reset: () => void): void {
  useEffect(() => registerChatHistoryReset(reset), [reset]);
}

export function revalidateChatHistories(): Promise<unknown> {
  for (const reset of resets) {
    reset();
  }
  return mutate(
    (key) => typeof key === "string" && key.includes("/api/history")
  );
}
