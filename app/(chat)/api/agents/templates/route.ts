import { getAgentTemplates } from "@/lib/db/queries";

export async function GET() {
  try {
    const templates = await getAgentTemplates();
    return Response.json(templates);
  } catch {
    return Response.json(
      { error: "Erreur chargement templates" },
      { status: 500 }
    );
  }
}
