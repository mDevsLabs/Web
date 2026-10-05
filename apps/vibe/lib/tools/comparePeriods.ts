/**
 * Outil mAI — Comparaison de périodes (délègue à MAIAgentFleet.executeTool).
 * Catalogue : lib/tools/index.json → id "compare_periods".
 */
import { MAIAgentFleet } from "../../vibe-mai-fleet.ts";

export interface ComparePeriodsArgs {
  period?: "7d" | "30d" | "90d" | "12m";
}

export async function execute(userId: number | string, args: ComparePeriodsArgs = {}) {
  return MAIAgentFleet.executeTool("compare_periods", args, userId);
}

export const declaration = {
  name: "compare_periods",
  description: "Compare la période sélectionnée à la précédente : vues, likes, reposts, réponses, followers, visites de profil avec % de croissance.",
  parameters: {
    type: "object",
    properties: {
      period: { type: "string", enum: ["7d", "30d", "90d", "12m"], description: "Période comparée à la précédente de même durée (défaut 30d)" },
    },
  },
};
