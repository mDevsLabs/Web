import { Output, streamText, tool, type UIMessageStreamWriter } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { getDocumentById, saveSuggestions } from "@/lib/db/queries";
import type { Suggestion } from "@/lib/db/schema";
import type { ChatMessage } from "@/lib/types";
import { generateUUID } from "@/lib/utils";
import { getLanguageModel } from "../providers";

type RequestSuggestionsProps = {
  session: Session;
  dataStream: UIMessageStreamWriter<ChatMessage>;
  modelId: string;
};

export const requestSuggestions = ({
  session,
  dataStream,
  modelId,
}: RequestSuggestionsProps) =>
  tool({
    description:
      "Request writing suggestions for an existing document artifact. Only use this when the user explicitly asks to improve or get suggestions for a document they have already created. Never use for general questions. Provide 'category' if the user wants suggestions of a specific type (topic, style, clarity, action).",
    execute: async ({ documentId, category }) => {
      const document = await getDocumentById({ id: documentId });

      if (!document?.content) {
        return {
          error: "Document not found",
        };
      }

      const sessionUserId = session.user?.id || (session.user as any)?.email;
      if (
        document.userId !== sessionUserId &&
        document.userId !== session.user?.id
      ) {
        return { error: "Forbidden" };
      }

      const { getMaiSessionToken, getMaiUser } = await import(
        "@/lib/auth/session"
      );
      const [token, user] = await Promise.all([
        getMaiSessionToken(),
        getMaiUser(),
      ]);

      if (user && user.limit > 0 && user.tokensUsed >= user.limit) {
        return {
          error:
            "Votre limite hebdomadaire de tokens est atteinte. Impossible de générer des suggestions.",
        };
      }

      const suggestions: Omit<
        Suggestion,
        "userId" | "createdAt" | "documentCreatedAt"
      >[] = [];

      const { partialOutputStream } = streamText({
        instructions:
          (category ? `Focus suggestions on: ${category}. ` : "") +
          "You are a writing assistant. Given a piece of writing, offer up to 5 suggestions to improve it. Each suggestion must contain full sentences, not just individual words. Describe what changed and why.",
        model: getLanguageModel(modelId, {
          sessionToken: token,
          userId: user?.id || session.user?.id,
        }),
        output: Output.array({
          element: z.object({
            description: z
              .string()
              .describe("The description of the suggestion"),
            originalSentence: z.string().describe("The original sentence"),
            suggestedSentence: z.string().describe("The suggested sentence"),
          }),
        }),
        prompt: document.content,
      });

      let processedCount = 0;
      for await (const partialOutput of partialOutputStream) {
        if (!partialOutput) {
          continue;
        }

        for (let i = processedCount; i < partialOutput.length; i += 1) {
          const element = partialOutput[i];
          if (
            !element?.originalSentence ||
            !element?.suggestedSentence ||
            !element?.description
          ) {
            continue;
          }

          const suggestion = {
            description: element.description,
            documentId,
            id: generateUUID(),
            isResolved: false,
            originalText: element.originalSentence,
            suggestedText: element.suggestedSentence,
          };

          dataStream.write({
            data: suggestion as Suggestion,
            transient: true,
            type: "data-suggestion",
          });

          suggestions.push(suggestion);
          processedCount += 1;
        }
      }

      if (session.user?.id) {
        const userId = session.user.id;

        await saveSuggestions({
          suggestions: suggestions.map((suggestion) => ({
            ...suggestion,
            createdAt: new Date(),
            documentCreatedAt: document.createdAt,
            userId,
          })),
        });
      }

      return {
        id: documentId,
        kind: document.kind,
        message: "Suggestions have been added to the document",
        title: document.title,
      };
    },
    inputSchema: z.object({
      category: z
        .enum(["topic", "style", "clarity", "action"])
        .optional()
        .describe("Type of suggestions requested (optional)."),
      documentId: z
        .string()
        .describe(
          "The UUID of an existing document artifact that was previously created with createDocument"
        ),
    }),
  });
