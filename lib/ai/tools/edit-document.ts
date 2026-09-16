import { tool, type UIMessageStreamWriter } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { hashContent } from "@/lib/artifacts/hash";
import {
  applyDocumentPatch,
  documentPatchOpSchema,
  type DocumentPatch,
} from "@/lib/artifacts/patch";
import { getDocumentById, saveDocument, saveDocumentProposal } from "@/lib/db/queries";
import type { ChatMessage, DocumentProposalPayload } from "@/lib/types";
import { generateUUID } from "@/lib/utils";

type EditDocumentProps = {
  session: Session;
  dataStream: UIMessageStreamWriter<ChatMessage>;
};

const PROPOSED_CONTENT_MAX = 200_000;

export const editDocument = ({ session, dataStream }: EditDocumentProps) =>
  tool({
    description:
      "Make a targeted edit to an existing artifact. Preferred over updateDocument for small changes. Supports: find/replace via old_string/new_string, insert before/after via position, prepend/append, delete by lines via deleteRange, full replace via content, rename via title. Options: anchor for disambiguation, caseSensitive, replace_all, preview (dry-run), propose (store as a suggestion the user must accept instead of applying directly). If you want to replace the whole document, provide 'content' instead of old_string/new_string.",
    execute: async ({
      id,
      old_string,
      new_string,
      replace_all,
      title,
      content,
      anchor,
      position,
      caseSensitive,
      preview,
      propose,
      deleteRange,
    }) => {
      // Validate UUID format early for clear feedback
      if (
        !id ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          id
        )
      ) {
        return {
          error:
            "ID invalide. L-ID doit être un UUID valide (ex: 550e8400-e29b-41d4-a716-446655440000).",
        };
      }

      const document = await getDocumentById({ id });

      if (!document) {
        return { error: "Document not found" };
      }

      const sessionUserId =
        session.user?.id ||
        (session.user as unknown as { email?: string })?.email;
      if (
        document.userId !== sessionUserId &&
        document.userId !== session.user?.id
      ) {
        return { error: "Forbidden" };
      }

      const currentContent = document.content ?? "";
      const effectiveTitle = title
        ? title.trim().slice(0, 200)
        : document.title;
      const effectivePosition = position ?? "replace";

      const streamContent = (
        contentToStream: string,
        kindOverride?: string
      ) => {
        const k = kindOverride || document.kind;
        const deltaType =
          k === "code"
            ? "data-codeDelta"
            : k === "sheet"
              ? "data-sheetDelta"
              : k === "html"
                ? "data-htmlDelta"
                : "data-textDelta";
        const chunkSize = 5000;
        for (let i = 0; i < contentToStream.length; i += chunkSize) {
          const chunk = contentToStream.slice(i, i + chunkSize);
          dataStream.write({
            data: chunk,
            transient: true,
            type: deltaType as never,
          });
        }
      };

      // --- Remplacement total (content direct) : inchangé, hors patch ciblé ---
      if (content && content.trim().length > 0) {
        if (preview) {
          return {
            contentLength: content.length,
            id,
            kind: document.kind,
            message:
              "Preview: full content replacement (not saved, preview=true).",
            preview: content.slice(0, 5000),
            title: effectiveTitle,
            wouldSave: true,
          };
        }

        await saveDocument({
          content,
          id: document.id,
          kind: document.kind,
          title: effectiveTitle,
          userId: document.userId,
        });

        dataStream.write({ data: null, transient: true, type: "data-clear" });
        streamContent(content);
        dataStream.write({ data: null, transient: true, type: "data-finish" });

        return {
          content:
            document.kind === "code"
              ? "The script has been replaced with direct content successfully."
              : "The document has been replaced with direct content successfully.",
          id,
          kind: document.kind,
          title: effectiveTitle,
        };
      }

      // --- Construction du patch ciblé typé (lib/artifacts/patch.ts) ---
      const ops: DocumentPatch["ops"] = [];

      if (deleteRange) {
        ops.push({
          endLine: deleteRange.end,
          startLine: deleteRange.start,
          type: "delete_range",
        });
      } else if (effectivePosition === "prepend") {
        if (!new_string || new_string.length === 0) {
          return {
            error:
              "position='prepend' requiert 'new_string' non vide à préfixer.",
          };
        }
        ops.push({
          content: new_string,
          line: 1,
          position: "before",
          type: "insert",
        });
      } else if (effectivePosition === "append") {
        if (!new_string || new_string.length === 0) {
          return {
            error: "position='append' requiert 'new_string' non vide à suffixer.",
          };
        }
        ops.push({
          content: new_string,
          line: Number.MAX_SAFE_INTEGER,
          position: "after",
          type: "insert",
        });
      } else {
        if (!old_string || old_string.trim() === "") {
          return {
            error:
              "old_string est obligatoire et ne peut pas être vide pour un editDocument ciblé. Si vous voulez réécrire tout le document, utilisez 'content' (remplacement total) ou updateDocument. Pour prepend/append utilisez position='prepend'/'append' avec new_string.",
          };
        }
        const searchNeedle = anchor ? `${anchor}${old_string}` : old_string;
        const insert = new_string ?? "";
        const replaceWith =
          effectivePosition === "before"
            ? `${insert}${searchNeedle}`
            : effectivePosition === "after"
              ? `${searchNeedle}${insert}`
              : insert;

        ops.push({
          caseSensitive: caseSensitive ?? true,
          find: searchNeedle,
          replaceAll: effectivePosition === "before" || effectivePosition === "after" ? !!replace_all : !!replace_all,
          replaceWith,
          type: "replace_text",
        });
      }

      if (!currentContent) {
        return {
          error:
            "Le document est vide. Utilisez createDocument pour créer du contenu, ou updateDocument pour initialiser.",
        };
      }

      const parsedOps = z
        .array(documentPatchOpSchema)
        .safeParse(ops);
      if (!parsedOps.success) {
        return { error: `Patch invalide : ${parsedOps.error.message}` };
      }

      const patch: DocumentPatch = {
        baseHash: hashContent(currentContent),
        ops: parsedOps.data,
      };

      const result = applyDocumentPatch(currentContent, patch);

      if (!result.ok) {
        const first = result.errors[0];
        return {
          error: `Édition ciblée impossible : ${first?.message ?? "patch invalide"}`,
          errors: result.errors,
        };
      }

      const updated = result.content;

      if (preview) {
        return {
          id,
          kind: document.kind,
          message: "Preview: would apply edit (not saved, preview=true).",
          preview: updated.slice(0, 5000),
          previewLength: updated.length,
          title: effectiveTitle,
          wouldSave: true,
        };
      }

      // --- Mode proposition : stockage + diffusion, JAMAIS d'application ---
      if (propose) {
        const proposalId = generateUUID();
        const truncated =
          updated.length > PROPOSED_CONTENT_MAX
            ? `${updated.slice(0, PROPOSED_CONTENT_MAX)}\n\n[… contenu tronqué pour l'aperçu …]`
            : updated;

        const chatId =
          (dataStream as unknown as { chatId?: string } | undefined)?.chatId ??
          null;

        await saveDocumentProposal({
          baseHash: patch.baseHash,
          chatId,
          description:
            effectivePosition === "replace"
              ? `Remplacer « ${(old_string ?? "").slice(0, 80)} »`
              : `Édition ciblée (${effectivePosition})`,
          documentId: document.id,
          id: proposalId,
          ops: patch.ops,
          userId: document.userId,
        });

        const payload: DocumentProposalPayload = {
          baseContent: currentContent,
          baseHash: patch.baseHash,
          chatId,
          description:
            effectivePosition === "replace"
              ? `Remplacer « ${(old_string ?? "").slice(0, 80)} »`
              : `Édition ciblée (${effectivePosition})`,
          documentId: document.id,
          id: proposalId,
          ops: patch.ops,
          proposedContent: truncated,
        };

        dataStream.write({
          data: payload,
          transient: true,
          type: "data-proposal",
        });

        return {
          content:
            "A targeted change has been proposed. It is stored as a suggestion and requires explicit user approval before being applied.",
          id,
          kind: document.kind,
          proposalId,
          title: effectiveTitle,
        };
      }

      // --- Application directe (comportement historique conservé) ---
      await saveDocument({
        content: updated,
        id: document.id,
        kind: document.kind,
        title: effectiveTitle,
        userId: document.userId,
      });

      dataStream.write({
        data: null,
        transient: true,
        type: "data-clear",
      });

      streamContent(updated);

      dataStream.write({ data: null, transient: true, type: "data-finish" });

      return {
        content:
          document.kind === "code"
            ? "The script has been edited successfully."
            : "The document has been edited successfully.",
        id,
        kind: document.kind,
        title: effectiveTitle,
      };
    },
    inputSchema: z.object({
      anchor: z
        .string()
        .min(1)
        .max(500)
        .optional()
        .describe(
          "Contexte d'ancrage 1-2 lignes avant old_string pour lever ambiguïté (sera concaténé à old_string lors de la recherche)"
        ),
      caseSensitive: z
        .boolean()
        .optional()
        .describe(
          "Recherche sensible à la casse (défaut true). Mettre false pour insensible."
        ),
      content: z
        .string()
        .min(1)
        .max(200_000)
        .optional()
        .describe(
          "OPTIONAL. If provided, replaces the entire document content directly. Use instead of old_string/new_string for full rewrites."
        ),
      deleteRange: z
        .object({
          end: z
            .number()
            .int()
            .min(1)
            .max(100_000)
            .describe("Ligne de fin inclusive (1-indexed)"),
          start: z
            .number()
            .int()
            .min(1)
            .max(100_000)
            .describe("Ligne de début (1-indexed)"),
        })
        .optional()
        .describe(
          "Supprimer un intervalle de lignes (1-indexed, inclusif). Alternative à old_string pour suppressions massives."
        ),
      id: z.string().describe("The ID of the artifact to edit"),
      new_string: z
        .string()
        .max(100_000)
        .optional()
        .describe(
          "Replacement string (up to 100k chars). Required unless 'content' or deleteRange is provided. Pour position before/after: texte à insérer."
        ),
      old_string: z
        .string()
        .min(1)
        .max(100_000)
        .optional()
        .describe(
          "Exact non-empty string to find. Include 3-5 surrounding lines for uniqueness. Not required if providing 'content' or using position prepend/append or deleteRange."
        ),
      position: z
        .enum(["replace", "before", "after", "prepend", "append"])
        .optional()
        .describe(
          "Mode d'édition: 'replace' (défaut, remplace old_string), 'before'/'after' (insère avant/après old_string), 'prepend' (début du doc), 'append' (fin du doc)"
        ),
      preview: z
        .boolean()
        .optional()
        .describe(
          "Si true, prévisualise le résultat sans sauvegarder (dry-run). Retourne preview."
        ),
      propose: z
        .boolean()
        .optional()
        .describe(
          "Si true, stocke l'édition comme une PROPOSITION à approuver (accept/refuse) au lieu de l'appliquer immédiatement. Utilisez-le quand l'utilisateur demande des suggestions ou une revue avant modification."
        ),
      replace_all: z
        .boolean()
        .optional()
        .describe(
          "Replace all occurrences instead of just the first (default false)"
        ),
      title: z
        .string()
        .min(1)
        .max(200)
        .optional()
        .describe("New title for the document (optional, for renaming)."),
    }),
  });
