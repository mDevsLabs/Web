-- Migration: UserMemory (mémoire personnalisée globale / par agent / par projet) + Agent.memoryMode
-- Idempotent: uses IF NOT EXISTS / DO blocks

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "UserMemory" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" text NOT NULL,
  "agentId" uuid REFERENCES "Agent"("id") ON DELETE CASCADE,
  "projectId" uuid REFERENCES "Project"("id") ON DELETE CASCADE,
  "content" text NOT NULL CHECK (char_length("content") > 0 AND char_length("content") <= 2000),
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "UserMemory_scope_check" CHECK (NOT ("agentId" IS NOT NULL AND "projectId" IS NOT NULL))
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "UserMemory_userId_idx" ON "UserMemory" USING btree ("userId");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "UserMemory_agentId_idx" ON "UserMemory" USING btree ("agentId");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "UserMemory_projectId_idx" ON "UserMemory" USING btree ("projectId");

--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Agent' AND column_name='memoryMode') THEN
  ALTER TABLE "Agent" ADD COLUMN "memoryMode" varchar(10) DEFAULT 'global' NOT NULL;
END IF; END $$;

--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='Agent_memoryMode_check' AND table_name='Agent') THEN
  ALTER TABLE "Agent" ADD CONSTRAINT "Agent_memoryMode_check" CHECK ("memoryMode" IN ('global','custom'));
END IF; END $$;

--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='users') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='ghost_memory_enabled') THEN
      ALTER TABLE "users" ADD COLUMN "ghost_memory_enabled" boolean DEFAULT false NOT NULL;
    END IF;
  END IF;
END $$;
