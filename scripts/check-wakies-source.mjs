/**
 * Vérifie que les sources de référence de Wakies restent reproductibles et
 * qu'aucun dépôt Git n'est imbriqué.
 *
 * Pourquoi ce format : `apps/wakies/.gitattributes` pose `* text=auto`, donc
 * Git convertit les fins de ligne selon la plateforme (CRLF sur les checkouts
 * Windows). Un hash brut des octets du working tree mélange alors la
 * normalisation Git et une vraie altération. Les empreintes du manifeste sont
 * donc calculées sur le contenu CANONICALISÉ (fins de ligne LF) pour les
 * fichiers texte, et sur les octets bruts pour les binaires. L'empreinte
 * amont (`upstreamSha256`) reste distincte de l'empreinte locale normalisée
 * (`sha256`) : les anciennes empreintes brutes de checkout CRLF ne font plus
 * foi.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "../apps/wakies");
const manifestPath = resolve(root, "SOURCE_MANIFEST.json");
if (!existsSync(manifestPath))
  throw new Error(
    "Manifeste de provenance absent (apps/wakies/SOURCE_MANIFEST.json) : checkout incomplet ou manifeste non rétabli."
  );
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
if (existsSync(resolve(root, ".git")))
  throw new Error("Dépôt Git imbriqué interdit dans Wakies.");

/** Canonicalise les fins de ligne en LF pour les fichiers texte. */
function canonicalBytes(bytes, kind) {
  if (kind === "binary") return bytes;
  return Buffer.from(
    bytes.toString("utf8").replace(/\r\n/g, "\n").replace(/\r/g, "\n"),
    "utf8"
  );
}

function checkInsideRoot(target) {
  const resolved = resolve(root, target);
  if (resolved !== root && !resolved.startsWith(root + sep))
    throw new Error(`Source hors du dossier Wakies : ${target}`);
  return resolved;
}

for (const entry of manifest.files) {
  if (entry.kind !== "text" && entry.kind !== "binary")
    throw new Error(`Nature de fichier invalide : ${entry.target}`);
  const target = checkInsideRoot(entry.target);
  if (!existsSync(target))
    throw new Error(`Source de référence manquante : ${entry.target}`);
  const hash = createHash("sha256")
    .update(canonicalBytes(readFileSync(target), entry.kind))
    .digest("hex");
  const adaptation = (manifest.localAdaptations ?? []).find(
    (item) => item.target === entry.target
  );
  if (adaptation) {
    if (
      adaptation.upstreamSha256 !== entry.upstreamSha256 ||
      adaptation.retainedSha256 !== entry.sha256
    )
      throw new Error(`Provenance locale incohérente : ${entry.target}`);
  } else if (entry.upstreamSha256 && entry.upstreamSha256 !== entry.sha256) {
    throw new Error(
      `Fichier non adapté divergent de l’amont : ${entry.target}`
    );
  }
  if (hash !== entry.sha256)
    throw new Error(`Source de référence altérée : ${entry.target}`);
}
for (const adaptation of manifest.localAdaptations ?? []) {
  if (
    !(manifest.files ?? []).some((entry) => entry.target === adaptation.target)
  )
    throw new Error(
      `Adaptation locale sans entrée de manifeste : ${adaptation.target}`
    );
}
for (const entry of manifest.retiredFiles ?? []) {
  if (
    /\.(png|jpe?g|svg|gif|webp|ico|avif|bmp|heic|tiff?|apng)$/i.test(
      entry.target
    )
  ) {
    throw new Error(`Une image ne peut pas être retirée : ${entry.target}`);
  }
  checkInsideRoot(entry.target);
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
    " fichiers officiels conservés vérifiés (contenu canonicalisé LF), " +
    (manifest.localAdaptations?.length ?? 0) +
    " adaptations locales, " +
    (manifest.retiredFiles?.length ?? 0) +
    " sources retirées, commit " +
    manifest.commit
);
