import { type NextRequest, NextResponse } from "next/server";
import { fetchUserModels } from "@/lib/ai/models.server";
import { buildModelRegistry } from "@/lib/ai/registry";
import { GET as getImagesModels } from "./images/route";
import { GET as getSpeechModels } from "./speech/route";

// Source unique côté client : modèles du catalogue, capacités étendues (superset
// rétro-compatible de l'ancien payload) et entrées du registre utilisées par
// Agent (niveaux de réflexion, accès par forfait, limites de fichiers).
// Supporte également le filtrage ?type=image et ?type=audio pour compatibilité.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type")?.toLowerCase()?.trim();

  if (type === "image" || type === "images") {
    return getImagesModels();
  }
  if (type === "audio" || type === "speech") {
    return getSpeechModels(req);
  }

  const models = await fetchUserModels();
  const registry = buildModelRegistry(models);

  return NextResponse.json(
    {
      capabilities: registry.capabilities,
      entries: registry.entries,
      models,
    },
    {
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    }
  );
}
