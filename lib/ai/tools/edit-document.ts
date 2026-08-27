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
      "Make a targeted edit to an existing artifact by finding and replacing an exact string. Preferred over updateDocument for small changes. The old_string must match exactly.",
    execute: async ({ id, old_string, new_string, replace_all }) => {
      const document = await getDocumentById({ id });

      if (!document) {
        return { error: "Document not found" };
      }

      const sessionUserId = session.user?.id || (session.user as any)?.email;
      if (
        document.userId !== sessionUserId &&
        document.userId !== session.user?.id &&
        document.userId !== (session.user as any)?.email
      ) {
        return { error: "Forbidden" };
      }

      let updated = "";
      const currentContent = document.content ?? "";

      if (!old_string || old_string.trim() === "") {
        return {
          error:
            "old_string est obligatoire et ne peut pas être vide pour un editDocument ciblé. Si vous voulez réécrire tout le document, utilisez updateDocument.",
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
          ? currentContent.replaceAll(old_string, new_string)
          : currentContent.replace(old_string, new_string);
      } else {
        // Try trimming / normalized search
        const trimmedOld = old_string.trim();
        if (trimmedOld && currentContent.includes(trimmedOld)) {
          updated = replace_all
            ? currentContent.replaceAll(trimmedOld, new_string)
            : currentContent.replace(trimmedOld, new_string);
        } else {
          return {
            error:
              "old_string introuvable dans le document. Vérifiez l'orthographe exacte ou ajoutez 3-5 lignes de contexte pour garantir l'unicité.",
          };
        }
      }

      await saveDocument({
        content: updated,
        id: document.id,
        kind: document.kind,
        title: document.title,
        userId: document.userId,
      });

      dataStream.write({
        data: null,
        transient: true,
        type: "data-clear",
      });

      if (document.kind === "code") {
        dataStream.write({
          data: updated,
          transient: true,
          type: "data-codeDelta",
        });
      } else if (document.kind === "sheet") {
        dataStream.write({
          data: updated,
          transient: true,
          type: "data-sheetDelta",
        });
      } else if (document.kind === "html") {
        dataStream.write({
          data: updated,
          transient: true,
          type: "data-htmlDelta",
        });
      } else {
        dataStream.write({
          data: updated,
          transient: true,
          type: "data-textDelta",
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
        title: document.title,
      };
    },
    inputSchema: z.object({
      id: z.string().describe("The ID of the artifact to edit"),
      new_string: z
        .string()
        .min(1)
        .max(100_000)
        .describe("Replacement string (1-100k chars)"),
      old_string: z
        .string()
        .min(1)
        .max(100_000)
        .describe(
          "Exact non-empty string to find. Include 3-5 surrounding lines for uniqueness."
        ),
      replace_all: z
        .boolean()
        .optional()
        .describe(
          "Replace all occurrences instead of just the first (default false)"
        ),
    }),
  });
