import { tool } from "ai";
import { z } from "zod";
import {
  countMemories,
  createMemory,
  deleteMemory,
  getAgentMemories,
  getGlobalMemories,
  searchMemories,
} from "@/lib/db/queries";

type MemoryProps = {
  userId: string;
  agentId: string | null;
  memoryLimit?: number;
};

export const memory = ({ userId, agentId, memoryLimit = 50 }: MemoryProps) =>
  tool({
    description:
      "Gérer la mémoire personnalisée de l'utilisateur : ajouter (add), supprimer (delete), lister (list) ou rechercher (search) des informations durables le concernant (préférences, faits, contexte). Utilise cet outil quand l'utilisateur demande de retenir ou d'oublier une information, ou pour retrouver une information mémorisée.",
    execute: async ({ action, content, id, query }) => {
      switch (action) {
        case "add": {
          const safe = (content || "").replace(/\u0000/g, "").trim();
          if (!safe) {
            return { error: "content requis pour add." };
          }
          const total = await countMemories({ agentId: agentId ?? null, userId });
          if (total >= memoryLimit) {
            return {
              error: `Limite de ${memoryLimit} mémoires atteinte pour ce scope. L'utilisateur doit en supprimer avant d'en ajouter.`,
            };
          }
          const created = await createMemory({
            agentId: agentId ?? null,
            content: safe,
            userId,
          });
          if (!created) {
            return { error: "Impossible d'enregistrer la mémoire." };
          }
          return {
            action: "add",
            memory: { content: created.content, id: created.id },
            success: true,
          };
        }
        case "delete": {
          if (!id) {
            return { error: "id requis pour delete (lister d'abord)." };
          }
          const deleted = await deleteMemory({ id, userId });
          return deleted
            ? { action: "delete", success: true }
            : { error: "Entrée introuvable (lister d'abord pour les ids)." };
        }
        case "list": {
          const memories = agentId
            ? await getAgentMemories({ agentId, userId })
            : await getGlobalMemories({ userId });
          return {
            action: "list",
            count: memories.length,
            memories: memories.map((m) => ({
              content: m.content,
              id: m.id,
            })),
          };
        }
        case "search": {
          if (!query) {
            return { error: "query requis pour search." };
          }
          const found = await searchMemories({
            agentId: agentId ?? null,
            query,
            userId,
          });
          return {
            action: "search",
            count: found.length,
            memories: found.map((m) => ({ content: m.content, id: m.id })),
          };
        }
      }
    },
    inputSchema: z.object({
      action: z
        .enum(["add", "delete", "list", "search"])
        .describe("Action à effectuer sur la mémoire"),
      content: z
        .string()
        .max(2000)
        .optional()
        .describe("Information à retenir (action add uniquement)"),
      id: z
        .string()
        .uuid()
        .optional()
        .describe("Identifiant de l'entrée à supprimer (action delete)"),
      query: z
        .string()
        .max(200)
        .optional()
        .describe("Texte à rechercher (action search uniquement)"),
    }),
  });
