"use strict";
const { createRequire } = require("node:module");
const requireHost = createRequire(`${process.cwd()}/package.json`);
const { chromium } = requireHost("@playwright/test");
const fs = require("node:fs");
const outputDir =
  process.env.WAKIES_UI_OUTPUT || "docs/3-wakies/verification/ui-after";
let browser;
(async () => {
  fs.mkdirSync(outputDir, { recursive: true });
  browser = await chromium.launch({ channel: "msedge", headless: true });
  const results = [];
  const space = {
    createdAt: 1,
    description: "",
    id: "space-test",
    name: "Personnel",
  };
  const wakie = {
    createdAt: 1,
    id: "wakie-test",
    instructions: "Aider",
    memoryAllowed: true,
    model: null,
    name: "Wakie",
    researchAllowed: true,
    spaceId: space.id,
    spaceIds: [space.id],
  };
  const conversation = {
    createdAt: 1,
    id: "11111111-1111-4111-8111-111111111111",
    model: null,
    ownerId: "fixture",
    title: "Conversation de test",
    wakieId: wakie.id,
  };
  for (const [width, height] of [
    [375, 812],
    [430, 932],
    [768, 1024],
    [1440, 900],
  ]) {
    const context = await browser.newContext({ viewport: { height, width } });
    const page = await context.newPage();
    const errors = [];
    const savedMessages = [];
    page.on("pageerror", (error) => {
      errors.push(error.message);
      console.log("ERREUR UI", error.stack);
    });
    page.on("request", (request) => {
      if (request.url().includes("/api/wakies/"))
        console.log("API UI", new URL(request.url()).pathname);
    });
    await page.route("**/api/**", (route) => {
      const url = new URL(route.request().url());
      let data = {};
      if (url.pathname === "/api/wakies/chat") {
        const request = route.request().postDataJSON();
        if (
          request.conversationId !== conversation.id ||
          request.messages.at(-1)?.role !== "user"
        )
          throw new Error(
            "Le transport envoie la mauvaise conversation ou le mauvais rôle"
          );
        const answer = `ui-answer-${width}`;
        savedMessages.push(request.messages.at(-1), {
          id: answer,
          parts: [
            { text: "Réponse IA de contrôle reçue.", type: "text" },
            {
              input: {},
              output: "Résultat de contrôle",
              state: "output-available",
              toolCallId: "ui-call",
              type: "tool-ui_check",
            },
          ],
          role: "assistant",
        });
        const chunks = [
          { messageId: answer, type: "start" },
          { id: "ui-text", type: "text-start" },
          {
            delta: "Réponse IA de contrôle reçue.",
            id: "ui-text",
            type: "text-delta",
          },
          { id: "ui-text", type: "text-end" },
          {
            input: {},
            toolCallId: "ui-call",
            toolName: "ui_check",
            type: "tool-input-available",
          },
          {
            output: "Résultat de contrôle",
            toolCallId: "ui-call",
            type: "tool-output-available",
          },
          { finishReason: "stop", type: "finish" },
        ];
        return route.fulfill({
          body: `${chunks
            .map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`)
            .join("")}data: [DONE]\n\n`,
          headers: {
            "Content-Type": "text/event-stream",
            "x-vercel-ai-ui-message-stream": "v1",
          },
          status: 200,
        });
      }
      if (url.pathname === "/api/wakies/state")
        data = {
          configured: true,
          memories: [],
          mode: "live",
          settings: {
            memoryAllowed: true,
            name: "Wakies",
            onboardingCompleted: true,
            paused: false,
            researchAllowed: true,
          },
          tasks: [],
        };
      else if (url.pathname === "/api/wakies/workspace")
        data = {
          calls: [],
          conversations: [conversation],
          setup: {
            browser: false,
            computers: false,
            intelligence: false,
            missing: [],
            model: true,
            slack: "not_configured",
            voice: false,
          },
          spaces: [space],
          wakies: [wakie],
        };
      else if (url.pathname.endsWith("/messages"))
        data = {
          messages: [
            {
              id: "u-old",
              parts: [{ text: "Bonjour Wakie", type: "text" }],
              role: "user",
            },
            {
              id: "a-old",
              parts: [
                {
                  text: "Bonjour ! Ceci est un état de test UI.",
                  type: "text",
                },
              ],
              role: "assistant",
            },
            ...savedMessages,
          ],
          seqProchain: null,
        };
      else if (
        url.pathname.endsWith("/page-context") ||
        url.pathname.endsWith("/capture")
      )
        data = null;
      else if (url.pathname === "/api/wakies/files")
        data = url.searchParams.has("pathname")
          ? {
              mediaType: "text/plain",
              name: "test.txt",
              pathname: "uploads/fixture/test.txt",
              size: 12,
              url: "https://files.example/test",
            }
          : {
              cursor: null,
              files: [
                {
                  name: "test.txt",
                  pathname: "uploads/fixture/test.txt",
                  size: 12,
                  uploadedAt: 1,
                },
              ],
            };
      else if (url.pathname === "/api/models")
        data = {
          capabilities: { "gpt-5": { tools: true } },
          models: [
            {
              id: "gpt-5",
              name: "Modèle de test",
              provider: "openai",
              supported_parameters: ["tools"],
            },
          ],
        };
      else if (url.pathname === "/api/plugins") data = { plugins: [] };
      else if (
        url.pathname === "/api/skills" ||
        url.pathname === "/api/mcp" ||
        url.pathname.endsWith("/pages")
      )
        data = [];
      return route.fulfill({
        body: JSON.stringify(data),
        contentType: "application/json",
        status: 200,
      });
    });
    await page.goto("http://localhost:3100/login-wakies-preview", {
      timeout: 600_000,
      waitUntil: "domcontentloaded",
    });
    console.log(
      "HTML UI",
      width,
      (await page.locator("body").innerText()).slice(0, 700)
    );
    await page
      .getByRole("navigation", { name: "Vues de Wakies" })
      .waitFor({ timeout: 300_000 });
    await page
      .getByRole("navigation", { name: "Vues de Wakies" })
      .getByRole("button", { exact: true, name: "Objectifs" })
      .click();
    await page
      .getByRole("navigation", { name: "Vues de Wakies" })
      .getByRole("button", { exact: true, name: "Applications" })
      .click();
    await page.screenshot({ path: `${outputDir}/apps-${width}.png` });
    await page
      .getByRole("navigation", { name: "Vues de Wakies" })
      .getByRole("button", { exact: true, name: "Conversation" })
      .click();
    const conversationButton = page
      .locator(".muse-conversation-row > .nav-item")
      .filter({ hasText: "Conversation de test" });
    if (!(await conversationButton.isVisible())) {
      const openNav = page.getByRole("button", {
        exact: true,
        name: "Ouvrir la navigation",
      });
      await openNav.click();
      const drawer = page.getByRole("dialog", { name: "Navigation de Wakies" });
      await drawer.waitFor();
      await page.screenshot({ path: `${outputDir}/navigation-${width}.png` });
      for (let i = 0; i < 12; i++) {
        await page.keyboard.press("Tab");
        if (
          !(await drawer.evaluate((element) =>
            element.contains(document.activeElement)
          ))
        )
          throw new Error(`Le focus quitte le menu à ${width}`);
      }
      await page.keyboard.press("Escape");
      await drawer.waitFor({ state: "hidden" });
      await openNav.click();
    }
    await conversationButton.waitFor({ state: "visible" });
    await conversationButton.click();
    await page
      .getByText("Bonjour ! Ceci est un état de test UI.", { exact: true })
      .waitFor();
    await page.locator("textarea").last().fill("Brouillon conservé");
    await page
      .getByRole("navigation", { name: "Vues de Wakies" })
      .getByRole("button", { exact: true, name: "Applications" })
      .click();
    await page
      .getByRole("navigation", { name: "Vues de Wakies" })
      .getByRole("button", { exact: true, name: "Conversation" })
      .click();
    await page
      .getByText("Bonjour ! Ceci est un état de test UI.", { exact: true })
      .waitFor();
    if (
      (await page.locator("textarea").last().inputValue()) !==
      "Brouillon conservé"
    )
      throw new Error("Brouillon perdu au changement de vue");
    await page
      .getByRole("button", { name: "Choisir un fichier enregistré" })
      .click();
    await page
      .getByRole("dialog")
      .getByText("test.txt", { exact: true })
      .waitFor();
    await page.screenshot({ path: `${outputDir}/files-${width}.png` });
    await page
      .getByRole("dialog")
      .getByRole("button", { exact: true, name: "Joindre" })
      .click();
    await page
      .locator(".composer-piece-name")
      .filter({ hasText: "test.txt" })
      .waitFor();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth
    );
    await page.screenshot({
      fullPage: true,
      path: `${outputDir}/fixture-${width}.png`,
    });
    const controls = await page.evaluate(() => {
      const send = document.querySelector(".send-button");
      const icon = send?.querySelector("svg");
      const nav = [
        ...document.querySelectorAll(".muse-navigation button"),
      ].filter((item) => item.getClientRects().length);
      return {
        iconColor: icon ? getComputedStyle(icon).stroke : null,
        navigationHeight: Math.min(
          ...nav.map((item) => item.getBoundingClientRect().height)
        ),
        sendColor: send ? getComputedStyle(send).color : null,
        sendHeight: send?.getBoundingClientRect().height,
      };
    });
    if (
      controls.sendHeight < 44 ||
      controls.navigationHeight < 44 ||
      controls.iconColor !== controls.sendColor
    )
      throw new Error(
        `Contrôles tactiles ou icône illisible à ${width}: ${JSON.stringify(controls)}`
      );
    await page.locator(".muse-persona").click();
    const dialog = page.getByRole("dialog", {
      name: "Personnalisez ce Wakie.",
    });
    await dialog
      .getByRole("button", { exact: true, name: "Enregistrer" })
      .waitFor();
    await dialog.getByTestId("wakies-model-picker").click();
    await page.getByPlaceholder("Rechercher un modèle…").waitFor();
    await page.keyboard.press("Escape");
    if (!(await dialog.isVisible()))
      throw new Error("Échap dans le modèle ferme aussi la personnalisation");
    await dialog.getByTestId("wakies-model-picker").click();
    await page
      .getByRole("option")
      .filter({ hasText: "Modèle de test" })
      .click();
    await page
      .getByPlaceholder("Rechercher un modèle…")
      .waitFor({ state: "hidden" });
    await page.waitForFunction(() =>
      [...document.querySelectorAll(".avatar-picker img")].every(
        (img) => img.complete && img.naturalWidth > 0
      )
    );
    await page.screenshot({ path: `${outputDir}/customize-${width}.png` });
    for (let i = 0; i < 24; i++) {
      await page.keyboard.press("Tab");
      if (
        !(await dialog.evaluate((element) =>
          element.contains(document.activeElement)
        ))
      )
        throw new Error(`Le focus quitte le dialogue à ${width}`);
    }
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    if (
      !(await page
        .locator(".muse-persona")
        .evaluate((element) => element === document.activeElement))
    )
      throw new Error(`Le focus n'est pas restauré à ${width}`);
    await page
      .getByRole("button", { exact: true, name: "Envoyer le message" })
      .click();
    await page
      .getByText("Réponse IA de contrôle reçue.", { exact: true })
      .waitFor();
    await page
      .getByRole("article", { name: "Outil ui_check" })
      .getByText("Résultat enregistré", { exact: true })
      .waitFor();
    await page.screenshot({ path: `${outputDir}/response-${width}.png` });
    results.push({
      chatTransport: true,
      controls,
      errors,
      height,
      keyboardDialog: true,
      overflow,
      toolResult: true,
      width,
    });
    if (overflow || errors.length)
      throw new Error(`Erreur UI ou débordement à ${width}`);
    await context.close();
  }
  fs.writeFileSync(
    `${outputDir}/responsive.json`,
    JSON.stringify(
      {
        mode: "UI contrôlée, API interceptées ; aucune base ni fournisseur réel",
        results,
      },
      null,
      2
    )
  );
  await browser.close();
  console.log(JSON.stringify(results));
})()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await browser?.close();
  });
