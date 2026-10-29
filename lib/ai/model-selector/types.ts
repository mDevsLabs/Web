/**
 * Forme d'un modèle telle que les sélecteurs la consomment.
 *
 * ChatModel (chat), SpeechModel (audio, provider optionnel) et ImageModel
 * (images, qui expose `owned_by`) sont tous compatibles : le provider est
 * résolu à l'affichage par `resolveProviderKey`.
 */

import type { ChatModel } from "@/lib/ai/models";

export type SharedModel = {
  id: string;
  name: string;
  architecture?: ChatModel["architecture"];
  description?: string;
  isFree?: boolean;
  maxContext?: number;
  maxOutput?: number;
  owned_by?: string;
  provider?: string;
  reasoning?: ChatModel["reasoning"];
  supported_parameters?: string[];
  voices?: string[];
};

/** Origines du catalogue : texte, images, synthèse vocale. */
export type ModelSelectorSource = "chat" | "images" | "speech";
