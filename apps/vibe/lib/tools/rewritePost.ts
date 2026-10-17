/**
 * Outil mAI — Reformulation de style (délègue à MAIAgentFleet.executeTool).
 * Catalogue : lib/tools/index.json → id "rewrite_post".
 */
import { MAIAgentFleet } from "../../vibe-mai-fleet.ts";

export interface RewritePostArgs {
  text: string;
  style?: string;
}

export async function execute(userId: number | string, args: RewritePostArgs) {
  return MAIAgentFleet.executeTool("rewrite_post", args, userId);
}

export const declaration = {
  name: "rewrite_post",
  description: "Reformule un texte dans un style donné (viral, pro, humour, concis, poétique).",
  parameters: {
    type: "object",
    properties: {
      text: { type: "string", description: "Texte à reformuler" },
      style: { type: "string", description: "Style souhaité (viral, pro, humour, concis, poétique)" },
    },
    required: ["text"],
  },
};
