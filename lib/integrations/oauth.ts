import "server-only";

import { randomBytes } from "node:crypto";
import { decrypt, encrypt, isEncryptionConfigured } from "@/lib/mcp/encryption";
import type { IntegrationDescriptor } from "./providers";

/**
 * Flux OAuth générique : URL d'autorisation, scellement de l'« état », échange
 * du code, rafraîchissement, identité du compte, révocation.
 *
 * Deux choix à connaître avant d'en toucher un :
 *
 *  - L'« état » n'est pas un opaque gardé en mémoire de serveur : il porte
 *    l'identité du compte qui a lancé la connexion et doit survivre à une
 *    navigation hors du processus. On le chiffre donc avec le coffre déjà en
 *    place (`lib/mcp/encryption.ts`), tag GCM inclus — ce qui fait d'un état
 *    forgé un `decrypt()` renvoyant `""`, jamais une donnée exploitable.
 *
 *  - Les hôtes OAuth ont leur propre liste blanche, séparée de celle des API
 *    publiques des plugins : élargir `ALLOWED_HOSTS` de
 *    `lib/plugins/shared/public-api.ts` pour un swap de token reviendrait à
 *    laisser n'importe quel plugin appeler un endpoint d'identifiants.
 */

export const MAI_OAUTH_STATE_COOKIE = "mai_oauth_nonce";
/** Durée de vie d'un état : le temps d'un aller-retour sur l'écran de consentement. */
export const STATE_TTL_MS = 5 * 60 * 1000;
export const STATE_COOKIE_MAX_AGE_S = 10 * 60;

const TOKEN_TIMEOUT_MS = 10_000;
const TOKEN_MAX_BYTES = 64_000;

export type OAuthFailureReason =
  /** `GOOGLE_CLIENT_ID` / `GITHUB_CLIENT_ID` absent : le connecteur n'est pas activé. */
  | "not_configured"
  /** Le fournisseur a refusé l'échange pour une raison de configuration
   *  (`invalid_client`, `invalid_request`…) : ne jamais révoquer sur cela. */
  | "configuration"
  /** Le fournisseur a refusé DÉFINITIVEMENT le grant (`invalid_grant`). */
  | "grant_revoked"
  /** Fournisseur injoignable, 5xx, 429 : transitoire, jamais une déconnexion. */
  | "temporary"
  /** Réponse 2xx inexploitable (bug fournisseur) : à rejouer, sans révoquer. */
  | "exchange_failed"
  /** Alias historique de `temporary`, conservé pour les appelants existants. */
  | "network";

export type OAuthResult<T> =
  | { ok: false; reason: OAuthFailureReason }
  | { ok: true; value: T };

export type OAuthTokenSet = {
  accessToken: string;
  /** GitHub n'en délivre pas : la connexion s'éteint par révocation, pas par expiration. */
  expiresAt: Date | null;
  idToken: string | null;
  refreshToken: string | null;
  scopes: string;
};

export type OAuthAccountIdentity = {
  accountEmail: string | null;
  accountLabel: string | null;
  providerAccountId: string;
};

export type OAuthCredentials = {
  clientId: string;
  clientSecret: string;
};

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

/** Les identifiants ne sont lus qu'ici, côté serveur : le descripteur reste exportable au client. */
export function readCredentials(
  descriptor: IntegrationDescriptor
): OAuthCredentials | null {
  const clientId = readEnv(`${descriptor.envPrefix}_CLIENT_ID`);
  const clientSecret = readEnv(`${descriptor.envPrefix}_CLIENT_SECRET`);
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

/**
 * Un cookie par fournisseur : deux onglets ouvrant deux écrans de consentement
 * différents ne doivent pas effacer le nonce l'un de l'autre.
 */
export function stateCookieName(provider: string): string {
  return `${MAI_OAUTH_STATE_COOKIE}-${provider}`;
}

/** Le cookie doit suivre le chemin public quand l'application a un basePath. */
export function stateCookiePath(basePath = ""): string {
  return `${basePath.replace(/\/+$/, "")}/api/integration`;
}

export function newNonce(): string {
  return randomBytes(16).toString("base64url");
}

export type OAuthStatePayload = {
  /** Nonce confronté au cookie : double-submit qui ferme la porte à un état volé ailleurs. */
  n: string;
  p: string;
  /** Où ramener l'utilisateur après le consentement. */
  r: string;
  /** Identifiant du compte qui a lancé la connexion — le callback n'a plus besoin de la session. */
  u: string;
  /** Plugin à installer uniquement après un consentement OAuth validé. */
  i?: string;
  /** Expiration, epoch ms. */
  x: number;
};

/**
 * `returnTo` ne peut désigner qu'une route interne : `//hôte` est une
 * redirection relative-protocole, et `/\hôte` est traitée comme telle par les
 * navigateurs. Seule cette validation empêche le callback de devenir un
 * ouvre-boîte de redirection ouverte.
 */
export function sanitizeReturnTo(
  raw: string | null | undefined
): string | null {
  if (!raw?.startsWith("/")) {
    return null;
  }
  if (raw.startsWith("//") || raw.includes("\\")) {
    return null;
  }
  return raw.slice(0, 500);
}

export function sealState(payload: OAuthStatePayload): string {
  if (!isEncryptionConfigured()) {
    throw new Error(
      "Coffre non configuré : MCP_ENCRYPTION_KEY manquante, impossible de sceller un état OAuth."
    );
  }
  return encrypt(JSON.stringify(payload));
}

/** Un état forgé, expiré ou d'un autre fournisseur rend `null` — jamais une donnée partielle. */
export function openState(
  raw: string | null | undefined,
  expected: { nonce: string | undefined; provider: string }
): OAuthStatePayload | null {
  if (!raw || !isEncryptionConfigured()) {
    return null;
  }
  const plain = decrypt(raw);
  if (!plain) {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(plain);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") {
    return null;
  }
  const payload = parsed as Partial<OAuthStatePayload>;
  if (
    typeof payload.n !== "string" ||
    typeof payload.p !== "string" ||
    typeof payload.r !== "string" ||
    typeof payload.u !== "string" ||
    (payload.i !== undefined && typeof payload.i !== "string") ||
    typeof payload.x !== "number"
  ) {
    return null;
  }
  if (payload.p !== expected.provider) {
    return null;
  }
  if (!expected.nonce || payload.n !== expected.nonce) {
    return null;
  }
  if (payload.x < Date.now()) {
    return null;
  }
  return sanitizeReturnTo(payload.r) ? (payload as OAuthStatePayload) : null;
}

/**
 * URI de rappel annoncée au fournisseur, dérivée de la requête du route
 * `connect` : `request.url` porte déjà l'origine ET le `basePath` (`/demo` en
 * démo, voir `next.config.ts:4,157`), donc rien n'est réassemblé depuis une
 * variable d'environnement. `MAI_OAUTH_REDIRECT_BASE_URL` ne sert qu'à rétablir
 * une origine masquée par un proxy, et `protocol` vient de `x-forwarded-proto`
 * pour la même raison.
 */
export function callbackUriFor(params: {
  protocol?: string | null;
  requestUrl: string;
}): string | null {
  let url: URL;
  try {
    url = new URL(params.requestUrl);
  } catch {
    return null;
  }
  // La même URI est fabriquée au départ (`.../connect`) et au retour
  // (`.../callback`), et le fournisseur compare les deux chaînes octet à octet :
  // accepter les deux terminaisons ici est ce qui garantit qu'elles restent
  // identiques. Un `redirect_uri_mismatch` venu d'une reconstruction différente
  // serait un plantage sans rapport avec le code.
  if (!/\/(connect|callback)\/?$/.test(url.pathname)) {
    return null;
  }
  const pathname = url.pathname.replace(
    /\/(connect|callback)\/?$/,
    "/callback"
  );
  const override = readEnv("MAI_OAUTH_REDIRECT_BASE_URL");
  if (override) {
    try {
      return `${new URL(override).origin}${pathname}`;
    } catch {
      return null;
    }
  }
  // `x-forwarded-proto` arrive sans deux-points ("https"), `url.protocol` avec
  // ("https:") : normaliser, sinon on fabrique une URI "https//hôte" que le
  // fournisseur refuse au retour.
  const forwarded = params.protocol?.split(",")[0]?.trim();
  const scheme = forwarded
    ? forwarded.endsWith(":")
      ? forwarded
      : `${forwarded}:`
    : url.protocol;
  return `${scheme}//${url.host}${pathname}`;
}

export function buildAuthorizeUrl(
  descriptor: IntegrationDescriptor,
  params: { clientId: string; redirectUri: string; state: string }
): string {
  const url = new URL(descriptor.authorizeUrl);
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", descriptor.scopes.join(" "));
  url.searchParams.set("state", params.state);
  if (descriptor.envPrefix === "GOOGLE") {
    // Sans `prompt=consent`, Google ne renvoie un `refresh_token` que lors du
    // tout premier consentement : au suivant, la connexion meurt à l'heure.
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");
  }
  return url.href;
}

/** Le corps est plafonné : un endpoint d'identifiants n'a rien à rendre de plusieurs mégaoctets. */
async function readCappedBody(response: Response): Promise<string> {
  if (!response.body) {
    return await response.text();
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    received += value.byteLength;
    if (received > TOKEN_MAX_BYTES) {
      await reader.cancel();
      throw new Error("Réponse OAuth trop volumineuse");
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

function requestJson(
  url: string,
  init: RequestInit
): Promise<OAuthResult<Record<string, unknown>>> {
  return (async () => {
    try {
      const response = await fetch(url, {
        ...init,
        redirect: "error",
        signal: AbortSignal.timeout(TOKEN_TIMEOUT_MS),
      });
      if (!response.ok) {
        // Le statut seul ne dit pas si le GRANT est mort. Un 503 ou un 429 ne
        // doit jamais effacer les jetons ; seul `invalid_grant` l'autorise.
        if (
          response.status === 408 ||
          response.status === 425 ||
          response.status === 429 ||
          response.status >= 500
        ) {
          return { ok: false, reason: "temporary" };
        }
        let providerError = "";
        try {
          const body = await readCappedBody(response);
          const parsed = JSON.parse(body || "{}") as {
            error?: unknown;
            error_description?: unknown;
          };
          providerError = typeof parsed.error === "string" ? parsed.error : "";
        } catch {
          providerError = "";
        }
        if (
          providerError === "invalid_grant" ||
          providerError === "invalid_token"
        ) {
          return { ok: false, reason: "grant_revoked" };
        }
        if (response.status >= 400 && response.status < 500) {
          // `invalid_client`, `invalid_request`, `unsupported_grant_type` :
          // problème de configuration. Les jetons restent en place.
          return { ok: false, reason: "configuration" };
        }
        return { ok: false, reason: "temporary" };
      }
      const parsed = JSON.parse(
        (await readCappedBody(response)) || "{}"
      ) as unknown;
      if (!parsed || typeof parsed !== "object") {
        return { ok: false, reason: "exchange_failed" };
      }
      return { ok: true, value: parsed as Record<string, unknown> };
    } catch {
      return { ok: false, reason: "temporary" };
    }
  })();
}

function postForm(
  url: string,
  body: URLSearchParams,
  headers: Record<string, string> = {}
): Promise<OAuthResult<Record<string, unknown>>> {
  return requestJson(url, {
    body,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      ...headers,
    },
    method: "POST",
  });
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

function toTokenSet(
  descriptor: IntegrationDescriptor,
  payload: Record<string, unknown>
): OAuthResult<OAuthTokenSet> {
  const accessToken = asString(payload.access_token);
  if (!accessToken) {
    return { ok: false, reason: "exchange_failed" };
  }
  const expiresIn = Number(payload.expires_in);
  return {
    ok: true,
    value: {
      accessToken,
      // La marge de rafraîchissement appartient à `refreshLeadMs` du
      // descripteur : ne pas en double employer une ici.
      expiresAt: Number.isFinite(expiresIn)
        ? new Date(Date.now() + expiresIn * 1000)
        : null,
      idToken: asString(payload.id_token),
      refreshToken: asString(payload.refresh_token),
      // GitHub ne rend `scope` que sur le swap ; le défaut reste la portée
      // demandée, jamais celle d'un échange précédent.
      scopes:
        asString(payload.scope) ??
        asString(payload.authorized_scopes) ??
        descriptor.scopes.join(" "),
    },
  };
}

export async function exchangeCode(
  descriptor: IntegrationDescriptor,
  params: { code: string; credentials: OAuthCredentials; redirectUri: string }
): Promise<OAuthResult<OAuthTokenSet>> {
  const result = await postForm(
    descriptor.tokenUrl,
    new URLSearchParams({
      client_id: params.credentials.clientId,
      client_secret: params.credentials.clientSecret,
      code: params.code,
      grant_type: "authorization_code",
      redirect_uri: params.redirectUri,
    })
  );
  return result.ok ? toTokenSet(descriptor, result.value) : result;
}

export async function refreshTokens(
  descriptor: IntegrationDescriptor,
  params: { credentials: OAuthCredentials; refreshToken: string }
): Promise<OAuthResult<OAuthTokenSet>> {
  const result = await postForm(
    descriptor.tokenUrl,
    new URLSearchParams({
      client_id: params.credentials.clientId,
      client_secret: params.credentials.clientSecret,
      grant_type: "refresh_token",
      refresh_token: params.refreshToken,
    })
  );
  if (!result.ok) {
    return result;
  }
  const tokenSet = toTokenSet(descriptor, result.value);
  // Google n'émet un nouveau `refresh_token` que lorsqu'il fait tourner ;
  // perdre l'ancien rendrait la connexion définitivement muette.
  if (tokenSet.ok && !tokenSet.value.refreshToken) {
    tokenSet.value.refreshToken = params.refreshToken;
  }
  return tokenSet;
}

/**
 * Identité du compte connecté. L'`id_token` n'est pas vérifié par signature :
 * il vient directement du endpoint de token de Google sur une connexion TLS, et
 * non d'une assertion fournie par le navigateur. C'est la seule raison qui rend
 * ce décodage licite — ne pas le réutiliser pour un id_token reçu d'un client.
 */
export async function resolveAccount(
  descriptor: IntegrationDescriptor,
  tokenSet: OAuthTokenSet,
  credentials: OAuthCredentials
): Promise<OAuthAccountIdentity | null> {
  if (!descriptor.accountUrl) {
    const claims = decodeIdTokenClaims(tokenSet.idToken);
    const sub = asString(claims?.sub);
    if (!sub) {
      return null;
    }
    const email = asString(claims?.email);
    return {
      accountEmail: email,
      accountLabel: email ?? asString(claims?.name) ?? sub,
      providerAccountId: sub,
    };
  }

  const result = await requestJson(descriptor.accountUrl, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${tokenSet.accessToken}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    method: "GET",
  });
  if (!result.ok) {
    return null;
  }
  const id = result.value.id;
  const providerAccountId =
    typeof id === "number" || typeof id === "string" ? String(id) : null;
  if (!providerAccountId) {
    return null;
  }
  const login = asString(result.value.login);
  return {
    accountEmail: asString(result.value.email),
    accountLabel: login ?? asString(result.value.name) ?? providerAccountId,
    providerAccountId,
  };
}

function decodeIdTokenClaims(
  idToken: string | null
): Record<string, unknown> | null {
  const payload = idToken?.split(".")[1];
  if (!payload) {
    return null;
  }
  try {
    const claims = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as unknown;
    return claims && typeof claims === "object"
      ? (claims as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/**
 * Révocation chez le fournisseur. Elle échoue souvent — jeton déjà expiré,
 * portée insuffisante, endpoint exigeant une autorisation d'app — et n'est
 * jamais bloquante : la ligne locale est de toute façon marquée révoquée.
 */
export async function revokeConnection(
  descriptor: IntegrationDescriptor,
  params: {
    accessToken: string;
    credentials: OAuthCredentials;
    refreshToken: string | null;
  }
): Promise<boolean> {
  if (!descriptor.revoke) {
    return false;
  }
  const { endpoint, mode } = descriptor.revoke;

  if (mode === "token_query") {
    // Google ne révoque l'ensemble du grant que si l'on passe le
    // `refresh_token` ; le simple access token ne coupe que l'heure en cours.
    const candidates = [params.refreshToken, params.accessToken].filter(
      (token): token is string => Boolean(token)
    );
    for (const token of candidates) {
      const result = await postForm(endpoint, new URLSearchParams({ token }));
      if (result.ok) {
        return true;
      }
    }
    return false;
  }

  try {
    // `fetch` des types Web n'expose pas d'option `auth` : le Basic se pose
    // dans l'en-tête, comme GitHub l'attend pour une révocation d'app.
    const basic = Buffer.from(
      `${params.credentials.clientId}:${params.credentials.clientSecret}`
    ).toString("base64");
    const response = await fetch(
      endpoint.replace(":clientId", params.credentials.clientId),
      {
        body: JSON.stringify({
          access_token: params.accessToken,
          client_id: params.credentials.clientId,
        }),
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Basic ${basic}`,
          "Content-Type": "application/json",
        },
        method: "DELETE",
        redirect: "error",
        signal: AbortSignal.timeout(TOKEN_TIMEOUT_MS),
      }
    );
    return response.ok;
  } catch {
    return false;
  }
}
