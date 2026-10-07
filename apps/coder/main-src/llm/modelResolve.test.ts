import { describe, expect, it } from "vitest";
import type { ShellSettings } from "../settingsStore.js";
import { resolveModelRequest } from "./modelResolve.js";

describe("resolveModelRequest OAuth inference", () => {
  it("treats token-shaped Claude Code values as OAuth bearer credentials", () => {
    const settings: ShellSettings = {
      defaultModel: "model-claude",
      models: {
        enabledIds: ["model-claude"],
        entries: [
          {
            displayName: "Claude",
            id: "model-claude",
            providerId: "provider-claude-oauth",
            requestName: "claude-sonnet-4-5-20250929",
          },
        ],
        providers: [
          {
            apiKey: " sk-ant-oat-token-only ",
            displayName: "Claude Code",
            id: "provider-claude-oauth",
            paradigm: "anthropic",
          },
        ],
      },
    };

    const resolved = resolveModelRequest(settings, "model-claude");

    expect(resolved.ok).toBe(true);
    if (!resolved.ok) {
      return;
    }
    expect(resolved.oauthAuth).toEqual({
      accessToken: "sk-ant-oat-token-only",
      lastRefreshAt: 0,
      provider: "claude",
      refreshToken: "",
    });
    expect(resolved.providerIdentity).toEqual({ preset: "claude-code" });
  });
});
