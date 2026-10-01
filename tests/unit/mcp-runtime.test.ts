import { describe, expect, it } from "vitest";
import {
  buildMcpHeaders,
  clearMcpRateLimits,
  getEffectiveTimeout,
  getFilteredTools,
  validateMcpConfig,
} from "@/lib/mcp/client";
import { toMcpLogDto, toMcpServerDto } from "@/lib/mcp/dto";
import type { McpServerConfig } from "@/lib/mcp/types";

const remoteConfig = (
  overrides: Partial<McpServerConfig> = {}
): McpServerConfig => ({
  authType: "none",
  name: "test",
  transport: "http",
  url: "https://mcp.example.test/rpc",
  ...overrides,
});

describe("Runtime MCP — outils, délai et transport", () => {
  it("applique les overrides et une whitelist vide", () => {
    const config = remoteConfig({
      toolOverrides: { disabled: { enabled: false } },
      toolsCache: [{ name: "enabled" }, { name: "disabled" }],
    });
    expect(getFilteredTools(config).map((tool) => tool.name)).toEqual([
      "enabled",
    ]);
    expect(getFilteredTools(config, [])).toEqual([]);
  });

  it("borne les délais et refuse les transports non supportés", () => {
    expect(
      getEffectiveTimeout({ authType: "none", name: "x", transport: "http" })
    ).toBe(15_000);
    expect(
      getEffectiveTimeout({
        authType: "none",
        name: "x",
        timeoutMs: 50,
        transport: "http",
      })
    ).toBe(1000);
    expect(
      getEffectiveTimeout({
        authType: "none",
        name: "x",
        timeoutMs: 999_999,
        transport: "http",
      })
    ).toBe(120_000);
    expect(() =>
      validateMcpConfig(remoteConfig({ transport: "websocket" }))
    ).toThrow(/WebSocket/);
    expect(() =>
      validateMcpConfig(remoteConfig({ url: "http://mcp.example.test/rpc" }))
    ).toThrow(/HTTPS/);
  });

  it("valide les credentials Bearer et ne construit pas un header manual ambigu", () => {
    const config = remoteConfig({
      authConfig: { token: "pat-example" },
      authType: "bearer",
    });
    expect(buildMcpHeaders(config).Authorization).toBe("Bearer pat-example");
    expect(() =>
      validateMcpConfig({
        ...config,
        headers: { Authorization: "Bearer other" },
      })
    ).toThrow(/Authorization/);
    expect(() =>
      validateMcpConfig(remoteConfig({ authType: "bearer" }))
    ).toThrow(/Jeton Bearer/);
  });

  it("réinitialise les compteurs de rate-limit pour les tests", () => {
    clearMcpRateLimits();
    expect(clearMcpRateLimits).toBeTypeOf("function");
  });
});

describe("DTO MCP — aucune valeur sensible dans les métadonnées", () => {
  it("redacte le cache, les overrides et les erreurs", () => {
    const dto = toMcpServerDto({
      args: ["--token=ghp_SUPER_SECRET"],
      authConfig: { token: "ghp_SUPER_SECRET" },
      command: "mcp-wrapper",
      env: { API_KEY: "pat-secret" },
      headers: { Authorization: "Bearer secret" },
      id: "server-1",
      name: "server",
      toolOverrides: { tool: { note: "token=ghp_SUPER_SECRET" } },
      toolsCache: [{ description: "ghp_SUPER_SECRET", name: "read" }],
      transport: "http",
      url: "https://mcp.example.test/rpc?token=ghp_SUPER_SECRET",
    });
    expect(JSON.stringify(dto)).not.toContain("ghp_SUPER_SECRET");
    expect(JSON.stringify(dto)).not.toContain("SUPER_SECRET");
    expect(dto.authConfig).toEqual({});
    expect(dto.env).toEqual({});
    expect(dto.headers).toEqual({});

    const log = toMcpLogDto({
      error: "Authorization: Bearer ghp_SUPER_SECRET",
      id: "log-1",
      inputPayload: { token: "ghp_SUPER_SECRET" },
      outputPayload: { result: "ghp_SUPER_SECRET" },
      serverName: "server",
      toolName: "read",
      userId: "user-1",
    });
    expect(JSON.stringify(log)).not.toContain("ghp_SUPER_SECRET");
    expect(JSON.stringify(log)).not.toContain("SUPER_SECRET");
  });
});
