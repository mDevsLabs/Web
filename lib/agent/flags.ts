// Feature flags d'Agent (canal Alpha). Module volontairement neutre — ni
// "server-only" ni "use client" : le serveur résout les flags depuis
// l'environnement, le client les reçoit par /api/agent/flags. Aucun composant
// ne lit process.env directement.

import type { ToolCategory } from "@/lib/agent/types";

export const AGENT_FLAG_KEYS = [
  "agent.enabled",
  "agent.projects",
  "agent.files",
  "agent.webSearch",
  "agent.plugins",
  "agent.artifacts",
  "agent.approvals",
  "agent.reasoning",
  "agent.skills",
  "agent.mcp",
  "agent.approvalPreview",
  "agent.guidedResume",
  "agent.scheduleHistory",
  "agent.activity",
] as const;

export type AgentFlagKey = (typeof AGENT_FLAG_KEYS)[number];

export type AgentFlags = Record<AgentFlagKey, boolean>;

const TOOL_FLAG_BY_CATEGORY: Partial<Record<ToolCategory, AgentFlagKey>> = {
  artifact: "agent.artifacts",
  files: "agent.files",
  library: "agent.files",
  mcp: "agent.mcp",
  plugins: "agent.plugins",
  project: "agent.projects",
  skills: "agent.skills",
  web: "agent.webSearch",
};

export function filterToolsByFlags<T extends { category: ToolCategory }>(
  tools: readonly T[],
  flags: AgentFlags
): T[] {
  return tools.filter((tool) => {
    const flag = TOOL_FLAG_BY_CATEGORY[tool.category];
    return flag === undefined || flags[flag];
  });
}

// Les fonctions Alpha essentielles sont actives par défaut ; les fonctions
// Optional (Skills, MCP) et la réflexion (contrat amont non confirmé) sont
// désactivées. `agent.enabled` reste un interrupteur global : le mettre à false
// coupe l'espace Agent sans redéploiement de code.
export const DEFAULT_AGENT_FLAGS: AgentFlags = {
  "agent.activity": false,
  "agent.approvalPreview": false,
  "agent.approvals": true,
  "agent.artifacts": true,
  "agent.enabled": true,
  "agent.files": true,
  "agent.guidedResume": false,
  "agent.mcp": false,
  "agent.plugins": true,
  "agent.projects": true,
  "agent.reasoning": false,
  "agent.scheduleHistory": false,
  "agent.skills": false,
  "agent.webSearch": true,
};

export const AGENT_FLAG_LABELS: Record<AgentFlagKey, string> = {
  "agent.activity": "Activité Agent",
  "agent.approvalPreview": "Aperçu des approbations",
  "agent.approvals": "Approbations d'outils",
  "agent.artifacts": "Livrables",
  "agent.enabled": "Espace Agent",
  "agent.files": "Fichiers et bibliothèque",
  "agent.guidedResume": "Reprise guidée",
  "agent.mcp": "Connexions MCP",
  "agent.plugins": "Plugins",
  "agent.projects": "Projets",
  "agent.reasoning": "Intensité de réflexion",
  "agent.scheduleHistory": "Historique des tâches planifiées",
  "agent.skills": "Skills",
  "agent.webSearch": "Recherche web",
};

// Variable d'environnement associée à chaque flag : `AGENT_MCP=false` suffit à
// éteindre les connexions MCP. `AGENT_FLAGS` accepte en plus un objet JSON
// global, pratique en préproduction : AGENT_FLAGS='{"agent.mcp":true}'.
export const AGENT_FLAG_ENV: Record<AgentFlagKey, string> = {
  "agent.activity": "AGENT_ACTIVITY",
  "agent.approvalPreview": "AGENT_APPROVAL_PREVIEW",
  "agent.approvals": "AGENT_APPROVALS",
  "agent.artifacts": "AGENT_ARTIFACTS",
  "agent.enabled": "AGENT_ENABLED",
  "agent.files": "AGENT_FILES",
  "agent.guidedResume": "AGENT_GUIDED_RESUME",
  "agent.mcp": "AGENT_MCP",
  "agent.plugins": "AGENT_PLUGINS",
  "agent.projects": "AGENT_PROJECTS",
  "agent.reasoning": "AGENT_REASONING",
  "agent.scheduleHistory": "AGENT_SCHEDULE_HISTORY",
  "agent.skills": "AGENT_SKILLS",
  "agent.webSearch": "AGENT_WEB_SEARCH",
};

export const AGENT_FLAGS_ENV_JSON = "AGENT_FLAGS";

export function parseAgentFlagValue(value: unknown): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on", "actif", "activé"].includes(normalized)) {
    return true;
  }
  if (
    ["0", "false", "no", "off", "inactif", "désactivé"].includes(normalized)
  ) {
    return false;
  }
  return null;
}

export function resolveAgentFlags(
  env: Record<string, string | undefined> = {}
): AgentFlags {
  const flags: AgentFlags = { ...DEFAULT_AGENT_FLAGS };

  for (const key of AGENT_FLAG_KEYS) {
    const parsed = parseAgentFlagValue(env[AGENT_FLAG_ENV[key]]);
    if (parsed !== null) {
      flags[key] = parsed;
    }
  }

  const rawJson = env[AGENT_FLAGS_ENV_JSON];
  if (rawJson) {
    try {
      const parsedJson: unknown = JSON.parse(rawJson);
      if (parsedJson && typeof parsedJson === "object") {
        for (const key of AGENT_FLAG_KEYS) {
          const parsed = parseAgentFlagValue(
            (parsedJson as Record<string, unknown>)[key]
          );
          if (parsed !== null) {
            flags[key] = parsed;
          }
        }
      }
    } catch {
      // JSON invalide : on conserve les valeurs par défaut, sans lever.
    }
  }

  return flags;
}

export function getAgentFlags(): AgentFlags {
  return resolveAgentFlags(process.env as Record<string, string | undefined>);
}

export function isAgentEnabled(flags: AgentFlags = getAgentFlags()): boolean {
  return flags["agent.enabled"];
}

export function areAgentFlagsEnabled(
  keys: AgentFlagKey[],
  flags: AgentFlags = getAgentFlags()
): boolean {
  return keys.every((key) => flags[key]);
}
