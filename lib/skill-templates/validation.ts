import {
  isNativeToolId,
  MCP_TOOL_SENTINEL,
  normalizeToolIds,
  toChatToolId,
} from "@/lib/ai/tools/ids";
import { MCP_TEMPLATE_LIST } from "@/lib/mcp-templates/catalog";
import {
  getPluginByToolId,
  getPluginManifest,
  isPluginToolId,
  PLUGIN_TOOL_IDS,
} from "@/lib/plugins/catalog";
import type { SkillTemplateManifest } from "./types";

/** Catégories de sources autorisées pour un outil de Skill. */
export type SkillToolSource = "native" | "plugin" | "mcp";

/**
 * Décomposition stable des outils d'un Skill. Les identifiants Agent sont
 * acceptés à la normalisation (pour les Skills importés d'un ancien runtime),
 * mais la classification renvoyée décrit toujours la source Chat.
 */
export type SkillToolClassification = {
  native: string[];
  plugin: string[];
  mcp: string[];
  unknown: string[];
};

export type SkillTemplateValidationResult = {
  valid: boolean;
  errors: string[];
  tools: SkillToolClassification;
};

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function sourceForToolId(toolId: string): SkillToolSource | "unknown" {
  const normalized = toChatToolId(toolId) ?? toolId;
  if (isPluginToolId(normalized)) return "plugin";
  if (isNativeToolId(normalized)) return "native";
  return "unknown";
}

/**
 * Classe les outils d'un manifeste sans confondre un outil natif avec un
 * outil de plugin. `mcp` est conservé comme sentinelle plutôt que traité
 * comme un outil Chat.
 */
export function classifySkillTools(
  toolIds: readonly string[]
): SkillToolClassification {
  const native: string[] = [];
  const plugin: string[] = [];
  const mcp: string[] = [];
  const unknown: string[] = [];

  for (const rawId of toolIds) {
    if (typeof rawId !== "string") {
      unknown.push(String(rawId));
      continue;
    }
    const toolId = rawId.trim();
    if (!toolId) continue;
    if (toolId === MCP_TOOL_SENTINEL) {
      mcp.push(toolId);
      continue;
    }
    const source = sourceForToolId(toolId);
    if (source === "native") native.push(toChatToolId(toolId) ?? toolId);
    else if (source === "plugin") plugin.push(toChatToolId(toolId) ?? toolId);
    else unknown.push(toolId);
  }

  return {
    mcp: unique(mcp),
    native: unique(native),
    plugin: unique(plugin),
    unknown: unique(unknown),
  };
}

/** Résout un nom (ou un id) MCP vers son nom canonique du catalogue. */
export function canonicalMcpServerName(rawName: string): string | undefined {
  const name = rawName.trim();
  if (!name) return;
  const match = MCP_TEMPLATE_LIST.find(
    (template) =>
      template.name.toLowerCase() === name.toLowerCase() ||
      template.id.toLowerCase() === name.toLowerCase()
  );
  return match?.name;
}

/**
 * Valide les dépendances d'un template statique. Cette validation est
 * volontairement locale : elle ne lit ni la base ni les fichiers d'un plugin
 * et ne modifie aucun schéma.
 */
export function validateSkillTemplateManifest(
  manifest: SkillTemplateManifest
): SkillTemplateValidationResult {
  const errors: string[] = [];
  const declaredTools = Array.isArray(manifest.tools) ? manifest.tools : [];
  if (!Array.isArray(manifest.tools)) {
    errors.push("tools doit être une liste explicite");
  }
  const stringToolIds = declaredTools.filter(
    (toolId): toolId is string => typeof toolId === "string"
  );
  if (stringToolIds.length !== declaredTools.length) {
    errors.push("tools contient une valeur invalide");
  }
  const tools = classifySkillTools(stringToolIds);
  const normalized = normalizeToolIds(stringToolIds, {
    pluginToolIds: PLUGIN_TOOL_IDS,
  });
  const trimmedToolIds = declaredTools
    .filter((toolId): toolId is string => typeof toolId === "string")
    .map((toolId) => toolId.trim())
    .filter(Boolean);
  if (unique(trimmedToolIds).length !== trimmedToolIds.length) {
    errors.push("tools contient des doublons");
  }

  if (tools.unknown.length > 0 || normalized.unknown.length > 0) {
    errors.push(
      `outils inconnus : ${unique([...tools.unknown, ...normalized.unknown]).join(", ")}`
    );
  }

  const rawPluginIds = Array.isArray(manifest.pluginIds)
    ? manifest.pluginIds
    : [];
  if (!Array.isArray(manifest.pluginIds)) {
    errors.push("pluginIds doit être une liste explicite");
  }
  const pluginIds: string[] = [];
  for (const rawPluginId of rawPluginIds) {
    if (typeof rawPluginId !== "string") {
      errors.push("pluginIds contient une valeur invalide");
      continue;
    }
    const pluginId = rawPluginId.trim();
    if (pluginId) pluginIds.push(pluginId);
  }
  if (pluginIds.length !== (manifest.pluginIds?.length ?? 0)) {
    errors.push("pluginIds ne doit pas contenir de valeur vide");
  }
  if (unique(pluginIds).length !== pluginIds.length) {
    errors.push("pluginIds contient des doublons");
  }

  const declaredPluginIds = new Set(pluginIds);
  for (const pluginId of pluginIds) {
    if (!getPluginManifest(pluginId)) {
      errors.push(`plugin inconnu : ${pluginId}`);
    }
  }

  for (const toolId of tools.plugin) {
    const owner = getPluginByToolId(toolId);
    if (!owner) {
      errors.push(`outil de plugin sans propriétaire : ${toolId}`);
    } else if (!declaredPluginIds.has(owner.id)) {
      errors.push(
        `outil ${toolId} fourni par le plugin ${owner.id}, mais pluginIds ne le déclare pas`
      );
    }
  }

  // Une dépendance de plugin déclarée mais jamais utilisée est presque toujours
  // une erreur de copie du manifeste. Cela évite desinstallations et prompts
  // qui exposent des capacités inutiles.
  for (const pluginId of declaredPluginIds) {
    if (
      !tools.plugin.some((toolId) => getPluginByToolId(toolId)?.id === pluginId)
    ) {
      errors.push(`plugin déclaré sans outil utilisé : ${pluginId}`);
    }
  }

  const mcpServerNames = Array.isArray(manifest.mcpServerNames)
    ? manifest.mcpServerNames
    : [];
  if (!Array.isArray(manifest.mcpServerNames)) {
    errors.push("mcpServerNames doit être une liste explicite");
  }

  const canonicalMcpNames: string[] = [];
  const seenMcpNames = new Set<string>();
  for (const rawName of mcpServerNames) {
    if (typeof rawName !== "string" || !rawName.trim()) {
      errors.push("mcpServerNames contient une valeur invalide");
      continue;
    }
    const raw = rawName.trim();
    if (raw === "*" || raw.toLowerCase() === "all") {
      errors.push(`serveur MCP générique interdit : ${raw}`);
      continue;
    }
    const canonical = canonicalMcpServerName(raw);
    if (!canonical) {
      errors.push(`serveur MCP inconnu : ${raw}`);
      continue;
    }
    const key = canonical.toLowerCase();
    if (seenMcpNames.has(key)) {
      errors.push(`serveur MCP dupliqué : ${canonical}`);
      continue;
    }
    seenMcpNames.add(key);
    canonicalMcpNames.push(canonical);
  }

  const hasMcpTool = tools.mcp.length > 0;
  if (hasMcpTool !== canonicalMcpNames.length > 0) {
    errors.push(
      hasMcpTool
        ? "l'outil mcp exige au moins un serveur dans mcpServerNames"
        : "mcpServerNames exige la sentinelle mcp dans tools"
    );
  }

  if (
    manifest.minTier === "free" &&
    (tools.plugin.length > 0 || declaredPluginIds.size > 0 || hasMcpTool)
  ) {
    errors.push(
      "un outil Plugin ou MCP ne peut pas être accessible au forfait free"
    );
  }

  return {
    errors: unique(errors),
    tools,
    valid: errors.length === 0,
  };
}

/** Variante fail-fast pour les catalogues statiques et les tests. */
export function assertSkillTemplateManifest(
  manifest: SkillTemplateManifest
): void {
  const result = validateSkillTemplateManifest(manifest);
  if (!result.valid) {
    throw new Error(
      `Manifeste de skill ${manifest.id} invalide : ${result.errors.join(" ; ")}`
    );
  }
}
