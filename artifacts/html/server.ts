import { smoothStream, streamText } from "ai";
import { updateDocumentPrompt } from "@/lib/ai/prompts";
import { getLanguageModel } from "@/lib/ai/providers";
import { createDocumentHandler } from "@/lib/artifacts/server";

export const htmlDocumentHandler = createDocumentHandler<"html">({
  kind: "html",
  onCreateDocument: async ({ title, dataStream, modelId, session }) => {
    let draftContent = "";

    const { stream } = streamText({
      experimental_transform: smoothStream({ chunking: "word" }),
      instructions:
        "Generate a complete, self-contained HTML document. Use inline CSS and minimal JS. No external resources. Output only HTML.",
      model: getLanguageModel(modelId, {
        sessionToken: (session as any)?.token,
        userId: session?.user?.id,
      }),
      prompt: title,
    });

    for await (const delta of stream) {
      if (delta.type === "text-delta") {
        draftContent += delta.text;
        dataStream.write({
          data: draftContent,
          transient: true,
          type: "data-htmlDelta" as any,
        });
      }
    }

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream, modelId, session }) => {
    let draftContent = "";

    const { stream } = streamText({
      experimental_transform: smoothStream({ chunking: "word" }),
      instructions: updateDocumentPrompt(document.content, "html"),
      model: getLanguageModel(modelId, {
        sessionToken: (session as any)?.token,
        userId: session?.user?.id,
      }),
      prompt: description,
    });

    for await (const delta of stream) {
      if (delta.type === "text-delta") {
        draftContent += delta.text;
        dataStream.write({
          data: draftContent,
          transient: true,
          type: "data-htmlDelta" as any,
        });
      }
    }

    return draftContent;
  },
});
