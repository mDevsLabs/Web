import { describe, expect, it } from "vitest";
import { SITE_API_ROUTES } from "@/lib/site/api-routes";

describe("Routes API Site (SITE_API_ROUTES)", () => {
  it("définit uniquement les routes conservées et toutes préfixées par /api/site/", () => {
    expect(SITE_API_ROUTES.accountPlan).toBe("/api/site/v1/plan");
    expect(SITE_API_ROUTES.devices).toBe("/api/site/v1/devices");
    expect(SITE_API_ROUTES.device("dev_456")).toBe(
      "/api/site/v1/devices/dev_456"
    );
    expect(SITE_API_ROUTES.devicesOthers).toBe("/api/site/v1/devices/others");
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

    const record = SITE_API_ROUTES as Record<string, unknown>;
    expect(record.devKeys).toBeUndefined();
    expect(record.apiExecutor).toBeUndefined();
    expect(record.models).toBeUndefined();
    expect(record.modelsAudio).toBeUndefined();
    expect(record.modelsImages).toBeUndefined();
    expect(record.modelsMai).toBeUndefined();
  });
});
