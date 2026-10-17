import "server-only";

import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/queries";
import {
  type IntegrationConnection,
  integrationConnection,
} from "@/lib/db/schema";
import { decrypt, encrypt } from "@/lib/mcp/encryption";
import type { IntegrationProviderId } from "./providers";

/**
 * Dépôt des connexions externes.
 *
 * Le format au repos n'appartient qu'à ce module : il chiffre à l'écriture et
 * déchiffre à la lecture, pour qu'un appelant ne puisse jamais stocker un jeton
 * en clair par oubli, ni croire qu'une colonne vide est un jeton valide.
 *
 * `decrypt()` renvoie `""` au lieu de lever (choix de `lib/mcp/encryption.ts`) :
 * une valeur indéchiffrable — rotation de clé sans trousseau, ligne corrompue —
 * est ici traitée comme une connexion révoquée, jamais comme un bearer vide.
 */

export type StorableConnection = {
  accessToken: string;
  accountEmail: string | null;
  accountLabel: string | null;
  expiresAt: Date | null;
  provider: IntegrationProviderId;
  providerAccountId: string;
  refreshToken: string | null;
  scopes: string;
  userId: string;
};

/** Insertion, ou re-consentement sur la même ligne : jamais de doublon pour un même compte. */
export async function storeConnection(
  params: StorableConnection
): Promise<IntegrationConnection | undefined> {
  const database = await getDb();
  const now = new Date();
  const [row] = await database
    .insert(integrationConnection)
    .values({
      accessToken: encrypt(params.accessToken),
      accountEmail: params.accountEmail,
      accountLabel: params.accountLabel,
      createdAt: now,
      expiresAt: params.expiresAt,
      isPrimary: true,
      lastRefreshedAt: null,
      provider: params.provider,
      providerAccountId: params.providerAccountId,
      refreshToken: params.refreshToken ? encrypt(params.refreshToken) : null,
      // Reconnecter un compte précédemment déconnecté le réactive : l'histoire
      // de la ligne reste, son drapeau de révocation repart.
      revokedAt: null,
      scopes: params.scopes,
      updatedAt: now,
      userId: params.userId,
    })
    .onConflictDoUpdate({
      set: {
        accessToken: encrypt(params.accessToken),
        accountEmail: params.accountEmail,
        accountLabel: params.accountLabel,
        expiresAt: params.expiresAt,
        isPrimary: true,
        refreshToken: params.refreshToken ? encrypt(params.refreshToken) : null,
        revokedAt: null,
        scopes: params.scopes,
        updatedAt: now,
      },
      target: [
        integrationConnection.userId,
        integrationConnection.provider,
        integrationConnection.providerAccountId,
      ],
    })
    .returning();
  return row;
}

/**
 * Connexion de travail d'un compte pour un fournisseur. L'ordre est celui qui
 * rend l'absence d'`isPrimary` rattrapable : la connexion explicite passe avant
 * la plus ancienne.
 */
export async function getPrimaryConnection(params: {
  provider: IntegrationProviderId;
  userId: string;
}): Promise<IntegrationConnection | null> {
  const database = await getDb();
  const [row] = await database
    .select()
    .from(integrationConnection)
    .where(
      and(
        eq(integrationConnection.userId, params.userId),
        eq(integrationConnection.provider, params.provider),
        isNull(integrationConnection.revokedAt)
      )
    )
    .orderBy(
      desc(integrationConnection.isPrimary),
      integrationConnection.createdAt
    )
    .limit(1);
  return row ?? null;
}

export async function listActiveConnections(params: {
  userId: string;
}): Promise<IntegrationConnection[]> {
  const database = await getDb();
  return await database
    .select()
    .from(integrationConnection)
    .where(
      and(
        eq(integrationConnection.userId, params.userId),
        isNull(integrationConnection.revokedAt)
      )
    )
    .orderBy(integrationConnection.provider);
}

/** Le porteur en clair, ou `null` si la ligne n'est plus utilisable. */
export function readAccessToken(row: IntegrationConnection): string | null {
  return decrypt(row.accessToken) || null;
}

export function readRefreshToken(row: IntegrationConnection): string | null {
  if (!row.refreshToken) {
    return null;
  }
  return decrypt(row.refreshToken) || null;
}

/**
 * Écriture conditionnelle : la mise à jour ne s'applique que si le jeton stocké
 * est toujours celui dont on est parti. Sans cette comparaison, deux rafraîchis
 * simultanés perdraient l'un des deux `refresh_token` tournants de Google — et
 * la connexion avec.
 */
export async function persistRefreshedTokens(params: {
  accessToken: string;
  connectionId: string;
  expectedAccessToken: string;
  expiresAt: Date | null;
  refreshToken: string | null;
  scopes: string;
}): Promise<boolean> {
  const database = await getDb();
  const now = new Date();
  const rows = await database
    .update(integrationConnection)
    .set({
      accessToken: encrypt(params.accessToken),
      expiresAt: params.expiresAt,
      lastRefreshedAt: now,
      refreshToken: params.refreshToken ? encrypt(params.refreshToken) : null,
      scopes: params.scopes,
      updatedAt: now,
    })
    .where(
      and(
        eq(integrationConnection.id, params.connectionId),
        sql`${integrationConnection.accessToken} = ${params.expectedAccessToken}`
      )
    )
    .returning({ id: integrationConnection.id });
  return rows.length > 0;
}

/** Déconnexion : la ligne survit sans jeton exploitable, pour que « Connecté » ne revienne pas tout seul. */
export async function markConnectionRevoked(params: {
  connectionId: string;
  userId: string;
}): Promise<boolean> {
  const database = await getDb();
  const now = new Date();
  const rows = await database
    .update(integrationConnection)
    .set({
      // Un jeton invalide ne doit plus jamais pouvoir être lu, même si la clé
      // du coffre change : on remplace la valeur chiffrée par une marque vide.
      accessToken: "",
      refreshToken: null,
      revokedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(integrationConnection.id, params.connectionId),
        eq(integrationConnection.userId, params.userId)
      )
    )
    .returning({ id: integrationConnection.id });
  return rows.length > 0;
}
