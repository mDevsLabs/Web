/**
 * MCP (Model Context Protocol) 模块
 * 提供与 MCP 服务器的连接管理和工具集成
 */

export { McpClient, type McpClientEvents } from "./mcpClient.js";
export {
  destroyMcpManager,
  getMcpManager,
  McpManager,
  type McpManagerEvents,
  type McpToolWithSource,
} from "./mcpManager.js";
export {
  buildMcpToolName,
  getMcpPrefix,
  mcpInfoFromString,
  normalizeNameForMCP,
} from "./mcpStringUtils.js";
export {
  type McpClientLike,
  type ResolveMcpToolResult,
  resolveMcpToolInvocation,
} from "./mcpToolResolve.js";
export * from "./mcpTypes.js";
