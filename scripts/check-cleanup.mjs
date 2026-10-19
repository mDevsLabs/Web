/** Conserver une preuve rejouable du nettoyage et de toutes les images initiales. */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "..");
const inventory = JSON.parse(
  readFileSync(resolve(root, "docs/CLEANUP_INVENTORY.json"), "utf8")
);
const images = JSON.parse(
  readFileSync(resolve(root, "docs/CLEANUP_IMAGES.json"), "utf8")
);
function target(file) {
  const path = resolve(root, file);
  if (!path.startsWith(`${root}${sep}`))
    throw new Error(`Chemin hors du dépôt : ${file}`);
  return path;
}
for (const { file } of inventory.removed) {
  if (existsSync(target(file)))
    throw new Error(`Fichier retiré encore présent : ${file}`);
}
for (const [file, hash] of Object.entries(images)) {
  const actual = createHash("sha256")
    .update(readFileSync(target(file)))
    .digest("hex");
  if (actual !== hash) throw new Error(`Image modifiée : ${file}`);
}
console.log(
  `${inventory.removed.length} retraits vérifiés ; ${Object.keys(images).length} images initiales intactes.`
);
