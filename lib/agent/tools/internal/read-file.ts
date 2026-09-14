import { z } from "zod";
import { requireAgentToolMetadata } from "@/lib/agent/tools/catalog";
import { defineTool } from "@/lib/agent/tools/define-tool";
import {
  extractDocument,
  fetchDocumentBuffer,
  MAX_EXTRACT_CHARS,
  MIN_EXTRACT_CHARS,
} from "@/lib/agent/tools/internal/extract";
import { type AgentSource, toolFailure, toolSuccess } from "@/lib/agent/types";
import { MAI_API_URL } from "@/lib/constants";

const readFileInputSchema = z
  .object({
    extractTables: z
      .boolean()
      .optional()
      .describe(
        "Extrait aussi les tableaux détectés, renvoyés en CSV (pertinent pour PDF et DOCX)."
      ),
    fileId: z
      .string()
      .min(1)
      .optional()
      .describe(
        "Identifiant du fichier dans la bibliothèque mAI de l'utilisateur."
      ),
    maxChars: z
      .number()
      .int()
      .min(MIN_EXTRACT_CHARS)
      .max(MAX_EXTRACT_CHARS)
      .optional()
      .describe("Nombre maximum de caractères renvoyés (défaut 100 000)."),
    url: z
      .string()
      .url()
      .optional()
      .describe("URL publique du document à lire."),
  })
  .refine((value) => Boolean(value.fileId || value.url), {
    message: "Fournissez soit 'fileId' (bibliothèque), soit 'url'.",
  });

type CloudFilePayload = {
  files?: Array<{
    filename?: string;
    id?: string;
    mime_type?: string;
    original_name?: string;
    url?: string;
  }>;
};

// Résout un fichier de la bibliothèque cloud en URL lisible côté serveur.
// Aucun endpoint nouveau n'est nécessaire : /cloud/files expose déjà l'URL.
async function resolveLibraryFile(params: {
  fileId: string;
  sessionToken: string;
  signal?: AbortSignal;
}): Promise<{
  error?: string;
  mimeType?: string;
  name?: string;
  url?: string;
}> {
  try {
    const response = await fetch(`${MAI_API_URL}/cloud/files`, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${params.sessionToken}` },
      signal: params.signal,
    });
    if (!response.ok) {
      return {
        error: `Bibliothèque inaccessible (HTTP ${response.status}).`,
      };
    }
    const payload = (await response.json()) as CloudFilePayload;
    const file = (payload.files ?? []).find(
      (candidate) => String(candidate.id ?? "") === params.fileId
    );
    if (!file?.url) {
      return {
        error:
          "Fichier introuvable dans la bibliothèque, ou sans URL de contenu exploitable.",
      };
    }
    return {
      mimeType: file.mime_type,
      name: file.original_name ?? file.filename ?? "document",
      url: file.url,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "inconnue";
    return { error: `Résolution du fichier impossible : ${message}.` };
  }
}

export const readFileTool = defineTool({
  ...requireAgentToolMetadata("read_file"),
  execute: async (input, context) => {
    const source: { authHeader?: string; name?: string; url?: string } = {};

    if (input.fileId) {
      const resolved = await resolveLibraryFile({
        fileId: input.fileId,
        sessionToken: context.sessionToken,
        signal: context.signal,
      });
      if (resolved.error || !resolved.url) {
        return toolFailure(
          "file_unavailable",
          resolved.error ?? "Fichier indisponible."
        );
      }
      source.url = resolved.url;
      source.name = resolved.name;
      source.authHeader = `Bearer ${context.sessionToken}`;
    } else if (input.url) {
      source.url = input.url;
    }

    if (!source.url) {
      return toolFailure(
        "invalid_input",
        "Aucune source lisible fournie (ni 'fileId', ni 'url')."
      );
    }

    const fetched = await fetchDocumentBuffer({
      headers: source.authHeader
        ? { Authorization: source.authHeader }
        : undefined,
      signal: context.signal,
      url: source.url,
    });
    if ("error" in fetched) {
      return toolFailure("read_failed", fetched.error);
    }

    const extracted = await extractDocument({
      buffer: fetched.buffer,
      contentType: fetched.contentType,
      extractTables: input.extractTables,
      maxChars: input.maxChars,
      url: source.url,
    });
    if (extracted.error || !extracted.data) {
      return toolFailure(
        "read_failed",
        extracted.error ?? "Lecture du document impossible."
      );
    }

    const document = extracted.data;
    const name = source.name ?? source.url.split("/").pop() ?? "document";

    const sources: AgentSource[] = [
      {
        fileId: input.fileId,
        id: `file-${input.fileId ?? name}`,
        kind: input.fileId ? "library" : "file",
        metadata: {
          contentType: document.contentType,
          pages: document.pages,
          truncated: document.isTruncated,
        },
        title: name,
        url: input.url,
      },
    ];

    return toolSuccess(
      {
        contentType: document.contentType,
        headings: document.headings,
        isTruncated: document.isTruncated,
        length: document.length,
        name,
        pages: document.pages,
        tables: document.tables,
        text: document.text,
      },
      sources
    );
  },
  schema: readFileInputSchema,
  summarize: (data) => {
    const value = (data ?? {}) as {
      isTruncated?: boolean;
      length?: number;
      name?: string;
    };
    const length = value.length ?? 0;
    return `${(value.name ?? "document").slice(0, 60)} · ${length.toLocaleString(
      "fr-FR"
    )} caractères${value.isTruncated ? " (tronqué)" : ""}`;
  },
});
