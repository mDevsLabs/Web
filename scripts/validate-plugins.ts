import fs from "node:fs";
import path from "node:path";
import { isLucideIconName } from "../lib/plugins/icon-allowlist";
import {
  buildGeneratedFiles,
  CATALOG_GENERATED_FILE,
  entryExportsPluginDefinition,
  importName,
  listTsEntries,
  PLUGINS_DIR,
  type PluginManifestData,
  readManifest,
  readRootCatalog,
  SERVER_GENERATED_FILE,
} from "./lib/plugin-catalog";

const errors: string[] = [];

function fail(message: string) {
  errors.push(message);
}

const root = readRootCatalog();
const categoryIds = new Set(root.categories.map((c) => c.id));

// Les catégories du catalogue racine sont affichées dans l'interface : leur
// icône doit exister dans la liste blanche partagée.
for (const category of root.categories) {
  if (!isLucideIconName(category.icon)) {
    fail(
      `Icône inconnue « ${category.icon} » pour la catégorie ${category.id} (voir lib/plugins/icon-allowlist.ts)`
    );
  }
}

const seenPluginIds = new Set<string>();
const seenToolIds = new Set<string>();
const manifests: PluginManifestData[] = [];

for (const entry of root.plugins) {
  const dirPath = `${PLUGINS_DIR}/${entry.dir}`;

  if (!fs.existsSync(dirPath)) {
    fail(`Dossier manquant pour le plugin « ${entry.id} » : ${entry.dir}`);
    continue;
  }

  if (seenPluginIds.has(entry.id)) {
    fail(`Identifiant de plugin dupliqué : ${entry.id}`);
  }
  seenPluginIds.add(entry.id);

  let manifest: PluginManifestData;
  try {
    manifest = readManifest(entry.dir);
  } catch (error) {
    fail(
      `Manifeste invalide dans ${entry.dir}/index.json : ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    continue;
  }
  manifests.push(manifest);

  if (manifest.id !== entry.id) {
    fail(
      `L'id du manifeste (${manifest.id}) ne correspond pas au catalogue (${entry.id})`
    );
  }

  if (seenToolIds.has(manifest.tool.id)) {
    fail(`Identifiant d'outil dupliqué : ${manifest.tool.id}`);
  }
  seenToolIds.add(manifest.tool.id);

  if (!categoryIds.has(manifest.category)) {
    fail(
      `Catégorie inconnue « ${manifest.category} » pour le plugin ${manifest.id}`
    );
  }

  const tsEntries = listTsEntries(entry.dir);
  if (tsEntries.length === 0) {
    fail(
      `Le plugin ${manifest.id} doit contenir au moins un fichier .ts (${entry.dir})`
    );
  }

  // Le point d'entrée du catalogue (ex. "./weather") doit résoudre vers un
  // module `index.ts` / `index.tsx` présent dans le dossier, qui exporte
  // nommément `<dir>Plugin` (contrat de `server.generated.ts`).
  const hasIndexEntry = ["index.ts", "index.tsx"].some((f) =>
    fs.existsSync(path.join(dirPath, f))
  );
  if (hasIndexEntry) {
    const exportName = importName(entry.dir);
    if (!entryExportsPluginDefinition(entry.dir, exportName)) {
      fail(
        `Le plugin ${manifest.id} doit exporter « export const ${exportName} » depuis ${entry.dir}/index.ts`
      );
    }
  } else {
    fail(
      `Point d'entrée introuvable pour ${manifest.id} : ${entry.entry} doit résoudre vers index.ts`
    );
  }
}

// Cohérence des fichiers générés avec le catalogue courant.
const { catalog, server } = buildGeneratedFiles();

for (const [file, expected] of [
  [CATALOG_GENERATED_FILE, catalog],
  [SERVER_GENERATED_FILE, server],
] as const) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  if (current !== expected) {
    fail(
      `${path.relative(process.cwd(), file)} n'est pas à jour — lancez « pnpm plugins:gen »`
    );
  }
}

if (errors.length > 0) {
  console.error("✗ Validation des plugins échouée :\n");
  for (const error of errors) {
    console.error(`  • ${error}`);
  }
  process.exit(1);
}

console.log(
  `✓ ${manifests.length} plugins valides (${manifests
    .map((m) => `${m.id}@${m.version}`)
    .join(", ")}).`
);
