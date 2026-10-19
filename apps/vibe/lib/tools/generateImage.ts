/**
 * Outil mAI — Génération d'image (délègue à MAIAgentFleet.executeTool).
 * Catalogue : lib/tools/index.json → id "generate_vibe_image".
 */
import { MAIAgentFleet } from "../../vibe-mai-fleet.ts";

export interface GenerateImageArgs {
  prompt: string;
  aspect_ratio?: "1:1" | "16:9" | "4:5" | "9:16";
}

export async function execute(userId: number | string, args: GenerateImageArgs) {
  return MAIAgentFleet.executeTool("generate_vibe_image", args, userId);
}

export const declaration = {
  name: "generate_vibe_image",
  description: "Génère une image IA pour une publication Vibe ou pour l'avatar.",
  parameters: {
    type: "object",
    properties: {
      prompt: { type: "string", description: "Description textuelle de l'image" },
      aspect_ratio: { type: "string", enum: ["1:1", "16:9", "4:5", "9:16"] },
    },
    required: ["prompt"],
  },
};
