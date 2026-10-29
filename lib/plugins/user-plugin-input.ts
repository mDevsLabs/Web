import { z } from "zod";
import { isLucideIconName } from "@/lib/plugins/icon-allowlist";

/**
 * Saisie d'un plugin créé par le compte. Aucun appel réseau : la résolution
 * DNS et le refus des hôtes privés se font au moment d'enregistrer, côté serveur.
 */

const VERSION = /^\d+\.\d+\.\d+$/;
const ICON_PATH = /^\/plugins\/[a-z0-9-]+\.svg$/;
const HOSTNAME =
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
const HEADER_NAME = /^[A-Za-z0-9-]{1,40}$/;

export function isUserPluginIcon(value: string): boolean {
  return isLucideIconName(value) || ICON_PATH.test(value);
}

const iconSchema = z.string().trim().min(1).max(120).refine(isUserPluginIcon, {
  message:
    "Icône inconnue. Choisissez une icône de la liste, ou un fichier /plugins/nom.svg.",
});

const versionSchema = z
  .string()
  .trim()
  .regex(VERSION, "La version suit la forme 1.0.0.");

const headerSchema = z.object({
  name: z.string().trim().regex(HEADER_NAME, "Nom d'en-tête refusé."),
  value: z.string().min(1).max(2000),
});

const shared = {
  description: z.string().trim().max(500).default(""),
  icon: iconSchema.default("Puzzle"),
  name: z.string().trim().min(1).max(80),
  version: versionSchema.default("1.0.0"),
};

export const mcpPluginCreateSchema = z.object({
  ...shared,
  authType: z.enum(["none", "bearer", "custom_headers"]),
  headers: z.array(headerSchema).max(4).optional(),
  kind: z.literal("mcp"),
  rateLimitPerMin: z.number().int().min(1).max(300).default(60),
  requireApproval: z
    .enum(["always_allow", "ask_permission", "write_only"])
    .default("write_only"),
  timeoutMs: z.number().int().min(1000).max(60_000).default(15_000),
  token: z.string().trim().max(4000).optional(),
  transport: z.enum(["http", "sse"]),
  url: z.string().trim().min(8).max(4096),
});

export const oauthPluginCreateSchema = z.object({
  ...shared,
  apiBaseUrl: z.string().trim().min(8).max(2000),
  authorizeUrl: z.string().trim().min(8).max(2000),
  clientId: z.string().trim().min(1).max(200),
  clientSecret: z.string().trim().min(1).max(4000),
  hosts: z
    .array(z.string().trim().toLowerCase().regex(HOSTNAME))
    .max(5)
    .default([]),
  kind: z.literal("oauth"),
  scopes: z.string().trim().max(500).default(""),
  tokenUrl: z.string().trim().min(8).max(2000),
});

export const userPluginCreateSchema = z.discriminatedUnion("kind", [
  mcpPluginCreateSchema,
  oauthPluginCreateSchema,
]);

export const userPluginUpdateSchema = z
  .object({
    apiBaseUrl: z.string().trim().min(8).max(2000).optional(),
    authorizeUrl: z.string().trim().min(8).max(2000).optional(),
    authType: z.enum(["none", "bearer", "custom_headers"]).optional(),
    clientId: z.string().trim().min(1).max(200).optional(),
    clientSecret: z.string().trim().max(4000).optional(),
    description: z.string().trim().max(500).optional(),
    headers: z.array(headerSchema).max(4).optional(),
    hosts: z
      .array(z.string().trim().toLowerCase().regex(HOSTNAME))
      .max(5)
      .optional(),
    icon: iconSchema.optional(),
    isEnabled: z.boolean().optional(),
    name: z.string().trim().min(1).max(80).optional(),
    rateLimitPerMin: z.number().int().min(1).max(300).optional(),
    requireApproval: z
      .enum(["always_allow", "ask_permission", "write_only"])
      .optional(),
    scopes: z.string().trim().max(500).optional(),
    timeoutMs: z.number().int().min(1000).max(60_000).optional(),
    token: z.string().trim().max(4000).optional(),
    tokenUrl: z.string().trim().min(8).max(2000).optional(),
    transport: z.enum(["http", "sse"]).optional(),
    url: z.string().trim().min(8).max(4096).optional(),
    version: versionSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Aucune modification.",
  });

export type UserPluginCreateInput = z.infer<typeof userPluginCreateSchema>;
export type UserPluginUpdateInput = z.infer<typeof userPluginUpdateSchema>;

export type UserPluginToolView = {
  description: string;
  name: string;
};

export type UserPluginView = {
  apiBaseUrl: string | null;
  authType: string | null;
  authorizeUrl: string | null;
  clientId: string | null;
  connected: boolean;
  connectedAccount: string | null;
  description: string;
  hasSecret: boolean;
  hosts: string[];
  icon: string;
  id: string;
  isEnabled: boolean;
  kind: "mcp" | "oauth";
  mcpServerId: string | null;
  name: string;
  rateLimitPerMin: number;
  requireApproval: string;
  scopes: string;
  templateId: string | null;
  timeoutMs: number;
  tokenUrl: string | null;
  tools: UserPluginToolView[];
  transport: string | null;
  url: string | null;
  version: string;
};
