import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/api/error-response";
import { installPlugin } from "@/lib/db/queries";
import { getPersistedTier } from "@/lib/db/users";
import {
  callbackUriFor,
  exchangeCode,
  openState,
  readCredentials,
  resolveAccount,
  stateCookieName,
  stateCookiePath,
} from "@/lib/integrations/oauth";
import { getIntegrationProvider } from "@/lib/integrations/providers";
import {
  accountLabelForUrl,
  type IntegrationFailureReason,
  internalUrl,
} from "@/lib/integrations/redirect";
import {
  getPrimaryConnection,
  storeConnection,
} from "@/lib/integrations/repository";
import { isEncryptionConfigured } from "@/lib/mcp/encryption";
import { getPluginManifest } from "@/lib/plugins/catalog";
import { canUsePlugin } from "@/lib/plugins/tier-lock";

/**
 * Retour du fournisseur. Cette route s'authentifie par l'« état » scellé, pas
 * par le cookie de session : c'est pourquoi `proxy.ts` la laisse passer. Le
 * compte auquel attribuer le jeton est celui inscrit dans l'état au départ.
 *
 * Elle ne rend jamais rien : toute sortie est une redirection vers une page de
 * l'application, l'issue en query. Un pop-up auto-fermé est impossible ici — la
 * page de consentement est une navigation top-level, et le message
 * `window.opener` meurt avec l'abandon des cookies tiers.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const descriptor = getIntegrationProvider(provider);
  const query = request.nextUrl.searchParams;
  const store = await cookies();
  const cookieName = stateCookieName(provider);
  const nonce = store.get(cookieName)?.value;
  const opened = openState(query.get("state"), { nonce, provider });
  // L'état a servi : il meurt avec ce tour de navigateur, et ne peut pas être
  // rejoué sur un second aller-retour.
  store.delete({
    name: cookieName,
    path: stateCookiePath(request.nextUrl.basePath),
  });

  const target =
    opened?.r ??
    (descriptor ? `/tools/plugins/${descriptor.pluginId}` : "/tools");
  const back = (
    reason: IntegrationFailureReason | null,
    extra?: { account?: string; installation?: string }
  ) =>
    NextResponse.redirect(
      internalUrl(request.nextUrl, target, {
        account: extra?.account,
        installation: extra?.installation,
        integration: reason ? "error" : "connected",
        provider,
        reason: reason ?? undefined,
      })
    );

  if (!descriptor) {
    return back("state_invalid");
  }

  // Refus explicite sur l'écran de consentement : ce n'est pas une panne.
  if (query.get("error")) {
    return back(
      query.get("error") === "access_denied"
        ? "provider_denied"
        : "exchange_failed"
    );
  }
  if (!opened) {
    return back("state_invalid");
  }
  if (opened.i && opened.i !== descriptor.pluginId) {
    return back("state_invalid");
  }
  if (!isEncryptionConfigured()) {
    return back("vault_unconfigured");
  }

  const credentials = readCredentials(descriptor);
  const code = query.get("code");
  const redirectUri = callbackUriFor({
    protocol: request.headers.get("x-forwarded-proto"),
    requestUrl: request.url,
  });
  if (!credentials || !code || !redirectUri) {
    return back(credentials ? "exchange_failed" : "not_configured");
  }

  const exchanged = await exchangeCode(descriptor, {
    code,
    credentials,
    redirectUri,
  });
  if (!exchanged.ok) {
    logError(
      `GET /api/integration/${provider}/callback — échange du code`,
      new Error(exchanged.reason)
    );
    return back("exchange_failed");
  }

  const identity = await resolveAccount(
    descriptor,
    exchanged.value,
    credentials
  );
  if (!identity) {
    // Un jeton sans identité vérifiable ne peut être attribué à personne : il
    // est jeté plutôt que stocké sur une supposition de compte.
    logError(
      `GET /api/integration/${provider}/callback — identité`,
      new Error("compte fournisseur illisible")
    );
    return back("exchange_failed");
  }

  const already = await getPrimaryConnection({
    provider: descriptor.id,
    userId: opened.u,
  });

  await storeConnection({
    accessToken: exchanged.value.accessToken,
    accountEmail: identity.accountEmail,
    accountLabel: identity.accountLabel,
    expiresAt: exchanged.value.expiresAt,
    provider: descriptor.id,
    providerAccountId: identity.providerAccountId,
    refreshToken: exchanged.value.refreshToken,
    scopes: exchanged.value.scopes,
    userId: opened.u,
  });

  // Identité : `userId` vient de `user.id || user.email`. Si le backend rend un
  // `id` là où il n'en rendait pas, le même humain devient deux comptes et ses
  // connexions se scindent en silence. Cette ligne est le seul endroit où ce
  // cas devient observable dans les journaux.
  console.info(
    `[integration] guard=connection provider=${descriptor.id} account=${identity.providerAccountId} reconnect=${Boolean(already)}`
  );

  let installation: string | undefined;
  if (opened.i) {
    const manifest = getPluginManifest(opened.i);
    const persistedTier = await getPersistedTier({ userId: opened.u });
    if (!manifest) {
      installation = "failed";
    } else if (!persistedTier.ok) {
      installation = "tier_unavailable";
    } else if (canUsePlugin(manifest, persistedTier.tier)) {
      try {
        await installPlugin({
          pluginId: manifest.id,
          userId: opened.u,
          version: manifest.version,
        });
        installation = "installed";
      } catch (error) {
        logError(
          `GET /api/integration/${provider}/callback — installation du plugin`,
          error
        );
        installation = "failed";
      }
    } else {
      installation = "plan_required";
    }
  }

  return back(null, {
    account: accountLabelForUrl(identity.accountLabel),
    installation,
  });
}
