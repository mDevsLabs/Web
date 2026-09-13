import { SKILL_CATEGORIES } from "./categories";
import { SKILL_TEMPLATES } from "./index";
import type {
  SkillTemplateCatalogEntry,
  SkillTemplateCategory,
  SkillTemplateDefinition,
  SkillTemplateManifest,
} from "./types";

export { SKILL_CATEGORIES };

export const SKILL_TEMPLATE_LIST: SkillTemplateManifest[] = [
  ...SKILL_TEMPLATES.map((d: SkillTemplateDefinition) => d.manifest),
].sort((a, b) => a.name.localeCompare(b.name, "fr"));

export function getSkillTemplate(
  skillTemplateId: string
): SkillTemplateManifest | undefined {
  return SKILL_TEMPLATE_LIST.find((t) => t.id === skillTemplateId);
}

export function getSkillCategory(
  categoryId: string
): SkillTemplateCategory | undefined {
  return SKILL_CATEGORIES.find((c) => c.id === categoryId);
}

export function getSkillCategoryLabel(categoryId: string): string {
  return getSkillCategory(categoryId)?.label ?? "Autres";
}

// Recherche utilisée par la page Skills : nom, description, instructions,
// tags, catégorie et noms d'outils.
export function matchesSkillTemplateQuery(
  template: SkillTemplateManifest,
  rawQuery: string
): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) {
    return true;
  }
  const haystack = [
    template.name,
    template.description,
    template.instructions,
    template.id,
    getSkillCategoryLabel(template.category),
    ...template.tags,
    ...template.tools,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export function filterSkillTemplates<T extends SkillTemplateManifest>(
  templates: T[],
  rawQuery: string,
  categoryId: string | null
): T[] {
  return templates.filter(
    (t) =>
      (!categoryId || t.category === categoryId) &&
      matchesSkillTemplateQuery(t, rawQuery)
  );
}

export type SkillInstallationLite = {
  name: string;
  id: string;
};

// Fusionne le catalogue statique avec les skills réellement installés
// (correspondance par nom, convention existante des skills mAI).
export function buildSkillTemplateEntries(
  installations: SkillInstallationLite[]
): SkillTemplateCatalogEntry[] {
  const byName = new Map(installations.map((i) => [i.name, i]));
  return SKILL_TEMPLATE_LIST.map((manifest) => {
    const installation = byName.get(manifest.name);
    return {
      ...manifest,
      installed: Boolean(installation),
      installedSkillId: installation?.id ?? null,
    };
  });
}

export type {
  SkillTemplateCatalogEntry,
  SkillTemplateCategory,
  SkillTemplateDefinition,
  SkillTemplateManifest,
  SkillTemplateParameter,
} from "./types";
