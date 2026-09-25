import { afterEach, describe, expect, it } from "vitest";
import { checkAllowStdio } from "@/lib/mcp/client";
import { toMcpRuntimePreferences } from "@/lib/mcp/policy";

const ENV_KEYS = [
  "MCP_STDIO_ENABLED",
  "MCP_STDIO_ALLOWED_COMMANDS",
  "MCP_STDIO_ALLOWED_ARGS",
  "MCP_STDIO_ALLOWED_ENV_KEYS",
] as const;

const originalEnv = Object.fromEntries(
  ENV_KEYS.map((key) => [key, process.env[key]])
);

afterEach(() => {
  for (const key of ENV_KEYS) {
    const value = originalEnv[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("Normalisation des préférences MCP", () => {
  it("fail-closed sur une ligne absente ou incomplète", () => {
    expect(toMcpRuntimePreferences(null)).toMatchObject({
      allowStdio: false,
      globalKillSwitch: true,
    });
    expect(toMcpRuntimePreferences({ allowStdio: true })).toMatchObject({
      allowStdio: false,
      globalKillSwitch: true,
    });
  });
});

describe("Politique MCP stdio", () => {
  const config = {
    authType: "none" as const,
    command: "brave-mcp",
    name: "test",
    transport: "stdio" as const,
  };
  const enabledPrefs = { allowStdio: true, globalKillSwitch: false };

  it("refuse stdio si la configuration serveur ne l'active pas", () => {
    delete process.env.MCP_STDIO_ENABLED;
    expect(() => checkAllowStdio(config, enabledPrefs)).toThrow(
      /désactivé par la configuration serveur/
    );
  });

  it("exige une allowlist de commandes même lorsque stdio est activé", () => {
    process.env.MCP_STDIO_ENABLED = "true";
    delete process.env.MCP_STDIO_ALLOWED_COMMANDS;
    expect(() => checkAllowStdio(config, enabledPrefs)).toThrow(
      /allowlist serveur/
    );
  });

  it("respecte le veto utilisateur même avec une allowlist", () => {
    process.env.MCP_STDIO_ENABLED = "true";
    process.env.MCP_STDIO_ALLOWED_COMMANDS = "brave-mcp";
    expect(() =>
      checkAllowStdio(config, { allowStdio: false, globalKillSwitch: false })
    ).toThrow(/paramètres globaux/);
  });

  it("refuse une préférence absente au lieu d'ouvrir par défaut", () => {
    process.env.MCP_STDIO_ENABLED = "true";
    process.env.MCP_STDIO_ALLOWED_COMMANDS = "brave-mcp";
    expect(() => checkAllowStdio(config, null)).toThrow(
      /préférences de sécurité/
    );
  });

  it("refuse les interpréteurs génériques même s'ils sont listés", () => {
    process.env.MCP_STDIO_ENABLED = "true";
    process.env.MCP_STDIO_ALLOWED_COMMANDS = "node";
    expect(() =>
      checkAllowStdio({ ...config, command: "node" }, enabledPrefs)
    ).toThrow(/générique interdite/);
  });

  it("exige une correspondance exacte des arguments stdio", () => {
    process.env.MCP_STDIO_ENABLED = "true";
    process.env.MCP_STDIO_ALLOWED_COMMANDS = "brave-mcp";
    process.env.MCP_STDIO_ALLOWED_ARGS = JSON.stringify({
      "brave-mcp": ["--profile", "production"],
    });
    const withArgs = { ...config, args: ["--profile", "production"] };
    expect(() => checkAllowStdio(withArgs, enabledPrefs)).not.toThrow();
    expect(() =>
      checkAllowStdio(
        { ...withArgs, args: ["--profile", "development"] },
        enabledPrefs
      )
    ).toThrow(/allowlist exacte/);
  });

  it("autorise uniquement un wrapper stdio explicitement activé", () => {
    process.env.MCP_STDIO_ENABLED = "true";
    process.env.MCP_STDIO_ALLOWED_COMMANDS = "brave-mcp";
    expect(() => checkAllowStdio(config, enabledPrefs)).not.toThrow();
  });
});
