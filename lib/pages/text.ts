// Extraits et volume affichés. Le Markdown n'est pas interprété : on retire
// seulement les marqueurs les plus bruyants pour une ligne de liste.

export function countWords(content: string): number {
  const words = content.trim().match(/\S+/g);
  return words?.length ?? 0;
}

export function pageExcerpt(content: string, length = 160): string {
  const plain = content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`~\-[\]()!|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= length) {
    return plain;
  }
  return `${plain.slice(0, length - 1).trimEnd()}…`;
}

export type SelectionAnchor = {
  end: number;
  start: number;
};

/** Nombre d'occurrences littérales (éventuellement chevauchantes) de `needle`. */
export function countTextOccurrences(haystack: string, needle: string): number {
  if (!needle) {
    return 0;
  }
  let count = 0;
  let from = 0;
  let index = haystack.indexOf(needle, from);
  while (index !== -1) {
    count += 1;
    from = index + 1;
    index = haystack.indexOf(needle, from);
  }
  return count;
}

/**
 * Ancrage de la sélection dans le contenu Markdown.
 *
 * L'éditeur visuel ne connaît que des positions de document (TipTap), pas des
 * offsets Markdown : la sélection est donc localisée par son texte et le rang de
 * l'occurrence qui la précède dans le texte du document. Retourne null si le
 * texte sélectionné n'apparaît pas dans le contenu (sélection traversant des
 * marqueurs Markdown, par exemple) — l'appelant doit alors renoncer à cibler
 * une occurrence plutôt que de deviner (issue #52).
 */
export function findSelectionAnchor(
  content: string,
  selectedText: string,
  occurrencesBefore = 0
): SelectionAnchor | null {
  if (!selectedText) {
    return null;
  }
  let from = 0;
  for (let seen = 0; seen <= occurrencesBefore; seen += 1) {
    const index = content.indexOf(selectedText, from);
    if (index === -1) {
      return null;
    }
    if (seen === occurrencesBefore) {
      return { end: index + selectedText.length, start: index };
    }
    from = index + 1;
  }
  return null;
}
