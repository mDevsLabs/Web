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
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

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
    templateId: uuid("templateId"),
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

export const message = pgTable("Message_v2", {
  attachments: json("attachments").notNull().default([]),
  chatId: uuid("chatId")
    .notNull()
    .references(() => chat.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  id: text("id").primaryKey().notNull(),
  parts: json("parts").notNull(),
  role: varchar("role").notNull(),
});

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
    title: text("title").notNull(),
    userId: text("userId").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id, table.createdAt] }),
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
    chatRef: foreignKey({
      columns: [table.chatId],
      foreignColumns: [chat.id],
    }),
    pk: primaryKey({ columns: [table.id] }),
  })
);

export type Stream = InferSelectModel<typeof stream>;

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
      ],
    }).notNull(),
    userId: text("userId").notNull(),
  },
  (table) => ({
    createdAtIdx: index("Notification_createdAt_idx").on(table.createdAt),
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
  aiResponse: boolean("aiResponse").notNull().default(true),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  enabled: boolean("enabled").notNull().default(false),
  mcpAccessRequest: boolean("mcpAccessRequest").notNull().default(true),
  mcpCreated: boolean("mcpCreated").notNull().default(true),
  news: boolean("news").notNull().default(true),
  projectCreated: boolean("projectCreated").notNull().default(true),
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
  allowStdio: boolean("allowStdio").notNull().default(true),
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

export const agent = pgTable(
  "Agent",
  {
    cloudFileUrls: json("cloudFileUrls").notNull().default([]),
    color: varchar("color", { length: 7 }).default("#6366f1").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    defaultModelId: text("defaultModelId")
      .notNull()
      .default("google/gemini-2.5-flash"),
    description: varchar("description", { length: 500 }).default(""),
    emoji: varchar("emoji", { length: 10 }),
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
      .default("google/gemini-2.5-flash")
      .notNull(),
    description: varchar("description", { length: 500 }).default(""),
    emoji: varchar("emoji", { length: 10 }),
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
    nameIdx: index("AgentTemplate_name_idx").on(table.name),
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
    projectId: uuid("projectId"),
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
    modelId: text("modelId").notNull().default("google/gemini-2.5-flash"),
    prompt: text("prompt").notNull(),
    resultChatId: uuid("resultChatId"),
    scheduledAt: timestamp("scheduledAt").notNull(),
    status: varchar("status", {
      enum: ["pending", "processing", "completed", "failed", "cancelled"],
    })
      .notNull()
      .default("pending"),
    temperature: doublePrecision("temperature"),
    title: text("title").notNull().default("Envoi planifié"),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
    userId: text("userId").notNull(),
  },
  (table) => ({
    scheduledAtIdx: index("ScheduledMessage_scheduledAt_idx").on(
      table.scheduledAt
    ),
    statusIdx: index("ScheduledMessage_status_idx").on(table.status),
    userIdIdx: index("ScheduledMessage_userId_idx").on(table.userId),
  })
);
export type ScheduledMessage = InferSelectModel<typeof scheduledMessage>;

