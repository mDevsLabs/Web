import { tool, type UIMessageStreamWriter } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
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

// Synthèse d'un segment via l'API mAI TTS
async function synthesizeSegment(params: {
  token: string;
  userId: string;
  voice: string;
  text: string;
  speed?: number;
}): Promise<{ audio_url?: string; error?: string }> {
  const { voice, text, speed } = params;
  try {
    const openRouterApiKey = process.env.OPENROUTER_API_KEY || "";
    const res = await fetch("https://openrouter.ai/api/v1/audio/speech", {
      body: JSON.stringify({
        input: text,
        model: "deepgram/flux-tts:free",
        response_format: "mp3",
        speed: speed ?? 1.0,
        voice,
      }),
      headers: {
        Authorization: `Bearer ${openRouterApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://mai.mdevs.fr",
        "X-Title": "mAI Speech",
      },
      method: "POST",
    });
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          error:
            data?.error?.message || data?.error || "Erreur de synthèse vocale.",
        };
      }
      const audio_url =
        data?.audio_url ||
        (data?.audioContent
          ? `data:audio/mp3;base64,${data.audioContent}`
          : "");
      return audio_url
        ? { audio_url }
        : { error: "Aucun flux audio retourné." };
    }
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      return {
        audio_url: `data:audio/mpeg;base64,${buf.toString("base64")}`,
      };
    }
    return {
      error: (await res.text().catch(() => "")) || "Erreur de synthèse vocale.",
    };
  } catch (e: any) {
    return { error: e.message || "Erreur de synthèse vocale." };
  }
}

// Choisit deux voix distinctes disponibles ; repli sur les voix par défaut.
async function pickVoices(
  _token: string
): Promise<{ expert: string; host: string }> {
  return { expert: "flux-jeanne-fr", host: "flux-alexis-en" };
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

      const voices = await pickVoices(token);
      const hostVoice = voices.host;
      const expertVoice = voices.expert;

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
        const result = await synthesizeSegment({
          speed,
          text: segment.text,
          token,
          userId,
          voice,
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
