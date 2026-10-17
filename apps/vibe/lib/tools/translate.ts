/**
 * Outil mAI — Traduction (délègue à MAIAgentFleet.executeTool).
 * Catalogue : lib/tools/index.json → id "translate".
 */
import { MAIAgentFleet } from "../../vibe-mai-fleet.ts";

export interface TranslateArgs {
  text: string;
  target_language: string;
}

export async function execute(userId: number | string, args: TranslateArgs) {
  return MAIAgentFleet.executeTool("translate", args, userId);
}

export const declaration = {
  name: "translate",
  description: "Traduit un texte dans la langue cible (DeepL, repli mAI).",
  parameters: {
    type: "object",
    properties: {
      text: { type: "string", description: "Texte à traduire" },
      target_language: { type: "string", description: "Langue cible (ex: anglais, EN, FR)" },
    },
    required: ["text", "target_language"],
  },
};
