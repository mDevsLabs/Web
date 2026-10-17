/**
 * Outil mAI — Prévision de performance d'un brouillon (délègue à MAIAgentFleet.executeTool).
 * Catalogue : lib/tools/index.json → id "predict_post_performance".
 */
import { MAIAgentFleet } from "../../vibe-mai-fleet.ts";

export interface PredictPostPerformanceArgs {
  content: string;
  format?: string;
  scheduled_time?: string;
}

export async function execute(userId: number | string, args: PredictPostPerformanceArgs) {
  return MAIAgentFleet.executeTool("predict_post_performance", args, userId);
}

export const declaration = {
  name: "predict_post_performance",
  description: "Estime la portée et l'engagement d'un brouillon avant publication (score 0-100 basé sur ton historique).",
  parameters: {
    type: "object",
    properties: {
      content: { type: "string", description: "Texte du brouillon à évaluer" },
      format: { type: "string", description: "Format prévu (micro_text, article, media, mai_generation)" },
      scheduled_time: { type: "string", description: "Heure de publication prévue (ISO ou HH:mm, optionnel)" },
    },
    required: ["content"],
  },
};
