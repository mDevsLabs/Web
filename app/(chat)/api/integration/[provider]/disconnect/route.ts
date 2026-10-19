import { type NextRequest, NextResponse } from "next/server";
import { errorResponse, logError } from "@/lib/api/error-response";
import { requireUser } from "@/lib/auth/require-user";
import { readCredentials, revokeConnection } from "@/lib/integrations/oauth";
import { getIntegrationProvider } from "@/lib/integrations/providers";
import {
  getPrimaryConnection,
  markConnectionRevoked,
  readAccessToken,
  readRefreshToken,
} from "@/lib/integrations/repository";

/**
 * Déconnexion : la ligne survit, marquée `revokedAt`, sans jeton exploitable.
 *
 * Effacer la ligne ferait croire à un ancien compte qu'il est encore connecté
 * dès qu'un ancien cache le relit, et supprimer des données utilisateur n'est
 * pas ce que demande un bouton « Déconnecter ».
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
      // Idempotent : « déjà déconnecté » n'est pas une erreur.
      return NextResponse.json({
        message: `${descriptor.label} n'est pas connecté sur ce compte.`,
        revoked: false,
        success: true,
      });
    }

    const credentials = readCredentials(descriptor);
    const accessToken = readAccessToken(row);
    let revokedAtProvider = false;
    if (credentials && accessToken) {
      revokedAtProvider = await revokeConnection(descriptor, {
        accessToken,
        credentials,
        refreshToken: readRefreshToken(row),
      });
    }

    await markConnectionRevoked({ connectionId: row.id, userId: auth.userId });

    return NextResponse.json({
      message: revokedAtProvider
        ? `${descriptor.label} déconnecté — l'accès a été révoqué chez le fournisseur.`
        : `${descriptor.label} déconnecté d'ici. Révoquez aussi l'accès depuis le compte ${descriptor.label} si nécessaire.`,
      revoked: true,
      // Distinguer les deux issues : la révocation côté fournisseur peut échouer
      // sans que la déconnexion locale soit ratée.
      revokedAtProvider,
      success: true,
    });
  } catch (error) {
    logError(`POST /api/integration/${provider}/disconnect`, error);
    return errorResponse("database_error");
  }
}
