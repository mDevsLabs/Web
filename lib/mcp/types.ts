export type McpTransport = "sse" | "http" | "stdio" | "websocket";

export type McpAuthType =
  | "none"
  | "bearer"
  | "basic"
  | "oauth2"
  | "custom_headers";

export type McpApprovalPolicy =
  | "always_allow"
  | "ask_permission"
  | "write_only";

export type McpActionType = "read" | "write" | "delete" | "execute" | "other";

export type McpToolParameterProperty = {
  type: string;
  description?: string;
  enum?: string[];
  default?: unknown;
};

export type McpToolInputSchema = {
  type: "object";
  properties?: Record<string, McpToolParameterProperty>;
  required?: string[];
  additionalProperties?: boolean;
};

export type McpToolDefinition = {
  name: string;
  description?: string;
  inputSchema?: McpToolInputSchema;
};

export type McpToolOverride = {
  enabled?: boolean;
  requireApproval?: McpApprovalPolicy | null; // null = inherit from server
};

export type McpServerConfig = {
  id?: string;
  name: string;
  description?: string;
  icon?: string;
  transport: McpTransport;
  url?: string | null;
  command?: string | null;
  args?: string[];
  env?: Record<string, string>;
  authType: McpAuthType;
  authConfig?: {
    token?: string;
    username?: string;
    password?: string;
    clientId?: string;
    clientSecret?: string;
    tokenUrl?: string;
  };
  headers?: Record<string, string>;
  isEnabled?: boolean;
  requireApproval?: McpApprovalPolicy;
  toolsCache?: McpToolDefinition[];
  toolOverrides?: Record<string, McpToolOverride>;
  timeoutMs?: number;
  rateLimitPerMin?: number;
  avgLatencyMs?: number;
  callCount?: number;
  uptimeStatus?: string;
  lastSyncAt?: string | Date | null;
  lastCallAt?: string | Date | null;
};

export type McpJsonRpcRequest = {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
};

export type McpJsonRpcResponse<T = unknown> = {
  jsonrpc: "2.0";
  id: string | number;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
};

export type McpToolCallResult = {
  content?: Array<
    | { type: "text"; text: string }
    | { type: "image"; data: string; mimeType: string }
    | { type: "resource"; resource: { uri: string; text?: string } }
  >;
  isError?: boolean;
  [key: string]: unknown;
};
