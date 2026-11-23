import { tool, type UIMessageStreamWriter } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { DEFAULT_PODCAST_VOICES } from "@/lib/ai/catalog/media-defaults";
import { listSpeechModelsFromDb } from "@/lib/ai/catalog/media-models";
import { generateAudioViaMai } from "@/lib/ai/generators/audio";
import { getMaiUser } from "@/lib/auth/session";
import type { ChatMessage } from "@/lib/types";

type AudioPodcastProps = {
  session: Session;
  dataStream: UIMessageStreamWriter<ChatMessage>;
};

const segmentSchema = z.object({
  speaker: z
    .enum(["host", "expert"])
    .describe(
      "'host' = l'animateur qui introduct et relance, 'expert' = la spécialiste qui développe."
    ),
  text: z
    .string()
    .min(1)
    .max(1200)
    .describe(
      "Réplique naturelle et orale (une à quatre phrases). Numérote mentalement le débat : accroche, développement, exemples concrets, conclusion et salutation."
    ),
});

// Choisit un modèle accessible ayant au moins 2 voix distinctes pour le débat.
async function pickModelAndVoices(token: string): Promise<{
  expert: string;
  host: string;
  model?: string;
}> {
  try {
    const user = await getMaiUser(token).catch(() => null);
    const models = await listSpeechModelsFromDb(user?.tier);
    const multiVoiceModel = models.find((m) => m.voices.length >= 2);
    if (multiVoiceModel) {
      const host = multiVoiceModel.voices[1] ?? multiVoiceModel.voices[0];
      const expert = multiVoiceModel.voices[0];
      return {
        expert,
        host,
        model: multiVoiceModel.id,
      };
    }
  } catch {
    // Repli vers le couple par défaut du modèle gratuit.
  }
  return {
    expert: DEFAULT_PODCAST_VOICES.expert,
    host: DEFAULT_PODCAST_VOICES.host,
  };
}

export const audioPodcast = ({ session, dataStream }: AudioPodcastProps) =>
  tool({
    description:
      "Génère un podcast audio sous forme de débat dynamique entre deux intervenants virtuels (un animateur et une experte) à partir d'un document, d'un projet ou d'un sujet. Écrire le dialogue segment par segment : accroche percutante, échange vivant avec réactions et exemples concrets, conclusion. Les segments sont synthétisés avec deux voix différentes et joués dans un lecteur dédié. Durée indicative : environ 45 s de dialogue par 4 segments.",
    execute: async ({ segments, speed, title }, { abortSignal }) => {
      const token =
        (session as any)?.token || (session as any)?.user?.token || null;
      const userId = session.user?.id || session.user?.email || "";

      if (!token) {
        return {
          error:
            "Génération podcast indisponible sans session valide. Connecte-toi puis réessaie.",
        };
      }

      const selection = await pickModelAndVoices(token);
      const hostVoice = selection.host;
      const expertVoice = selection.expert;

      const id = (globalThis.crypto?.randomUUID?.() ??
        `podcast-${Date.now()}`) as string;

      const rendered: Array<{
        audio_url?: string;
        error?: string;
        speaker: "host" | "expert";
        text: string;
        voice: string;
      }> = [];

      for (const [_index, segment] of segments.entries()) {
        if (abortSignal?.aborted) {
          break;
        }
        const voice = segment.speaker === "expert" ? expertVoice : hostVoice;
        const result = await generateAudioViaMai({
          request: {
            model: selection.model,
            recordHistory: false,
            speed,
            text: segment.text,
            voice,
          },
          resolveToken: () => token,
          userId,
        });
        rendered.push({
          audio_url: result.audio_url,
          error: result.error,
          speaker: segment.speaker,
          text: segment.text,
          voice,
        });
        // Progression en direct côté client
        try {
          dataStream.write({
            data: { completed: rendered.length, id, total: segments.length },
            transient: true,
            type: "data-podcastProgress" as any,
          });
        } catch (streamErr) {
          // Repli volontaire : flux déjà fermé côté client.
          console.warn("Progression podcast non transmise:", streamErr);
        }
      }

      const success = rendered.filter((s) => s.audio_url);
      if (success.length === 0) {
        return {
          error:
            rendered[0]?.error ||
            "Aucun segment n'a pu être synthétisé. Réessaie plus tard.",
        };
      }

      return {
        completedSegments: success.length,
        expertVoice,
        hostVoice,
        id,
        segments: rendered,
        title,
        totalSegments: segments.length,
      };
    },
    inputSchema: z.object({
      segments: z
        .array(segmentSchema)
        .min(2)
        .max(40)
        .describe(
          "Le dialogue complet du podcast, du premier segment d'accroche au dernier segment de conclusion. Alterne host/expert de manière vivante."
        ),
      speed: z
        .number()
        .min(0.5)
        .max(2)
        .optional()
        .default(1.0)
        .describe("Vitesse d'élocution (défaut 1.0)."),
      title: z
        .string()
        .min(1)
        .max(120)
        .describe("Titre du podcast en français."),
    }),
  });
