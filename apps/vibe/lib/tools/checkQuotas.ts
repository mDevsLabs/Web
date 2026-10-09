/**
 * Outil mAI — Quotas mAI (délègue à MAIAgentFleet).
 * Catalogue : lib/tools/index.json → id "check_quotas".
 */
import { MAIAgentFleet } from "../../vibe-mai-fleet.ts";

export async function execute(userId: number | string, _args: Record<string, never> = {}) {
  return MAIAgentFleet.executeTool("check_quotas", {}, userId);
}

export const declaration = {
  name: "check_quotas",
  description: "Consulte les quotas mAI hebdomadaires (tokens) et quotidiens (images).",
  parameters: { type: "object", properties: {} },
};
