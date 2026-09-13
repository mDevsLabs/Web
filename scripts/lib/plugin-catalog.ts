import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

export const PLUGINS_DIR = path.resolve(process.cwd(), "lib", "plugins");

export const CATALOG_GENERATED_FILE = path.join(
  PLUGINS_DIR,
  "catalog.generated.ts"
);
export const SERVER_GENERATED_FILE = path.join(
  PLUGINS_DIR,
  "server.generated.ts"
);

const iconSchema = z.union([
  z.object({ name: z.string().min(1), type: z.literal("lucide") }),
  z.object({ src: z.string().min(1), type: z.literal("image") }),
]);

export const manifestSchema = z.object({
  author: z.string().min(1).default("mAI"),
  category: z.string().min(1),
  description: z.string().min(1),
  icon: iconSchema,
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  minTier: z.enum(["free", "plus", "pro", "max"]).default("plus"),
  name: z.string().min(1),
  tags: z.array(z.string().min(1)).default([]),
  tool: z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    systemHint: z.string().min(1),
  }),
  version: z.string().regex(/^\d+\.\d+\.\d+/),
});

export const rootCatalogSchema = z.object({
  catalogVersion: z.string().min(1),
  categories: z.array(
    z.object({
      icon: z.string().min(1),
      id: z.string().min(1),
      label: z.string().min(1),
    })
  ),
  plugins: z.array(
    z.object({
      dir: z.string().min(1),
      entry: z.string().min(1),
      id: z.string().min(1),
      manifest: z.string().min(1),
    })
  ),
  schemaVersion: z.number().int().positive(),
});

export type PluginManifestData = z.infer<typeof manifestSchema>;
export type RootCatalogData = z.infer<typeof rootCatalogSchema>;

export function readRootCatalog(): RootCatalogData {
  const raw = fs.readFileSync(path.join(PLUGINS_DIR, "index.json"), "utf8");
  return rootCatalogSchema.parse(JSON.parse(raw));
}

export function readManifest(dir: string): PluginManifestData {
  const raw = fs.readFileSync(
    path.join(PLUGINS_DIR, dir, "index.json"),
    "utf8"
  );
  return manifestSchema.parse(JSON.parse(raw));
}

export function listTsEntries(dir: string): string[] {
  return fs
    .readdirSync(path.join(PLUGINS_DIR, dir))
    .filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"));
}

function importName(dir: string): string {
  const safe = dir.replace(/[^a-zA-Z0-9_$]/g, "_");
  return `${safe}Plugin`;
}

// Génère le contenu des deux fichiers dérivés du catalogue.
export function buildGeneratedFiles(): {
  catalog: string;
  server: string;
} {
  const root = readRootCatalog();
  const entries = [...root.plugins].sort((a, b) => a.id.localeCompare(b.id));

  const catalogImports = entries
    .map(
      (e) => `import ${importName(e.dir)}Manifest from "./${e.dir}/index.json";`
    )
    .join("\n");

  const catalogArray = entries
    .map((e) => `  ${importName(e.dir)}Manifest,`)
    .join("\n");

  const catalog = `// AUTO-GÉNÉRÉ par \`scripts/gen-plugin-catalog.ts\` — ne pas éditer à la main.
// Safe côté client : n'importe que des manifestes JSON (aucun outil IA).
${catalogImports}
import rootCatalog from "./index.json";
import type { PluginCategory, PluginManifest } from "./types";

export const PLUGIN_CATEGORIES = rootCatalog.categories as PluginCategory[];

export const PLUGIN_MANIFESTS = [
${catalogArray}
] as unknown as PluginManifest[];

export const PLUGIN_CATALOG_VERSION = rootCatalog.catalogVersion;
`;

  // Convention : chaque plugin exporte nommément `<dir>Plugin` depuis son
  // `index.ts` (ex. `weather/index.ts` → `export const weatherPlugin`).
  const serverImports = entries
    .map((e) => `import { ${importName(e.dir)} } from "./${e.dir}";`)
    .join("\n");

  const serverArray = entries.map((e) => `  ${importName(e.dir)},`).join("\n");

  const server = `// AUTO-GÉNÉRÉ par \`scripts/gen-plugin-catalog.ts\` — ne pas éditer à la main.
// Réservé au serveur : importe les implémentations d'outils (ai, zod).
import "server-only";
${serverImports}
import type { PluginDefinition } from "./types";

export const PLUGIN_DEFINITIONS: PluginDefinition[] = [
${serverArray}
];
`;

  return { catalog, server };
}

export function writeGeneratedFiles(): string[] {
  const { catalog, server } = buildGeneratedFiles();
  fs.writeFileSync(CATALOG_GENERATED_FILE, catalog, "utf8");
  fs.writeFileSync(SERVER_GENERATED_FILE, server, "utf8");
  return [CATALOG_GENERATED_FILE, SERVER_GENERATED_FILE];
}
