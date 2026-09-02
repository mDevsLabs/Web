import "server-only";
import "dotenv/config";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  isNull,
  lte,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { ArtifactKind } from "@/components/chat/artifact";
import type { VisibilityType } from "@/components/chat/visibility-selector";
import { MEMORY_CONTENT_MAX_LENGTH } from "../constants";
import { ChatbotError } from "../errors";
import {
  agent,
  agentTemplate,
  type Chat,
  chat,
  customCommand,
  type DBMessage,
  document,
  mcpLog,
  mcpServer,
  mcpServerSecret,
  mcpTemplate,
  message,
  project,
  type Suggestion,
  skill,
  type Skill,
  skillTemplate,
  skillUsage,
  skillVersion,
  stream,
  suggestion,
  userMcpPrefs,
  userMemory,
  scheduledMessage,
  type ScheduledMessage,
  vote,
} from "./schema";

let _db: ReturnType<typeof drizzle> | null = null;
let _migrationRan = false;

async function ensureTableTypes(client: ReturnType<typeof postgres>) {
  if (_migrationRan) {
    return;
  }
  _migrationRan = true;

  // Neon pooler: chaque instruction doit être dans une requête séparée
  const run = async (query: Promise<unknown>) => {
    try {
      await query;
    } catch {
      /* ignorer les erreurs (déjà existant, etc.) */
    }
  };

  // Création des tables une par une
  await run(client`CREATE TABLE IF NOT EXISTS "User" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "email" varchar(64) NOT NULL,
    "password" varchar(64),
    "name" text,
    "emailVerified" boolean NOT NULL DEFAULT false,
    "image" text,
    "isAnonymous" boolean NOT NULL DEFAULT false,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
  )`);

  await run(client`CREATE TABLE IF NOT EXISTS "Chat" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "title" text NOT NULL DEFAULT 'Nouvelle discussion',
    "userId" text NOT NULL,
    "visibility" varchar NOT NULL DEFAULT 'private'
  )`);

  await run(client`CREATE TABLE IF NOT EXISTS "Message_v2" (
    "id" text PRIMARY KEY NOT NULL,
    "chatId" uuid NOT NULL,
    "role" varchar NOT NULL,
    "parts" json NOT NULL,
    "attachments" json NOT NULL DEFAULT '[]'::json,
    "createdAt" timestamp NOT NULL DEFAULT now()
  )`);

  await run(client`CREATE TABLE IF NOT EXISTS "Vote_v2" (
    "chatId" uuid NOT NULL,
    "messageId" text NOT NULL,
    "isUpvoted" boolean NOT NULL,
    PRIMARY KEY ("chatId", "messageId")
  )`);

  await run(client`CREATE TABLE IF NOT EXISTS "Document" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "title" text NOT NULL,
    "content" text,
    "text" varchar NOT NULL DEFAULT 'text',
    "userId" text NOT NULL,
    PRIMARY KEY ("id", "createdAt")
  )`);

  await run(client`CREATE TABLE IF NOT EXISTS "Suggestion" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "documentId" uuid NOT NULL,
    "documentCreatedAt" timestamp NOT NULL,
    "originalText" text NOT NULL,
    "suggestedText" text NOT NULL,
    "description" text,
    "isResolved" boolean NOT NULL DEFAULT false,
    "userId" text NOT NULL,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
  )`);

  await run(client`CREATE TABLE IF NOT EXISTS "Stream" (
    "id" text PRIMARY KEY NOT NULL,
    "chatId" uuid NOT NULL,
    "createdAt" timestamp NOT NULL DEFAULT now()
  )`);

  await run(client`CREATE TABLE IF NOT EXISTS "Project" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "userId" text NOT NULL,
    "name" text NOT NULL,
    "description" text DEFAULT '',
    "icon" text DEFAULT 'folder',
    "color" varchar(7) DEFAULT '#6366f1',
    "isArchived" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
  )`);

  await run(client`CREATE TABLE IF NOT EXISTS "token_blacklist" (
    "token" text PRIMARY KEY NOT NULL,
    "revoked_at" timestamp DEFAULT now() NOT NULL,
    "expires_at" timestamp DEFAULT now() NOT NULL
  )`);

  await run(client`CREATE TABLE IF NOT EXISTS "user_totp" (
    "user_id" text PRIMARY KEY NOT NULL,
    "secret" text NOT NULL,
    "verified" boolean DEFAULT false NOT NULL,
    "backup_codes" text[] DEFAULT '{}' NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "verified_at" timestamp
  )`);

  await run(client`CREATE TABLE IF NOT EXISTS "weekly_speech_usage" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL,
    "week_start" date NOT NULL,
    "tokens_used" bigint DEFAULT 0 NOT NULL,
    "requests_count" integer DEFAULT 0 NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT weekly_speech_usage_user_week_unique UNIQUE ("user_id", "week_start")
  )`);

  await run(client`CREATE TABLE IF NOT EXISTS "mprojects_speech_generations" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" text NOT NULL,
    "api_key" text,
    "title" text,
    "pinned" boolean DEFAULT false NOT NULL,
    "model" text DEFAULT 'deepgram/flux-tts:free' NOT NULL,
    "voice" text DEFAULT 'flux-alexis-en',
    "input_text" text NOT NULL,
    "audio_url" text,
    "tokens_count" integer DEFAULT 0 NOT NULL,
    "character_count" integer DEFAULT 0 NOT NULL,
    "status" text DEFAULT 'completed' NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
  )`);

  await run(
    client`ALTER TABLE "mprojects_speech_generations" ADD COLUMN IF NOT EXISTS "audio_url" text`
  );
  await run(
    client`ALTER TABLE "mprojects_speech_generations" ADD COLUMN IF NOT EXISTS "title" text`
  );
  await run(
    client`ALTER TABLE "mprojects_speech_generations" ADD COLUMN IF NOT EXISTS "pinned" boolean DEFAULT false NOT NULL`
  );

  await run(client`CREATE TABLE IF NOT EXISTS "mprojects_image_generations" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" text NOT NULL,
    "api_key" text,
    "title" text,
    "pinned" boolean DEFAULT false NOT NULL,
    "model" text NOT NULL DEFAULT 'black-forest-labs/flux-schnell',
    "prompt" text NOT NULL,
    "negative_prompt" text,
    "width" integer DEFAULT 1024 NOT NULL,
    "height" integer DEFAULT 1024 NOT NULL,
    "image_url" text NOT NULL,
    "status" text DEFAULT 'completed' NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
  )`);

  await run(
    client`ALTER TABLE "mprojects_image_generations" ADD COLUMN IF NOT EXISTS "title" text`
  );
  await run(
    client`ALTER TABLE "mprojects_image_generations" ADD COLUMN IF NOT EXISTS "pinned" boolean DEFAULT false NOT NULL`
  );

  // Table users pour les préférences et profil utilisateur
  await run(client`CREATE TABLE IF NOT EXISTS "users" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "email" varchar(255),
    "username" varchar(255),
    "password_hash" text,
    "phone" varchar(50),
    "avatar_url" text,
    "tier" varchar(50) DEFAULT 'Free',
    "custom_instructions" text DEFAULT '',
    "custom_instructions_enabled" boolean DEFAULT false NOT NULL,
    "default_temperature" double precision DEFAULT 0.7,
    "default_top_p" double precision DEFAULT 0.9,
    "default_agent_id" uuid,
    "default_chat_model" text,
    "default_chat_visibility" varchar(10) DEFAULT 'private',
    "default_image_model" text DEFAULT 'black-forest-labs/flux-schnell',
    "default_image_size" varchar(20) DEFAULT '1024x1024',
    "default_audio_model" text DEFAULT 'deepgram/flux-tts:free',
    "default_audio_voice" varchar(50) DEFAULT 'flux-alexis-en',
    "default_audio_speed" double precision DEFAULT 1.0,
    "ghost_memory_enabled" boolean DEFAULT false NOT NULL,
    "show_agent_chat_icons" boolean DEFAULT true NOT NULL,
    "newsletter" boolean DEFAULT false NOT NULL,
    "notify_limits" boolean DEFAULT true NOT NULL,
    "is_blocked" boolean DEFAULT false NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
  )`);

  // Colonnes préférences pour table users
  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email" varchar(255)`
  );
  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "username" varchar(255)`
  );
  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" text`
  );
  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" varchar(50)`
  );
  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_url" text`
  );
  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "tier" varchar(50) DEFAULT 'Free'`
  );
  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "custom_instructions" text DEFAULT ''`
  );
  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "custom_instructions_enabled" boolean DEFAULT false NOT NULL`
  );
  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "default_temperature" double precision DEFAULT 0.7`
  );
  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "default_top_p" double precision DEFAULT 0.9`
  );
  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "default_image_model" text DEFAULT 'black-forest-labs/flux-schnell'`
  );
  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "default_image_size" varchar(20) DEFAULT '1024x1024'`
  );
  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "default_audio_model" text DEFAULT 'deepgram/flux-tts:free'`
  );
  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "default_audio_voice" varchar(50) DEFAULT 'flux-alexis-en'`
  );
  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "default_audio_speed" double precision DEFAULT 1.0`
  );
  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "default_chat_model" text`
  );
  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "default_chat_visibility" varchar(20) DEFAULT 'private'`
  );
  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "default_agent_id" uuid`
  );
  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ghost_memory_enabled" boolean DEFAULT false NOT NULL`
  );
  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "show_agent_chat_icons" boolean DEFAULT true NOT NULL`
  );

  // Table dédiée ultra-robuste pour les préférences IA utilisateur (clé primaire text userId)
  await run(client`CREATE TABLE IF NOT EXISTS "user_preferences" (
    "userId" text PRIMARY KEY NOT NULL,
    "customInstructions" text DEFAULT '' NOT NULL,
    "customInstructionsEnabled" boolean DEFAULT false NOT NULL,
    "defaultTemperature" double precision DEFAULT 0.7 NOT NULL,
    "defaultTopP" double precision DEFAULT 0.9 NOT NULL,
    "defaultAgentId" uuid,
    "defaultChatModel" text,
    "defaultChatVisibility" varchar(20) DEFAULT 'private' NOT NULL,
    "defaultImageModel" text DEFAULT 'black-forest-labs/flux-schnell' NOT NULL,
    "defaultImageSize" varchar(50) DEFAULT '1024x1024' NOT NULL,
    "defaultAudioModel" text DEFAULT 'deepgram/flux-tts:free' NOT NULL,
    "defaultAudioVoice" varchar(100) DEFAULT 'flux-alexis-en' NOT NULL,
    "defaultAudioSpeed" double precision DEFAULT 1.0 NOT NULL,
    "ghostMemoryEnabled" boolean DEFAULT false NOT NULL,
    "showAgentChatIcons" boolean DEFAULT true NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
  )`);

  await run(
    client`ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "customInstructions" text DEFAULT '' NOT NULL`
  );
  await run(
    client`ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "customInstructionsEnabled" boolean DEFAULT false NOT NULL`
  );
  await run(
    client`ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "defaultTemperature" double precision DEFAULT 0.7 NOT NULL`
  );
  await run(
    client`ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "defaultTopP" double precision DEFAULT 0.9 NOT NULL`
  );
  await run(
    client`ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "defaultAgentId" uuid`
  );
  await run(
    client`ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "defaultChatModel" text`
  );
  await run(
    client`ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "defaultChatVisibility" varchar(20) DEFAULT 'private' NOT NULL`
  );
  await run(
    client`ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "defaultImageModel" text DEFAULT 'black-forest-labs/flux-schnell' NOT NULL`
  );
  await run(
    client`ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "defaultImageSize" varchar(50) DEFAULT '1024x1024' NOT NULL`
  );
  await run(
    client`ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "defaultAudioModel" text DEFAULT 'deepgram/flux-tts:free' NOT NULL`
  );
  await run(
    client`ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "defaultAudioVoice" varchar(100) DEFAULT 'flux-alexis-en' NOT NULL`
  );
  await run(
    client`ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "defaultAudioSpeed" double precision DEFAULT 1.0 NOT NULL`
  );
  await run(
    client`ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "ghostMemoryEnabled" boolean DEFAULT false NOT NULL`
  );
  await run(
    client`ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "showAgentChatIcons" boolean DEFAULT true NOT NULL`
  );
  await run(
    client`ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp DEFAULT now() NOT NULL`
  );

  // Tables Skills et MCP
  await run(client`CREATE TABLE IF NOT EXISTS "Skill" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "userId" text NOT NULL,
    "name" text NOT NULL,
    "description" text DEFAULT '',
    "instructions" text NOT NULL DEFAULT '',
    "icon" text DEFAULT 'sparkles',
    "color" varchar(7) DEFAULT '#6366f1',
    "tools" json DEFAULT '[]'::json NOT NULL,
    "parameters" json DEFAULT '[]'::json NOT NULL,
    "pinned" boolean DEFAULT false NOT NULL,
    "isPublic" boolean DEFAULT false NOT NULL,
    "shareId" text,
    "tags" text[] DEFAULT '{}'::text[] NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
  )`);
  await run(client`ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "skillId" uuid`);
  await run(
    client`ALTER TABLE "Skill" ADD COLUMN IF NOT EXISTS "pinned" boolean DEFAULT false NOT NULL`
  );

  await run(client`CREATE TABLE IF NOT EXISTS "McpServer" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "userId" text NOT NULL,
    "name" text NOT NULL,
    "description" text DEFAULT '',
    "icon" text DEFAULT 'server',
    "transport" varchar NOT NULL DEFAULT 'sse',
    "url" text,
    "command" text,
    "args" json DEFAULT '[]'::json NOT NULL,
    "env" json DEFAULT '{}'::json NOT NULL,
    "authType" varchar NOT NULL DEFAULT 'none',
    "authConfig" json DEFAULT '{}'::json NOT NULL,
    "headers" json DEFAULT '{}'::json NOT NULL,
    "isEnabled" boolean DEFAULT true NOT NULL,
    "requireApproval" varchar NOT NULL DEFAULT 'write_only',
    "toolsCache" json DEFAULT '[]'::json NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
  )`);

  await run(client`CREATE TABLE IF NOT EXISTS "McpLog" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "userId" text NOT NULL,
    "serverId" uuid,
    "serverName" text NOT NULL,
    "toolName" text NOT NULL,
    "chatId" uuid,
    "actionType" varchar NOT NULL DEFAULT 'read',
    "approvalStatus" varchar NOT NULL DEFAULT 'auto_approved',
    "inputPayload" json,
    "outputPayload" json,
    "error" text,
    "durationMs" integer DEFAULT 0,
    "createdAt" timestamp DEFAULT now() NOT NULL
  )`);

  // Migrations de colonnes (supprimer contraintes FK, caster vers text)
  await run(
    client`ALTER TABLE "Chat" DROP CONSTRAINT IF EXISTS "Chat_userId_fkey" CASCADE`
  );
  await run(
    client`ALTER TABLE "Chat" DROP CONSTRAINT IF EXISTS "Chat_userId_User_id_fk" CASCADE`
  );
  await run(
    client`ALTER TABLE "Chat" ALTER COLUMN "userId" TYPE text USING "userId"::text`
  );

  await run(
    client`ALTER TABLE "Document" DROP CONSTRAINT IF EXISTS "Document_userId_fkey" CASCADE`
  );
  await run(
    client`ALTER TABLE "Document" DROP CONSTRAINT IF EXISTS "Document_userId_User_id_fk" CASCADE`
  );
  await run(
    client`ALTER TABLE "Document" ALTER COLUMN "userId" TYPE text USING "userId"::text`
  );

  await run(
    client`ALTER TABLE "Suggestion" DROP CONSTRAINT IF EXISTS "Suggestion_userId_fkey" CASCADE`
  );
  await run(
    client`ALTER TABLE "Suggestion" DROP CONSTRAINT IF EXISTS "Suggestion_userId_User_id_fk" CASCADE`
  );
  await run(
    client`ALTER TABLE "Suggestion" ALTER COLUMN "userId" TYPE text USING "userId"::text`
  );

  await run(
    client`ALTER TABLE "Message_v2" DROP CONSTRAINT IF EXISTS "Message_v2_chatId_fkey" CASCADE`
  );
  await run(
    client`ALTER TABLE "Message_v2" ALTER COLUMN "id" TYPE text USING "id"::text`
  );

  await run(
    client`ALTER TABLE "Vote_v2" DROP CONSTRAINT IF EXISTS "Vote_v2_messageId_fkey" CASCADE`
  );
  await run(
    client`ALTER TABLE "Vote_v2" ALTER COLUMN "messageId" TYPE text USING "messageId"::text`
  );

  await run(
    client`ALTER TABLE "Stream" ALTER COLUMN "id" TYPE text USING "id"::text`
  );

  // Colonnes étendues pour Chat
  await run(
    client`ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "projectId" uuid REFERENCES "Project"("id") ON DELETE SET NULL`
  );
  await run(
    client`ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "isArchived" boolean DEFAULT false NOT NULL`
  );
  await run(
    client`ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "archivedAt" timestamp`
  );
  await run(
    client`ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "pinned" boolean DEFAULT false NOT NULL`
  );
  await run(
    client`ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "tags" text[] DEFAULT '{}' NOT NULL`
  );
  await run(
    client`ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "customInstructions" text`
  );
  await run(
    client`ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "temperatureOverride" double precision`
  );
  await run(client`ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "agentId" uuid`);
  await run(client`ALTER TABLE "Chat" DROP COLUMN IF EXISTS "modeId"`);

  // Colonnes étendues pour Project
  await run(
    client`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "customInstructions" text`
  );
  await run(
    client`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "defaultModel" text`
  );
  await run(
    client`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "description" text DEFAULT ''`
  );
  await run(
    client`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "icon" text DEFAULT 'folder'`
  );
  await run(
    client`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "color" varchar(7) DEFAULT '#6366f1'`
  );
  await run(
    client`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "isArchived" boolean DEFAULT false NOT NULL`
  );

  // Index de performance
  await run(
    client`CREATE INDEX IF NOT EXISTS "Chat_projectId_idx" ON "Chat" USING btree ("projectId")`
  );
  await run(
    client`CREATE INDEX IF NOT EXISTS "Chat_userId_isArchived_idx" ON "Chat" USING btree ("userId", "isArchived")`
  );
  await run(
    client`CREATE INDEX IF NOT EXISTS "Chat_userId_createdAt_desc_idx" ON "Chat" USING btree ("userId", "createdAt" DESC)`
  );
  await run(
    client`CREATE INDEX IF NOT EXISTS "Chat_userId_pinned_idx" ON "Chat" USING btree ("userId", "pinned")`
  );
  await run(
    client`CREATE INDEX IF NOT EXISTS "Chat_userId_projectId_idx" ON "Chat" USING btree ("userId", "projectId")`
  );
  await run(
    client`CREATE INDEX IF NOT EXISTS "Project_userId_idx" ON "Project" USING btree ("userId")`
  );
  await run(
    client`CREATE INDEX IF NOT EXISTS "Project_userId_createdAt_idx" ON "Project" USING btree ("userId", "createdAt" DESC)`
  );
  await run(
    client`CREATE INDEX IF NOT EXISTS "weekly_speech_usage_user_id_idx" ON "weekly_speech_usage" USING btree ("user_id")`
  );
  await run(
    client`CREATE INDEX IF NOT EXISTS "weekly_speech_usage_week_start_idx" ON "weekly_speech_usage" USING btree ("week_start")`
  );
  await run(
    client`CREATE INDEX IF NOT EXISTS "mprojects_speech_generations_user_id_idx" ON "mprojects_speech_generations" USING btree ("user_id")`
  );
  await run(
    client`CREATE INDEX IF NOT EXISTS "mprojects_speech_generations_created_at_idx" ON "mprojects_speech_generations" USING btree ("created_at" DESC)`
  );

  // Notifications & prefs
  await run(client`CREATE TABLE IF NOT EXISTS "Notification" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "userId" text NOT NULL,
    "type" varchar NOT NULL,
    "title" text NOT NULL,
    "body" text,
    "link" text,
    "isRead" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL
  )`);
  await run(
    client`CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification" USING btree ("userId")`
  );
  await run(
    client`CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification" USING btree ("createdAt" DESC)`
  );
  await run(
    client`CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_idx" ON "Notification" USING btree ("userId","isRead")`
  );
  await run(
    client`CREATE INDEX IF NOT EXISTS "Notification_userId_type_idx" ON "Notification" USING btree ("userId","type")`
  );
  await run(client`CREATE TABLE IF NOT EXISTS "user_notification_prefs" (
    "userId" text PRIMARY KEY NOT NULL,
    "enabled" boolean DEFAULT false NOT NULL,
    "aiResponse" boolean DEFAULT true NOT NULL,
    "projectCreated" boolean DEFAULT true NOT NULL,
    "mcpCreated" boolean DEFAULT true NOT NULL,
    "mcpAccessRequest" boolean DEFAULT true NOT NULL,
    "news" boolean DEFAULT true NOT NULL,
    "planningTaskCompleted" boolean DEFAULT true NOT NULL,
    "quotaWarning" boolean DEFAULT true NOT NULL,
    "regenerateMode" varchar DEFAULT 'truncate' NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
  )`);
  await run(
    client`ALTER TABLE "user_notification_prefs" ADD COLUMN IF NOT EXISTS "planningTaskCompleted" boolean DEFAULT true NOT NULL`
  );
  await run(
    client`ALTER TABLE "user_notification_prefs" ADD COLUMN IF NOT EXISTS "quotaWarning" boolean DEFAULT true NOT NULL`
  );
  await run(
    client`ALTER TABLE "user_notification_prefs" ADD COLUMN IF NOT EXISTS "regenerateMode" varchar DEFAULT 'truncate' NOT NULL`
  );

  // MCP fine-grained control + encrypted vars + Skill binding + global prefs (0006)
  await run(
    client`ALTER TABLE "McpServer" ADD COLUMN IF NOT EXISTS "lastSyncAt" timestamp`
  );
  await run(
    client`ALTER TABLE "McpServer" ADD COLUMN IF NOT EXISTS "lastCallAt" timestamp`
  );
  await run(
    client`ALTER TABLE "McpServer" ADD COLUMN IF NOT EXISTS "avgLatencyMs" integer DEFAULT 0 NOT NULL`
  );
  await run(
    client`ALTER TABLE "McpServer" ADD COLUMN IF NOT EXISTS "callCount" integer DEFAULT 0 NOT NULL`
  );
  await run(
    client`ALTER TABLE "McpServer" ADD COLUMN IF NOT EXISTS "uptimeStatus" varchar(20) DEFAULT 'unknown' NOT NULL`
  );
  await run(
    client`ALTER TABLE "McpServer" ADD COLUMN IF NOT EXISTS "timeoutMs" integer DEFAULT 15000 NOT NULL`
  );
  await run(
    client`ALTER TABLE "McpServer" ADD COLUMN IF NOT EXISTS "rateLimitPerMin" integer DEFAULT 60 NOT NULL`
  );
  await run(
    client`ALTER TABLE "McpServer" ADD COLUMN IF NOT EXISTS "toolOverrides" json DEFAULT '{}'::json NOT NULL`
  );
  await run(client`CREATE TABLE IF NOT EXISTS "mcp_server_secret" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "serverId" uuid NOT NULL REFERENCES "McpServer"("id") ON DELETE CASCADE,
    "userId" text NOT NULL,
    "kind" varchar(20) NOT NULL CHECK ("kind" IN ('env','auth','header')),
    "key" text NOT NULL,
    "encryptedValue" text NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "mcp_server_secret_unique" UNIQUE("serverId","kind","key")
  )`);
  await run(
    client`CREATE INDEX IF NOT EXISTS "mcp_server_secret_serverId_idx" ON "mcp_server_secret" USING btree ("serverId")`
  );
  await run(
    client`CREATE INDEX IF NOT EXISTS "mcp_server_secret_userId_idx" ON "mcp_server_secret" USING btree ("userId")`
  );
  await run(
    client`ALTER TABLE "Skill" ADD COLUMN IF NOT EXISTS "mcpServerIds" uuid[] DEFAULT '{}' NOT NULL`
  );
  await run(
    client`ALTER TABLE "Skill" ADD COLUMN IF NOT EXISTS "mcpToolFilter" json DEFAULT '{}'::json NOT NULL`
  );
  await run(
    client`ALTER TABLE "Skill" ADD COLUMN IF NOT EXISTS "version" varchar(20) DEFAULT 'v1' NOT NULL`
  );
  await run(
    client`ALTER TABLE "Skill" ADD COLUMN IF NOT EXISTS "usageCount" integer DEFAULT 0 NOT NULL`
  );
  await run(
    client`ALTER TABLE "Skill" ADD COLUMN IF NOT EXISTS "lastUsedAt" timestamp`
  );
  await run(
    client`ALTER TABLE "Skill" ADD COLUMN IF NOT EXISTS "templateId" uuid`
  );
  await run(client`CREATE TABLE IF NOT EXISTS "user_mcp_prefs" (
    "userId" text PRIMARY KEY NOT NULL,
    "globalKillSwitch" boolean DEFAULT false NOT NULL,
    "defaultRequireApproval" varchar(20) DEFAULT 'write_only' NOT NULL CHECK ("defaultRequireApproval" IN ('always_allow','write_only','ask_permission')),
    "defaultTimeoutMs" integer DEFAULT 15000 NOT NULL,
    "defaultRateLimitPerMin" integer DEFAULT 60 NOT NULL,
    "allowStdio" boolean DEFAULT true NOT NULL,
    "retentionDays" integer DEFAULT 30 NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
  )`);
  await run(client`CREATE TABLE IF NOT EXISTS "SkillTemplate" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "description" text DEFAULT '',
    "instructions" text NOT NULL DEFAULT '',
    "icon" text DEFAULT 'sparkles',
    "color" varchar(7) DEFAULT '#6366f1',
    "tags" text[] DEFAULT '{}'::text[] NOT NULL,
    "tools" json DEFAULT '[]'::json NOT NULL,
    "parameters" json DEFAULT '[]'::json NOT NULL,
    "isPublic" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
  )`);
  await run(client`CREATE TABLE IF NOT EXISTS "McpTemplate" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "description" text DEFAULT '',
    "transport" varchar(20) DEFAULT 'sse' NOT NULL,
    "url" text,
    "command" text,
    "args" text,
    "authType" varchar(20) DEFAULT 'none' NOT NULL,
    "icon" text DEFAULT 'server',
    "isPublic" boolean DEFAULT true NOT NULL,
    "tags" text[] DEFAULT '{}'::text[] NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
  )`);

  // Agents & AgentTemplate (0007)
  await run(client`CREATE TABLE IF NOT EXISTS "Agent" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "userId" text NOT NULL,
    "name" varchar(100) NOT NULL,
    "description" varchar(500) DEFAULT '',
    "instructions" text NOT NULL DEFAULT '',
    "icon" varchar(50) DEFAULT 'sparkles' NOT NULL,
    "emoji" varchar(10) DEFAULT NULL,
    "color" varchar(7) DEFAULT '#6366f1' NOT NULL,
    "defaultModelId" text NOT NULL DEFAULT 'google/gemini-2.5-flash',
    "skillIds" json DEFAULT '[]'::json NOT NULL,
    "mcpServerIds" json DEFAULT '[]'::json NOT NULL,
    "cloudFileUrls" json DEFAULT '[]'::json NOT NULL,
    "isPublic" boolean DEFAULT false NOT NULL,
    "shareId" text,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
  )`);
  await run(
    client`CREATE INDEX IF NOT EXISTS "Agent_userId_idx" ON "Agent" USING btree ("userId")`
  );
  await run(
    client`CREATE INDEX IF NOT EXISTS "Agent_shareId_idx" ON "Agent" USING btree ("shareId")`
  );
  await run(
    client`CREATE INDEX IF NOT EXISTS "Agent_userId_createdAt_idx" ON "Agent" USING btree ("userId", "createdAt" DESC)`
  );

  // Colonnes enrichies de Agent (0008)
  await run(
    client`ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "temperature" double precision DEFAULT 0.7`
  );
  await run(
    client`ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "topP" double precision DEFAULT 0.9`
  );
  await run(
    client`ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "maxTokens" integer`
  );
  await run(
    client`ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "starterPrompts" json DEFAULT '[]'::json NOT NULL`
  );
  await run(
    client`ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "welcomeMessage" text`
  );
  await run(
    client`ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "pinned" boolean DEFAULT false NOT NULL`
  );

  await run(client`CREATE TABLE IF NOT EXISTS "AgentTemplate" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" varchar(100) NOT NULL,
    "description" varchar(500) DEFAULT '',
    "instructions" text NOT NULL DEFAULT '',
    "icon" varchar(50) DEFAULT 'bot' NOT NULL,
    "emoji" varchar(10) DEFAULT NULL,
    "color" varchar(7) DEFAULT '#6366f1' NOT NULL,
    "defaultModelId" text DEFAULT 'google/gemini-2.5-flash' NOT NULL,
    "skillIds" json DEFAULT '[]'::json,
    "mcpServerIds" json DEFAULT '[]'::json,
    "tags" varchar(50)[] DEFAULT '{}' NOT NULL,
    "isPublic" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
  )`);
  await run(
    client`CREATE INDEX IF NOT EXISTS "AgentTemplate_isPublic_idx" ON "AgentTemplate" USING btree ("isPublic")`
  );
  await run(
    client`CREATE INDEX IF NOT EXISTS "AgentTemplate_name_idx" ON "AgentTemplate" USING btree ("name")`
  );

  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "default_agent_id" uuid`
  );
  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "default_chat_model" text`
  );
  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "default_chat_visibility" varchar(10) DEFAULT 'private'`
  );
  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "show_agent_chat_icons" boolean DEFAULT true NOT NULL`
  );
  await run(
    client`ALTER TABLE "users" DROP COLUMN IF EXISTS "default_ai_mode"`
  );

  // UserMemory — mémoire personnalisée globale / agent / projet (0010)
  await run(client`CREATE TABLE IF NOT EXISTS "UserMemory" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "userId" text NOT NULL,
    "agentId" uuid REFERENCES "Agent"("id") ON DELETE CASCADE,
    "projectId" uuid REFERENCES "Project"("id") ON DELETE CASCADE,
    "content" text NOT NULL CHECK (char_length("content") > 0 AND char_length("content") <= 2000),
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "UserMemory_scope_check" CHECK (NOT ("agentId" IS NOT NULL AND "projectId" IS NOT NULL))
  )`);
  await run(
    client`CREATE INDEX IF NOT EXISTS "UserMemory_userId_idx" ON "UserMemory" USING btree ("userId")`
  );
  await run(
    client`CREATE INDEX IF NOT EXISTS "UserMemory_agentId_idx" ON "UserMemory" USING btree ("agentId")`
  );
  await run(
    client`CREATE INDEX IF NOT EXISTS "UserMemory_projectId_idx" ON "UserMemory" USING btree ("projectId")`
  );
  await run(
    client`ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "memoryMode" varchar(10) DEFAULT 'global' NOT NULL`
  );
  await run(
    client`DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='users') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='ghost_memory_enabled') THEN
      ALTER TABLE "users" ADD COLUMN "ghost_memory_enabled" boolean DEFAULT false NOT NULL;
    END IF;
  END IF;
END $$;`
  );

  // Table ScheduledMessage (Planification)
  await run(client`CREATE TABLE IF NOT EXISTS "ScheduledMessage" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "userId" text NOT NULL,
    "title" text DEFAULT 'Envoi planifié' NOT NULL,
    "prompt" text NOT NULL,
    "scheduledAt" timestamp NOT NULL,
    "status" varchar(20) DEFAULT 'pending' NOT NULL,
    "createMode" varchar(20) DEFAULT 'new_chat' NOT NULL,
    "chatId" uuid REFERENCES "Chat"("id") ON DELETE SET NULL,
    "resultChatId" uuid,
    "agentId" uuid REFERENCES "Agent"("id") ON DELETE SET NULL,
    "recurrence" varchar(20) DEFAULT 'none' NOT NULL,
    "modelId" text DEFAULT 'google/gemini-2.5-flash' NOT NULL,
    "enabledTools" json DEFAULT '[]'::json NOT NULL,
    "cloudFileUrls" json DEFAULT '[]'::json NOT NULL,
    "customInstructions" text,
    "temperature" double precision,
    "lastError" text,
    "executedAt" timestamp,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
  )`);
  await run(client`DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='ScheduledMessage') THEN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ScheduledMessage' AND column_name='cloudFileUrls') THEN
        ALTER TABLE "ScheduledMessage" ADD COLUMN "cloudFileUrls" json DEFAULT '[]'::json NOT NULL;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ScheduledMessage' AND column_name='recurrence') THEN
        ALTER TABLE "ScheduledMessage" ADD COLUMN "recurrence" varchar(20) DEFAULT 'none' NOT NULL;
      END IF;
    END IF;
  END $$;`);
  await run(
    client`CREATE INDEX IF NOT EXISTS "ScheduledMessage_userId_idx" ON "ScheduledMessage" USING btree ("userId")`
  );
  await run(
    client`CREATE INDEX IF NOT EXISTS "ScheduledMessage_scheduledAt_idx" ON "ScheduledMessage" USING btree ("scheduledAt")`
  );
  await run(
    client`CREATE INDEX IF NOT EXISTS "ScheduledMessage_status_idx" ON "ScheduledMessage" USING btree ("status")`
  );

  // CustomCommand (Commandes personnalisées)
  await run(client`CREATE TABLE IF NOT EXISTS "CustomCommand" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "userId" text NOT NULL,
    "name" text NOT NULL,
    "trigger" varchar(32) NOT NULL,
    "kind" varchar NOT NULL,
    "actionType" varchar NOT NULL,
    "payload" json DEFAULT '{}'::json NOT NULL,
    "icon" text DEFAULT 'zap',
    "color" varchar(7) DEFAULT '#6366f1',
    "description" text DEFAULT '',
    "enabled" boolean DEFAULT true NOT NULL,
    "pinned" boolean DEFAULT false NOT NULL,
    "usageCount" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
  )`);
  await run(
    client`CREATE INDEX IF NOT EXISTS "CustomCommand_userId_idx" ON "CustomCommand" USING btree ("userId")`
  );

  // SkillVersion et SkillUsage
  await run(client`CREATE TABLE IF NOT EXISTS "SkillVersion" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "skillId" uuid NOT NULL,
    "userId" text NOT NULL,
    "versionLabel" varchar(20) DEFAULT 'v1',
    "name" text NOT NULL,
    "description" text DEFAULT '',
    "instructions" text NOT NULL DEFAULT '',
    "icon" text DEFAULT 'sparkles',
    "color" varchar(7) DEFAULT '#6366f1',
    "tags" text[] DEFAULT '{}'::text[] NOT NULL,
    "tools" json DEFAULT '[]'::json NOT NULL,
    "parameters" json DEFAULT '[]'::json NOT NULL,
    "mcpServerIds" json DEFAULT '[]'::json NOT NULL,
    "mcpToolFilter" json DEFAULT '{}'::json NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL
  )`);
  await run(
    client`CREATE INDEX IF NOT EXISTS "SkillVersion_skillId_idx" ON "SkillVersion" USING btree ("skillId")`
  );
  await run(
    client`CREATE INDEX IF NOT EXISTS "SkillVersion_userId_idx" ON "SkillVersion" USING btree ("userId")`
  );

  await run(client`CREATE TABLE IF NOT EXISTS "SkillUsage" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "skillId" uuid NOT NULL,
    "userId" text NOT NULL,
    "invocationCount" integer DEFAULT 0 NOT NULL,
    "lastInvokedAt" timestamp,
    "createdAt" timestamp DEFAULT now() NOT NULL
  )`);
  await run(
    client`CREATE INDEX IF NOT EXISTS "SkillUsage_skillId_idx" ON "SkillUsage" USING btree ("skillId")`
  );
  await run(
    client`CREATE INDEX IF NOT EXISTS "SkillUsage_userId_idx" ON "SkillUsage" USING btree ("userId")`
  );
}

let _migrationPromise: Promise<void> | null = null;
let _rawClient: postgres.Sql | null = null;

function initDb() {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL or POSTGRES_URL is missing in environment variables. Please check your .env configuration."
    );
  }

  const client = postgres(connectionString, { prepare: false });
  _rawClient = client;
  _db = drizzle(client);
  _migrationPromise = ensureTableTypes(client);
}

export function getDb() {
  if (!_db) {
    initDb();
  }
  if (!_db) {
    throw new Error("Database initialization failed.");
  }
  return _db;
}

// Helper utilisé dans toutes les fonctions de requêtes
async function dbReady() {
  if (!_db) {
    initDb();
  }
  if (_migrationPromise) {
    await _migrationPromise;
    _migrationPromise = null; // éviter de re-await
  }
  if (!_db) {
    throw new Error("Database initialization failed.");
  }
  return _db;
}

export async function saveChat({
  id,
  userId,
  title,
  visibility,
  projectId,
  tags,
  customInstructions,
  modeId,
  agentId,
  skillId,
  temperatureOverride,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
  projectId?: string | null;
  tags?: string[];
  customInstructions?: string | null;
  modeId?: string;
  agentId?: string | null;
  skillId?: string | null;
  temperatureOverride?: number | null;
}) {
  try {
    const db = await dbReady();
    return await db.insert(chat).values({
      agentId: agentId ?? null,
      customInstructions: customInstructions ?? null,
      id,
      projectId: projectId ?? null,
      skillId: skillId ?? null,
      tags: tags ?? [],
      temperatureOverride: temperatureOverride ?? null,
      title,
      userId,
      visibility,
    });
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    const db = await dbReady();
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));
    await db.delete(stream).where(eq(stream.chatId, id));
    const [chatsDeleted] = await db
      .delete(chat)
      .where(eq(chat.id, id))
      .returning();
    return chatsDeleted;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function deleteAllChatsByUserId({ userId }: { userId: string }) {
  try {
    const db = await dbReady();
    const userChats = await db
      .select({ id: chat.id })
      .from(chat)
      .where(sql`${chat.userId}::text = ${userId}::text`);

    if (userChats.length === 0) {
      return { deletedCount: 0 };
    }

    const chatIds = userChats.map((c) => c.id);
    await db.delete(vote).where(inArray(vote.chatId, chatIds));
    await db.delete(message).where(inArray(message.chatId, chatIds));
    await db.delete(stream).where(inArray(stream.chatId, chatIds));

    const deletedChats = await db
      .delete(chat)
      .where(sql`${chat.userId}::text = ${userId}::text`)
      .returning();

    return { deletedCount: deletedChats.length };
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getChatsByUserId({
  id,
  userEmail,
  limit,
  startingAfter,
  endingBefore,
  projectId,
  isArchived,
  pinned,
  search,
  tag,
  includeArchived = false,
}: {
  id: string;
  userEmail?: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
  projectId?: string | null;
  isArchived?: boolean | null;
  pinned?: boolean | null;
  search?: string | null;
  tag?: string | null;
  includeArchived?: boolean;
}) {
  try {
    const db = await dbReady();
    const extendedLimit = limit + 1;

    const extraConditions: SQL<unknown>[] = [];

    // Project filter: "null" means no project, undefined means no filter
    if (projectId !== undefined) {
      if (projectId === null || projectId === "null" || projectId === "") {
        extraConditions.push(sql`${chat.projectId} IS NULL`);
      } else {
        extraConditions.push(sql`${chat.projectId} = ${projectId}::uuid`);
      }
    }

    if (isArchived !== undefined && isArchived !== null) {
      extraConditions.push(eq(chat.isArchived, isArchived));
    } else if (!includeArchived) {
      extraConditions.push(eq(chat.isArchived, false));
    }

    if (pinned !== undefined && pinned !== null) {
      extraConditions.push(eq(chat.pinned, pinned));
    }

    if (tag) {
      extraConditions.push(sql`${tag} = ANY(${chat.tags})`);
    }

    if (search) {
      const escaped = `%${search.replace(/[%_]/g, "\\$&")}%`;
      extraConditions.push(sql`${chat.title} ILIKE ${escaped}`);
    }

    const userCondition =
      userEmail && userEmail !== id
        ? sql`(${chat.userId}::text = ${id}::text OR ${chat.userId}::text = ${userEmail}::text)`
        : sql`${chat.userId}::text = ${id}::text`;

    const baseWhere = and(userCondition, ...extraConditions);

    const query = (whereCondition?: SQL<unknown>) => {
      const where = whereCondition ? and(whereCondition, baseWhere) : baseWhere;
      // Pinned first, then createdAt desc
      return db
        .select({
          agentColor: agent.color,
          agentEmoji: agent.emoji,
          agentIcon: agent.icon,
          agentId: chat.agentId,
          agentName: agent.name,
          archivedAt: chat.archivedAt,
          createdAt: chat.createdAt,
          customInstructions: chat.customInstructions,
          id: chat.id,
          isArchived: chat.isArchived,
          pinned: chat.pinned,
          projectId: chat.projectId,
          skillId: chat.skillId,
          tags: chat.tags,
          temperatureOverride: chat.temperatureOverride,
          title: chat.title,
          userId: chat.userId,
          visibility: chat.visibility,
        })
        .from(chat)
        .leftJoin(agent, eq(chat.agentId, agent.id))
        .where(where)
        .orderBy(desc(chat.pinned), desc(chat.createdAt))
        .limit(extendedLimit);
    };

    let filteredChats: any[] = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new ChatbotError(
          "not_found:database",
          `Chat with id ${startingAfter} not found`
        );
      }

      filteredChats = await query(
        sql`(${chat.pinned}, ${chat.createdAt}) > (${selectedChat.pinned}, ${selectedChat.createdAt})`
      );
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new ChatbotError(
          "not_found:database",
          `Chat with id ${endingBefore} not found`
        );
      }

      filteredChats = await query(
        sql`(${chat.pinned}, ${chat.createdAt}) < (${selectedChat.pinned}, ${selectedChat.createdAt})`
      );
    } else {
      filteredChats = await query();
    }

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getChatById({ id }: { id: string }) {
  if (!id || typeof id !== "string") {
    return null;
  }
  try {
    const db = await dbReady();
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    if (!selectedChat) {
      return null;
    }
    return selectedChat;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// Projects
// ─────────────────────────────────────────────
export async function createProject({
  userId,
  name,
  description,
  icon,
  color,
  customInstructions,
  defaultModel,
}: {
  userId: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  customInstructions?: string;
  defaultModel?: string;
}) {
  try {
    const db = await dbReady();
    const [p] = await db
      .insert(project)
      .values({
        color: color ?? "#6366f1",
        customInstructions: customInstructions ?? null,
        defaultModel: defaultModel ?? null,
        description: description ?? "",
        icon: icon ?? "folder",
        name,
        userId,
      })
      .returning();
    return p;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getProjectsByUserId({
  userId,
  userEmail,
  includeArchived = false,
  search,
  limit = 50,
}: {
  userId: string;
  userEmail?: string;
  includeArchived?: boolean;
  search?: string;
  limit?: number;
}) {
  try {
    const db = await dbReady();
    const userCondition =
      userEmail && userEmail !== userId
        ? sql`(${project.userId}::text = ${userId}::text OR ${project.userId}::text = ${userEmail}::text)`
        : sql`${project.userId}::text = ${userId}::text`;
    const conditions: SQL<unknown>[] = [userCondition];
    if (!includeArchived) {
      conditions.push(eq(project.isArchived, false));
    }
    if (search) {
      const escaped = `%${search.replace(/[%_]/g, "\\$&")}%`;
      conditions.push(sql`${project.name} ILIKE ${escaped}`);
    }
    const where = and(...conditions);
    const rows = await db
      .select()
      .from(project)
      .where(where)
      .orderBy(desc(project.updatedAt), desc(project.createdAt))
      .limit(Math.min(Math.max(limit, 1), 100));
    return rows;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getProjectById({
  id,
  userId,
  userEmail,
}: {
  id: string;
  userId: string;
  userEmail?: string;
}) {
  try {
    const db = await dbReady();
    const userCondition =
      userEmail && userEmail !== userId
        ? sql`(${project.userId}::text = ${userId}::text OR ${project.userId}::text = ${userEmail}::text)`
        : sql`${project.userId}::text = ${userId}::text`;
    const [p] = await db
      .select()
      .from(project)
      .where(and(eq(project.id, id), userCondition))
      .limit(1);
    return p ?? null;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function updateProject({
  id,
  userId,
  userEmail,
  ...fields
}: {
  id: string;
  userId: string;
  userEmail?: string;
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  customInstructions?: string | null;
  defaultModel?: string | null;
  isArchived?: boolean;
}) {
  try {
    const db = await dbReady();
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (fields.name !== undefined) {
      updateData.name = fields.name;
    }
    if (fields.description !== undefined) {
      updateData.description = fields.description;
    }
    if (fields.icon !== undefined) {
      updateData.icon = fields.icon;
    }
    if (fields.color !== undefined) {
      updateData.color = fields.color;
    }
    if (fields.customInstructions !== undefined) {
      updateData.customInstructions = fields.customInstructions;
    }
    if (fields.defaultModel !== undefined) {
      updateData.defaultModel = fields.defaultModel;
    }
    if (fields.isArchived !== undefined) {
      updateData.isArchived = fields.isArchived;
    }
    const userCondition =
      userEmail && userEmail !== userId
        ? sql`(${project.userId}::text = ${userId}::text OR ${project.userId}::text = ${userEmail}::text)`
        : sql`${project.userId}::text = ${userId}::text`;
    const [updated] = await db
      .update(project)
      .set(updateData as any)
      .where(and(eq(project.id, id), userCondition))
      .returning();
    return updated;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function deleteProject({
  id,
  userId,
  userEmail,
  deleteChats = false,
}: {
  id: string;
  userId: string;
  userEmail?: string;
  deleteChats?: boolean;
}) {
  try {
    const db = await dbReady();
    const userCondition =
      userEmail && userEmail !== userId
        ? sql`(${chat.userId}::text = ${userId}::text OR ${chat.userId}::text = ${userEmail}::text)`
        : sql`${chat.userId}::text = ${userId}::text`;
    const projectUserCondition =
      userEmail && userEmail !== userId
        ? sql`(${project.userId}::text = ${userId}::text OR ${project.userId}::text = ${userEmail}::text)`
        : sql`${project.userId}::text = ${userId}::text`;

    if (deleteChats) {
      const chatsToDelete = await db
        .select({ id: chat.id })
        .from(chat)
        .where(and(eq(chat.projectId, id), userCondition));
      const ids = chatsToDelete.map((c) => c.id);
      if (ids.length > 0) {
        await db.delete(vote).where(inArray(vote.chatId, ids));
        await db.delete(message).where(inArray(message.chatId, ids));
        await db.delete(stream).where(inArray(stream.chatId, ids));
        await db.delete(chat).where(inArray(chat.id, ids));
      }
    } else {
      await db
        .update(chat)
        .set({ projectId: null })
        .where(and(eq(chat.projectId, id), userCondition));
    }
    const [deleted] = await db
      .delete(project)
      .where(and(eq(project.id, id), projectUserCondition))
      .returning();
    return deleted;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getProjectChatCounts({
  userId,
  userEmail,
  includeArchived = false,
}: {
  userId: string;
  userEmail?: string;
  includeArchived?: boolean;
}) {
  try {
    const db = await dbReady();
    const userCondition =
      userEmail && userEmail !== userId
        ? sql`(${chat.userId}::text = ${userId}::text OR ${chat.userId}::text = ${userEmail}::text)`
        : sql`${chat.userId}::text = ${userId}::text`;
    const where = includeArchived
      ? userCondition
      : and(userCondition, eq(chat.isArchived, false));
    const rows = await db
      .select({ count: count(chat.id), projectId: chat.projectId })
      .from(chat)
      .where(where)
      .groupBy(chat.projectId);
    return rows;
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────
// Chat extended: pin / archive / tags / project / bulk
// ─────────────────────────────────────────────
// chat.userId peut contenir indifféremment user.id, user.email ou username
// selon la création : le filtre doit couvrir les variantes (fallback email).
function chatUserFilter(userId: string, email?: string | null) {
  if (email && email !== userId) {
    return sql`(${chat.userId}::text = ${userId}::text OR ${chat.userId}::text = ${email}::text)`;
  }
  return sql`${chat.userId}::text = ${userId}::text`;
}

export async function updateChatProjectById({
  chatId,
  userId,
  email,
  projectId,
}: {
  chatId: string;
  userId: string;
  email?: string | null;
  projectId: string | null;
}) {
  try {
    const db = await dbReady();
    if (projectId) {
      const proj = await getProjectById({ id: projectId, userId });
      if (!proj) {
        throw new ChatbotError("not_found:database", "Project not found");
      }
    }
    const [updated] = await db
      .update(chat)
      .set({ projectId })
      .where(and(eq(chat.id, chatId), chatUserFilter(userId, email)))
      .returning();
    return updated;
  } catch (error) {
    if (error instanceof ChatbotError) {
      throw error;
    }
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function updateChatArchivedById({
  chatId,
  userId,
  email,
  isArchived,
}: {
  chatId: string;
  userId: string;
  email?: string | null;
  isArchived: boolean;
}) {
  const db = await dbReady();
  return db
    .update(chat)
    .set({ archivedAt: isArchived ? new Date() : null, isArchived })
    .where(and(eq(chat.id, chatId), chatUserFilter(userId, email)))
    .returning();
}

export async function updateChatPinnedById({
  chatId,
  userId,
  email,
  pinned,
}: {
  chatId: string;
  userId: string;
  email?: string | null;
  pinned: boolean;
}) {
  const db = await dbReady();
  return db
    .update(chat)
    .set({ pinned })
    .where(and(eq(chat.id, chatId), chatUserFilter(userId, email)))
    .returning();
}

export async function updateChatTagsById({
  chatId,
  userId,
  email,
  tags,
}: {
  chatId: string;
  userId: string;
  email?: string | null;
  tags: string[];
}) {
  const sanitized = tags
    .map((t) => t.trim().slice(0, 30))
    .filter(Boolean)
    .slice(0, 10);
  const db = await dbReady();
  return db
    .update(chat)
    .set({ tags: sanitized })
    .where(and(eq(chat.id, chatId), chatUserFilter(userId, email)))
    .returning();
}

export async function updateChatCustomInstructionsById({
  chatId,
  userId,
  email,
  customInstructions,
  modeId,
  temperatureOverride,
}: {
  chatId: string;
  userId: string;
  email?: string | null;
  customInstructions?: string | null;
  modeId?: string | null;
  temperatureOverride?: number | null;
}) {
  const db = await dbReady();
  const data: Record<string, unknown> = {};
  if (customInstructions !== undefined) {
    data.customInstructions = customInstructions;
  }
  if (modeId !== undefined) {
    data.modeId = modeId;
  }
  if (temperatureOverride !== undefined) {
    data.temperatureOverride = temperatureOverride;
  }
  return db
    .update(chat)
    .set(data as any)
    .where(and(eq(chat.id, chatId), chatUserFilter(userId, email)))
    .returning();
}

export async function bulkUpdateChats({
  userId,
  email,
  chatIds,
  action,
  projectId,
  tags,
  isArchived,
}: {
  userId: string;
  email?: string | null;
  chatIds: string[];
  action: "move" | "archive" | "unarchive" | "pin" | "unpin" | "tag" | "delete";
  projectId?: string | null;
  tags?: string[];
  isArchived?: boolean;
}) {
  const db = await dbReady();
  if (chatIds.length === 0) {
    return { updated: 0 };
  }
  const where = and(inArray(chat.id, chatIds), chatUserFilter(userId, email));
  if (action === "delete") {
    await db.delete(vote).where(inArray(vote.chatId, chatIds));
    await db.delete(message).where(inArray(message.chatId, chatIds));
    await db.delete(stream).where(inArray(stream.chatId, chatIds));
    const deleted = await db.delete(chat).where(where).returning();
    return { updated: deleted.length };
  }
  if (action === "move") {
    if (projectId) {
      const proj = await getProjectById({ id: projectId, userId });
      if (!proj) {
        throw new ChatbotError("not_found:database", "Project not found");
      }
    }
    await db
      .update(chat)
      .set({ projectId: projectId ?? null })
      .where(where);
    return { updated: chatIds.length };
  }
  if (action === "archive") {
    await db
      .update(chat)
      .set({ archivedAt: new Date(), isArchived: true })
      .where(where);
    return { updated: chatIds.length };
  }
  if (action === "unarchive") {
    await db
      .update(chat)
      .set({ archivedAt: null, isArchived: false })
      .where(where);
    return { updated: chatIds.length };
  }
  if (action === "pin") {
    await db.update(chat).set({ pinned: true }).where(where);
    return { updated: chatIds.length };
  }
  if (action === "unpin") {
    await db.update(chat).set({ pinned: false }).where(where);
    return { updated: chatIds.length };
  }
  if (action === "tag" && tags) {
    if (tags.length === 0) {
      await db.update(chat).set({ tags: [] }).where(where);
      return { updated: chatIds.length };
    }
    const sanitized = tags
      .map((t) => t.trim().slice(0, 30))
      .filter(Boolean)
      .slice(0, 10);
    // Append mode: merge with existing tags (non-destructif)
    const existing = await db
      .select({ id: chat.id, tags: chat.tags })
      .from(chat)
      .where(where);
    for (const row of existing) {
      const merged = [...new Set([...(row.tags || []), ...sanitized])].slice(
        0,
        10
      );
      await db.update(chat).set({ tags: merged }).where(eq(chat.id, row.id));
    }
    return { updated: existing.length };
  }
  return { updated: 0 };
}

export async function saveMessages({ messages }: { messages: DBMessage[] }) {
  try {
    const db = await dbReady();
    return await db.insert(message).values(messages);
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function updateMessage({
  id,
  parts,
}: {
  id: string;
  parts: DBMessage["parts"];
}) {
  try {
    const db = await dbReady();
    return await db.update(message).set({ parts }).where(eq(message.id, id));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  if (!id || typeof id !== "string") {
    return [];
  }
  try {
    const db = await dbReady();
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch {
    return [];
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: "up" | "down";
}) {
  try {
    const db = await dbReady();
    // Le vote existant doit être recherché par (chatId, messageId) — la
    // recherche par messageId seul peut remonter une ligne d'un autre chat.
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === "up" })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      isUpvoted: type === "up",
      messageId,
    });
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    const db = await dbReady();
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    const db = await dbReady();
    return await db
      .insert(document)
      .values({ content, createdAt: new Date(), id, kind, title, userId })
      .returning();
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function updateDocumentContent({
  id,
  content,
}: {
  id: string;
  content: string;
}) {
  try {
    const db = await dbReady();
    const docs = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt))
      .limit(1);

    const [latest] = docs;
    if (!latest) {
      throw new ChatbotError("not_found:database", "Document not found");
    }

    return await db
      .update(document)
      .set({ content })
      .where(and(eq(document.id, id), eq(document.createdAt, latest.createdAt)))
      .returning();
  } catch (error) {
    if (error instanceof ChatbotError) {
      throw error;
    }
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const db = await dbReady();
    return await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const db = await dbReady();
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));
    return selectedDocument;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    const db = await dbReady();
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp)
        )
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
      .returning();
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Suggestion[];
}) {
  try {
    const db = await dbReady();
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    const db = await dbReady();
    return await db
      .select()
      .from(suggestion)
      .where(eq(suggestion.documentId, documentId));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    const db = await dbReady();
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const db = await dbReady();
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp))
      );

    const messageIds = messagesToDelete.map((m) => m.id);

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds))
        );

      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds))
        );
    }
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function updateChatVisibilityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: "private" | "public";
}) {
  try {
    const db = await dbReady();
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function updateChatTitleById({
  chatId,
  title,
}: {
  chatId: string;
  title: string;
}) {
  try {
    const db = await dbReady();
    return await db.update(chat).set({ title }).where(eq(chat.id, chatId));
  } catch {
    // Best effort title update.
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: {
  id: string;
  differenceInHours: number;
}) {
  try {
    const db = await dbReady();
    const cutoffTime = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000
    );

    const [stats] = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          sql`${chat.userId}::text = ${id}::text`,
          gte(message.createdAt, cutoffTime),
          eq(message.role, "user")
        )
      )
      .execute();

    return stats?.count ?? 0;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  try {
    const db = await dbReady();
    await db
      .insert(stream)
      .values({ chatId, createdAt: new Date(), id: streamId });
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const db = await dbReady();
    const streamIds = await db
      .select({ id: stream.id })
      .from(stream)
      .where(eq(stream.chatId, chatId))
      .orderBy(asc(stream.createdAt))
      .execute();

    return streamIds.map(({ id }) => id);
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function recordTokenUsage({
  userId,
  userEmail,
  inputTokens = 0,
  outputTokens = 0,
  totalTokens = 0,
  model = "default",
  isGhostMode = false,
}: {
  userId: string;
  userEmail?: string | null;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  model?: string;
  isGhostMode?: boolean;
}) {
  const actualTotal =
    totalTokens > 0
      ? totalTokens
      : Math.max(0, (inputTokens || 0) + (outputTokens || 0));

  if (
    actualTotal <= 0 &&
    (!inputTokens || inputTokens <= 0) &&
    (!outputTokens || outputTokens <= 0)
  ) {
    return;
  }

  try {
    await dbReady();
    if (!_rawClient) {
      return;
    }

    // Calcul du début de la semaine (Lundi 00:00 UTC)
    const now = new Date();
    const day = now.getUTCDay();
    const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), diff)
    );
    const weekStartStr = monday.toISOString().split("T")[0];

    const targetUserId = userId || userEmail || "";
    if (!targetUserId) {
      return;
    }

    // 1. Mise à jour ou insertion dans weekly_usage
    await _rawClient`
      INSERT INTO weekly_usage (user_id, week_start, tokens_used)
      VALUES (${targetUserId}::text, ${weekStartStr}::date, ${actualTotal})
      ON CONFLICT (user_id, week_start)
      DO UPDATE SET tokens_used = weekly_usage.tokens_used + ${actualTotal}
    `;

    // 2. Enregistrement dans mprojects_api_logs
    try {
      await _rawClient`
        INSERT INTO mprojects_api_logs (api_key, endpoint, method, status_code, latency_ms, created_at)
        VALUES (
          ${targetUserId}::text,
          ${isGhostMode ? `/v1/chat/completions?ghost=true&model=${model}` : `/v1/chat/completions?model=${model}`}::text,
          'POST',
          200,
          1200,
          NOW()
        )
      `;
    } catch {}
  } catch (err) {
    console.error("Erreur recordTokenUsage direct en BDD:", err);
  }
}

// ==========================================
// SKILLS QUERIES
// ==========================================

export async function getSkillsByUserId({ userId }: { userId: string }) {
  const database = await getDb();
  return database
    .select()
    .from(skill)
    .where(eq(skill.userId, userId))
    .orderBy(desc(skill.pinned), desc(skill.updatedAt));
}

export async function getSkillById({
  id,
  userId,
}: {
  id: string;
  userId?: string;
}) {
  const database = await getDb();
  const conditions = [eq(skill.id, id)];
  if (userId) {
    conditions.push(eq(skill.userId, userId));
  }
  const [result] = await database
    .select()
    .from(skill)
    .where(and(...conditions));
  return result ?? null;
}

export async function getPublicSkillByShareId({
  shareId,
}: {
  shareId: string;
}) {
  const database = await getDb();
  const [result] = await database
    .select()
    .from(skill)
    .where(and(eq(skill.shareId, shareId), eq(skill.isPublic, true)));
  return result ?? null;
}

export async function createSkill(data: {
  userId: string;
  name: string;
  description?: string;
  instructions: string;
  icon?: string;
  color?: string;
  tools?: string[];
  parameters?: Array<{
    name: string;
    description?: string;
    type?: string;
    required?: boolean;
    defaultValue?: string;
    enumValues?: string[];
  }>;
  pinned?: boolean;
  isPublic?: boolean;
  tags?: string[];
  mcpServerIds?: string[];
  mcpToolFilter?: Record<string, string[] | null>;
  templateId?: string | null;
}) {
  const database = await getDb();
  const [created] = await database
    .insert(skill)
    .values({
      color: data.color ?? "#6366f1",
      description: data.description ?? "",
      icon: data.icon ?? "sparkles",
      instructions: data.instructions,
      isPublic: data.isPublic ?? false,
      mcpServerIds: (data.mcpServerIds as any) ?? [],
      mcpToolFilter: (data.mcpToolFilter as any) ?? {},
      name: data.name,
      parameters: (data.parameters as any) ?? [],
      pinned: data.pinned ?? false,
      shareId: data.isPublic
        ? Math.random().toString(36).substring(2, 10)
        : null,
      tags: data.tags ?? [],
      templateId: (data.templateId as any) ?? null,
      tools: (data.tools as any) ?? [],
      userId: data.userId,
    })
    .returning();
  return created;
}

const SKILL_SNAPSHOT_FIELDS = [
  "name",
  "description",
  "instructions",
  "icon",
  "color",
  "tools",
  "parameters",
  "mcpServerIds",
  "mcpToolFilter",
] as const;

function skillSnapshotChanged(
  current: Skill,
  data: Record<string, unknown>
): boolean {
  return SKILL_SNAPSHOT_FIELDS.some((field) => {
    const next = data[field];
    if (next === undefined) {
      return false;
    }
    const prev = (current as any)[field];
    return JSON.stringify(prev ?? null) !== JSON.stringify(next ?? null);
  });
}

export async function updateSkill({
  id,
  userId,
  data,
}: {
  id: string;
  userId: string;
  data: Partial<{
    name: string;
    description: string;
    instructions: string;
    icon: string;
    color: string;
    tools: string[];
    parameters: any[];
    pinned: boolean;
    isPublic: boolean;
    shareId: string | null;
    tags: string[];
    mcpServerIds: string[];
    mcpToolFilter: Record<string, string[] | null>;
    version: string;
    usageCount: number;
    lastUsedAt: Date | string | null;
    templateId: string | null;
  }>;
}) {
  const database = await getDb();
  const clean: any = { ...data };
  if (clean.lastUsedAt && typeof clean.lastUsedAt === "string") {
    clean.lastUsedAt = new Date(clean.lastUsedAt);
  }

  // Snapshot de la version courante si le contenu éditable change
  const current = await getSkillById({ id, userId });
  if (current && skillSnapshotChanged(current, clean)) {
    await database.insert(skillVersion).values({
      color: current.color ?? "#6366f1",
      description: current.description ?? "",
      icon: current.icon ?? "sparkles",
      instructions: current.instructions ?? "",
      mcpServerIds: (current.mcpServerIds as any) ?? [],
      mcpToolFilter: (current.mcpToolFilter as any) ?? {},
      name: current.name,
      parameters: (current.parameters as any) ?? [],
      skillId: current.id,
      tags: current.tags ?? [],
      tools: (current.tools as any) ?? [],
      userId,
      versionLabel: current.version ?? "v1",
    });
    if (!clean.version) {
      const match = /^v(\d+)$/.exec(current.version ?? "v1");
      const nextNumber = match ? Number(match[1]) + 1 : 1;
      clean.version = `v${nextNumber}`;
    }
  }

  const [updated] = await database
    .update(skill)
    .set({
      ...clean,
      updatedAt: new Date(),
    })
    .where(and(eq(skill.id, id), eq(skill.userId, userId)))
    .returning();
  return updated ?? null;
}

export async function getSkillVersions({
  skillId,
  userId,
}: {
  skillId: string;
  userId: string;
}) {
  const database = await getDb();
  const owns = await getSkillById({ id: skillId, userId });
  if (!owns) {
    return [];
  }
  return database
    .select()
    .from(skillVersion)
    .where(eq(skillVersion.skillId, skillId))
    .orderBy(desc(skillVersion.createdAt));
}

export async function restoreSkillVersion({
  versionId,
  userId,
}: {
  versionId: string;
  userId: string;
}) {
  const database = await getDb();
  const [version] = await database
    .select()
    .from(skillVersion)
    .where(
      and(eq(skillVersion.id, versionId), eq(skillVersion.userId, userId))
    );
  if (!version) {
    return null;
  }
  return updateSkill({
    data: {
      color: version.color ?? "#6366f1",
      description: version.description ?? "",
      icon: version.icon ?? "sparkles",
      instructions: version.instructions ?? "",
      mcpServerIds: (version.mcpServerIds as string[]) ?? [],
      mcpToolFilter:
        (version.mcpToolFilter as Record<string, string[] | null>) ?? {},
      name: version.name,
      parameters: (version.parameters as any[]) ?? [],
      tags: version.tags ?? [],
      tools: (version.tools as string[]) ?? [],
    },
    id: version.skillId,
    userId,
  });
}

export async function trackSkillUsage({
  skillId,
  userId,
}: {
  skillId: string;
  userId: string;
}) {
  const database = await getDb();
  const [existing] = await database
    .select()
    .from(skillUsage)
    .where(and(eq(skillUsage.skillId, skillId), eq(skillUsage.userId, userId)));
  if (existing) {
    await database
      .update(skillUsage)
      .set({
        invocationCount: (existing.invocationCount ?? 0) + 1,
        lastInvokedAt: new Date(),
      })
      .where(eq(skillUsage.id, existing.id));
  } else {
    await database.insert(skillUsage).values({
      invocationCount: 1,
      lastInvokedAt: new Date(),
      skillId,
      userId,
    });
  }
  await database
    .update(skill)
    .set({ lastUsedAt: new Date() })
    .where(eq(skill.id, skillId));
}

export async function deleteSkill({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  const database = await getDb();
  const [deleted] = await database
    .delete(skill)
    .where(and(eq(skill.id, id), eq(skill.userId, userId)))
    .returning();
  return deleted ?? null;
}

export async function togglePinSkill({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  const database = await getDb();
  const existing = await getSkillById({ id, userId });
  if (!existing) {
    return null;
  }

  const [updated] = await database
    .update(skill)
    .set({
      pinned: !existing.pinned,
      updatedAt: new Date(),
    })
    .where(and(eq(skill.id, id), eq(skill.userId, userId)))
    .returning();
  return updated ?? null;
}

export async function duplicateSkill({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  const original = await getSkillById({ id, userId });
  if (!original) {
    return null;
  }

  return createSkill({
    color: original.color ?? "#6366f1",
    description: original.description ?? "",
    icon: original.icon ?? "sparkles",
    instructions: original.instructions,
    isPublic: false,
    name: `${original.name} (Copie)`,
    parameters: (original.parameters as any[]) ?? [],
    pinned: false,
    tags: original.tags ?? [],
    tools: (original.tools as string[]) ?? [],
    userId,
  });
}

// ==========================================
// MCP SERVER & LOG QUERIES
// ==========================================

export async function getMcpServersByUserId({ userId }: { userId: string }) {
  const database = await getDb();
  return database
    .select()
    .from(mcpServer)
    .where(eq(mcpServer.userId, userId))
    .orderBy(desc(mcpServer.createdAt));
}

export async function getMcpServerById({
  id,
  userId,
}: {
  id: string;
  userId?: string;
}) {
  const database = await getDb();
  const conditions = [eq(mcpServer.id, id)];
  if (userId) {
    conditions.push(eq(mcpServer.userId, userId));
  }
  const [result] = await database
    .select()
    .from(mcpServer)
    .where(and(...conditions));
  return result ?? null;
}

export async function createMcpServer(data: {
  userId: string;
  name: string;
  description?: string;
  icon?: string;
  transport?: "sse" | "http" | "stdio" | "websocket";
  url?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  authType?: "none" | "bearer" | "basic" | "oauth2" | "custom_headers";
  authConfig?: Record<string, any>;
  headers?: Record<string, string>;
  isEnabled?: boolean;
  requireApproval?: "always_allow" | "ask_permission" | "write_only";
  toolsCache?: any[];
  toolOverrides?: Record<
    string,
    { enabled: boolean; requireApproval?: string | null }
  >;
  timeoutMs?: number;
  rateLimitPerMin?: number;
}) {
  const database = await getDb();
  const [created] = await database
    .insert(mcpServer)
    .values({
      args: (data.args as any) ?? [],
      authConfig: data.authConfig ?? {},
      authType: data.authType ?? "none",
      command: data.command ?? null,
      description: data.description ?? "",
      env: data.env ?? {},
      headers: data.headers ?? {},
      icon: data.icon ?? "server",
      isEnabled: data.isEnabled ?? true,
      name: data.name,
      rateLimitPerMin: data.rateLimitPerMin ?? 60,
      requireApproval: data.requireApproval ?? "write_only",
      timeoutMs: data.timeoutMs ?? 15_000,
      toolOverrides: (data.toolOverrides as any) ?? {},
      toolsCache: (data.toolsCache as any) ?? [],
      transport: data.transport ?? "sse",
      url: data.url ?? null,
      userId: data.userId,
    })
    .returning();
  return created;
}

export async function updateMcpServer({
  id,
  userId,
  data,
}: {
  id: string;
  userId: string;
  data: Partial<{
    name: string;
    description: string;
    icon: string;
    transport: "sse" | "http" | "stdio" | "websocket";
    url: string | null;
    command: string | null;
    args: string[];
    env: Record<string, string>;
    authType: "none" | "bearer" | "basic" | "oauth2" | "custom_headers";
    authConfig: Record<string, any>;
    headers: Record<string, string>;
    isEnabled: boolean;
    requireApproval: "always_allow" | "ask_permission" | "write_only";
    toolsCache: any[];
    toolOverrides: Record<
      string,
      { enabled: boolean; requireApproval?: string | null }
    >;
    timeoutMs: number;
    rateLimitPerMin: number;
    avgLatencyMs: number;
    callCount: number;
    uptimeStatus: string;
    lastSyncAt: Date | null;
    lastCallAt: Date | null;
  }>;
}) {
  const database = await getDb();
  const [updated] = await database
    .update(mcpServer)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(mcpServer.id, id), eq(mcpServer.userId, userId)))
    .returning();
  return updated ?? null;
}

export async function deleteMcpServer({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  const database = await getDb();
  const [deleted] = await database
    .delete(mcpServer)
    .where(and(eq(mcpServer.id, id), eq(mcpServer.userId, userId)))
    .returning();
  return deleted ?? null;
}

export async function toggleMcpServer({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  const database = await getDb();
  const existing = await getMcpServerById({ id, userId });
  if (!existing) {
    return null;
  }

  const [updated] = await database
    .update(mcpServer)
    .set({
      isEnabled: !existing.isEnabled,
      updatedAt: new Date(),
    })
    .where(and(eq(mcpServer.id, id), eq(mcpServer.userId, userId)))
    .returning();
  return updated ?? null;
}

export async function updateMcpToolsCache({
  id,
  userId,
  toolsCache,
}: {
  id: string;
  toolsCache: any[];
  userId: string;
}) {
  const database = await getDb();
  const [updated] = await database
    .update(mcpServer)
    .set({
      toolsCache: (toolsCache as any) ?? [],
      updatedAt: new Date(),
    })
    .where(and(eq(mcpServer.id, id), eq(mcpServer.userId, userId)))
    .returning();
  return updated ?? null;
}

export async function logMcpExecution(data: {
  userId: string;
  serverId?: string | null;
  serverName: string;
  toolName: string;
  chatId?: string | null;
  actionType?: "read" | "write" | "delete" | "execute" | "other";
  approvalStatus?: "pending" | "approved" | "denied" | "auto_approved";
  inputPayload?: any;
  outputPayload?: any;
  error?: string | null;
  durationMs?: number;
}) {
  try {
    const database = await getDb();
    const [log] = await database
      .insert(mcpLog)
      .values({
        actionType: data.actionType ?? "read",
        approvalStatus: data.approvalStatus ?? "auto_approved",
        chatId: data.chatId ?? null,
        durationMs: data.durationMs ?? 0,
        error: data.error ?? null,
        inputPayload: data.inputPayload ?? null,
        outputPayload: data.outputPayload ?? null,
        serverId: data.serverId ?? null,
        serverName: data.serverName,
        toolName: data.toolName,
        userId: data.userId,
      })
      .returning();
    return log;
  } catch (err) {
    console.error("Erreur logMcpExecution:", err);
    return null;
  }
}

export async function getMcpLogsByUserId({
  userId,
  limit = 50,
}: {
  limit?: number;
  userId: string;
}) {
  const database = await getDb();
  return database
    .select()
    .from(mcpLog)
    .where(eq(mcpLog.userId, userId))
    .orderBy(desc(mcpLog.createdAt))
    .limit(limit);
}

export async function getMcpStats({ userId }: { userId: string }) {
  const database = await getDb();
  const [serversCount] = await database
    .select({ count: count() })
    .from(mcpServer)
    .where(eq(mcpServer.userId, userId));
  const [logsCount] = await database
    .select({ count: count() })
    .from(mcpLog)
    .where(eq(mcpLog.userId, userId));
  return {
    servers: Number(serversCount?.count ?? 0),
    totalCalls: Number(logsCount?.count ?? 0),
  };
}

export async function updateMcpServerStats({
  id,
  userId,
  durationMs,
  success,
}: {
  id: string;
  userId: string;
  durationMs: number;
  success: boolean;
}) {
  const database = await getDb();
  const [existing] = await database
    .select()
    .from(mcpServer)
    .where(and(eq(mcpServer.id, id), eq(mcpServer.userId, userId)))
    .limit(1);
  if (!existing) {
    return null;
  }
  const newCount = (existing.callCount ?? 0) + 1;
  const prevAvg = existing.avgLatencyMs ?? 0;
  const newAvg = Math.round((prevAvg * (newCount - 1) + durationMs) / newCount);
  const [updated] = await database
    .update(mcpServer)
    .set({
      avgLatencyMs: newAvg,
      callCount: newCount,
      lastCallAt: new Date(),
      updatedAt: new Date(),
      uptimeStatus: success ? "online" : "error",
    })
    .where(and(eq(mcpServer.id, id), eq(mcpServer.userId, userId)))
    .returning();
  return updated ?? null;
}

export async function updateMcpServerSync({
  id,
  userId,
  toolsCache,
  success,
}: {
  id: string;
  userId: string;
  toolsCache?: any[];
  success: boolean;
}) {
  const database = await getDb();
  const data: any = {
    lastSyncAt: new Date(),
    updatedAt: new Date(),
    uptimeStatus: success ? "online" : "error",
  };
  if (toolsCache) {
    data.toolsCache = toolsCache as any;
  }
  const [updated] = await database
    .update(mcpServer)
    .set(data)
    .where(and(eq(mcpServer.id, id), eq(mcpServer.userId, userId)))
    .returning();
  return updated ?? null;
}

export async function getSkillTemplates() {
  const database = await getDb();
  return database
    .select()
    .from(skillTemplate)
    .where(eq(skillTemplate.isPublic, true))
    .orderBy(desc(skillTemplate.createdAt));
}

export async function getMcpTemplates() {
  const database = await getDb();
  return database
    .select()
    .from(mcpTemplate)
    .where(eq(mcpTemplate.isPublic, true))
    .orderBy(desc(mcpTemplate.createdAt));
}

export async function getMcpTemplateById(id: string) {
  const database = await getDb();
  const [result] = await database
    .select()
    .from(mcpTemplate)
    .where(eq(mcpTemplate.id, id))
    .limit(1);
  return result ?? null;
}

// ==========================================
// MCP SECRETS (chiffrés) — lib/mcp/encryption
// ==========================================

export async function getMcpServerSecrets({
  serverId,
  userId,
}: {
  serverId: string;
  userId: string;
}) {
  const db = await dbReady();
  return db
    .select()
    .from(mcpServerSecret)
    .where(
      and(
        eq(mcpServerSecret.serverId, serverId),
        eq(mcpServerSecret.userId, userId)
      )
    );
}

export async function setMcpServerSecrets({
  serverId,
  userId,
  secrets,
}: {
  serverId: string;
  userId: string;
  secrets: Array<{
    kind: "env" | "auth" | "header";
    key: string;
    encryptedValue: string;
  }>;
}) {
  const db = await dbReady();
  await db
    .delete(mcpServerSecret)
    .where(
      and(
        eq(mcpServerSecret.serverId, serverId),
        eq(mcpServerSecret.userId, userId)
      )
    );
  if (secrets.length === 0) {
    return [];
  }
  const rows = await db
    .insert(mcpServerSecret)
    .values(secrets.map((s) => ({ ...s, serverId, userId })))
    .returning();
  return rows;
}

export async function upsertMcpServerSecret({
  serverId,
  userId,
  kind,
  key,
  encryptedValue,
}: {
  serverId: string;
  userId: string;
  kind: "env" | "auth" | "header";
  key: string;
  encryptedValue: string;
}) {
  const db = await dbReady();
  const existing = await db
    .select()
    .from(mcpServerSecret)
    .where(
      and(
        eq(mcpServerSecret.serverId, serverId),
        eq(mcpServerSecret.kind, kind),
        eq(mcpServerSecret.key, key)
      )
    )
    .limit(1);
  if (existing.length > 0) {
    const [updated] = await db
      .update(mcpServerSecret)
      .set({ encryptedValue })
      .where(eq(mcpServerSecret.id, existing[0].id))
      .returning();
    return updated;
  }
  const [created] = await db
    .insert(mcpServerSecret)
    .values({ encryptedValue, key, kind, serverId, userId })
    .returning();
  return created;
}

// ==========================================
// USER MCP PREFS (global kill-switch, defaults)
// ==========================================

export async function getUserMcpPrefs(userId: string) {
  const db = await dbReady();
  const [prefs] = await db
    .select()
    .from(userMcpPrefs)
    .where(eq(userMcpPrefs.userId, userId))
    .limit(1);
  if (prefs) {
    return prefs;
  }
  return {
    allowStdio: true,
    createdAt: new Date(),
    defaultRateLimitPerMin: 60,
    defaultRequireApproval: "write_only" as const,
    defaultTimeoutMs: 15_000,
    globalKillSwitch: false,
    retentionDays: 30,
    updatedAt: new Date(),
    userId,
  };
}

export async function upsertUserMcpPrefs(
  userId: string,
  data: Partial<{
    allowStdio: boolean;
    defaultRateLimitPerMin: number;
    defaultRequireApproval: "always_allow" | "write_only" | "ask_permission";
    defaultTimeoutMs: number;
    globalKillSwitch: boolean;
    retentionDays: number;
  }>
) {
  const db = await dbReady();
  const existing = await db
    .select()
    .from(userMcpPrefs)
    .where(eq(userMcpPrefs.userId, userId))
    .limit(1);
  if (existing.length === 0) {
    const [created] = await db
      .insert(userMcpPrefs)
      .values({
        allowStdio: data.allowStdio ?? true,
        defaultRateLimitPerMin: data.defaultRateLimitPerMin ?? 60,
        defaultRequireApproval: data.defaultRequireApproval ?? "write_only",
        defaultTimeoutMs: data.defaultTimeoutMs ?? 15_000,
        globalKillSwitch: data.globalKillSwitch ?? false,
        retentionDays: data.retentionDays ?? 30,
        userId,
      })
      .returning();
    return created;
  }
  const [updated] = await db
    .update(userMcpPrefs)
    .set({ ...data, updatedAt: new Date() } as any)
    .where(eq(userMcpPrefs.userId, userId))
    .returning();
  return updated;
}

export async function getFilteredMcpLogs({
  userId,
  serverId,
  toolName,
  actionType,
  limit = 50,
}: {
  userId: string;
  serverId?: string;
  toolName?: string;
  actionType?: string;
  limit?: number;
}) {
  const db = await dbReady();
  const conditions: any[] = [eq(mcpLog.userId, userId)];
  if (serverId) {
    conditions.push(eq(mcpLog.serverId, serverId));
  }
  if (toolName) {
    conditions.push(eq(mcpLog.toolName, toolName));
  }
  if (actionType) {
    conditions.push(eq(mcpLog.actionType, actionType as any));
  }
  return db
    .select()
    .from(mcpLog)
    .where(and(...conditions))
    .orderBy(desc(mcpLog.createdAt))
    .limit(Math.min(limit, 200));
}

export async function purgeMcpLogs({
  userId,
  olderThanDays,
}: {
  userId: string;
  // 0 = tout purger
  olderThanDays: number;
}) {
  const db = await dbReady();
  if (olderThanDays <= 0) {
    const deleted = await db
      .delete(mcpLog)
      .where(eq(mcpLog.userId, userId))
      .returning();
    return { deleted: deleted.length };
  }
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
  const deleted = await db
    .delete(mcpLog)
    .where(and(eq(mcpLog.userId, userId), sql`${mcpLog.createdAt} < ${cutoff}`))
    .returning();
  return { deleted: deleted.length };
}

// ==========================================
// NOTIFICATIONS QUERIES
// ==========================================

export async function getUserNotificationPrefs(userId: string) {
  const db = await dbReady();
  const { notification, userNotificationPrefs } = await import("./schema");
  const [prefs] = await db
    .select()
    .from(userNotificationPrefs)
    .where(eq(userNotificationPrefs.userId, userId))
    .limit(1);
  if (prefs) {
    return prefs;
  }
  // default prefs if not exists
  return {
    aiResponse: true,
    createdAt: new Date(),
    enabled: false,
    mcpAccessRequest: true,
    mcpCreated: true,
    news: true,
    planningTaskCompleted: true,
    projectCreated: true,
    quotaWarning: true,
    regenerateMode: "truncate" as const,
    updatedAt: new Date(),
    userId,
  };
}

export async function upsertUserNotificationPrefs(
  userId: string,
  data: Partial<{
    enabled: boolean;
    aiResponse: boolean;
    projectCreated: boolean;
    mcpCreated: boolean;
    mcpAccessRequest: boolean;
    news: boolean;
    planningTaskCompleted: boolean;
    quotaWarning: boolean;
    regenerateMode: "truncate" | "fork";
  }>
) {
  const db = await dbReady();
  const { userNotificationPrefs } = await import("./schema");
  const existing = await db
    .select()
    .from(userNotificationPrefs)
    .where(eq(userNotificationPrefs.userId, userId))
    .limit(1);
  if (existing.length === 0) {
    const [created] = await db
      .insert(userNotificationPrefs)
      .values({
        aiResponse: data.aiResponse ?? true,
        enabled: data.enabled ?? false,
        mcpAccessRequest: data.mcpAccessRequest ?? true,
        mcpCreated: data.mcpCreated ?? true,
        news: data.news ?? true,
        planningTaskCompleted: data.planningTaskCompleted ?? true,
        projectCreated: data.projectCreated ?? true,
        quotaWarning: data.quotaWarning ?? true,
        regenerateMode: data.regenerateMode ?? "truncate",
        userId,
      })
      .returning();
    return created;
  }
  const [updated] = await db
    .update(userNotificationPrefs)
    .set({ ...data, updatedAt: new Date() } as any)
    .where(eq(userNotificationPrefs.userId, userId))
    .returning();
  return updated;
}

// ==========================================
// USER AI PREFERENCES QUERIES
// ==========================================

export async function getUserPreferences(userId: string) {
  const db = await dbReady();
  const { userPreferences } = await import("./schema");
  try {
    const [row] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    if (row) {
      return {
        customInstructions: row.customInstructions || "",
        defaultAgentId: row.defaultAgentId || null,
        defaultAudioModel: row.defaultAudioModel || "deepgram/flux-tts:free",
        defaultAudioSpeed: row.defaultAudioSpeed ?? 1.0,
        defaultAudioVoice: row.defaultAudioVoice || "flux-alexis-en",
        defaultChatModel: row.defaultChatModel || null,
        defaultChatVisibility: (row.defaultChatVisibility as "private" | "public") || "private",
        defaultImageModel: row.defaultImageModel || "black-forest-labs/flux-schnell",
        defaultImageSize: row.defaultImageSize || "1024x1024",
        enabled: Boolean(row.customInstructionsEnabled),
        ghostMemoryEnabled: Boolean(row.ghostMemoryEnabled),
        showAgentChatIcons: row.showAgentChatIcons ?? true,
        temperature: row.defaultTemperature ?? 0.7,
        topP: row.defaultTopP ?? 0.9,
      };
    }
  } catch (e) {
    console.error("getUserPreferences query error:", e);
  }

  return {
    customInstructions: "",
    defaultAgentId: null,
    defaultAudioModel: "deepgram/flux-tts:free",
    defaultAudioSpeed: 1.0,
    defaultAudioVoice: "flux-alexis-en",
    defaultChatModel: null,
    defaultChatVisibility: "private" as const,
    defaultImageModel: "black-forest-labs/flux-schnell",
    defaultImageSize: "1024x1024",
    enabled: false,
    ghostMemoryEnabled: false,
    showAgentChatIcons: true,
    temperature: 0.7,
    topP: 0.9,
  };
}

export async function upsertUserPreferences(
  userId: string,
  data: Partial<{
    customInstructions: string;
    enabled: boolean;
    temperature: number;
    topP: number;
    defaultAgentId: string | null;
    defaultChatModel: string | null;
    defaultChatVisibility: "private" | "public";
    defaultImageModel: string;
    defaultImageSize: string;
    defaultAudioModel: string;
    defaultAudioVoice: string;
    defaultAudioSpeed: number;
    ghostMemoryEnabled: boolean;
    showAgentChatIcons: boolean;
  }>
) {
  const db = await dbReady();
  const { userPreferences } = await import("./schema");

  const [existing] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  if (!existing) {
    const [created] = await db
      .insert(userPreferences)
      .values({
        customInstructions: data.customInstructions ?? "",
        customInstructionsEnabled: data.enabled ?? false,
        defaultAgentId: data.defaultAgentId ? (data.defaultAgentId as any) : null,
        defaultAudioModel: data.defaultAudioModel ?? "deepgram/flux-tts:free",
        defaultAudioSpeed: data.defaultAudioSpeed ?? 1.0,
        defaultAudioVoice: data.defaultAudioVoice ?? "flux-alexis-en",
        defaultChatModel: data.defaultChatModel ?? null,
        defaultChatVisibility: data.defaultChatVisibility ?? "private",
        defaultImageModel: data.defaultImageModel ?? "black-forest-labs/flux-schnell",
        defaultImageSize: data.defaultImageSize ?? "1024x1024",
        defaultTemperature: data.temperature ?? 0.7,
        defaultTopP: data.topP ?? 0.9,
        ghostMemoryEnabled: data.ghostMemoryEnabled ?? false,
        showAgentChatIcons: data.showAgentChatIcons ?? true,
        userId,
      })
      .returning();
    return created;
  }

  const updatePayload: Record<string, any> = {
    updatedAt: new Date(),
  };
  if (data.customInstructions !== undefined) updatePayload.customInstructions = data.customInstructions;
  if (data.enabled !== undefined) updatePayload.customInstructionsEnabled = data.enabled;
  if (data.temperature !== undefined) updatePayload.defaultTemperature = data.temperature;
  if (data.topP !== undefined) updatePayload.defaultTopP = data.topP;
  if (data.defaultAgentId !== undefined) updatePayload.defaultAgentId = data.defaultAgentId;
  if (data.defaultChatModel !== undefined) updatePayload.defaultChatModel = data.defaultChatModel;
  if (data.defaultChatVisibility !== undefined) updatePayload.defaultChatVisibility = data.defaultChatVisibility;
  if (data.defaultImageModel !== undefined) updatePayload.defaultImageModel = data.defaultImageModel;
  if (data.defaultImageSize !== undefined) updatePayload.defaultImageSize = data.defaultImageSize;
  if (data.defaultAudioModel !== undefined) updatePayload.defaultAudioModel = data.defaultAudioModel;
  if (data.defaultAudioVoice !== undefined) updatePayload.defaultAudioVoice = data.defaultAudioVoice;
  if (data.defaultAudioSpeed !== undefined) updatePayload.defaultAudioSpeed = data.defaultAudioSpeed;
  if (data.ghostMemoryEnabled !== undefined) updatePayload.ghostMemoryEnabled = data.ghostMemoryEnabled;
  if (data.showAgentChatIcons !== undefined) updatePayload.showAgentChatIcons = data.showAgentChatIcons;

  const [updated] = await db
    .update(userPreferences)
    .set(updatePayload)
    .where(eq(userPreferences.userId, userId))
    .returning();

  return updated;
}

export async function createNotification(data: {
  userId: string;
  type:
    | "ai_response"
    | "project_created"
    | "mcp_created"
    | "mcp_access_request"
    | "news"
    | "planning_task_completed"
    | "quota_warning";
  title: string;
  body?: string | null;
  link?: string | null;
}) {
  const db = await dbReady();
  const { notification } = await import("./schema");
  // check prefs gating
  try {
    const prefs = await getUserNotificationPrefs(data.userId);
    if (!prefs.enabled) {
      return null;
    }
    const gate: Record<string, boolean> = {
      ai_response: prefs.aiResponse,
      mcp_access_request: prefs.mcpAccessRequest,
      mcp_created: prefs.mcpCreated,
      news: prefs.news,
      planning_task_completed: (prefs as any).planningTaskCompleted ?? true,
      project_created: prefs.projectCreated,
      quota_warning: (prefs as any).quotaWarning ?? true,
    };
    if (gate[data.type] === false) {
      return null;
    }
  } catch {}
  const [created] = await db
    .insert(notification)
    .values({
      body: data.body ?? null,
      link: data.link ?? null,
      title: data.title,
      type: data.type,
      userId: data.userId,
    })
    .returning();
  return created;
}

export async function getNotificationsByUserId({
  userId,
  limit = 20,
  offset = 0,
  unreadOnly = false,
}: {
  userId: string;
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}) {
  const db = await dbReady();
  const { notification } = await import("./schema");
  const conditions = [eq(notification.userId, userId)];
  if (unreadOnly) {
    conditions.push(eq(notification.isRead, false));
  }
  const rows = await db
    .select()
    .from(notification)
    .where(and(...conditions))
    .orderBy(desc(notification.createdAt))
    .limit(Math.min(limit, 50))
    .offset(offset);
  return rows;
}

export async function getUnreadNotificationCount(userId: string) {
  const db = await dbReady();
  const { notification } = await import("./schema");
  const [row] = await db
    .select({ count: count() })
    .from(notification)
    .where(
      and(eq(notification.userId, userId), eq(notification.isRead, false))
    );
  return Number(row?.count ?? 0);
}

export async function markNotificationRead({
  id,
  userId,
  isRead = true,
}: {
  id: string;
  userId: string;
  isRead?: boolean;
}) {
  const db = await dbReady();
  const { notification } = await import("./schema");
  const [updated] = await db
    .update(notification)
    .set({ isRead })
    .where(and(eq(notification.id, id), eq(notification.userId, userId)))
    .returning();
  return updated ?? null;
}

export async function markAllNotificationsRead(userId: string) {
  const db = await dbReady();
  const { notification } = await import("./schema");
  await db
    .update(notification)
    .set({ isRead: true })
    .where(
      and(eq(notification.userId, userId), eq(notification.isRead, false))
    );
  return { success: true };
}

export async function deleteNotification({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  const db = await dbReady();
  const { notification } = await import("./schema");
  const [deleted] = await db
    .delete(notification)
    .where(and(eq(notification.id, id), eq(notification.userId, userId)))
    .returning();
  return deleted ?? null;
}

export async function deleteAllNotifications(userId: string) {
  const db = await dbReady();
  const { notification } = await import("./schema");
  await db.delete(notification).where(eq(notification.userId, userId));
  return { success: true };
}

// ==========================================
// AGENT QUERIES (remplace Mode IA)
// ==========================================

export async function getAgentsByUserId({ userId }: { userId: string }) {
  const database = await getDb();
  return database
    .select()
    .from(agent)
    .where(eq(agent.userId, userId))
    .orderBy(desc(agent.updatedAt));
}

export async function getAgentById({
  id,
  userId,
}: {
  id: string;
  userId?: string;
}) {
  const database = await getDb();
  const conditions = [eq(agent.id, id)];
  if (userId) {
    conditions.push(eq(agent.userId, userId));
  }
  const [result] = await database
    .select()
    .from(agent)
    .where(and(...conditions));
  return result ?? null;
}

export async function createAgent(data: {
  userId: string;
  name: string;
  description?: string;
  instructions: string;
  icon?: string;
  emoji?: string | null;
  color?: string;
  defaultModelId?: string;
  skillIds?: string[];
  mcpServerIds?: string[];
  cloudFileUrls?: string[];
  temperature?: number | null;
  topP?: number | null;
  maxTokens?: number | null;
  starterPrompts?: string[];
  welcomeMessage?: string | null;
  pinned?: boolean;
  memoryMode?: "global" | "custom";
}) {
  const database = await getDb();
  const [created] = await database
    .insert(agent)
    .values({
      cloudFileUrls: (data.cloudFileUrls as any) ?? [],
      color: data.color ?? "#6366f1",
      defaultModelId: data.defaultModelId ?? "google/gemini-2.5-flash",
      description: data.description ?? "",
      emoji: data.emoji ?? null,
      icon: data.icon ?? "sparkles",
      instructions: data.instructions,
      maxTokens: data.maxTokens ?? null,
      mcpServerIds: (data.mcpServerIds as any) ?? [],
      memoryMode: data.memoryMode ?? "global",
      name: data.name,
      pinned: data.pinned ?? false,
      skillIds: (data.skillIds as any) ?? [],
      starterPrompts: (data.starterPrompts as any) ?? [],
      temperature: data.temperature ?? null,
      topP: data.topP ?? null,
      userId: data.userId,
      welcomeMessage: data.welcomeMessage ?? null,
    })
    .returning();
  return created;
}

export async function updateAgent({
  id,
  userId,
  data,
}: {
  id: string;
  userId: string;
  data: Partial<{
    name: string;
    description: string;
    instructions: string;
    icon: string;
    emoji: string | null;
    color: string;
    defaultModelId: string;
    skillIds: string[];
    mcpServerIds: string[];
    cloudFileUrls: string[];
    temperature: number | null;
    topP: number | null;
    maxTokens: number | null;
    starterPrompts: string[];
    welcomeMessage: string | null;
    pinned: boolean;
    isPublic: boolean;
    shareId: string | null;
    memoryMode: "global" | "custom";
  }>;
}) {
  const database = await getDb();
  const [updated] = await database
    .update(agent)
    .set({ ...(data as any), updatedAt: new Date() })
    .where(and(eq(agent.id, id), eq(agent.userId, userId)))
    .returning();
  return updated ?? null;
}

export async function deleteAgent({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  const database = await getDb();
  const [deleted] = await database
    .delete(agent)
    .where(and(eq(agent.id, id), eq(agent.userId, userId)))
    .returning();
  return deleted ?? null;
}

export async function duplicateAgent({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  const original = await getAgentById({ id, userId });
  if (!original) {
    return null;
  }
  return createAgent({
    cloudFileUrls: (original.cloudFileUrls as any) ?? [],
    color: original.color ?? "#6366f1",
    defaultModelId: original.defaultModelId ?? "google/gemini-2.5-flash",
    description: original.description ?? "",
    emoji: (original as any).emoji ?? null,
    icon: original.icon ?? "sparkles",
    instructions: original.instructions,
    maxTokens: (original as any).maxTokens ?? null,
    mcpServerIds: (original.mcpServerIds as any) ?? [],
    memoryMode: (original as any).memoryMode === "custom" ? "custom" : "global",
    name: `${original.name} (Copie)`,
    pinned: (original as any).pinned ?? false,
    skillIds: (original.skillIds as any) ?? [],
    starterPrompts: (original as any).starterPrompts ?? [],
    temperature: (original as any).temperature ?? null,
    topP: (original as any).topP ?? null,
    userId,
    welcomeMessage: (original as any).welcomeMessage ?? null,
  });
}

export async function getGlobalMemories({
  userId,
  limit = 200,
  includeDisabled = false,
}: {
  userId: string;
  limit?: number;
  includeDisabled?: boolean;
}) {
  const database = await getDb();
  const conditions = [
    eq(userMemory.userId, userId),
    isNull(userMemory.agentId),
    isNull(userMemory.projectId),
  ];
  if (!includeDisabled) {
    conditions.push(eq(userMemory.isEnabled, true));
  }
  return database
    .select()
    .from(userMemory)
    .where(and(...conditions))
    .orderBy(desc(userMemory.isImportant), desc(userMemory.createdAt))
    .limit(limit);
}

export async function getAgentMemories({
  agentId,
  userId,
  limit = 200,
  includeDisabled = false,
}: {
  agentId: string;
  userId: string;
  limit?: number;
  includeDisabled?: boolean;
}) {
  const database = await getDb();
  const conditions = [
    eq(userMemory.userId, userId),
    eq(userMemory.agentId, agentId),
  ];
  if (!includeDisabled) {
    conditions.push(eq(userMemory.isEnabled, true));
  }
  return database
    .select()
    .from(userMemory)
    .where(and(...conditions))
    .orderBy(desc(userMemory.isImportant), desc(userMemory.createdAt))
    .limit(limit);
}

export async function getProjectMemories({
  projectId,
  userId,
  limit = 200,
  includeDisabled = false,
}: {
  projectId: string;
  userId: string;
  limit?: number;
  includeDisabled?: boolean;
}) {
  const database = await getDb();
  const conditions = [
    eq(userMemory.userId, userId),
    eq(userMemory.projectId, projectId),
  ];
  if (!includeDisabled) {
    conditions.push(eq(userMemory.isEnabled, true));
  }
  return database
    .select()
    .from(userMemory)
    .where(and(...conditions))
    .orderBy(desc(userMemory.isImportant), desc(userMemory.createdAt))
    .limit(limit);
}

export async function countMemories({
  userId,
  agentId,
  projectId,
}: {
  userId: string;
  agentId?: string | null;
  projectId?: string | null;
}) {
  const database = await getDb();
  const conditions = [eq(userMemory.userId, userId)];
  if (agentId) {
    conditions.push(eq(userMemory.agentId, agentId));
  } else if (projectId) {
    conditions.push(eq(userMemory.projectId, projectId));
  } else {
    conditions.push(isNull(userMemory.agentId));
    conditions.push(isNull(userMemory.projectId));
  }
  const [result] = await database
    .select({ value: count() })
    .from(userMemory)
    .where(and(...conditions));
  return result?.value ?? 0;
}

export async function getUserScopeMemoriesForChat({
  userId,
  agentId,
}: {
  userId: string;
  agentId?: string | null;
}) {
  if (agentId) {
    const ag = await getAgentById({ id: agentId, userId });
    if (ag && (ag as any).memoryMode === "custom") {
      return {
        memories: await getAgentMemories({ agentId, limit: 50, userId }),
        mode: "custom" as const,
      };
    }
  }
  return {
    memories: await getGlobalMemories({ limit: 50, userId }),
    mode: "global" as const,
  };
}

export async function getGhostMemoryEnabled(userId: string): Promise<boolean> {
  try {
    await dbReady();
    if (!_rawClient) {
      return false;
    }
    const rows = await _rawClient`
      SELECT ghost_memory_enabled FROM users
      WHERE id::text = ${userId}::text OR username = ${userId}::text OR email = ${userId}::text
      LIMIT 1`;
    return Boolean((rows as any[])[0]?.ghost_memory_enabled);
  } catch (e) {
    console.error("getGhostMemoryEnabled error", e);
    return false;
  }
}

export async function createMemory({
  userId,
  content,
  agentId = null,
  projectId = null,
  category = "general",
  tags = [],
  isImportant = false,
  isEnabled = true,
}: {
  userId: string;
  content: string;
  agentId?: string | null;
  projectId?: string | null;
  category?: string;
  tags?: string[];
  isImportant?: boolean;
  isEnabled?: boolean;
}) {
  const database = await getDb();
  const [created] = await database
    .insert(userMemory)
    .values({
      agentId: agentId ?? null,
      category: category ?? "general",
      content: sanitizeMemoryContent(content),
      isEnabled: isEnabled ?? true,
      isImportant: isImportant ?? false,
      projectId: projectId ?? null,
      tags: tags ?? [],
      userId,
    })
    .returning();
  return created;
}

export async function deleteMemory({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  const database = await getDb();
  const [deleted] = await database
    .delete(userMemory)
    .where(and(eq(userMemory.id, id), eq(userMemory.userId, userId)))
    .returning();
  return deleted ?? null;
}

function sanitizeMemoryContent(content: string): string {
  return content
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, MEMORY_CONTENT_MAX_LENGTH);
}

export async function updateMemory({
  category,
  content,
  id,
  isEnabled,
  isImportant,
  tags,
  userId,
}: {
  category?: string;
  content?: string;
  id: string;
  isEnabled?: boolean;
  isImportant?: boolean;
  tags?: string[];
  userId: string;
}) {
  const setFields: Record<string, any> = { updatedAt: new Date() };
  if (content !== undefined) {
    const safe = sanitizeMemoryContent(content);
    if (!safe) return null;
    setFields.content = safe;
  }
  if (category !== undefined) setFields.category = category;
  if (isEnabled !== undefined) setFields.isEnabled = isEnabled;
  if (isImportant !== undefined) setFields.isImportant = isImportant;
  if (tags !== undefined) setFields.tags = tags;

  const database = await getDb();
  const [updated] = await database
    .update(userMemory)
    .set(setFields)
    .where(and(eq(userMemory.id, id), eq(userMemory.userId, userId)))
    .returning();
  return updated ?? null;
}

/**
 * Toutes les mémoires de l'utilisateur, tous scopes confondus, avec le nom de
 * l'agent ou du projet auquel chacune est rattachée (null pour une mémoire
 * globale). Utilisé par l'onglet Mémoire des paramètres.
 */
export async function getUserMemoriesWithScope({
  limit = 500,
  userId,
}: {
  limit?: number;
  userId: string;
}) {
  const database = await getDb();
  return database
    .select({
      agentId: userMemory.agentId,
      agentName: agent.name,
      category: userMemory.category,
      content: userMemory.content,
      createdAt: userMemory.createdAt,
      id: userMemory.id,
      isEnabled: userMemory.isEnabled,
      isImportant: userMemory.isImportant,
      projectId: userMemory.projectId,
      projectName: project.name,
      tags: userMemory.tags,
      updatedAt: userMemory.updatedAt,
    })
    .from(userMemory)
    .leftJoin(agent, eq(userMemory.agentId, agent.id))
    .leftJoin(project, eq(userMemory.projectId, project.id))
    .where(eq(userMemory.userId, userId))
    .orderBy(desc(userMemory.isImportant), desc(userMemory.createdAt))
    .limit(limit);
}

export async function searchMemories({
  userId,
  query,
  agentId = null,
  projectId = null,
  limit = 20,
}: {
  userId: string;
  query: string;
  agentId?: string | null;
  projectId?: string | null;
  limit?: number;
}) {
  const database = await getDb();
  const safe = query.replace(/[%_\\]/g, "\\$&");
  const conditions = [eq(userMemory.userId, userId)];
  if (agentId) {
    conditions.push(eq(userMemory.agentId, agentId));
  } else if (projectId) {
    conditions.push(eq(userMemory.projectId, projectId));
  } else {
    conditions.push(isNull(userMemory.agentId));
    conditions.push(isNull(userMemory.projectId));
  }
  conditions.push(sql`${userMemory.content} ILIKE ${"%" + safe + "%"}`);
  return database
    .select()
    .from(userMemory)
    .where(and(...conditions))
    .orderBy(desc(userMemory.createdAt))
    .limit(limit);
}

export async function getAgentTemplates() {
  const database = await getDb();
  return database
    .select()
    .from(agentTemplate)
    .where(eq(agentTemplate.isPublic, true))
    .orderBy(asc(agentTemplate.name));
}

export async function broadcastNewsNotification(data: {
  title: string;
  body?: string | null;
  link?: string | null;
}) {
  const db = await dbReady();
  const { userNotificationPrefs, notification } = await import("./schema");
  // get all users with enabled+news
  const eligible = await db
    .select({ userId: userNotificationPrefs.userId })
    .from(userNotificationPrefs)
    .where(
      and(
        eq(userNotificationPrefs.enabled, true),
        eq(userNotificationPrefs.news, true)
      )
    );
  if (eligible.length === 0) {
    return { sent: 0 };
  }
  const values = eligible.map((e) => ({
    body: data.body ?? null,
    link: data.link ?? null,
    title: data.title,
    type: "news" as const,
    userId: e.userId,
  }));
  // batch insert 500 at a time
  let sent = 0;
  for (let i = 0; i < values.length; i += 500) {
    const chunk = values.slice(i, i + 500);
    await db.insert(notification).values(chunk as any);
    sent += chunk.length;
  }
  return { sent };
}

// ==========================================
// CUSTOM COMMANDS (section Configuration)
// ==========================================

export async function createCustomCommand({
  userId,
  ...data
}: {
  userId: string;
  kind: "slash" | "mention";
  trigger: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  actionType: "mcp" | "agent" | "skill" | "prompt" | "tools" | "navigation";
  payload?: Record<string, unknown>;
  enabled?: boolean;
  pinned?: boolean;
}) {
  try {
    const database = await getDb();
    const [created] = await database
      .insert(customCommand)
      .values({
        actionType: data.actionType,
        color: data.color ?? "#6366f1",
        description: data.description ?? "",
        enabled: data.enabled ?? true,
        icon: data.icon ?? "zap",
        kind: data.kind,
        name: data.name,
        payload: (data.payload ?? {}) as any,
        pinned: data.pinned ?? false,
        trigger: data.trigger,
        userId,
      })
      .returning();
    return created ?? null;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getCustomCommandsByUserId({
  userId,
  kind,
}: {
  userId: string;
  kind?: "slash" | "mention";
}) {
  try {
    const database = await getDb();
    const conditions = kind
      ? and(eq(customCommand.userId, userId), eq(customCommand.kind, kind))
      : eq(customCommand.userId, userId);
    return database
      .select()
      .from(customCommand)
      .where(conditions)
      .orderBy(desc(customCommand.pinned), asc(customCommand.trigger));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getCustomCommandById({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  try {
    const database = await getDb();
    const [found] = await database
      .select()
      .from(customCommand)
      .where(and(eq(customCommand.id, id), eq(customCommand.userId, userId)));
    return found ?? null;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function updateCustomCommand({
  id,
  userId,
  data,
}: {
  id: string;
  userId: string;
  data: Partial<{
    name: string;
    description: string;
    icon: string;
    color: string;
    trigger: string;
    actionType: "mcp" | "agent" | "skill" | "prompt" | "tools" | "navigation";
    payload: Record<string, unknown>;
    enabled: boolean;
    pinned: boolean;
  }>;
}) {
  try {
    const database = await getDb();
    const [updated] = await database
      .update(customCommand)
      .set({
        ...data,
        ...(data.payload === undefined ? {} : { payload: data.payload as any }),
        updatedAt: new Date(),
      })
      .where(and(eq(customCommand.id, id), eq(customCommand.userId, userId)))
      .returning();
    return updated ?? null;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function deleteCustomCommand({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  try {
    const database = await getDb();
    const [deleted] = await database
      .delete(customCommand)
      .where(and(eq(customCommand.id, id), eq(customCommand.userId, userId)))
      .returning();
    return deleted ?? null;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function incrementCustomCommandUsage({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  try {
    const database = await getDb();
    await database
      .update(customCommand)
      .set({ usageCount: sql`${customCommand.usageCount} + 1` })
      .where(and(eq(customCommand.id, id), eq(customCommand.userId, userId)));
  } catch {
    /* non critique */
  }
}

export async function getAgentStatsByUserId({ userId }: { userId: string }) {
  const database = await getDb();

  // Liste des agents de l'utilisateur
  const userAgents = await database
    .select()
    .from(agent)
    .where(eq(agent.userId, userId))
    .orderBy(desc(agent.createdAt));

  // Compte des chats par agentId
  const chatCounts = await database
    .select({
      agentId: chat.agentId,
      count: sql<number>`count(*)::int`,
      lastUsedAt: sql<string | null>`max(${chat.createdAt})::text`,
    })
    .from(chat)
    .where(eq(chat.userId, userId))
    .groupBy(chat.agentId);

  const countsMap = new Map<string, { count: number; lastUsedAt: string | null }>();
  let totalStandardChats = 0;
  let totalAgentChats = 0;

  for (const c of chatCounts) {
    if (c.agentId) {
      countsMap.set(c.agentId, { count: c.count, lastUsedAt: c.lastUsedAt });
      totalAgentChats += c.count;
    } else {
      totalStandardChats += c.count;
    }
  }

  const agentsWithStats = userAgents.map((ag) => {
    const stats = countsMap.get(ag.id) || { count: 0, lastUsedAt: null };
    return {
      color: ag.color,
      defaultModelId: ag.defaultModelId,
      description: ag.description,
      emoji: ag.emoji,
      icon: ag.icon,
      id: ag.id,
      lastUsedAt: stats.lastUsedAt,
      name: ag.name,
      pinned: ag.pinned,
      usageCount: stats.count,
    };
  });

  // Trier par nombre d'utilisations décroissant
  agentsWithStats.sort((a, b) => b.usageCount - a.usageCount);

  return {
    agents: agentsWithStats,
    totalAgentChats,
    totalAgents: userAgents.length,
    totalChats: totalStandardChats + totalAgentChats,
    totalStandardChats,
  };
}

// ============================================================================
// Planification (ScheduledMessage)
// ============================================================================

export async function createScheduledMessage(params: {
  userId: string;
  title: string;
  prompt: string;
  scheduledAt: Date;
  createMode?: "new_chat" | "existing_chat";
  chatId?: string | null;
  agentId?: string | null;
  modelId?: string;
  enabledTools?: string[];
  cloudFileUrls?: string[];
  customInstructions?: string | null;
  temperature?: number | null;
  recurrence?: "none" | "daily" | "weekly" | "monthly";
}): Promise<ScheduledMessage> {
  const database = await getDb();
  const [created] = await database
    .insert(scheduledMessage)
    .values({
      agentId: params.agentId || null,
      chatId: params.chatId || null,
      cloudFileUrls: params.cloudFileUrls || [],
      createMode: params.createMode || "new_chat",
      customInstructions: params.customInstructions || null,
      enabledTools: params.enabledTools || [],
      modelId: params.modelId || "google/gemini-2.5-flash",
      prompt: params.prompt,
      recurrence: params.recurrence || "none",
      scheduledAt: params.scheduledAt,
      status: "pending",
      temperature: params.temperature ?? null,
      title: params.title || "Envoi planifié",
      userId: params.userId,
    })
    .returning();
  return created;
}

export async function getScheduledMessagesByUserId(params: {
  userId: string;
  status?: string;
}): Promise<ScheduledMessage[]> {
  const database = await getDb();
  const conditions = [eq(scheduledMessage.userId, params.userId)];
  if (params.status && params.status !== "all") {
    conditions.push(eq(scheduledMessage.status, params.status as any));
  }
  return await database
    .select()
    .from(scheduledMessage)
    .where(and(...conditions))
    .orderBy(desc(scheduledMessage.scheduledAt));
}

export async function getScheduledMessageById(params: {
  id: string;
  userId?: string;
}): Promise<ScheduledMessage | null> {
  const database = await getDb();
  const conditions = [eq(scheduledMessage.id, params.id)];
  if (params.userId) {
    conditions.push(eq(scheduledMessage.userId, params.userId));
  }
  const [res] = await database
    .select()
    .from(scheduledMessage)
    .where(and(...conditions))
    .limit(1);
  return res ?? null;
}

export async function updateScheduledMessage(params: {
  id: string;
  userId: string;
  title?: string;
  prompt?: string;
  scheduledAt?: Date;
  createMode?: "new_chat" | "existing_chat";
  chatId?: string | null;
  agentId?: string | null;
  modelId?: string;
  enabledTools?: string[];
  cloudFileUrls?: string[];
  customInstructions?: string | null;
  temperature?: number | null;
  recurrence?: "none" | "daily" | "weekly" | "monthly";
  executedAt?: Date | null;
  lastError?: string | null;
  resultChatId?: string | null;
  status?: "pending" | "processing" | "completed" | "failed" | "cancelled";
}): Promise<ScheduledMessage | null> {
  const database = await getDb();
  const { id, userId, ...updates } = params;
  const updateData: Record<string, any> = {
    updatedAt: new Date(),
  };

  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.prompt !== undefined) updateData.prompt = updates.prompt;
  if (updates.scheduledAt !== undefined) updateData.scheduledAt = updates.scheduledAt;
  if (updates.createMode !== undefined) updateData.createMode = updates.createMode;
  if (updates.chatId !== undefined) updateData.chatId = updates.chatId;
  if (updates.agentId !== undefined) updateData.agentId = updates.agentId;
  if (updates.modelId !== undefined) updateData.modelId = updates.modelId;
  if (updates.enabledTools !== undefined) updateData.enabledTools = updates.enabledTools;
  if (updates.cloudFileUrls !== undefined) updateData.cloudFileUrls = updates.cloudFileUrls;
  if (updates.customInstructions !== undefined) updateData.customInstructions = updates.customInstructions;
  if (updates.temperature !== undefined) updateData.temperature = updates.temperature;
  if (updates.recurrence !== undefined) updateData.recurrence = updates.recurrence;
  if (updates.executedAt !== undefined) updateData.executedAt = updates.executedAt;
  if (updates.lastError !== undefined) updateData.lastError = updates.lastError;
  if (updates.resultChatId !== undefined) updateData.resultChatId = updates.resultChatId;
  if (updates.status !== undefined) updateData.status = updates.status;

  const [updated] = await database
    .update(scheduledMessage)
    .set(updateData)
    .where(
      and(
        eq(scheduledMessage.id, id),
        eq(scheduledMessage.userId, userId)
      )
    )
    .returning();
  return updated ?? null;
}

export async function deleteScheduledMessage(params: {
  id: string;
  userId: string;
}): Promise<boolean> {
  const database = await getDb();
  const res = await database
    .delete(scheduledMessage)
    .where(
      and(
        eq(scheduledMessage.id, params.id),
        eq(scheduledMessage.userId, params.userId)
      )
    )
    .returning();
  return res.length > 0;
}

export async function getDueScheduledMessages(): Promise<ScheduledMessage[]> {
  const database = await getDb();
  // Les items "processing" bloqués depuis plus de 10 minutes (ex: crash serveur)
  // sont repris automatiquement pour ne jamais rester coincés.
  const stuckThreshold = new Date(Date.now() - 10 * 60 * 1000);
  return await database
    .select()
    .from(scheduledMessage)
    .where(
      or(
        and(
          eq(scheduledMessage.status, "pending"),
          lte(scheduledMessage.scheduledAt, new Date())
        ),
        and(
          eq(scheduledMessage.status, "processing"),
          lte(scheduledMessage.updatedAt, stuckThreshold)
        )
      )
    )
    .orderBy(asc(scheduledMessage.scheduledAt))
    .limit(20);
}

export async function rescheduleRecurringMessage(params: {
  id: string;
  nextScheduledAt: Date;
}): Promise<void> {
  const database = await getDb();
  await database
    .update(scheduledMessage)
    .set({
      executedAt: null,
      lastError: null,
      resultChatId: null,
      scheduledAt: params.nextScheduledAt,
      status: "pending",
      updatedAt: new Date(),
    })
    .where(eq(scheduledMessage.id, params.id));
}

export async function setScheduledMessageStatus(params: {
  id: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  resultChatId?: string | null;
  lastError?: string | null;
  executedAt?: Date | null;
}): Promise<void> {
  const database = await getDb();
  await database
    .update(scheduledMessage)
    .set({
      executedAt: params.executedAt !== undefined ? params.executedAt : undefined,
      lastError: params.lastError !== undefined ? params.lastError : undefined,
      resultChatId: params.resultChatId !== undefined ? params.resultChatId : undefined,
      status: params.status,
      updatedAt: new Date(),
    })
    .where(eq(scheduledMessage.id, params.id));
}


