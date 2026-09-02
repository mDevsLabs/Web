import type { CommandPayload } from "@/lib/commands/types";
import type { CustomCommand } from "@/lib/db/schema";

export type PendingCommand = {
  commandId: string;
  text: string;
} | null;

export type CustomCommandContext = {
  agents: Array<{ id: string; name: string }>;
  router: { push: (href: string) => void };
  setActiveAgent: (agent: { id: string; name: string } | null) => void;
  setActiveSkill: (skill: { id: string; name: string } | null) => void;
  setPendingCommand: (command: PendingCommand) => void;
  skills: Array<{ id: string; name: string }>;
  toast: (opts: { description: string; type?: "success" | "error" }) => void;
  togglePendingTool: (tool: string) => void;
};

export function executeCustomCommand(
  command: CustomCommand,
  ctx: CustomCommandContext
) {
  const payload = (command.payload ?? {}) as CommandPayload;
  const prefix = command.kind === "slash" ? "/" : "@";
  const label = `${prefix}${command.trigger}`;

  switch (command.actionType) {
    case "navigation": {
      if (payload.route) {
        ctx.router.push(payload.route);
        ctx.toast({
          description: `Navigation vers ${payload.route}`,
          type: "success",
        });
      }
      break;
    }
    case "tools": {
      const toolIds = payload.toolIds ?? [];
      for (const tool of toolIds) {
        ctx.togglePendingTool(tool);
      }
      ctx.toast({
        description:
          toolIds.length > 0
            ? `Outils activés pour le prochain message : ${toolIds.join(", ")}`
            : "Aucun outil configuré pour cette commande",
        type: toolIds.length > 0 ? "success" : "error",
      });
      break;
    }
    case "mcp": {
      const serverIds = payload.serverIds ?? [];
      for (const serverId of serverIds) {
        ctx.togglePendingTool(`mcp:${serverId}`);
      }
      ctx.toast({
        description:
          serverIds.length > 0
            ? "Serveurs MCP activés pour le prochain message"
            : "Aucun serveur MCP configuré pour cette commande",
        type: serverIds.length > 0 ? "success" : "error",
      });
      break;
    }
    case "agent": {
      const agent = ctx.agents.find((a) => a.id === payload.agentId) ?? null;
      ctx.setActiveAgent(agent);
      ctx.toast({
        description: agent
          ? `Agent « ${agent.name} » activé pour la conversation`
          : "Agent introuvable pour cette commande",
        type: agent ? "success" : "error",
      });
      break;
    }
    case "skill": {
      const skill = ctx.skills.find((s) => s.id === payload.skillId) ?? null;
      ctx.setActiveSkill(skill);
      ctx.toast({
        description: skill
          ? `Skill « ${skill.name} » activé pour la conversation`
          : "Skill introuvable pour cette commande",
        type: skill ? "success" : "error",
      });
      break;
    }
    case "prompt": {
      if (payload.promptText) {
        ctx.setPendingCommand({
          commandId: command.id,
          text: payload.promptText,
        });
        ctx.toast({
          description: `Consignes de ${label} appliquées au prochain message`,
          type: "success",
        });
      } else {
        ctx.toast({
          description: "Cette commande n'a pas de prompt configuré",
          type: "error",
        });
      }
      break;
    }
  }
}
