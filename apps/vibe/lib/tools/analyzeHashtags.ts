/**
 * Outil mAI — Analyse des hashtags personnels (délègue à MAIAgentFleet.executeTool).
 * Catalogue : lib/tools/index.json → id "analyze_hashtags".
 */
import { MAIAgentFleet } from "../../vibe-mai-fleet.ts";

export interface AnalyzeHashtagsArgs {
  period?: "7d" | "30d" | "90d" | "12m";
}

export async function execute(userId: number | string, args: AnalyzeHashtagsArgs = {}) {
  return MAIAgentFleet.executeTool("analyze_hashtags", args, userId);
}

export const declaration = {
  name: "analyze_hashtags",
  description: "Classement de tes hashtags : vues et likes moyens par hashtag, meilleurs performers, suggestions tendance.",
  parameters: {
    type: "object",
    properties: {
      period: { type: "string", enum: ["7d", "30d", "90d", "12m"], description: "Période d'analyse (défaut 30d)" },
    },
  },
};
