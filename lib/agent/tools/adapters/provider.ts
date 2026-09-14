import "server-only";

import { tool as createProviderTool, type Tool } from "ai";
import type {
  RegisteredAgentTool,
  ToolCallController,
  ToolResult,
} from "@/lib/agent/types";

// Couche d'adaptation entre les outils mAI et le format attendu par le modèle.
// Le runtime ne manipule que des AgentTool ; seul cet adaptateur connaît le SDK.
// Grâce à la compatibilité Chat Completions du provider, la définition envoyée
// au modèle est exactement `{ type: "function", function: { name, description,
// parameters } }`, dérivée du schéma zod de l'outil.
//
// L'adaptateur ne décide de rien : la boucle d'appel (step, ligne persistée,
// retries bornés, événements) appartient au contrôleur, et l'approbation est
// branchée via `needsApproval` — par outil, sur décision serveur, sans jamais
// nommer un outil particulier.

export function toProviderTool(params: {
  approvalRequired: boolean;
  controller: ToolCallController;
  tool: RegisteredAgentTool;
}): Tool {
  return createProviderTool({
    description: params.tool.description,
    execute: async (input, options) => {
      const result: ToolResult = await params.controller.runToolCall({
        execute: (context) => params.tool.execute(input, context),
        input,
        tool: params.tool,
        toolCallId: options.toolCallId,
      });
      return result;
    },
    inputSchema: params.tool.schema,
    ...(params.approvalRequired
      ? {
          needsApproval: (input, options) =>
            params.controller.onApprovalRequired({
              input,
              toolCallId: options.toolCallId,
              toolId: params.tool.id,
            }),
        }
      : {}),
  });
}

export function toProviderTools(params: {
  approvalRequiredToolIds: string[];
  controller: ToolCallController;
  tools: RegisteredAgentTool[];
}): Record<string, Tool> {
  const tools: Record<string, Tool> = {};
  for (const tool of params.tools) {
    tools[tool.id] = toProviderTool({
      approvalRequired: params.approvalRequiredToolIds.includes(tool.id),
      controller: params.controller,
      tool,
    });
  }
  return tools;
}
