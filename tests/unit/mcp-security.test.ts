import { afterEach, describe, expect, it } from "vitest";
import { checkAllowStdio } from "@/lib/mcp/client";

const originalEnabled = process.env.MCP_STDIO_ENABLED;
const originalCommands = process.env.MCP_STDIO_ALLOWED_COMMANDS;

afterEach(() => {
  if (originalEnabled === undefined) delete process.env.MCP_STDIO_ENABLED;
  else process.env.MCP_STDIO_ENABLED = originalEnabled;
  if (originalCommands === undefined)
    delete process.env.MCP_STDIO_ALLOWED_COMMANDS;
  else process.env.MCP_STDIO_ALLOWED_COMMANDS = originalCommands;
});

describe("Politique MCP stdio", () => {
  const config = {
    authType: "none" as const,
    command: "node",
    name: "test",
    transport: "stdio" as const,
  };

  it("refuse stdio si la configuration serveur ne l'active pas", () => {
    delete process.env.MCP_STDIO_ENABLED;
    expect(() => checkAllowStdio(config, { allowStdio: true })).toThrow(
      /désactivé par la configuration serveur/
    );
  });

  it("exige une allowlist de commandes même lorsque stdio est activé", () => {
    process.env.MCP_STDIO_ENABLED = "true";
    delete process.env.MCP_STDIO_ALLOWED_COMMANDS;
    expect(() => checkAllowStdio(config, { allowStdio: true })).toThrow(
      /allowlist serveur/
    );
  });

  it("respecte le veto utilisateur même avec une allowlist", () => {
    process.env.MCP_STDIO_ENABLED = "true";
    process.env.MCP_STDIO_ALLOWED_COMMANDS = "node";
    expect(() => checkAllowStdio(config, { allowStdio: false })).toThrow(
      /paramètres globaux/
    );
  });

  it("autorise uniquement une configuration explicitement activée", () => {
    process.env.MCP_STDIO_ENABLED = "true";
    process.env.MCP_STDIO_ALLOWED_COMMANDS = "node";
    expect(() => checkAllowStdio(config, { allowStdio: true })).not.toThrow();
  });
});
