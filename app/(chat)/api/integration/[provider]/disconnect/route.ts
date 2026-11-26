import { type NextRequest, NextResponse } from "next/server";
import { errorResponse, logError } from "@/lib/api/error-response";
import { requireUser } from "@/lib/auth/require-user";
import { getIntegrationProvider } from "@/lib/integrations/providers";
import {
  getPrimaryConnection,
  markConnectionRevoked,
} from "@/lib/integrations/repository";

/**
 * Déconnexion : la ligne survit, marquée `revokedAt`, sans jeton exploitable.
 *
 * Tous les connecteurs utilisent un jeton personnel collé par l'utilisateur :
 * la révocation finale côté fournisseur reste à sa main depuis son portail.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const auth = await requireUser();
  if (!auth) {
    return errorResponse("auth_required", {
      message: "Connectez-vous pour rompre une liaison externe.",
    });
  }

  const { provider } = await params;
  const descriptor = getIntegrationProvider(provider);
  if (!descriptor) {
    return errorResponse("not_found", {
      message: `Connecteur inconnu : « ${provider} ».`,
    });
  }

  try {
    const row = await getPrimaryConnection({
      provider: descriptor.id,
      userId: auth.userId,
    });
    if (!row) {
      return NextResponse.json({
        message: `${descriptor.label} n'est pas connecté sur ce compte.`,
        revoked: false,
        success: true,
      });
    }

    await markConnectionRevoked({ connectionId: row.id, userId: auth.userId });

    return NextResponse.json({
      message: `${descriptor.label} déconnecté d'ici. Révoquez aussi le jeton depuis votre compte ${descriptor.label} si nécessaire.`,
      revoked: true,
      revokedAtProvider: false,
      success: true,
    });
  } catch (error) {
    logError(`POST /api/integration/${provider}/disconnect`, error);
    return errorResponse("database_error");
  }
}
