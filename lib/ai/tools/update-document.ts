import { tool, type UIMessageStreamWriter } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { documentHandlersByArtifactKind } from "@/lib/artifacts/server";
import { getDocumentById, saveDocument } from "@/lib/db/queries";
import type { ChatMessage } from "@/lib/types";

type UpdateDocumentProps = {
  session: Session;
  dataStream: UIMessageStreamWriter<ChatMessage>;
  modelId: string;
};

export const updateDocument = ({
  session,
  dataStream,
  modelId,
}: UpdateDocumentProps) =>
  tool({
    description:
      "Full rewrite of an existing artifact. Only use for major changes where most content needs replacing. If you already wrote the full new content in your response, provide it directly in 'content' to save it immediately. Prefer editDocument for targeted changes.",
    execute: async ({ id, description, content }) => {
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

      dataStream.write({
        data: null,
        transient: true,
        type: "data-clear",
      });

      // Bypass direct: if content is provided, save and stream immediately
      if (content && content.trim().length > 0) {
        const userId = sessionUserId || document.userId;
        if (userId) {
          await saveDocument({
            content,
            id: document.id,
            kind: document.kind,
            title: document.title,
            userId: String(userId),
          });
        }

        const deltaType =
          document.kind === "code"
            ? "data-codeDelta"
            : document.kind === "sheet"
              ? "data-sheetDelta"
              : document.kind === "html"
                ? "data-htmlDelta"
                : "data-textDelta";

        const chunkSize = 5000;
        for (let i = 0; i < content.length; i += chunkSize) {
          const chunk = content.slice(i, i + chunkSize);
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
              ? "The script has been updated with direct content successfully."
              : "The document has been updated with direct content successfully.",
          id: document.id,
          kind: document.kind,
          title: document.title,
        };
      }

      const documentHandler = documentHandlersByArtifactKind.find(
        (documentHandlerByArtifactKind) =>
          documentHandlerByArtifactKind.kind === document.kind
      );

      if (!documentHandler) {
        throw new Error(`No document handler found for kind: ${document.kind}`);
      }

      await documentHandler.onUpdateDocument({
        dataStream,
        description: description || "Improve the content",
        document,
        modelId,
        session,
      });

      dataStream.write({ data: null, transient: true, type: "data-finish" });

      return {
        content:
          document.kind === "code"
            ? "The script has been updated successfully."
            : "The document has been updated successfully.",
        id: document.id,
        kind: document.kind,
        title: document.title,
      };
    },
    inputSchema: z.object({
      content: z
        .string()
        .min(1)
        .max(200_000)
        .optional()
        .describe(
          "OPTIONAL. If you already wrote the full new content for this artifact, provide it here directly. The document will be updated with this content immediately instead of regenerating it."
        ),
      description: z
        .string()
        .default("Improve the content")
        .describe("The description of changes that need to be made"),
      id: z.string().describe("The ID of the artifact to rewrite"),
    }),
  });
