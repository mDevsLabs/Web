// Identifiants et textes envoyés aux fournisseurs compatibles OpenAI.
//
// Un `function.name` de plus de 64 caractères, ou hors de
// `[A-Za-z_][A-Za-z0-9_]*`, fait échouer toute la requête. Le nom d'un
// serveur MCP peut atteindre 120 caractères : on n'envoie donc pas
// `mcp_<serveur>_<outil>`. L'identifiant est une empreinte du couple
// (id de serveur, nom d'outil d'origine). Elle ne change pas si le
// serveur est renommé, ni selon l'ordre des outils. Le nom d'origine
// reste dans la table d'enregistrement et dans la description, pour
// l'exécution et pour l'approbation.

import { createHash } from "node:crypto";
import { redactMcpText } from "./redaction";

export const PROVIDER_TOOL_NAME_MAX = 64;
export const PROVIDER_TOOL_DESCRIPTION_MAX = 1024;
export const CUSTOM_PLUGIN_ADDENDUM_MAX = 4000;

/** 12 hex = 48 bits. Assez court pour laisser un slug lisible. */
const DIGEST_START = 12;
const DIGEST_STEP = 4;
const DIGEST_MAX = 40;

export const PROVIDER_TOOL_NAME_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]{0,63}$/;

export type McpToolIdentity = {
  serverId: string;
  serverName: string;
  toolName: string;
};

export type McpToolBinding = McpToolIdentity & {
  providerToolId: string;
};

export function isProviderToolName(name: string): boolean {
  return PROVIDER_TOOL_NAME_PATTERN.test(name);
}

export function boundProviderToolDescription(
  text: string,
  max = PROVIDER_TOOL_DESCRIPTION_MAX
): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }
  if (max <= 1) {
    return trimmed.slice(0, Math.max(0, max));
  }
  return `${trimmed.slice(0, max - 1)}…`;
}

export function mcpToolBindingKey(serverId: string, toolName: string): string {
  return `${serverId}\0${toolName}`;
}

function toolSlug(toolName: string): string {
  const cleaned = toolName
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return cleaned.length > 0 ? cleaned : "tool";
}

function toolDigest(serverId: string, toolName: string): string {
  return createHash("sha256").update(`${serverId}\0${toolName}`).digest("hex");
}

function providerToolIdAt(
  serverId: string,
  toolName: string,
  digestChars: number
): string {
  const hash = toolDigest(serverId, toolName).slice(0, digestChars);
  const room = PROVIDER_TOOL_NAME_MAX - "mcp_".length - hash.length - 1;
  const slug = toolSlug(toolName).slice(0, Math.max(1, room));
  return `mcp_${hash}_${slug}`;
}

/** Identifiant stable d'un couple. Indépendant des autres outils. */
export function mcpProviderToolId(params: {
  serverId: string;
  toolName: string;
}): string {
  return providerToolIdAt(params.serverId, params.toolName, DIGEST_START);
}

/**
 * Même identifiant que `mcpProviderToolId`, sauf si deux couples distincts
 * produisent la même chaîne : on allonge alors l'empreinte de chaque
 * couple en collision, à partir de son propre digest, sans compteur
 * dépendant de l'ordre d'insertion.
 */
export function allocateMcpProviderToolIds(
  entries: readonly McpToolIdentity[]
): McpToolBinding[] {
  const widths = entries.map(() => DIGEST_START);
  let bindings = entries.map((entry, index) =>
    bind(entry, widths[index] ?? DIGEST_START)
  );
  for (let pass = 0; pass < 8; pass += 1) {
    const groups = new Map<string, number[]>();
    for (let index = 0; index < bindings.length; index += 1) {
      const id = bindings[index]?.providerToolId ?? "";
      const bucket = groups.get(id);
      if (bucket) {
        bucket.push(index);
      } else {
        groups.set(id, [index]);
      }
    }
    const collided: number[] = [];
    for (const indexes of groups.values()) {
      if (indexes.length < 2) {
        continue;
      }
      const keys = new Set(
        indexes.map((index) => {
          const entry = entries[index];
          return entry ? mcpToolBindingKey(entry.serverId, entry.toolName) : "";
        })
      );
      if (keys.size < 2) {
        continue;
      }
      collided.push(...indexes);
    }
    if (collided.length === 0) {
      return bindings;
    }
    for (const index of collided) {
      widths[index] = Math.min(
        DIGEST_MAX,
        (widths[index] ?? DIGEST_START) + DIGEST_STEP
      );
    }
    bindings = entries.map((entry, index) =>
      bind(entry, widths[index] ?? DIGEST_START)
    );
  }
  return bindings;
}

function bind(entry: McpToolIdentity, digestChars: number): McpToolBinding {
  return {
    ...entry,
    providerToolId: providerToolIdAt(
      entry.serverId,
      entry.toolName,
      digestChars
    ),
  };
}

/** Description MCP : le modèle relie l'id court au serveur et à l'outil. */
export function mcpModelDescription(params: {
  actionNote?: string;
  description?: string;
  serverName: string;
  toolName: string;
}): string {
  const server = redactMcpText(params.serverName, 120);
  const tool = redactMcpText(params.toolName, 160);
  const head = `[MCP: ${server}] ${tool}`;
  const body = params.description?.trim()
    ? redactMcpText(params.description, 800)
    : "";
  const suffix = params.actionNote ?? "";
  const core = body ? `${head} — ${body}` : head;
  if (suffix.length >= PROVIDER_TOOL_DESCRIPTION_MAX) {
    return boundProviderToolDescription(suffix);
  }
  const budget = PROVIDER_TOOL_DESCRIPTION_MAX - suffix.length;
  return `${boundProviderToolDescription(core, budget)}${suffix}`;
}

/**
 * Description d'un outil de plugin pour l'Agent.
 * Le hint n'est ajouté que s'il reste de la place : il ne remplace pas
 * la description de l'outil.
 */
export function pluginAgentToolDescription(params: {
  description: string;
  name: string;
  systemHint?: string;
}): string {
  const primary = boundProviderToolDescription(
    `${params.name} — ${params.description}`.trim()
  );
  const hint = params.systemHint?.trim() ?? "";
  if (!hint) {
    return primary;
  }
  const room = PROVIDER_TOOL_DESCRIPTION_MAX - primary.length - 1;
  if (room <= 0) {
    return primary;
  }
  const excerpt = hint.slice(0, room).trimEnd();
  if (!excerpt) {
    return primary;
  }
  return `${primary} ${excerpt}`;
}

/** Ajoute des libellés tant que le plafond n'est pas dépassé. */
export function joinProviderList(
  lead: string,
  items: readonly string[],
  max = PROVIDER_TOOL_DESCRIPTION_MAX
): string {
  const prefix = lead.trim();
  if (max <= 0) {
    return "";
  }
  const pieces = items.map((item) => item.trim()).filter((item) => item);
  if (pieces.length === 0 || prefix.length >= max) {
    return boundProviderToolDescription(prefix, max);
  }
  let text = prefix;
  let count = 0;
  for (const piece of pieces) {
    const next = count === 0 ? `${prefix} ${piece}` : `${text}, ${piece}`;
    if (next.length > max) {
      break;
    }
    text = next;
    count += 1;
  }
  if (count === 0) {
    return boundProviderToolDescription(prefix, max);
  }
  return text;
}

function withTerminalPeriod(text: string, max: number): string {
  if (text.endsWith(".") || text.length >= max) {
    return text;
  }
  return `${text}.`;
}

export function customPluginChatDescription(labels: readonly string[]): string {
  return withTerminalPeriod(
    joinProviderList(
      "Lit en GET une ressource d'un plugin OAuth personnel. Plugins disponibles :",
      labels
    ),
    PROVIDER_TOOL_DESCRIPTION_MAX
  );
}

export function customPluginAgentDescription(
  labels: readonly string[]
): string {
  return withTerminalPeriod(
    joinProviderList(
      "Lecture GET d'un plugin OAuth personnel. Plugins :",
      labels
    ),
    PROVIDER_TOOL_DESCRIPTION_MAX
  );
}

export function customPluginAddendum(labels: readonly string[]): string {
  const tail =
    " Utilise readCustomPlugin avec le pluginId et un chemin GET relatif à l'URL d'API du plugin.";
  const budget = Math.max(1, CUSTOM_PLUGIN_ADDENDUM_MAX - tail.length - 1);
  const head = withTerminalPeriod(
    joinProviderList(
      "Plugins OAuth personnels, lecture seule :",
      labels,
      budget
    ),
    budget
  );
  return boundProviderToolDescription(
    `${head}${tail}`,
    CUSTOM_PLUGIN_ADDENDUM_MAX
  );
}
