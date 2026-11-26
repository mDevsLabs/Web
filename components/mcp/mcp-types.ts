import {
  CreditCardIcon,
  DatabaseIcon,
  FileTextIcon,
  SearchIcon,
} from "@mdevs/icons";
import type React from "react";
import type { McpLogDto, McpServerDto } from "@/lib/mcp/dto";
import type { McpTemplateCredential } from "@/lib/mcp-templates/types";

// Catalogue MCP servi par /api/mcp/templates : il provient du catalogue statique
// (lib/mcp-templates), source de vérité unique.
export type McpTemplateRow = {
  activation: "ready" | "requires_oauth_flow" | "requires_vetted_stdio";
  args: string;
  authType: string;
  category?: string;
  command: string;
  credentials?: McpTemplateCredential[];
  description: string;
  docsUrl?: string;
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
    color: "text-primary",
    highlight: "Docs & bases Notion",
    icon: FileTextIcon,
    templateId: "notion",
    tint: "bg-primary/10",
  },
  {
    color: "text-warning",
    highlight: "Recherche web privée",
    icon: SearchIcon,
    templateId: "brave-search",
    tint: "bg-warning/10",
  },
  {
    color: "text-info",
    highlight: "PostgreSQL hébergé",
    icon: DatabaseIcon,
    templateId: "supabase",
    tint: "bg-info/10",
  },
  {
    color: "text-success",
    highlight: "Paiements & factures",
    icon: CreditCardIcon,
    templateId: "stripe",
    tint: "bg-success/10",
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
export const MCP_APPROVALS = [
  "always_allow",
  "ask_permission",
  "write_only",
] as const;

export type McpTransport = (typeof MCP_TRANSPORTS)[number];
export type McpAuthType = (typeof MCP_AUTH_TYPES)[number];
export type ApprovalPolicy = (typeof MCP_APPROVALS)[number];
export type McpServerItem = McpServerDto;
export type McpLogItem = McpLogDto;

export type McpEnvPair = {
  k: string;
  v: string;
  configured?: boolean;
};

export function pickOption<T extends readonly string[]>(
  options: T,
  value: unknown,
  fallback: T[number]
): T[number] {
  return typeof value === "string" && options.includes(value as T[number])
    ? (value as T[number])
    : fallback;
}
