import { type NextRequest, NextResponse } from "next/server";
import { getMaiSessionToken, getMaiUser } from "@/lib/auth/session";
import { MAI_API_URL } from "@/lib/constants";
import { getUserApiKey } from "@/lib/db/api-keys";

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

    // Nettoyer les noms de modèles sans mentions (Free)
    const models = (data.data || []).map((m: any) => ({
      ...m,
      name: (m.name || m.id)
        .replace(/\s*\((free|gratuit|free tier)\)/gi, "")
        .replace(/:free/gi, "")
        .trim(),
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
