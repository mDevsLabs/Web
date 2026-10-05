/**
 * Outil mAI — Bookmark un post (délègue à MAIAgentFleet).
 * Catalogue : lib/tools/index.json → id "bookmark_post".
 */
import { MAIAgentFleet } from "../../vibe-mai-fleet.ts";

export interface BookmarkPostArgs {
  post_id: string;
  bookmark?: boolean;
}

export async function execute(userId: number | string, args: BookmarkPostArgs) {
  return MAIAgentFleet.executeTool("bookmark_post", args, userId);
}

export const declaration = {
  name: "bookmark_post",
  description: "Ajoute (ou retire) une publication des favoris de l'utilisateur.",
  parameters: {
    type: "object",
    properties: {
      post_id: { type: "string", description: "Identifiant UUID du post" },
      bookmark: { type: "boolean", description: "true pour sauvegarder, false pour retirer" },
    },
    required: ["post_id"],
  },
};
