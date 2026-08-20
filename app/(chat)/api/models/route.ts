import { fetchUserModels } from "@/lib/ai/models.server";

export async function GET() {
  const models = await fetchUserModels();
  return Response.json({ models }, {
    headers: {
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
    },
  });
}
