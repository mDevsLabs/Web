/**
 * Formatage des dates affiché à l'utilisateur.
 *
 * `toLocaleString` sans option `timeZone` formate selon le fuseau du *runtime*. Dans
 * l'App Router, un composant client est rendu sur le serveur (UTC en production)
 * puis hydraté dans le navigateur (fuseau du visiteur) : les deux rendus divergent
 * et React signale une erreur d'hydratation. La divergence est discrète — souvent
 * quelques heures — mais elle se produit systématiquement pour les visiteurs dont
 * le fuseau n'est pas UTC.
 *
 * Le fuseau est donc épinglé. Le site est francophone (`<html lang="fr">`) et ses
 * quotas sont réinitialisés chaque nuit : `Europe/Paris` est la référence retenue.
 */

const DISPLAY_TIME_ZONE = "Europe/Paris";

function toDate(value: Date | string | number | null | undefined): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** `toLocaleDateString` avec fuseau épinglé. Retourne `fallback` si la date est invalide. */
export function formatDisplayDate(
  value: Date | string | number | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  },
  fallback = "—"
): string {
  const date = toDate(value);
  if (!date) return fallback;
  return date.toLocaleDateString("fr-FR", {
    ...options,
    timeZone: DISPLAY_TIME_ZONE,
  });
}

/** `toLocaleString` avec fuseau épinglé. Retourne `fallback` si la date est invalide. */
export function formatDisplayDateTime(
  value: Date | string | number | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  },
  fallback = "—"
): string {
  const date = toDate(value);
  if (!date) return fallback;
  return date.toLocaleString("fr-FR", {
    ...options,
    timeZone: DISPLAY_TIME_ZONE,
  });
}

/** `toLocaleTimeString` avec fuseau épinglé. */
export function formatDisplayTime(
  value: Date | string | number | null | undefined,
  options: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" },
  fallback = "—"
): string {
  const date = toDate(value);
  if (!date) return fallback;
  return date.toLocaleTimeString("fr-FR", {
    ...options,
    timeZone: DISPLAY_TIME_ZONE,
  });
}
