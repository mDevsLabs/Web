/**
 * Outil mAI — Analyse de sentiment des commentaires (délègue à MAIAgentFleet.executeTool).
 * Catalogue : lib/tools/index.json → id "analyze_sentiment".
 */
import { MAIAgentFleet } from "../../vibe-mai-fleet.ts";

export interface AnalyzeSentimentArgs {
  post_id: string;
}

export async function execute(
  userId: number | string,
  args: AnalyzeSentimentArgs
) {
  return MAIAgentFleet.executeTool("analyze_sentiment", args, userId);
}

export const declaration = {
  name: "analyze_sentiment",
  description:
    "Analyse la polarité (positive, neutre, négative, mixte) et les termes clés des commentaires d'une publication.",
  parameters: {
    type: "object",
    properties: {
      post_id: {
        type: "string",
        description: "UUID de la publication dont les commentaires sont analysés",
      },
    },
    required: ["post_id"],
  },
};
