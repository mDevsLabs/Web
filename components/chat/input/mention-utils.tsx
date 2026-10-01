import type { Agent, McpServer, Skill } from "@/lib/db/schema";
import { getPluginByToolId } from "@/lib/plugins/catalog";
import type { PluginManifest } from "@/lib/plugins/types";

const MENTION_FALLBACK_RE =
  /(^|[^\p{L}\p{N}_])@([\p{L}\p{N}_-]+)(?:[ \t\u00a0])?$/u;

export const MENTION_TOKEN_RE = MENTION_FALLBACK_RE;

export type MentionTokenMatch = {
  end: number;
  start: number;
  token: string;
};

function isMentionBoundary(text: string, index: number): boolean {
  if (index <= 0) {
    return true;
  }
  return !/[\p{L}\p{N}_]/u.test(text[index - 1] ?? "");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Retrouve le token @ situé immédiatement avant le curseur.
 * Les labels connus sont utilisés en priorité afin de prendre en charge les
 * noms multi-mots (`@Open Food Facts`, `@GitLab Public`, etc.). Le fallback
 * Unicode conserve la suppression atomique des tokens déjà présents dans le
 * texte sans dépendre d'une liste de labels.
 */
export function findMentionTokenAtCursor(
  input: string,
  cursorPos: number,
  knownLabels: readonly string[] = []
): MentionTokenMatch | null {
  const before = input.slice(0, Math.max(0, cursorPos));
  const labels = [
    ...new Set(knownLabels.map((label) => label.trim()).filter(Boolean)),
  ].sort((a, b) => b.length - a.length);

  for (const label of labels) {
    const pattern = new RegExp(
      `@${escapeRegExp(label)}(?=[ \\t\\u00a0]|$)`,
      "giu"
    );
    let match: RegExpExecArray | null;
    let lastMatch: RegExpExecArray | null = null;
    while ((match = pattern.exec(before)) !== null) {
      lastMatch = match;
    }
    if (!lastMatch || !isMentionBoundary(before, lastMatch.index)) {
      continue;
    }
    const afterToken = before.slice(lastMatch.index + lastMatch[0].length);
    if (/^[ \t\u00a0]*$/.test(afterToken)) {
      return {
        end: lastMatch.index + lastMatch[0].length,
        start: lastMatch.index,
        token: lastMatch[0],
      };
    }
  }

  const fallback = before.match(MENTION_FALLBACK_RE);
  if (!fallback || fallback.index === undefined) {
    return null;
  }
  const tokenStart = fallback.index + fallback[1].length;
  if (!isMentionBoundary(before, tokenStart)) {
    return null;
  }
  const token = fallback[2] ? `@${fallback[2]}` : "@";
  return {
    end: tokenStart + token.length,
    start: tokenStart,
    token,
  };
}

export function detectTrigger(
  input: string,
  cursorPos: number
): { type: "slash" | "mention"; query: string; start: number } | null {
  const before = input.slice(0, Math.max(0, cursorPos));

  // Un trigger doit être au début ou séparé du texte par un espace/une
  // ponctuation ouvrante. Cela évite d'ouvrir le menu dans `foo/bar` ou
  // `contact@example.com`.
  const slashMatch = before.match(/(^|[\s([{])\/([\p{L}\p{N}_-]*)$/u);
  if (slashMatch) {
    return {
      query: slashMatch[2],
      start: before.lastIndexOf("/"),
      type: "slash",
    };
  }

  const mentionMatch = before.match(/(^|[\s([{])@([\p{L}\p{N}_-]*)$/u);
  if (mentionMatch) {
    return {
      query: mentionMatch[2],
      start: before.lastIndexOf("@"),
      type: "mention",
    };
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
  // Outil fourni par un plugin : le token inséré correspond au nom du plugin.
  const plugin = getPluginByToolId(toolId);
  if (plugin) {
    return plugin.name;
  }
  return null;
}

export function renderHighlightedMentions(
  text: string,
  mcpServers: McpServer[] = [],
  skills: Skill[] = [],
  agents: Agent[] = [],
  plugins: PluginManifest[] = []
) {
  if (!text) return null;
  const mentionNames = [
    ...mcpServers.map((s) => s.name),
    ...skills.map((s) => s.name),
    ...agents.map((a) => a.name),
    ...plugins.map((p) => p.name),
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
  plugins?: PluginManifest[];
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
    plugins = [],
    togglePendingTool,
    clearActiveSkill,
    clearActiveAgent,
    clearPendingProject,
  } = params;

  const normalizedToken = token.trim().toLocaleLowerCase("fr");
  const matches = (value: string | null) =>
    value?.toLocaleLowerCase("fr") === normalizedToken;
  const skillName = activeSkill ? `@${activeSkill.name}` : null;
  const agentName = activeAgent ? `@${activeAgent.name}` : null;
  const projectName = pendingProject ? `@${pendingProject.name}` : null;

  if (normalizedToken === "@memory") {
    if (pendingTools.includes("memory")) {
      togglePendingTool("memory");
    }
  } else if (matches(skillName)) {
    clearActiveSkill();
  } else if (matches(agentName)) {
    clearActiveAgent();
  } else if (matches(projectName)) {
    clearPendingProject();
  } else {
    const srv = userMcpServers.find((s) => matches(`@${s.name}`));
    if (srv) {
      const toolId = `mcp:${srv.id}`;
      if (pendingTools.includes(toolId)) {
        togglePendingTool(toolId);
      }
      return;
    }
    const plugin = plugins.find((p) => matches(`@${p.name}`));
    if (plugin) {
      for (const pluginTool of plugin.tools) {
        if (pendingTools.includes(pluginTool.id)) {
          togglePendingTool(pluginTool.id);
        }
      }
    }
  }
}
