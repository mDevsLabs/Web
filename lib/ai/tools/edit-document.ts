import { tool, type UIMessageStreamWriter } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { getDocumentById, saveDocument } from "@/lib/db/queries";
import type { ChatMessage } from "@/lib/types";

type EditDocumentProps = {
  session: Session;
  dataStream: UIMessageStreamWriter<ChatMessage>;
};

export const editDocument = ({ session, dataStream }: EditDocumentProps) =>
  tool({
    description:
      "Make a targeted edit to an existing artifact. Preferred over updateDocument for small changes. Supports: find/replace via old_string/new_string, insert before/after via position, prepend/append, delete by lines via deleteRange, full replace via content, rename via title. Options: anchor for disambiguation, caseSensitive, replace_all, preview (dry-run). If you want to replace the whole document, provide 'content' instead of old_string/new_string.",
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

      let updated = "";
      const currentContent = document.content ?? "";
      const effectiveTitle = title
        ? title.trim().slice(0, 200)
        : document.title;
      const isCaseSensitive = caseSensitive ?? true;
      const effectivePosition = position ?? "replace";

      // Helper: stream helper to avoid duplication
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
            type: deltaType as any,
          });
        }
      };

      // Direct full replacement with content
      if (content && content.trim().length > 0) {
        updated = content;

        if (preview) {
          return {
            contentLength: updated.length,
            id,
            kind: document.kind,
            message:
              "Preview: full content replacement (not saved, preview=true).",
            preview: updated.slice(0, 5000),
            title: effectiveTitle,
            wouldSave: true,
          };
        }

        await saveDocument({
          content: updated,
          id: document.id,
          kind: document.kind,
          title: effectiveTitle,
          userId: document.userId,
        });

        dataStream.write({ data: null, transient: true, type: "data-clear" });
        streamContent(updated);
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

      if (!currentContent) {
        return {
          error:
            "Le document est vide. Utilisez createDocument pour créer du contenu, ou updateDocument pour initialiser.",
        };
      }

      // Delete by line range (1-indexed)
      if (deleteRange) {
        const lines = currentContent.split("\n");
        const totalLines = lines.length;
        const start = Math.max(1, Math.min(deleteRange.start, totalLines));
        const end = Math.max(start, Math.min(deleteRange.end, totalLines));
        if (start > totalLines) {
          return {
            error: `deleteRange start ${start} dépasse le nombre de lignes (${totalLines}).`,
          };
        }
        const before = lines.slice(0, start - 1).join("\n");
        const after = lines.slice(end).join("\n");
        updated = [before, after]
          .filter(
            (_s, i, _arr) => !(i === 0 && before === "" && after !== "") || true
          )
          .join(before && after ? "\n" : "");
        // Fix join when deleting in middle: need newline between
        if (before && after) {
          updated = `${before}\n${after}`;
        } else {
          updated = before + after;
        }

        if (preview) {
          return {
            deletedLines: {
              end,
              start,
              totalAfter: updated.split("\n").length,
              totalBefore: totalLines,
            },
            id,
            kind: document.kind,
            message: `Preview: would delete lines ${start}-${end} (not saved).`,
            preview: updated.slice(0, 5000),
            title: effectiveTitle,
            wouldSave: true,
          };
        }

        await saveDocument({
          content: updated,
          id: document.id,
          kind: document.kind,
          title: effectiveTitle,
          userId: document.userId,
        });

        dataStream.write({ data: null, transient: true, type: "data-clear" });
        streamContent(updated);
        dataStream.write({ data: null, transient: true, type: "data-finish" });

        return {
          content: "The document has been edited successfully (lines deleted).",
          id,
          kind: document.kind,
          title: effectiveTitle,
        };
      }

      // Prepend / Append (no old_string needed)
      if (effectivePosition === "prepend" || effectivePosition === "append") {
        if (!new_string || new_string.length === 0) {
          return {
            error: `position='${effectivePosition}' requiert 'new_string' non vide à ${effectivePosition === "prepend" ? "préfixer" : "suffixer"}.`,
          };
        }
        updated =
          effectivePosition === "prepend"
            ? `${new_string}\n${currentContent}`
            : `${currentContent}\n${new_string}`;

        if (preview) {
          return {
            id,
            kind: document.kind,
            message: `Preview: would ${effectivePosition} content (not saved).`,
            preview: updated.slice(0, 5000),
            title: effectiveTitle,
            wouldSave: true,
          };
        }

        await saveDocument({
          content: updated,
          id: document.id,
          kind: document.kind,
          title: effectiveTitle,
          userId: document.userId,
        });

        dataStream.write({ data: null, transient: true, type: "data-clear" });
        streamContent(updated);
        dataStream.write({ data: null, transient: true, type: "data-finish" });

        return {
          content: `The document has been edited successfully (${effectivePosition}).`,
          id,
          kind: document.kind,
          title: effectiveTitle,
        };
      }

      // From here, old_string is required for replace/before/after
      if (!old_string || old_string.trim() === "") {
        return {
          error:
            "old_string est obligatoire et ne peut pas être vide pour un editDocument ciblé. Si vous voulez réécrire tout le document, utilisez 'content' (remplacement total) ou updateDocument. Pour prepend/append utilisez position='prepend'/'append' avec new_string.",
        };
      }

      // Build search targets with anchor and case sensitivity
      const searchNeedle = anchor ? `${anchor}${old_string}` : old_string;
      const searchNeedleTrimmed = anchor
        ? `${anchor.trim()}${old_string.trim()}`
        : old_string.trim();

      const findAndReplace = (
        source: string,
        needle: string,
        replacementText: string,
        all: boolean,
        caseSensitiveFlag: boolean
      ): { result: string; found: boolean } => {
        if (!caseSensitiveFlag) {
          // case-insensitive replace via regex escape
          const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const flags = all ? "gi" : "i";
          const regex = new RegExp(escaped, flags);
          if (!regex.test(source)) {
            return { found: false, result: source };
          }
          const result = all
            ? source.replace(regex, replacementText)
            : source.replace(regex, replacementText);
          return { found: true, result };
        }
        if (source.includes(needle)) {
          const result = all
            ? source.replaceAll(needle, replacementText)
            : source.replace(needle, replacementText);
          return { found: true, result };
        }
        return { found: false, result: source };
      };

      const replacement = new_string ?? "";

      if (effectivePosition === "before" || effectivePosition === "after") {
        // Insert before/after the found old_string
        let found = false;
        let tryNeedles = [
          searchNeedle,
          searchNeedleTrimmed,
          old_string,
          old_string.trim(),
        ].filter(Boolean) as string[];
        // deduplicate
        tryNeedles = [...new Set(tryNeedles)];
        for (const needle of tryNeedles) {
          const searchRes = findAndReplace(
            currentContent,
            needle,
            needle,
            false,
            isCaseSensitive
          );
          if (searchRes.found) {
            const insertText = replacement;
            if (effectivePosition === "before") {
              updated = isCaseSensitive
                ? currentContent.replace(needle, `${insertText}${needle}`)
                : (() => {
                    const escaped = needle.replace(
                      /[.*+?^${}()|[\]\\]/g,
                      "\\$&"
                    );
                    const regex = new RegExp(escaped, "i");
                    return currentContent.replace(
                      regex,
                      `${insertText}${needle}`
                    );
                  })();
            } else {
              updated = isCaseSensitive
                ? currentContent.replace(needle, `${needle}${insertText}`)
                : (() => {
                    const escaped = needle.replace(
                      /[.*+?^${}()|[\]\\]/g,
                      "\\$&"
                    );
                    const regex = new RegExp(escaped, "i");
                    return currentContent.replace(
                      regex,
                      `${needle}${insertText}`
                    );
                  })();
            }
            // handle replace_all for before/after: replace all occurrences with insertion
            if (replace_all) {
              const escaped2 = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
              const flags2 = isCaseSensitive ? "g" : "gi";
              const regex2 = new RegExp(escaped2, flags2);
              updated = currentContent.replace(regex2, (match) =>
                effectivePosition === "before"
                  ? `${insertText}${match}`
                  : `${match}${insertText}`
              );
            }
            found = true;
            break;
          }
        }
        if (!found) {
          return {
            error: `old_string introuvable pour insertion '${effectivePosition}'. Vérifiez l'orthographe exacte, l'ancre, ou caseSensitive. Conseil : ajoutez 3-5 lignes de contexte dans anchor.`,
          };
        }
      } else {
        // Standard replace
        let res = findAndReplace(
          currentContent,
          searchNeedle,
          replacement,
          !!replace_all,
          isCaseSensitive
        );
        if (!res.found) {
          res = findAndReplace(
            currentContent,
            searchNeedleTrimmed,
            replacement,
            !!replace_all,
            isCaseSensitive
          );
        }
        if (!res.found) {
          res = findAndReplace(
            currentContent,
            old_string,
            replacement,
            !!replace_all,
            isCaseSensitive
          );
        }
        if (!res.found) {
          const trimmedOld = old_string.trim();
          if (trimmedOld) {
            res = findAndReplace(
              currentContent,
              trimmedOld,
              replacement,
              !!replace_all,
              isCaseSensitive
            );
          }
        }
        if (!res.found) {
          return {
            error:
              "old_string introuvable dans le document. Vérifiez l'orthographe exacte, l'ancre ou caseSensitive, ou ajoutez 3-5 lignes de contexte pour garantir l'unicité. Conseil : si le changement est massif, utilisez 'content' ou updateDocument.",
          };
        }
        updated = res.result;
      }

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
        .min(1)
        .max(100_000)
        .optional()
        .describe(
          "Replacement string (1-100k chars). Required unless 'content' or deleteRange is provided. Pour position before/after: texte à insérer."
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
