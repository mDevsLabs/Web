import "server-only";

import type { IntegrationConnection } from "@/lib/db/schema";
import { isEncryptionConfigured } from "@/lib/mcp/encryption";
import type { PluginSecretResolver } from "@/lib/plugins/types";
import { unpackCredential } from "./credential-envelope";
import { type OAuthTokenSet, readCredentials, refreshTokens } from "./oauth";
import {
  getIntegrationProvider,
  type IntegrationDescriptor,
  type IntegrationProviderId,
} from "./providers";
import {
  getPrimaryConnection,
  markConnectionRevoked,
  persistRefreshedTokens,
  readAccessToken,
  readRefreshToken,
} from "./repository";

/**
 * Lecture du jeton d'un compte, avec rafraîchissement à l'avance.
 *
 * Le point dur : Google fait tourner le `refresh_token` à chaque rafraîchissement
 * et laisse l'ancien vivant une dizaine de minutes. Deux outils du même run qui
 * rafraîchissent en parallèle écriraient donc deux paires différentes, et la
 * seconde perdrait la trace de la première. D'où deux gardes : un vol en groupe
 * par connexion (une seule requête réseau en cours) et une écriture conditionnée
 * au jeton stocké (`persistRefreshedTokens`).
 */

export type AccessTokenOutcome = {
  /** `null` quand aucune connexion utilisable n'existe : le plugin doit conseiller, pas erreur. */
  accessToken: string | null;
  /** La ligne a été jugée morte (révocation côté fournisseur, coffre incohérent). */
  revoked: boolean;
  scopes: string;
};

const NOT_CONNECTED: AccessTokenOutcome = {
  accessToken: null,
  revoked: false,
  scopes: "",
};

/** Une seule requête de rafraîchissement par connexion, quelle que soit la concurrence. */
const inFlight = new Map<string, Promise<AccessTokenOutcome>>();

function needsRefresh(
  descriptor: IntegrationDescriptor,
  row: IntegrationConnection
): boolean {
  if (descriptor.refresh.policy !== "oauth_refresh") {
    return false;
  }
  if (!row.expiresAt) {
    return true;
  }
  return (
    row.expiresAt.getTime() - Date.now() < descriptor.refresh.refreshLeadMs
  );
}

async function outcomeOf(
  descriptor: IntegrationDescriptor,
  row: IntegrationConnection
): Promise<AccessTokenOutcome> {
  const accessToken = readAccessToken(row);
  if (accessToken) {
    if (needsRefresh(descriptor, row)) {
      return refreshTokenFor(descriptor, row);
    }
    return { accessToken, revoked: false, scopes: row.scopes };
  }
  // Pas de porteur lisible : la connexion existe mais n'est plus exploitable.
  return { accessToken: null, revoked: true, scopes: row.scopes };
}

async function refreshTokenFor(
  descriptor: IntegrationDescriptor,
  row: IntegrationConnection
): Promise<AccessTokenOutcome> {
  const attempt = (async (): Promise<AccessTokenOutcome> => {
    const credentials = readCredentials(descriptor);
    if (!credentials) {
      // Connecteur non configuré : conseil permanent, pas une panne.
      return { accessToken: null, revoked: false, scopes: row.scopes };
    }
    const refreshToken = readRefreshToken(row);
    if (!refreshToken) {
      // Plus de quoi renouveler : la ligne est morte, on le dit une fois pour
      // toutes plutôt que de retenter à chaque appel d'outil.
      await markConnectionRevoked({ connectionId: row.id, userId: row.userId });
      return { accessToken: null, revoked: false, scopes: row.scopes };
    }

    const result = await refreshTokens(descriptor, {
      credentials,
      refreshToken,
    });
    if (!result.ok) {
      if (result.reason === "grant_revoked") {
        // Refus TERMINAL établi par le fournisseur (`invalid_grant`) : la
        // reconnexion est la seule sortie. Un 503, un 429, une erreur réseau
        // ou une erreur de configuration ne doivent JAMAIS arriver ici.
        await markConnectionRevoked({
          connectionId: row.id,
          userId: row.userId,
        });
        return { accessToken: null, revoked: false, scopes: row.scopes };
      }
      if (result.reason === "not_configured") {
        return { accessToken: null, revoked: false, scopes: row.scopes };
      }
      if (result.reason === "configuration") {
        throw new Error(
          `Le connecteur ${descriptor.id} est mal configuré : le rafraîchissement du jeton a été refusé. Les jetons existants sont conservés.`
        );
      }
      // `temporary`, `network` et `exchange_failed` : panne ou réponse
      // inexploitable. On LÈVE pour que l'Agent la classe rejouable, sans
      // supprimer la connexion ni imposer une reconnexion.
      throw new Error(
        `Le service ${descriptor.id} est momentanément indisponible : rafraîchissement du jeton impossible.`
      );
    }

    const tokenSet: OAuthTokenSet = result.value;
    const persisted = await persistRefreshedTokens({
      accessToken: tokenSet.accessToken,
      connectionId: row.id,
      // Comparaison sur la valeur chiffrée telle que stockée, pas sur le clair.
      expectedAccessToken: row.accessToken,
      expiresAt: tokenSet.expiresAt,
      refreshToken: tokenSet.refreshToken,
      scopes: tokenSet.scopes || row.scopes,
    });
    if (persisted) {
      return {
        accessToken: tokenSet.accessToken,
        revoked: false,
        scopes: tokenSet.scopes || row.scopes,
      };
    }
    // Perdu de vitesse : le gagnant a écrit un jeton tout neuf, on le relit.
    const winner = await getPrimaryConnection({
      provider: descriptor.id,
      userId: row.userId,
    });
    return winner
      ? {
          accessToken: readAccessToken(winner),
          revoked: false,
          scopes: winner.scopes,
        }
      : { accessToken: null, revoked: true, scopes: row.scopes };
  })();

  inFlight.set(row.id, attempt);
  try {
    return await attempt;
  } finally {
    // Ne retirer que SA propre promesse : une seconde salve a pu prendre la clé.
    if (inFlight.get(row.id) === attempt) {
      inFlight.delete(row.id);
    }
  }
}

export async function ensureFreshAccessToken(params: {
  descriptor: IntegrationDescriptor;
  row: IntegrationConnection;
}): Promise<AccessTokenOutcome> {
  const pending = inFlight.get(params.row.id);
  if (pending) {
    return await pending;
  }
  return await outcomeOf(params.descriptor, params.row);
}

export async function accessTokenForProvider(params: {
  provider: IntegrationProviderId;
  userId: string;
}): Promise<AccessTokenOutcome> {
  if (!isEncryptionConfigured()) {
    // Jamais de repli muet : sans coffre, on ne peut ni lire ni écrire un
    // jeton, et le dire vaut mieux qu'un 401 du fournisseur.
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
  return await ensureFreshAccessToken({ descriptor, row });
}

/**
 * Adapte le coffre des intégrations au contrat `secretResolver` d'un plugin —
 * même forme que `createMcpSecretResolver` (`lib/mcp/secrets-config.ts:158`),
 * afin que les plugins n'aient qu'un seul canal de secrets.
 *
 * La clé est résolue à l'exécution de l'outil, jamais à sa création : un run
 * Agent de quarante minutes ne doit pas voyager avec un jeton d'une heure.
 * Deux issues, un seul canal : `undefined` = non connecté (échec permanent, le
 * plugin rend un conseil), une levée = service indisponible (échec transitoire).
 */
const SECRET_SUFFIXES = new Set([
  "access_token",
  "fields",
  "refresh_token",
  "scopes",
]);

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
    if (matched.suffix === "scopes") {
      const row = await getPrimaryConnection({
        provider,
        userId: params.userId,
      });
      return row?.scopes;
    }
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
    // L'enveloppe éventuelle (jeton + champs) ne sort pas : l'outil ne reçoit
    // que le secret. Un jeton historique, sans enveloppe, est renvoyé tel quel.
    return unpackCredential(outcome.accessToken).token || undefined;
  };
}
