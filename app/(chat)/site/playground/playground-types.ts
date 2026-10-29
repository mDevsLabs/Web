/**
 * Types du terrain de jeu du Site officiel.
 *
 * Le catalogue du Site répond au format OpenAI (`{ data, object: "list" }`),
 * et l'exécution passe par l'exécuteur BFF qui relaie la réponse amont
 * telle quelle. Ces types décrivent donc les deux formes.
 */

import type { SharedModel } from "@/lib/ai/model-selector/types";

/** Réponse de catalogue (format OpenAI). */
export type CatalogResponse = {
  data?: SharedModel[];
  object?: string;
};

/** Les trois terrains du playground. */
export type PlaygroundMode = "chat" | "images" | "speech";

/** Modèle affiché dans le sélecteur, enrichi par la source. */
export type PlaygroundModel = SharedModel & {
  owned_by?: string;
};

/** Exécution d'une requête de chat : réponse brute de l'API. */
export type ChatCompletionResponse = {
  choices?: Array<{
    finish_reason?: string;
    message?: { content?: string; reasoning?: string; role?: string };
  }>;
  error?: { code?: string; message?: string };
  id?: string;
  model?: string;
  usage?: {
    completion_tokens?: number;
    prompt_tokens?: number;
    total_tokens?: number;
  };
};

/** Exécution d'une génération d'image. */
export type ImageGenerationResponse = {
  data?: Array<{ b64_json?: string; url?: string }>;
  error?: { code?: string; message?: string };
};

/** Exécution d'une synthèse vocale (binaire ou base64). */
export type SpeechGenerationResponse = {
  audio?: string;
  error?: { code?: string; message?: string };
  mimeType?: string;
};

/** Erreur normalisée affichée dans l'interface. */
export type PlaygroundError = {
  message: string;
  needsApiKey?: boolean;
};

/** Extrait le message d'erreur d'une réponse d'exécution. */
export function readPlaygroundError(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "Réponse illisible de l'API.";
  }
  const error = (payload as { error?: unknown }).error;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  const message = (payload as { message?: unknown }).message;
  if (typeof message === "string" && message.trim()) return message;
  return "Erreur inconnue de l'API mAI.";
}
