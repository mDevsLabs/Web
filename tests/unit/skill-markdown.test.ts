import { describe, expect, it } from "vitest";
import {
  getSkillTemplate,
  SKILL_TEMPLATE_LIST,
} from "@/lib/skill-templates/catalog";
import {
  convertSkillMarkdown,
  parseSkillMarkdown,
  SkillMarkdownError,
  safeConvertSkillMarkdown,
} from "@/lib/skill-templates/skill-md";
import type { SkillTemplateManifest } from "@/lib/skill-templates/types";
import {
  classifySkillTools,
  validateSkillTemplateManifest,
} from "@/lib/skill-templates/validation";

const VALID_MARKDOWN = `---
name: Recherche de références
description: Recherche des références et synthèse sourcée.
tools:
  - searchOpenAlexWorks
  - createDocument
pluginIds:
  - openalex
mcpServerNames: []
---
# Instructions
Conserve les DOI et explique les limites de la recherche.
`;

function manifestWith(
  patch: Partial<SkillTemplateManifest>
): SkillTemplateManifest {
  return {
    author: "test",
    category: "research",
    color: "#6366f1",
    description: "Description suffisamment longue pour un test de validation.",
    icon: { name: "Sparkles", type: "lucide" },
    id: "test-skill",
    instructions: "Suis les instructions de ce test de validation.",
    mcpServerNames: [],
    minTier: "free",
    parameters: [],
    pluginIds: [],
    tags: ["test"],
    tools: ["createDocument"],
    ...patch,
  } as SkillTemplateManifest;
}

describe("Templates Skills statiques", () => {
  it("ajoute les quatre starters publics avec leurs dépendances explicites", () => {
    const expected = [
      ["academic-synthesis", ["openalex"], []],
      ["european-statistics", ["eurostat"], []],
      [
        "release-preparation",
        ["gitlab-public"],
        ["GitHub", "GitLab", "Sentry"],
      ],
      ["knowledge-curation", ["wikidata"], ["Airtable"]],
    ] as const;

    for (const [id, pluginIds, mcpServerNames] of expected) {
      const template = getSkillTemplate(id);
      expect(template, id).toBeDefined();
      expect(template?.minTier).toBe("plus");
      expect(template?.pluginIds).toEqual(pluginIds);
      expect(template?.mcpServerNames).toEqual(mcpServerNames);
      expect(template && validateSkillTemplateManifest(template).valid).toBe(
        true
      );
    }
    expect(SKILL_TEMPLATE_LIST).toHaveLength(21);
  });

  it("classe séparément les outils natifs, Plugin et MCP", () => {
    const classification = classifySkillTools([
      "createDocument",
      "searchOpenAlexWorks",
      "mcp",
      "outil-inconnu",
    ]);
    expect(classification.native).toEqual(["createDocument"]);
    expect(classification.plugin).toEqual(["searchOpenAlexWorks"]);
    expect(classification.mcp).toEqual(["mcp"]);
    expect(classification.unknown).toEqual(["outil-inconnu"]);
  });

  it("refuse les plugins, serveurs MCP génériques et déclarations incohérentes", () => {
    const unknownPlugin = validateSkillTemplateManifest(
      manifestWith({
        pluginIds: ["plugin-inconnu"],
        tools: ["searchOpenAlexWorks"],
      })
    );
    expect(unknownPlugin.valid).toBe(false);
    expect(unknownPlugin.errors.join(" ")).toContain("plugin inconnu");

    const wildcardMcp = validateSkillTemplateManifest(
      manifestWith({
        mcpServerNames: ["*"],
        minTier: "plus",
        tools: ["mcp"],
      })
    );
    expect(wildcardMcp.valid).toBe(false);
    expect(wildcardMcp.errors.join(" ")).toContain(" générique interdit");

    const missingSentinel = validateSkillTemplateManifest(
      manifestWith({
        mcpServerNames: ["Notion"],
        minTier: "plus",
      })
    );
    expect(missingSentinel.valid).toBe(false);

    const freePlugin = validateSkillTemplateManifest(
      manifestWith({
        pluginIds: ["openalex"],
        tools: ["searchOpenAlexWorks"],
      })
    );
    expect(freePlugin.valid).toBe(false);
  });
});

describe("Convertisseur SKILL.md local", () => {
  it("convertit le frontmatter et le corps sans exécuter de ressources", () => {
    const manifest = convertSkillMarkdown(VALID_MARKDOWN);
    expect(manifest.id).toBe("recherche-de-references");
    expect(manifest.name).toBe("Recherche de références");
    expect(manifest.instructions).toContain("# Instructions");
    expect(manifest.instructions).toContain("limites");
    expect(manifest.tools).toEqual(["searchOpenAlexWorks", "createDocument"]);
    expect(manifest.pluginIds).toEqual(["openalex"]);
    expect(manifest.mcpServerNames).toEqual([]);
  });

  it("accepte les listes inline, allowed-tools et un serveur MCP whitelisté", () => {
    const source = `---
name: Curation locale
description: Organise des références dans une collection.
allowed-tools: [mcp, createDocument]
mcpServerNames: [Notion]
minTier: plus
---
Rassemble les pages et conserve leur provenance.
`;
    const manifest = convertSkillMarkdown(source);
    expect(manifest.tools).toEqual(["mcp", "createDocument"]);
    expect(manifest.mcpServerNames).toEqual(["Notion"]);
    expect(manifest.minTier).toBe("plus");
  });

  it("accepte une liste YAML de paramètres sans importer d'objet parasite", () => {
    const source = `---
name: Paramétré
parameters:
  - name: periode
    description: Année de référence
    type: string
---
Utilise la période demandée.
`;
    const manifest = convertSkillMarkdown(source);
    expect(manifest.parameters).toEqual([
      {
        description: "Année de référence",
        name: "periode",
        type: "string",
      },
    ]);
  });

  it("rejette les frontmatters qui déclarent scripts ou resources", () => {
    const source = `---
name: Dangereux
scripts:
  - run.sh
resources:
  - private.txt
---
Ces fichiers ne doivent jamais être importés.
`;
    expect(() => parseSkillMarkdown(source)).toThrow(SkillMarkdownError);
    const result = safeConvertSkillMarkdown(source);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("unsupported_frontmatter");
  });

  it("expose une conversion sûre et un corps d'instructions minimal", () => {
    const result = safeConvertSkillMarkdown(`---
name: Minimal
---
Réponds en trois points.
`);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.instructions).toBe("Réponds en trois points.");
      expect(result.value.description).toBe("Réponds en trois points.");
    }
  });
});
