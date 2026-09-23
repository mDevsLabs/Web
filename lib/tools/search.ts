// Recherche et tri partagés par les trois panneaux de la page Outils
// (Plugins, MCP, Skills). La barre de recherche globale vit dans l'en-tête de
// la page ; chaque panneau reçoit la requête et filtre son propre contenu.

// Score de pertinence : correspondance exacte > préfixe > nom > description >
// champs secondaires. Les éléments sans correspondance ne sont pas notés
// (retournent -1) : le filtrage reste à la charge de l'appelant.
export function relevanceScore(
  query: string,
  fields: { primary: string; secondary?: string[]; tags?: string[] }
): number {
  const q = query.trim().toLowerCase();
  if (!q) {
    return 0;
  }
  const primary = fields.primary.toLowerCase();
  if (primary === q) {
    return 100;
  }
  if (primary.startsWith(q)) {
    return 80;
  }
  if (primary.includes(q)) {
    return 60;
  }
  const secondary = fields.secondary ?? [];
  for (let index = 0; index < secondary.length; index += 1) {
    const value = (secondary[index] ?? "").toLowerCase();
    if (value === q) {
      return 70 - index;
    }
    if (value.startsWith(q)) {
      return 50 - index;
    }
    if (value.includes(q)) {
      return 30 - index;
    }
  }
  for (const tag of fields.tags ?? []) {
    if (tag.toLowerCase().includes(q)) {
      return 10;
    }
  }
  return -1;
}

// Indique si un élément correspond à la requête (au moins un des champs).
export function matchesQuery(
  query: string,
  fields: { primary: string; secondary?: string[]; tags?: string[] }
): boolean {
  return relevanceScore(query, fields) >= 0;
}

// Trie par pertinence décroissante (0 quand la recherche est vide), puis
// alphabétiquement. `pinnedFirst` place les épinglés en tête (page Skills).
export function sortByRelevance<T>(
  items: T[],
  query: string,
  getFields: (item: T) => {
    primary: string;
    secondary?: string[];
    tags?: string[];
  },
  options: { pinnedFirst?: boolean; isPinned?: (item: T) => boolean } = {}
): T[] {
  const collator = new Intl.Collator("fr", { sensitivity: "base" });
  return [...items].sort((a, b) => {
    if (options.pinnedFirst && options.isPinned) {
      const pinnedA = options.isPinned(a) ? 1 : 0;
      const pinnedB = options.isPinned(b) ? 1 : 0;
      if (pinnedA !== pinnedB) {
        return pinnedB - pinnedA;
      }
    }
    const scoreA = relevanceScore(query, getFields(a));
    const scoreB = relevanceScore(query, getFields(b));
    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }
    return collator.compare(getFields(a).primary, getFields(b).primary);
  });
}
