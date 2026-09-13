import { z } from "zod";
import {
  fromExistingTool,
  webResultsToSources,
} from "@/lib/agent/tools/adapters/existing";
import { requireAgentToolMetadata } from "@/lib/agent/tools/catalog";
import { toolFailure, toolSuccess } from "@/lib/agent/types";
import { webSearch } from "@/lib/ai/tools/web-search";

const searchWebInputSchema = z.object({
  count: z
    .number()
    .int()
    .min(1)
    .max(10)
    .optional()
    .describe("Nombre de résultats souhaités (1-10, défaut 5)."),
  language: z
    .string()
    .min(2)
    .max(8)
    .optional()
    .describe("Code langue BCP-47 (ex : 'fr', 'en'). Défaut 'fr'."),
  query: z
    .string()
    .min(2)
    .max(500)
    .describe("Requête de recherche précise à exécuter sur le Web."),
});

type SearchWebOutput = {
  count?: number;
  error?: string;
  query?: string;
  results?: Array<{
    snippet?: string;
    source?: string;
    title?: string;
    url?: string;
  }>;
  source?: string;
};

// Réutilise l'implémentation du Chat : aucune duplication de la logique de
// recherche ni de ses replis (API mAI, DuckDuckGo, instances Searx).
export const searchWebTool = fromExistingTool({
  metadata: requireAgentToolMetadata("search_web"),
  schema: searchWebInputSchema,
  tool: webSearch,
  toResult: (output) => {
    const result = output as SearchWebOutput;

    if (result?.error) {
      return toolFailure("no_results", result.error);
    }

    const results = Array.isArray(result?.results) ? result.results : [];
    return toolSuccess(
      {
        count: result?.count ?? results.length,
        query: result?.query ?? "",
        results: results.map((item) => ({
          snippet: item.snippet ?? "",
          source: item.source ?? "",
          title: item.title ?? "",
          url: item.url ?? "",
        })),
      },
      webResultsToSources(results)
    );
  },
});
