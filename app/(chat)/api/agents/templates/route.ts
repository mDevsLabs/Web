import { errorResponse, logError } from "@/lib/api/error-response";
import { getAgentTemplates } from "@/lib/db/queries";

export async function GET() {
  try {
    const templates = await getAgentTemplates();
    return Response.json(templates);
  } catch (error) {
    logError("Erreur chargement templates agents", error);
    return errorResponse("internal_error", {
      message: "Erreur lors du chargement des templates.",
    });
  }
}
