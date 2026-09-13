import "server-only";

import { routeFamiliesWithModel } from "@/lib/agent/tools/selector/llm-router";
import {
  availableTools,
  selectToolsByRules,
  type ToolSelectionContext,
  type ToolSelectionResult,
  toolsForFamilies,
  uniqueFamilies,
} from "@/lib/agent/tools/selector/rules";

// Façade du ToolSelector : règles d'abord, escalade LLM seulement si la
// première passe juge la demande ambiguë. Objectif constant : ne jamais envoyer
// des dizaines d'outils sans rapport (tokens, coût, confusion du modèle).
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

  const routed = await routeFamiliesWithModel({
    availableFamilies,
    sessionToken: input.sessionToken,
    task: input.task,
    userId: input.userId,
  });

  if (!routed || routed.length === 0) {
    return rulesResult;
  }

  const tools = toolsForFamilies({ families: routed, tools: candidates });
  if (tools.length === 0) {
    return rulesResult;
  }

  return {
    families: routed,
    reason: `Familles affinées par routage : ${routed.join(", ")}.`,
    tools,
    uncertain: false,
  };
}
