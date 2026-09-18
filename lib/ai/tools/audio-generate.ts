import { tool, type UIMessageStreamWriter } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { generateAudioViaMai } from "@/lib/ai/generators/audio";
import type { ChatMessage } from "@/lib/types";

type AudioGenerateProps = {
  dataStream: UIMessageStreamWriter<ChatMessage>;
  session: Session;
};

export const audioGenerate = ({ dataStream, session }: AudioGenerateProps) =>
  tool({
    description:
      "Generate speech or audio via mAI Audio Studio immediately with default voice 'flux-alexis-en' without asking the user for voice selection. Use whenever the user asks to speak, synthesize, vocalize audio, voice, speech, tts or create sound. Returns audio_url to be played directly.",
    execute: async ({ text, voice, speed }) => {
      const userId = session.user?.id || session.user?.email || "";
      const token =
        (session as any)?.token || (session as any)?.user?.token || null;

      // Le cœur partagé (lib/ai/generators/audio.ts) porte la logique métier :
      // quota hebdomadaire Speech, préférences, appel API mAI. L'outil ne
      // branche ici que la prévisualisation temps réel propre au Chat.
      return generateAudioViaMai({
        onAudio: (audioUrl) => {
          dataStream.write({
            data: audioUrl,
            transient: true,
            type: "data-audioDelta",
          });
        },
        request: { speed, text, voice },
        resolveToken: () => token,
        userId,
      });
    },
    inputSchema: z.object({
      speed: z
        .number()
        .optional()
        .default(1.0)
        .describe("Vitesse d'élocution (0.5 à 2.0, par défaut 1.0)"),
      text: z
        .string()
        .describe("Le texte ou script complet à synthétiser en voix/audio"),
      voice: z
        .string()
        .optional()
        .default("flux-alexis-en")
        .describe(
          "Nom de la voix (par défaut 'flux-alexis-en'). Ne JAMAIS demander à l'utilisateur de choisir la voix : utiliser directement la voix par défaut sauf s'il a explicitement précisé un nom de voix."
        ),
    }),
  });
