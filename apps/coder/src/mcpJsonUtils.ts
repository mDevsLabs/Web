/**
 * MCP JSON 配置导入/导出/校验工具
 */

import type { McpServerConfig } from "./mcpTypes";

export type McpJsonParseResult =
  | { ok: true; servers: McpServerConfig[] }
  | { ok: false; error: string };

/** Claude Desktop 风格的 mcpServers 对象 */
export type ClaudeDesktopMcpServers = {
  mcpServers?: Record<
    string,
    Omit<McpServerConfig, "id" | "name" | "enabled"> & { enabled?: boolean }
  >;
};

function newId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `mcp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  );
}

/** 将内部配置数组导出为格式化的 JSON 字符串 */
export function exportMcpServersToJson(servers: McpServerConfig[]): string {
  return JSON.stringify(servers, null, 2);
}

/** 从 JSON 字符串解析配置数组，支持 Claude Desktop mcpServers 格式 */
export function parseMcpServersJson(json: string): McpJsonParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { error: "Invalid JSON", ok: false };
  }

  if (!parsed || typeof parsed !== "object") {
    return { error: "Root must be an object or array", ok: false };
  }

  // 尝试识别 Claude Desktop 格式: { "mcpServers": { "name": { command, args... } } }
  const maybeClaude = parsed as ClaudeDesktopMcpServers;
  if (maybeClaude.mcpServers && typeof maybeClaude.mcpServers === "object") {
    const servers: McpServerConfig[] = [];
    for (const [name, cfg] of Object.entries(maybeClaude.mcpServers)) {
      if (!cfg || typeof cfg !== "object") continue;
      const c = cfg as Record<string, unknown>;
      const transport = (c.transport as string) || "stdio";
      if (!["stdio", "sse", "http"].includes(transport)) {
        return {
          error: `Unsupported transport "${transport}" for server "${name}"`,
          ok: false,
        };
      }
      const server: McpServerConfig = {
        args: Array.isArray(c.args)
          ? c.args.filter((a): a is string => typeof a === "string")
          : undefined,
        autoStart: c.autoStart !== false,
        command: typeof c.command === "string" ? c.command : undefined,
        enabled: c.enabled === true,
        env:
          c.env && typeof c.env === "object" && !Array.isArray(c.env)
            ? Object.fromEntries(
                Object.entries(c.env).filter(([, v]) => typeof v === "string")
              )
            : undefined,
        headers:
          c.headers &&
          typeof c.headers === "object" &&
          !Array.isArray(c.headers)
            ? Object.fromEntries(
                Object.entries(c.headers).filter(
                  ([, v]) => typeof v === "string"
                )
              )
            : undefined,
        id: newId(),
        name,
        timeout: typeof c.timeout === "number" ? c.timeout : 30_000,
        transport: transport as "stdio" | "sse" | "http",
        url: typeof c.url === "string" ? c.url : undefined,
      };
      servers.push(server);
    }
    return { ok: true, servers };
  }

  // 直接是数组格式
  if (Array.isArray(parsed)) {
    const servers: McpServerConfig[] = [];
    for (let i = 0; i < parsed.length; i++) {
      const item = parsed[i];
      if (!item || typeof item !== "object") {
        return { error: `Item ${i} is not an object`, ok: false };
      }
      const s = item as Record<string, unknown>;
      const transport = (s.transport as string) || "stdio";
      if (!["stdio", "sse", "http"].includes(transport)) {
        return {
          error: `Unsupported transport "${transport}" at item ${i}`,
          ok: false,
        };
      }
      const server: McpServerConfig = {
        args: Array.isArray(s.args)
          ? s.args.filter((a): a is string => typeof a === "string")
          : undefined,
        autoStart: s.autoStart !== false,
        command: typeof s.command === "string" ? s.command : undefined,
        enabled: s.enabled === true,
        env:
          s.env && typeof s.env === "object" && !Array.isArray(s.env)
            ? Object.fromEntries(
                Object.entries(s.env).filter(([, v]) => typeof v === "string")
              )
            : undefined,
        headers:
          s.headers &&
          typeof s.headers === "object" &&
          !Array.isArray(s.headers)
            ? Object.fromEntries(
                Object.entries(s.headers).filter(
                  ([, v]) => typeof v === "string"
                )
              )
            : undefined,
        id: typeof s.id === "string" && s.id ? s.id : newId(),
        name: typeof s.name === "string" ? s.name : "Unnamed",
        timeout: typeof s.timeout === "number" ? s.timeout : 30_000,
        transport: transport as "stdio" | "sse" | "http",
        url: typeof s.url === "string" ? s.url : undefined,
      };
      servers.push(server);
    }
    return { ok: true, servers };
  }

  return {
    error:
      "JSON must be an array of servers or a Claude Desktop { mcpServers: {} } object",
    ok: false,
  };
}

/** 校验单个配置是否合法 */
export function validateMcpServerConfig(
  config: McpServerConfig
): string | null {
  if (!config.name.trim()) {
    return "Server name is required";
  }
  if (config.transport === "stdio") {
    if (!config.command?.trim()) {
      return "Command is required for stdio transport";
    }
  } else if (!config.url?.trim()) {
    return "URL is required for SSE/HTTP transport";
  }
  return null;
}
