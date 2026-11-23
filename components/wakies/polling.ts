/**
 * Cadences de relève (polling) de Wakies, centralisées.
 *
 * Chaque relève est une invocation serverless : 5 s par onglet ouvert pesait
 * lourd sur les quotas. SWR met le polling en pause quand l'onglet est masqué
 * (sauf `refreshWhenHidden`), et relit à la reprise du focus
 * (`revalidateOnFocus`) : la fraîcheur perçue ne baisse pas.
 */

/**
 * Relève des données visibles (historique, amis, espace de travail…).
 *
 * Deux minutes, pas vingt secondes : chaque relève est une invocation
 * serverless ET une requête Neon. À 20 s, un onglet ouvert gardait le compute
 * éveillé en continu ; à 2 min, une fenêtre d'inactivité peut exister entre
 * deux relèves quand l'utilisateur ne fait rien.
 */
export const WAKIES_POLL_MS = 120_000;

/**
 * Relève des alertes quand l'onglet est masqué (notifications du navigateur).
 * Un onglet caché n'a besoin que d'être alerté, pas d'être frais.
 */
export const WAKIES_POLL_HIDDEN_MS = 300_000;

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
