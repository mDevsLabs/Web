import { getModelCapabilities } from "@/lib/ai/models";
import { fetchUserModels } from "@/lib/ai/models.server";

export async function GET() {
  const models = await fetchUserModels();
  const capabilities: Record<string, ReturnType<typeof getModelCapabilities>> = {};

  for (const model of models) {
    capabilities[model.id] = getModelCapabilities(model.id);
  }

  return Response.json(
    { capabilities, models },
    {
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    }
  );
}

