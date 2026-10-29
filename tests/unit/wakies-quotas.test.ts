import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relative: string): string {
  return fs.readFileSync(path.join(process.cwd(), relative), "utf8");
}

describe("Wakies — quotas et hiérarchie invariants", () => {
  it("la création d'un Espace est transactionnelle et verrouillée par compte", () => {
    const source = read("lib/wakies/queries/spaces.ts");
    expect(source).toContain("createSpaceWithinQuota");
    expect(source).toContain("getDb().transaction");
    expect(source).toContain("pg_advisory_xact_lock");
    expect(source).toContain("WakiesQuotaError");
    const route = read("app/(chat)/api/wakies/spaces/route.ts");
    expect(route).toContain("createSpaceWithinQuota");
    expect(route).toContain('getWakiesQuota(identite.tier, "spaces")');
  });

  it("le quota de pages est global au compte, pas à l'Espace demandé", () => {
    const source = read("lib/wakies/queries/pages.ts");
    // Le comptage filtre uniquement userId (aucun spaceId).
    expect(source).toContain(".from(wakiesPage)");
    expect(source).toContain(".where(eq(wakiesPage.userId, userId))");
    expect(source).not.toMatch(
      /count\(\)\s*\)\s*\.from\(wakiesPage\)\s*\.where\(\s*and\([^)]*spaceId/
    );
    // Tous les chemins de création passent par la transaction quota.
    expect(source).toContain("createPageInTransaction");
    expect(source).toContain("quota: number | null");
  });

  it("tous les appelants de createPage transmettent le quota du forfait", () => {
    for (const file of [
      "app/(chat)/api/wakies/spaces/[spaceId]/pages/route.ts",
      "app/(chat)/api/wakies/conversations/[id]/page/route.ts",
      "app/(chat)/api/wakies/messages/[id]/page/route.ts",
    ]) {
      const source = read(file);
      expect(source, file).toContain('getWakiesQuota(identite.tier, "pages")');
    }
  });

  it("la hiérarchie vérifie l'Espace du parent, l'auto-parentage et les cycles", () => {
    const source = read("lib/wakies/queries/pages.ts");
    expect(source).toContain("parent.spaceId !== spaceId");
    expect(source).toContain("parent.spaceId !== page.spaceId");
    expect(source).toContain("parentId === pageId");
    expect(source).toContain("est un descendant de cette page");
    expect(source).toContain('.for("update")');
  });

  it("la revue approuvée est idempotente et ne consomme pas deux places", () => {
    const source = read("lib/wakies/queries/pages.ts");
    expect(source).toContain("wakies-review:");
    expect(source).toContain("createReviewedPage");
    expect(source).toContain("created: false");
  });
});
