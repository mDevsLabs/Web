import "server-only";

import { setMcpServerSecrets } from "@/lib/db/queries";
import { encrypt, isEncryptionConfigured } from "./encryption";

// Écriture des secrets MCP.
//
// Historique : les routes de création/mise à jour chiffraient bien les secrets
// dans `mcp_server_secret`, MAIS inséraient aussi la charge utile brute
// (`authConfig`, `env`, `headers`) dans la ligne `McpServer` — ces colonnes JSON
// restaient donc en clair en base et repartaient telles quelles dans les
// réponses API.
//
// Désormais : les valeurs ne sont écrites QUE chiffrées, et les colonnes JSON de
// la ligne sont vidées. Si aucune clé de chiffrement n'est configurée, on refuse
// l'opération (jamais de repli en clair).

export type McpSecretKind = "env" | "auth" | "header";

const INLINE_SECRET_COLUMNS = ["authConfig", "env", "headers"] as const;

function asStringRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const out: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof raw === "string" && raw) {
      out[key] = raw;
    }
  }
  return out;
}

/** Nombre de valeurs secrètes portées par une charge utile de route. */
export function countInlineSecrets(payload: {
  authConfig?: unknown;
  env?: unknown;
  headers?: unknown;
}): number {
  return (
    Object.keys(asStringRecord(payload.env)).length +
    Object.keys(asStringRecord(payload.headers)).length +
    Object.keys(asStringRecord(payload.authConfig)).length
  );
}

/**
 * Retire les colonnes sensibles de la charge utile destinée à la ligne
 * `McpServer`. Les valeurs sont retournées à part, pour chiffrement.
 */
export function splitInlineSecrets<T extends Record<string, unknown>>(
  payload: T
): {
  row: Omit<T, "authConfig" | "env" | "headers"> &
    Partial<Pick<T, "authConfig" | "env" | "headers">>;
  values: Array<{ key: string; kind: McpSecretKind; value: string }>;
} {
  const record = { ...payload } as Record<string, unknown>;
  const values: Array<{ key: string; kind: McpSecretKind; value: string }> = [];

  const sources: Array<{ column: string; kind: McpSecretKind }> = [
    { column: "authConfig", kind: "auth" },
    { column: "env", kind: "env" },
    { column: "headers", kind: "header" },
  ];

  for (const { column, kind } of sources) {
    for (const [key, value] of Object.entries(asStringRecord(record[column]))) {
      values.push({ key, kind, value });
    }
    if (column in record) {
      // Colonne présente dans l'entrée : on la neutralise dans la ligne.
      record[column] = {};
    }
  }

  for (const column of INLINE_SECRET_COLUMNS) {
    if (column in record) {
      record[column] = {};
    }
  }

  return {
    row: record as ReturnType<typeof splitInlineSecrets<T>>["row"],
    values,
  };
}

/**
 * Chiffre puis persiste les secrets fournis en ligne. Renvoie le nombre de
 * secrets écrits. Lève `McpEncryptionConfigError` si aucune clé n'est
 * configurée et qu'il y a des valeurs à écrire : mieux vaut refuser que
 * dégrader (les appelants répondent alors une erreur explicite).
 */
export async function persistInlineMcpSecrets(params: {
  authConfig?: unknown;
  env?: unknown;
  headers?: unknown;
  serverId: string;
  userId: string;
}): Promise<number> {
  const payload = splitInlineSecrets({
    authConfig: params.authConfig,
    env: params.env,
    headers: params.headers,
  });
  if (payload.values.length === 0) {
    return 0;
  }
  if (!isEncryptionConfigured()) {
    // Import paresseux : garde l'erreur typée au même endroit que la clé.
    const { McpEncryptionConfigError } = await import("./encryption");
    throw new McpEncryptionConfigError();
  }
  await setMcpServerSecrets({
    secrets: payload.values.map((entry) => ({
      encryptedValue: encrypt(entry.value),
      key: entry.key,
      kind: entry.kind,
    })),
    serverId: params.serverId,
    userId: params.userId,
  });
  return payload.values.length;
}
