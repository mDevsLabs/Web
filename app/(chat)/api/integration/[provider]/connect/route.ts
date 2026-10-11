import { type NextRequest, NextResponse } from "next/server";
import { errorResponse, logError } from "@/lib/api/error-response";
import { requireUser } from "@/lib/auth/require-user";
import { isProductionEnvironment } from "@/lib/constants";
import { getPersistedTier } from "@/lib/db/users";
import {
  buildAuthorizeUrl,
  callbackUriFor,
  newNonce,
  readCredentials,
  STATE_COOKIE_MAX_AGE_S,
  STATE_TTL_MS,
  sanitizeReturnTo,
  sealState,
  stateCookieName,
  stateCookiePath,
} from "@/lib/integrations/oauth";
import { getIntegrationProvider } from "@/lib/integrations/providers";
import { internalUrl } from "@/lib/integrations/redirect";
import { isEncryptionConfigured } from "@/lib/mcp/encryption";
import { getPluginManifest } from "@/lib/plugins/catalog";
import { canUsePlugin } from "@/lib/plugins/tier-lock";

/**
 * Démarre la connexion : fabrique l'URL d'autorisation du fournisseur et y
 * scelle l'identité du compte appelant.
 *
 * Le compte voyage dans l'« état » chiffré, et non dans un identifiant de
 * session relu au retour : le navigateur a le loisir de rester une heure sur
 * l'écran de consentement, le temps que le jeton de session expire. Le nonce
 * part en parallèle dans un cookie `httpOnly`, et le callback confronte les deux
 * — une confrontation qui ferme la porte à un état attaqué depuis un autre
 * navigateur.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const auth = await requireUser();
  if (!auth) {
    return errorResponse("auth_required", {
      message: "Connectez-vous pour lier une application externe.",
    });
  }

  const { provider } = await params;
  const descriptor = getIntegrationProvider(provider);
  if (!descriptor) {
    return errorResponse("not_found", {
      message: `Connecteur inconnu : « ${provider} ».`,
    });
  }

  const requested = sanitizeReturnTo(
    request.nextUrl.searchParams.get("returnTo")
  );
  const returnTo = requested ?? `/tools/plugins/${descriptor.pluginId}`;
  const redirectFailure = (reason: string) =>
    NextResponse.redirect(
      internalUrl(request.nextUrl, returnTo, {
        integration: "error",
        provider: descriptor.id,
        reason,
      })
    );
  const installRequested =
    request.nextUrl.searchParams.get("intent") === "install";

  if (installRequested) {
    const manifest = getPluginManifest(descriptor.pluginId);
    const persistedTier = await getPersistedTier({ userId: auth.userId });
    if (!persistedTier.ok) {
      return redirectFailure("tier_unavailable");
    }
    if (!manifest || !canUsePlugin(manifest, persistedTier.tier)) {
      return redirectFailure("plan_required");
    }
  }

  const credentials = readCredentials(descriptor);
  if (!credentials) {
    return redirectFailure("not_configured");
  }
  if (!isEncryptionConfigured()) {
    // Sans coffre, impossible de sceller l'état : mieux vaut refuser le départ
    // que revenir d'un consentement qu'aucune route ne saura authentifier.
    return redirectFailure("vault_unconfigured");
  }

  const redirectUri = callbackUriFor({
    protocol: request.headers.get("x-forwarded-proto"),
    requestUrl: request.url,
  });
  if (!redirectUri) {
    logError("GET /api/integration/[provider]/connect", new Error(request.url));
    return redirectFailure("exchange_failed");
  }

  const nonce = newNonce();
  const state = sealState({
    ...(installRequested ? { i: descriptor.pluginId } : {}),
    n: nonce,
    p: descriptor.id,
    r: returnTo,
    u: auth.userId,
    x: Date.now() + STATE_TTL_MS,
  });

  const response = NextResponse.redirect(
    buildAuthorizeUrl(descriptor, {
      clientId: credentials.clientId,
      redirectUri,
      state,
    })
  );
  response.cookies.set({
    httpOnly: true,
    maxAge: STATE_COOKIE_MAX_AGE_S,
    name: stateCookieName(descriptor.id),
    path: stateCookiePath(request.nextUrl.basePath),
    sameSite: "lax",
    secure: isProductionEnvironment,
    value: nonce,
  });
  return response;
}
