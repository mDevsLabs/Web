import { z } from "zod";
import { requireAgentToolMetadata } from "@/lib/agent/tools/catalog";
import { defineTool } from "@/lib/agent/tools/define-tool";
import { type ToolResult, toolFailure, toolSuccess } from "@/lib/agent/types";
import { generateImageViaMai } from "@/lib/ai/generators/image";

// Génération d'image côté Agent : la logique métier vit dans le cœur partagé
// (lib/ai/generators/image.ts), identique à celle du Chat — quotas,
// préférences et appel API mAI ne sont jamais dupliqués. Le token mAI vient
// du contexte de run (sessionToken), l'identifiant utilisateur de userEmail.

const generateImageInputSchema = z.object({
  height: z
    .number()
    .int()
    .min(256)
    .max(2048)
    .optional()
    .describe("Hauteur de l'image en pixels (défaut : préférences ou 1024)."),
  negative_prompt: z
    .string()
    .max(1000)
    .optional()
    .describe("Éléments à exclure de l'image."),
  prompt: z
    .string()
    .min(3)
    .max(2000)
    .describe("Description détaillée de l'image à générer."),
  width: z
    .number()
    .int()
    .min(256)
    .max(2048)
    .optional()
    .describe("Largeur de l'image en pixels (défaut : préférences ou 1024)."),
});

export type GenerateImageInput = z.infer<typeof generateImageInputSchema>;

export function imageResultToToolResult(
  output: Awaited<ReturnType<typeof generateImageViaMai>>
): ToolResult {
  if (output.error) {
    return toolFailure("image_generation_failed", output.error);
  }
  if (!output.image_url) {
    return toolFailure(
      "image_generation_failed",
      "Aucune image n'a été retournée par le service."
    );
  }
  return toolSuccess({
    height: output.height,
    image_url: output.image_url,
    prompt: output.prompt,
    width: output.width,
  });
}

export const generateImageTool = defineTool({
  ...requireAgentToolMetadata("generate_image"),
  execute: async (input, context) => {
    const output = await generateImageViaMai({
      request: {
        height: input.height,
        negativePrompt: input.negative_prompt,
        prompt: input.prompt,
        width: input.width,
      },
      // Le token mAI de session utilisateur : identique à celui du Chat,
      // résolu depuis la session de run plutôt que du SDK.
      resolveToken: async () => context.sessionToken,
      userId: context.userEmail,
    });
    return imageResultToToolResult(output);
  },
  schema: generateImageInputSchema,
  summarize: (data) => {
    const value = (data ?? {}) as { image_url?: string };
    return value.image_url ? "Image générée" : "Génération d'image";
  },
});
