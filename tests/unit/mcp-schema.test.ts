import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { listPluginAgentTools } from "@/lib/agent/tools/adapters/plugins";
import type { McpServer } from "@/lib/db/schema";
import { createMcpChatTools, inputSchemaFor } from "@/lib/mcp/chat-tools";
import {
  allocateMcpProviderToolIds,
  CUSTOM_PLUGIN_ADDENDUM_MAX,
  customPluginAddendum,
  customPluginAgentDescription,
  customPluginChatDescription,
  isProviderToolName,
  mcpProviderToolId,
  PROVIDER_TOOL_DESCRIPTION_MAX,
  pluginAgentToolDescription,
} from "@/lib/mcp/provider-tool-id";
import { mcpHashedToolLabel } from "@/lib/mcp/provider-tool-label";
import type { McpToolDefinition } from "@/lib/mcp/types";

function toolDefinition(
  inputSchema: McpToolDefinition["inputSchema"]
): McpToolDefinition {
  return { inputSchema, name: "example" };
}

function mcpServer(
  overrides: Partial<McpServer> & Pick<McpServer, "id" | "name" | "toolsCache">
): McpServer {
  return {
    args: [],
    authConfig: {},
    authType: "none",
    avgLatencyMs: 0,
    callCount: 0,
    command: null,
    createdAt: new Date(0),
    description: "",
    env: {},
    headers: {},
    icon: null,
    isEnabled: true,
    lastCallAt: null,
    lastSyncAt: null,
    rateLimitPerMin: 60,
    requireApproval: "ask_permission",
    templateId: null,
    timeoutMs: 15_000,
    toolOverrides: {},
    transport: "http",
    updatedAt: new Date(0),
    uptimeStatus: "unknown",
    url: "https://example.com/mcp",
    userId: "user-1",
    ...overrides,
  } as McpServer;
}

describe("Schéma d'entrée MCP", () => {
  it("applique required, types et refus des propriétés inattendues", () => {
    const schema = inputSchemaFor(
      toolDefinition({
        additionalProperties: false,
        properties: {
          count: { type: "integer" },
          label: { enum: ["a", "b"], type: "string" },
        },
        required: ["count"],
        type: "object",
      })
    );

    expect(schema.safeParse({ count: 2, label: "a" }).success).toBe(true);
    expect(schema.safeParse({ label: "a" }).success).toBe(false);
    expect(schema.safeParse({ count: 1, unexpected: true }).success).toBe(
      false
    );
    expect(schema.safeParse({ count: 1.5 }).success).toBe(false);
    expect(schema.safeParse({ count: 1, label: "c" }).success).toBe(false);
  });

  it("conserve objets imbriqués, contraintes et valeur par défaut", () => {
    const schema = inputSchemaFor(
      toolDefinition({
        additionalProperties: false,
        properties: {
          limit: {
            default: 10,
            description: "Taille de page",
            maximum: 20,
            minimum: 1,
            type: "integer",
          },
          tags: {
            items: {
              additionalProperties: false,
              properties: {
                name: { maxLength: 8, minLength: 2, type: "string" },
              },
              required: ["name"],
              type: "object",
            },
            minItems: 1,
            type: "array",
          },
        },
        required: ["tags"],
        type: "object",
      })
    );

    expect(schema.safeParse({ tags: [{ name: "ok" }] }).success).toBe(true);
    expect(schema.parse({ tags: [{ name: "ok" }] })).toMatchObject({
      limit: 10,
      tags: [{ name: "ok" }],
    });
    expect(schema.safeParse({ tags: [] }).success).toBe(false);
    expect(schema.safeParse({ tags: [{ name: "x" }] }).success).toBe(false);
    expect(
      schema.safeParse({ tags: [{ extra: true, name: "ok" }] }).success
    ).toBe(false);
    expect(
      schema.safeParse({ limit: 1.5, tags: [{ name: "ok" }] }).success
    ).toBe(false);
    expect(schema.safeParse({ limit: 0, tags: [{ name: "ok" }] }).success).toBe(
      false
    );

    const json = schema.toJSONSchema() as {
      properties?: Record<string, Record<string, unknown>>;
    };
    expect(json.properties?.limit).toMatchObject({
      default: 10,
      description: "Taille de page",
      maximum: 20,
      minimum: 1,
      type: "integer",
    });
    expect(json.properties?.tags).toMatchObject({
      items: {
        properties: { name: { maxLength: 8, minLength: 2, type: "string" } },
        required: ["name"],
      },
      minItems: 1,
      type: "array",
    });
  });

  it("laisse un défaut requis dans la description et dans required", () => {
    const schema = inputSchemaFor(
      toolDefinition({
        additionalProperties: false,
        properties: {
          title: { default: "brouillon", type: "string" },
        },
        required: ["title"],
        type: "object",
      })
    );

    expect(schema.safeParse({}).success).toBe(false);
    const json = schema.toJSONSchema() as {
      properties?: Record<string, { description?: string }>;
      required?: string[];
    };
    expect(json.required).toContain("title");
    expect(json.properties?.title?.description).toContain("brouillon");
  });

  it("accepte anyOf, oneOf et un type tableau sans lever", () => {
    const schema = inputSchemaFor(
      toolDefinition({
        additionalProperties: false,
        properties: {
          mode: {
            anyOf: [{ enum: ["a", "b"], type: "string" }, { type: "null" }],
          },
          note: { type: ["string", "null"] },
          value: {
            oneOf: [{ minLength: 1, type: "string" }, { type: "integer" }],
          },
        },
        required: ["mode", "note", "value"],
        type: "object",
      })
    );

    expect(
      schema.safeParse({ mode: "a", note: null, value: "ok" }).success
    ).toBe(true);
    expect(
      schema.safeParse({ mode: null, note: "texte", value: 3 }).success
    ).toBe(true);
    expect(
      schema.safeParse({ mode: "z", note: "texte", value: "ok" }).success
    ).toBe(false);
    expect(schema.safeParse({ mode: "a", note: 1, value: "ok" }).success).toBe(
      false
    );
    expect(
      schema.safeParse({ mode: "a", note: "texte", value: 1.5 }).success
    ).toBe(false);
  });

  it("résout un $ref local et ignore une référence externe", () => {
    const local = inputSchemaFor(
      toolDefinition({
        $defs: {
          Page: {
            additionalProperties: false,
            properties: { title: { minLength: 2, type: "string" } },
            required: ["title"],
            type: "object",
          },
        },
        additionalProperties: false,
        properties: { page: { $ref: "#/$defs/Page" } },
        required: ["page"],
        type: "object",
      })
    );
    expect(local.safeParse({ page: { title: "ok" } }).success).toBe(true);
    expect(local.safeParse({ page: { title: "a" } }).success).toBe(false);

    const external = inputSchemaFor(
      toolDefinition({
        additionalProperties: false,
        properties: { page: { $ref: "https://example.com/schema.json" } },
        type: "object",
      })
    );
    expect(external.safeParse({ page: { title: "libre" } }).success).toBe(true);
  });

  it("ne lève pas sans type, sur une référence circulaire, ni sur un tuple", () => {
    expect(() =>
      inputSchemaFor(
        toolDefinition({
          $defs: {
            Node: {
              additionalProperties: false,
              properties: { child: { $ref: "#/$defs/Node" } },
              type: "object",
            },
          },
          additionalProperties: false,
          properties: {
            child: { $ref: "#/$defs/Node" },
            mystery: { description: "libre" },
            pair: {
              prefixItems: [{ type: "string" }, { type: "integer" }],
              type: "array",
            },
          },
          type: "object",
        })
      )
    ).not.toThrow();

    const schema = inputSchemaFor(
      toolDefinition({
        additionalProperties: false,
        properties: {
          mystery: { description: "libre" },
          pair: {
            prefixItems: [{ type: "string" }, { type: "integer" }],
            type: "array",
          },
        },
        required: ["pair"],
        type: "object",
      })
    );
    expect(
      schema.safeParse({ mystery: { a: 1 }, pair: ["a", 1] }).success
    ).toBe(true);
    expect(schema.safeParse({ pair: ["a", "b"] }).success).toBe(false);
    expect(schema.safeParse({ pair: ["a", 1] }).success).toBe(true);
  });

  it("mentionne le format sans le rendre bloquant et garde un enum lisible", () => {
    const schema = inputSchemaFor(
      toolDefinition({
        additionalProperties: false,
        properties: {
          kind: { enum: ["token", "password"], type: "string" },
          when: { format: "date-time", type: "string" },
        },
        required: ["kind", "when"],
        type: "object",
      })
    );
    expect(schema.safeParse({ kind: "token", when: "demain" }).success).toBe(
      true
    );
    const json = schema.toJSONSchema() as {
      properties?: Record<string, { description?: string }>;
    };
    expect(json.properties?.when?.description).toContain("date-time");
  });

  it("retire un secret d'un enum sans réécrire les autres valeurs", () => {
    const secret = "ghp_abcdefghijklmnopqrst";
    const schema = inputSchemaFor(
      toolDefinition({
        additionalProperties: false,
        properties: {
          kind: { enum: [secret, "safe"], type: "string" },
        },
        required: ["kind"],
        type: "object",
      })
    );
    expect(schema.safeParse({ kind: "safe" }).success).toBe(true);
    expect(schema.safeParse({ kind: secret }).success).toBe(false);
  });

  it("réunit les branches objet d'un allOf", () => {
    const schema = inputSchemaFor(
      toolDefinition({
        allOf: [
          {
            additionalProperties: false,
            properties: { title: { minLength: 1, type: "string" } },
            required: ["title"],
            type: "object",
          },
          {
            properties: { count: { minimum: 0, type: "integer" } },
            required: ["count"],
            type: "object",
          },
        ],
      })
    );
    expect(schema.safeParse({ count: 1, title: "a" }).success).toBe(true);
    expect(schema.safeParse({ title: "a" }).success).toBe(false);
    expect(
      schema.safeParse({ count: 1, extra: true, title: "a" }).success
    ).toBe(false);
  });
});

describe("Identifiants d'outils MCP", () => {
  it("reste court, stable et distinct", () => {
    const first = mcpProviderToolId({
      serverId: "server-a",
      toolName: "search",
    });
    expect(first).toBe(
      mcpProviderToolId({ serverId: "server-a", toolName: "search" })
    );
    expect(first.length).toBeLessThanOrEqual(64);
    expect(isProviderToolName(first)).toBe(true);
    expect(first).not.toBe(
      mcpProviderToolId({ serverId: "server-b", toolName: "search" })
    );
    expect(first).not.toBe(
      mcpProviderToolId({ serverId: "server-a", toolName: "other" })
    );
    expect(
      mcpProviderToolId({ serverId: "server-a", toolName: "do-thing" })
    ).not.toMatch(/-/);

    const longId = mcpProviderToolId({
      serverId: "s".repeat(120),
      toolName: "tool_".repeat(80),
    });
    expect(longId.length).toBeLessThanOrEqual(64);
    expect(isProviderToolName(longId)).toBe(true);

    const named = allocateMcpProviderToolIds([
      { serverId: "server-a", serverName: "Alpha", toolName: "search" },
    ]);
    const renamed = allocateMcpProviderToolIds([
      { serverId: "server-a", serverName: "Autre nom", toolName: "search" },
    ]);
    expect(named[0]?.providerToolId).toBe(renamed[0]?.providerToolId);
    expect(named[0]?.providerToolId).toBe(first);

    const forward = allocateMcpProviderToolIds([
      { serverId: "server-a", serverName: "Alpha", toolName: "search" },
      { serverId: "server-b", serverName: "Beta", toolName: "search" },
    ]);
    const backward = allocateMcpProviderToolIds([
      { serverId: "server-b", serverName: "Beta", toolName: "search" },
      { serverId: "server-a", serverName: "Alpha", toolName: "search" },
    ]);
    expect(forward[0]?.providerToolId).toBe(backward[1]?.providerToolId);
    expect(forward[1]?.providerToolId).toBe(backward[0]?.providerToolId);
    expect(forward[0]?.providerToolId).not.toBe(forward[1]?.providerToolId);
  });

  it("affiche MCP et le slug pour un identifiant empreint", () => {
    const id = mcpProviderToolId({
      serverId: "server-a",
      toolName: "create_page",
    });
    expect(mcpHashedToolLabel(id)).toEqual({
      methodLabel: "create_page",
      serverLabel: "MCP",
    });
    expect(mcpHashedToolLabel("mcp_notion_search")).toBeNull();
  });

  it("n'ajoute pas de schéma parameters à côté de inputSchema", () => {
    const approval = mcpServer({
      id: "server-approval",
      name: "Notion de production",
      requireApproval: "ask_permission",
      toolsCache: [
        {
          description: "Crée une page",
          inputSchema: {
            additionalProperties: false,
            properties: { title: { minLength: 1, type: "string" } },
            required: ["title"],
            type: "object",
          },
          name: "create_page",
        },
      ],
    });
    const open = mcpServer({
      id: "server-open",
      name: "s".repeat(120),
      requireApproval: "always_allow",
      toolsCache: [
        {
          description: "Cherche",
          inputSchema: {
            properties: { q: { type: "string" } },
            type: "object",
          },
          name: "tool_".repeat(40),
        },
      ],
    });
    const tools = createMcpChatTools({
      prefs: { allowStdio: false, globalKillSwitch: false },
      servers: [approval, open],
      userId: "user-1",
    });
    const approvalId = mcpProviderToolId({
      serverId: approval.id,
      toolName: "create_page",
    });
    const openId = mcpProviderToolId({
      serverId: open.id,
      toolName: "tool_".repeat(40),
    });
    expect(Object.keys(tools).sort()).toEqual([approvalId, openId].sort());
    expect(tools[approvalId]?.parameters).toBeUndefined();
    expect(tools[approvalId]?.execute).toBeUndefined();
    expect(tools[approvalId]?.inputSchema).toBeDefined();
    expect(tools[approvalId]?.description).toContain("create_page");
    expect(tools[approvalId]?.description).toContain("Notion de production");
    expect(tools[approvalId]?.description.length).toBeLessThanOrEqual(
      PROVIDER_TOOL_DESCRIPTION_MAX
    );
    expect(tools[openId]?.parameters).toBeUndefined();
    expect(typeof tools[openId]?.execute).toBe("function");
    expect(isProviderToolName(openId)).toBe(true);
    expect(tools[openId]?.description.length).toBeLessThanOrEqual(
      PROVIDER_TOOL_DESCRIPTION_MAX
    );
  });
});

describe("Descriptions d'outils plugin", () => {
  it("garde la description et borne le hint", () => {
    const description = pluginAgentToolDescription({
      description: "Liste les dépôts du compte.",
      name: "GitHub",
      systemHint: "x".repeat(2000),
    });
    expect(description.length).toBeLessThanOrEqual(
      PROVIDER_TOOL_DESCRIPTION_MAX
    );
    expect(description).toContain("Liste les dépôts du compte.");
    expect(description.startsWith("GitHub — Liste les dépôts du compte.")).toBe(
      true
    );
  });

  it("borne la liste des plugins OAuth sans perdre la phrase d'usage", () => {
    const labels = Array.from({ length: 40 }, (_, index) => {
      const name = `Plugin ${index} ${"nom".repeat(20)}`;
      return `${name} (${"a".repeat(8)}-${"b".repeat(4)}-${"c".repeat(4)}-${"d".repeat(4)}-${"e".repeat(12)})`;
    });
    const chat = customPluginChatDescription(labels);
    const agent = customPluginAgentDescription(labels);
    const addendum = customPluginAddendum(labels);
    expect(chat.length).toBeLessThanOrEqual(PROVIDER_TOOL_DESCRIPTION_MAX);
    expect(agent.length).toBeLessThanOrEqual(PROVIDER_TOOL_DESCRIPTION_MAX);
    expect(addendum.length).toBeLessThanOrEqual(CUSTOM_PLUGIN_ADDENDUM_MAX);
    expect(chat).toContain(
      "Lit en GET une ressource d'un plugin OAuth personnel."
    );
    expect(agent).toContain("Lecture GET d'un plugin OAuth personnel.");
    expect(addendum).toContain("readCustomPlugin");
  });

  it("envoie un nom de fonction court pour les outils du catalogue", () => {
    const tools = listPluginAgentTools(["github"], { userId: "user-1" });
    const repositories = tools.find(
      (item) => item.id === "getGithubRepositories"
    );
    expect(repositories?.description).toContain(
      "Liste les dépôts de votre compte"
    );
    expect(repositories?.description.length ?? 0).toBeLessThanOrEqual(
      PROVIDER_TOOL_DESCRIPTION_MAX
    );
    expect(isProviderToolName(repositories?.id ?? "")).toBe(true);
    for (const item of tools) {
      expect(isProviderToolName(item.id)).toBe(true);
      expect(item.description.length).toBeLessThanOrEqual(
        PROVIDER_TOOL_DESCRIPTION_MAX
      );
    }
  });
});
