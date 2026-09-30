// Libellés de dates de la carte de chaleur. Isolé du composant pour être
// testable sans DOM : la carte a une mécanique de placement non triviale
// (semaines complètes, colonnes, bornes), et c'est elle qui décide de l'alignement
// des libellés.

/** Lundi de la semaine calendaire contenant `date`, en UTC. */
export function weekStartOf(date: Date): Date {
  const copy = new Date(date.getTime());
  const day = (copy.getUTCDay() + 6) % 7;
  copy.setUTCDate(copy.getUTCDate() - day);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

/** `AAAA-MM-JJ` → « 12 janv. » (l'année est omise si elle est le référent). */
export function formatBucketLabel(
  bucket: string,
  includeYear: boolean
): string {
  const date = new Date(`${bucket}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return bucket;
  }
  const label = date
    .toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    })
    .replace(".", "");
  return includeYear ? `${label} ${date.getUTCFullYear()}` : label;
}
