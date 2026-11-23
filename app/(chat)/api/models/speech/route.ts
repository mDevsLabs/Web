import { type NextRequest, NextResponse } from "next/server";
import { listSpeechModelsFromDb } from "@/lib/ai/catalog/media-models";
import { logError } from "@/lib/api/error-response";
import { getMaiUser } from "@/lib/auth/session";
import { ModelAccessError } from "@/openrouter-models";

export async function GET(_req: NextRequest) {
  try {
    const user = await getMaiUser();
    const models = await listSpeechModelsFromDb(user?.tier);

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
    logError("Erreur API models/speech", error);
    const status = error instanceof ModelAccessError ? error.status : 503;
    return NextResponse.json(
      {
        error: {
          code: "catalog_unavailable",
          message: "Le catalogue des modèles audio est indisponible.",
        },
      },
      { status }
    );
  }
}
