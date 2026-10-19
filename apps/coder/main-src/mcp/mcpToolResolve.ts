/**
 * 将限定名 `mcp__<normServer>__<normTool>` 解析到具体客户端与远端 tool 名（可单测）。
 */

import { mcpInfoFromString, normalizeNameForMCP } from "./mcpStringUtils.js";
import type {
  McpServerConfig,
  McpServerStatus,
  McpToolResult,
} from "./mcpTypes.js";

export type McpClientLike = {
  readonly config: McpServerConfig;
  getServerStatus(): McpServerStatus;
  callTool(name: string, args: Record<string, unknown>): Promise<McpToolResult>;
};

export type ResolveMcpToolResult =
  | { ok: true; client: McpClientLike; toolName: string }
  | { ok: false; message: string };

/**
 * 在已注册客户端中查找可执行的 MCP 工具（仅已连接且 tools/list 中含规范化名匹配项）。
 */
export function resolveMcpToolInvocation(
  clients: readonly McpClientLike[],
  qualifiedName: string
): ResolveMcpToolResult {
  const info = mcpInfoFromString(qualifiedName);
  if (!info?.toolName) {
    return { message: `Invalid MCP tool name: ${qualifiedName}`, ok: false };
  }
  const normServer = info.serverName;
  const normTool = info.toolName;

  const matching = clients.filter(
    (c) => normalizeNameForMCP(c.config.id) === normServer
  );
  if (matching.length === 0) {
    return { message: `MCP server not found: ${normServer}`, ok: false };
  }

  for (const client of matching) {
    if (client.getServerStatus().status !== "connected") {
      continue;
    }
    const { tools } = client.getServerStatus();
    const match = tools.find((t) => normalizeNameForMCP(t.name) === normTool);
    if (match) {
      return { client, ok: true, toolName: match.name };
    }
  }

  const anyConnected = matching.some(
    (c) => c.getServerStatus().status === "connected"
  );
  if (!anyConnected) {
    return { message: `MCP server not connected: ${normServer}`, ok: false };
  }
  return {
    message: `MCP tool not found: ${normTool} (server ${normServer})`,
    ok: false,
  };
}
