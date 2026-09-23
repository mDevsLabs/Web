import { z } from "zod";

const textPartSchema = z.object({
  // Aligné sur /api/agent (8000) : le composer Chat autorise plus de 2000
  // caractères et les agents injectent parfois des prompts longs — un message
  // accepté par Agent ne doit pas être rejeté par Chat (bug 400 silencieux).
  text: z.string().min(1).max(8000),
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
  filename: z.string().min(1).max(255).optional(),
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
  // AI SDK v7 (FileUIPart) nomme le fichier `filename` ; certains envois
  // historiques portent encore `name`. Accepter les deux évite un 400 sur un
  // simple écart de nommage.
  name: z.string().min(1).max(255).optional(),
  type: z.enum(["file"]),
  url: z.url(),
});

const partSchema = z.union([textPartSchema, filePartSchema]);

const userMessageSchema = z.object({
  id: z.string().min(8).max(64),
  parts: z.array(partSchema),
  // Le transport AI SDK réutilise ce champ pour les flux de continuation
  // (regeneration, approval, reprise de stream) où le dernier message peut
  // être un assistant — rejeté injustement par un enum("user") strict
  // (guard=schema « message.role: user attendu »). La sémantique réelle
  // (qui peut déclencher un tour) reste garantée côté serveur dans
  // buildChatContext, qui ne traite que les messages role=user.
  role: z.enum(["user", "assistant"]),
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
  // Tolérance alignée sur l'Agent : les ids de conversation non-UUID
  // (ex. nanoid) ne doivent plus faire rejeter tout le body.
  id: z.string().min(8).max(64),
  isGhostMode: z.boolean().optional().default(false),
  message: userMessageSchema.optional(),
  messages: z.array(toolApprovalMessageSchema).optional(),
  pendingPrompt: z
    .object({
      commandId: z.string().uuid().optional(),
      text: z.string().min(1).max(4000),
    })
    .nullable()
    .optional(),
  projectId: z.string().uuid().nullable().optional(),
  selectedAgentId: z.string().uuid().nullable().optional(),
  selectedChatMode: z.string().nullable().optional(),
  selectedChatModel: z.string(),
  selectedVisibilityType: z.enum(["public", "private"]),
  skillId: z.string().uuid().nullable().optional(),
  skillParams: z.record(z.string(), z.string().max(2000)).nullable().optional(),
  tags: z.array(z.string().min(1).max(30)).max(10).optional(),
  temperatureOverride: z.number().min(0).max(2).nullable().optional(),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;
