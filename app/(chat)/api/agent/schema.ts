import { z } from "zod";

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
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

const textPartSchema = z.object({
  text: z.string().min(1).max(8000),
  type: z.enum(["text"]),
});

const filePartSchema = z.object({
  mediaType: z
    .string()
    .min(1)
    .max(127)
    .refine(
      (value) =>
        (ALLOWED_MEDIA_TYPES as readonly string[]).includes(value) ||
        value.startsWith("image/") ||
        value.startsWith("text/") ||
        value === "application/pdf" ||
        value === "application/json",
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

export const agentRequestBodySchema = z.object({
  // Options one-shot issues du menu « + » du composer Agent : elles ne
  // s'appliquent qu'au message envoyé, jamais aux reprises du run.
  audioEnabled: z.boolean().optional(),
  assistantId: z.string().uuid().nullable().optional(),
  autonomy: z.enum(["careful", "standard", "high"]).optional(),
  enabledCategories: z.array(z.string().max(40)).max(12).nullable().optional(),
  forceWeb: z.boolean().optional(),
  id: z.uuid(),
  imageEnabled: z.boolean().optional(),
  memoryEnabled: z.boolean().optional(),
  tasksEnabled: z.boolean().optional(),
  isGhostMode: z.boolean().optional().default(false),
  message: userMessageSchema.optional(),
  messages: z.array(toolApprovalMessageSchema).optional(),
  modelId: z.string().min(1).max(200),
  projectId: z.string().uuid().nullable().optional(),
  reasoningLevel: z.enum(["low", "medium", "high"]).optional(),
  skillId: z.string().uuid().nullable().optional(),
  toolMode: z.enum(["auto", "all", "categories"]).optional().default("auto"),
  visibility: z.enum(["public", "private"]).optional().default("private"),
});

export type AgentRequestBody = z.infer<typeof agentRequestBodySchema>;
