import type {
  AgentAutonomy,
  RegisteredAgentTool,
  ToolPermission,
} from "@/lib/agent/types";

// Moteur de permissions : décide, pour chaque outil, s'il s'exécute
// automatiquement, s'il doit demander l'accord de l'utilisateur, ou s'il est
// désactivé. Trois niveaux de priorité :
//   1. autonomie de l'utilisateur (Prudente / Standard / Élevée),
//   2. politiques par outil définies dans Paramètres → Agent (surcharge),
//   3. valeur déclarée par l'outil lui-même (permissions.default).
// La décision est toujours prise côté serveur.

// Lecture seule : rien à confirmer. Tout le reste dépend de l'autonomie.
const READ_ONLY_DEFAULT: ToolPermission = "auto";
const WRITE_DEFAULT: ToolPermission = "ask";
// Suppression / irréversibilité : jamais automatique, même en autonomie élevée.
const DESTRUCTIVE_DEFAULT: ToolPermission = "ask";

export const AUTONOMY_DEFAULTS: Record<AgentAutonomy, ToolPermission> = {
  careful: "ask",
  high: "auto",
  standard: "auto",
};

export function permissionForTool(
  tool: Pick<RegisteredAgentTool, "permissions">
): ToolPermission {
  if (tool.permissions.destructive) {
    return DESTRUCTIVE_DEFAULT;
  }
  if (tool.permissions.readOnly) {
    return READ_ONLY_DEFAULT;
  }
  return tool.permissions.default ?? WRITE_DEFAULT;
}

export function resolveToolPermission(params: {
  autonomy: AgentAutonomy;
  overrides?: Record<string, ToolPermission>;
  tool: Pick<RegisteredAgentTool, "id" | "permissions">;
}): ToolPermission {
  const override = params.overrides?.[params.tool.id];
  if (override) {
    return override;
  }

  const declared = permissionForTool(params.tool);

  // L'autonomie ne relâche jamais une action irréversible : elle ne peut
  // qu'assouplir ou durcir les actions non destructives.
  if (params.tool.permissions.destructive) {
    return declared;
  }

  if (params.autonomy === "careful") {
    return declared === "auto" && params.tool.permissions.readOnly
      ? "auto"
      : "ask";
  }

  if (params.autonomy === "high") {
    return "auto";
  }

  return declared;
}

export function applyToolPermissions(params: {
  autonomy: AgentAutonomy;
  overrides?: Record<string, ToolPermission>;
  tools: RegisteredAgentTool[];
}): {
  approvalRequiredToolIds: string[];
  enabledTools: RegisteredAgentTool[];
  snapshot: Record<string, ToolPermission>;
} {
  const enabledTools: RegisteredAgentTool[] = [];
  const approvalRequiredToolIds: string[] = [];
  const snapshot: Record<string, ToolPermission> = {};

  for (const tool of params.tools) {
    const permission = resolveToolPermission({
      autonomy: params.autonomy,
      overrides: params.overrides,
      tool,
    });
    snapshot[tool.id] = permission;

    if (permission === "off") {
      continue;
    }
    enabledTools.push(tool);
    if (permission === "ask") {
      approvalRequiredToolIds.push(tool.id);
    }
  }

  return { approvalRequiredToolIds, enabledTools, snapshot };
}

// Statut d'approbation attendu par le SDK AI : "user-approval" suspend l'appel
// et remonte une demande au client, "not-applicable" exécute directement.
export function approvalStatusForPermission(
  permission: ToolPermission
): "not-applicable" | "user-approval" {
  return permission === "ask" ? "user-approval" : "not-applicable";
}

export function buildToolApprovalConfig(params: {
  approvalRequiredToolIds: string[];
  enabledTools: RegisteredAgentTool[];
}): Record<string, "not-applicable" | "user-approval"> {
  const config: Record<string, "not-applicable" | "user-approval"> = {};
  for (const tool of params.enabledTools) {
    config[tool.id] = approvalStatusForPermission(
      params.approvalRequiredToolIds.includes(tool.id) ? "ask" : "auto"
    );
  }
  return config;
}
