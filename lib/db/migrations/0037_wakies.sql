-- Migration 0037 - Wakies : espaces de travail, Wakies, conversations,
-- messages, pages, tâches planifiées, mémoires, appels et captures.
--
-- POURQUOI DES TABLES DÉDIÉES
--
-- Wakies (port de `apps/wakies`) avait son propre stockage : deux bases SQLite
-- (`Store` et `WorkspaceStore`) et un `ownerId` unique, parce que le gabarit
-- était mono-utilisateur. Les tables `Project`, `Agent` et `chat` de l'hôte
--existaient déjà et sont utilisées par le chat et l'Agent : y faire cohabiter un
-- second modèle (accès par espace, révision de page, baux d'exécution)
-- obligerait ces tables à porter des règles qui n'ont rien à y faire, avec le
-- risque de casser le chat ou l'Agent.
--
-- Le préfixe `Wakies` rend la frontière lisible et l'isolation vérifiable :
-- chaque ligne porte `userId` (le compte mAI), jamais l'identifiant d'un
-- propriétaire de serveur.
--
-- `WakiesSettings` est unique PAR COMPTE : les réglages du gabarit tenaient dans
-- une ligne globale, ce qui n'a pas de sens dès que plusieurs comptes
-- partagent la base.
--
-- Idempotente : `CREATE TABLE IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS` /
-- `DO $$ … EXCEPTION WHEN duplicate_object` sont rejouables sans effet de bord.

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "WakiesSettings" (
  "userId" text PRIMARY KEY NOT NULL,
  "name" varchar(40) DEFAULT 'Wakie' NOT NULL,
  "paused" boolean DEFAULT false NOT NULL,
  "researchAllowed" boolean DEFAULT true NOT NULL,
  "memoryAllowed" boolean DEFAULT true NOT NULL,
  "updatedAt" timestamptz DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "WakiesSpace" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" text NOT NULL,
  "name" varchar(60) NOT NULL,
  "description" text DEFAULT '' NOT NULL,
  "createdAt" timestamptz DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "WakiesSpace_userId_createdAt_idx"
  ON "WakiesSpace" ("userId", "createdAt");

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "WakiesWakie" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" text NOT NULL,
  "spaceId" uuid,
  "name" varchar(40) NOT NULL,
  "instructions" text DEFAULT '' NOT NULL,
  "researchAllowed" boolean DEFAULT true NOT NULL,
  "memoryAllowed" boolean DEFAULT true NOT NULL,
  "learningContainerId" text,
  "skillDeliveryEnabled" boolean DEFAULT false NOT NULL,
  "createdAt" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "WakiesWakie_spaceId_fkey"
    FOREIGN KEY ("spaceId") REFERENCES "WakiesSpace" ("id") ON DELETE CASCADE
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "WakiesWakie_spaceId_idx"
  ON "WakiesWakie" ("spaceId");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "WakiesWakie_userId_createdAt_idx"
  ON "WakiesWakie" ("userId", "createdAt");

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "WakiesWakieSpace" (
  "wakieId" uuid NOT NULL,
  "spaceId" uuid NOT NULL,
  CONSTRAINT "WakiesWakieSpace_pkey" PRIMARY KEY ("wakieId", "spaceId"),
  CONSTRAINT "WakiesWakieSpace_wakieId_fkey"
    FOREIGN KEY ("wakieId") REFERENCES "WakiesWakie" ("id") ON DELETE CASCADE,
  CONSTRAINT "WakiesWakieSpace_spaceId_fkey"
    FOREIGN KEY ("spaceId") REFERENCES "WakiesSpace" ("id") ON DELETE CASCADE
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "WakiesWakieSpace_spaceId_idx"
  ON "WakiesWakieSpace" ("spaceId");

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "WakiesConversation" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" text NOT NULL,
  "wakieId" uuid NOT NULL,
  "title" varchar(120) NOT NULL,
  "learningContainerId" text,
  "createdAt" timestamptz DEFAULT now() NOT NULL,
  "updatedAt" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "WakiesConversation_wakieId_fkey"
    FOREIGN KEY ("wakieId") REFERENCES "WakiesWakie" ("id") ON DELETE CASCADE
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "WakiesConversation_userId_createdAt_idx"
  ON "WakiesConversation" ("userId", "createdAt");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "WakiesConversation_wakieId_idx"
  ON "WakiesConversation" ("wakieId");

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "WakiesMessage" (
  "id" text PRIMARY KEY NOT NULL,
  "conversationId" uuid NOT NULL,
  "role" varchar(16) NOT NULL,
  -- Parties du protocole UI (texte, appels d'outils, approbations) : l'historique
  -- doit se rejouer à l'identique, donc la forme est stockée telle quelle.
  "parts" jsonb NOT NULL,
  -- Ordre d'écriture : deux messages d'une même salve partagent leur horodatage.
  "seq" serial NOT NULL,
  "createdAt" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "WakiesMessage_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "WakiesConversation" ("id") ON DELETE CASCADE
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "WakiesMessage_conversationId_seq_idx"
  ON "WakiesMessage" ("conversationId", "seq");

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "WakiesPage" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" text NOT NULL,
  "spaceId" uuid NOT NULL,
  "parentId" uuid,
  "title" varchar(160) NOT NULL,
  "content" text DEFAULT '' NOT NULL,
  "revision" integer DEFAULT 1 NOT NULL,
  "sourceConversationId" uuid,
  "createdAt" timestamptz DEFAULT now() NOT NULL,
  "updatedAt" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "WakiesPage_spaceId_fkey"
    FOREIGN KEY ("spaceId") REFERENCES "WakiesSpace" ("id") ON DELETE CASCADE
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "WakiesPage_parentId_idx"
  ON "WakiesPage" ("parentId");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "WakiesPage_spaceId_createdAt_idx"
  ON "WakiesPage" ("spaceId", "createdAt");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "WakiesPage_userId_idx"
  ON "WakiesPage" ("userId");

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "WakiesPageConversation" (
  "pageId" uuid NOT NULL,
  "wakieId" uuid NOT NULL,
  "conversationId" uuid NOT NULL,
  "ready" boolean DEFAULT false NOT NULL,
  -- Réservation d'une minute pendant l'initialisation : deux onglets ouverts
  -- sur la même page ne lancent pas deux conversations.
  "leaseUntil" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "WakiesPageConversation_pkey" PRIMARY KEY ("pageId", "wakieId"),
  CONSTRAINT "WakiesPageConversation_pageId_fkey"
    FOREIGN KEY ("pageId") REFERENCES "WakiesPage" ("id") ON DELETE CASCADE,
  CONSTRAINT "WakiesPageConversation_wakieId_fkey"
    FOREIGN KEY ("wakieId") REFERENCES "WakiesWakie" ("id") ON DELETE CASCADE,
  CONSTRAINT "WakiesPageConversation_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "WakiesConversation" ("id") ON DELETE CASCADE
);

--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "WakiesPageConversation_conversationId_key"
  ON "WakiesPageConversation" ("conversationId");

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "WakiesPageReview" (
  "conversationId" uuid NOT NULL,
  "toolCallId" text NOT NULL,
  "pageId" uuid NOT NULL,
  "spaceId" uuid NOT NULL,
  CONSTRAINT "WakiesPageReview_pkey" PRIMARY KEY ("conversationId", "toolCallId"),
  CONSTRAINT "WakiesPageReview_pageId_fkey"
    FOREIGN KEY ("pageId") REFERENCES "WakiesPage" ("id") ON DELETE CASCADE,
  CONSTRAINT "WakiesPageReview_spaceId_fkey"
    FOREIGN KEY ("spaceId") REFERENCES "WakiesSpace" ("id") ON DELETE CASCADE
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "WakiesTask" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" text NOT NULL,
  "prompt" text NOT NULL,
  "status" varchar(16) DEFAULT 'queued' NOT NULL,
  "intervalSeconds" integer,
  "nextRunAt" timestamptz,
  -- Bail d'exécution : le gabarit exécutait dans un `setInterval` du process
  -- Node ; ici le tick est une route cron, donc deux exécutions peuvent se
  -- croiser.
  "lease" text,
  "leaseUntil" timestamptz,
  "error" text,
  "createdAt" timestamptz DEFAULT now() NOT NULL,
  "updatedAt" timestamptz DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "WakiesTask_status_nextRunAt_idx"
  ON "WakiesTask" ("status", "nextRunAt");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "WakiesTask_userId_createdAt_idx"
  ON "WakiesTask" ("userId", "createdAt");

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "WakiesTaskRun" (
  "id" text PRIMARY KEY NOT NULL,
  "taskId" uuid NOT NULL,
  "status" varchar(16) DEFAULT 'running' NOT NULL,
  "result" jsonb,
  "error" text,
  "startedAt" timestamptz DEFAULT now() NOT NULL,
  "finishedAt" timestamptz,
  CONSTRAINT "WakiesTaskRun_taskId_fkey"
    FOREIGN KEY ("taskId") REFERENCES "WakiesTask" ("id") ON DELETE CASCADE
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "WakiesTaskRun_taskId_startedAt_idx"
  ON "WakiesTaskRun" ("taskId", "startedAt");

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "WakiesTaskEvent" (
  "id" serial PRIMARY KEY NOT NULL,
  "taskId" uuid NOT NULL,
  "runId" text,
  "text" text NOT NULL,
  "createdAt" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "WakiesTaskEvent_taskId_fkey"
    FOREIGN KEY ("taskId") REFERENCES "WakiesTask" ("id") ON DELETE CASCADE
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "WakiesTaskEvent_taskId_id_idx"
  ON "WakiesTaskEvent" ("taskId", "id");

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "WakiesTaskConversation" (
  "taskId" uuid PRIMARY KEY NOT NULL,
  "conversationId" uuid NOT NULL,
  CONSTRAINT "WakiesTaskConversation_taskId_fkey"
    FOREIGN KEY ("taskId") REFERENCES "WakiesTask" ("id") ON DELETE CASCADE,
  CONSTRAINT "WakiesTaskConversation_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "WakiesConversation" ("id") ON DELETE CASCADE
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "WakiesTaskConversation_conversationId_idx"
  ON "WakiesTaskConversation" ("conversationId");

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "WakiesMemory" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" text NOT NULL,
  "text" text NOT NULL,
  "createdAt" timestamptz DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "WakiesMemory_userId_createdAt_idx"
  ON "WakiesMemory" ("userId", "createdAt");

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "WakiesCall" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" text NOT NULL,
  "conversationId" uuid NOT NULL,
  "status" varchar(16) DEFAULT 'connecting' NOT NULL,
  "transcript" text DEFAULT '' NOT NULL,
  -- Message auquel l'appel est ancré : il s'affiche alors dans la conversation
  -- au lieu de flotter en tête de fil.
  "anchorMessageId" text,
  "error" text,
  "startedAt" timestamptz DEFAULT now() NOT NULL,
  "endedAt" timestamptz,
  CONSTRAINT "WakiesCall_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "WakiesConversation" ("id") ON DELETE CASCADE
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "WakiesCall_conversationId_startedAt_idx"
  ON "WakiesCall" ("conversationId", "startedAt");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "WakiesCall_userId_idx"
  ON "WakiesCall" ("userId");

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "WakiesCapture" (
  "conversationId" uuid PRIMARY KEY NOT NULL,
  "value" jsonb,
  "updatedAt" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "WakiesCapture_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "WakiesConversation" ("id") ON DELETE CASCADE
);