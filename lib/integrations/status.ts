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
 *
 * Elle porte aussi les NOMS des variables manquantes. C'est une information de
 * diagnostic, pas un secret : sans elle, une instance mal configurée affiche
 * une fiche sans bouton et l'administrateur n'a aucun moyen de savoir laquelle
 * des deux variables OAuth manque. Les valeurs, elles, ne sortent jamais.
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
  /** Variables dont l'absence empêche la connexion (noms uniquement). */
  missingEnv: string[];
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
  /**
   * Variables de capacité absentes. Elles ne
   * bloquent pas le consentement, mais privent certains outils de leur sens :
   * la fiche les annonce avant le premier appel.
   */
  warnings: string[];
};

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

/** Variables requises pour qu'un connecteur OAuth puisse seulement démarrer. */
function missingEnvFor(descriptor: IntegrationDescriptor): string[] {
  if (descriptor.authMode !== "oauth") {
    return [];
  }
  const missing: string[] = [];
  if (!readEnv(`${descriptor.envPrefix}_CLIENT_ID`)) {
    missing.push(`${descriptor.envPrefix}_CLIENT_ID`);
  }
  if (!readEnv(`${descriptor.envPrefix}_CLIENT_SECRET`)) {
    missing.push(`${descriptor.envPrefix}_CLIENT_SECRET`);
  }
  return missing;
}

function warningsFor(descriptor: IntegrationDescriptor): string[] {
  return (descriptor.extraEnv ?? [])
    .filter((name) => !readEnv(name))
    .map(
      (name) =>
        `Variable ${name} absente : les outils de ce connecteur qui en dépendent resteront indisponibles.`
    );
}

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
    missingEnv: missingEnvFor(descriptor),
    needsReconnect: expiresAt ? expiresAt.getTime() < Date.now() : false,
    pluginId: descriptor.pluginId,
    provider: descriptor.id,
    scopes: (row?.scopes ?? "").split(/[\s,]+/).filter(Boolean),
    vaultConfigured: isEncryptionConfigured(),
    warnings: warningsFor(descriptor),
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
      descriptor.authMode === "token" || readCredentials(descriptor) !== null
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
    descriptor.authMode === "token" || readCredentials(descriptor) !== null
  );
}
