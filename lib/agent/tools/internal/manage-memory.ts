import { z } from "zod";
import { requireAgentToolMetadata } from "@/lib/agent/tools/catalog";
import { defineTool } from "@/lib/agent/tools/define-tool";
import { type ToolResult, toolFailure, toolSuccess } from "@/lib/agent/types";
import { memoryLimitForTier } from "@/lib/auth/plan";
import {
  countMemories,
  createMemory,
  deleteMemory,
  getAgentMemories,
  getGlobalMemories,
  searchMemories,
} from "@/lib/db/queries";

// Gestion de la mémoire côté Agent : mêmes opérations que l'outil du Chat
// (lib/ai/tools/memory.ts), exposées via le contrat AgentTool (entrée validée,
// sortie structurée, résumé timeline). La portée suit la convention du Chat :
// mémoire globale par défaut, portée agent quand un assistant est sélectionné.

const ACTIONS = ["add", "delete", "list", "search"] as const;

const memoryInputSchema = z.object({
  action: z.enum(ACTIONS).describe("Opération de mémoire à effectuer."),
  content: z
    .string()
    .max(2000)
    .optional()
    .describe("Contenu à mémoriser (requis pour l'action add)."),
  id: z
    .string()
    .uuid()
    .optional()
    .describe("Identifiant de la mémoire à supprimer (requis pour delete)."),
  query: z
    .string()
    .max(300)
    .optional()
    .describe("Requête de recherche (requis pour l'action search)."),
});

export type ManageMemoryInput = z.infer<typeof memoryInputSchema>;

const MEMORY_LIMIT_DEFAULT = 50;
const MEMORY_CONTENT_MAX = 2000;

function sanitizeContent(value: string | undefined): string {
  return (value ?? "")
    .replace(new RegExp(String.fromCharCode(0), "g"), "")
    .trim();
}

export const manageMemoryTool = defineTool({
  ...requireAgentToolMetadata("manage_memory"),
  execute: async (input, context) => {
    const agentId = context.agentId ?? null;
    const memoryLimit = context.tier
      ? memoryLimitForTier(context.tier)
      : MEMORY_LIMIT_DEFAULT;

    const readMemories = async () =>
      agentId
        ? getAgentMemories({ agentId, userId: context.userId })
        : getGlobalMemories({ userId: context.userId });

    try {
      switch (input.action) {
        case "add": {
          const content = sanitizeContent(input.content);
          if (!content) {
            return toolFailure(
              "invalid_input",
              "content requis pour ajouter une mémoire."
            );
          }
          if (content.length > MEMORY_CONTENT_MAX) {
            return toolFailure(
              "invalid_input",
              `Le contenu dépasse ${MEMORY_CONTENT_MAX} caractères.`
            );
          }
          const total = await countMemories({
            agentId,
            userId: context.userId,
          });
          if (total >= memoryLimit) {
            return toolFailure(
              "memory_limit_reached",
              `Limite de ${memoryLimit} mémoires atteinte pour cette portée. L'utilisateur doit en supprimer avant d'en ajouter.`
            );
          }
          const created = await createMemory({
            agentId,
            content,
            userId: context.userId,
          });
          return toolSuccess({
            action: "add",
            memory: { content: created.content, id: created.id },
          });
        }
        case "delete": {
          if (!input.id) {
            return toolFailure(
              "invalid_input",
              "id requis pour supprimer une mémoire."
            );
          }
          await deleteMemory({ id: input.id, userId: context.userId });
          return toolSuccess({ action: "delete", id: input.id });
        }
        case "list": {
          const memories = await readMemories();
          return toolSuccess({
            action: "list",
            count: memories.length,
            memories: memories.map((memory) => ({
              content: memory.content,
              id: memory.id,
            })),
          });
        }
        case "search": {
          const query = (input.query ?? "").trim();
          if (!query) {
            return toolFailure(
              "invalid_input",
              "query requis pour rechercher dans la mémoire."
            );
          }
          const memories = await searchMemories({
            agentId,
            query,
            userId: context.userId,
          });
          return toolSuccess({
            action: "search",
            count: memories.length,
            memories: memories.map((memory) => ({
              content: memory.content,
              id: memory.id,
            })),
          });
        }
        default: {
          return toolFailure(
            "invalid_input",
            "Action de mémoire inconnue."
          ) satisfies ToolResult;
        }
      }
    } catch {
      return toolFailure(
        "memory_failed",
        "L'opération de mémoire n'a pas pu aboutir.",
        { category: "transient", retryable: true }
      );
    }
  },
  schema: memoryInputSchema,
  summarize: (data) => {
    const value = (data ?? {}) as { action?: string; count?: number };
    switch (value.action) {
      case "add":
        return "Information mémorisée";
      case "delete":
        return "Information retirée";
      case "search":
        return `${value.count ?? 0} mémoire(s) trouvée(s)`;
      default:
        return `${value.count ?? 0} mémoire(s)`;
    }
  },
});
