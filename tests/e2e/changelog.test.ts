import { expect, test } from "@playwright/test";

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
      page.getByRole("heading", { name: "0.9.1 — 30 septembre 2026" })
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
