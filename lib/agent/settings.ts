import "server-only";

import { AGENT_MODES, type AgentMode } from "@/lib/agent/channel";
import {
  AGENT_SETTINGS_DEFAULTS,
  type AgentAutonomy,
  type AgentSettings,
  isAgentAutonomy,
  isToolPermission,
  type ToolCategory,
  type ToolPermission,
} from "@/lib/agent/types";
import { getModelEntry } from "@/lib/ai/registry";
import { normalizeReasoningLevel } from "@/lib/ai/registry/reasoning";
import {
  getAgentSettingsRow,
  upsertAgentSettingsRow,
} from "@/lib/db/agent-queries";

export const TOOL_CATEGORIES: ToolCategory[] = [
  "web",
  "files",
  "library",
  "project",
  "internal",
  "artifact",
  "plugins",
  "mcp",
  "skills",
];

export type AgentSettingsPatch = {
  defaultMode?: AgentMode;
  defaultModel?: string | null;
  defaultProjectId?: string | null;
  enabledCategories?: ToolCategory[] | null;
  reasoningLevel?: unknown;
  toolPolicies?: Record<string, ToolPermission>;
};

// Les réglages sont chargés avec des valeurs par défaut explicites : une ligne
// absente ne doit jamais empêcher un run de démarrer.
export async function loadAgentSettings({
  userId,
}: {
  userId: string;
}): Promise<AgentSettings> {
  const row = await getAgentSettingsRow({ userId }).catch(() => null);
  if (!row) {
    return { ...AGENT_SETTINGS_DEFAULTS };
  }

  const enabledCategories = Array.isArray(row.enabledCategories)
    ? (row.enabledCategories as ToolCategory[]).filter((category) =>
        TOOL_CATEGORIES.includes(category)
      )
    : null;

  return {
    // L'autonomie n'est plus un réglage : la colonne reste pour l'historique et
    // les runs passés, mais la valeur effective est imposée. Relire ce que la
    // ligne contenait donnerait un compte « Élevée » des droits que l'interface
    // ne propose plus — et que l'utilisateur ne peut ni voir ni révoquer.
    autonomy: AGENT_SETTINGS_DEFAULTS.autonomy,
    // Un mode illisible retombe sur Chat : c'est l'écran par défaut du
    // produit, pas une préférence à préserver.
    defaultMode: AGENT_MODES.includes(row.defaultMode as AgentMode)
      ? (row.defaultMode as AgentMode)
      : AGENT_SETTINGS_DEFAULTS.defaultMode,
    defaultModel: row.defaultModel ?? null,
    defaultProjectId: row.defaultProjectId ?? null,
    enabledCategories:
      enabledCategories && enabledCategories.length > 0
        ? enabledCategories
        : null,
    reasoningLevel: normalizeReasoningLevel(
      row.reasoningLevel,
      AGENT_SETTINGS_DEFAULTS.reasoningLevel
    ),
    toolPolicies: sanitizeToolPolicies(row.toolPolicies),
    updatedAt: row.updatedAt ?? null,
  };
}

export async function saveAgentSettings({
  patch,
  userId,
}: {
  patch: AgentSettingsPatch;
  userId: string;
}): Promise<AgentSettings> {
  const current = await loadAgentSettings({ userId });

  const nextToolPolicies =
    patch.toolPolicies === undefined
      ? current.toolPolicies
      : sanitizeToolPolicies({
          ...current.toolPolicies,
          ...patch.toolPolicies,
        });

  const nextEnabledCategories =
    patch.enabledCategories === undefined
      ? (current.enabledCategories ?? [])
      : (patch.enabledCategories ?? []).filter((category) =>
          TOOL_CATEGORIES.includes(category)
        );

  await upsertAgentSettingsRow({
    patch: {
      // `autonomy` n'est plus écrit : la valeur effective est imposée par le
      // serveur, et la colonne conserve son dernier état pour l'historique.
      defaultMode:
        patch.defaultMode === undefined
          ? current.defaultMode
          : patch.defaultMode,
      defaultModel:
        patch.defaultModel === undefined
          ? current.defaultModel
          : patch.defaultModel,
      defaultProjectId:
        patch.defaultProjectId === undefined
          ? current.defaultProjectId
          : patch.defaultProjectId,
      enabledCategories: nextEnabledCategories,
      reasoningLevel: normalizeReasoningLevel(
        patch.reasoningLevel === undefined
          ? current.reasoningLevel
          : patch.reasoningLevel,
        current.reasoningLevel
      ),
      toolPolicies: nextToolPolicies,
    },
    userId,
  });

  return await loadAgentSettings({ userId });
}

// Normalise une liste de catégories reçue du client : seules les valeurs
// connues sont conservées, et une liste vide devient null (aucun filtre plutôt
// qu'un filtre qui ne laisserait rien passer).
export function toToolCategories(
  values: readonly string[] | null | undefined
): ToolCategory[] | null {
  if (!values || values.length === 0) {
    return null;
  }
  const categories = values.filter((value): value is ToolCategory =>
    TOOL_CATEGORIES.includes(value as ToolCategory)
  );
  return categories;
}

export function sanitizeToolPolicies(
  value: unknown
): Record<string, ToolPermission> {
  if (!value || typeof value !== "object") {
    return {};
  }
  const policies: Record<string, ToolPermission> = {};
  for (const [toolId, permission] of Object.entries(
    value as Record<string, unknown>
  )) {
    if (isToolPermission(permission)) {
      policies[toolId] = permission;
    }
  }
  return policies;
}

// Le modèle par défaut est validé contre le registre : une préférence qui
// n'accepte pas les outils (ou qui a disparu du catalogue) ne doit jamais
// conduire à un run Agent inutilisable.
export function resolveAgentDefaultModel(params: {
  models: Parameters<typeof getModelEntry>[1];
  preferred?: string | null;
  fallback: string;
}): string {
  if (!params.preferred) {
    return params.fallback;
  }
  const entry = getModelEntry(params.preferred, params.models);
  if (!entry.capabilities.tools) {
    return params.fallback;
  }
  return entry.id;
}
