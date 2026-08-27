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
      "Make a targeted edit to an existing artifact by finding and replacing an exact string. Preferred over updateDocument for small changes. The old_string must match exactly. If you want to replace the whole document, provide 'content' instead of old_string/new_string.",
    execute: async ({ id, old_string, new_string, replace_all, title, content }) => {
      // Validate UUID format early for clear feedback
      if (
        !id ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
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

      const sessionUserId = session.user?.id || (session.user as any)?.email;
      if (
        document.userId !== sessionUserId &&
        document.userId !== session.user?.id
      ) {
        return { error: "Forbidden" };
      }

      let updated = "";
      const currentContent = document.content ?? "";

      // Direct full replacement with content
      if (content && content.trim().length > 0) {
        updated = content;
        await saveDocument({
          content: updated,
          id: document.id,
          kind: document.kind,
          title: title ? title.trim() : document.title,
          userId: document.userId,
        });

        dataStream.write({
          data: null,
          transient: true,
          type: "data-clear",
        });

        const deltaType =
          document.kind === "code"
            ? "data-codeDelta"
            : document.kind === "sheet"
              ? "data-sheetDelta"
              : document.kind === "html"
                ? "data-htmlDelta"
                : "data-textDelta";

        const chunkSize = 5000;
        for (let i = 0; i < updated.length; i += chunkSize) {
          const chunk = updated.slice(i, i + chunkSize);
          dataStream.write({
            data: chunk,
            transient: true,
            type: deltaType,
          });
        }

        dataStream.write({ data: null, transient: true, type: "data-finish" });

        return {
          content:
            document.kind === "code"
              ? "The script has been replaced with direct content successfully."
              : "The document has been replaced with direct content successfully.",
          id,
          kind: document.kind,
          title: title ? title.trim() : document.title,
        };
      }

      if (!old_string || old_string.trim() === "") {
        return {
          error:
            "old_string est obligatoire et ne peut pas être vide pour un editDocument ciblé. Si vous voulez réécrire tout le document, utilisez 'content' (remplacement total) ou updateDocument.",
        };
      }

      if (!currentContent) {
        return {
          error:
            "Le document est vide. Utilisez createDocument pour créer du contenu, ou updateDocument pour initialiser.",
        };
      }

      if (currentContent.includes(old_string)) {
        updated = replace_all
          ? currentContent.replaceAll(old_string, new_string || "")
          : currentContent.replace(old_string, new_string || "");
      } else {
        const trimmedOld = old_string.trim();
        if (trimmedOld && currentContent.includes(trimmedOld)) {
          updated = replace_all
            ? currentContent.replaceAll(trimmedOld, new_string || "")
            : currentContent.replace(trimmedOld, new_string || "");
        } else {
          return {
            error:
              "old_string introuvable dans le document. Vérifiez l'orthographe exacte ou ajoutez 3-5 lignes de contexte pour garantir l'unicité. Conseil : si le changement est massif, utilisez 'content' ou updateDocument.",
          };
        }
      }

      await saveDocument({
        content: updated,
        id: document.id,
        kind: document.kind,
        title: title ? title.trim() : document.title,
        userId: document.userId,
      });

      dataStream.write({
        data: null,
        transient: true,
        type: "data-clear",
      });

      const deltaType =
        document.kind === "code"
          ? "data-codeDelta"
          : document.kind === "sheet"
            ? "data-sheetDelta"
            : document.kind === "html"
              ? "data-htmlDelta"
              : "data-textDelta";

      const chunkSize = 5000;
      for (let i = 0; i < updated.length; i += chunkSize) {
        const chunk = updated.slice(i, i + chunkSize);
        dataStream.write({
          data: chunk,
          transient: true,
          type: deltaType,
        });
      }

      dataStream.write({ data: null, transient: true, type: "data-finish" });

      return {
        content:
          document.kind === "code"
            ? "The script has been edited successfully."
            : "The document has been edited successfully.",
        id,
        kind: document.kind,
        title: title ? title.trim() : document.title,
      };
    },
    inputSchema: z.object({
      id: z.string().describe("The ID of the artifact to edit"),
      new_string: z
        .string()
        .min(1)
        .max(100_000)
        .optional()
        .describe("Replacement string (1-100k chars). Required unless 'content' is provided."),
      old_string: z
        .string()
        .min(1)
        .max(100_000)
        .optional()
        .describe(
          "Exact non-empty string to find. Include 3-5 surrounding lines for uniqueness. Not required if providing 'content'."
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
      content: z
        .string()
        .min(1)
        .max(200_000)
        .optional()
        .describe(
          "OPTIONAL. If provided, replaces the entire document content directly. Use instead of old_string/new_string for full rewrites."
        ),
    }),
  });
