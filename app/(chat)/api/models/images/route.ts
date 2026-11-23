import { NextResponse } from "next/server";
import { listCometImageModelsFromDb } from "@/lib/ai/catalog/media-models";
import { errorResponse, logError } from "@/lib/api/error-response";
import { getMaiSessionToken } from "@/lib/auth/session";
import { ModelAccessError } from "@/openrouter-models";

export async function GET() {
  const token = await getMaiSessionToken();
  if (!token) {
    return errorResponse("auth_required", { message: "Non authentifié." });
  }

  try {
    const models = await listCometImageModelsFromDb();
    return NextResponse.json(
      { data: models, models, object: "list" },
      {
        headers: {
          "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    logError("Erreur API models/images", error);
    const status = error instanceof ModelAccessError ? error.status : 503;
    return NextResponse.json(
      {
        error: {
          code: "catalog_unavailable",
          message: "Le catalogue des modèles d'images est indisponible.",
        },
      },
      { status }
    );
  }
}
