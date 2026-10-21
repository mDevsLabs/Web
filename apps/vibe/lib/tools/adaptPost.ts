/**
 * Outil mAI — Adaptation d'un post par réseau social (délègue à MAIAgentFleet.executeTool).
 * Catalogue : lib/tools/index.json → id "adapt_post".
 */
import { MAIAgentFleet } from "../../../../vibe-mai-fleet.ts";

export interface AdaptPostArgs {
  text: string;
  network?: "x" | "instagram" | "linkedin";
}

export async function execute(
  userId: number | string,
  args: AdaptPostArgs
) {
  return MAIAgentFleet.executeTool("adapt_post", args, userId);
}

export const declaration = {
  name: "adapt_post",
  description:
    "Réécrit un texte pour les contraintes d'un réseau (longueur, ton, hashtags) : X, Instagram ou LinkedIn.",
  parameters: {
    type: "object",
    properties: {
      text: { type: "string", description: "Texte à réécrire" },
      network: {
        type: "string",
        enum: ["x", "instagram", "linkedin"],
        description: "Réseau cible (défaut x)",
      },
    },
    required: ["text"],
  },
};
