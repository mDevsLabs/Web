/**
 * Outil mAI — Analyse détaillée d'un post (délègue à MAIAgentFleet).
 * Catalogue : lib/tools/index.json → id "get_post_stats".
 */
import { MAIAgentFleet } from "../../vibe-mai-fleet.ts";

export interface GetPostStatsArgs {
  post_id: string;
}

export async function execute(userId: number | string, args: GetPostStatsArgs) {
  return MAIAgentFleet.executeTool("get_post_stats", args, userId);
}

export const declaration = {
  name: "get_post_stats",
  description: "Analyse détaillée d'un post : vues, likes, reposts, réponses, engagement.",
  parameters: {
    type: "object",
    properties: {
      post_id: { type: "string", description: "Identifiant UUID du post à analyser" },
    },
    required: ["post_id"],
  },
};
