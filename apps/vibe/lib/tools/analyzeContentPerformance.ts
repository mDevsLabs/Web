/**
 * Outil mAI — Performance par format et hashtags (délègue à MAIAgentFleet.executeTool).
 * Catalogue : lib/tools/index.json → id "analyze_content_performance".
 */
import { MAIAgentFleet } from "../../vibe-mai-fleet.ts";

export interface AnalyzeContentPerformanceArgs {
  period?: "7d" | "30d" | "90d" | "12m";
}

export async function execute(userId: number | string, args: AnalyzeContentPerformanceArgs = {}) {
  return MAIAgentFleet.executeTool("analyze_content_performance", args, userId);
}

export const declaration = {
  name: "analyze_content_performance",
  description: "Performance par format (texte, image, sondage, citation) et par hashtag : ce qui génère le plus de vues et d'engagement.",
  parameters: {
    type: "object",
    properties: {
      period: { type: "string", enum: ["7d", "30d", "90d", "12m"], description: "Période d'analyse (défaut 30d)" },
    },
  },
};
