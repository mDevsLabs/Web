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
