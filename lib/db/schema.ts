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

export const chat = pgTable(
  "Chat",
  {
    archivedAt: timestamp("archivedAt"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    customInstructions: text("customInstructions"),
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    isArchived: boolean("isArchived").notNull().default(false),
    modeId: varchar("modeId", { length: 20 }).default("standard"),
    pinned: boolean("pinned").notNull().default(false),
    projectId: uuid("projectId").references(() => project.id, {
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
    userWeekUnique: uniqueIndex("weekly_speech_usage_user_week_idx").on(
      table.userId,
      table.weekStart
    ),
    userIdIdx: index("weekly_speech_usage_user_id_idx").on(table.userId),
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
    status: text("status").notNull().default("completed"),
    tokensCount: integer("tokens_count").notNull().default(0),
    userId: text("user_id").notNull(),
    voice: text("voice").default("flux-alexis-en"),
  },
  (table) => ({
    createdAtIdx: index("mprojects_speech_generations_created_at_idx").on(
      table.createdAt
    ),
    userIdIdx: index("mprojects_speech_generations_user_id_idx").on(
      table.userId
    ),
  })
);

export type MprojectsSpeechGenerations = InferSelectModel<
  typeof mprojectsSpeechGenerations
>;
