/**
 * Cadences de relève (polling) de Wakies, centralisées.
 *
 * Chaque relève est une invocation serverless : 5 s par onglet ouvert pesait
 * lourd sur les quotas. SWR met le polling en pause quand l'onglet est masqué
 * (sauf `refreshWhenHidden`), et relit à la reprise du focus
 * (`revalidateOnFocus`) : la fraîcheur perçue ne baisse pas.
 */

/** Relève des données visibles (historique, amis, espace de travail…). */
export const WAKIES_POLL_MS = 20_000;

/** Relève des alertes quand l'onglet est masqué (notifications du navigateur). */
export const WAKIES_POLL_HIDDEN_MS = 60_000;

/** `refreshInterval` SWR : rapide si l'onglet est visible, lent sinon. */
export function wakiesAlertPollInterval(): number {
  if (
    typeof document !== "undefined" &&
    document.visibilityState !== "visible"
  ) {
    return WAKIES_POLL_HIDDEN_MS;
  }
  return WAKIES_POLL_MS;
}
