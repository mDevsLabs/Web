/**
 * Outil mAI — Meilleur moment pour publier (délègue à MAIAgentFleet.executeTool).
 * Catalogue : lib/tools/index.json → id "best_time_to_post".
 */
import { MAIAgentFleet } from "../../vibe-mai-fleet.ts";

export interface BestTimeToPostArgs {
  period?: "7d" | "30d" | "90d" | "12m";
}

export async function execute(userId: number | string, args: BestTimeToPostArgs = {}) {
  return MAIAgentFleet.executeTool("best_time_to_post", args, userId);
}

export const declaration = {
  name: "best_time_to_post",
  description: "Meilleures heures et jours pour publier, calculés sur tes vues réelles et ton engagement.",
  parameters: {
    type: "object",
    properties: {
      period: { type: "string", enum: ["7d", "30d", "90d", "12m"], description: "Période d'analyse (défaut 30d)" },
    },
  },
};
