import "server-only";

import type { IntegrationConnection } from "@/lib/db/schema";
import { isEncryptionConfigured } from "@/lib/mcp/encryption";
import {
  getIntegrationProvider,
  INTEGRATION_PROVIDERS,
  type IntegrationDescriptor,
  type IntegrationProviderId,
} from "./providers";
import { listActiveConnections } from "./repository";

/**
 * Projection sûre des connexions, destinée à l'interface (onglet Plugins, menu
 * `@`, Wakies). Elle ne renvoie jamais un jeton, chiffré ou non.
 */

export type IntegrationStatus = {
  configured: boolean;
  connected: boolean;
  accountEmail: string | null;
  accountLabel: string | null;
  canWrite: boolean;
  expiresAt: string | null;
  missingEnv: string[];
  needsReconnect: boolean;
  pluginId: string;
  provider: IntegrationProviderId;
  scopes: string[];
  vaultConfigured: boolean;
  warnings: string[];
};

function project(
  descriptor: IntegrationDescriptor,
  row: IntegrationConnection | undefined
): IntegrationStatus {
  const expiresAt = row?.expiresAt ?? null;
  return {
    accountEmail: row?.accountEmail ?? null,
    accountLabel: row?.accountLabel ?? null,
    canWrite: Boolean(row),
    configured: true,
    connected: Boolean(row),
    expiresAt: expiresAt ? expiresAt.toISOString() : null,
    missingEnv: [],
    needsReconnect: expiresAt ? expiresAt.getTime() < Date.now() : false,
    pluginId: descriptor.pluginId,
    provider: descriptor.id,
    scopes: [],
    vaultConfigured: isEncryptionConfigured(),
    warnings: [],
  };
}

export async function listIntegrationStatuses(params: {
  userId: string;
}): Promise<IntegrationStatus[]> {
  const rows = await listActiveConnections({ userId: params.userId });
  return INTEGRATION_PROVIDERS.map((descriptor) =>
    project(
      descriptor,
      rows.find((row) => row.provider === descriptor.id)
    )
  );
}

export async function getIntegrationStatus(params: {
  provider: IntegrationProviderId;
  userId: string;
}): Promise<IntegrationStatus | null> {
  const descriptor = getIntegrationProvider(params.provider);
  if (!descriptor) {
    return null;
  }
  const rows = await listActiveConnections({ userId: params.userId });
  return project(
    descriptor,
    rows.find((row) => row.provider === descriptor.id)
  );
}
