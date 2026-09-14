import { AGENT_ERROR_CODES, AgentRuntimeError } from "@/lib/agent/errors";
import { toAgentToolError } from "@/lib/agent/tool-errors";
import type {
  AgentTool,
  AgentToolDefinition,
  RegisteredAgentTool,
  ToolExecutionContext,
  ToolResult,
} from "@/lib/agent/types";
import { toolFailure } from "@/lib/agent/types";

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
// Toute exception devient un ToolFailure structuré, normalisé (catégorie,
// caractère retryable) et sûr — jamais de stack trace ni de détail interne.
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
        "L'outil n'a pas renvoyé de résultat exploitable.",
        { category: "permanent", retryable: false }
      );
    }
    return result;
  } catch (error) {
    if (error instanceof AgentRuntimeError) {
      return toolFailure(error.code, error.message, {
        category: "permanent",
        retryable: false,
      });
    }
    const normalized = toAgentToolError(error);
    const safe = normalized.toSafeShape();
    return toolFailure(safe.code, safe.message, {
      category: safe.category,
      ...(safe.retryAfterMs === undefined
        ? {}
        : { retryAfterMs: safe.retryAfterMs }),
      retryable: safe.retryable,
    });
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
