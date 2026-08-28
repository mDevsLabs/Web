import { z } from "zod";

const textPartSchema = z.object({
  text: z.string().min(1).max(2000),
  type: z.enum(["text"]),
});

const ALLOWED_MEDIA_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
] as const;

const filePartSchema = z.object({
  mediaType: z
    .string()
    .min(1)
    .max(127)
    .refine(
      (v) =>
        (ALLOWED_MEDIA_TYPES as readonly string[]).includes(v) ||
        v.startsWith("image/") ||
        v.startsWith("text/") ||
        v === "application/pdf" ||
        v === "application/json",
      { message: "Type de fichier non supporté" }
    ),
  name: z.string().min(1).max(255),
  type: z.enum(["file"]),
  url: z.url(),
});

const partSchema = z.union([textPartSchema, filePartSchema]);

const userMessageSchema = z.object({
  id: z.uuid(),
  parts: z.array(partSchema),
  role: z.enum(["user"]),
});

const toolApprovalMessageSchema = z.object({
  id: z.string(),
  parts: z.array(z.record(z.string(), z.unknown())),
  role: z.enum(["user", "assistant"]),
});

export const postRequestBodySchema = z.object({
  agentId: z.string().uuid().nullable().optional(),
  customInstructions: z.string().max(4000).optional(),
  enabledTools: z.array(z.string()).optional().default([]),
  id: z.uuid(),
  isGhostMode: z.boolean().optional().default(false),
  message: userMessageSchema.optional(),
  messages: z.array(toolApprovalMessageSchema).optional(),
  projectId: z.string().uuid().nullable().optional(),
  selectedAgentId: z.string().uuid().nullable().optional(),
  selectedChatMode: z.string().nullable().optional(),
  selectedChatModel: z.string(),
  selectedVisibilityType: z.enum(["public", "private"]),
  skillId: z.string().uuid().nullable().optional(),
  tags: z.array(z.string().min(1).max(30)).max(10).optional(),
  temperatureOverride: z.number().min(0).max(2).nullable().optional(),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;
