import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

// La version attendue est lue dans `package.json`, la source unique de vérité
// (cf. `lib/version.ts`). La recopier ici ferait diverger le test à chaque
// publication, et l'échec n'apparaîtrait qu'en local bien plus tard : c'est
// exactement le mode de défaillance que `lib/version.ts` documente et empêche
// ailleurs. `tests/unit/app-version.test.ts` verrouille le même invariant.
const { version } = JSON.parse(
  readFileSync(
    path.resolve(import.meta.dirname, "..", "..", "package.json"),
    "utf8"
  )
) as { version: string };

// Le motif est ancré : sans ancres, `/0.9.1/` matcherait aussi « 0.9.10 » et
// « 0.9.15 », et le test passerait sur un titre qui n'est pas la version
// publiée. Ancré, il ne désigne qu'un titre — et le mode strict de Playwright
// échouerait si deux titres correspondaient.
const TITRE_VERSION = new RegExp(`^${version.replace(/\./g, "\\.")}$`);

// Les notes sont publiques : ce parcours n'a besoin ni de session ni de base.
for (const width of [390, 1280]) {
  test(`les notes de version restent lisibles à ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ height: 900, width });
    const statsRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/stats"))
        statsRequests.push(request.url());
    });
    const response = await page.goto("/changelog");
    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { exact: true, name: "Notes de version" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: TITRE_VERSION })
    ).toBeVisible();
    const size = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      width: document.documentElement.clientWidth,
    }));
    expect(size.scroll).toBeLessThanOrEqual(size.width + 1);
    expect(statsRequests).toEqual([]);
    await page.screenshot({
      fullPage: true,
      path: test.info().outputPath(`changelog-${width}.png`),
    });
    await page.evaluate(() => document.documentElement.classList.add("dark"));
    await page.screenshot({
      fullPage: true,
      path: test.info().outputPath(`changelog-dark-${width}.png`),
    });
  });
}
