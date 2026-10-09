/**
 * Types partagés par la route de statut et son affichage client.
 * Le fournisseur Instatus peut évoluer : ces types décrivent la réponse
 * normalisée exposée par notre API, et non la forme brute du fournisseur.
 */

export const SUPPORT_STATUS_VALUES = [
  "UP",
  "HASISSUES",
  "MAJOROUTAGE",
  "MINOROUTAGE",
  "UNDERMAINTENANCE",
  "UNKNOWN",
] as const;

export type SupportStatus = (typeof SUPPORT_STATUS_VALUES)[number];

export type SupportStatusSource = "instatus" | "cache" | "fallback";

export interface SupportStatusPage {
  name: string;
  status: SupportStatus;
  url: string;
}

export interface SupportStatusService {
  description: string;
  id: string;
  name: string;
  status: SupportStatus;
}

export interface SupportStatusResponse {
  /**
   * Alias de `services` conservé pour les consommateurs de l'ancienne
   * réponse Instatus, qui utilisaient `components`.
   */
  components: SupportStatusService[];
  error?: string;
  page: SupportStatusPage;
  /** Services exposés par Instatus. */
  services: SupportStatusService[];
  source: SupportStatusSource;
  /** Vrai lorsque la réponse vient du cache après une indisponibilité. */
  stale: boolean;
  updatedAt: string;
}
