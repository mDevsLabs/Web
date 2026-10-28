import { type NextRequest, NextResponse } from "next/server";
import { errorResponse, logError } from "@/lib/api/error-response";
import { requireUser } from "@/lib/auth/require-user";
import { isProductionEnvironment } from "@/lib/constants";
import {
  callbackUriFor,
  newNonce,
  STATE_COOKIE_MAX_AGE_S,
  STATE_TTL_MS,
  sealState,
  stateCookieName,
} from "@/lib/integrations/oauth";
import { isEncryptionConfigured } from "@/lib/mcp/encryption";
import { getUserPlugin } from "@/lib/plugins/user-plugin-store";

const PROVIDER_KEY = "userplugin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if (!auth) {
    return errorResponse("auth_required", {
      message: "Connectez-vous pour relier ce plugin.",
    });
  }
  const { id } = await params;
  const plugin = await getUserPlugin(auth.userId, id);
  if (plugin?.kind !== "oauth") {
    return errorResponse("not_found", {
      message: "Plugin OAuth introuvable.",
    });
  }
  if (!plugin.authorizeUrl || !plugin.clientId) {
    return errorResponse("invalid_request", {
      message: "La configuration OAuth du plugin est incomplète.",
    });
  }
  if (!plugin.hasSecret) {
    return errorResponse("invalid_request", {
      message: "Le secret client du plugin est absent.",
    });
  }
  if (!isEncryptionConfigured()) {
    return errorResponse("service_unavailable", {
      message:
        "Le coffre de secrets n'est pas configuré sur cette instance : MCP_ENCRYPTION_KEY doit être posée sur le serveur.",
    });
  }
  const redirectUri = callbackUriFor({
    protocol: request.headers.get("x-forwarded-proto"),
    requestUrl: request.url,
  });
  if (!redirectUri) {
    logError("GET /api/user-plugins/[id]/connect", new Error(request.url));
    return errorResponse("internal_error", {
      message: "Impossible de préparer l'adresse de retour.",
    });
  }
  const nonce = newNonce();
  const state = sealState({
    i: plugin.id,
    n: nonce,
    p: PROVIDER_KEY,
    r: `/tools/plugins/custom/${plugin.id}`,
    u: auth.userId,
    x: Date.now() + STATE_TTL_MS,
  });
  let authorize: URL;
  try {
    authorize = new URL(plugin.authorizeUrl);
  } catch {
    return errorResponse("invalid_request", {
      message: "URL d'autorisation invalide.",
    });
  }
  authorize.searchParams.set("client_id", plugin.clientId);
  authorize.searchParams.set("redirect_uri", redirectUri);
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("state", state);
  if (plugin.scopes) {
    authorize.searchParams.set("scope", plugin.scopes);
  }
  const response = NextResponse.redirect(authorize);
  const base = request.nextUrl.basePath ?? "";
  response.cookies.set({
    httpOnly: true,
    maxAge: STATE_COOKIE_MAX_AGE_S,
    name: stateCookieName(PROVIDER_KEY),
    path: `${base}/api/user-plugins`,
    sameSite: "lax",
    secure: isProductionEnvironment,
    value: nonce,
  });
  return response;
}
