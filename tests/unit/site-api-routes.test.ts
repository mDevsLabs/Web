import { describe, expect, it } from "vitest";
import { SITE_API_ROUTES } from "@/lib/site/api-routes";

describe("Routes API Site (SITE_API_ROUTES)", () => {
  it("définit des chemins d'API tous préfixés par /api/site/", () => {
    expect(SITE_API_ROUTES.devKeys).toBe("/api/site/dev-keys");
    expect(SITE_API_ROUTES.devKey("key_123")).toBe("/api/site/dev-keys/key_123");
    expect(SITE_API_ROUTES.apiExecutor).toBe("/api/site/account/api-executor");
    expect(SITE_API_ROUTES.devices).toBe("/api/site/v1/devices");
    expect(SITE_API_ROUTES.device("dev_456")).toBe("/api/site/v1/devices/dev_456");
    expect(SITE_API_ROUTES.devicesOthers).toBe("/api/site/v1/devices/others");
    expect(SITE_API_ROUTES.models).toBe("/api/site/v1/models");
    expect(SITE_API_ROUTES.modelsAudio).toBe("/api/site/v1/models/audio");
    expect(SITE_API_ROUTES.modelsImages).toBe("/api/site/v1/models/images");
    expect(SITE_API_ROUTES.modelsMai).toBe("/api/site/v1/models/mai");
    expect(SITE_API_ROUTES.status).toBe("/api/site/v1/status");
    expect(SITE_API_ROUTES.supportUpload).toBe("/api/site/support/upload");
    expect(SITE_API_ROUTES.githubActivity()).toBe("/api/site/github/activity");
    expect(SITE_API_ROUTES.githubActivity("owner/repo")).toBe(
      "/api/site/github/activity?repo=owner%2Frepo"
    );
    expect(SITE_API_ROUTES.githubReleases("owner/repo", true)).toBe(
      "/api/site/github/releases?repo=owner%2Frepo&pre=true"
    );
    expect(SITE_API_ROUTES.githubStats("owner/repo")).toBe(
      "/api/site/github/stats?repo=owner%2Frepo"
    );
  });
});
