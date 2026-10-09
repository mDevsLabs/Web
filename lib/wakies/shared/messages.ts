/** Adaptateur de présentation AG-UI → AI SDK. Il ne donne aucune autorisation d'outil et n'est jamais une source d'historique serveur. */
import type { UIMessage } from "ai";
import { z } from "zod";
export const incomingUserMessage = z.object({
  id: z.string().min(1).max(200),
  parts: z
    .array(
      z.discriminatedUnion("type", [
        z.object({ text: z.string().max(100_000), type: z.literal("text") }),
        z.object({
          fileName: z.string().max(255).optional(),
          filename: z.string().max(255).optional(),
          mediaType: z.string().max(127),
          pathname: z.string().max(512).optional(),
          size: z.number().int().nonnegative().optional(),
          type: z.literal("file"),
          url: z.string().max(2048).default(""),
        }),
      ])
    )
    .min(1)
    .max(50),
  role: z.literal("user"),
});
const agui = z.object({
  content: z.string().optional(),
  id: z.string().min(1),
  role: z.enum(["user", "assistant", "system", "tool"]),
  toolCallId: z.string().optional(),
  toolCalls: z
    .array(
      z.object({
        function: z.object({ arguments: z.string(), name: z.string().min(1) }),
        id: z.string().min(1),
      })
    )
    .optional(),
});
export function fromOpenMuseMessages(input: unknown[]): UIMessage[] {
  const result: UIMessage[] = [];
  for (const value of input) {
    const message = agui.parse(value);
    if (message.role === "tool") {
      for (const prior of result)
        for (const part of prior.parts) {
          if (
            part.type === "dynamic-tool" &&
            part.toolCallId === message.toolCallId
          ) {
            part.state = "output-available";
            part.output = message.content ?? "";
          }
        }
      continue;
    }
    const parts: UIMessage["parts"] = [];
    if (message.content) parts.push({ text: message.content, type: "text" });
    for (const call of message.toolCalls ?? []) {
      let input: unknown;
      try {
        input = JSON.parse(call.function.arguments);
      } catch {
        throw new Error("Arguments d’outil source invalides.");
      }
      parts.push({
        input,
        state: "input-available",
        toolCallId: call.id,
        toolName: call.function.name,
        type: "dynamic-tool",
      });
    }
    result.push({ id: message.id, parts, role: message.role });
  }
  return result;
}
export function storedMessages(
  rows: { id: string; role: string; parts: unknown }[]
): UIMessage[] {
  return rows
    .filter(
      (row) =>
        row.id &&
        (row.role === "user" ||
          row.role === "assistant" ||
          row.role === "system") &&
        Array.isArray(row.parts)
    )
    .map((row) => ({
      id: row.id,
      parts: row.parts as UIMessage["parts"],
      role: row.role as UIMessage["role"],
    }));
}
export function safeAttachmentLink(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}
