import { tool } from "ai";
import { z } from "zod";
import { MAI_API_URL } from "@/lib/constants";

type SearchResult = {
  snippet: string;
  source: string;
  title: string;
  url: string;
};

function normalizeResults(data: any, limit: number): SearchResult[] {
  const raw = data?.results || data?.hits || data?.data || data?.items || data;
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((r: any) => {
      const url = r.url || r.link || r.firstURL || r.FirstURL || "";
      if (!url) {
        return null;
      }
      return {
        snippet:
          r.snippet ||
          r.description ||
          r.summary ||
          r.content ||
          r.text ||
          r.AbstractText ||
          r.Text ||
          "",
        source: (() => {
          try {
            return new URL(url).hostname.replace(/^www\./, "");
          } catch {
            return "";
          }
        })(),
        title: r.title || r.heading || r.Heading || url,
        url,
      } as SearchResult;
    })
    .filter((r: SearchResult | null): r is SearchResult => Boolean(r?.url))
    .slice(0, limit);
}

export const webSearch = tool({
  description:
    "Rechercher des informations fraîches et actualisées sur le Web en temps réel (actualités, météo, cours, articles, documentation, tutoriels, etc.). Les résultats sont des sources externes : utilisez-les comme preuves, ne synthétisez pas de réponse finale sans les citer. Retourne une liste de résultats avec titre, extrait, URL et source.",
  execute: async (input) => {
    const query = input.query.trim();
    if (!query) {
      return { error: "Requête de recherche vide." };
    }
    if (query.length > 500) {
      return { error: "Requête trop longue (max 500 caractères)." };
    }

    const count = Math.min(Math.max(input.count ?? 5, 1), 10);
    const language = input.language || "fr";

    const tryPrimary = async (): Promise<SearchResult[] | null> => {
      try {
        const res = await fetch(
          `${MAI_API_URL}/v1/web/search?q=${encodeURIComponent(query)}&count=${count}&language=${encodeURIComponent(language)}`,
          {
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(6_000),
          }
        );
        if (!res.ok) {
          return null;
        }
        const data = await res.json();
        const results = normalizeResults(data, count);
        return results.length > 0 ? results : null;
      } catch {
        return null;
      }
    };

    const tryDuckDuckGo = async (): Promise<SearchResult[]> => {
      try {
        const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1&t=mai-web`;
        const res = await fetch(url, { signal: AbortSignal.timeout(5_000) });
        if (!res.ok) {
          return [];
        }
        const data = (await res.json()) as {
          AbstractText?: string;
          AbstractURL?: string;
          Heading?: string;
          RelatedTopics?: Array<{
            FirstURL?: string;
            Text?: string;
            Topics?: Array<{ FirstURL?: string; Text?: string }>;
          }>;
        };
        const results: SearchResult[] = [];
        if (data.AbstractText && data.AbstractURL) {
          results.push({
            snippet: data.AbstractText,
            source: (() => {
              try {
                return new URL(data.AbstractURL).hostname.replace(/^www\./, "");
              } catch {
                return "";
              }
            })(),
            title: data.Heading || query,
            url: data.AbstractURL,
          });
        }
        for (const topic of data.RelatedTopics ?? []) {
          if (results.length >= count) {
            break;
          }
          if (topic.Text && topic.FirstURL) {
            results.push({
              snippet: topic.Text,
              source: (() => {
                try {
                  return new URL(topic.FirstURL as string).hostname.replace(
                    /^www\./,
                    ""
                  );
                } catch {
                  return "";
                }
              })(),
              title: topic.Text.slice(0, 80),
              url: topic.FirstURL,
            });
          } else if (Array.isArray(topic.Topics)) {
            for (const sub of topic.Topics) {
              if (results.length >= count) {
                break;
              }
              if (sub.Text && sub.FirstURL) {
                results.push({
                  snippet: sub.Text,
                  source: (() => {
                    try {
                      return new URL(sub.FirstURL).hostname.replace(
                        /^www\./,
                        ""
                      );
                    } catch {
                      return "";
                    }
                  })(),
                  title: sub.Text.slice(0, 80),
                  url: sub.FirstURL,
                });
              }
            }
          }
        }
        return results;
      } catch {
        return [];
      }
    };

    const trySearxInstance = async (
      instance: string
    ): Promise<SearchResult[]> => {
      try {
        const res = await fetch(
          `${instance}/search?q=${encodeURIComponent(query)}&format=json&language=${language}&categories=general`,
          {
            headers: {
              Accept: "application/json",
              "User-Agent": "mAI-Web/1.0",
            },
            signal: AbortSignal.timeout(10_000),
          }
        );
        if (!res.ok) {
          return [];
        }
        const data = await res.json();
        return normalizeResults(data, count);
      } catch {
        return [];
      }
    };

    const primary = await tryPrimary();
    if (primary) {
      return {
        count: primary.length,
        query,
        results: primary,
        source: "primary",
      };
    }

    const ddg = await tryDuckDuckGo();
    if (ddg.length > 0) {
      return { count: ddg.length, query, results: ddg, source: "duckduckgo" };
    }

    const searxInstances = ["https://searx.be", "https://search.brave.com"];
    for (const instance of searxInstances) {
      const results = await trySearxInstance(instance);
      if (results.length > 0) {
        return {
          count: results.length,
          query,
          results,
          source: instance,
        };
      }
    }

    return {
      error: `Aucun résultat trouvé pour "${query}".`,
      query,
    };
  },
  inputSchema: z.object({
    count: z
      .number()
      .int()
      .min(1)
      .max(10)
      .optional()
      .describe("Nombre de résultats souhaités (1-10, défaut 5)"),
    language: z
      .string()
      .min(2)
      .max(8)
      .optional()
      .describe("Code langue BCP-47 (ex: 'fr', 'en', 'es'). Défaut 'fr'"),
    query: z
      .string()
      .min(2)
      .max(500)
      .describe("Requête de recherche textuelle précise à exécuter sur le Web"),
  }),
});
