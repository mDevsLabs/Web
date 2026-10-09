/** Vérifie que les sources de référence restent reproductibles et qu'aucun dépôt Git n'est imbriqué. */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../apps/wakies");
const manifest = JSON.parse(
  readFileSync(resolve(root, "SOURCE_MANIFEST.json"), "utf8")
);
if (existsSync(resolve(root, ".git")))
  throw new Error("Dépôt Git imbriqué interdit dans Wakies.");
for (const entry of manifest.files) {
  const hash = createHash("sha256")
    .update(readFileSync(resolve(root, entry.target)))
    .digest("hex");
  if (hash !== entry.sha256)
    throw new Error(`Source de référence altérée : ${entry.target}`);
}
console.log(
  "Wakies : " +
    manifest.files.length +
    " fichiers officiels vérifiés, commit " +
    manifest.commit
);
