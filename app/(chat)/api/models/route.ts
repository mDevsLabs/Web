import { fetchUserModels } from "@/lib/ai/models.server";
import { buildModelRegistry } from "@/lib/ai/registry";

// Source unique côté client : modèles du catalogue, capacités étendues (superset
// rétro-compatible de l'ancien payload) et entrées du registre utilisées par
// Agent (niveaux de réflexion, accès par forfait, limites de fichiers).
export async function GET() {
  const models = await fetchUserModels();
  const registry = buildModelRegistry(models);

  return Response.json(
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
