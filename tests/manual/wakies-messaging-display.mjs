/** Revue Chromium des alertes : panneau borné et boutons accessibles sur mobile. */
import assert from "node:assert/strict";
import { mkdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const root = resolve(import.meta.dirname, "../..");
const css = [
  "packages/ui/dist/styles.css",
  "components/wakies/wakies.css",
  "components/wakies/wakies-ui.css",
  "components/wakies/wakies-host.css",
]
  .map((file) => readFileSync(resolve(root, file), "utf8"))
  .join("\n");
const output = resolve(tmpdir(), "mai-messaging-display");
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL || "msedge",
  headless: true,
});
try {
  const page = await browser.newPage();
  for (const width of [375, 1100]) {
    await page.setViewportSize({ height: 667, width });
    await page.setContent(
      `<style>${css}</style><div class="wakies-root"><div class="app muse-app"><main style="display:flex;flex-direction:column;height:667px;width:100%"><details open class="wakies-notifications"><summary>Notifications (50)</summary><button class="md-button">Activer les notifications</button><ul>${Array.from({ length: 50 }, (_, i) => `<li><button class="md-button wakies-notification-button"><span><strong>Conversation ${i}</strong><span class="wakies-notification-preview">Une réponse du Wakie vous attend.</span></span></button></li>`).join("")}</ul></details><div id="chat" style="flex:1;min-height:0">Conversation conservée</div></main></div></div>`
    );
    const panel = page.locator(".wakies-notifications");
    const bounds = await panel.boundingBox();
    assert(
      bounds.height <= 320,
      "Les notifications ne doivent pas occuper toute la conversation"
    );
    assert(
      await panel.evaluate((el) => el.scrollHeight > el.clientHeight),
      "La liste des cinquante alertes défile"
    );
    await panel.locator("li:last-child button").scrollIntoViewIfNeeded();
    await panel.locator("li:last-child button").click();
    assert(
      (await page.locator("#chat").boundingBox()).height > 300,
      "Le fil conserve une hauteur visible"
    );
    await page.screenshot({
      path: resolve(output, `notifications-${width}.png`),
    });
  }
  console.log(
    `Affichage des notifications validé en 375 et 1100 px ; captures : ${output}`
  );
} finally {
  await browser.close();
}
