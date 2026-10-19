/**
 * Outil mAI — Recherche de posts par mot-clé (délègue à MAIAgentFleet).
 * Catalogue : lib/tools/index.json → id "search_posts".
 */
import { MAIAgentFleet } from "../../vibe-mai-fleet.ts";

export interface SearchPostsArgs {
  query: string;
  limit?: number;
}

export async function execute(userId: number | string, args: SearchPostsArgs) {
  return MAIAgentFleet.executeTool("search_posts", args, userId);
}

export const declaration = {
  name: "search_posts",
  description: "Recherche des publications Vibe par mot-clé.",
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "Texte ou mot-clé à chercher" },
      limit: { type: "number", description: "Nombre max de résultats" },
    },
    required: ["query"],
  },
};
