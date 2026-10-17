/**
 * Outil mAI — Reposter (SENSIBLE, approbation requise).
 * Délègue à MAIAgentFleet.executeTool. Catalogue : id "repost_post".
 */
import { MAIAgentFleet } from "../../vibe-mai-fleet.ts";

export interface RepostPostArgs {
  post_id: string;
  repost?: boolean;
}

export async function execute(userId: number | string, args: RepostPostArgs) {
  return MAIAgentFleet.executeTool("repost_post", args, userId);
}

export const declaration = {
  name: "repost_post",
  description: "Republie (ou annule le repost) une publication Vibe.",
  parameters: {
    type: "object",
    properties: {
      post_id: { type: "string", description: "Identifiant UUID du post" },
      repost: { type: "boolean", description: "true pour reposter, false pour annuler" },
    },
    required: ["post_id"],
  },
};
