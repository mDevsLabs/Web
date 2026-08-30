import { type NextRequest, NextResponse } from "next/server";
import { getMaiSessionToken, getMaiUser } from "@/lib/auth/session";
import { MAI_API_URL } from "@/lib/constants";
import { getUserApiKey } from "@/lib/db/api-keys";
import { normalizeModelDisplayName } from "@/lib/ai/models";

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
    return undefined;
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

    const headers: Record<string, string> = {};
    if (authHeader) {
      headers.Authorization = authHeader;
    }

    const res = await fetch(`${MAI_API_URL}/v1/models/speech`, {
      cache: "no-store",
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    // Noms normalisés (préfixe fournisseur retiré, suffixe (Free)) et voix
    // filtrées : seules les voix propres au modèle sont exposées.
    const models = (data.data || []).map((m: any) => ({
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
        data: [
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
        ],
        models: [
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
        ],
        object: "list",
      },
      { status: 200 }
    );
  }
}
