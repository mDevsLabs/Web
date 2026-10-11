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
  const target = resolve(root, entry.target);
  if (!target.startsWith(`${root}/`) && !target.startsWith(`${root}\\`))
    throw new Error("Source hors du dossier Wakies.");
  const hash = createHash("sha256")
    .update(readFileSync(resolve(root, entry.target)))
    .digest("hex");
  const adaptation = (manifest.localAdaptations ?? []).find(
    (item) => item.target === entry.target
  );
  if (adaptation && adaptation.upstreamSha256 !== entry.sha256)
    throw new Error(`Provenance locale incohérente : ${entry.target}`);
  if (hash !== (adaptation?.retainedSha256 ?? entry.sha256))
    throw new Error(`Source de référence altérée : ${entry.target}`);
}
for (const entry of manifest.retiredFiles ?? []) {
  if (
    /\.(png|jpe?g|svg|gif|webp|ico|avif|bmp|heic|tiff?|apng)$/i.test(
      entry.target
    )
  ) {
    throw new Error(`Une image ne peut pas être retirée : ${entry.target}`);
  }
  if (existsSync(resolve(root, entry.target)))
    throw new Error(
      `Source déclarée retirée encore présente : ${entry.target}`
    );
  if (!/^[a-f0-9]{64}$/.test(entry.sha256))
    throw new Error(`Empreinte de provenance invalide : ${entry.target}`);
}
console.log(
  "Wakies : " +
    manifest.files.length +
    " fichiers officiels conservés vérifiés, " +
    (manifest.retiredFiles?.length ?? 0) +
    " sources retirées, commit " +
    manifest.commit
);
