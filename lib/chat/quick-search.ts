// La palette affiche les correspondances du serveur dans la catégorie choisie.
export type QuickSearchFilter =
  | "all"
  | "chats"
  | "messages"
  | "projects"
  | "files";

export function countQuickSearchResults(
  results: Record<Exclude<QuickSearchFilter, "all">, readonly unknown[]>,
  filter: QuickSearchFilter
): number {
  return filter === "all"
    ? Object.values(results).reduce((count, items) => count + items.length, 0)
    : results[filter].length;
}
