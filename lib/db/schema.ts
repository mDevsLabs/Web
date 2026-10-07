import type { InferSelectModel } from "drizzle-orm";
import {
  bigint,
  boolean,
  date,
  doublePrecision,
  foreignKey,
  index,
  integer,
  json,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { AGENT_MODES, type AgentMode } from "@/lib/agent/channel";
import type { ScheduleRule } from "@/lib/agent/contracts";
import type {
  AgentOccurrenceRecord,
  AgentRunCheckpoint,
  AgentRunInstructionRecord,
  AgentRunUsageNormalized,
  AgentScheduleRecord,
  ApprovalRequestRecord,
  ToolExecutionAttemptFields,
} from "@/lib/agent/db-schema";
import type {
  AgentExecutionBudget,
  AgentPlan,
  AgentRunUsage,
  ToolCategory,
  ToolPermission,
} from "@/lib/agent/types";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { REASONING_LEVELS } from "@/lib/ai/registry/reasoning";

export const project = pgTable(
  "Project",
  {
    color: varchar("color", { length: 7 }).default("#6366f1"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    customInstructions: text("customInstructions"),
    defaultModel: text("defaultModel"),
    description: text("description").default(""),
    icon: text("icon").default("folder"),
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    isArchived: boolean("isArchived").notNull().default(false),
    name: text("name").notNull(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
    userId: text("userId").notNull(),
  },
  (table) => ({
    userCreatedIdx: index("Project_userId_createdAt_idx").on(
      table.userId,
      table.createdAt
    ),
    userIdIdx: index("Project_userId_idx").on(table.userId),
  })
);

export type Project = InferSelectModel<typeof project>;

// ─────────────────────────────────────────────
// Projets partagés (migration 0020) : membres, invitations et fichiers.
// Un Projet devient un espace de travail persistant : le propriétaire conserve
// la ligne "Project" (userId inchangé pour la compatibilité legacy), les
// membres autorisés sont résolus via ProjectMember. Les conversations restent
// référencées par Chat.projectId (une seule copie, jamais dupliquée entre
// comptes) et les fichiers projet pointent vers le stockage cloud MAI (Z1),
// sans copie binaire en base.
// ─────────────────────────────────────────────
export const projectMember = pgTable(
  "ProjectMember",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    invitedBy: text("invitedBy"),
    joinedAt: timestamp("joinedAt").notNull().defaultNow(),
    projectId: uuid("projectId")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    // Rôles : "owner" (réglages, suppression, invitations) et "member"
    // (contributions). Enum volontairement minimal — de nouveaux rôles
    // pourront être ajoutés plus tard sans refonte.
    role: varchar("role", { enum: ["owner", "member"] })
      .notNull()
      .default("member"),
    // Identité canonique users.id (jamais email/username, contrairement aux
    // champs userId historiques).
    userId: text("userId").notNull(),
  },
  (table) => ({
    projectIdx: index("ProjectMember_projectId_idx").on(table.projectId),
    projectUserUnique: uniqueIndex("ProjectMember_projectId_userId_key").on(
      table.projectId,
      table.userId
    ),
    userIdIdx: index("ProjectMember_userId_idx").on(table.userId),
  })
);

export type ProjectMember = InferSelectModel<typeof projectMember>;

export const projectInvite = pgTable(
  "ProjectInvite",
  {
    // Code URL-safe (nanoid) : sert à la fois de lien partageable
    // (/projects/join/[code]) et de code manuel. Inguessable : aucune donnée
    // privée n'est servie sans session authentifiée, même avec le code.
    code: text("code").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    createdBy: text("createdBy").notNull(),
    expiresAt: timestamp("expiresAt"),
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    maxUses: integer("maxUses"),
    projectId: uuid("projectId")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    revokedAt: timestamp("revokedAt"),
    useCount: integer("useCount").notNull().default(0),
  },
  (table) => ({
    codeUnique: uniqueIndex("ProjectInvite_code_key").on(table.code),
    projectIdx: index("ProjectInvite_projectId_idx").on(table.projectId),
  })
);

export type ProjectInvite = InferSelectModel<typeof projectInvite>;

export const projectFile = pgTable(
  "ProjectFile",
  {
    contentType: text("contentType")
      .notNull()
      .default("application/octet-stream"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    // Texte extrait (PDF/DOCX/CSV convertis en texte) borné : injecté dans la
    // requête modèle sous budget, jamais le binaire complet.
    extractedText: text("extractedText"),
    extractionStatus: varchar("extractionStatus", {
      enum: ["pending", "ready", "unsupported", "failed"],
    })
      .notNull()
      .default("pending"),
    fileName: text("fileName").notNull(),
    // Référence du fichier dans le stockage cloud MAI (Z1 Storage) — pas de
    // binaire ici : l'upload proxifie /api/library (même backend).
    fileRef: text("fileRef"),
    fileSize: integer("fileSize"),
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    projectId: uuid("projectId")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    storageUrl: text("storageUrl").notNull(),
    uploadedBy: text("uploadedBy").notNull(),
  },
  (table) => ({
    projectCreatedIdx: index("ProjectFile_projectId_createdAt_idx").on(
      table.projectId,
      table.createdAt
    ),
  })
);

export type ProjectFile = InferSelectModel<typeof projectFile>;

export const skill = pgTable(
  "Skill",
  {
    color: varchar("color", { length: 7 }).default("#6366f1"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    description: text("description").default(""),
    icon: text("icon").default("sparkles"),
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    instructions: text("instructions").notNull().default(""),
    isPublic: boolean("isPublic").notNull().default(false),
    lastUsedAt: timestamp("lastUsedAt"),
    mcpServerIds: uuid("mcpServerIds").array().notNull().default([]),
    mcpToolFilter: json("mcpToolFilter").notNull().default({}),
    name: text("name").notNull(),
    parameters: json("parameters").notNull().default([]),
    pinned: boolean("pinned").notNull().default(false),
    shareId: text("shareId"),
    tags: text("tags").array().notNull().default([]),
    // Slug du modèle de skill d'origine (ex : « sql-data-analyst »). Unique par
    // utilisateur : l'installation d'un modèle est idempotente. Voir
    // lib/skill-templates (source de vérité) et la migration 0019.
    templateId: text("templateId"),
    tools: json("tools").notNull().default([]),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
    usageCount: integer("usageCount").notNull().default(0),
    userId: text("userId").notNull(),
    version: varchar("version", { length: 20 }).default("v1"),
  },
  (table) => ({
    shareIdIdx: index("Skill_shareId_idx").on(table.shareId),
    userIdIdx: index("Skill_userId_idx").on(table.userId),
    userPinnedIdx: index("Skill_userId_pinned_idx").on(
      table.userId,
      table.pinned
    ),
  })
);

export type Skill = InferSelectModel<typeof skill>;

export const skillVersion = pgTable(
  "SkillVersion",
  {
    color: varchar("color", { length: 7 }).default("#6366f1"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    description: text("description").default(""),
    icon: text("icon").default("sparkles"),
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    instructions: text("instructions").notNull().default(""),
    mcpServerIds: json("mcpServerIds").notNull().default([]),
    mcpToolFilter: json("mcpToolFilter").notNull().default({}),
    name: text("name").notNull(),
    parameters: json("parameters").notNull().default([]),
    skillId: uuid("skillId")
      .notNull()
      .references(() => skill.id, { onDelete: "cascade" }),
    tags: text("tags").array().notNull().default([]),
    tools: json("tools").notNull().default([]),
    userId: text("userId").notNull(),
    versionLabel: varchar("versionLabel", { length: 20 }).default("v1"),
  },
  (table) => ({
    skillIdIdx: index("SkillVersion_skillId_idx").on(table.skillId),
    userIdIdx: index("SkillVersion_userId_idx").on(table.userId),
  })
);

export type SkillVersion = InferSelectModel<typeof skillVersion>;

export const skillUsage = pgTable(
  "SkillUsage",
  {
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    invocationCount: integer("invocationCount").notNull().default(0),
    lastInvokedAt: timestamp("lastInvokedAt"),
    skillId: uuid("skillId")
      .notNull()
      .references(() => skill.id, { onDelete: "cascade" }),
    userId: text("userId").notNull(),
  },
  (table) => ({
    skillIdIdx: index("SkillUsage_skillId_idx").on(table.skillId),
    userIdIdx: index("SkillUsage_userId_idx").on(table.userId),
  })
);

export type SkillUsage = InferSelectModel<typeof skillUsage>;

export const customCommand = pgTable(
  "CustomCommand",
  {
    actionType: varchar("actionType", {
      enum: ["mcp", "agent", "skill", "prompt", "tools", "navigation"],
    }).notNull(),
    color: varchar("color", { length: 7 }).default("#6366f1"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    description: text("description").default(""),
    enabled: boolean("enabled").notNull().default(true),
    icon: text("icon").default("zap"),
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    kind: varchar("kind", { enum: ["slash", "mention"] }).notNull(),
    name: text("name").notNull(),
    payload: json("payload").notNull().default({}),
    pinned: boolean("pinned").notNull().default(false),
    trigger: varchar("trigger", { length: 32 }).notNull(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
    usageCount: integer("usageCount").notNull().default(0),
    userId: text("userId").notNull(),
  },
  (table) => ({
    userIdIdx: index("CustomCommand_userId_idx").on(table.userId),
    userIdKindIdx: index("CustomCommand_userId_kind_idx").on(
      table.userId,
      table.kind
    ),
    userIdKindTriggerIdx: uniqueIndex(
      "CustomCommand_userId_kind_trigger_key"
    ).on(table.userId, table.kind, table.trigger),
  })
);

export type CustomCommand = InferSelectModel<typeof customCommand>;

export const chat = pgTable(
  "Chat",
  {
    agentId: uuid("agentId").references(() => agent.id, {
      onDelete: "set null",
    }),
    archivedAt: timestamp("archivedAt"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    customInstructions: text("customInstructions"),
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    isArchived: boolean("isArchived").notNull().default(false),

    // Conversation classique (chat) ou exécutée par Agent : évite de dupliquer
    // l'historique, la sidebar et les projets pour le mode Agent.
    mode: varchar("mode", { enum: ["chat", "agent"] })
      .notNull()
      .default("chat"),
    pinned: boolean("pinned").notNull().default(false),
    projectId: uuid("projectId").references(() => project.id, {
      onDelete: "set null",
    }),
    skillId: uuid("skillId").references(() => skill.id, {
      onDelete: "set null",
    }),
    tags: text("tags").array().notNull().default([]),
    temperatureOverride: doublePrecision("temperatureOverride"),
    title: text("title").notNull().default("Nouvelle discussion"),
    userId: text("userId").notNull(),
    visibility: varchar("visibility", { enum: ["public", "private"] })
      .notNull()
      .default("private"),
  },
  (table) => ({
    projectIdx: index("Chat_projectId_idx").on(table.projectId),
    tagsGinIdx: index("Chat_tags_gin_idx").using("gin", table.tags),
    userArchivedIdx: index("Chat_userId_isArchived_idx").on(
      table.userId,
      table.isArchived
    ),
    userCreatedIdx: index("Chat_userId_createdAt_desc_idx").on(
      table.userId,
      table.createdAt
    ),
    userModeIdx: index("Chat_userId_mode_idx").on(table.userId, table.mode),
    userPinnedIdx: index("Chat_userId_pinned_idx").on(
      table.userId,
      table.pinned
    ),
    userProjectIdx: index("Chat_userId_projectId_idx").on(
      table.userId,
      table.projectId
    ),
  })
);

export type Chat = InferSelectModel<typeof chat>;

// Propositions de modifications ciblées d'un Artifact par l'IA. Une proposal
// décrit un patch typé (lib/artifacts/patch.ts) généré contre un état précis
// du document (baseHash) : elle n'est JAMAIS appliquée implicitement —// l'utilisateur accepte ou refuse explicitement. Le contenu du document reste
// dans Document ; cette table ne porte que des métadonnées de patch.
export const documentProposal = pgTable(
  "DocumentProposal",
  {
    // Hash FNV-1a du contenu de référence (lib/artifacts/hash.ts) : si le
    // document a changé entre la génération et l'acceptation, la proposal
    // est marquée stale au lieu d'écraser les modifications utilisateur.
    baseHash: text("baseHash").notNull(),
    chatId: uuid("chatId").references(() => chat.id, { onDelete: "set null" }),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    description: text("description"),
    documentId: uuid("documentId").notNull(),
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    // Ops sérialisées au format strict DocumentPatchOp[] (jsonb).
    ops: jsonb("ops").notNull(),
    resolvedAt: timestamp("resolvedAt"),
    status: varchar("status", {
      enum: ["pending", "accepted", "rejected", "stale"],
    })
      .notNull()
      .default("pending"),
    userId: text("userId").notNull(),
  },
  (table) => ({
    documentStatusIdx: index("DocumentProposal_documentId_status_idx").on(
      table.documentId,
      table.status
    ),
    userCreatedIdx: index("DocumentProposal_userId_createdAt_idx").on(
      table.userId,
      table.createdAt
    ),
  })
);

export type DocumentProposal = InferSelectModel<typeof documentProposal>;

export const message = pgTable(
  "Message_v2",
  {
    attachments: json("attachments").notNull().default([]),
    chatId: uuid("chatId")
      .notNull()
      .references(() => chat.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    id: text("id").primaryKey().notNull(),
    parts: json("parts").notNull(),
    role: varchar("role").notNull(),
  },
  (table) => ({
    chatCreatedIdx: index("Message_v2_chatId_createdAt_id_idx").on(
      table.chatId,
      table.createdAt,
      table.id
    ),
  })
);

export const DBMessage = message;
export type DBMessage = InferSelectModel<typeof message>;

export const vote = pgTable(
  "Vote_v2",
  {
    chatId: uuid("chatId")
      .notNull()
      .references(() => chat.id, { onDelete: "cascade" }),
    isUpvoted: boolean("isUpvoted").notNull(),
    messageId: text("messageId").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.chatId, table.messageId] }),
  })
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  "Document",
  {
    content: text("content"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    id: uuid("id").notNull().defaultRandom(),
    kind: varchar("text", {
      enum: ["text", "code", "image", "sheet", "html"],
    })
      .notNull()
      .default("text"),
    // Rattachement facultatif d'un livrable à un projet : un résultat Agent
    // peut être conservé dans le projet sélectionné, sans changer de table.
    projectId: uuid("projectId").references(() => project.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    userId: text("userId").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id, table.createdAt] }),
    projectIdx: index("Document_projectId_idx").on(table.projectId),
  })
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  "Suggestion",
  {
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    description: text("description"),
    documentCreatedAt: timestamp("documentCreatedAt").notNull(),
    documentId: uuid("documentId").notNull(),
    id: uuid("id").notNull().defaultRandom(),
    isResolved: boolean("isResolved").notNull().default(false),
    originalText: text("originalText").notNull(),
    suggestedText: text("suggestedText").notNull(),
    userId: text("userId").notNull(),
  },
  (table) => ({
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
    pk: primaryKey({ columns: [table.id] }),
  })
);

export type Suggestion = InferSelectModel<typeof suggestion>;

export const stream = pgTable(
  "Stream",
  {
    chatId: uuid("chatId")
      .notNull()
      .references(() => chat.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    id: text("id").primaryKey().notNull(),
  },
  (table) => ({
    chatCreatedIdx: index("Stream_chatId_createdAt_idx").on(
      table.chatId,
      table.createdAt
    ),
    chatRef: foreignKey({
      columns: [table.chatId],
      foreignColumns: [chat.id],
    }),
    pk: primaryKey({ columns: [table.id] }),
  })
);

export type Stream = InferSelectModel<typeof stream>;

export const usageEvent = pgTable(
  "UsageEvent",
  {
    // Conversation à l'origine de l'appel (migration 0033). Volontairement
    // SANS clé étrangère vers `Chat.id` : les lignes de planification peuvent
    // être écrites avant que la conversation ne soit persistée, et une FK les
    // refuserait. Historique non backfillable → `chatId` peut être nul, la
    // page Statistiques lit donc `COALESCE` côté requête.
    chatId: uuid("chatId"),
    // Mode et projet de la conversation, FONDUS au moment de l'appel
    // (migration 0035). Sans ces deux colonnes, les filtres « mode » et
    // « projet » de la page Statistiques doivent joindre `Chat` — et cette
    // jointure disparaît avec la conversation : supprimer un chat faisait
    // baisser le total de tokens. Dénormalisé, ce n'est pas une redondance
    // mais la seule source qui survit à la suppression ; `Chat.projectId` est
    // de plus en `ON DELETE SET NULL`, donc l'autre source perd l'information
    // dès qu'un projet est supprimé. Volontairement sans clé étrangère :
    // l'écriture est sur le chemin critique du quota.
    chatMode: varchar("chatMode", { enum: ["chat", "agent"] }),
    chatProjectId: uuid("chatProjectId"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    id: text("id").primaryKey().notNull(),
    inputTokens: integer("inputTokens").notNull().default(0),
    isGhostMode: boolean("isGhostMode").notNull().default(false),
    model: text("model"),
    outputTokens: integer("outputTokens").notNull().default(0),
    // Les tokens de réflexion sont un sous-ensemble des tokens de sortie côté
    // fournisseur : ils sont additionnés au quota mais gardés à part, pour que
    // la décomposition reste lisible (migration 0030).
    reasoningTokens: integer("reasoningTokens").notNull().default(0),
    totalTokens: integer("totalTokens").notNull().default(0),
    userId: text("userId").notNull(),
  },
  (table) => ({
    chatIdx: index("UsageEvent_chatId_idx").on(table.chatId),
    userCreatedIdx: index("UsageEvent_userId_createdAt_idx").on(
      table.userId,
      table.createdAt
    ),
    userModeCreatedIdx: index("UsageEvent_userId_chatMode_createdAt_idx").on(
      table.userId,
      table.chatMode,
      table.createdAt
    ),
  })
);
export type UsageEvent = InferSelectModel<typeof usageEvent>;

export const tokenBlacklist = pgTable("token_blacklist", {
  expiresAt: timestamp("expires_at").notNull().defaultNow(),
  revokedAt: timestamp("revoked_at").notNull().defaultNow(),
  token: text("token").primaryKey().notNull(),
});

export type TokenBlacklist = InferSelectModel<typeof tokenBlacklist>;

export const userTotp = pgTable("user_totp", {
  backupCodes: text("backup_codes").array().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  secret: text("secret").notNull(),
  userId: text("user_id").primaryKey().notNull(),
  verified: boolean("verified").notNull().default(false),
  verifiedAt: timestamp("verified_at"),
});

export type UserTotp = InferSelectModel<typeof userTotp>;

export const weeklySpeechUsage = pgTable(
  "weekly_speech_usage",
  {
    id: serial("id").primaryKey().notNull(),
    requestsCount: integer("requests_count").notNull().default(0),
    tokensUsed: bigint("tokens_used", { mode: "number" }).notNull().default(0),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    userId: text("user_id").notNull(),
    weekStart: date("week_start").notNull(),
  },
  (table) => ({
    userIdIdx: index("weekly_speech_usage_user_id_idx").on(table.userId),
    userWeekUnique: uniqueIndex("weekly_speech_usage_user_week_idx").on(
      table.userId,
      table.weekStart
    ),
    weekStartIdx: index("weekly_speech_usage_week_start_idx").on(
      table.weekStart
    ),
  })
);

export type WeeklySpeechUsage = InferSelectModel<typeof weeklySpeechUsage>;

export const mprojectsSpeechGenerations = pgTable(
  "mprojects_speech_generations",
  {
    apiKey: text("api_key"),
    audioUrl: text("audio_url"),
    characterCount: integer("character_count").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    inputText: text("input_text").notNull(),
    model: text("model").notNull().default("deepgram/flux-tts:free"),
    pinned: boolean("pinned").notNull().default(false),
    status: text("status").notNull().default("completed"),
    title: text("title"),
    tokensCount: integer("tokens_count").notNull().default(0),
    userId: text("user_id").notNull(),
    voice: text("voice").default("flux-alexis-en"),
  },
  (table) => ({
    createdAtIdx: index("mprojects_speech_generations_created_at_idx").on(
      table.createdAt
    ),
    pinnedIdx: index("mprojects_speech_generations_pinned_idx").on(
      table.userId,
      table.pinned
    ),
    userIdIdx: index("mprojects_speech_generations_user_id_idx").on(
      table.userId
    ),
  })
);

export type MprojectsSpeechGenerations = InferSelectModel<
  typeof mprojectsSpeechGenerations
>;

export const mprojectsImageGenerations = pgTable(
  "mprojects_image_generations",
  {
    apiKey: text("api_key"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    height: integer("height").notNull().default(1024),
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    imageUrl: text("image_url").notNull(),
    model: text("model").notNull().default("black-forest-labs/flux-schnell"),
    negativePrompt: text("negative_prompt"),
    pinned: boolean("pinned").notNull().default(false),
    prompt: text("prompt").notNull(),
    status: text("status").notNull().default("completed"),
    title: text("title"),
    userId: text("user_id").notNull(),
    width: integer("width").notNull().default(1024),
  },
  (table) => ({
    createdAtIdx: index("mprojects_image_generations_created_at_idx").on(
      table.createdAt
    ),
    pinnedIdx: index("mprojects_image_generations_pinned_idx").on(
      table.userId,
      table.pinned
    ),
    userIdIdx: index("mprojects_image_generations_user_id_idx").on(
      table.userId
    ),
  })
);

export type MprojectsImageGenerations = InferSelectModel<
  typeof mprojectsImageGenerations
>;

export const mprojectsApiKeys = pgTable(
  "mprojects_api_keys",
  {
    apiKey: text("api_key").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    id: serial("id").primaryKey(),
    isActive: boolean("is_active").default(true),
    keyName: text("key_name"),
    lastUsedAt: timestamp("last_used_at"),
    maxLimit: integer("max_limit"),
    plan: text("plan"),
    requestCount: integer("request_count").default(0),
    userId: text("user_id").notNull(),
  },
  (table) => ({
    apiKeyIdx: index("mprojects_api_keys_api_key_idx").on(table.apiKey),
    userIdIdx: index("mprojects_api_keys_user_id_idx").on(table.userId),
  })
);

export type MprojectsApiKey = InferSelectModel<typeof mprojectsApiKeys>;

export const mcpServer = pgTable(
  "McpServer",
  {
    args: json("args").notNull().default([]),
    authConfig: json("authConfig").notNull().default({}),
    authType: varchar("authType", {
      enum: ["none", "bearer", "basic", "oauth2", "custom_headers"],
    })
      .notNull()
      .default("none"),
    avgLatencyMs: integer("avgLatencyMs").notNull().default(0),
    callCount: integer("callCount").notNull().default(0),
    command: text("command"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    description: text("description").default(""),
    env: json("env").notNull().default({}),
    headers: json("headers").notNull().default({}),
    icon: text("icon").default("server"),
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    isEnabled: boolean("isEnabled").notNull().default(true),
    lastCallAt: timestamp("lastCallAt"),
    lastSyncAt: timestamp("lastSyncAt"),
    name: text("name").notNull(),
    rateLimitPerMin: integer("rateLimitPerMin").notNull().default(60),
    requireApproval: varchar("requireApproval", {
      enum: ["always_allow", "ask_permission", "write_only"],
    })
      .notNull()
      .default("write_only"),
    // Slug du modèle MCP d'origine (ex : « github »), vide pour un serveur
    // ajouté à la main. Unique par utilisateur : installer deux fois le même
    // modèle réutilise le serveur existant (voir lib/mcp-templates/install).
    templateId: text("templateId"),
    timeoutMs: integer("timeoutMs").notNull().default(15_000),
    toolOverrides: json("toolOverrides").notNull().default({}),
    toolsCache: json("toolsCache").notNull().default([]),
    transport: varchar("transport", {
      enum: ["sse", "http", "stdio", "websocket"],
    })
      .notNull()
      .default("sse"),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
    uptimeStatus: varchar("uptimeStatus", { length: 20 })
      .notNull()
      .default("unknown"),
    url: text("url"),
    userId: text("userId").notNull(),
  },
  (table) => ({
    userEnabledIdx: index("McpServer_userId_isEnabled_idx").on(
      table.userId,
      table.isEnabled
    ),
    userIdIdx: index("McpServer_userId_idx").on(table.userId),
  })
);

export type McpServer = InferSelectModel<typeof mcpServer>;

export const mcpLog = pgTable(
  "McpLog",
  {
    actionType: varchar("actionType", {
      enum: ["read", "write", "delete", "execute", "other"],
    })
      .notNull()
      .default("read"),
    approvalStatus: varchar("approvalStatus", {
      enum: ["pending", "approved", "denied", "auto_approved"],
    })
      .notNull()
      .default("auto_approved"),
    chatId: uuid("chatId"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    durationMs: integer("durationMs").default(0),
    error: text("error"),
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    inputPayload: json("inputPayload"),
    outputPayload: json("outputPayload"),
    serverId: uuid("serverId").references(() => mcpServer.id, {
      onDelete: "cascade",
    }),
    serverName: text("serverName").notNull(),
    toolName: text("toolName").notNull(),
    userId: text("userId").notNull(),
  },
  (table) => ({
    createdAtIdx: index("McpLog_createdAt_idx").on(table.createdAt),
    serverIdIdx: index("McpLog_serverId_idx").on(table.serverId),
    userIdIdx: index("McpLog_userId_idx").on(table.userId),
  })
);

export type McpLog = InferSelectModel<typeof mcpLog>;

export const notification = pgTable(
  "Notification",
  {
    body: text("body"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    dedupeKey: text("dedupeKey"),
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    isRead: boolean("isRead").notNull().default(false),
    link: text("link"),
    title: text("title").notNull(),
    type: varchar("type", {
      enum: [
        "ai_response",
        "project_created",
        "mcp_created",
        "mcp_access_request",
        "news",
        "planning_task_completed",
        "project_member_joined",
        "quota_warning",
        "agent_run_finished",
        "agent_run_failed",
        "agent_approval_required",
        "agent_user_input_required",
      ],
    }).notNull(),
    userId: text("userId").notNull(),
  },
  (table) => ({
    createdAtIdx: index("Notification_createdAt_idx").on(table.createdAt),
    dedupeUnique: uniqueIndex("Notification_userId_dedupeKey_key").on(
      table.userId,
      table.dedupeKey
    ),
    userIdIdx: index("Notification_userId_idx").on(table.userId),
    userReadIdx: index("Notification_userId_isRead_idx").on(
      table.userId,
      table.isRead
    ),
    userTypeIdx: index("Notification_userId_type_idx").on(
      table.userId,
      table.type
    ),
  })
);

export type Notification = InferSelectModel<typeof notification>;

export const userNotificationPrefs = pgTable("user_notification_prefs", {
  // Canaux Agent : in-app est toujours actif pour les événements importants ;
  // email et push restent désactivés tant que l'infrastructure mAI n'est pas
  // confirmée (aucune clé utilisateur, jamais les connexions Gmail).
  agentApprovalRequired: boolean("agentApprovalRequired")
    .notNull()
    .default(true),
  agentEmailEnabled: boolean("agentEmailEnabled").notNull().default(false),
  agentPushEnabled: boolean("agentPushEnabled").notNull().default(false),
  agentRunFailed: boolean("agentRunFailed").notNull().default(true),
  agentRunFinished: boolean("agentRunFinished").notNull().default(true),
  agentUserInputRequired: boolean("agentUserInputRequired")
    .notNull()
    .default(true),
  aiResponse: boolean("aiResponse").notNull().default(true),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  enabled: boolean("enabled").notNull().default(false),
  mcpAccessRequest: boolean("mcpAccessRequest").notNull().default(true),
  mcpCreated: boolean("mcpCreated").notNull().default(true),
  news: boolean("news").notNull().default(true),
  planningTaskCompleted: boolean("planningTaskCompleted")
    .notNull()
    .default(true),
  projectCreated: boolean("projectCreated").notNull().default(true),
  quotaWarning: boolean("quotaWarning").notNull().default(true),
  regenerateMode: varchar("regenerateMode", {
    enum: ["truncate", "fork"],
  })
    .notNull()
    .default("truncate"),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  userId: text("userId").primaryKey().notNull(),
});

export type UserNotificationPrefs = InferSelectModel<
  typeof userNotificationPrefs
>;

export const userPreferences = pgTable("user_preferences", {
  customInstructions: text("customInstructions").notNull().default(""),
  customInstructionsEnabled: boolean("customInstructionsEnabled")
    .notNull()
    .default(false),
  defaultAgentId: uuid("defaultAgentId"),
  // Application ouverte par défaut (menu favori) : mAI, Site, Vibe ou Code.
  // Catalogue et normalisation fail-safe : lib/apps/catalog.ts.
  defaultApp: varchar("defaultApp", { length: 20 }).notNull().default("mai"),
  defaultAudioModel: text("defaultAudioModel")
    .notNull()
    .default("deepgram/flux-tts:free"),
  defaultAudioSpeed: doublePrecision("defaultAudioSpeed")
    .notNull()
    .default(1.0),
  defaultAudioVoice: varchar("defaultAudioVoice", { length: 100 })
    .notNull()
    .default("flux-alexis-en"),
  defaultChatModel: text("defaultChatModel"),
  defaultChatVisibility: varchar("defaultChatVisibility", { length: 20 })
    .notNull()
    .default("private"),
  // Mode ouvert au clic sur Création ; les anciennes préférences restent valides.
  defaultCreationMode: varchar("defaultCreationMode", { length: 20 })
    .notNull()
    .default("image"),
  // Locale BCP-47 de la dictée vocale ; `auto` = langue du navigateur.
  // Liste de référence et repli : lib/i18n/languages.ts.
  defaultDictationLanguage: varchar("defaultDictationLanguage", { length: 20 })
    .notNull()
    .default("auto"),
  defaultImageModel: text("defaultImageModel")
    .notNull()
    .default("black-forest-labs/flux-schnell"),
  defaultImageSize: varchar("defaultImageSize", { length: 50 })
    .notNull()
    .default("1024x1024"),
  defaultTemperature: doublePrecision("defaultTemperature")
    .notNull()
    .default(0.7),
  defaultTopP: doublePrecision("defaultTopP").notNull().default(0.9),
  // Cible DeepL du bouton « Traduire » sur une réponse de l'IA.
  defaultTranslationLanguage: varchar("defaultTranslationLanguage", {
    length: 10,
  })
    .notNull()
    .default("EN"),
  ghostMemoryEnabled: boolean("ghostMemoryEnabled").notNull().default(false),
  showAgentChatIcons: boolean("showAgentChatIcons").notNull().default(true),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  userId: text("userId").primaryKey().notNull(),
});

export type UserPreferences = InferSelectModel<typeof userPreferences>;

// Tables historiques des catalogues de modèles, alimentées par d'anciens
// fichiers de seed supprimés. Les catalogues sont désormais statiques et
// versionnés (lib/skill-templates, lib/mcp-templates) : ces tables ne sont plus
// lues ni écrites, et sont conservées uniquement pour ne pas casser les
// environnements existants (voir migration 0019).
export const skillTemplate = pgTable(
  "SkillTemplate",
  {
    color: varchar("color", { length: 7 }).default("#6366f1"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    description: text("description").default(""),
    icon: text("icon").default("sparkles"),
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    instructions: text("instructions").notNull().default(""),
    isPublic: boolean("isPublic").notNull().default(true),
    name: text("name").notNull(),
    parameters: json("parameters").notNull().default([]),
    tags: text("tags").array().notNull().default([]),
    tools: json("tools").notNull().default([]),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => ({
    isPublicIdx: index("SkillTemplate_isPublic_idx").on(table.isPublic),
    nameIdx: index("SkillTemplate_name_idx").on(table.name),
  })
);
export type SkillTemplate = InferSelectModel<typeof skillTemplate>;

export const mcpTemplate = pgTable(
  "McpTemplate",
  {
    args: text("args"),
    authType: varchar("authType", {
      enum: ["none", "bearer", "basic", "oauth2", "custom_headers"],
    }).default("none"),
    command: text("command"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    description: text("description").default(""),
    icon: text("icon").default("server"),
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    isPublic: boolean("isPublic").notNull().default(true),
    name: text("name").notNull(),
    tags: text("tags").array().notNull().default([]),
    transport: varchar("transport", {
      enum: ["sse", "http", "stdio", "websocket"],
    }).default("sse"),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
    url: text("url"),
  },
  (table) => ({
    isPublicIdx: index("McpTemplate_isPublic_idx").on(table.isPublic),
    nameIdx: index("McpTemplate_name_idx").on(table.name),
  })
);
export type McpTemplate = InferSelectModel<typeof mcpTemplate>;

export const mcpServerSecret = pgTable(
  "mcp_server_secret",
  {
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    encryptedValue: text("encryptedValue").notNull(),
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    key: text("key").notNull(),
    kind: varchar("kind", { enum: ["env", "auth", "header"] }).notNull(),
    serverId: uuid("serverId")
      .notNull()
      .references(() => mcpServer.id, { onDelete: "cascade" }),
    userId: text("userId").notNull(),
  },
  (table) => ({
    kindIdx: index("mcp_server_secret_kind_idx").on(table.kind),
    serverIdIdx: index("mcp_server_secret_serverId_idx").on(table.serverId),
    unique: index("mcp_server_secret_unique_idx").on(
      table.serverId,
      table.kind,
      table.key
    ),
    userIdIdx: index("mcp_server_secret_userId_idx").on(table.userId),
  })
);
export type McpServerSecret = InferSelectModel<typeof mcpServerSecret>;

export const userMcpPrefs = pgTable("user_mcp_prefs", {
  allowStdio: boolean("allowStdio").notNull().default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  defaultRateLimitPerMin: integer("defaultRateLimitPerMin")
    .notNull()
    .default(60),
  defaultRequireApproval: varchar("defaultRequireApproval", {
    enum: ["always_allow", "write_only", "ask_permission"],
  })
    .notNull()
    .default("write_only"),
  defaultTimeoutMs: integer("defaultTimeoutMs").notNull().default(15_000),
  globalKillSwitch: boolean("globalKillSwitch").notNull().default(false),
  retentionDays: integer("retentionDays").notNull().default(30),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  userId: text("userId").primaryKey().notNull(),
});
export type UserMcpPrefs = InferSelectModel<typeof userMcpPrefs>;

export const pluginInstallation = pgTable(
  "PluginInstallation",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    installedAt: timestamp("installedAt").notNull().defaultNow(),
    isEnabled: boolean("isEnabled").notNull().default(true),
    pluginId: varchar("pluginId", { length: 64 }).notNull(),
    settings: json("settings").notNull().default({}),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
    userId: text("userId").notNull(),
    version: varchar("version", { length: 20 }).notNull().default("1.0.0"),
  },
  (table) => ({
    userIdIdx: index("PluginInstallation_userId_idx").on(table.userId),
    userPluginUnique: uniqueIndex("PluginInstallation_userId_pluginId_key").on(
      table.userId,
      table.pluginId
    ),
  })
);

export type PluginInstallation = InferSelectModel<typeof pluginInstallation>;

export const agent = pgTable(
  "Agent",
  {
    cloudFileUrls: json("cloudFileUrls").notNull().default([]),
    color: varchar("color", { length: 7 }).default("#6366f1").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    defaultModelId: text("defaultModelId")
      .notNull()
      .default(DEFAULT_CHAT_MODEL),
    description: varchar("description", { length: 500 }).default(""),
    icon: varchar("icon", { length: 50 }).default("sparkles").notNull(),
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    instructions: text("instructions").notNull().default(""),
    isPublic: boolean("isPublic").notNull().default(false),
    maxTokens: integer("maxTokens"),
    mcpServerIds: json("mcpServerIds").notNull().default([]),
    memoryMode: varchar("memoryMode", { length: 10 })
      .notNull()
      .default("global"),
    name: varchar("name", { length: 100 }).notNull(),
    pinned: boolean("pinned").notNull().default(false),
    shareId: text("shareId"),
    skillIds: json("skillIds").notNull().default([]),
    starterPrompts: json("starterPrompts").notNull().default([]),
    temperature: doublePrecision("temperature"),
    topP: doublePrecision("topP"),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
    userId: text("userId").notNull(),
    welcomeMessage: text("welcomeMessage"),
  },
  (table) => ({
    shareIdIdx: index("Agent_shareId_idx").on(table.shareId),
    userCreatedIdx: index("Agent_userId_createdAt_idx").on(
      table.userId,
      table.createdAt
    ),
    userIdIdx: index("Agent_userId_idx").on(table.userId),
  })
);
export type Agent = InferSelectModel<typeof agent>;

export const agentTemplate = pgTable(
  "AgentTemplate",
  {
    color: varchar("color", { length: 7 }).default("#6366f1").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    defaultModelId: text("defaultModelId")
      .default(DEFAULT_CHAT_MODEL)
      .notNull(),
    description: varchar("description", { length: 500 }).default(""),
    icon: varchar("icon", { length: 50 }).default("bot").notNull(),
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    instructions: text("instructions").notNull().default(""),
    isPublic: boolean("isPublic").notNull().default(true),
    mcpServerIds: json("mcpServerIds").default([]),
    name: varchar("name", { length: 100 }).notNull(),
    skillIds: json("skillIds").default([]),
    tags: text("tags").array().notNull().default([]),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => ({
    isPublicIdx: index("AgentTemplate_isPublic_idx").on(table.isPublic),
    // Un nom de modèle d'agent est unique : garantit qu'un rejeu du seed de
    // 0007_agents.sql ne puisse pas dupliquer les modèles (cf. migration 0029).
    nameKey: uniqueIndex("AgentTemplate_name_key").on(table.name),
  })
);
export type AgentTemplate = InferSelectModel<typeof agentTemplate>;

export const userMemory = pgTable(
  "UserMemory",
  {
    agentId: uuid("agentId"),
    content: text("content").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    isEnabled: boolean("isEnabled").notNull().default(true),
    isImportant: boolean("isImportant").notNull().default(false),
    projectId: uuid("projectId"),
    tags: json("tags").$type<string[]>().default([]),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
    userId: text("userId").notNull(),
  },
  (table) => ({
    agentIdIdx: index("UserMemory_agentId_idx").on(table.agentId),
    projectIdIdx: index("UserMemory_projectId_idx").on(table.projectId),
    userIdIdx: index("UserMemory_userId_idx").on(table.userId),
  })
);
export type UserMemory = InferSelectModel<typeof userMemory>;

export const scheduledMessage = pgTable(
  "ScheduledMessage",
  {
    agentId: uuid("agentId").references(() => agent.id, {
      onDelete: "set null",
    }),
    chatId: uuid("chatId").references(() => chat.id, {
      onDelete: "set null",
    }),
    cloudFileUrls: json("cloudFileUrls").notNull().default([]),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    createMode: varchar("createMode", {
      enum: ["new_chat", "existing_chat"],
    })
      .notNull()
      .default("new_chat"),
    customInstructions: text("customInstructions"),
    enabledTools: json("enabledTools").notNull().default([]),
    executedAt: timestamp("executedAt"),
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    lastError: text("lastError"),
    modelId: text("modelId").notNull().default(DEFAULT_CHAT_MODEL),
    prompt: text("prompt").notNull(),
    recurrence: varchar("recurrence", {
      enum: ["none", "daily", "weekly", "monthly"],
    })
      .notNull()
      .default("none"),
    resultChatId: uuid("resultChatId"),
    scheduledAt: timestamp("scheduledAt").notNull(),
    status: varchar("status", {
      enum: ["pending", "processing", "completed", "failed", "cancelled"],
    })
      .notNull()
      .default("pending"),
    temperature: doublePrecision("temperature"),
    title: text("title").notNull().default("Envoi planifié"),
    // Périmètre d'outils de l'exécution planifiée (cf. lib/planning/tool-mode).
    toolMode: varchar("toolMode", {
      enum: ["auto", "plugins", "none"],
    })
      .notNull()
      .default("auto"),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
    userId: text("userId").notNull(),
  },
  (table) => ({
    scheduledAtIdx: index("ScheduledMessage_scheduledAt_idx").on(
      table.scheduledAt
    ),
    statusIdx: index("ScheduledMessage_status_idx").on(table.status),
    statusScheduledIdx: index(
      "ScheduledMessage_userId_status_scheduledAt_idx"
    ).on(table.userId, table.status, table.scheduledAt),
    userIdIdx: index("ScheduledMessage_userId_idx").on(table.userId),
  })
);
export type ScheduledMessage = InferSelectModel<typeof scheduledMessage>;

// ─────────────────────────────────────────────
// Espace Agent : runs, steps, exécutions d'outils et réglages
// ─────────────────────────────────────────────

// Un run = une requête utilisateur exécutée par Agent. Une conversation peut en
// contenir plusieurs. Le run est la source de vérité de l'exécution côté serveur
// (le frontend ne fait que consommer le flux et restaurer l'état).
export const agentRun = pgTable(
  "AgentRun",
  {
    autonomy: varchar("autonomy", {
      enum: ["careful", "standard", "high"],
    })
      .notNull()
      .default("standard"),
    budget: json("budget").$type<AgentExecutionBudget>().notNull().default({
      maxDurationMs: 0,
      maxRetries: 0,
      maxSteps: 0,
      maxToolCalls: 0,
    }),
    chatId: uuid("chatId")
      .notNull()
      .references(() => chat.id, { onDelete: "cascade" }),
    checkpoint: json("checkpoint").$type<AgentRunCheckpoint>(),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    error: text("error"),
    executionLeaseUntil: timestamp("executionLeaseUntil"),
    executionOwner: text("executionOwner"),
    feedbackAt: timestamp("feedbackAt"),
    goalReached: boolean("goalReached"),
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    messageId: text("messageId"),
    model: text("model").notNull(),
    parentRunId: uuid("parentRunId"),
    plan: json("plan").$type<AgentPlan | null>(),
    reasoningLevel: varchar("reasoningLevel", { enum: REASONING_LEVELS })
      .notNull()
      .default("medium"),
    revision: integer("revision").notNull().default(0),
    startedAt: timestamp("startedAt"),
    status: varchar("status", {
      enum: [
        "queued",
        "running",
        "waiting_for_tool",
        "waiting_for_approval",
        "waiting_for_user",
        "completed",
        "failed",
        "cancelled",
        "timed_out",
      ],
    })
      .notNull()
      .default("queued"),
    stepCount: integer("stepCount").notNull().default(0),
    stopReason: text("stopReason"),
    suggestedActions: json("suggestedActions")
      .$type<unknown[]>()
      .notNull()
      .default([]),
    // L'utilisateur a explicitement activé l'option « Tâches » sur ce run. Le
    // plan existe toujours côté modèle (cadrage des tâches longues), mais la
    // liste n'est rendue que si ce drapeau est vrai — y compris après un
    // refresh, où l'interface se reconstruit depuis AgentRun.
    tasksEnabled: boolean("tasksEnabled").notNull().default(false),
    toolCallCount: integer("toolCallCount").notNull().default(0),
    toolPolicySnapshot: json("toolPolicySnapshot")
      .$type<Record<string, ToolPermission>>()
      .notNull()
      .default({}),
    usage: json("usage")
      .$type<AgentRunUsage | AgentRunUsageNormalized>()
      .notNull()
      .default({}),
    useful: boolean("useful"),
    userId: text("userId").notNull(),
  },
  (table) => ({
    chatIdIdx: index("AgentRun_chatId_idx").on(table.chatId),
    createdAtIdx: index("AgentRun_createdAt_idx").on(table.createdAt),
    parentRunFk: foreignKey({
      columns: [table.parentRunId],
      foreignColumns: [table.id],
      name: "AgentRun_parentRunId_fkey",
    }).onDelete("set null"),
    userStatusIdx: index("AgentRun_userId_status_idx").on(
      table.userId,
      table.status
    ),
  })
);

export type AgentRun = InferSelectModel<typeof agentRun>;

// Chaque action importante du run devient un step visible (jamais de
// chain-of-thought : uniquement action, outil, progression, résultat utile).
export const agentStep = pgTable(
  "AgentStep",
  {
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    index: integer("index").notNull().default(0),
    runId: uuid("runId")
      .notNull()
      .references(() => agentRun.id, { onDelete: "cascade" }),
    status: varchar("status", {
      enum: ["pending", "running", "completed", "failed", "skipped"],
    })
      .notNull()
      .default("pending"),
    summary: text("summary"),
    title: text("title").notNull(),
    toolExecutionId: uuid("toolExecutionId"),
    type: varchar("type", {
      enum: [
        "planning",
        "tool_call",
        "tool_result",
        "artifact",
        "message",
        "verification",
        "error",
        "user_input_request",
        "user_input_answer",
        "approval_request",
      ],
    }).notNull(),
  },
  (table) => ({
    runIndexIdx: index("AgentStep_runId_index_idx").on(
      table.runId,
      table.index
    ),
  })
);

export type AgentStep = InferSelectModel<typeof agentStep>;

// Appels d'outils : entrée, sortie, statut, durée. Les secrets et identifiants
// ne sont jamais journalisés ici.
export const toolExecution = pgTable(
  "ToolExecution",
  {
    approvalStatus: varchar("approvalStatus", {
      enum: ["not_required", "pending", "approved", "denied"],
    })
      .notNull()
      .default("not_required"),
    // Tentatives : chaque retry est une ligne liée à sa tentative parente.
    attempt: integer("attempt").notNull().default(1),
    category: varchar("category", {
      enum: [
        "web",
        "files",
        "library",
        "project",
        "internal",
        "artifact",
        "plugins",
        "mcp",
        "skills",
      ],
    })
      .notNull()
      .default("internal"),
    // Chemin CHAT (migration 0036). `runId` valant NULL, la ligne décrit un
    // appel d'outil effectué dans une conversation et non dans un run Agent :
    // c'est ce qui permet de compter les plugins utilisés en mode Chat. La
    // conversation est un pointeur souple — sans clé étrangère, pour qu'une
    // suppression ne fasse pas disparaître l'historique d'appels, comme pour
    // `UsageEvent.chatId`.
    chatId: uuid("chatId"),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    durationMs: integer("durationMs"),
    error: text("error"),
    errorCategory: varchar("errorCategory", { length: 32 }),
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    input: json("input").$type<unknown>(),
    operationKey: text("operationKey"),
    output: json("output").$type<unknown>(),
    parentExecutionId: uuid("parentExecutionId"),
    retryAfterMs: integer("retryAfterMs"),
    retryable: boolean("retryable").notNull().default(false),
    // Nullable depuis la migration 0036 : `NULL` identifie une exécution du
    // chemin Chat, qui n'appartient à aucun run. La clé étrangère est
    // conservée — une valeur présente pointe toujours un run existant, et la
    // suppression du run supprime toujours ses exécutions.
    runId: uuid("runId").references(() => agentRun.id, { onDelete: "cascade" }),
    startedAt: timestamp("startedAt"),
    status: varchar("status", {
      enum: ["running", "completed", "failed", "denied", "cancelled"],
    })
      .notNull()
      .default("running"),
    stepId: uuid("stepId"),
    toolId: text("toolId").notNull(),
    userId: text("userId"),
  },
  (table) => ({
    operationUnique: uniqueIndex(
      "ToolExecution_runId_operationKey_attempt_key"
    ).on(table.runId, table.operationKey, table.attempt),
    runIdIdx: index("ToolExecution_runId_idx").on(table.runId),
    toolIdIdx: index("ToolExecution_toolId_idx").on(table.toolId),
    // Lecture « mes appels d'outils sur la période », tous chemins confondus.
    userCreatedIdx: index("ToolExecution_userId_createdAt_idx").on(
      table.userId,
      table.createdAt
    ),
  })
);

export type ToolExecution = InferSelectModel<typeof toolExecution>;

// Paramètres Agent (1 ligne par utilisateur), onglet « Agent » de /settings.
export const agentSettings = pgTable("AgentSettings", {
  autonomy: varchar("autonomy", {
    enum: ["careful", "standard", "high"],
  })
    .notNull()
    .default("standard"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  // Écran chargé à chaque arrivée sur la page d'accueil. "agent" n'est
  // proposé qu'aux comptes qui y ont droit (cf. /api/agent/settings PATCH).
  defaultMode: varchar("defaultMode", { enum: AGENT_MODES })
    .notNull()
    .default("chat"),
  defaultModel: text("defaultModel"),
  defaultProjectId: uuid("defaultProjectId"),
  enabledCategories: json("enabledCategories")
    .$type<ToolCategory[]>()
    .notNull()
    .default([]),
  reasoningLevel: varchar("reasoningLevel", { enum: REASONING_LEVELS })
    .notNull()
    .default("medium"),
  toolPolicies: json("toolPolicies")
    .$type<Record<string, ToolPermission>>()
    .notNull()
    .default({}),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  userId: text("userId").primaryKey().notNull(),
});

export type AgentSettings = InferSelectModel<typeof agentSettings>;

// ---------------------------------------------------------------------------
// Fondations Agent (migration 0017) : tâches planifiées, occurrences,
// approbations persistantes, instructions de réorientation.
// ---------------------------------------------------------------------------

// Tâche planifiée Agent : règle en heure LOCALE + fuseau IANA. La prochaine
// échéance est recalculée depuis la règle et le fuseau (jamais une suite de
// dates UTC). Suppression LOGIQUE : les runs passés restent consultables.
export const agentSchedule = pgTable(
  "AgentSchedule",
  {
    agentId: uuid("agentId"),
    config: json("config").$type<AgentScheduleRecord["config"]>().notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    deletedAt: timestamp("deletedAt"),
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    instructions: text("instructions").notNull(),
    lastError: text("lastError"),
    lastRunAt: timestamp("lastRunAt"),
    modelId: text("modelId").notNull(),
    nextDueAt: timestamp("nextDueAt").notNull(),
    projectId: uuid("projectId"),
    revision: integer("revision").notNull().default(0),
    rule: json("rule").$type<ScheduleRule>().notNull(),
    status: varchar("status", {
      enum: ["active", "paused", "deleted"],
    })
      .notNull()
      .default("active"),
    timezone: varchar("timezone", { length: 64 }).notNull(),
    title: text("title").notNull(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
    userId: text("userId").notNull(),
  },
  (table) => ({
    // File d'attente du scheduler : échéances dues, par worker.
    dueIdx: index("AgentSchedule_status_nextDueAt_idx").on(
      table.status,
      table.nextDueAt
    ),
    userIdIdx: index("AgentSchedule_userId_idx").on(table.userId),
  })
);

export type AgentSchedule = InferSelectModel<typeof agentSchedule>;

export const agentScheduleVersion = pgTable(
  "AgentScheduleVersion",
  {
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    revision: integer("revision").notNull(),
    scheduleId: uuid("scheduleId")
      .notNull()
      .references(() => agentSchedule.id, { onDelete: "cascade" }),
    snapshot: json("snapshot").$type<AgentScheduleRecord>().notNull(),
    userId: text("userId").notNull(),
  },
  (table) => ({
    scheduleRevisionUnique: uniqueIndex(
      "AgentScheduleVersion_schedule_revision_key"
    ).on(table.scheduleId, table.revision),
  })
);

export type AgentScheduleVersion = InferSelectModel<
  typeof agentScheduleVersion
>;

// Une exécution prévue. UNIQUE(scheduleId, dueAt) garantit l'idempotence : un
// tick rejoué ou deux workers concurrents ne créent jamais deux occurrences.
export const agentScheduleOccurrence = pgTable(
  "AgentScheduleOccurrence",
  {
    attempt: integer("attempt").notNull().default(0),
    claimedAt: timestamp("claimedAt"),
    claimedBy: varchar("claimedBy", { length: 128 }),
    dueAt: timestamp("dueAt").notNull(),
    finishedAt: timestamp("finishedAt"),
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    // Lease anti-double-exécution : expirée => reprise après crash.
    leaseUntil: timestamp("leaseUntil"),
    runId: uuid("runId").references(() => agentRun.id, {
      onDelete: "set null",
    }),
    scheduleId: uuid("scheduleId")
      .notNull()
      .references(() => agentSchedule.id, { onDelete: "cascade" }),
    scheduleVersionId: uuid("scheduleVersionId").references(
      () => agentScheduleVersion.id,
      { onDelete: "set null" }
    ),
    status: varchar("status", {
      enum: [
        "pending",
        "claimed",
        "running",
        "waiting",
        "completed",
        "failed",
        "skipped",
      ],
    })
      .notNull()
      .default("pending"),
  },
  (table) => ({
    claimIdx: index("AgentScheduleOccurrence_status_leaseUntil_idx").on(
      table.status,
      table.leaseUntil
    ),
    occurrenceUnique: uniqueIndex(
      "AgentScheduleOccurrence_scheduleId_dueAt_key"
    ).on(table.scheduleId, table.dueAt),
    runIdIdx: index("AgentScheduleOccurrence_runId_idx").on(table.runId),
  })
);

export type AgentScheduleOccurrence = InferSelectModel<
  typeof agentScheduleOccurrence
>;

// Approbation persistante liée à un appel d'outil et à SES paramètres exacts
// (hash sha256 canonique) : toute modification de paramètres l'invalide.
export const approvalRequest = pgTable(
  "ApprovalRequest",
  {
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    decidedAt: timestamp("decidedAt"),
    denyReason: text("denyReason"),
    expiresAt: timestamp("expiresAt").notNull(),
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    params: json("params").$type<Record<string, unknown>>().notNull(),
    paramsHash: varchar("paramsHash", { length: 64 }).notNull(),
    runId: uuid("runId")
      .notNull()
      .references(() => agentRun.id, { onDelete: "cascade" }),
    status: varchar("status", {
      enum: ["pending", "approved", "denied", "expired"],
    })
      .notNull()
      .default("pending"),
    stepId: uuid("stepId"),
    // Identifiant de l'appel d'outil côté fournisseur : une demande par appel,
    // relue à la reprise sans dépendre de ce que transmet le client.
    toolCallId: text("toolCallId"),
    toolExecutionId: uuid("toolExecutionId"),
    toolId: text("toolId").notNull(),
  },
  (table) => ({
    pendingIdx: index("ApprovalRequest_runId_status_idx").on(
      table.runId,
      table.status
    ),
    toolCallIdx: uniqueIndex("ApprovalRequest_runId_toolCallId_key").on(
      table.runId,
      table.toolCallId
    ),
  })
);

export type ApprovalRequest = InferSelectModel<typeof approvalRequest>;

// Réorientations utilisateur : file ORDONNÉE (seq) appliquée au prochain
// point sûr, protégée par la révision optimiste du run.
export const agentRunInstruction = pgTable(
  "AgentRunInstruction",
  {
    appliedAt: timestamp("appliedAt"),
    appliedStepIndex: integer("appliedStepIndex"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    runId: uuid("runId")
      .notNull()
      .references(() => agentRun.id, { onDelete: "cascade" }),
    seq: integer("seq").notNull(),
    status: varchar("status", {
      enum: ["pending", "applied", "discarded"],
    })
      .notNull()
      .default("pending"),
    stopRequested: boolean("stopRequested").notNull().default(false),
    text: text("text").notNull(),
  },
  (table) => ({
    pendingIdx: index("AgentRunInstruction_runId_status_seq_idx").on(
      table.runId,
      table.status,
      table.seq
    ),
  })
);

export type AgentRunInstruction = InferSelectModel<typeof agentRunInstruction>;

// Questionnaire posé par un outil d'attente utilisateur (ask_user) : les
// questions servent de contrat validé côté serveur, et la réponse est liée au
// ToolCall exact. Après refresh ou fermeture de l'application, la demande et sa
// réponse restent lisibles ; la réponse est validée puis réinjectée dans le
// même AgentRun.
export const agentUserInputRequest = pgTable(
  "AgentUserInputRequest",
  {
    answeredAt: timestamp("answeredAt"),
    answeredBy: text("answeredBy"),
    answers: json("answers").$type<unknown>(),
    chatId: uuid("chatId").notNull(),
    context: text("context"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    expiresAt: timestamp("expiresAt").notNull(),
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    questions: json("questions").$type<unknown>().notNull(),
    // Empreinte canonique des questions affichées : le questionnaire ne peut
    // pas être modifié après présentation sans invalider la réponse.
    questionsHash: varchar("questionsHash", { length: 64 }).notNull(),
    revision: integer("revision").notNull().default(0),
    runId: uuid("runId")
      .notNull()
      .references(() => agentRun.id, { onDelete: "cascade" }),
    status: varchar("status", {
      enum: ["pending", "answered", "expired", "cancelled"],
    })
      .notNull()
      .default("pending"),
    stepId: uuid("stepId"),
    title: text("title").notNull(),
    toolCallId: text("toolCallId").notNull(),
    toolExecutionId: uuid("toolExecutionId"),
    toolId: text("toolId").notNull(),
  },
  (table) => ({
    chatStatusIdx: index("AgentUserInputRequest_chatId_status_idx").on(
      table.chatId,
      table.status
    ),
    runStatusIdx: index("AgentUserInputRequest_runId_status_idx").on(
      table.runId,
      table.status
    ),
    toolExecutionKey: uniqueIndex(
      "AgentUserInputRequest_toolExecutionId_key"
    ).on(table.toolExecutionId),
  })
);

export type AgentUserInputRequest = InferSelectModel<
  typeof agentUserInputRequest
>;
// ============================================================================
// WAKIES — port de l'application Wakies (apps/wakies) sous /wakies
// ============================================================================
//
// Le gabarit d'origine est mono-utilisateur : un `OWNER_TOKEN` bearer, une
// base SQLite par installation, et un `ownerId` fixe. Intégré à mAI, chaque
// ligne porte donc `userId` — le compte mAI — et aucune requête ne s'en passe
// sans le vérifier côté serveur : c'est le seul moyen qu'un compte ne voie pas
// les espaces, Wakies, pages ou conversations d'un autre.
//
// Ces tables sont DÉDIÉES (`Wakies*`) et ne réutilisent ni `Project` ni
// `Agent` : le modèle Wakies (espaces, Wakies, pages, conversations, tâches
// récurrentes, mémoires) a ses propres règles — accès par espace, révision de
// page, baux d'exécution — et les coupler aux tables de l'hôte ferait porter
// ces règles aux projets et agents existants. Le préfixe rend la frontière
// explicite et l'isolement lisible d'un `grep`.
//
// `WakiesSettings` est UNIQUE PAR COMPTE (clé `userId`) : les réglages du
// gabarit tenaient dans une ligne globale, ce qui n'a pas de sens dès que
// plusieurs comptes partagent la base.

export const wakiesSettings = pgTable("WakiesSettings", {
  memoryAllowed: boolean("memoryAllowed").notNull().default(true),
  name: varchar("name", { length: 40 }).notNull().default("Wakie"),
  paused: boolean("paused").notNull().default(false),
  researchAllowed: boolean("researchAllowed").notNull().default(true),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  userId: text("userId").notNull().primaryKey(),
});
export type WakiesSettings = InferSelectModel<typeof wakiesSettings>;

/** Espace de travail : un dossier de pages, plusieurs Wakies y ont accès. */
export const wakiesSpace = pgTable(
  "WakiesSpace",
  {
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    description: text("description").notNull().default(""),
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    name: varchar("name", { length: 60 }).notNull(),
    userId: text("userId").notNull(),
  },
  (table) => ({
    userCreatedIdx: index("WakiesSpace_userId_createdAt_idx").on(
      table.userId,
      table.createdAt
    ),
  })
);
export type WakiesSpace = InferSelectModel<typeof wakiesSpace>;

/**
 * Un Wakie : l'agent spécialiste du gabarit (nom, rôle, outils autorisés).
 * `spaceId` est sa destination PAR DÉFAUT pour les pages enregistrées, pas une
 * propriété : l'accès réel passe par `WakiesWakieSpace`.
 */
export const wakiesWakie = pgTable(
  "WakiesWakie",
  {
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    instructions: text("instructions").notNull().default(""),
    // Conteneur d'apprentissage Intelligence : hors périmètre du port (le
    // service n'est pas branché). La colonne est conservée pour ne pas perdre
    // la donnée si un jour un compte l'exploite.
    learningContainerId: text("learningContainerId"),
    memoryAllowed: boolean("memoryAllowed").notNull().default(true),
    name: varchar("name", { length: 40 }).notNull(),
    researchAllowed: boolean("researchAllowed").notNull().default(true),
    skillDeliveryEnabled: boolean("skillDeliveryEnabled")
      .notNull()
      .default(false),
    spaceId: uuid("spaceId").references(() => wakiesSpace.id, {
      onDelete: "cascade",
    }),
    userId: text("userId").notNull(),
  },
  (table) => ({
    spaceIdx: index("WakiesWakie_spaceId_idx").on(table.spaceId),
    userCreatedIdx: index("WakiesWakie_userId_createdAt_idx").on(
      table.userId,
      table.createdAt
    ),
  })
);
export type WakiesWakie = InferSelectModel<typeof wakiesWakie>;

/** Accès d'un Wakie à un espace (un Wakie accède à plusieurs espaces). */
export const wakiesWakieSpace = pgTable(
  "WakiesWakieSpace",
  {
    spaceId: uuid("spaceId")
      .notNull()
      .references(() => wakiesSpace.id, { onDelete: "cascade" }),
    wakieId: uuid("wakieId")
      .notNull()
      .references(() => wakiesWakie.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.wakieId, table.spaceId] }),
    spaceIdx: index("WakiesWakieSpace_spaceId_idx").on(table.spaceId),
  })
);
export type WakiesWakieSpace = InferSelectModel<typeof wakiesWakieSpace>;

/**
 * Conversation : l'équivalent du « thread » du gabarit. L'identifiant est
 * généré ici (le gabarit le/laissait à Intelligence) et sert de clé aux
 * messages, appels et pages qui s'y rattachent.
 */
export const wakiesConversation = pgTable(
  "WakiesConversation",
  {
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    // Figé à la création : une conversation qui ne participe pas à
    // l'apprentissage y porte `null` DÉFINITIVEMENT.
    learningContainerId: text("learningContainerId"),
    title: varchar("title", { length: 120 }).notNull(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
    userId: text("userId").notNull(),
    wakieId: uuid("wakieId")
      .notNull()
      .references(() => wakiesWakie.id, { onDelete: "cascade" }),
  },
  (table) => ({
    userCreatedIdx: index("WakiesConversation_userId_createdAt_idx").on(
      table.userId,
      table.createdAt
    ),
    wakieIdx: index("WakiesConversation_wakieId_idx").on(table.wakieId),
  })
);
export type WakiesConversation = InferSelectModel<typeof wakiesConversation>;

/**
 * Message de conversation. `parts` porte les parties du protocole UI (AI SDK) :
 * texte, appels d'outils, demandes d'approbation, résultats. L'historique doit
 * se rejouer à l'identique : la forme est donc stockée, pas reconstruite.
 */
export const wakiesMessage = pgTable(
  "WakiesMessage",
  {
    conversationId: uuid("conversationId")
      .notNull()
      .references(() => wakiesConversation.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    id: text("id").notNull().primaryKey(),
    parts: jsonb("parts").$type<unknown>().notNull(),
    role: varchar("role", { length: 16 }).notNull(),
    // Ordre d'écriture : deux messages de la même salve partagent leur
    // horodatage, et l'ordre de lecture doit rester celui de l'envoi.
    seq: serial("seq").notNull(),
  },
  (table) => ({
    conversationSeqIdx: index("WakiesMessage_conversationId_seq_idx").on(
      table.conversationId,
      table.seq
    ),
  })
);
export type WakiesMessage = InferSelectModel<typeof wakiesMessage>;

/** Page d'un espace : document éditable, versionné par `revision`. */
export const wakiesPage = pgTable(
  "WakiesPage",
  {
    content: text("content").notNull().default(""),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    parentId: uuid("parentId"),
    revision: integer("revision").notNull().default(1),
    sourceConversationId: uuid("sourceConversationId"),
    spaceId: uuid("spaceId")
      .notNull()
      .references(() => wakiesSpace.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 160 }).notNull(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
    userId: text("userId").notNull(),
  },
  (table) => ({
    parentIdx: index("WakiesPage_parentId_idx").on(table.parentId),
    spaceCreatedIdx: index("WakiesPage_spaceId_createdAt_idx").on(
      table.spaceId,
      table.createdAt
    ),
    userIdx: index("WakiesPage_userId_idx").on(table.userId),
  })
);
export type WakiesPage = InferSelectModel<typeof wakiesPage>;

/**
 * Conversation attachée à une page pour un Wakie donné.
 *
 * `ready` distingue une conversation « chauffée » (elle connaît la page) d'une
 * conversation simplement liée ; `leaseUntil` réserve la création le temps de
 * l'initialisation, pour que deux onglets ouverts ensemble n'en lancent pas
 * deux.
 */
export const wakiesPageConversation = pgTable(
  "WakiesPageConversation",
  {
    conversationId: uuid("conversationId")
      .notNull()
      .references(() => wakiesConversation.id, { onDelete: "cascade" }),
    leaseUntil: timestamp("leaseUntil").notNull().defaultNow(),
    pageId: uuid("pageId")
      .notNull()
      .references(() => wakiesPage.id, { onDelete: "cascade" }),
    ready: boolean("ready").notNull().default(false),
    wakieId: uuid("wakieId")
      .notNull()
      .references(() => wakiesWakie.id, { onDelete: "cascade" }),
  },
  (table) => ({
    conversationKey: uniqueIndex(
      "WakiesPageConversation_conversationId_key"
    ).on(table.conversationId),
    pk: primaryKey({ columns: [table.pageId, table.wakieId] }),
  })
);
export type WakiesPageConversation = InferSelectModel<
  typeof wakiesPageConversation
>;

/**
 * Reçu de revue : garantit qu'un « Approuver et enregistrer » répété ne crée
 * pas deux pages (la clé est la conversation plus l'appel d'outil).
 */
export const wakiesPageReview = pgTable(
  "WakiesPageReview",
  {
    conversationId: uuid("conversationId").notNull(),
    pageId: uuid("pageId")
      .notNull()
      .references(() => wakiesPage.id, { onDelete: "cascade" }),
    spaceId: uuid("spaceId")
      .notNull()
      .references(() => wakiesSpace.id, { onDelete: "cascade" }),
    toolCallId: text("toolCallId").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.conversationId, table.toolCallId] }),
  })
);
export type WakiesPageReview = InferSelectModel<typeof wakiesPageReview>;

/** Tâche planifiée : une recherche répétée dans une conversation. */
export const wakiesTask = pgTable(
  "WakiesTask",
  {
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    error: text("error"),
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    // Intervalle de répétition en secondes : la planification est portée par la
    // ligne (le gabarit la recalculait à chaque `nextRunAt`).
    intervalSeconds: integer("intervalSeconds"),
    // Bail d'exécution : le gabarit exécutait dans un `setInterval` du process
    // Node. Ici le tick est une route cron, donc deux exécutions peuvent se
    // croiser ; le bail garantit qu'une seule traite une tâche.
    lease: text("lease"),
    leaseUntil: timestamp("leaseUntil"),
    nextRunAt: timestamp("nextRunAt"),
    prompt: text("prompt").notNull(),
    status: varchar("status", { length: 16 }).notNull().default("queued"),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
    userId: text("userId").notNull(),
  },
  (table) => ({
    dueIdx: index("WakiesTask_status_nextRunAt_idx").on(
      table.status,
      table.nextRunAt
    ),
    userCreatedIdx: index("WakiesTask_userId_createdAt_idx").on(
      table.userId,
      table.createdAt
    ),
  })
);
export type WakiesTask = InferSelectModel<typeof wakiesTask>;

/** Exécution d'une tâche : `id` est le bail, donc une reprise le réutilise. */
export const wakiesTaskRun = pgTable(
  "WakiesTaskRun",
  {
    error: text("error"),
    finishedAt: timestamp("finishedAt"),
    id: text("id").notNull().primaryKey(),
    result: jsonb("result").$type<unknown>(),
    startedAt: timestamp("startedAt").notNull().defaultNow(),
    status: varchar("status", { length: 16 }).notNull().default("running"),
    taskId: uuid("taskId")
      .notNull()
      .references(() => wakiesTask.id, { onDelete: "cascade" }),
  },
  (table) => ({
    taskIdx: index("WakiesTaskRun_taskId_startedAt_idx").on(
      table.taskId,
      table.startedAt
    ),
  })
);
export type WakiesTaskRun = InferSelectModel<typeof wakiesTaskRun>;

/** Journal d'avancement lisible par l'utilisateur (le gabarit l'affichait). */
export const wakiesTaskEvent = pgTable(
  "WakiesTaskEvent",
  {
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    id: serial("id").primaryKey().notNull(),
    runId: text("runId"),
    taskId: uuid("taskId")
      .notNull()
      .references(() => wakiesTask.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
  },
  (table) => ({
    taskIdx: index("WakiesTaskEvent_taskId_id_idx").on(table.taskId, table.id),
  })
);
export type WakiesTaskEvent = InferSelectModel<typeof wakiesTaskEvent>;

/** Conversation dans laquelle une tâche récurrente s'exécute. */
export const wakiesTaskConversation = pgTable(
  "WakiesTaskConversation",
  {
    conversationId: uuid("conversationId")
      .notNull()
      .references(() => wakiesConversation.id, { onDelete: "cascade" }),
    taskId: uuid("taskId")
      .notNull()
      .primaryKey()
      .references(() => wakiesTask.id, { onDelete: "cascade" }),
  },
  (table) => ({
    conversationIdx: index("WakiesTaskConversation_conversationId_idx").on(
      table.conversationId
    ),
  })
);
export type WakiesTaskConversation = InferSelectModel<
  typeof wakiesTaskConversation
>;

/** Mémoire du compte : préférences et contexte qui nourrissent la recherche. */
export const wakiesMemory = pgTable(
  "WakiesMemory",
  {
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    text: text("text").notNull(),
    userId: text("userId").notNull(),
  },
  (table) => ({
    userCreatedIdx: index("WakiesMemory_userId_createdAt_idx").on(
      table.userId,
      table.createdAt
    ),
  })
);
export type WakiesMemory = InferSelectModel<typeof wakiesMemory>;

/** Reçu d'appel vocal : la transcription est conservée pour la reprise. */
export const wakiesCall = pgTable(
  "WakiesCall",
  {
    // Message auquel l'appel est ancré : il s'affiche alors dans la
    // conversation au lieu de flotter en tête de fil.
    anchorMessageId: text("anchorMessageId"),
    conversationId: uuid("conversationId")
      .notNull()
      .references(() => wakiesConversation.id, { onDelete: "cascade" }),
    endedAt: timestamp("endedAt"),
    error: text("error"),
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    startedAt: timestamp("startedAt").notNull().defaultNow(),
    status: varchar("status", { length: 16 }).notNull().default("connecting"),
    transcript: text("transcript").notNull().default(""),
    userId: text("userId").notNull(),
  },
  (table) => ({
    conversationIdx: index("WakiesCall_conversationId_startedAt_idx").on(
      table.conversationId,
      table.startedAt
    ),
    userIdx: index("WakiesCall_userId_idx").on(table.userId),
  })
);
export type WakiesCall = InferSelectModel<typeof wakiesCall>;

/**
 * Capture d'une conversation (résultat mis de côté par le Wakie).
 * Le gabarit la stockait en JSON texte ; ici elle reste un JSONB opaque.
 */
export const wakiesCapture = pgTable("WakiesCapture", {
  conversationId: uuid("conversationId")
    .notNull()
    .primaryKey()
    .references(() => wakiesConversation.id, { onDelete: "cascade" }),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  value: jsonb("value").$type<unknown>(),
});
export type WakiesCapture = InferSelectModel<typeof wakiesCapture>;
