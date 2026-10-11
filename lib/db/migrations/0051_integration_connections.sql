-- Migration 0051 : connexions OAuth aux applications externes (Google Drive,
-- Agenda, Gmail, GitHub). Les jetons sont stockés chiffrés ; les colonnes en
-- clair (provider, scopes, expiresAt, compte) portent l'affichage de la carte
-- « Connecté » et la décision de rafraîchir, prise à chaque appel d'outil —
-- les chiffrer obligerait à ouvrir le coffre sur le chemin chaud.
-- Idempotente : sûre à rejouer sur une base déjà migrée.

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "IntegrationConnection" (
  "id" uuid PRIMARY KEY NOT NULL,
  "userId" text NOT NULL,
  "provider" varchar(32) NOT NULL,
  "providerAccountId" text NOT NULL,
  "accountEmail" text,
  "accountLabel" text,
  "accessToken" text NOT NULL,
  "refreshToken" text,
  "scopes" text DEFAULT '' NOT NULL,
  "expiresAt" timestamp,
  "lastRefreshedAt" timestamp,
  "isPrimary" boolean DEFAULT true NOT NULL,
  "revokedAt" timestamp,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "IntegrationConnection_userId_provider_accountId_key"
    UNIQUE ("userId", "provider", "providerAccountId")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IntegrationConnection_userId_provider_idx" ON "IntegrationConnection" ("userId", "provider");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IntegrationConnection_userId_idx" ON "IntegrationConnection" ("userId");
