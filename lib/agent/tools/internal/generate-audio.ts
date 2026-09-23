import { z } from "zod";
import { requireAgentToolMetadata } from "@/lib/agent/tools/catalog";
import { defineTool } from "@/lib/agent/tools/define-tool";
import { type ToolResult, toolFailure, toolSuccess } from "@/lib/agent/types";
import { generateAudioViaMai } from "@/lib/ai/generators/audio";

// Synthèse vocale côté Agent : même cœur partagé que le Chat
// (lib/ai/generators/audio.ts) — quota hebdomadaire Speech, préférences de
// voix et appel API mAI sans duplication. Le token vient du contexte de run.

const generateAudioInputSchema = z.object({
  speed: z
    .number()
    .min(0.5)
    .max(2.0)
    .optional()
    .describe("Vitesse d'élocution (0.5 à 2.0, défaut : préférences ou 1.0)."),
  text: z
    .string()
    .min(1)
    .max(8000)
    .describe("Le texte complet à synthétiser en voix/audio."),
  voice: z
    .string()
    .max(100)
    .optional()
    .describe(
      "Nom de la voix. Ne JAMAIS demander à l'utilisateur de choisir : utiliser la voix par défaut sauf s'il a explicitement précisé un nom de voix."
    ),
});

export type GenerateAudioInput = z.infer<typeof generateAudioInputSchema>;

export function audioResultToToolResult(
  output: Awaited<ReturnType<typeof generateAudioViaMai>>
): ToolResult {
  if (output.error) {
    return toolFailure("audio_generation_failed", output.error);
  }
  if (!output.audio_url) {
    return toolFailure(
      "audio_generation_failed",
      "Aucun flux audio n'a été retourné par le service."
    );
  }
  return toolSuccess({
    audio_url: output.audio_url,
    character_count: output.character_count,
    model: output.model,
    text: output.text,
    tokens_used: output.tokens_used,
    voice: output.voice,
  });
}

export const generateAudioTool = defineTool({
  ...requireAgentToolMetadata("generate_audio"),
  execute: async (input, context) => {
    const output = await generateAudioViaMai({
      request: {
        speed: input.speed,
        text: input.text,
        voice: input.voice,
      },
      resolveToken: () => context.sessionToken,
      userId: context.userEmail,
    });
    return audioResultToToolResult(output);
  },
  schema: generateAudioInputSchema,
  summarize: (data) => {
    const value = (data ?? {}) as { audio_url?: string };
    return value.audio_url ? "Audio généré" : "Synthèse vocale";
  },
});
