import type React from "react";
import {
  CreditCardIcon,
  DatabaseIcon,
  FileTextIcon,
  SearchIcon,
} from "@mdevs/icons";

// Catalogue MCP servi par /api/mcp/templates : il provient du catalogue statique
// (lib/mcp-templates), source de vérité unique.
export type McpTemplateRow = {
  activation: "ready" | "requires_oauth_flow" | "requires_vetted_stdio";
  args: string;
  authType: string;
  command: string;
  description: string;
  icon: string;
  id: string;
  minTier: string;
  name: string;
  readOnly: boolean;
  requireApproval: string;
  tags: string[];
  transport: string;
  url: string;
};

// Visuel des connecteurs mis en avant dans le Store : appariement par
// identifiant de catalogue (et non par nom, qui n'était pas stable).
export const STORE_CONNECTORS: ReadonlyArray<{
  color: string;
  highlight: string;
  icon: React.ComponentType<any>;
  templateId: string;
  tint: string;
}> = [
  {
    color: "text-violet-600 dark:text-violet-400",
    highlight: "Docs & bases Notion",
    icon: FileTextIcon,
    templateId: "notion",
    tint: "bg-violet-500/10",
  },
  {
    color: "text-orange-600 dark:text-orange-400",
    highlight: "Recherche web privée",
    icon: SearchIcon,
    templateId: "brave-search",
    tint: "bg-orange-500/10",
  },
  {
    color: "text-cyan-600 dark:text-cyan-400",
    highlight: "PostgreSQL hébergé",
    icon: DatabaseIcon,
    templateId: "supabase",
    tint: "bg-cyan-500/10",
  },
  {
    color: "text-sky-600 dark:text-sky-400",
    highlight: "Paiements & factures",
    icon: CreditCardIcon,
    templateId: "stripe",
    tint: "bg-sky-500/10",
  },
];

// Garde-fous de typage pour les valeurs libres du catalogue (aucun `any`).
export const MCP_TRANSPORTS = ["sse", "http", "stdio", "websocket"] as const;
export const MCP_AUTH_TYPES = [
  "none",
  "bearer",
  "basic",
  "oauth2",
  "custom_headers",
] as const;
export const MCP_APPROVALS = ["always_allow", "ask_permission", "write_only"] as const;

export type McpTransport = (typeof MCP_TRANSPORTS)[number];
export type McpAuthType = (typeof MCP_AUTH_TYPES)[number];
export type ApprovalPolicy = (typeof MCP_APPROVALS)[number];
export type McpServerItem = any;
export type McpLogItem = any;

export function pickOption<T extends readonly string[]>(
  options: T,
  value: unknown,
  fallback: T[number]
): T[number] {
  return typeof value === "string" && options.includes(value as T[number])
    ? (value as T[number])
    : fallback;
}

