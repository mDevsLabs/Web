import { z } from "zod";
import { requireAgentToolMetadata } from "@/lib/agent/tools/catalog";
import { defineTool } from "@/lib/agent/tools/define-tool";
import { toolFailure, toolSuccess } from "@/lib/agent/types";
import { saveDocument } from "@/lib/db/queries";
import { generateUUID } from "@/lib/utils";

const ARTIFACT_KINDS = ["text", "code", "sheet", "html"] as const;

const createArtifactInputSchema = z.object({
  content: z
    .string()
    .min(1)
    .max(200_000)
    .describe("Contenu complet et final du livrable."),
  kind: z
    .enum(ARTIFACT_KINDS)
    .describe(
      "Type de livrable : 'text' (document), 'code' (code source), 'sheet' (données tabulaires CSV), 'html' (page)."
    ),
  title: z
    .string()
    .min(1)
    .max(120)
    .describe("Titre court et explicite du livrable."),
});

// Les livrables Agent réutilisent l'infrastructure d'artefacts existante
// (table Document + panneau latéral) : rien à dupliquer côté rendu. La
// référence renvoyée est rattachée au run par le step de type "artifact".
export const createArtifactTool = defineTool({
  ...requireAgentToolMetadata("create_artifact"),
  execute: async (input, context) => {
    const documentId = generateUUID();

    try {
      await saveDocument({
        content: input.content,
        id: documentId,
        kind: input.kind,
        title: input.title,
        userId: context.userId,
      });
    } catch (error) {
      return toolFailure(
        "artifact_failed",
        error instanceof Error
          ? `Création du livrable impossible : ${error.message}.`
          : "Création du livrable impossible."
      );
    }

    return toolSuccess(
      {
        documentId,
        kind: input.kind,
        length: input.content.length,
        title: input.title,
      },
      undefined,
      {
        artifact: { documentId, kind: input.kind, title: input.title },
      }
    );
  },
  schema: createArtifactInputSchema,
  summarize: (data) => {
    const value = (data ?? {}) as { title?: string };
    return `Livrable « ${(value.title ?? "livrable").slice(0, 60)} » créé`;
  },
});
