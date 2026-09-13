import "server-only";

import type { Tool } from "ai";
import type { ZodType } from "zod";
import { AGENT_ERROR_CODES } from "@/lib/agent/errors";
import type { AgentToolMetadata } from "@/lib/agent/tools/catalog";
import { defineTool } from "@/lib/agent/tools/define-tool";
import {
  type AgentSource,
  type AgentTool,
  type ToolResult,
  toolFailure,
  toolSuccess,
} from "@/lib/agent/types";

// Adaptateur des outils natifs du Chat (lib/ai/tools/*) vers AgentTool : la
// logique métier n'est jamais dupliquée, seul le contrat d'entrée est resserré
// par un schéma zod propre à Agent.
export function fromExistingTool<Input>(params: {
  metadata: AgentToolMetadata;
  schema: ZodType<Input>;
  toResult?: (output: unknown) => ToolResult;
  tool: Tool;
}): AgentTool<Input> {
  return defineTool<Input>({
    ...params.metadata,
    execute: async (input, context) => {
      const run = params.tool.execute;
      if (!run) {
        return toolFailure(
          AGENT_ERROR_CODES.toolFailed,
          `L'outil « ${params.metadata.name} » n'est pas exécutable dans ce contexte.`
        );
      }

      // Les outils du Chat ne dépendent pas du contexte d'exécution du SDK :
      // on leur fournit un contexte vide mais explicite.
      const rawOutput: unknown = await run(input, {
        abortSignal: context.signal,
        context: undefined,
        messages: [],
        toolCallId: context.toolExecutionId,
      });

      return params.toResult
        ? params.toResult(rawOutput)
        : toolSuccess(rawOutput);
    },
    schema: params.schema,
    source: "existing",
  });
}

// Convertit une liste de résultats web en sources citables.
export function webResultsToSources(
  results: Array<{ source?: string; title?: string; url?: string }>
): AgentSource[] {
  return results
    .filter((result) => Boolean(result.url))
    .map((result, index) => ({
      id: `web-${index + 1}`,
      kind: "web" as const,
      title: result.title || result.url || "Résultat web",
      url: result.url,
    }));
}
