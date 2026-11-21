import { type NextRequest, NextResponse } from "next/server";
import { normalizeModelDisplayName } from "@/lib/ai/models";
import { getMaiUser } from "@/lib/auth/session";

// Voix Flux par défaut collées par l'API amont à tous les modèles sans voix
// déclarées : elles ne sont valides que pour la famille flux/deepgram.
const FLUX_FALLBACK_VOICES = [
  "flux-alexis-en",
  "flux-michael-en",
  "flux-stacy-en",
  "flux-sam-en",
  "flux-asteria-en",
  "flux-orion-en",
];

const DEFAULT_SPEECH_MODELS = [
  {
    description:
      "Modèle de synthèse vocale (TTS) ultra-rapide et haute fidélité par Deepgram.",
    id: "deepgram/flux-tts:free",
    isFree: true,
    name: "Deepgram: Flux TTS",
    voices: FLUX_FALLBACK_VOICES,
  },
  {
    description: "Modèle de synthèse vocale standard par OpenAI.",
    id: "openai/tts-1",
    isFree: false,
    name: "OpenAI: TTS-1",
    voices: ["alloy", "echo", "fable", "onyx", "nova", "shimmer"],
  },
  {
    description: "Modèle de synthèse vocale haute fidélité par OpenAI.",
    id: "openai/tts-1-hd",
    isFree: false,
    name: "OpenAI: TTS-1 HD",
    voices: ["alloy", "echo", "fable", "onyx", "nova", "shimmer"],
  },
];

export async function GET(_req: NextRequest) {
  try {
    const user = await getMaiUser();
    const isPaid = user?.tier && user.tier.toLowerCase() !== "free";

    const models = DEFAULT_SPEECH_MODELS.filter((m) => {
      if (!isPaid) return m.isFree;
      return true;
    }).map((m) => ({
      ...m,
      name: normalizeModelDisplayName(m.id, m.name),
    }));

    return NextResponse.json(
      {
        data: models,
        models,
        object: "list",
      },
      {
        headers: {
          "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    console.error("Erreur API models/speech:", error);
    return NextResponse.json(
      {
        data: DEFAULT_SPEECH_MODELS,
        models: DEFAULT_SPEECH_MODELS,
        object: "list",
      },
      { status: 200 }
    );
  }
}
