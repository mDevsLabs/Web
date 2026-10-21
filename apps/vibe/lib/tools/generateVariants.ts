/**
 * Outil mAI — Variantes d'accroche pour un post (délègue à MAIAgentFleet.executeTool).
 * Catalogue : lib/tools/index.json → id "generate_variants".
 */
import { MAIAgentFleet } from "../../../../vibe-mai-fleet.ts";

export interface GenerateVariantsArgs {
  text: string;
  tone?: "viral" | "pro" | "humour" | "concis" | "poétique";
}

export async function execute(
  userId: number | string,
  args: GenerateVariantsArgs
) {
  return MAIAgentFleet.executeTool("generate_variants", args, userId);
}

export const declaration = {
  name: "generate_variants",
  description:
    "Propose trois accroches alternatives pour un même contenu, chacune attackquant par un angle différent.",
  parameters: {
    type: "object",
    properties: {
      text: { type: "string", description: "Contenu source" },
      tone: {
        type: "string",
        enum: ["viral", "pro", "humour", "concis", "poétique"],
        description: "Ton des variantes (défaut viral)",
      },
    },
    required: ["text"],
  },
};
