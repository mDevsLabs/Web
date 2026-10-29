-- Migration 0069 - conversations sécurisées : code PIN par conversation.
--
-- POURQUOI UNE TABLE DÉDIÉE
--
-- `getChatById` sérialise toute la ligne Chat dans plusieurs réponses
-- (`GET /api/chats/[id]`, `PATCH`, fork…). Un `pinHash` posé sur Chat aurait
-- fuité par ces routes sans qu'aucun appelant ne le demande. La table suit la
-- conversation : `ON DELETE CASCADE` supprime le PIN avec elle.
--
-- CE QUE LA TABLE CONTIENT
--
-- `pinHash` est le SHA-256 hexadécimal du PIN, sans sel (choix produit). Un
-- PIN de 4 à 6 chiffres a une faible entropie : la limitation des tentatives
-- côté route est la protection réelle contre l'attaque en ligne ; le hash seul
-- ne protège pas une base exfiltrée.
--
-- Les quatre colonnes `reset*` portent la réinitialisation par e-mail/OTP :
-- hash du code, expiration, compteur d'essais et date du dernier envoi. Elles
-- sont vidées après succès, changement de PIN ou suppression.
--
-- Idempotente : `CREATE TABLE IF NOT EXISTS` et contraintes ajoutées sous
-- garde sont rejouables sans effet de bord.

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ChatSecurity" (
  "chatId" uuid PRIMARY KEY NOT NULL REFERENCES "Chat"("id") ON DELETE CASCADE,
  "pinHash" text NOT NULL,
  "pinUpdatedAt" timestamptz DEFAULT now() NOT NULL,
  "resetCodeHash" text,
  "resetCodeExpiresAt" timestamptz,
  "resetAttempts" integer DEFAULT 0 NOT NULL,
  "resetLastSentAt" timestamptz,
  "createdAt" timestamptz DEFAULT now() NOT NULL
);

--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ChatSecurity_pinHash_sha256_check'
  ) THEN
    ALTER TABLE "ChatSecurity"
      ADD CONSTRAINT "ChatSecurity_pinHash_sha256_check"
      CHECK ("pinHash" ~ '^[0-9a-f]{64}$');
  END IF;
END $$;

--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ChatSecurity_resetCodeHash_sha256_check'
  ) THEN
    ALTER TABLE "ChatSecurity"
      ADD CONSTRAINT "ChatSecurity_resetCodeHash_sha256_check"
      CHECK ("resetCodeHash" IS NULL OR "resetCodeHash" ~ '^[0-9a-f]{64}$');
  END IF;
END $$;

--> statement-breakpoint
COMMENT ON TABLE "ChatSecurity" IS
  'Code PIN des conversations sécurisées mAI. Une conversation privée ne doit jamais conserver de ligne ici.';
COMMENT ON COLUMN "ChatSecurity"."pinHash" IS
  'SHA-256 hexadécimal du PIN (4 à 6 chiffres). Jamais exposé par l''API.';
COMMENT ON COLUMN "ChatSecurity"."pinUpdatedAt" IS
  'Version du PIN ; invalide les cookies de déverrouillage antérieurs.';
COMMENT ON COLUMN "ChatSecurity"."resetCodeHash" IS
  'SHA-256 hexadécimal du code OTP de réinitialisation (chatId:code).';
