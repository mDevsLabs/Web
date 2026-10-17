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

/**
 * Poids de fichier en unités françaises : « 388 Ko », « 1,4 Mo ».
 *
 * Volontairement distinct de `formatBytesFr` (`lib/account/format.ts`), réglé
 * pour les quotas de compte : il démarre au mégaoctet et arrondit avec `toFixed`,
 * ce qui affiche « 0.4 Mo » pour un article de presse de 388 Ko. Ici le poids
 * réel du fichier est montré tel quel sous le bouton de téléchargement, donc la
 * virgule vient de `toLocaleString("fr-FR")` et l'unité monte jusqu'à l'octet.
 * Renvoie une chaîne vide si la taille est inconnue : l'appelant omet alors
 * la mention plutôt que d'afficher « 0 Ko ».
 */
export function formatFileSizeFr(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "";
  }
  const units = ["o", "Ko", "Mo", "Go"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const rendered =
    unit === 0
      ? value.toLocaleString("fr-FR")
      : value.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
  return `${rendered} ${units[unit]}`;
}
