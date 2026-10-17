import { describe, expect, it, vi } from "vitest";
import type { BotIntegrationConfig } from "../botSettingsTypes.js";
import type { ShellSettings } from "../settingsStore.js";

vi.mock("../services/dialectic/dialectic.js", () => ({
  buildDialecticContextBlock: vi.fn(() => ""),
  buildRelationshipContextBlock: vi.fn(() => ""),
  runDialecticAnalysis: vi.fn(),
}));

import {
  type BotInboundMessage,
  type BotSessionState,
  buildBotOrchestratorPrompt,
  looksLikeQrLoginConfirmation,
  looksLikeQrLoginScreenshotResendRequest,
} from "./botRuntime.js";

describe("buildBotOrchestratorPrompt", () => {
  it("applies global always rules and auto reply language guidance to bot bridge replies", () => {
    const settings: ShellSettings = {
      agent: {
        rules: [
          {
            content: "Always reply in Japanese.",
            enabled: true,
            id: "always-rule",
            name: "Japanese Replies",
            scope: "always",
          },
          {
            content: "Only apply on TypeScript files.",
            enabled: true,
            globPattern: "**/*.ts",
            id: "glob-rule",
            name: "TypeScript Only",
            scope: "glob",
          },
        ],
      },
      language: "zh-CN",
    };
    const integration: BotIntegrationConfig = {
      id: "bot-1",
      name: "Test Bot",
      platform: "telegram",
      skills: [
        {
          content:
            "Always collect impact, scope, timeline, and rollback status before proposing actions.",
          description: "Triage production issues first.",
          enabled: true,
          id: "skill-1",
          name: "Ops Runbook",
          slug: "ops-runbook",
        },
      ],
    };
    const session: BotSessionState = {
      conversationKey: "conv-1",
      integrationId: integration.id,
      leaderMessages: [],
      mode: "agent",
      modelId: "model-1",
      threadIdsByWorkspace: {},
      workspaceRoot: null,
    };
    const inbound: BotInboundMessage = {
      conversationKey: "conv-1",
      senderName: "Alice",
      text: "hello",
    };

    const prompt = buildBotOrchestratorPrompt(
      settings,
      integration,
      session,
      inbound
    );

    expect(prompt).toContain("#### Rule: Japanese Replies");
    expect(prompt).toContain("Always reply in Japanese.");
    expect(prompt).not.toContain("#### Rule（路径匹配）: TypeScript Only");
    expect(prompt).toContain(
      "#### Rule: Langue : suivre le prompt utilisateur"
    );
    expect(prompt).toContain("screenshot_page");
    expect(prompt).toContain("click_element");
    expect(prompt).toContain("BrowserCapture");
    expect(prompt).toContain("pause_for_qr_login");
    expect(prompt).toContain("## Compétences exclusives au Bot");
    expect(prompt).toContain("Ops Runbook (./ops-runbook)");
    expect(prompt).toContain("Triage production issues first.");
    expect(prompt).toContain(
      "Always collect impact, scope, timeline, and rollback status before proposing actions."
    );
  });
});

describe("QR login helpers", () => {
  it("recognizes common QR login confirmation phrases", () => {
    expect(looksLikeQrLoginConfirmation("已登录")).toBe(true);
    expect(looksLikeQrLoginConfirmation("扫码完成")).toBe(true);
    expect(looksLikeQrLoginConfirmation("logged in")).toBe(true);
    expect(looksLikeQrLoginConfirmation("还没扫")).toBe(false);
  });

  it("detects requests to resend the QR screenshot", () => {
    expect(looksLikeQrLoginScreenshotResendRequest("请再发一下二维码")).toBe(
      true
    );
    expect(looksLikeQrLoginScreenshotResendRequest("resend the qr")).toBe(true);
    expect(looksLikeQrLoginScreenshotResendRequest("我已经登录了")).toBe(false);
  });
});
