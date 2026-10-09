/** Vérifie dans Chromium le défilement réel et les couleurs CSS distribuées. */
import assert from "node:assert/strict";
import { mkdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { SearchIcon } from "@mdevs/icons/controls/search";
import { chromium } from "@playwright/test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const root = resolve(import.meta.dirname, "../..");
const read = (file) => readFileSync(resolve(root, file), "utf8");
const icon = renderToStaticMarkup(createElement(SearchIcon, { size: 24 }));
const output = resolve(tmpdir(), "mai-display-validation");
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
  headless: true,
});
try {
  const page = await browser.newPage();
  const css = [
    "packages/ui/dist/styles.css",
    "components/wakies/wakies.css",
    "components/wakies/wakies-ui.css",
    "components/wakies/wakies-host.css",
  ]
    .map(read)
    .join("\n");
  for (const viewport of [
    { height: 480, width: 1100 },
    { height: 667, width: 375 },
  ]) {
    await page.setViewportSize(viewport);
    await page.setContent(`<style>${css}</style><div class="wakies-root"><div class="app template-app muse-app">
      <aside class="sidebar open"><button class="wordmark md-button md-button-ghost">Wakies</button>
      <div class="sidebar-sections"><nav class="muse-navigation">${Array.from({ length: 5 }, (_, i) => `<button class="md-button md-button-ghost">${icon} Vue ${i + 1}</button>`).join("")}</nav></div>
      <div class="spaces-heading nav-label">WAKIES</div><nav class="wakies-nav">${Array.from({ length: 25 }, (_, i) => `<button class="wakie-nav md-button md-button-ghost">${icon} Wakie ${i + 1}</button>`).join("")}</nav>
      <div class="spaces-heading nav-label">ESPACES</div><nav class="spaces-nav">${Array.from({ length: 12 }, (_, i) => `<button id="space-${i}" class="nav-item md-button md-button-ghost">Espace ${i + 1}</button>`).join("")}</nav>
      <div class="sidebar-bottom"><button id="settings" class="nav-item md-button md-button-ghost">Réglages</button></div></aside></div></div>`);
    const sidebar = page.locator(".sidebar");
    assert(
      await sidebar.evaluate((el) => el.scrollHeight > el.clientHeight),
      "La barre doit défiler"
    );
    await page.locator("#space-11").scrollIntoViewIfNeeded();
    const sidebarBox = await sidebar.boundingBox();
    const spaceBox = await page.locator("#space-11").boundingBox();
    assert(
      spaceBox.y >= sidebarBox.y &&
        spaceBox.y + spaceBox.height <= sidebarBox.y + sidebarBox.height + 1,
      "Le dernier espace doit être accessible"
    );
    await page.locator("#space-11").click();
    await page.locator("#settings").scrollIntoViewIfNeeded();
    await page.locator("#settings").click();
    await page.screenshot({
      path: resolve(output, `sidebar-${viewport.width}.png`),
    });
  }
  // Tester aussi le paquet sans les styles Wakies, en clair/sombre et avec le thème système.
  for (const system of ["light", "dark"]) {
    await page.emulateMedia({ colorScheme: system });
    for (const theme of ["light", "dark", "system"]) {
      await page.setContent(`<style>${read("packages/ui/dist/styles.css")}</style>
        <div class="md-root" data-md-theme="${theme}">
        <button id="primary" class="md-button">${icon} Envoyer</button>
        <button id="ghost" class="md-button md-button-ghost">${icon} Action</button>
        <span id="danger" data-tone="danger">${icon} Erreur</span>
        <div class="md-tooltip" id="tooltip">${icon} Aide <svg class="md-tooltip-arrow"><polygon points="0,0 5,5 10,0"/></svg></div>
        <button class="md-button" style="width:100px">${icon}<span>Libellé très long à afficher</span></button>
        <div style="display:flex;flex-direction:column;height:120px"><div style="flex-shrink:0;height:40px">Entête</div><div id="scroll" class="md-scroll-area" style="flex:1;max-height:20rem"><div style="height:400px">Contenu</div></div></div>
        </div>`);
      for (const id of ["primary", "ghost", "danger", "tooltip"]) {
        const colors = await page.locator(`#${id}`).evaluate((el) => ({
          fill: getComputedStyle(el.querySelector("svg")).fill,
          stroke: getComputedStyle(el.querySelector("svg")).stroke,
          text: getComputedStyle(el).color,
        }));
        assert.equal(
          colors.stroke,
          colors.text,
          `${id} : couleur héritée (${theme}/${system})`
        );
        assert.equal(colors.fill, "none", "Les icônes gardent leur contour");
      }
      assert.equal(
        await page
          .locator("button:last-of-type > svg")
          .evaluate((el) => el.getBoundingClientRect().width),
        24
      );
      const scroll = await page.locator("#scroll").evaluate((el) => {
        el.scrollTop = 200;
        return { height: el.clientHeight, top: el.scrollTop };
      });
      assert.equal(scroll.height, 80);
      assert.equal(scroll.top, 200);
    }
  }
  console.log(
    `Chromium : sidebar desktop/mobile, 6 combinaisons de thèmes, SVG et flex validés. Captures : ${output}`
  );
} finally {
  await browser.close();
}
