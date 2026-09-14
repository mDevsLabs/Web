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

// Identifiants stables du catalogue (source unique pour les routes, le store
// et les tests).
export const MCP_TEMPLATE_IDS: string[] = MCP_TEMPLATE_LIST.map((t) => t.id);

export function getMcpTemplate(
  templateId: string
): McpTemplateManifest | undefined {
  return MCP_TEMPLATE_LIST.find((t) => t.id === templateId);
}

// Modèles réellement installables : l'interface ne propose l'action que pour
// ceux-là (les autres restent documentés mais refusés côté serveur).
export function listInstallableMcpTemplates(): McpTemplateManifest[] {
  return MCP_TEMPLATE_LIST.filter(
    (template) => template.activation === "ready"
  );
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
  /** Slug du modèle d'origine (McpServer.templateId) — appariement exact. */
  templateId?: string | null;
};

// Fusionne le catalogue statique avec les serveurs MCP réellement installés.
// L'appariement se fait d'abord par `templateId` (lien persisté et stable) ; le
// nom ne sert que de repli pour les serveurs créés avant la migration 0019 ou
// ajoutés à la main en recopiant le nom d'un modèle.
export function buildMcpTemplateEntries(
  installations: McpTemplateInstallationLite[]
): McpTemplateCatalogEntry[] {
  const byTemplateId = new Map<string, McpTemplateInstallationLite>();
  const byName = new Map<string, McpTemplateInstallationLite>();
  for (const installation of installations) {
    if (installation.templateId) {
      byTemplateId.set(installation.templateId, installation);
    }
    if (!byName.has(installation.name)) {
      byName.set(installation.name, installation);
    }
  }
  return MCP_TEMPLATE_LIST.map((manifest) => {
    const installation =
      byTemplateId.get(manifest.id) ?? byName.get(manifest.name);
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
