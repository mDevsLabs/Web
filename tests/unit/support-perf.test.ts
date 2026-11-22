import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const ROOT = process.cwd();

function read(relPath: string): string {
  return readFileSync(join(ROOT, relPath), "utf8");
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("Performance support & migration 0090", () => {
  it("déclare la migration idempotente 0090_support_perf_indexes et son entrée de journal", () => {
    const sqlPath = "lib/db/migrations/0090_support_perf_indexes.sql";
    expect(existsSync(join(ROOT, sqlPath))).toBe(true);

    const sql = read(sqlPath);
    expect(sql).toContain(
      "to_regclass('public.\"support_tickets\"') IS NOT NULL"
    );
    expect(sql).toContain(
      "to_regclass('public.\"support_ticket_messages\"') IS NOT NULL"
    );
    expect(sql).toContain(
      "to_regclass('public.\"support_ticket_attachments\"') IS NOT NULL"
    );
    for (const indexName of [
      "idx_support_tickets_user_email",
      "idx_support_tickets_archived_updated_at",
      "idx_support_tickets_user_id_updated_at",
      "idx_support_tickets_user_email_updated_at",
      "idx_support_messages_ticket_id_created_at",
      "idx_support_attachments_ticket_id_created_at",
    ]) {
      expect(sql).toContain(indexName);
    }

    const journal = JSON.parse(read("lib/db/migrations/meta/_journal.json"));
    const lastEntry = journal.entries.at(-1);
    expect(lastEntry).toEqual({
      breakpoints: true,
      idx: 87,
      tag: "0090_support_perf_indexes",
      version: "7",
      when: 1_795_400_000_000,
    });
  });

  it("déduplique les requêtes concurrentes de getSupportStatus et utilise un repli sans API", async () => {
    vi.resetModules();
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        components: [{ id: "web", name: "Web", status: "OPERATIONAL" }],
        page: { name: "mAI", status: "UP", url: "https://mai.instatus.com/" },
        updated_at: "2026-11-22T12:00:00.000Z",
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const { getSupportStatus } = await import("@/lib/site/support-status");
    const [a, b] = await Promise.all([getSupportStatus(), getSupportStatus()]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(a.source).toBe("instatus");
    expect(b.page.status).toBe("UP");

    vi.resetModules();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Instatus timeout"))
    );
    const { getSupportStatus: getFallbackStatus } = await import(
      "@/lib/site/support-status"
    );
    const fallback = await getFallbackStatus();
    expect(fallback.source).toBe("fallback");
    expect(fallback.services.some((s) => s.name === "Modèles IA")).toBe(true);
    expect(fallback.services.some((s) => s.name.includes("API"))).toBe(false);
  });

  it("respecte Suspense / cacheComponents, supprime les faux taux 100%/2.4h et place le footer au premier plan", () => {
    const footer = read("components/site/footer.tsx");
    expect(footer).toContain("z-40");

    expect(
      existsSync(
        join(ROOT, "components/site/support/SupportDocumentationSearch.tsx")
      )
    ).toBe(false);

    const dashboardClient = read(
      "app/(chat)/site/support/SupportDashboardClient.tsx"
    );
    expect(dashboardClient).not.toContain("SupportDocumentationSearch");
    expect(dashboardClient).toContain("getSupportDashboardData");

    const statsClient = read(
      "app/(chat)/site/support/stats/SupportStatsClient.tsx"
    );
    expect(statsClient).not.toContain("resolutionRate || 100");
    expect(statsClient).not.toContain("avgResolutionHours || 2.4");

    const actionsSupport = read("app/(chat)/site/actions/support.ts");
    expect(actionsSupport).toContain("getRawClient");
    expect(actionsSupport).toContain("getMaiUser");
    expect(actionsSupport).not.toContain(
      "? Math.round(Number.parseFloat(avgTimeRow"
    );

    for (const pagePath of [
      "app/(chat)/site/support/page.tsx",
      "app/(chat)/site/support/stats/page.tsx",
      "app/(chat)/site/support/tickets/page.tsx",
      "app/(chat)/site/support/tickets/[id]/page.tsx",
    ]) {
      const content = read(pagePath);
      expect(content).toContain("<Suspense fallback={");
      expect(content).not.toMatch(
        /export\s+const\s+(?:dynamic|runtime|revalidate)\b/
      );
    }
  });
});
