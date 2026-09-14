import "server-only";

import { selectFamiliesWithModel } from "@/lib/agent/tools/selector/model-select";
import {
  availableTools,
  selectToolsByRules,
  type ToolSelectionContext,
  type ToolSelectionResult,
  toolsForFamilies,
  uniqueFamilies,
} from "@/lib/agent/tools/selector/rules";

// Façade du ToolSelector : sortie structurée du modèle d'abord (JSON validé
// zod, jamais un parsing de texte libre), fallback déterministe ensuite.
// Objectif constant : ne jamais envoyer des dizaines d'outils sans rapport
// (tokens, coût, confusion du modèle) et ne jamais exécuter une sélection
// invalide.
export type AgentToolSelectionInput = ToolSelectionContext & {
  sessionToken?: string;
  userId?: string;
};

export async function selectAgentTools(
  input: AgentToolSelectionInput
): Promise<ToolSelectionResult> {
  const rulesResult = selectToolsByRules(input);

  if (input.mode === "all" || !rulesResult.uncertain) {
    return rulesResult;
  }

  const candidates = availableTools(input);
  const availableFamilies = uniqueFamilies(candidates);
  if (availableFamilies.length <= 1 || !input.sessionToken || !input.userId) {
    return rulesResult;
  }

  const routed = await selectFamiliesWithModel({
    availableFamilies,
    sessionToken: input.sessionToken,
    task: input.task,
    userId: input.userId,
  });

  if (routed.kind !== "ok") {
    return rulesResult;
  }

  const tools = toolsForFamilies({
    families: routed.families,
    tools: candidates,
  });
  if (tools.length === 0) {
    return rulesResult;
  }

  return {
    families: routed.families,
    reason: `Familles sélectionnées par le modèle : ${routed.families.join(", ")}.`,
    tools,
    uncertain: false,
  };
}
