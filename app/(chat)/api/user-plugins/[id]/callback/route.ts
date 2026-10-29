import { type NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/api/error-response";
import {
  callbackUriFor,
  openState,
  stateCookieName,
} from "@/lib/integrations/oauth";
import { internalUrl } from "@/lib/integrations/redirect";
import {
  getUserPlugin,
  readPluginSecret,
  storeOauthAccessToken,
} from "@/lib/plugins/user-plugin-store";
import { validateAndResolveUrl } from "@/lib/web/ssrf";

function pluginReturn(
  request: NextRequest,
  pluginId: string,
  query: Record<string, string | undefined>
) {
  return internalUrl(
    request.nextUrl,
    `/tools/plugins/custom/${pluginId}`,
    query
  );
}

const PROVIDER_KEY = "userplugin";

function fail(request: NextRequest, pluginId: string, message: string) {
  const response = NextResponse.redirect(
    pluginReturn(request, pluginId, { error: message })
  );
  response.cookies.set({
    maxAge: 0,
    name: stateCookieName(PROVIDER_KEY),
    path: `${request.nextUrl.basePath ?? ""}/api/user-plugins`,
    value: "",
  });
  return response;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const state = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");
  const providerError = request.nextUrl.searchParams.get("error");
  const nonce = request.cookies.get(stateCookieName(PROVIDER_KEY))?.value;
  const payload = openState(state, { nonce, provider: PROVIDER_KEY });
  if (!payload || payload.i !== id) {
    return fail(request, id, "État de connexion invalide. Recommencez.");
  }
  if (providerError || !code) {
    return fail(request, id, "Le fournisseur a refusé la connexion.");
  }
  const redirectUri = callbackUriFor({
    protocol: request.headers.get("x-forwarded-proto"),
    requestUrl: request.url,
  });
  if (!redirectUri) {
    return fail(request, id, "Adresse de retour invalide.");
  }
  try {
    const [secret, plugin] = await Promise.all([
      readPluginSecret({
        key: "client_secret",
        pluginId: id,
        userId: payload.u,
      }),
      getUserPlugin(payload.u, id),
    ]);
    if (!plugin?.tokenUrl || !plugin.clientId || !secret) {
      return fail(request, id, "Configuration OAuth incomplète.");
    }
    const checked = await validateAndResolveUrl(plugin.tokenUrl);
    if (
      checked.error ||
      !checked.host ||
      checked.host.url.protocol !== "https:"
    ) {
      return fail(request, id, "URL de jeton refusée.");
    }
    const body = new URLSearchParams({
      client_id: plugin.clientId,
      client_secret: secret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    });
    const response = await fetch(checked.host.url, {
      body,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    const raw = await response.text();
    if (!response.ok) {
      return fail(request, id, "Échange du code refusé par le fournisseur.");
    }
    const parsed = JSON.parse(raw.slice(0, 64_000)) as {
      access_token?: unknown;
    };
    if (typeof parsed.access_token !== "string" || !parsed.access_token) {
      return fail(request, id, "Le fournisseur n'a pas renvoyé de jeton.");
    }
    await storeOauthAccessToken({
      accessToken: parsed.access_token,
      accountLabel: "Compte connecté",
      pluginId: id,
      userId: payload.u,
    });
    const done = NextResponse.redirect(
      pluginReturn(request, id, { connected: "1" })
    );
    done.cookies.set({
      maxAge: 0,
      name: stateCookieName(PROVIDER_KEY),
      path: `${request.nextUrl.basePath ?? ""}/api/user-plugins`,
      value: "",
    });
    return done;
  } catch (error) {
    logError("GET /api/user-plugins/[id]/callback", error);
    return fail(request, id, "Connexion impossible.");
  }
}
