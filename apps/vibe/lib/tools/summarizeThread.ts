/**
 * Outil mAI — Résumé du fil de commentaires (délègue à MAIAgentFleet.executeTool).
 * Catalogue : lib/tools/index.json → id "summarize_thread".
 */
import { MAIAgentFleet } from "../../vibe-mai-fleet.ts";

export interface SummarizeThreadArgs {
  post_id: string;
}

export async function execute(
  userId: number | string,
  args: SummarizeThreadArgs
) {
  return MAIAgentFleet.executeTool("summarize_thread", args, userId);
}

export const declaration = {
  name: "summarize_thread",
  description:
    "Synthétise les commentaires d'une publication : résumé, points clés, désaccords marquants.",
  parameters: {
    type: "object",
    properties: {
      post_id: {
        type: "string",
        description: "UUID de la publication dont le fil de commentaires est résumé",
      },
    },
    required: ["post_id"],
  },
};
