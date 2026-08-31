import { z } from "zod";

export const commandPayloadSchema = z.object({
  agentId: z.string().uuid().nullable().optional(),
  promptText: z.string().max(4000).optional(),
  route: z.string().max(200).optional(),
  serverIds: z.array(z.string().uuid()).max(20).optional(),
  skillId: z.string().uuid().nullable().optional(),
  toolIds: z.array(z.string().max(50)).max(20).optional(),
});

export type CommandPayload = z.infer<typeof commandPayloadSchema>;

export const COMMAND_ACTION_TYPES = [
  "mcp",
  "agent",
  "skill",
  "prompt",
  "tools",
  "navigation",
] as const;

export type CommandActionType = (typeof COMMAND_ACTION_TYPES)[number];

export const COMMAND_ACTION_LABELS: Record<CommandActionType, string> = {
  agent: "Agent",
  mcp: "Serveur MCP",
  navigation: "Navigation",
  prompt: "Prompt prédéfini",
  skill: "Skill",
  tools: "Outils",
};
