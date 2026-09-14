import { z } from "zod";
import { fromExistingTool } from "@/lib/agent/tools/adapters/existing";
import { requireAgentToolMetadata } from "@/lib/agent/tools/catalog";
import { type AgentSource, toolFailure, toolSuccess } from "@/lib/agent/types";
import { readUrl } from "@/lib/ai/tools/read-url";

const MIN_CHARS = 2000;
const MAX_CHARS = 60_000;

// Le schéma Agent est plus strict que celui du Chat : URL http(s) explicite
// (aucune supposition de protocole) et bornes de taille. La protection SSRF et
// l'extraction du texte restent celles du Chat (lib/ai/tools/read-url.ts) :
// aucune duplication de logique réseau.
const readUrlInputSchema = z.object({
  maxChars: z
    .number()
    .int()
    .min(MIN_CHARS)
    .max(MAX_CHARS)
    .optional()
    .describe(
      `Nombre maximum de caractères renvoyés (${MIN_CHARS}-${MAX_CHARS}, défaut 15 000).`
    ),
  url: z
    .string()
    .min(4)
    .max(2000)
    .refine((value) => {
      try {
        const parsed = new URL(value);
        return parsed.protocol === "https:" || parsed.protocol === "http:";
      } catch {
        return false;
      }
    }, "URL http(s) complète attendue (ex. https://exemple.fr/page)."),
});

type ReadUrlOutput = {
  content?: string;
  description?: string;
  error?: string;
  isTruncated?: boolean;
  length?: number;
  title?: string;
  url?: string;
};

export const readUrlTool = fromExistingTool({
  metadata: requireAgentToolMetadata("read_url"),
  schema: readUrlInputSchema,
  summarize: (data) => {
    const value = (data ?? {}) as ReadUrlOutput;
    if (typeof value.length === "number") {
      return `${(value.title ?? "Page").slice(0, 80)} · ${value.length.toLocaleString(
        "fr-FR"
      )} caractères${value.isTruncated ? " (tronqué)" : ""}`;
    }
    return "Page lue";
  },
  toInput: (input) => ({ maxLength: input.maxChars, url: input.url }),
  tool: readUrl,
  toResult: (output) => {
    const result = (output ?? {}) as ReadUrlOutput;
    if (result.error || typeof result.content !== "string") {
      return toolFailure(
        "read_url_failed",
        result.error ?? "Lecture de la page impossible.",
        { category: "transient", retryable: true }
      );
    }

    const sources: AgentSource[] = result.url
      ? [
          {
            id: `url-${result.url}`,
            kind: "web",
            metadata: { isTruncated: result.isTruncated === true },
            title: result.title ?? result.url,
            url: result.url,
          },
        ]
      : [];

    return toolSuccess(
      {
        content: result.content,
        description: result.description ?? null,
        isTruncated: result.isTruncated === true,
        length: result.length ?? result.content.length,
        title: result.title ?? result.url ?? "Page",
        url: result.url ?? null,
      },
      sources
    );
  },
});
