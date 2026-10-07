import { describe, expect, it } from "vitest";
import { buildMcpToolName, normalizeNameForMCP } from "./mcpStringUtils.js";
import {
  type McpClientLike,
  resolveMcpToolInvocation,
} from "./mcpToolResolve.js";
import type { McpServerConfig, McpServerStatus } from "./mcpTypes.js";

function makeClient(
  config: Partial<McpServerConfig> & Pick<McpServerConfig, "id" | "name">,
  status: McpServerStatus["status"],
  tools: McpServerStatus["tools"]
): McpClientLike {
  const { id, name, ...rest } = config;
  const full: McpServerConfig = {
    ...rest,
    enabled: rest.enabled ?? true,
    id,
    name,
    transport: rest.transport ?? "stdio",
  };
  return {
    async callTool() {
      return { content: [] };
    },
    config: full,
    getServerStatus(): McpServerStatus {
      return {
        id: full.id,
        prompts: [],
        resources: [],
        status,
        tools,
      };
    },
  };
}

describe("resolveMcpToolInvocation", () => {
  it("resolves connected client and canonical tool name", () => {
    const clients = [
      makeClient({ id: "github", name: "GitHub" }, "connected", [
        {
          inputSchema: { properties: {}, required: [], type: "object" },
          name: "search_repos",
        },
      ]),
    ];
    const q = buildMcpToolName("github", "search_repos");
    const r = resolveMcpToolInvocation(clients, q);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.toolName).toBe("search_repos");
      expect(r.client.config.id).toBe("github");
    }
  });

  it("matches server by normalized config id", () => {
    const clients = [
      makeClient({ id: "my.srv", name: "S" }, "connected", [
        {
          inputSchema: { properties: {}, required: [], type: "object" },
          name: "t1",
        },
      ]),
    ];
    const normId = normalizeNameForMCP("my.srv");
    const q = `mcp__${normId}__${normalizeNameForMCP("t1")}`;
    const r = resolveMcpToolInvocation(clients, q);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.toolName).toBe("t1");
  });

  it("skips disconnected clients then succeeds on connected (same normalized id)", () => {
    expect(normalizeNameForMCP("s.ex")).toBe(normalizeNameForMCP("s_ex"));
    const clients = [
      makeClient({ id: "s.ex", name: "A" }, "disconnected", [
        {
          inputSchema: { properties: {}, required: [], type: "object" },
          name: "x",
        },
      ]),
      makeClient({ id: "s_ex", name: "B" }, "connected", [
        {
          inputSchema: { properties: {}, required: [], type: "object" },
          name: "x",
        },
      ]),
    ];
    const q = buildMcpToolName("s.ex", "x");
    const r = resolveMcpToolInvocation(clients, q);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.client.config.id).toBe("s_ex");
  });

  it("returns server_not_found when no id normalizes to segment", () => {
    const clients = [makeClient({ id: "only", name: "O" }, "connected", [])];
    const r = resolveMcpToolInvocation(clients, "mcp__nope__t");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain("not found");
  });

  it("returns server_not_connected when matching ids exist but none connected", () => {
    const clients = [makeClient({ id: "off", name: "O" }, "error", [])];
    const q = buildMcpToolName("off", "t");
    const r = resolveMcpToolInvocation(clients, q);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain("not connected");
  });

  it("returns tool_not_found when connected but tool missing", () => {
    const clients = [
      makeClient({ id: "s", name: "S" }, "connected", [
        {
          inputSchema: { properties: {}, required: [], type: "object" },
          name: "a",
        },
      ]),
    ];
    const q = buildMcpToolName("s", "missing");
    const r = resolveMcpToolInvocation(clients, q);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain("tool not found");
  });

  it("returns invalid for malformed qualified name", () => {
    const clients = [makeClient({ id: "s", name: "S" }, "connected", [])];
    expect(resolveMcpToolInvocation(clients, "nope").ok).toBe(false);
    expect(resolveMcpToolInvocation(clients, "mcp__only").ok).toBe(false);
  });
});
