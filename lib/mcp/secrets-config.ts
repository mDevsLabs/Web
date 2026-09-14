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
    if (typeof raw === "string") {
      record[key] = raw;
    }
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
  const rows = await getMcpServerSecrets(params).catch(() => []);
  const descriptors: McpSecretDescriptor[] = [];
  for (const row of rows) {
    if (!isSecretKind(row.kind)) {
      continue;
    }
    const value = decrypt(row.encryptedValue);
    if (!value) {
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
        authConfig.password = secret.value;
      }
      continue;
    }
    if (authType === "custom_headers") {
      headers[secret.key] = secret.value;
      continue;
    }
    if (
      secret.key === "clientId" ||
      secret.key === "clientSecret" ||
      secret.key === "tokenUrl"
    ) {
      authConfig[secret.key] = secret.value;
      continue;
    }
    authConfig.token = secret.value;
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
