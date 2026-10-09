import { describe, expect, it } from "vitest";
import type { BotIntegrationConfig } from "../../botSettingsTypes.js";
import {
  looksLikeCancelIntent,
  parseBotSlashCommand,
  resolveIntegrationProxyUrl,
  safeJsonParse,
  splitPlainText,
  websocketMessageToText,
} from "./common.js";

describe("splitPlainText", () => {
  it("splits long text on whitespace boundaries when possible", () => {
    const text =
      "alpha beta gamma delta epsilon zeta eta theta iota kappa lambda";
    const chunks = splitPlainText(text, 20);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.join(" ")).toContain("alpha beta");
    expect(chunks.every((item) => item.length <= 20)).toBe(true);
  });
});

describe("safeJsonParse", () => {
  it("returns null for invalid JSON", () => {
    expect(safeJsonParse("{bad")).toBeNull();
  });

  it("returns parsed data for valid JSON", () => {
    expect(safeJsonParse<{ ok: boolean }>('{"ok":true}')?.ok).toBe(true);
  });
});

describe("websocketMessageToText", () => {
  it("joins buffer fragments into utf8 text", () => {
    expect(
      websocketMessageToText([Buffer.from('{"ok"'), Buffer.from(":true}")])
    ).toBe('{"ok":true}');
  });
});

describe("resolveIntegrationProxyUrl", () => {
  it("reads the proxy from the active platform config", () => {
    const integration: BotIntegrationConfig = {
      id: "telegram-1",
      name: "Telegram",
      platform: "telegram",
      telegram: { botToken: "secret", proxyUrl: "http://127.0.0.1:7890" },
    };
    expect(resolveIntegrationProxyUrl(integration)).toBe(
      "http://127.0.0.1:7890"
    );
  });

  it("returns undefined when the current platform has no proxy configured", () => {
    const integration: BotIntegrationConfig = {
      id: "slack-1",
      name: "Slack",
      platform: "slack",
      slack: { appToken: "xapp-token", botToken: "xoxb-token" },
    };
    expect(resolveIntegrationProxyUrl(integration)).toBeUndefined();
  });
});

describe("parseBotSlashCommand", () => {
  it("treats /pause as a stop command alias", () => {
    expect(parseBotSlashCommand("/pause")).toEqual({ kind: "stop" });
  });
});

describe("looksLikeCancelIntent", () => {
  it("recognizes pause wording in english and chinese", () => {
    expect(looksLikeCancelIntent("pause")).toBe(true);
    expect(looksLikeCancelIntent("暂停一下")).toBe(true);
    expect(looksLikeCancelIntent("继续")).toBe(false);
  });
});
