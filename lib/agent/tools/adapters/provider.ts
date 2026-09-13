import "server-only";

import { tool as createProviderTool, type Tool } from "ai";
import { AGENT_TOOL_TIMEOUT_MS } from "@/lib/agent/budget";
import type {
  RegisteredAgentTool,
  ToolCallController,
  ToolExecutionContext,
} from "@/lib/agent/types";

// Couche d'adaptation entre les outils mAI et le format attendu par le modèle.
// Le runtime ne manipule que des AgentTool ; seul cet adaptateur connaît le SDK.
// Grâce à la compatibilité Chat Completions du provider, la définition envoyée
// au modèle est exactement `{ type: "function", function: { name, description,
// parameters } }`, dérivée du schéma zod de l'outil.

export function toProviderTool(params: {
  controller: ToolCallController;
  tool: RegisteredAgentTool;
}): Tool {
  return createProviderTool({
    description: params.tool.description,
    execute: async (input) => {
      // Le runtime crée (ou retrouve) le step et l'exécution d'outil ici : c'est
      // le seul moment où l'on sait quel outil est réellement appelé.
      const call = await params.controller.beginToolCall({
        input,
        tool: params.tool,
      });

      const timeoutSignal = AbortSignal.timeout(AGENT_TOOL_TIMEOUT_MS);
      const context: ToolExecutionContext = {
        ...call.context,
        signal: call.context.signal
          ? AbortSignal.any([call.context.signal, timeoutSignal])
          : timeoutSignal,
      };

      const result = await params.tool.execute(input, context);
      await call.finishToolCall(result);
      return result;
    },
    inputSchema: params.tool.schema,
  });
}

export function toProviderTools(params: {
  controller: ToolCallController;
  tools: RegisteredAgentTool[];
}): Record<string, Tool> {
  const tools: Record<string, Tool> = {};
  for (const tool of params.tools) {
    tools[tool.id] = toProviderTool({ controller: params.controller, tool });
  }
  return tools;
}
