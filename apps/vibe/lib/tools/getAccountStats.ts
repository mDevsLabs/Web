/**
 * Outil mAI — Statistiques du compte (délègue à MAIAgentFleet).
 * Catalogue : lib/tools/index.json → id "get_account_stats".
 */
import { MAIAgentFleet } from "../../vibe-mai-fleet.ts";

export async function execute(userId: number | string, _args: Record<string, never> = {}) {
  return MAIAgentFleet.executeTool("get_account_stats", {}, userId);
}

export const declaration = {
  name: "get_account_stats",
  description: "Récupère les statistiques détaillées du compte utilisateur.",
  parameters: { type: "object", properties: {} },
};
