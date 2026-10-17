import type { AnthropicToolResultContent } from "../llm/anthropicBeta.js";
import { isDeferredAgentToolName } from "./agentToolPool.js";
import type { AgentToolDef, ToolCall, ToolResult } from "./agentTools.js";

export const TOOL_SEARCH_TOOL_NAME = "ToolSearch";

const DEFAULT_RESULT_LIMIT = 8;
const MAX_RESULT_LIMIT = 12;

export type ToolSearchRuntime = {
  resolveFullToolPool: () => AgentToolDef[];
  discoverTools: (names: string[]) => string[];
  nativeAnthropicToolReference?: boolean;
};

type SearchableToolSummary = {
  name: string;
  description: string;
  required: string[];
  parameterNames: string[];
};

function splitQueryTerms(raw: string): string[] {
  return raw
    .toLowerCase()
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function searchableText(def: AgentToolDef): string {
  const propertyNames = Object.keys(def.parameters.properties ?? {});
  const propertyDescriptions = propertyNames
    .map((key) => String(def.parameters.properties[key]?.description ?? ""))
    .join(" ");
  return [
    def.name,
    def.description,
    propertyNames.join(" "),
    propertyDescriptions,
  ]
    .join(" ")
    .toLowerCase();
}

function scoreTool(def: AgentToolDef, query: string, terms: string[]): number {
  if (!query) {
    return 1;
  }
  const name = def.name.toLowerCase();
  const text = searchableText(def);
  let score = 0;
  if (name === query) score += 120;
  if (name.includes(query)) score += 60;
  if (text.includes(query)) score += 25;
  for (const term of terms) {
    if (!term) continue;
    if (name.startsWith(term)) score += 20;
    if (name.includes(term)) score += 12;
    if (text.includes(term)) score += 6;
  }
  return score;
}

function summarizeTool(def: AgentToolDef): SearchableToolSummary {
  return {
    description: def.description,
    name: def.name,
    parameterNames: Object.keys(def.parameters.properties ?? {}),
    required: [...def.parameters.required],
  };
}

function parseToolSearchArgs(raw: Record<string, unknown>): {
  query: string;
  limit: number;
  server: string;
} {
  const query = String(raw.query ?? raw.pattern ?? raw.term ?? "").trim();
  const server = String(raw.server ?? "")
    .trim()
    .toLowerCase();
  const limitRaw = Number(raw.limit ?? DEFAULT_RESULT_LIMIT);
  const limit =
    Number.isFinite(limitRaw) && limitRaw > 0
      ? Math.min(MAX_RESULT_LIMIT, Math.max(1, Math.floor(limitRaw)))
      : DEFAULT_RESULT_LIMIT;
  return { limit, query, server };
}

export async function executeToolSearchTool(
  call: ToolCall,
  runtime: ToolSearchRuntime
): Promise<ToolResult> {
  const { query, limit, server } = parseToolSearchArgs(call.arguments);
  const fullPool = runtime.resolveFullToolPool();
  const deferred = fullPool.filter((tool) =>
    isDeferredAgentToolName(tool.name)
  );
  const filtered = server
    ? deferred.filter((tool) =>
        tool.name.toLowerCase().includes(`mcp__${server}__`)
      )
    : deferred;
  const terms = splitQueryTerms(query);
  const ranked = filtered
    .map((tool) => ({
      score: scoreTool(tool, query.toLowerCase(), terms),
      tool,
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.tool.name.localeCompare(b.tool.name))
    .slice(0, limit);
  const matched = ranked.map((item) => item.tool);
  const newlyLoaded = runtime.discoverTools(matched.map((tool) => tool.name));
  const structuredContent: AnthropicToolResultContent | undefined =
    runtime.nativeAnthropicToolReference && matched.length > 0
      ? [
          {
            text: `Loaded ${matched.length} deferred tool${matched.length === 1 ? "" : "s"} for the next assistant turn.`,
            type: "text",
          },
          ...matched.map((tool) => ({
            tool_name: tool.name,
            type: "tool_reference" as const,
          })),
        ]
      : undefined;

  const content =
    matched.length === 0
      ? JSON.stringify(
          {
            availableDeferredTools: filtered.length,
            matches: [],
            message: query
              ? `No deferred tools matched "${query}".`
              : "No deferred tools are available to load right now.",
            query,
            server: server || null,
          },
          null,
          2
        )
      : JSON.stringify(
          {
            availableDeferredTools: filtered.length,
            loadedTools: matched.map((tool) => tool.name),
            matches: matched.map(summarizeTool),
            newlyLoadedTools: newlyLoaded,
            nextStep:
              "The loaded tools will be available in the next assistant turn. Call the specific tool directly after this result.",
            query,
            server: server || null,
          },
          null,
          2
        );

  return {
    content,
    name: call.name,
    toolCallId: call.id,
    ...(structuredContent ? { structuredContent } : {}),
    isError: false,
  };
}

export function createToolSearchToolHandler(runtime: ToolSearchRuntime) {
  return (call: ToolCall) => executeToolSearchTool(call, runtime);
}
