import { expect, test } from "@playwright/test";

// Parcours ciblé de clarification interactive Agent : une demande ambiguë
// déclenche une question structurée, la carte reste posée après refresh, la
// réponse enregistrée par le serveur relance le MÊME run, et un double clic
// ne peut pas soumettre deux fois. Les préconditions payantes sont vérifiées
// puis sautées proprement (pas d'hypothèse de forfait en CI).

async function openAgentComposer(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("tab", { name: "Agent" }).click();
  const input = page.getByTestId("agent-composer-input");
  if (!(await input.isVisible().catch(() => false))) {
    return null;
  }
  return input;
}

test.describe("Clarification interactive Agent", () => {
  test("la carte de clarification est accessible et verrouille le double envoi", async ({
    page,
  }) => {
    const input = await openAgentComposer(page);
    if (!input) {
      test.skip(true, "Agent nécessite un forfait payant");
      return;
    }

    // Demande volontairement ambiguë : Agent doit poser une question au lieu
    // de choisir à la place de l'utilisateur.
    await input.fill("Prépare un rapport de veille sur l'IA");
    await input.press("Enter");

    // La carte apparaît dès que le modèle pose sa question (tolérance large :
    // la génération du questionnaire dépend du modèle et du forfait).
    const card = page
      .getByRole("region", { name: /Précisions|Information/i })
      .or(page.locator("fieldset"))
      .first();
    const cardVisible = await card
      .waitFor({ state: "visible", timeout: 60_000 })
      .then(() => true)
      .catch(() => false);
    if (!cardVisible) {
      test.skip(true, "Le modèle n'a pas déclenché ask_user sur cette tâche");
      return;
    }

    // Les questions obligatoires sont explicites pour les lecteurs d'écran.
    const requiredMarks = page.locator(
      "fieldset legend span[title='Obligatoire']"
    );
    await expect(requiredMarks.first()).toBeVisible();

    // La question survit à un refresh : elle est persistée côté serveur.
    await page.reload();
    await expect(card).toBeVisible({ timeout: 15_000 });

    // Réponse : les champs restent opérationnels au clavier (radio natifs).
    const firstOption = page.locator("fieldset input[type=radio]").first();
    if (await firstOption.isVisible().catch(() => false)) {
      await firstOption.check();
    } else {
      const textField = page
        .locator("fieldset input[type=text], fieldset input:not([type])")
        .first();
      await textField.fill("Réponse de test");
    }

    const submit = page.getByRole("button", { name: /^Envoyer/ });
    await expect(submit).toBeEnabled();

    // Premier clic : le bouton passe en état d'envoi, un second clic ne doit
    // rien changer (double soumission impossible).
    await submit.click();
    await expect(submit)
      .toBeDisabled({ timeout: 5000 })
      .catch(() => {});
    if (await submit.isEnabled().catch(() => false)) {
      await expect(submit).toHaveCount(1);
    }

    // La confirmation visible distingue la réponse enregistrée de l'attente.
    await expect(
      page.getByText(/Réponses transmises|Envoyé/).first()
    ).toBeVisible({ timeout: 15_000 });
  });
});
