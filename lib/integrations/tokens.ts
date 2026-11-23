import "server-only";

import { isEncryptionConfigured } from "@/lib/mcp/encryption";
import type { PluginSecretResolver } from "@/lib/plugins/core/types";
import { unpackCredential } from "./credential-envelope";
import {
  getIntegrationProvider,
  type IntegrationProviderId,
} from "./providers";
import { getPrimaryConnection, readAccessToken } from "./repository";

/**
 * Lecture du jeton personnel d'un compte connecté.
 *
 * Tous les connecteurs utilisent un jeton personnel statique stocké dans le
 * coffre chiffré (`integration_connection`).
 */

export type AccessTokenOutcome = {
  /** `null` quand aucune connexion utilisable n'existe : le plugin conseille, sans lever. */
  accessToken: string | null;
  /** La ligne est indéchiffrable ou corrompue. */
  revoked: boolean;
  scopes: string;
};

const NOT_CONNECTED: AccessTokenOutcome = {
  accessToken: null,
  revoked: false,
  scopes: "",
};

export async function accessTokenForProvider(params: {
  provider: IntegrationProviderId;
  userId: string;
}): Promise<AccessTokenOutcome> {
  if (!isEncryptionConfigured()) {
    throw new Error(
      "Coffre non configuré (MCP_ENCRYPTION_KEY) : les intégrations externes sont indisponibles."
    );
  }
  const descriptor = getIntegrationProvider(params.provider);
  if (!descriptor) {
    return NOT_CONNECTED;
  }
  const row = await getPrimaryConnection({
    provider: params.provider,
    userId: params.userId,
  });
  if (!row) {
    return NOT_CONNECTED;
  }
  const accessToken = readAccessToken(row);
  if (!accessToken) {
    return { accessToken: null, revoked: true, scopes: row.scopes };
  }
  return { accessToken, revoked: false, scopes: row.scopes };
}

const SECRET_SUFFIXES = new Set(["access_token", "fields", "refresh_token"]);

function parseAuthKey(
  key: string
): { id: IntegrationProviderId; suffix: string } | null {
  const dot = key.lastIndexOf(".");
  if (dot <= 0) {
    return null;
  }
  const suffix = key.slice(dot + 1);
  if (!SECRET_SUFFIXES.has(suffix)) {
    return null;
  }
  const id = key.slice(0, dot);
  if (!getIntegrationProvider(id)) {
    return null;
  }
  return { id: id as IntegrationProviderId, suffix };
}

export function createIntegrationSecretResolver(params: {
  userId: string;
}): PluginSecretResolver {
  return async (request) => {
    if (request.kind !== "auth") {
      return;
    }
    const matched = parseAuthKey(request.key);
    if (!matched) {
      return;
    }
    const provider = matched.id;
    if (matched.suffix === "fields") {
      const row = await getPrimaryConnection({
        provider,
        userId: params.userId,
      });
      const raw = row ? readAccessToken(row) : null;
      if (!raw) {
        return;
      }
      return JSON.stringify(unpackCredential(raw).fields);
    }
    if (matched.suffix === "refresh_token") {
      throw new Error(
        "Le refresh token n'est jamais exposé à un outil : seul le porteur d'accès est délivré."
      );
    }
    const outcome = await accessTokenForProvider({
      provider,
      userId: params.userId,
    });
    if (!outcome.accessToken) {
      return;
    }
    return unpackCredential(outcome.accessToken).token || undefined;
  };
}
