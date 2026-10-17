/**
 * Outil mAI — Suivre un compte (SENSIBLE, approbation requise).
 * Délègue à MAIAgentFleet.executeTool. Catalogue : id "follow_user".
 */
import { MAIAgentFleet } from "../../vibe-mai-fleet.ts";

export interface FollowUserArgs {
  username: string;
  follow?: boolean;
}

export async function execute(userId: number | string, args: FollowUserArgs) {
  return MAIAgentFleet.executeTool("follow_user", args, userId);
}

export const declaration = {
  name: "follow_user",
  description: "Suit (ou ne suit plus) un compte Vibe désigné par son @username.",
  parameters: {
    type: "object",
    properties: {
      username: { type: "string", description: "Nom d'utilisateur, sans le @" },
      follow: { type: "boolean", description: "true pour suivre, false pour ne plus suivre" },
    },
    required: ["username"],
  },
};
