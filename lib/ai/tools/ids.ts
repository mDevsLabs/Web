// Source unique des identifiants d'outils du Chat, de leur répartition
// (implémentés nativement vs fournis par un plugin) et de leur correspondance
// avec le registre Agent (snake_case). Module neutre : aucune dépendance
// React, aucun accès réseau, importable côté client comme côté serveur.
//
// Pourquoi cette séparation : `TOOL_IDS` est la liste des outils
// *sélectionnables* dans l'interface (menu +, Skills, planification). Deux de
// ces identifiants (`getWeather`, `quizzly`) ne sont PAS implémentés dans
// `createChatTools` : ils sont livrés par les plugins `weather` et `quizzly`.
// Les distinguer évite qu'un plugin puisse un jour masquer un outil natif, et
// permet de filtrer un outil de plugin non installé sans jamais retirer un
// outil natif.

export const TOOL_IDS = [
  "getWeather",
  "createDocument",
  "editDocument",
  "updateDocument",
  "requestSuggestions",
  "imageGenerate",
  "audioGenerate",
  "audioPodcast",
  "codeExecution",
  "webSearch",
  "webCapture",
  "calculator",
  "dateTime",
  "calendarReminder",
  "note",
  "memory",
  "readUrl",
  "documentParser",
  "generateChart",
  "generateDiagram",
  "cryptoTools",
  "currencyConverter",
  "qrCodeGenerator",
  "askUser",
  "quizzly",
  "updateAccountProfile",
  "getAccountUsage",
  "updateProfilePicture",
] as const;

export type ChatToolId = (typeof TOOL_IDS)[number];

// Identifiants dont l'implémentation vit dans un plugin (lib/plugins/*) et non
// dans `createChatTools` : ils ne sont disponibles que si le plugin est installé
// et activé par l'utilisateur, et restent réservés aux forfaits payants.
export const PLUGIN_PROVIDED_TOOL_IDS = [
  "getWeather",
  "quizzly",
] as const satisfies readonly ChatToolId[];

const PLUGIN_PROVIDED_SET: ReadonlySet<string> = new Set(
  PLUGIN_PROVIDED_TOOL_IDS
);

// Outils réellement instanciés côté serveur par `createChatTools`. Un plugin ne
// doit JAMAIS réutiliser l'un de ces identifiants (contrôlé par
// `scripts/validate-plugins.ts`).
export const NATIVE_TOOL_IDS: readonly ChatToolId[] = TOOL_IDS.filter(
  (id) => !PLUGIN_PROVIDED_SET.has(id)
);

export function isNativeToolId(toolId: string): boolean {
  return NATIVE_TOOL_IDS.includes(toolId as ChatToolId);
}

export function isPluginProvidedToolId(toolId: string): boolean {
  return PLUGIN_PROVIDED_SET.has(toolId);
}

export function isChatToolId(toolId: string): toolId is ChatToolId {
  return (TOOL_IDS as readonly string[]).includes(toolId);
}

// ── Correspondance Chat (camelCase) ↔ Agent (snake_case) ──
// Les Skills et les plugins déclarent des identifiants du Chat ; le registre
// Agent (lib/agent/tools/catalog.ts) utilise des identifiants snake_case. Sans
// cette table, un skill posé sur un run Agent ne retrouve aucun outil.
export const CHAT_AGENT_TOOL_PAIRS = [
  { agent: "search_web", chat: "webSearch" },
  { agent: "read_url", chat: "readUrl" },
  { agent: "read_file", chat: "documentParser" },
  { agent: "create_artifact", chat: "createDocument" },
  { agent: "export_deliverable", chat: "note" },
  { agent: "ask_user", chat: "askUser" },
] as const satisfies ReadonlyArray<{
  agent: string;
  chat: ChatToolId;
}>;

export function toAgentToolId(chatToolId: string): string | undefined {
  return CHAT_AGENT_TOOL_PAIRS.find((pair) => pair.chat === chatToolId)?.agent;
}

export function toChatToolId(agentToolId: string): ChatToolId | undefined {
  return CHAT_AGENT_TOOL_PAIRS.find((pair) => pair.agent === agentToolId)?.chat;
}

// Sentinelle acceptée dans les manifestes de Skills : accès aux serveurs MCP
// déclarés par le skill.
export const MCP_TOOL_SENTINEL = "mcp";

export type NormalizedToolIds = {
  /** Identifiants reconnus côté Chat (tels que déclarés ou dérivés). */
  chat: string[];
  /** Identifiants correspondants côté Agent. */
  agent: string[];
  /** Identifiants inconnus des deux registres (jamais ignorés en silence). */
  unknown: string[];
  /** Le skill déclare-t-il l'accès MCP ? */
  usesMcp: boolean;
};

// Normalise une liste d'identifiants d'outils déclarée par un template de Skill
// (ou un skill créé à la main) : accepte les identifiants du Chat, ceux du
// registre Agent, la sentinelle `mcp`, et les identifiants d'outils de plugins.
export function normalizeToolIds(
  toolIds: readonly string[],
  options: { pluginToolIds?: readonly string[] } = {}
): NormalizedToolIds {
  const pluginToolIds = new Set(options.pluginToolIds ?? []);
  const chat: string[] = [];
  const agent: string[] = [];
  const unknown: string[] = [];
  let usesMcp = false;

  for (const rawId of toolIds) {
    const toolId = rawId.trim();
    if (!toolId) {
      continue;
    }
    if (toolId === MCP_TOOL_SENTINEL) {
      usesMcp = true;
      continue;
    }
    if (isChatToolId(toolId) || pluginToolIds.has(toolId)) {
      chat.push(toolId);
      const agentId = toAgentToolId(toolId);
      if (agentId) {
        agent.push(agentId);
      }
      continue;
    }
    const derivedChatId = toChatToolId(toolId);
    if (derivedChatId) {
      chat.push(derivedChatId);
      agent.push(toolId);
      continue;
    }
    unknown.push(toolId);
  }

  return { agent, chat, unknown, usesMcp };
}
