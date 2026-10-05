/**
 * Outil mAI — Statistiques des livres collaboratifs (délègue à MAIAgentFleet.executeTool).
 * Catalogue : lib/tools/index.json → id "analyze_book_stats".
 */
import { MAIAgentFleet } from "../../vibe-mai-fleet.ts";

export interface AnalyzeBookStatsArgs {
  period?: "7d" | "30d" | "90d" | "12m";
}

export async function execute(userId: number | string, args: AnalyzeBookStatsArgs = {}) {
  return MAIAgentFleet.executeTool("analyze_book_stats", args, userId);
}

export const declaration = {
  name: "analyze_book_stats",
  description: "Statistiques des livres collaboratifs : contributions par membre, activité récente, posts les plus populaires.",
  parameters: {
    type: "object",
    properties: {
      period: { type: "string", enum: ["7d", "30d", "90d", "12m"], description: "Fenêtre d'activité récente (défaut 30d)" },
    },
  },
};
