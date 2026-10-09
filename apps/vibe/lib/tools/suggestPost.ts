/**
 * Outil mAI — Idées de posts (délègue à MAIAgentFleet.executeTool).
 * Catalogue : lib/tools/index.json → id "suggest_post".
 */
import { MAIAgentFleet } from "../../vibe-mai-fleet.ts";

export interface SuggestPostArgs {
  topic: string;
  style?: string;
}

export async function execute(userId: number | string, args: SuggestPostArgs) {
  return MAIAgentFleet.executeTool("suggest_post", args, userId);
}

export const declaration = {
  name: "suggest_post",
  description: "Génère des idées de publications Vibe originales (sans les publier).",
  parameters: {
    type: "object",
    properties: {
      topic: { type: "string", description: "Thème ou sujet souhaité" },
      style: { type: "string", enum: ["viral", "pro", "humour", "inspirant"] },
    },
    required: ["topic"],
  },
};
