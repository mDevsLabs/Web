import { tool } from "ai";
import { z } from "zod";
import { MAI_API_URL } from "@/lib/constants";

export const webSearch = tool({
  description:
    "Rechercher des informations fraîches et actualisées sur le Web en temps réel (actualités, météo, cours, articles, etc.).",
  execute: async (input) => {
    const query = input.query.trim();
    if (!query) {
      return { error: "Requête de recherche vide." };
    }

    try {
      // 1. Appel au proxy /v1/web/search ou service web mAI
      const res = await fetch(
        `${MAI_API_URL}/v1/web/search?q=${encodeURIComponent(query)}&count=${input.count || 5}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        return {
          query,
          results: data.results || data.hits || data,
          success: true,
        };
      }
    } catch (_err) {
      // Fallback
    }

    try {
      const ddgRes = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
      );
      if (ddgRes.ok) {
        const ddgData = await ddgRes.json();
        const results = [];
        if (ddgData.AbstractText) {
          results.push({
            snippet: ddgData.AbstractText,
            title: ddgData.Heading || query,
            url: ddgData.AbstractURL,
          });
        }
        if (Array.isArray(ddgData.RelatedTopics)) {
          for (const topic of ddgData.RelatedTopics.slice(0, 4)) {
            if (topic.Text && topic.FirstURL) {
              results.push({
                snippet: topic.Text,
                title: topic.Text.slice(0, 60),
                url: topic.FirstURL,
              });
            }
          }
        }
        return {
          query,
          results:
            results.length > 0
              ? results
              : [{ snippet: "Aucun résultat direct trouvé." }],
          success: true,
        };
      }
    } catch (fallbackErr) {
      console.error("Erreur webSearch:", fallbackErr);
    }

    return {
      error: `Impossible d'exécuter la recherche pour "${query}".`,
      query,
    };
  },
  inputSchema: z.object({
    count: z
      .number()
      .optional()
      .describe("Nombre de résultats souhaités (1-10)"),
    query: z
      .string()
      .describe("Requête de recherche textuelle précise à exécuter sur le Web"),
  }),
});
