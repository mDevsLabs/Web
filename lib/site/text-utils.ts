export interface DocMetadata {
  category: string;
  content: string;
  description: string;
  order: number;
  slug: string;
  title: string;
}

export function normalizeText(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
