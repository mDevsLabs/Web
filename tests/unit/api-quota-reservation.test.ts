import { describe, expect, it } from "vitest";
import {
  releaseApiRequestQuota,
  reserveApiQuotaOrRefuse,
  reserveApiRequestQuota,
} from "../../api-quota";
import type { SqlClient } from "../../openrouter-models";

describe("api-quota: suppression du quota public de requêtes", () => {
  const sql = (() => {}) as unknown as SqlClient;

  it("autorise immédiatement la réservation sans blocage de requêtes", async () => {
    const res = await reserveApiRequestQuota(sql, {
      apiKey: "mai-free-test",
      limit: 100,
      userId: "user-1",
      weekStartStr: "2026-11-16",
    });
    expect(res.reserved).toBe(true);
    expect(res.remaining).toBeGreaterThanOrEqual(100);
  });

  it("laisse passer la porte reserveApiQuotaOrRefuse avec le statut reserved", async () => {
    const res = await reserveApiQuotaOrRefuse(sql, {
      apiKey: "mai-plus-test",
      limit: 500,
      userId: "user-1",
      weekStartStr: "2026-11-16",
    });
    expect(res.status).toBe("reserved");
  });

  it("releaseApiRequestQuota s'exécute en no-op sécurisé", async () => {
    await expect(
      releaseApiRequestQuota(sql, "mai-plus-test")
    ).resolves.toBeUndefined();
  });
});
