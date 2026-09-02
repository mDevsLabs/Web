import { tool, type UIMessageStreamWriter } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import {
  artifactKinds,
  documentHandlersByArtifactKind,
} from "@/lib/artifacts/server";
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
      "Full rewrite of an existing artifact. Only use for major changes where most content needs replacing. If you already wrote the full new content in your response, provide it directly in 'content' to save it immediately. Prefer editDocument for targeted changes. Options: title to rename, kind to change type (text/code/sheet/html), dryRun to preview without saving, instructions as alias for description.",
    execute: async ({
      id,
      description,
      instructions,
      content,
      title,
      kind,
      dryRun,
    }) => {
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

      const effectiveDescription = (
        instructions?.trim() ||
        description ||
        "Improve the content"
      ).slice(0, 5000);
      const effectiveTitle = title
        ? title.trim().slice(0, 200)
        : document.title;
      const effectiveKind =
        kind && (artifactKinds as readonly string[]).includes(kind)
          ? kind
          : document.kind;

      // Dry-run with direct content: return preview without saving/streaming
      if (dryRun && content && content.trim().length > 0) {
        const preview = content.slice(0, 5000);
        return {
          contentLength: content.length,
          id: document.id,
          kind: effectiveKind,
          message:
            "Dry-run preview: document would be updated with provided content (not saved).",
          preview,
          title: effectiveTitle,
          wouldSave: true,
        };
      }

      if (dryRun && (!content || content.trim().length === 0)) {
        return {
          error:
            "dryRun requires 'content' to preview. Provide full new content or set dryRun to false to generate via AI.",
        };
      }

      dataStream.write({
        data: null,
        transient: true,
        type: "data-clear",
      });

      // Bypass direct: if content is provided, save and stream immediately (with title/kind overrides)
      if (content && content.trim().length > 0) {
        const userId = sessionUserId || document.userId;
        if (userId) {
          await saveDocument({
            content,
            id: document.id,
            kind: effectiveKind as typeof document.kind,
            title: effectiveTitle,
            userId: String(userId),
          });
        }

        const deltaType =
          effectiveKind === "code"
            ? "data-codeDelta"
            : effectiveKind === "sheet"
              ? "data-sheetDelta"
              : effectiveKind === "html"
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
            effectiveKind === "code"
              ? "The script has been updated with direct content successfully."
              : "The document has been updated with direct content successfully.",
          id: document.id,
          kind: effectiveKind,
          title: effectiveTitle,
        };
      }

      // AI-generated update: delegate to handler, then apply title/kind overrides if needed
      const targetKind = document.kind;
      const documentHandler = documentHandlersByArtifactKind.find(
        (documentHandlerByArtifactKind) =>
          documentHandlerByArtifactKind.kind === targetKind
      );

      if (!documentHandler) {
        throw new Error(`No document handler found for kind: ${targetKind}`);
      }

      await documentHandler.onUpdateDocument({
        dataStream,
        description: effectiveDescription,
        document,
        modelId,
        session,
      });

      // Apply title/kind rename after AI generation if requested (handler saves with old title/kind)
      if (
        (title && title.trim() !== document.title) ||
        (kind && kind !== document.kind)
      ) {
        try {
          const latest = await getDocumentById({ id: document.id });
          const latestContent = latest?.content ?? "";
          const userId = (session.user?.id as string) || document.userId;
          if (latestContent && userId) {
            await saveDocument({
              content: latestContent,
              id: document.id,
              kind: effectiveKind as typeof document.kind,
              title: effectiveTitle,
              userId: String(userId),
            });
          }
        } catch {
          // best-effort rename
        }
      }

      dataStream.write({ data: null, transient: true, type: "data-finish" });

      return {
        content:
          effectiveKind === "code"
            ? "The script has been updated successfully."
            : "The document has been updated successfully.",
        id: document.id,
        kind: effectiveKind,
        title: effectiveTitle,
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
        .describe(
          "The description of changes that need to be made (legacy, prefer instructions)"
        ),
      dryRun: z
        .boolean()
        .optional()
        .describe(
          "If true, preview the update without saving. Requires 'content'. Returns preview instead of streaming."
        ),
      id: z.string().describe("The ID of the artifact to rewrite"),
      instructions: z
        .string()
        .min(1)
        .max(5000)
        .optional()
        .describe(
          "Alias for description: detailed instructions for the AI rewrite (1-5000 chars). Overrides description if both provided."
        ),
      kind: z
        .enum(artifactKinds)
        .optional()
        .describe(
          "Change artifact kind (text/code/sheet/html). Defaults to current kind."
        ),
      title: z
        .string()
        .min(1)
        .max(200)
        .optional()
        .describe(
          "New title to rename the document (1-200 chars). Defaults to current title."
        ),
    }),
  });
