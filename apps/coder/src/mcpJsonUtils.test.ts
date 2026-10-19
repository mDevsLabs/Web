import { describe, expect, it } from "vitest";
import {
  exportMcpServersToJson,
  parseMcpServersJson,
  validateMcpServerConfig,
} from "./mcpJsonUtils";
import type { McpServerConfig } from "./mcpTypes";

describe("parseMcpServersJson", () => {
  it("parses a valid direct array", () => {
    const json = JSON.stringify([
      {
        args: ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"],
        autoStart: true,
        command: "npx",
        enabled: true,
        env: { KEY: "value" },
        id: "srv-1",
        name: "Filesystem",
        timeout: 30_000,
        transport: "stdio",
      },
    ]);
    const result = parseMcpServersJson(json);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.servers).toHaveLength(1);
      expect(result.servers[0].name).toBe("Filesystem");
      expect(result.servers[0].command).toBe("npx");
      expect(result.servers[0].args).toEqual([
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/tmp",
      ]);
      expect(result.servers[0].env).toEqual({ KEY: "value" });
    }
  });

  it("parses Claude Desktop mcpServers format", () => {
    const json = JSON.stringify({
      mcpServers: {
        fetch: {
          args: ["mcp-server-fetch"],
          command: "uvx",
        },
        github: {
          args: ["-y", "@modelcontextprotocol/server-github"],
          command: "npx",
          env: { GITHUB_TOKEN: "secret" },
        },
      },
    });
    const result = parseMcpServersJson(json);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.servers).toHaveLength(2);
      const github = result.servers.find((s) => s.name === "github");
      expect(github).toBeDefined();
      expect(github!.command).toBe("npx");
      expect(github!.enabled).toBe(false); // Claude format defaults to false unless explicitly true
      expect(github!.env).toEqual({ GITHUB_TOKEN: "secret" });
    }
  });

  it("rejects invalid JSON", () => {
    const result = parseMcpServersJson("{ not json");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("Invalid JSON");
  });

  it("rejects unsupported transport", () => {
    const result = parseMcpServersJson(
      JSON.stringify([
        { enabled: true, id: "x", name: "X", transport: "websocket" },
      ])
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("Unsupported transport");
  });

  it("rejects non-array non-mcpServers root", () => {
    const result = parseMcpServersJson(JSON.stringify({ foo: "bar" }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(
        result.error.includes("array of servers") ||
          result.error.includes("Claude Desktop")
      ).toBe(true);
    }
  });

  it("filters out non-string args and env values", () => {
    const json = JSON.stringify([
      {
        args: ["good", 123, null, "also-good"],
        enabled: true,
        env: { DROP: 123, DROP2: null, KEEP: "yes" },
        id: "x",
        name: "X",
        transport: "stdio",
      },
    ]);
    const result = parseMcpServersJson(json);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.servers[0].args).toEqual(["good", "also-good"]);
      expect(result.servers[0].env).toEqual({ KEEP: "yes" });
    }
  });

  it("assigns generated id when missing in array format", () => {
    const json = JSON.stringify([
      { enabled: true, name: "NoId", transport: "stdio" },
    ]);
    const result = parseMcpServersJson(json);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.servers[0].id).toBeTruthy();
      expect(result.servers[0].id.length).toBeGreaterThan(0);
    }
  });

  it("assigns generated id in Claude Desktop format", () => {
    const json = JSON.stringify({
      mcpServers: { postgres: { command: "npx" } },
    });
    const result = parseMcpServersJson(json);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.servers[0].id).toBeTruthy();
      expect(result.servers[0].name).toBe("postgres");
    }
  });
});

describe("exportMcpServersToJson", () => {
  it("round-trips with parse", () => {
    const servers: McpServerConfig[] = [
      {
        autoStart: false,
        enabled: true,
        headers: { Authorization: "Bearer x" },
        id: "a",
        name: "A",
        timeout: 15_000,
        transport: "http",
        url: "http://localhost:3000/mcp",
      },
    ];
    const json = exportMcpServersToJson(servers);
    const result = parseMcpServersJson(json);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.servers).toEqual(servers);
    }
  });
});

describe("validateMcpServerConfig", () => {
  it("requires name for stdio", () => {
    const cfg: McpServerConfig = {
      command: "npx",
      enabled: true,
      id: "x",
      name: "",
      transport: "stdio",
    };
    expect(validateMcpServerConfig(cfg)).toContain("name");
  });

  it("requires command for stdio", () => {
    const cfg: McpServerConfig = {
      enabled: true,
      id: "x",
      name: "X",
      transport: "stdio",
    };
    expect(validateMcpServerConfig(cfg)).toContain("Command");
  });

  it("requires url for sse", () => {
    const cfg: McpServerConfig = {
      enabled: true,
      id: "x",
      name: "X",
      transport: "sse",
    };
    expect(validateMcpServerConfig(cfg)).toContain("URL");
  });

  it("returns null for valid stdio config", () => {
    const cfg: McpServerConfig = {
      command: "npx",
      enabled: true,
      id: "x",
      name: "X",
      transport: "stdio",
    };
    expect(validateMcpServerConfig(cfg)).toBeNull();
  });
});
