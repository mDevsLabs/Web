import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  isChatToolId,
  isNativeToolId,
  isPluginProvidedToolId,
} from "../../lib/ai/tools/ids";
import { isLucideIconName } from "../../lib/plugins/icon-allowlist";

export const PLUGINS_DIR = path.resolve(process.cwd(), "lib", "plugins");

export const CATALOG_GENERATED_FILE = path.join(
  PLUGINS_DIR,
  "catalog.generated.ts"
);
export const SERVER_GENERATED_FILE = path.join(
  PLUGINS_DIR,
  "server.generated.ts"
);

// L'icône doit appartenir à la liste blanche partagée : une icône inconnue
// retomberait silencieusement sur une icône de repli dans l'interface.
const iconSchema = z.union([
  z.object({
    name: z.string().refine(isLucideIconName, {
      message:
        "Icône inconnue : ajoutez le nom dans lib/plugins/icon-allowlist.ts et son implémentation dans lib/plugins/icon.tsx.",
    }),
    type: z.literal("lucide"),
  }),
  z.object({ src: z.string().min(1), type: z.literal("image") }),
]);

// Permissions déclaratives obligatoires : elles sont affichées à l'utilisateur
// et vérifiées ici. Un plugin qui écrit des données utilisateur DOIT exiger une
// approbation explicite, sinon la validation échoue.
export const permissionsSchema = z
  .object({
    network: z.enum(["none", "read-only", "read-write"]),
    readsUserData: z.boolean(),
    requiresApproval: z.boolean(),
    writesUserData: z.boolean(),
  })
  .refine(
    (permissions) =>
      !permissions.writesUserData || permissions.requiresApproval,
    {
      message:
        "writesUserData: true exige requiresApproval: true (toute écriture de données utilisateur doit être approuvée).",
      path: ["requiresApproval"],
    }
  )
  .refine(
    (permissions) =>
      permissions.network !== "read-write" || permissions.requiresApproval,
    {
      message: "network: read-write exige requiresApproval: true.",
      path: ["requiresApproval"],
    }
  );

const pluginToolSchema = z.object({
  description: z.string().min(1),
  id: z
    .string()
    .min(1)
    .refine((toolId) => !isNativeToolId(toolId), {
      message:
        "Un identifiant d'outil implémenté nativement ne peut pas être réutilisé par un plugin.",
    })
    .refine(
      (toolId) => !isChatToolId(toolId) || isPluginProvidedToolId(toolId),
      {
        message:
          "Un identifiant d'outil de Chat doit être déclaré comme fourni par un plugin dans lib/ai/tools/ids.ts.",
      }
    ),
  label: z.string().min(1),
  systemHint: z.string().min(1),
});

export const manifestSchema = z
  .object({
    author: z.string().min(1).default("mAI"),
    category: z.string().min(1),
    description: z.string().min(1),
    icon: iconSchema,
    id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
    // Les plugins sont réservés aux forfaits payants : le plancher est « plus ».
    minTier: z.enum(["plus", "pro", "max"], {
      message:
        "minTier doit valoir plus, pro ou max (les plugins sont payants).",
    }),
    name: z.string().min(1),
    permissions: permissionsSchema,
    tags: z.array(z.string().min(1)).default([]),
    tools: z.array(pluginToolSchema).min(1).max(24),
    version: z.string().regex(/^\d+\.\d+\.\d+/),
  })
  .refine(
    (manifest) =>
      new Set(manifest.tools.map((tool) => tool.id)).size ===
      manifest.tools.length,
    { message: "Les identifiants d'outils d'un plugin doivent être uniques." }
  );

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

// Convention du catalogue généré : chaque `index.ts` doit exporter nommément
// `<dir>Plugin`, sinon `server.generated.ts` ne compile pas.
export function entryExportsPluginDefinition(
  dir: string,
  exportName: string
): boolean {
  const candidates = ["index.ts", "index.tsx"];
  for (const candidate of candidates) {
    const filePath = path.join(PLUGINS_DIR, dir, candidate);
    if (!fs.existsSync(filePath)) {
      continue;
    }
    const content = fs.readFileSync(filePath, "utf8");
    return new RegExp(`export\\s+const\\s+${exportName}\\b`).test(content);
  }
  return false;
}

// Nom d'export conventionnel dérivé du dossier : `weather` → `weatherPlugin`,
// `air-quality` → `airQualityPlugin`. Les imports générés restent camelCase
// lisibles quelle que soit la forme (kebab-case) du dossier.
export function importName(dir: string): string {
  const camel = dir
    .split(/[^a-zA-Z0-9_$]+/)
    .filter(Boolean)
    .map((part, index) =>
      index === 0 ? part : `${part.charAt(0).toUpperCase()}${part.slice(1)}`
    )
    .join("");
  return `${camel || "plugin"}Plugin`;
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
