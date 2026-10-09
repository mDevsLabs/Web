/**
 * Outil mAI — Notifications de l'utilisateur (délègue à MAIAgentFleet).
 * Catalogue : lib/tools/index.json → id "get_notifications".
 */
import { MAIAgentFleet } from "../../vibe-mai-fleet.ts";

export async function execute(userId: number | string, _args: Record<string, never> = {}) {
  return MAIAgentFleet.executeTool("get_notifications", {}, userId);
}

export const declaration = {
  name: "get_notifications",
  description: "Récupère les notifications récentes de l'utilisateur.",
  parameters: { type: "object", properties: {} },
};
