/**
 * Outil mAI — Suppression de post (SENSIBLE, approbation requise).
 * Délègue à MAIAgentFleet.executeTool. Catalogue : id "delete_post".
 */
import { MAIAgentFleet } from "../../vibe-mai-fleet.ts";

export interface DeletePostArgs {
  post_id: string;
}

export async function execute(userId: number | string, args: DeletePostArgs) {
  return MAIAgentFleet.executeTool("delete_post", args, userId);
}

export const declaration = {
  name: "delete_post",
  description: "Supprime une publication appartenant à l'utilisateur.",
  parameters: {
    type: "object",
    properties: {
      post_id: { type: "string", description: "Identifiant UUID du post à supprimer" },
    },
    required: ["post_id"],
  },
};
