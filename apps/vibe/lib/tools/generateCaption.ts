/**
 * Outil mAI — Légende et hashtags pour un visuel (délègue à MAIAgentFleet.executeTool).
 * Catalogue : lib/tools/index.json → id "generate_caption".
 */
import { MAIAgentFleet } from "../../../../vibe-mai-fleet.ts";

export interface GenerateCaptionArgs {
  context?: string;
  text: string;
}

export async function execute(
  userId: number | string,
  args: GenerateCaptionArgs
) {
  return MAIAgentFleet.executeTool("generate_caption", args, userId);
}

export const declaration = {
  name: "generate_caption",
  description:
    "Rédige une légende prête à publier, son appel à l'action et 5 à 8 hashtags à partir d'un visuel ou d'un sujet.",
  parameters: {
    type: "object",
    properties: {
      text: {
        type: "string",
        description: "Description du visuel ou sujet de la publication",
      },
      context: {
        type: "string",
        description: "Contexte additionnel (lieu, événement, audience)",
      },
    },
    required: ["text"],
  },
};
