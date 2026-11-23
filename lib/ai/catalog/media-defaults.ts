/**
 * Identifiants par défaut partagés entre le serveur, les migrations et l'UI
 * pour la génération d'images (CometAPI) et la synthèse vocale (OpenRouter).
 *
 * Logique pure et sûre côté client : aucun import serveur.
 */

export const DEFAULT_IMAGE_MODEL = "black-forest-labs/flux-1.1-pro";
export const DEFAULT_AUDIO_MODEL = "heygen/heygen-voice-1-turbo:free";
export const DEFAULT_AUDIO_VOICE = "nadine";

/**
 * Voix de secours par intervenant pour le générateur de podcast (2 voix
 * distinctes du modèle gratuit par défaut).
 */
export const DEFAULT_PODCAST_VOICES = {
  expert: "nadine",
  host: "bram",
} as const;
