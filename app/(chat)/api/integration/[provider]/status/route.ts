import { type NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/error-response";
import { requireUser } from "@/lib/auth/require-user";
import { getIntegrationProvider } from "@/lib/integrations/providers";
import { getIntegrationStatus } from "@/lib/integrations/status";

/** État d'un seul connecteur, sans jeton : lecture légère pour la fiche plugin. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const auth = await requireUser();
  if (!auth) {
    return errorResponse("auth_required", {
      message: "Connectez-vous pour consulter vos connexions.",
    });
  }

  const { provider } = await params;
  const descriptor = getIntegrationProvider(provider);
  if (!descriptor) {
    return errorResponse("not_found", {
      message: `Connecteur inconnu : « ${provider} ».`,
    });
  }

  const status = await getIntegrationStatus({
    provider: descriptor.id,
    userId: auth.userId,
  });
  return NextResponse.json({ integration: status });
}
