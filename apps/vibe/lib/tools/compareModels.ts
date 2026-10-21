/**
 * Outil mAI — Comparaison de deux modèles sur le même prompt
 * (délègue à MAIAgentFleet.executeTool).
 * Catalogue : lib/tools/index.json → id "compare_models".
 */
import { MAIAgentFleet } from "../../../../vibe-mai-fleet.ts";

export interface CompareModelsArgs {
  model_a: string;
  model_b: string;
  prompt: string;
}

export async function execute(
  userId: number | string,
  args: CompareModelsArgs
) {
  return MAIAgentFleet.executeTool("compare_models", args, userId);
}

export const declaration = {
  name: "compare_models",
  description:
    "Exécute le même prompt sur deux modèles et compare leurs réponses, leur latence et leur longueur.",
  parameters: {
    type: "object",
    properties: {
      model_a: { type: "string", description: "Identifiant du premier modèle" },
      model_b: { type: "string", description: "Identifiant du second modèle" },
      prompt: { type: "string", description: "Prompt envoyé aux deux modèles" },
    },
    required: ["model_a", "model_b", "prompt"],
  },
};
