/** Parcours Chromium des composants réels, avec API contrôlée et sans compte distant. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { chromium, expect } from "@playwright/test";

const root = resolve(import.meta.dirname, "../..");
const require = createRequire(import.meta.url);
const { build } = createRequire(require.resolve("tsx/package.json"))("esbuild");
const bundle = await build({
  bundle: true,
  define: { "process.env.NODE_ENV": '"production"' },
  format: "iife",
  jsx: "automatic",
  platform: "browser",
  stdin: {
    contents: `
      import React, { useState } from 'react';
      import { createRoot } from 'react-dom/client';
      import { ConversationList } from './components/wakies/ConversationList';
      import { FriendsScreen } from './components/wakies/FriendsScreen';
      function Harness() {
        const [rows, setRows] = useState([{ id:'conversation', wakieId:'prive', title:'Ma conversation', createdAt:1 }]);
        const [opened, setOpened] = useState('');
        return <div className="wakies-root"><div className="muse-app">
          <ConversationList wakies={[{ id:'prive', name:'Mon Wakie' }]} wakieId="prive" local={rows} onSelect={()=>{}} onNew={()=>{}} onChanged={async()=>setRows(await (await fetch('/api/wakies/conversations')).json())} />
          <FriendsScreen espaces={[{id:'espace', name:'Mon espace'}]} onChanged={async()=>{}} onOuvrirWakie={(id, conversation)=>setOpened(id+':'+conversation)} />
          <output id="opened">{opened}</output>
        </div></div>;
      }
      createRoot(document.getElementById('root')).render(<Harness/>);`,
    loader: "tsx",
    resolveDir: root,
  },
  tsconfig: resolve(root, "tsconfig.json"),
  write: false,
});
const css = [
  "packages/ui/dist/styles.css",
  "components/wakies/wakies.css",
  "components/wakies/wakies-ui.css",
  "components/wakies/wakies-host.css",
]
  .map((file) => readFileSync(resolve(root, file), "utf8"))
  .join("\n");
const server = createServer((request, response) => {
  if (request.url === "/bundle.js") {
    response.setHeader("Content-Type", "text/javascript");
    response.end(bundle.outputFiles[0].text);
  } else {
    response.setHeader("Content-Type", "text/html");
    response.end(
      `<style>${css}</style><div id="root"></div><script src="/bundle.js"></script>`
    );
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  for (const width of [375, 1100]) {
    const page = await browser.newPage({ viewport: { height: 800, width } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    let rows = [
      {
        createdAt: 1,
        id: "conversation",
        title: "Ma conversation",
        wakieId: "prive",
      },
    ];
    const calls = [];
    const publicWakie = {
      accent: null,
      avatar: null,
      bio: "Ami public",
      estAmi: true,
      estMien: false,
      handle: "ami",
      name: "Ami",
      nombreImages: 0,
      personaPubliee: "Persona publique",
      wakieId: "public",
    };
    await page.route("**/api/wakies/**", async (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      const body = request.postDataJSON();
      calls.push({ body, method: request.method(), path });
      let data;
      if (path === "/api/wakies/conversations/conversation") {
        rows = [{ ...rows[0], ...body }];
        data = rows[0];
      } else if (path === "/api/wakies/conversations") {
        data = request.method() === "POST" ? { id: "nouvelle" } : rows;
      } else if (path === "/api/wakies/directory")
        data = { resultats: [publicWakie] };
      else if (path === "/api/wakies/friends") data = { amis: [] };
      else if (path.endsWith("/profile"))
        data = {
          images: [],
          profil: {
            bio: "Ami public",
            links: [],
            name: "Ami",
            personaPubliee: "Persona publique",
          },
        };
      else if (path.endsWith("/clone"))
        data = { wakie: { id: "clone", name: "Ami privé" } };
      else throw new Error(`Route inattendue : ${path}`);
      await route.fulfill({ json: data });
    });
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page
      .getByRole("button", {
        exact: true,
        name: "Ajouter aux favoris : Ma conversation",
      })
      .click();
    await expect(
      page.getByRole("button", {
        exact: true,
        name: "Retirer des favoris : Ma conversation",
      })
    ).toHaveAttribute("aria-pressed", "true");
    await page
      .getByRole("button", {
        exact: true,
        name: "Mettre en sourdine : Ma conversation",
      })
      .click();
    await expect(
      page.getByRole("button", {
        exact: true,
        name: "Réactiver les notifications : Ma conversation",
      })
    ).toHaveAttribute("aria-pressed", "true");
    await page
      .getByPlaceholder("Rechercher un Wakie (@pseudo ou nom)…")
      .fill("ami");
    await page
      .getByRole("button", { exact: true, name: "Voir la fiche" })
      .click();
    await page
      .getByRole("button", { exact: true, name: "Cloner et discuter" })
      .click();
    await expect(page.locator("#opened")).toHaveText("clone:nouvelle");
    assert(
      calls.some(
        (call) => call.path.endsWith("/clone") && call.body.spaceId === "espace"
      )
    );
    assert(
      calls.some(
        (call) =>
          call.path === "/api/wakies/conversations" &&
          call.method === "POST" &&
          call.body.wakieId === "clone"
      )
    );
    assert.deepEqual(errors, [], "Aucune erreur React dans le parcours");
    await page.close();
  }
  console.log(
    "Parcours réels validés en 375 et 1100 px : favoris, sourdine, clonage puis ouverture de conversation."
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
