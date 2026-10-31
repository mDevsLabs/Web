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

/**
 * Sous-ensemble de JSON Schema publié par un outil MCP.
 * `type` peut manquer (anyOf, oneOf, $ref) ou être un tableau.
 */
export type McpJsonSchema = {
  $defs?: Record<string, McpJsonSchema>;
  $ref?: string;
  additionalProperties?: boolean | McpJsonSchema;
  allOf?: McpJsonSchema[];
  anyOf?: McpJsonSchema[];
  const?: unknown;
  default?: unknown;
  definitions?: Record<string, McpJsonSchema>;
  description?: string;
  enum?: unknown[];
  exclusiveMaximum?: boolean | number;
  exclusiveMinimum?: boolean | number;
  format?: string;
  items?: McpJsonSchema | McpJsonSchema[];
  maxItems?: number;
  maxLength?: number;
  maximum?: number;
  minItems?: number;
  minLength?: number;
  minimum?: number;
  multipleOf?: number;
  oneOf?: McpJsonSchema[];
  pattern?: string;
  prefixItems?: McpJsonSchema[];
  properties?: Record<string, McpJsonSchema>;
  required?: string[];
  type?: string | string[];
};

export type McpToolParameterProperty = McpJsonSchema;

export type McpToolInputSchema = McpJsonSchema;

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
