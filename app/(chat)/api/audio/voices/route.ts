import { type NextRequest, NextResponse } from "next/server";
import { getMaiSessionToken } from "@/lib/auth/session";
import { MAI_API_URL } from "@/lib/constants";

export async function GET(_req: NextRequest) {
  try {
    const token = await getMaiSessionToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${MAI_API_URL}/v1/audio/voices`, {
      cache: "no-store",
      headers,
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {}

  // Voix par défaut
  return NextResponse.json({
    data: [
      {
        description: "Voix féminine chaleureuse, naturelle et claire.",
        gender: "female",
        id: "flux-alexis-en",
        language: "fr/en",
        name: "Alexis",
      },
      {
        description: "Voix masculine posée, fluide et professionnelle.",
        gender: "male",
        id: "flux-michael-en",
        language: "fr/en",
        name: "Michael",
      },
      {
        description: "Voix féminine expressive, vive et dynamique.",
        gender: "female",
        id: "flux-stacy-en",
        language: "fr/en",
        name: "Stacy",
      },
      {
        description: "Voix masculine profonde, idéale pour narration & podcast.",
        gender: "male",
        id: "flux-sam-en",
        language: "fr/en",
        name: "Sam",
      },
      {
        description: "Voix féminine moderne, douce et mélodieuse.",
        gender: "female",
        id: "flux-asteria-en",
        language: "fr/en",
        name: "Asteria",
      },
      {
        description: "Voix masculine cinématique, intense et charismatique.",
        gender: "male",
        id: "flux-orion-en",
        language: "fr/en",
        name: "Orion",
      },
    ],
    object: "list",
  });
}
