import { type NextRequest, NextResponse } from "next/server";
import { maiModelsList } from "@/lib/site/mai-models";

export async function GET(_req: NextRequest) {
  try {
    const formattedModels = maiModelsList.map((m) => ({
      api_alias: m.apiAlias ?? null,
      capabilities: m.capabilities,
      context_length: m.contextWindow,
      created:
        Math.floor(new Date(m.releaseDate).getTime() / 1000) ||
        Math.floor(Date.now() / 1000),
      description: m.description,
      execution_mode: m.cloud ? "cloud_api" : "local_ollama_gguf",
      huggingface_tag: m.huggingFaceTag ?? null,
      id: m.id,
      license: m.license,
      max_output_tokens: m.maxOutputTokens,
      name: m.name,
      object: "model",
      ollama_tag: m.ollamaTag ?? null,
      owned_by: "mDevsLabs",
      parameters: m.parameters ?? null,
      recommended_hardware: m.recommendedHardware ?? null,
      status: m.status,
      tagline: m.tagline,
      // Les modèles de la génération mAI-2 sont servis dans le cloud via l'alias API.
      usable_in_cloud_chat: Boolean(m.cloud),
      version: m.version,
    }));

    return NextResponse.json({
      count: formattedModels.length,
      data: formattedModels,
      note: "Les modèles locaux s'exécutent via Ollama / HuggingFace. Les modèles cloud (génération mAI-2) sont appelables via /v1/chat/completions avec leur alias API (ex: « mai-2 »).",
      object: "list",
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: {
          code: "internal_error",
          message:
            err.message || "Erreur lors de la récupération des modèles mAI.",
          type: "api_error",
        },
      },
      { status: 500 }
    );
  }
}
