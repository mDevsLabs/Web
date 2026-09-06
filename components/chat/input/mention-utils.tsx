import type { Agent, McpServer, Skill } from "@/lib/db/schema";

export const MENTION_TOKEN_RE = /(@[a-zA-Z0-9_\u00C0-\u017F-]+)( |\u00A0)?$/;

export function detectTrigger(
  input: string,
  cursorPos: number
): { type: "slash" | "mention"; query: string; start: number } | null {
  const before = input.slice(0, cursorPos);
  // Slash: only if at start or after newline? spec: au fur et à mesure, so detect /(^|\n| ) slash but for slash we keep simple: last token starting with /
  const slashMatch = before.match(/(^|\n|\s)\/(\w*)$/);
  // Special: if whole input is like "/model" at pos 0 also match
  const slashAtStart = before.match(/^\/(\w*)$/);
  if (slashAtStart) {
    return { query: slashAtStart[1], start: 0, type: "slash" };
  }
  if (slashMatch) {
    // ensure it's last token without space inside
    const q = slashMatch[2];
    // slash trigger only if no space after slash token
    return { query: q, start: before.lastIndexOf("/"), type: "slash" };
  }
  // Mention: (^|\s)@\w* at cursor
  const mentionMatch = before.match(/(^|\s)@(\w*)$/);
  if (mentionMatch) {
    const atIndex = before.lastIndexOf("@");
    return { query: mentionMatch[2], start: atIndex, type: "mention" };
  }
  return null;
}

// Le texte réellement inséré dans le textarea lors de l'activation d'un outil.
// Ne correspond pas au libellé affiché sur la pastille ("Mémoire"), d'où cette
// résolution unique partagée par Backspace atomique et le bouton X.
export function tokenForPendingTool(
  toolId: string,
  servers: McpServer[]
): string | null {
  if (toolId === "memory") {
    return "Memory";
  }
  if (toolId.startsWith("mcp:") || toolId === "mcp") {
    const srvId = toolId.replace(/^mcp:/, "");
    const srv = servers.find(
      (s) => s.id === srvId || s.name.toLowerCase() === srvId.toLowerCase()
    );
    return srv?.name ?? null;
  }
  return null;
}

export function renderHighlightedMentions(
  text: string,
  mcpServers: McpServer[] = [],
  skills: Skill[] = [],
  agents: Agent[] = []
) {
  if (!text) return null;
  const mentionNames = [
    ...mcpServers.map((s) => s.name),
    ...skills.map((s) => s.name),
    ...agents.map((a) => a.name),
  ].filter(Boolean);

  mentionNames.sort((a, b) => b.length - a.length);

  const escapedNames = mentionNames.map((n) =>
    n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );
  const pattern =
    escapedNames.length > 0
      ? `(@(?:${escapedNames.join("|")}|[a-zA-Z0-9_\\u00C0-\\u017F-]+))`
      : "(@[a-zA-Z0-9_\\u00C0-\\u017F-]+)";
  const regex = new RegExp(pattern, "g");
  const parts = text.split(regex);

  return parts.map((part, i) =>
    part.startsWith("@") ? (
      <span
        className="text-blue-600 dark:text-blue-400 bg-blue-500/15 rounded-xs"
        key={i}
      >
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

// Backspace atomique sur un token @ : désactive la session correspondante
// (outil mémoire/skill/agent/projet/serveur MCP) en plus de supprimer le token.
export function deactivateMentionToken(params: {
  token: string;
  activeSkill: Skill | null;
  activeAgent: Agent | null;
  pendingProject: { name: string } | null;
  pendingTools: readonly unknown[];
  userMcpServers: McpServer[];
  togglePendingTool: (toolId: any) => void;
  clearActiveSkill: () => void;
  clearActiveAgent: () => void;
  clearPendingProject: () => void;
}): void {
  const {
    token,
    activeSkill,
    activeAgent,
    pendingProject,
    pendingTools,
    userMcpServers,
    togglePendingTool,
    clearActiveSkill,
    clearActiveAgent,
    clearPendingProject,
  } = params;

  const skillName = activeSkill ? `@${activeSkill.name}` : null;
  const agentName = activeAgent ? `@${activeAgent.name}` : null;
  const projectName = pendingProject ? `@${pendingProject.name}` : null;

  if (token === "@Memory") {
    if (pendingTools.includes("memory")) {
      togglePendingTool("memory");
    }
  } else if (skillName && token === skillName) {
    clearActiveSkill();
  } else if (agentName && token === agentName) {
    clearActiveAgent();
  } else if (projectName && token === projectName) {
    clearPendingProject();
  } else {
    const srv = userMcpServers.find((s) => `@${s.name}` === token);
    if (srv) {
      const toolId = `mcp:${srv.id}`;
      if (pendingTools.includes(toolId)) {
        togglePendingTool(toolId);
      }
    }
  }
}
