/**
 * Outil mAI — Vérification des faits (délègue à MAIAgentFleet.executeTool).
 * Catalogue : lib/tools/index.json → id "fact_check".
 */
import { MAIAgentFleet } from "../../vibe-mai-fleet.ts";

export interface FactCheckArgs {
  statement: string;
}

export async function execute(userId: number | string, args: FactCheckArgs) {
  return MAIAgentFleet.executeTool("fact_check", args, userId);
}

export const declaration = {
  name: "fact_check",
  description: "Analyse et vérifie la véracité d'une information avec sources et indice de confiance.",
  parameters: {
    type: "object",
    properties: {
      statement: { type: "string", description: "Affirmation à vérifier" },
    },
    required: ["statement"],
  },
};
