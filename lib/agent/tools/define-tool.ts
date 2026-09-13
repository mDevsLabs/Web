import { AGENT_ERROR_CODES, toToolFailure } from "@/lib/agent/errors";
import type {
  AgentTool,
  AgentToolDefinition,
  RegisteredAgentTool,
  ToolExecutionContext,
  ToolResult,
} from "@/lib/agent/types";
import { isToolSuccess, toolFailure } from "@/lib/agent/types";

// Point d'entrée unique pour créer un outil Agent. Objectif : ajouter une
// capacité se limite à écrire une fonction serveur avec un schéma d'entrée,
// puis à l'enregistrer dans le ToolRegistry. Le runtime, le sélecteur et l'UI
// d'activité n'ont jamais besoin de connaître le nouvel outil.
export function defineTool<Input>(
  definition: AgentToolDefinition<Input>
): AgentTool<Input> {
  return { ...definition, source: definition.source ?? "internal" };
}

// Enveloppe de sûreté : un outil ne doit jamais faire échouer le run en levant.
// Toute exception devient un ToolFailure structuré que le modèle peut exploiter
// (réessayer, changer d'outil, demander une information, conclure).
export async function runToolSafely(params: {
  context: ToolExecutionContext;
  execute: (
    input: never,
    context: ToolExecutionContext
  ) => Promise<ToolResult> | ToolResult;
  input: unknown;
}): Promise<ToolResult> {
  try {
    const result = await params.execute(params.input as never, params.context);
    if (!result || typeof result !== "object" || !("success" in result)) {
      return toolFailure(
        AGENT_ERROR_CODES.toolFailed,
        "L'outil n'a pas renvoyé de résultat exploitable."
      );
    }
    return isToolSuccess(result) ? result : result;
  } catch (error) {
    return toToolFailure(error);
  }
}

// Adapte un outil typé vers la vue effacée stockée par le registre. Le cast sur
// `execute` et `schema` est contenu ici, une seule fois : zod valide l'entrée
// avant tout appel, donc l'effacement ne crée pas de trou de typage réel.
export function toRegisteredTool<Input>(
  tool: AgentTool<Input>
): RegisteredAgentTool {
  return {
    ...tool,
    execute: (input: unknown, context: ToolExecutionContext) =>
      runToolSafely({
        context,
        execute: (value: never, ctx: ToolExecutionContext) =>
          tool.execute(value, ctx),
        input,
      }),
    schema: tool.schema as RegisteredAgentTool["schema"],
  };
}
