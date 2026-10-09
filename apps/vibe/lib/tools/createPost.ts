/**
 * Outil mAI — Publication de post (SENSIBLE, approbation requise).
 * Délègue à MAIAgentFleet.executeTool. Catalogue : id "create_post".
 */
import { MAIAgentFleet } from "../../vibe-mai-fleet.ts";

export interface CreatePostArgs {
  content: string;
  format?: "micro_text" | "article" | "media" | "mai_generation";
  media_url?: string;
}

export async function execute(userId: number | string, args: CreatePostArgs) {
  return MAIAgentFleet.executeTool("create_post", args, userId);
}

export const declaration = {
  name: "create_post",
  description: "Publie un nouveau post sur Vibe au nom de l'utilisateur connecté.",
  parameters: {
    type: "object",
    properties: {
      content: { type: "string", description: "Le texte du post à publier sur Vibe" },
      format: { type: "string", enum: ["micro_text", "article", "media", "mai_generation"] },
      media_url: { type: "string", description: "URL optionnelle d'une image attachée" },
    },
    required: ["content"],
  },
};
