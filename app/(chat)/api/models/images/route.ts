import { NextResponse } from "next/server";
import { normalizeModelDisplayName } from "@/lib/ai/models";
import { errorResponse } from "@/lib/api/error-response";
import { getMaiSessionToken } from "@/lib/auth/session";

const DEFAULT_IMAGE_MODELS = [
  {
    capabilities: {
      async_task: true,
      image_to_image: false,
      inpainting: false,
      text_to_image: true,
    },
    created: 1_722_470_400,
    description:
      "Modèle ultra-rapide en 4 étapes par Black Forest Labs (Text-to-Image).",
    endpoints: ["/v1/images/generations"],
    features: ["text-to-image"],
    form: "openai-standard",
    id: "black-forest-labs/flux-1-schnell",
    isFree: true,
    name: "FLUX.1 Schnell",
    object: "model",
    owned_by: "black-forest-labs",
  },
  {
    capabilities: {
      async_task: true,
      image_to_image: true,
      inpainting: true,
      text_to_image: true,
    },
    created: 1_722_470_400,
    description:
      "Modèle phare de synthèse photoréaliste et artistique par Black Forest Labs.",
    endpoints: ["/v1/images/generations", "/v1/images/edits"],
    features: ["text-to-image", "image-to-image"],
    form: "openai-standard",
    id: "black-forest-labs/flux-1-dev",
    isFree: false,
    name: "FLUX.1 Dev",
    object: "model",
    owned_by: "black-forest-labs",
  },
  {
    capabilities: {
      async_task: true,
      image_to_image: false,
      inpainting: false,
      text_to_image: true,
    },
    created: 1_727_827_200,
    description:
      "Modèle de génération d'images haute qualité et design graphique.",
    endpoints: ["/v1/images/generations"],
    features: ["text-to-image"],
    form: "openai-standard",
    id: "recraft-v3",
    isFree: false,
    name: "Recraft V3",
    object: "model",
    owned_by: "recraft",
  },
  {
    capabilities: {
      async_task: true,
      image_to_image: false,
      inpainting: false,
      text_to_image: true,
    },
    created: 1_722_470_400,
    description:
      "Modèle DALL-E 3 par OpenAI pour des détails complexes et typographie.",
    endpoints: ["/v1/images/generations"],
    features: ["text-to-image"],
    form: "openai-standard",
    id: "dall-e-3",
    isFree: false,
    name: "DALL-E 3",
    object: "model",
    owned_by: "openai",
  },
];

export async function GET() {
  const token = await getMaiSessionToken();
  if (!token) {
    return errorResponse("auth_required", { message: "Non authentifié." });
  }

  const models = DEFAULT_IMAGE_MODELS.map((m) => ({
    ...m,
    name: normalizeModelDisplayName(m.id, m.name),
  }));

  return NextResponse.json(
    { data: models, models, object: "list" },
    {
      headers: {
        "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
      },
    }
  );
}
