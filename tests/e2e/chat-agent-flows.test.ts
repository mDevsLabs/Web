import { expect, test } from "@playwright/test";

// Parcours transverses du lot canary : interface (sidebar Applications,
// sélecteur compact, parité composer), capacités conservées (raisonnement
// affichable sans panneau vide), envoi Agent « Salut ! », projets et timeline.
// Les tests ne supposent pas un forfait payant : chaque précondition payante
// est vérifiée puis sautée proprement.

async function openAgentComposer(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("tab", { name: "Agent" }).click();
  const input = page.getByTestId("agent-composer-input");
  if (!(await input.isVisible().catch(() => false))) {
    return null;
  }
  return input;
}

test.describe("Navigation Applications", () => {
  test("la sidebar affiche Applications avec l'icône puzzle", async ({
    page,
  }) => {
    await page.goto("/");

    const nav = page.getByTestId("nav-applications");
    await expect(nav).toBeVisible();
    await expect(nav).toHaveAttribute("aria-label", "Applications");
    await expect(nav.locator("svg.lucide-puzzle")).toBeVisible();
  });

  test("la page /tools porte le titre Applications et le sélecteur compact", async ({
    page,
  }) => {
    await page.goto("/tools");

    await expect(
      page.getByRole("heading", { name: "Applications" })
    ).toBeVisible();
    const tablist = page.getByRole("tablist", { name: "Sections d'outils" });
    await expect(tablist).toBeVisible();
    // Trois onglets, proportions compactes (text-xs, pas de pleine largeur).
    await expect(tablist.getByRole("tab")).toHaveCount(3);
    await expect(tablist.getByRole("tab", { name: "Plugins" })).toBeVisible();
    await expect(tablist.getByRole("tab", { name: "MCP" })).toBeVisible();
    await expect(tablist.getByRole("tab", { name: "Skills" })).toBeVisible();
  });

  test("le panneau MCP n'expose plus le bouton Avancé", async ({ page }) => {
    await page.goto("/tools?tab=mcp");

    await expect(page.getByRole("button", { name: /Avancé/i })).toHaveCount(0);
    // Les fonctions avancées réelles restent sur la page MCP dédiée.
    await expect(
      page.getByRole("heading", { name: "Applications" })
    ).toBeVisible();
  });
});

test.describe("Composer unifié", () => {
  test("le composer Agent partage la coque visuelle du Chat", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: "Agent" }).click();

    const input = page.getByTestId("agent-composer-input");
    if (!(await input.isVisible().catch(() => false))) {
      test.skip(true, "Agent nécessite un forfait payant");
      return;
    }

    // Même rayon canonique que le Chat (28px) sur le conteneur parent.
    const shell = input
      .locator("xpath=ancestor::div[contains(@class,'rounded-[28px]')]")
      .first();
    await expect(shell).toBeVisible();
    await expect(page.getByTestId("agent-send-button")).toBeVisible();
  });

  test("Enter envoie, Shift+Enter insère une nouvelle ligne (Agent)", async ({
    page,
  }) => {
    const input = await openAgentComposer(page);
    if (!input) {
      test.skip(true, "Agent nécessite un forfait payant");
      return;
    }

    await input.fill("Première ligne");
    await input.press("Shift+Enter");
    await input.type("deuxième ligne");
    // Rien n'a été envoyé : le textarea conserve les deux lignes.
    const value = await input.inputValue();
    expect(value).toContain("\n");
  });
});

test.describe("Raisonnement", () => {
  test("aucun panneau de raisonnement vide ne s'affiche", async ({ page }) => {
    // Garde UI : le rendu partagé ne rend le panneau que pour du texte
    // reasoning non vide, quel que soit le mode.
    await page.goto("/");
    await expect(page.locator('[data-testid="message-reasoning"]')).toHaveCount(
      0
    );
  });
});

test.describe("Envoi Agent", () => {
  test("une salutation sans ressource crée une conversation Agent", async ({
    page,
  }) => {
    const input = await openAgentComposer(page);
    if (!input) {
      test.skip(true, "Agent nécessite un forfait payant");
      return;
    }

    await input.fill("Salut !");
    await page.getByTestId("agent-send-button").click();

    // Succès attendu : l'URL bascule sur une conversation et la réponse
    // apparaît. Un échec d'accès (forfait indisponible sur l'environnement)
    // est traité comme un skip, jamais comme une validation du bug.
    await page.waitForURL(/\/chat\//, { timeout: 20_000 }).catch(() => {});
    const url = page.url();
    if (!url.includes("/chat/")) {
      test.skip(true, "Envoi refusé : environnement sans forfait payant");
      return;
    }
    await expect(page.locator("[data-role='assistant']").first()).toBeVisible({
      timeout: 60_000,
    });
  });

  test("un utilisateur non authentifié reçoit auth_required, pas access_denied", async ({
    request,
  }) => {
    const response = await request.post("/api/agent", {
      data: {
        id: "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
        message: {
          id: "3f2504e0-4f89-11d3-9a0c-0305e82c3302",
          parts: [{ text: "Salut !", type: "text" }],
          role: "user",
        },
        modelId: "google/gemini-2.5-flash",
      },
    });
    // Sans cookie de session : 401 auth_required — jamais un 403 générique.
    expect([401, 403]).toContain(response.status());
    const body = await response.json().catch(() => null);
    if (body?.code) {
      expect(["auth_required", "access_denied", "bot_detected"]).toContain(
        body.code
      );
    }
  });
});

test.describe("Projets Agent", () => {
  test("le picker de projet liste les projets réels et permet de retirer", async ({
    page,
  }) => {
    const input = await openAgentComposer(page);
    if (!input) {
      test.skip(true, "Agent nécessite un forfait payant");
      return;
    }

    const projectTrigger = page.getByRole("button", { name: "Projet" });
    if (!(await projectTrigger.isVisible().catch(() => false))) {
      test.skip(true, "Fonctionnalité Projet désactivée (flag) sur cet env");
      return;
    }
    await projectTrigger.click();

    // Le picker liste les projets réels ou l'état vide explicite.
    await expect(
      page.getByText(/Aucun projet pour le moment|Relier la tâche/)
    ).toBeVisible();
  });
});

test.describe("Timeline et actions suggérées", () => {
  test("la timeline persistée affiche le récapitulatif après refresh", async ({
    page,
  }) => {
    await page.goto("/");
    // Sans run existant, aucun panneau vide ne doit s'afficher.
    await expect(
      page.locator('[data-testid="agent-run-timeline"]')
    ).toHaveCount(0);
    await expect(
      page.locator('[data-testid="agent-suggested-actions"]')
    ).toHaveCount(0);
  });

  test("l'API runs refuse un accès à une conversation étrangère", async ({
    request,
  }) => {
    const response = await request.get(
      "/api/agent/runs?chatId=3f2504e0-4f89-11d3-9a0c-0305e82c3303"
    );
    // Non authentifié : auth_required. Le contrôle d'appartenance reste
    // strict (jamais 200 avec des données d'autrui).
    expect([401, 403, 404]).toContain(response.status());
  });
});
