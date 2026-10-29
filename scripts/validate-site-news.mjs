/**
 * Valide TOUS les index.json des actualités du Site AVANT le build Next.
 *
 * Les deux articles `android-mobile-app` et `renommage-mai` avaient une
 * virgule finale : `JSON.parse` levait, `readArticle` l'absorbait et
 * retournait null — les articles disparaissaient des listes sans aucune
 * erreur de build. Ce script transforme ce silence en échec explicite.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const newsDir = path.join(root, "apps", "site", "docs", "news");

function fail(message) {
  console.error(`[site-news] ${message}`);
  process.exitCode = 1;
}

if (!statSync(newsDir, { throwIfNoEntry: false })?.isDirectory()) {
  console.log("[site-news] Aucun dossier d'actualités : rien à valider.");
  process.exit(0);
}

let checked = 0;
for (const slug of readdirSync(newsDir)) {
  const dir = path.join(newsDir, slug);
  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) continue;
  const indexFile = path.join(dir, "index.json");
  const stat = statSync(indexFile, { throwIfNoEntry: false });
  if (!stat?.isFile()) continue;
  checked += 1;
  try {
    const parsed = JSON.parse(readFileSync(indexFile, "utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      fail(`${slug}/index.json n'est pas un objet JSON.`);
      continue;
    }
    for (const field of ["title", "description", "date"]) {
      if (typeof parsed[field] !== "string" || !parsed[field].trim()) {
        fail(`${slug}/index.json : champ « ${field} » manquant ou vide.`);
      }
    }
  } catch (error) {
    fail(
      `${slug}/index.json est invalide : ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}
console.log(`[site-news] ${checked} index.json valides.`);
