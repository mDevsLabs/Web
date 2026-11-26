import { NextRequest, NextResponse } from "next/server";
import { authenticateCatalogRequest } from "@/lib/api-key-session";
import { redactApiSecretJson } from "@/lib/api-key-redaction";

export const runtime = "nodejs";

const FALLBACK_AUDIO_MODELS = [
  {
    architecture: {
      input_modalities: ["text"],
      modality: "text->speech",
      output_modalities: ["speech"],
    },
    created: Math.floor(Date.now() / 1000) - 86_400 * 30,
    description: "Modèle de synthèse vocale (TTS) ultra-rapide et haute fidélité par Deepgram avec rendu naturel des voix.",
    id: "deepgram/flux-tts:free",
    name: "Deepgram: Flux TTS",
    object: "model",
    owned_by: "deepgram",
    supported_parameters: ["voice", "speed", "response_format"],
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

function cleanModelName(name: string): string {
  return (name || "")
    .replace(/\s*\((free|gratuit|free tier)\)/gi, "")
    .replace(/:free/gi, "")
    .trim();
}

function catalogResponse(body: unknown, isPublic: boolean, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set(
    "Cache-Control",
    isPublic
      ? "public, s-maxage=300, stale-while-revalidate=60"
      : "private, no-store",
  );
  return NextResponse.json(body, { ...init, headers });
}

export async function GET(req: NextRequest) {
  const authResult = await authenticateCatalogRequest(req);
  if (!authResult.ok) return authResult.response;

  const auth = authResult.auth;
  const isPublic = auth.mode === "public";

  try {
    const orRes = await fetch("https://openrouter.ai/api/v1/models?output_modalities=speech", {
      next: { revalidate: 300 },
    });
    if (orRes.ok) {
      const orJson = await orRes.json();
      const rawList = Array.isArray(orJson.data) ? orJson.data : [];
      const speechModels = rawList
        .filter((model: any) => {
          if (!model || !model.id) return false;
          if (isPublic) {
            return model.id.toLowerCase().includes(":free");
          }
          return true;
        })
        .map((model: any) => ({
          architecture: model.architecture || {
            input_modalities: ["text"],
            modality: "text->speech",
            output_modalities: ["speech"],
          },
          created: model.created || Math.floor(Date.now() / 1000),
          description: model.description || `Modèle de synthèse vocale (TTS) ${cleanModelName(model.name || model.id)}.`,
          id: model.id,
          name: cleanModelName(model.name || model.id),
          object: "model",
          owned_by: (model.id || "").split("/")[0] || "openrouter",
          supported_parameters: model.supported_parameters || ["voice", "speed", "response_format"],
          voices: model.voices || [
            "flux-alexis-en",
            "flux-michael-en",
            "flux-stacy-en",
            "flux-sam-en",
            "flux-asteria-en",
            "flux-orion-en",
          ],
        }));

      if (speechModels.length > 0) {
        return catalogResponse({ data: speechModels, object: "list" }, isPublic);
      }
    }

    return catalogResponse({ data: FALLBACK_AUDIO_MODELS, object: "list" }, isPublic);
  } catch {
    return catalogResponse({ data: FALLBACK_AUDIO_MODELS, object: "list" }, isPublic);
  }
}
