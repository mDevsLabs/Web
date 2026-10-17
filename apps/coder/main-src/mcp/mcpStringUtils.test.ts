import { describe, expect, it } from "vitest";
import {
  buildMcpToolName,
  getMcpPrefix,
  mcpInfoFromString,
  normalizeNameForMCP,
} from "./mcpStringUtils.js";

describe("normalizeNameForMCP", () => {
  it("keeps alphanumerics hyphen underscore", () => {
    expect(normalizeNameForMCP("my-server_01")).toBe("my-server_01");
  });

  it("replaces dots and spaces with underscore", () => {
    expect(normalizeNameForMCP("my.server")).toBe("my_server");
    expect(normalizeNameForMCP("a b")).toBe("a_b");
  });

  it("collapses claude.ai prefixed names", () => {
    expect(normalizeNameForMCP("claude.ai GitHub")).toMatch(/^claude_ai/);
    const n = normalizeNameForMCP("claude.ai  Foo   Bar");
    expect(n).not.toContain("__");
  });
});

describe("buildMcpToolName + mcpInfoFromString", () => {
  it("roundtrips for simple id and tool", () => {
    const full = buildMcpToolName("srv", "ping");
    expect(full).toBe("mcp__srv__ping");
    const info = mcpInfoFromString(full);
    expect(info).toEqual({ serverName: "srv", toolName: "ping" });
  });

  it("normalizes special chars in both segments", () => {
    const full = buildMcpToolName("my.srv", "do.thing");
    expect(full).toBe("mcp__my_srv__do_thing");
    const info = mcpInfoFromString(full);
    expect(info).toEqual({ serverName: "my_srv", toolName: "do_thing" });
  });

  it("preserves double underscores inside tool segment (joined parts)", () => {
    const full = buildMcpToolName("a", "b__c");
    const info = mcpInfoFromString(full);
    expect(info?.toolName).toBe("b__c");
  });

  it("returns null for non-mcp names", () => {
    expect(mcpInfoFromString("read_file")).toBeNull();
    expect(mcpInfoFromString("mcp_only")).toBeNull();
  });
});

describe("getMcpPrefix", () => {
  it("matches buildMcpToolName prefix", () => {
    const server = "x.y";
    expect(getMcpPrefix(server)).toBe(`mcp__${normalizeNameForMCP(server)}__`);
  });
});
