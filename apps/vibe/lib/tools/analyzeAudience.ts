/**
 * Outil mAI — Analyse de l'audience (délègue à MAIAgentFleet.executeTool).
 * Catalogue : lib/tools/index.json → id "analyze_audience".
 */
import { MAIAgentFleet } from "../../vibe-mai-fleet.ts";

export interface AnalyzeAudienceArgs {
  period?: "7d" | "30d" | "90d" | "12m";
}

export async function execute(userId: number | string, args: AnalyzeAudienceArgs = {}) {
  return MAIAgentFleet.executeTool("analyze_audience", args, userId);
}

export const declaration = {
  name: "analyze_audience",
  description: "Analyse ton audience : sources de vues, visiteurs uniques, heures de pointe, followers les plus engagés.",
  parameters: {
    type: "object",
    properties: {
      period: { type: "string", enum: ["7d", "30d", "90d", "12m"], description: "Période d'analyse (défaut 30d)" },
    },
  },
};
