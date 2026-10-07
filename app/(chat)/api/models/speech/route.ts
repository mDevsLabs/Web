import { type NextRequest, NextResponse } from "next/server";
import { normalizeModelDisplayName } from "@/lib/ai/models";
import { upstreamJson } from "@/lib/api/upstream";
import { getMaiSessionToken, getMaiUser } from "@/lib/auth/session";
import { getUserApiKey } from "@/lib/db/api-keys";

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

const FALLBACK_SPEECH_MODELS = [
  {
    description:
      "Modèle Text-to-Speech (TTS) ultra-rapide et haute fidélité par Deepgram.",
    id: "deepgram/flux-tts:free",
    name: "Deepgram: Flux TTS",
    voices: [
      "flux-alexis-en",
      "flux-michael-en",
      "flux-stacy-en",
      "flux-sam-en",
      "flux-asteria-en",
      "flux-orion-en",
    ],
  },
];

function resolveModelVoices(modelId: string, declaredVoices: unknown) {
  const id = (modelId || "").toLowerCase();
  const isFluxFamily = id.includes("flux") || id.includes("deepgram");
  const declared = Array.isArray(declaredVoices) ? declaredVoices : [];
  if (declared.length === 0) {
    return isFluxFamily ? FLUX_FALLBACK_VOICES : undefined;
  }
  if (
    !isFluxFamily &&
    declared.length === FLUX_FALLBACK_VOICES.length &&
    [...declared].sort().join(",") ===
      [...FLUX_FALLBACK_VOICES].sort().join(",")
  ) {
    return;
  }
  return declared;
}

export async function GET(_req: NextRequest) {
  try {
    const user = await getMaiUser();
    let authHeader = "";

    if (user?.id) {
      const apiKey = await getUserApiKey(user.id);
      if (apiKey) {
        authHeader = `Bearer ${apiKey}`;
      }
    }

    if (!authHeader) {
      const token = await getMaiSessionToken();
      if (token) {
        authHeader = `Bearer ${token}`;
      }
    }

    const token = authHeader ? authHeader.replace(/^Bearer\s+/i, "") : null;
    const result = await upstreamJson<{ data?: any[] }>({
      path: "/v1/models/speech",
      token,
    });

    if (!result.ok) {
      return NextResponse.json({
        data: FALLBACK_SPEECH_MODELS,
        models: FALLBACK_SPEECH_MODELS,
        object: "list",
      });
    }

    const rawList = result.data.data || [];
    // Noms normalisés (préfixe fournisseur retiré, suffixe (Free)) et voix
    // filtrées : seules les voix propres au modèle sont exposées.
    const models = rawList.map((m: any) => ({
      ...m,
      name: normalizeModelDisplayName(m.id, m.name || m.id),
      voices: resolveModelVoices(m.id, m.voices),
    }));

    return NextResponse.json({
      data: models,
      models,
      object: "list",
    });
  } catch (error) {
    console.error("Erreur API models/speech:", error);
    return NextResponse.json(
      {
        data: FALLBACK_SPEECH_MODELS,
        models: FALLBACK_SPEECH_MODELS,
        object: "list",
      },
      { status: 200 }
    );
  }
}
