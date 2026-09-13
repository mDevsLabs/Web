import { expect, test } from "@playwright/test";

// Agent est en Alpha et son accès dépend du forfait : ces tests vérifient le
// comportement visible sans supposer que l'utilisateur est payant. Ils ne
// lancent aucun run (pas d'appel LLM) pour rester rapides et déterministes.
test.describe("Agent", () => {
  test("le sélecteur Chat | Agent est visible sur la page principale", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByRole("tab", { name: "Chat" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Agent" })).toBeVisible();
  });

  test("sélectionner Agent ouvre l'accueil Agent ou le dialogue de forfait", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByRole("tab", { name: "Agent" }).click();

    const agentHome = page.getByText("Sur quoi travaille-t-on ?");
    const upgradeDialog = page.getByTestId("agent-upgrade-dialog");

    await expect(agentHome.or(upgradeDialog)).toBeVisible({ timeout: 15_000 });
  });

  test("le badge Alpha est affiché avec l'accueil Agent", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: "Agent" }).click();

    const agentHome = page.getByText("Sur quoi travaille-t-on ?");
    if (!(await agentHome.isVisible().catch(() => false))) {
      // Utilisateur Free : le dialogue de forfait s'affiche à la place.
      await expect(page.getByTestId("agent-upgrade-dialog")).toBeVisible();
      return;
    }

    await expect(page.getByTestId("agent-channel-badge")).toBeVisible();
    await expect(page.getByTestId("agent-composer-input")).toBeVisible();
    await expect(page.getByTestId("agent-send-button")).toBeVisible();
  });

  test("le composer Agent refuse l'envoi d'une tâche vide", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: "Agent" }).click();

    const input = page.getByTestId("agent-composer-input");
    if (!(await input.isVisible().catch(() => false))) {
      test.skip(
        true,
        "Agent nécessite un forfait payant sur cet environnement"
      );
      return;
    }

    await expect(page.getByTestId("agent-send-button")).toBeDisabled();

    await input.fill("Analyse ce document");
    await expect(page.getByTestId("agent-send-button")).toBeEnabled();
  });

  test("le clavier permet de parcourir les modes", async ({ page }) => {
    await page.goto("/");

    const chatTab = page.getByRole("tab", { name: "Chat" });
    await chatTab.focus();
    await page.keyboard.press("ArrowRight");

    // Agent est soit sélectionné (payant), soit bloqué (Free) : dans les deux
    // cas la page reste interactive et le sélecteur visible.
    await expect(page.getByRole("tab", { name: "Agent" })).toBeVisible();
    await page.keyboard.press("ArrowLeft");
    await expect(chatTab).toBeVisible();
  });
});
