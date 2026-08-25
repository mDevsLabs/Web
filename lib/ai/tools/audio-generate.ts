import { tool, type UIMessageStreamWriter } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { MAI_API_URL } from "@/lib/constants";
import type { ChatMessage } from "@/lib/types";

type AudioGenerateProps = {
  session: Session;
  dataStream: UIMessageStreamWriter<ChatMessage>;
};

export const audioGenerate = ({ session, dataStream }: AudioGenerateProps) =>
  tool({
    description:
      "Generate speech or audio via mAI Audio Studio. Use when the user asks to generate, speak, synthesize audio, voice, speech, tts or create sound. Returns audio_url to be played directly.",
    execute: async ({ text, voice, speed }) => {
      const userId = session.user?.id || session.user?.email || "";
      try {
        const token =
          (session as any)?.token || (session as any)?.user?.token || null;

        if (!token) {
          return {
            error:
              "Génération audio non disponible sans session valide. Redirige vers /audio.",
          };
        }

        const payload = {
          format: "json",
          input: text,
          model: "deepgram/flux-tts:free",
          response_format: "mp3",
          return_json: true,
          speed: speed || 1.0,
          voice: voice || "flux-alexis-en",
        };

        const res = await fetch(`${MAI_API_URL}/v1/audio/speech`, {
          body: JSON.stringify(payload),
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "x-user-id": userId,
          },
          method: "POST",
        });

        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            return {
              error:
                data?.error?.message || data?.error || "Erreur de génération audio.",
            };
          }

          const audio_url =
            data?.audio_url ||
            (data?.audioContent
              ? `data:audio/mp3;base64,${data.audioContent}`
              : "");

          if (!audio_url) {
            return { error: "Aucun flux audio retourné." };
          }

          dataStream.write({
            data: audio_url,
            transient: true,
            type: "data-audioDelta",
          });

          return {
            audio_url,
            character_count: data?.character_count || text.length,
            id: data?.id,
            model: data?.model || "Flux TTS",
            text,
            tokens_used: data?.tokens_used || Math.ceil(text.length / 3.5),
            voice: voice || "flux-alexis-en",
          };
        }

        if (res.ok) {
          const arrayBuf = await res.arrayBuffer();
          const buffer = Buffer.from(arrayBuf);
          const base64 = buffer.toString("base64");
          const audio_url = `data:audio/mpeg;base64,${base64}`;

          dataStream.write({
            data: audio_url,
            transient: true,
            type: "data-audioDelta",
          });

          return {
            audio_url,
            character_count: text.length,
            model: "Flux TTS",
            text,
            tokens_used: Math.ceil(text.length / 3.5),
            voice: voice || "flux-alexis-en",
          };
        }

        const errText = await res.text().catch(() => "");
        return { error: errText || "Erreur lors de la génération audio." };
      } catch (e: any) {
        return { error: e.message || "Erreur de génération audio." };
      }
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
          "Nom de la voix : flux-alexis-en (Alexis femme), flux-michael-en (Michael homme), flux-stacy-en (Stacy femme), flux-sam-en (Sam homme), flux-asteria-en (Asteria femme), flux-orion-en (Orion homme)"
        ),
    }),
  });
