// Formateurs d'affichage pour les données de compte (sidebars, cartes de chat).
// Miroirs légers des formateurs de app/(chat)/settings/page.tsx.

export function formatTokensFr(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n);
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
