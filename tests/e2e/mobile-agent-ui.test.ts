import { expect, test } from "@playwright/test";

async function skipWhenAuthenticationIsRequired(
  page: import("@playwright/test").Page
) {
  const loginHeading = page.getByRole("heading", {
    name: /Connexion à mAI Web/,
  });
  if (
    page.url().includes("/login") ||
    (await loginHeading.isVisible().catch(() => false))
  ) {
    test.skip(true, "Session absente : test mobile authentifié requis");
  }
}

async function expectNoHorizontalOverflow(
  page: import("@playwright/test").Page
) {
  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
}

test.describe("Agent et plugins sur mobile", () => {
  test("le composer Agent reste dans le viewport", async ({ page }) => {
    await page.goto("/");
    await skipWhenAuthenticationIsRequired(page);
    await page.getByRole("tab", { name: "Agent" }).click();

    const composer = page.getByTestId("agent-composer-input");
    if (await composer.isVisible().catch(() => false)) {
      await expect(composer).toBeVisible();
      await expect(page.getByTestId("agent-send-button")).toBeVisible();
    }

    const switcher = page.getByTestId("home-mode-switcher");
    await expect(switcher).toBeVisible();
    const box = await switcher.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(
      (await page.evaluate(() => window.innerWidth)) + 1
    );
    await expectNoHorizontalOverflow(page);
  });

  test("le tiroir de navigation reste atteignable en mode Agent", async ({
    page,
  }) => {
    await page.goto("/");
    await skipWhenAuthenticationIsRequired(page);
    await page.getByRole("tab", { name: "Agent" }).click();

    // `ChatShell` remplace l'en-tête du Chat : c'est `AgentShell` qui doit porter
    // le déclencheur, sinon la navigation disparaît sur mobile.
    const toggle = page.getByTestId("agent-nav-toggle");
    await expect(toggle).toBeVisible();

    // Cible tactile : 44px de côté, pas les 32px d'un bouton desktop.
    const box = await toggle.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);

    await toggle.click();

    // Le tiroir doit s'ouvrir sur la navigation réelle.
    await expect(page.locator('[data-slot="sidebar"]').first()).toBeVisible();
  });

  test("la fiche plugin expose la sécurité et des actions tactiles", async ({
    page,
  }) => {
    await page.goto("/tools/plugins/weather");
    await skipWhenAuthenticationIsRequired(page);

    await expect(
      page.getByRole("heading", { exact: true, name: "Météo" }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Permissions et sécurité" })
    ).toBeVisible();
    await expect(page.getByText("Outils et capacités")).toBeVisible();

    const action = page.getByRole("button", { name: /Installer|Désinstaller/ });
    if (await action.isVisible().catch(() => false)) {
      const box = await action.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(32);
    }

    await expectNoHorizontalOverflow(page);
  });
});
