import "server-only";

import { getMcpServerSecrets } from "@/lib/db/queries";
import { decrypt } from "./encryption";

// Injection des secrets MCP au moment de l'appel.
//
// Les tokens/clés saisis par l'utilisateur sont stockés chiffrés
// (mcp_server_secret + AES-256-GCM). Ils sont déchiffrés ici, côté serveur
// uniquement, puis fusionnés dans la configuration d'appel :
//   • kind "env"    → variable d'environnement du process stdio ;
//   • kind "auth"   → authConfig (token, clientId/Secret, username/password) ;
//   • kind "header" → en-tête HTTP.
// Aucun secret n'est journalisé, renvoyé au client ou écrit dans la ligne
// `McpServer`.

export type McpSecretKind = "env" | "auth" | "header";

export type McpSecretDescriptor = {
  key: string;
  kind: McpSecretKind;
  value: string;
};

export type McpEffectiveConfig = {
  authConfig: Record<string, string>;
  env: Record<string, string>;
  headers: Record<string, string>;
};

function asStringRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const record: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (
      key === "__proto__" ||
      key === "prototype" ||
      key === "constructor" ||
      !/^[A-Za-z_][A-Za-z0-9_-]{0,127}$/.test(key) ||
      typeof raw !== "string" ||
      raw.length > 16_384
    ) {
      continue;
    }
    record[key] = raw;
  }
  return record;
}

function isSecretKind(value: string): value is McpSecretKind {
  return value === "env" || value === "auth" || value === "header";
}

// Lit et déchiffre les secrets d'un serveur. Une valeur indéchiffrable est
// ignorée (rotation de clé, ligne corrompue) plutôt que d'envoyer un secret
// vide dans la requête.
export async function loadMcpSecretDescriptors(params: {
  serverId: string;
  userId: string;
}): Promise<McpSecretDescriptor[]> {
  // Une erreur de lecture est une panne de contrôle d'accès, pas une absence
  // de secrets : la propager oblige l'appelant à fail-closed plutôt que de
  // découvrir/appeler un serveur sans son credential.
  const rows = await getMcpServerSecrets(params);
  const descriptors: McpSecretDescriptor[] = [];
  for (const row of rows) {
    if (!isSecretKind(row.kind)) {
      continue;
    }
    const value = decrypt(row.encryptedValue);
    if (
      !value ||
      typeof row.key !== "string" ||
      !/^[A-Za-z_][A-Za-z0-9_-]{0,127}$/.test(row.key) ||
      value.length > 16_384
    ) {
      continue;
    }
    descriptors.push({ key: row.key, kind: row.kind, value });
  }
  return descriptors;
}

export function mergeMcpSecrets(params: {
  authConfig?: unknown;
  authType?: string | null;
  env?: unknown;
  headers?: unknown;
  secrets: readonly McpSecretDescriptor[];
}): McpEffectiveConfig {
  const env = asStringRecord(params.env);
  const headers = asStringRecord(params.headers);
  const authConfig = asStringRecord(params.authConfig);
  const authType = params.authType ?? "none";

  for (const secret of params.secrets) {
    if (secret.kind === "env") {
      env[secret.key] = secret.value;
      continue;
    }
    if (secret.kind === "header") {
      headers[secret.key] = secret.value;
      continue;
    }
    // kind === "auth"
    if (authType === "basic") {
      if (secret.key === "username" || secret.key === "password") {
        authConfig[secret.key] = secret.value;
      } else {
        // Ne pas inventer un mot de passe à partir d'une clé arbitraire.
        continue;
      }
      continue;
    }
    if (authType === "custom_headers") {
      if (!/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(secret.key)) continue;
      headers[secret.key] = secret.value;
      continue;
    }
    if (
      authType === "oauth2" &&
      (secret.key === "clientId" ||
        secret.key === "clientSecret" ||
        secret.key === "tokenUrl" ||
        secret.key === "token")
    ) {
      authConfig[secret.key] = secret.value;
      continue;
    }
    if (authType === "bearer" && secret.key === "token") {
      authConfig.token = secret.value;
      continue;
    }
    // Les rédactions statiques utilisent `token`; une clé inconnue ne doit
    // pas être transformée en credential implicite.
    if (authType === "none") continue;
  }

  return { authConfig, env, headers };
}

// Indique si un serveur attend un secret qui n'a pas encore été fourni : aucune
// valeur placeholder n'existe plus, donc « requis = déclaré par le modèle ».
export function isSecretConfigured(
  secrets: readonly McpSecretDescriptor[],
  key: string
): boolean {
  return secrets.some((secret) => secret.key === key);
}

/**
 * Adapte le coffre MCP au contrat de dépendances d'un futur Plugin.
 * La résolution reste côté serveur et ne renvoie jamais la liste complète
 * des secrets au code client.
 */
export function createMcpSecretResolver(params: {
  serverId: string;
  userId: string;
}) {
  return async (request: { key: string; kind: McpSecretKind }) => {
    const secrets = await loadMcpSecretDescriptors(params).catch(() => []);
    return secrets.find(
      (secret) => secret.key === request.key && secret.kind === request.kind
    )?.value;
  };
}
