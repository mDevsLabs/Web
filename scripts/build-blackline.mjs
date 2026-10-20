#!/usr/bin/env node
/**
 * ============================================================================
 * CONSTRUCTION DU JEU BLACKLINE POUR L'HÔTE mAI
 * ============================================================================
 *
 * POURQUOI CE SCRIPT
 *
 * Blackline est un jeu Vite autonome (Three.js). L'hôte mAI ne le compile
 * pas : il le MONTE, dans une page qui charge le bundle du jeu comme un
 * artefact statique. Ce script produit cet artefact.
 *
 * Il est donc l'équivalent, pour Blackline, de `build-vibe-css.mjs` et
 * `build-wakies-css.mjs` : une étape de build qui garantit que ce que l'hôte
 * sert correspond bien au code du jeu.
 *
 * CE QUE LE SCRIPT FAIT
 *
 *  1. vérifie que les dépendances du jeu sont installées ;
 *  2. lance le build Vite (`vite build`) ;
 *  3. copie `dist/assets` et `dist/fonts` dans `public/blackline/` ;
 *  4. écrit un MANIFESTE des chunks produits.
 *
 * POURQUOI PAS DE COPIE DE `index.html`
 *
 * La page hôte (`app/(chat)/blackline/page.tsx`) rend elle-même le canvas, le
 * conteneur de l'interface et l'écran de chargement : le HTML du jeu serait
 * un doublon — deux déclarations de titre, deux `<meta viewport>`, et un
 * `<html>` concurrent. Seuls les ASSETS sont donc copiés.
 *
 * LE NOM DU CHUNK D'ENTRÉE EST STABLE
 *
 * Vite nomme les chunks après leur contenu (`index-DBSrpOzh.js`). Un nom
 * changeant à chaque build obligerait l'hôte à lire un manifeste avant de
 * charger le jeu — un aller-retour, et une source d'échec (manifeste absent ou
 * périmé). Le chunk d'entrée a donc un nom FIXE (`blackline.js`) : le
 * navigateur le met en cache (`Cache-Control: immutable`), et la page hôte
 * l'insère sans rien lire.
 *
 * LES AUTRES CHUNKS GARDENT LEUR HACHAGE
 *
 * Ils sont chargés à la demande (moteur, pages arsenal/boutique/guide) : un
 * nom stable y serait une faute, car le contenu changerait sous un nom
 * immuable. Le manifeste dit à l'hôte ce qui existe, s'il veut l'afficher.
 *
 * SORTIE : public/blackline/ — un ARTEFACT de build. Il n'est pas versionné
 * (voir .gitignore) et se reconstruit par `pnpm build`.
 *
 * Usage :
 *   node scripts/build-blackline.mjs
 *   node scripts/build-blackline.mjs --skip-build   (réutilise le build actuel)
 */

import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";

const RACINE = resolve(import.meta.dirname, "..");
const JEU = resolve(RACINE, "apps/blackline");
const DIST = resolve(JEU, "dist");
const PUBLIC = resolve(RACINE, "public/blackline");

/** Le chunk d'entrée porte un nom FIXE : voir l'en-tête du script. */
const CHUNK_ENTREE = "blackline.js";

/** Sous-dossier public des chunks. */
const DOSSIER_ASSETS = "assets";

function echouer(message) {
  console.error(`✗ build Blackline : ${message}`);
  process.exit(1);
}

// ── 1. Les dépendances du jeu ──────────────────────────────────────────────
//
// Le jeu n'est PAS un membre du workspace pnpm (`pnpm-workspace.yaml` liste
// `packages: []`) : il a son propre `package-lock.json` et son propre
// `node_modules`, installés par `npm`. On ne touche pas à ses lockfiles.
if (!existsSync(resolve(JEU, "node_modules/vite"))) {
  echouer(
    "dépendances du jeu absentes.\n" +
      "    Lancez : npm --prefix apps/blackline ci"
  );
}

// ── 2. Le build Vite ───────────────────────────────────────────────────────
const args = process.argv.slice(2);
const sauterBuild = args.includes("--skip-build");

if (!sauterBuild) {
  console.log("▸ Build du jeu (Vite)…");
  try {
    execFileSync(
      process.execPath,
      [resolve(JEU, "node_modules/vite/bin/vite.js"), "build"],
      { cwd: JEU, stdio: "inherit" }
    );
  } catch {
    echouer("le build Vite a échoué (voir la sortie ci-dessus).");
  }
}

if (!existsSync(resolve(DIST, DOSSIER_ASSETS))) {
  echouer(
    `build absent : ${resolve(DIST, DOSSIER_ASSETS)}\n` +
      "    Relancez sans --skip-build."
  );
}

// ── 3. Le chunk d'entrée doit porter le nom stable ────────────────────────
//
// Le nom est imposé par `vite.config.ts` (`entryFileNames`). Si le build
// n'a pas respecté la règle, le manifeste le dit et l'hôte ne pourra pas
// charger le jeu : mieux vaut le signaler ici qu'à l'exécution.
const chunks = readdirSync(resolve(DIST, DOSSIER_ASSETS)).filter((nom) =>
  nom.endsWith(".js")
);
const entree = chunks.find((nom) => nom === CHUNK_ENTREE);
if (!entree) {
  echouer(
    `chunk d'entrée introuvable : « ${CHUNK_ENTREE} » absent de ${DOSSIER_ASSETS}/\n` +
      `    Chunks produits : ${chunks.join(", ")}`
  );
}

// ── 4. Copie vers le dossier public ────────────────────────────────────────
console.log("▸ Copie des artefacts vers public/blackline/…");
rmSync(PUBLIC, { force: true, recursive: true });
mkdirSync(PUBLIC, { recursive: true });

// Le chunk d'ENTRÉE PUBLIC (`blackline.js`) et les chunks chargés à la
// demande sont copiés. L'entrée de l'application AUTONOME (`main.js`) ne
// l'est pas : elle ne sert qu'à la page HTML du jeu, que l'hôte ne sert pas.
const chunksACopier = chunks.filter(
  (nom) => nom !== "main.js" && !nom.startsWith("main-")
);
cpSync(resolve(DIST, DOSSIER_ASSETS), resolve(PUBLIC, DOSSIER_ASSETS), {
  recursive: true,
});
for (const nom of readdirSync(resolve(PUBLIC, DOSSIER_ASSETS))) {
  if (nom === "main.js" || nom.startsWith("main-")) {
    rmSync(resolve(PUBLIC, DOSSIER_ASSETS, nom), { force: true });
  }
}
if (existsSync(resolve(DIST, "fonts"))) {
  cpSync(resolve(DIST, "fonts"), resolve(PUBLIC, "fonts"), { recursive: true });
}
if (existsSync(resolve(DIST, "favicon.svg"))) {
  cpSync(resolve(DIST, "favicon.svg"), resolve(PUBLIC, "favicon.svg"));
}

// ── 5. Le manifeste ─────────────────────────────────────────────────────────
//
// Il décrit ce qui a été produit. L'hôte n'en a PAS besoin pour charger le
// jeu (le nom de l'entrée est fixe) : c'est un instrument de diagnostic, et la
// liste des chunks chargés à la demande.
const manifeste = {
  chunks: chunksACopier.sort(),
  entry: `/blackline/${DOSSIER_ASSETS}/${CHUNK_ENTREE}`,
  fonts: existsSync(resolve(PUBLIC, "fonts"))
    ? ["/blackline/fonts/blackline.woff"]
    : [],
};
writeFileSync(
  resolve(PUBLIC, "manifest.json"),
  `${JSON.stringify(manifeste, null, 2)}\n`
);

const total = chunksACopier.length;
console.log(
  `✓ public/blackline/ — ${total} chunk(s) JS, entrée « ${CHUNK_ENTREE} » (nom stable).`
);
console.log(
  "  Les autres chunks gardent leur hachage : ils sont chargés à la demande,"
);
console.log(
  "  et un nom immuable sur un contenu changeant serait un cache trompeur."
);
