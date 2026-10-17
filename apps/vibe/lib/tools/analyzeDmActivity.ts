/**
 * Outil mAI — Activité de messagerie (délègue à MAIAgentFleet.executeTool).
 * Catalogue : lib/tools/index.json → id "analyze_dm_activity".
 */
import { MAIAgentFleet } from "../../vibe-mai-fleet.ts";

export interface AnalyzeDmActivityArgs {
  period?: "7d" | "30d" | "90d" | "12m";
}

export async function execute(userId: number | string, args: AnalyzeDmActivityArgs = {}) {
  return MAIAgentFleet.executeTool("analyze_dm_activity", args, userId);
}

export const declaration = {
  name: "analyze_dm_activity",
  description: "Activité de messagerie : volumes envoyés/reçus, conversations actives, temps de réponse moyen, top correspondants.",
  parameters: {
    type: "object",
    properties: {
      period: { type: "string", enum: ["7d", "30d", "90d", "12m"], description: "Période d'analyse (défaut 30d)" },
    },
  },
};
