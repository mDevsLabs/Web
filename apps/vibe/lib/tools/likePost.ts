/**
 * Outil mAI — Like / unlike un post (délègue à MAIAgentFleet).
 * Catalogue : lib/tools/index.json → id "like_post".
 */
import { MAIAgentFleet } from "../../vibe-mai-fleet.ts";

export interface LikePostArgs {
  post_id: string;
  like?: boolean;
}

export async function execute(userId: number | string, args: LikePostArgs) {
  return MAIAgentFleet.executeTool("like_post", args, userId);
}

export const declaration = {
  name: "like_post",
  description: "Like (ou unlike) une publication par son UUID.",
  parameters: {
    type: "object",
    properties: {
      post_id: { type: "string", description: "Identifiant UUID du post" },
      like: { type: "boolean", description: "true pour liker, false pour unliker" },
    },
    required: ["post_id"],
  },
};
