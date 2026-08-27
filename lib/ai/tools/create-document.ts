import { tool, type UIMessageStreamWriter } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import {
  artifactKinds,
  documentHandlersByArtifactKind,
} from "@/lib/artifacts/server";
import type { ChatMessage } from "@/lib/types";
import { generateUUID } from "@/lib/utils";
import { saveDocument } from "@/lib/db/queries";

type CreateDocumentProps = {
  session: Session;
  dataStream: UIMessageStreamWriter<ChatMessage>;
  modelId: string;
};

export const createDocument = ({
  session,
  dataStream,
  modelId,
}: CreateDocumentProps) =>
  tool({
    description:
      "Create an artifact. You MUST specify kind: use 'code' for any programming/algorithm request (creates a script), 'text' for essays/writing (creates a document), 'sheet' for spreadsheets/data, 'html' for interactive web pages/components with live preview. If you have already written the content in your response, provide it directly in 'content' so it is saved inside the document immediately.",
    execute: async ({ title, kind, content }) => {
      const id = generateUUID();

      dataStream.write({
        data: kind,
        transient: true,
        type: "data-kind",
      });

      dataStream.write({
        data: id,
        transient: true,
        type: "data-id",
      });

      dataStream.write({
        data: title,
        transient: true,
        type: "data-title",
      });

      dataStream.write({
        data: null,
        transient: true,
        type: "data-clear",
      });

      // Bypass direct: if content is provided, save and stream it immediately
      if (content && content.trim().length > 0) {
        const userId = session.user?.id || (session.user as any)?.email;
        if (userId) {
          await saveDocument({
            content,
            id,
            kind,
            title,
            userId: String(userId),
          });
        }

        const deltaType =
          kind === "code"
            ? "data-codeDelta"
            : kind === "sheet"
              ? "data-sheetDelta"
              : kind === "html"
                ? "data-htmlDelta"
                : "data-textDelta";

        // Stream content in chunks if very long to keep UI responsive
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
            kind === "code"
              ? "A script was created with direct content and is now visible to the user."
              : "A document was created with direct content and is now visible to the user.",
          id,
          kind,
          title,
        };
      }

      const documentHandler = documentHandlersByArtifactKind.find(
        (documentHandlerByArtifactKind) =>
          documentHandlerByArtifactKind.kind === kind
      );

      if (!documentHandler) {
        throw new Error(`No document handler found for kind: ${kind}`);
      }

      await documentHandler.onCreateDocument({
        dataStream,
        id,
        modelId,
        session,
        title,
      });

      dataStream.write({ data: null, transient: true, type: "data-finish" });

      return {
        content:
          kind === "code"
            ? "A script was created and is now visible to the user."
            : "A document was created and is now visible to the user.",
        id,
        kind,
        title,
      };
    },
    inputSchema: z.object({
      kind: z
        .enum(artifactKinds)
        .describe(
          "REQUIRED. 'code' for programming/algorithms, 'text' for essays/writing, 'sheet' for spreadsheets, 'html' for HTML pages"
        ),
      title: z
        .string()
        .min(1)
        .max(200)
        .describe(
          "The title of the artifact (1-200 characters). Be concise and descriptive."
        ),
      content: z
        .string()
        .min(1)
        .max(200_000)
        .optional()
        .describe(
          "OPTIONAL. If you already wrote the full text/code/content for this artifact in your response, provide it here directly. The document will be created with this content immediately instead of asking the model to regenerate it."
        ),
    }),
  });
