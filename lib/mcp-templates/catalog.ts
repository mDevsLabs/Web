import { MCP_CATEGORIES } from "./categories";
import { MCP_TEMPLATES } from "./index";
import type {
  McpTemplateCatalogEntry,
  McpTemplateCategory,
  McpTemplateDefinition,
  McpTemplateManifest,
} from "./types";

export { MCP_CATEGORIES };
export const MCP_TEMPLATE_LIST: McpTemplateManifest[] = [
  ...MCP_TEMPLATES.map((d: McpTemplateDefinition) => d.manifest),
].sort((a, b) => a.name.localeCompare(b.name, "fr"));

export function getMcpTemplate(
  templateId: string
): McpTemplateManifest | undefined {
  return MCP_TEMPLATE_LIST.find((t) => t.id === templateId);
}

export function getMcpCategory(
  categoryId: string
): McpTemplateCategory | undefined {
  return MCP_CATEGORIES.find((c) => c.id === categoryId);
}

export function getMcpCategoryLabel(categoryId: string): string {
  return getMcpCategory(categoryId)?.label ?? "Autres";
}

// Recherche utilisée par la page MCP : nom, description, tags, catégorie,
// transports et noms de variables de credentials.
export function matchesMcpTemplateQuery(
  template: McpTemplateManifest,
  rawQuery: string
): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) {
    return true;
  }
  const haystack = [
    template.name,
    template.description,
    template.id,
    getMcpCategoryLabel(template.category),
    ...template.tags,
    ...template.credentials.flatMap((c) => [c.label, c.key]),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export function filterMcpTemplates<T extends McpTemplateManifest>(
  templates: T[],
  rawQuery: string,
  categoryId: string | null
): T[] {
  return templates.filter(
    (t) =>
      (!categoryId || t.category === categoryId) &&
      matchesMcpTemplateQuery(t, rawQuery)
  );
}

export type McpTemplateInstallationLite = {
  name: string;
  id: string;
  isEnabled: boolean;
};

// Fusionne le catalogue statique avec les serveurs MCP réellement installés
// (correspondance par nom, convention du Store MCP existant).
export function buildMcpTemplateEntries(
  installations: McpTemplateInstallationLite[]
): McpTemplateCatalogEntry[] {
  const byName = new Map(installations.map((i) => [i.name, i]));
  return MCP_TEMPLATE_LIST.map((manifest) => {
    const installation = byName.get(manifest.name);
    return {
      ...manifest,
      enabled: installation?.isEnabled ?? false,
      installed: Boolean(installation),
      installedServerId: installation?.id ?? null,
    };
  });
}

export type {
  McpTemplateCatalogEntry,
  McpTemplateCategory,
  McpTemplateCredential,
  McpTemplateDefinition,
  McpTemplateManifest,
} from "./types";
