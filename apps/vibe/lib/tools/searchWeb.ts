/**
 * Outil mAI — Recherche web (délègue à MAIAgentFleet.executeTool).
 * Catalogue : lib/tools/index.json → id "search_web".
 */
import { MAIAgentFleet } from "../../vibe-mai-fleet.ts";

export interface SearchWebArgs {
  query: string;
}

export async function execute(userId: number | string, args: SearchWebArgs) {
  return MAIAgentFleet.executeTool("search_web", args, userId);
}

export const declaration = {
  name: "search_web",
  description: "Recherche sur le web des informations vérifiées et actualités récentes.",
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "Requête de recherche" },
    },
    required: ["query"],
  },
};
