/**
 * MCP (Model Context Protocol) 前端类型定义
 * 与 main-src/mcp/mcpTypes.ts 保持一致
 */

/** MCP Server 配置 */
export type McpServerConfig = {
  /** 唯一标识 */
  id: string;
  /** 显示名称 */
  name: string;
  /** 启用状态 */
  enabled: boolean;
  /** Transport 类型 */
  transport: "stdio" | "sse" | "http";
  /** stdio 配置 */
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  /** SSE/HTTP 配置 */
  url?: string;
  headers?: Record<string, string>;
  /** 自动启动（默认 true） */
  autoStart?: boolean;
  /** 超时（毫秒，默认 30000） */
  timeout?: number;
  /** 插件管理的只读来源；存在时该配置由已安装插件自动提供 */
  pluginSourceName?: string;
  pluginSourceRelPath?: string;
  pluginManaged?: boolean;
};

/** MCP 工具定义（来自 server） */
export type McpToolDef = {
  name: string;
  description?: string;
  inputSchema: {
    type: "object";
    properties?: Record<string, unknown>;
    required?: string[];
  };
};

/** MCP 资源定义 */
export type McpResourceDef = {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
};

/** MCP 提示定义 */
export type McpPromptDef = {
  name: string;
  description?: string;
  arguments?: Array<{ name: string; description?: string; required?: boolean }>;
};

/** MCP Server 状态 */
export type McpServerStatus = {
  id: string;
  status:
    | "not_started"
    | "connecting"
    | "connected"
    | "stopped"
    | "disconnected"
    | "error"
    | "disabled";
  error?: string;
  tools: McpToolDef[];
  resources: McpResourceDef[];
  prompts: McpPromptDef[];
  /** 最后连接时间 */
  lastConnected?: number;
};

/** MCP 工具调用结果 */
export type McpToolResult = {
  content: Array<{
    type: "text" | "image" | "resource";
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
};

/** Agent 工具定义（用于 MCP 工具转换） */
export type AgentToolDef = {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, Record<string, unknown>>;
    required: string[];
  };
};

/** 带来源信息的 MCP 工具 */
export type McpToolWithSource = McpToolDef & {
  serverId: string;
  serverName: string;
};

/** 预设 MCP 服务器模板 */
export type McpServerTemplate = {
  id: string;
  name: string;
  description: string;
  transport: "stdio" | "sse";
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
};

/** MCP 预设模板列表 */
export const MCP_SERVER_TEMPLATES: McpServerTemplate[] = [
  {
    args: [
      "-y",
      "@modelcontextprotocol/server-filesystem",
      "/path/to/allowed/dir",
    ],
    command: "npx",
    description: "Local filesystem access with configurable paths",
    id: "filesystem",
    name: "Filesystem",
    transport: "stdio",
  },
  {
    args: ["-y", "@modelcontextprotocol/server-github"],
    command: "npx",
    description: "GitHub API integration for repos, issues, PRs",
    env: { GITHUB_PERSONAL_ACCESS_TOKEN: "" },
    id: "github",
    name: "GitHub",
    transport: "stdio",
  },
  {
    args: ["-y", "@modelcontextprotocol/server-postgres"],
    command: "npx",
    description: "PostgreSQL database query and schema inspection",
    env: { POSTGRES_CONNECTION_STRING: "" },
    id: "postgres",
    name: "PostgreSQL",
    transport: "stdio",
  },
  {
    args: ["mcp-server-sqlite", "--db-path", "/path/to/database.db"],
    command: "uvx",
    description: "SQLite database query and inspection",
    id: "sqlite",
    name: "SQLite",
    transport: "stdio",
  },
  {
    args: ["mcp-server-fetch"],
    command: "uvx",
    description: "Web content fetching and search",
    id: "fetch",
    name: "Fetch",
    transport: "stdio",
  },
  {
    args: ["-y", "@modelcontextprotocol/server-brave-search"],
    command: "npx",
    description: "Brave search engine integration",
    env: { BRAVE_API_KEY: "" },
    id: "brave-search",
    name: "Brave Search",
    transport: "stdio",
  },
  {
    args: ["-y", "@modelcontextprotocol/server-puppeteer"],
    command: "npx",
    description: "Browser automation and web scraping",
    id: "puppeteer",
    name: "Puppeteer",
    transport: "stdio",
  },
  {
    args: ["-y", "@modelcontextprotocol/server-slack"],
    command: "npx",
    description: "Slack API integration for channels and messages",
    env: { SLACK_BOT_TOKEN: "", SLACK_TEAM_ID: "" },
    id: "slack",
    name: "Slack",
    transport: "stdio",
  },
];
