/**
 * MCP 工具名规则，
 * 便于与同一批 MCP Server 及模型侧命名习惯对齐。
 */

// Claude.ai 服务端名称前缀
const CLAUDEAI_SERVER_PREFIX = "claude.ai ";

/**
 * 将名称规范为与 `mcp__<server>__<tool>` 分段兼容的形式（非法字符替换为 `_`）。
 * 对 claude.ai 前缀的服务器名会合并连续 `_` 并去掉首尾 `_`，减少对 `__` 分隔的干扰。
 */
export function normalizeNameForMCP(name: string): string {
  let normalized = name.replace(/[^a-zA-Z0-9_-]/g, "_");
  if (name.startsWith(CLAUDEAI_SERVER_PREFIX)) {
    normalized = normalized.replace(/_+/g, "_").replace(/^_|_$/g, "");
  }
  return normalized;
}

/**
 * 从 `mcp__serverName__toolName` 解析；若格式不合法返回 null。
 * 已知限制：server 名本身若含 `__` 会与分隔符冲突。
 */
export function mcpInfoFromString(toolString: string): {
  serverName: string;
  toolName: string | undefined;
} | null {
  const parts = toolString.split("__");
  const [mcpPart, serverName, ...toolNameParts] = parts;
  if (mcpPart !== "mcp" || !serverName) {
    return null;
  }
  const toolName =
    toolNameParts.length > 0 ? toolNameParts.join("__") : undefined;
  return { serverName, toolName };
}

export function getMcpPrefix(serverName: string): string {
  return `mcp__${normalizeNameForMCP(serverName)}__`;
}

export function buildMcpToolName(serverName: string, toolName: string): string {
  return `${getMcpPrefix(serverName)}${normalizeNameForMCP(toolName)}`;
}
