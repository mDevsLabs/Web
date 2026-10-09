/**
 * Outil mAI — Commenter un post (SENSIBLE, approbation requise).
 * Délègue à MAIAgentFleet.executeTool. Catalogue : id "comment_post".
 */
import { MAIAgentFleet } from "../../vibe-mai-fleet.ts";

export interface CommentPostArgs {
  post_id: string;
  content: string;
}

export async function execute(userId: number | string, args: CommentPostArgs) {
  return MAIAgentFleet.executeTool("comment_post", args, userId);
}

export const declaration = {
  name: "comment_post",
  description: "Commente une publication Vibe au nom de l'utilisateur.",
  parameters: {
    type: "object",
    properties: {
      post_id: { type: "string", description: "Identifiant UUID du post à commenter" },
      content: { type: "string", description: "Texte du commentaire (1-2000 caractères)" },
    },
    required: ["post_id", "content"],
  },
};
