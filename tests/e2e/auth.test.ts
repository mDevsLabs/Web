import { expect, test } from "@playwright/test";

test.describe("Pages d'authentification", () => {
  test("la page de connexion s'affiche correctement", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("heading", { name: "Connexion à mAI Web" })
    ).toBeVisible();
    await expect(page.getByLabel("E-mail ou Nom d'utilisateur")).toBeVisible();
    await expect(
      page.getByLabel("Mot de passe", { exact: true })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Continuer" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Créer un compte" })
    ).toBeVisible();
  });

  test("la page d'inscription s'affiche correctement", async ({ page }) => {
    await page.goto("/register");
    await expect(
      page.getByRole("heading", { name: "Créer un compte mAI Web" })
    ).toBeVisible();
    await expect(page.getByLabel("Nom d'utilisateur")).toBeVisible();
    await expect(page.getByLabel("Adresse e-mail")).toBeVisible();
    await expect(
      page.getByLabel("Mot de passe (6 caractères min.)")
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Continuer" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Se connecter" })
    ).toBeVisible();
  });

  test("navigation de la connexion vers l'inscription", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "Créer un compte" }).click();
    await expect(page).toHaveURL("/register");
  });

  test("navigation de l'inscription vers la connexion", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("link", { name: "Se connecter" }).click();
    await expect(page).toHaveURL("/login");
  });
});
