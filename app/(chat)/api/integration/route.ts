import { errorResponse, logError } from "@/lib/api/error-response";
import { requireUser } from "@/lib/auth/require-user";
import { listIntegrationStatuses } from "@/lib/integrations/status";

/**
 * Liste sûre des connecteurs pour l'interface : jamais de jeton, seulement
 * l'état de connexion, le compte affiché et les portées accordées.
 */
export async function GET() {
  const auth = await requireUser();
  if (!auth) {
    return errorResponse("auth_required", {
      message: "Connectez-vous pour gérer vos connexions externes.",
    });
  }
  try {
    return Response.json({
      integrations: await listIntegrationStatuses({ userId: auth.userId }),
    });
  } catch (error) {
    logError("GET /api/integration", error);
    return errorResponse("database_error");
  }
}
