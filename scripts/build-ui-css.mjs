#!/usr/bin/env node
/**
 * Synchronisation et compilation de la feuille CSS de @mdevs/ui.
 * Concatène src/styles.css et src/extensions.css vers dist/styles.css.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const srcStyles = path.join(root, "packages/ui/src/styles.css");
const srcExtensions = path.join(root, "packages/ui/src/extensions.css");
const distStyles = path.join(root, "packages/ui/dist/styles.css");

if (!fs.existsSync(srcStyles) || !fs.existsSync(srcExtensions)) {
  console.error("❌ Fichiers sources @mdevs/ui introuvables.");
  process.exit(1);
}

const styles = fs.readFileSync(srcStyles, "utf8");
const extensions = fs.readFileSync(srcExtensions, "utf8");

const combined = `/* @mdevs/ui — Liquid Glass Design System */\n${styles}\n\n/* Extensions */\n${extensions}\n`;

fs.writeFileSync(distStyles, combined, "utf8");
console.log(
  `✅ [build-ui-css] @mdevs/ui styles compilés avec succès (${combined.length} octets).`
);
