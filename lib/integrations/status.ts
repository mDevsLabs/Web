import "server-only";

import type { IntegrationConnection } from "@/lib/db/schema";
import { isEncryptionConfigured } from "@/lib/mcp/encryption";
import { readCredentials } from "./oauth";
import {
  getIntegrationProvider,
  hasWriteScope,
  INTEGRATION_PROVIDERS,
  type IntegrationDescriptor,
  type IntegrationProviderId,
} from "./providers";
import { listActiveConnections } from "./repository";

/**
 * Projection sûre des connexions, destinée à l'interface (onglet Plugins, menu
 * `@`, Wakies). Elle ne renvoie jamais un jeton, chiffré ou non : la carte
 * « Connecté » n'a besoin que du compte, des portées et de l'échéance — et le
 * menu `@` interroge cette liste à chaque frappe.
 */

export type IntegrationStatus = {
  /** Les identifiants OAuth du fournisseur sont-ils présents dans l'environnement ? */
  configured: boolean;
  connected: boolean;
  accountEmail: string | null;
  accountLabel: string | null;
  /** Les outils d'écriture du connecteur sont-ils couverts par le consentement ? */
  canWrite: boolean;
  expiresAt: string | null;
  /** Le porteur d'accès est déjà expiré : reconnecter plutôt qu'appeler en 401. */
  needsReconnect: boolean;
  pluginId: string;
  provider: IntegrationProviderId;
  scopes: string[];
  /**
   * Le coffre de secrets est-il configuré sur cette instance ?
   *
   * Sans `MCP_ENCRYPTION_KEY`, aucun jeton ne peut être scellé ni stocké : la
   * connexion est refusée en amont (`vault_unconfigured`). L'exposer évite un
   * échec opaque au moment où l'utilisateur clique sur « Connecter » — l'écran
   * peut dire que l'instance n'est pas prête, au lieu de renvoyer un toast
   * d'erreur que personne ne sait corriger.
   */
  vaultConfigured: boolean;
};

function project(
  descriptor: IntegrationDescriptor,
  row: IntegrationConnection | undefined,
  configured: boolean
): IntegrationStatus {
  const expiresAt = row?.expiresAt ?? null;
  return {
    accountEmail: row?.accountEmail ?? null,
    accountLabel: row?.accountLabel ?? null,
    canWrite: row ? hasWriteScope(descriptor, row.scopes) : false,
    configured,
    connected: Boolean(row),
    expiresAt: expiresAt ? expiresAt.toISOString() : null,
    needsReconnect: expiresAt ? expiresAt.getTime() < Date.now() : false,
    pluginId: descriptor.pluginId,
    provider: descriptor.id,
    scopes: (row?.scopes ?? "").split(/[\s,]+/).filter(Boolean),
    vaultConfigured: isEncryptionConfigured(),
  };
}

export async function listIntegrationStatuses(params: {
  userId: string;
}): Promise<IntegrationStatus[]> {
  const rows = await listActiveConnections({ userId: params.userId });
  return INTEGRATION_PROVIDERS.map((descriptor) =>
    project(
      descriptor,
      rows.find((row) => row.provider === descriptor.id),
      readCredentials(descriptor) !== null
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
    rows.find((row) => row.provider === descriptor.id),
    readCredentials(descriptor) !== null
  );
}
