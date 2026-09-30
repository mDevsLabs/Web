// Formateurs d'affichage pour les données de compte (sidebars, cartes de chat).
// Miroirs légers des formateurs de app/(chat)/settings/page.tsx.

export function formatTokensFr(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n);
}

/**
 * Nombre compact français : « 388,2 M », « 12 k », « 940 ».
 *
 * `Intl.NumberFormat` en notation `compact` n'est pas utilisé ici : le rendu
 * varie selon la locale de données système (on obtient « 388M » sans espace, ou
 * « 388 MD » en environnement anglais), alors que ce formatage alimente des
 * KPI dont la largeur doit rester stable. Le calcul est donc explicite, et la
 * virgule vient de `toLocaleString("fr-FR")` — pas d'un `toFixed`, qui
 * produirait un point décimal.
 *
 * Sous 10 000, on garde le nombre entier : « 9 412 » se lit mieux et reste
 * court, alors qu'un « 9,4 k » fait gagner trois caractères pour rien.
 */
export function formatCompactFr(n: number): string {
  if (!Number.isFinite(n)) {
    return "0";
  }
  const abs = Math.abs(n);
  const compact = (value: number, unit: string) =>
    `${value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} ${unit}`;
  if (abs >= 1_000_000_000) {
    return compact(n / 1_000_000_000, "Md");
  }
  if (abs >= 1_000_000) {
    return compact(n / 1_000_000, "M");
  }
  if (abs >= 10_000) {
    return compact(n / 1000, "k");
  }
  return formatTokensFr(n);
}

/**
 * Durée en français, jusqu'à l'heure : « 2 h 33 min », « 45 min », « 8 s ».
 *
 * L'unité est choisie sur la plus grande grandeur non nulle, et les
 * fractions trop petites sont abandonnées : afficher « 2 h 33 min 0 s » serait
 * du bruit. Sous 10 secondes on arrondit à l'unité entière, parce que « 0,4 s »
 * dans un KPI est plus précis que lisible.
 */
export function formatDurationFr(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) {
    return "—";
  }
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 10) {
    return `${totalSeconds} s`;
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
  }
  if (minutes > 0) {
    return seconds >= 10 ? `${minutes} min ${seconds} s` : `${minutes} min`;
  }
  return `${seconds} s`;
}

/** Durée en jours, pour les séries d'activité : « 6 jours », « 1 jour ». */
export function formatDaysFr(days: number): string {
  if (!Number.isFinite(days) || days <= 0) {
    return "0 jour";
  }
  return days === 1 ? "1 jour" : `${days} jours`;
}

export function formatBytesFr(bytes: number) {
  if (!bytes || bytes === 0) {
    return "0 Mo";
  }
  const mb = bytes / (1024 * 1024);
  if (mb < 1000) {
    return `${mb.toFixed(1)} Mo`;
  }
  return `${(mb / 1024).toFixed(2)} Go`;
}

export function formatResetFr(dateStr?: string) {
  if (!dateStr) {
    return "Prochainement";
  }
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      month: "long",
      weekday: "long",
    }).format(d);
  } catch {
    return dateStr;
  }
}
