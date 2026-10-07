import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkMaiQuotaAvailable } from "./maiAccountStore.js";
import type { ShellSettings } from "./settingsStore.js";

describe("checkMaiQuotaAvailable", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns available: true when no mAI account is configured", async () => {
    const settings: ShellSettings = {};
    const result = await checkMaiQuotaAvailable(settings);
    expect(result.available).toBe(true);
  });

  it("returns available: false with warning message when local cached usage is exhausted", async () => {
    const settings: ShellSettings = {
      maiAccount: {
        jwtToken: "mock-jwt-token",
        usage: {
          limit: 5_000_000,
          resetAt: "2026-08-31T00:00:00Z",
          tokensUsed: 5_000_000,
        },
      },
    };

    const result = await checkMaiQuotaAvailable(settings, false);
    expect(result.available).toBe(false);
    expect(result.message).toContain("épuisé");
  });

  it("returns available: true when local cached usage is within limits", async () => {
    const settings: ShellSettings = {
      maiAccount: {
        jwtToken: "mock-jwt-token",
        usage: {
          limit: 5_000_000,
          tokensUsed: 1000,
        },
      },
    };

    const result = await checkMaiQuotaAvailable(settings, false);
    expect(result.available).toBe(true);
  });

  it("performs fresh check via API when forceFresh is true", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        limit: 5_000_000,
        resetAt: "2026-09-01T00:00:00Z",
        tokensUsed: 6_000_000,
      }),
      ok: true,
    });
    vi.stubGlobal("fetch", fetchMock);

    const settings: ShellSettings = {
      maiAccount: {
        jwtToken: "mock-jwt-token",
        usage: {
          limit: 5_000_000,
          tokensUsed: 100,
        },
      },
    };

    const result = await checkMaiQuotaAvailable(settings, true);
    expect(fetchMock).toHaveBeenCalled();
    expect(result.available).toBe(false);
    expect(result.message).toContain("épuisé");
  });
});
