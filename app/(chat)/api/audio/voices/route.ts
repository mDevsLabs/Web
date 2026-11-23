import { type NextRequest, NextResponse } from "next/server";
import { listSpeechVoicesFromDb } from "@/lib/ai/catalog/media-models";
import { logError } from "@/lib/api/error-response";
import { getMaiUser } from "@/lib/auth/session";
import { ModelAccessError } from "@/openrouter-models";

export async function GET(_req: NextRequest) {
  try {
    const user = await getMaiUser();
    const data = await listSpeechVoicesFromDb(user?.tier);

    return NextResponse.json(
      {
        data,
        object: "list",
      },
      {
        headers: {
          "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    logError("Erreur API audio/voices", error);
    const status = error instanceof ModelAccessError ? error.status : 503;
    return NextResponse.json(
      {
        data: [],
        error: {
          code: "catalog_unavailable",
          message: "Le catalogue des voix est indisponible.",
        },
        object: "list",
      },
      { status }
    );
  }
}
