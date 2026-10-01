import { describe, expect, it } from "vitest";
import { AGENT_TOOL_CATALOG } from "@/lib/agent/tools/catalog";
import {
  CHAT_AGENT_TOOL_PAIRS,
  MCP_TOOL_SENTINEL,
  NATIVE_TOOL_IDS,
  normalizeToolIds,
  toAgentToolId,
  toChatToolId,
} from "@/lib/ai/tools/ids";
import { MCP_TEMPLATE_LIST } from "@/lib/mcp-templates/catalog";
import { PLUGIN_TOOL_IDS } from "@/lib/plugins/catalog";
import { isLucideIconName } from "@/lib/plugins/icon-allowlist";
import {
  buildSkillTemplateEntries,
  filterSkillTemplates,
  getSkillTemplate,
  SKILL_CATEGORIES,
  SKILL_TEMPLATE_IDS,
  SKILL_TEMPLATE_LIST,
} from "@/lib/skill-templates/catalog";
import { resolveMcpServerIds } from "@/lib/skill-templates/install";

// Le catalogue de Skills est statique et versionné : ces tests garantissent que
// chaque modèle est réellement exécutable (outils connus, serveurs MCP existants,
// forfait cohérent) et qu'aucun identifiant n'est dupliqué ou inventé.

describe("Catalogue de modèles de Skills", () => {
  it("expose des identifiants et des noms uniques", () => {
    const ids = SKILL_TEMPLATE_LIST.map((template) => template.id);
    const names = SKILL_TEMPLATE_LIST.map((template) => template.name);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(names).size).toBe(names.length);
    expect(SKILL_TEMPLATE_IDS).toEqual(ids);
    expect(SKILL_TEMPLATE_LIST.length).toBeGreaterThanOrEqual(15);
  });

  it("décrit chaque modèle complètement", () => {
    const categoryIds = new Set(
      SKILL_CATEGORIES.map((category) => category.id)
    );
    for (const template of SKILL_TEMPLATE_LIST) {
      expect(template.author).toBeTruthy();
      expect(template.description.length).toBeGreaterThan(20);
      expect(template.instructions.length).toBeGreaterThan(40);
      expect(template.tags.length).toBeGreaterThan(0);
      expect(template.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(categoryIds.has(template.category)).toBe(true);
      expect(["free", "plus", "pro", "max"]).toContain(template.minTier);
      expect(isLucideIconName(template.icon.name)).toBe(true);

      for (const parameter of template.parameters) {
        expect(parameter.name).toMatch(/^[a-z0-9_]+$/);
        expect(parameter.description).toBeTruthy();
      }
    }
  });

  it("n'utilise que des outils connus des registres Chat et Agent", () => {
    for (const template of SKILL_TEMPLATE_LIST) {
      const normalized = normalizeToolIds(template.tools, {
        pluginToolIds: PLUGIN_TOOL_IDS,
      });
      expect(normalized.unknown, `outils inconnus — ${template.id}`).toEqual(
        []
      );
      expect(normalized.usesMcp).toBe(template.mcpServerNames.length > 0);
      expect(normalized.chat.length).toBeGreaterThan(0);
    }
  });

  it("ne cite que des serveurs MCP réellement présents au catalogue", () => {
    const knownNames = new Set(
      MCP_TEMPLATE_LIST.map((template) => template.name.toLowerCase())
    );
    for (const template of SKILL_TEMPLATE_LIST) {
      for (const serverName of template.mcpServerNames) {
        expect(
          knownNames.has(serverName.toLowerCase()),
          `serveur MCP inconnu « ${serverName} » (modèle ${template.id})`
        ).toBe(true);
      }
      // Un modèle qui dépend d'un serveur MCP n'est jamais offert au forfait
      // gratuit : l'accès MCP est réservé aux forfaits payants.
      if (template.mcpServerNames.length > 0) {
        expect(template.minTier).not.toBe("free");
      }
      if (template.tools.includes(MCP_TOOL_SENTINEL)) {
        expect(template.mcpServerNames.length).toBeGreaterThan(0);
      }
    }
  });

  it("filtre le catalogue par catégorie et par requête", () => {
    const all = filterSkillTemplates(SKILL_TEMPLATE_LIST, "", null);
    expect(all).toHaveLength(SKILL_TEMPLATE_LIST.length);

    const devTemplates = filterSkillTemplates(SKILL_TEMPLATE_LIST, "", "dev");
    expect(devTemplates.length).toBeGreaterThan(0);
    expect(devTemplates.every((template) => template.category === "dev")).toBe(
      true
    );

    expect(
      filterSkillTemplates(SKILL_TEMPLATE_LIST, "notion", null).length
    ).toBe(1);
    expect(
      filterSkillTemplates(SKILL_TEMPLATE_LIST, "zzz-introuvable", null)
    ).toHaveLength(0);
    expect(getSkillTemplate("inconnu")).toBeUndefined();
  });

  it("apparie l'état d'installation par identifiant de modèle", () => {
    const entries = buildSkillTemplateEntries([
      {
        id: "skill-1",
        name: "Renommé par l'utilisateur",
        templateId: "copywriter",
      },
    ]);
    const copywriter = entries.find((entry) => entry.id === "copywriter");
    expect(copywriter?.installed).toBe(true);
    expect(copywriter?.installedSkillId).toBe("skill-1");

    const other = entries.find((entry) => entry.id === "seo-writer");
    expect(other?.installed).toBe(false);
    expect(other?.installedSkillId).toBeNull();
  });

  it("retombe sur le nom pour les skills créés avant la migration", () => {
    const entries = buildSkillTemplateEntries([
      { id: "skill-2", name: "Architecte TypeScript", templateId: null },
    ]);
    const architect = entries.find(
      (entry) => entry.id === "typescript-architect"
    );
    expect(architect?.installed).toBe(true);
    expect(architect?.installedSkillId).toBe("skill-2");
  });
});

describe("Résolution des serveurs MCP d'un modèle de Skill", () => {
  it("rattache uniquement les serveurs réellement installés", () => {
    const template = getSkillTemplate("github-maintainer")!;
    const resolved = resolveMcpServerIds(template, [
      { id: "srv-1", name: "github" },
    ]);
    expect(resolved.ids).toEqual(["srv-1"]);
    expect(resolved.linked).toEqual(["github"]);
    expect(resolved.unresolved).toEqual([]);
  });

  it("signale les serveurs manquants sans inventer d'identifiant", () => {
    const template = getSkillTemplate("github-maintainer")!;
    const resolved = resolveMcpServerIds(template, []);
    expect(resolved.ids).toEqual([]);
    expect(resolved.unresolved).toEqual(template.mcpServerNames);
  });

  it("laisse les modèles sans MCP sans rattachement", () => {
    const template = getSkillTemplate("copywriter")!;
    const resolved = resolveMcpServerIds(template, [
      { id: "srv-1", name: "GitHub" },
    ]);
    expect(resolved.ids).toEqual([]);
    expect(resolved.unresolved).toEqual([]);
  });
});

describe("Correspondance des identifiants d'outils Chat ↔ Agent", () => {
  it("pointe vers des outils réellement présents dans les deux registres", () => {
    expect(CHAT_AGENT_TOOL_PAIRS.length).toBeGreaterThan(0);
    for (const pair of CHAT_AGENT_TOOL_PAIRS) {
      expect(NATIVE_TOOL_IDS).toContain(pair.chat);
      expect(
        AGENT_TOOL_CATALOG[pair.agent],
        `outil Agent inconnu « ${pair.agent} »`
      ).toBeDefined();
      expect(typeof AGENT_TOOL_CATALOG[pair.agent]?.name).toBe("string");
    }
  });

  it("convertit dans les deux sens et ignore les outils sans équivalent", () => {
    expect(toAgentToolId("webSearch")).toBe("search_web");
    expect(toChatToolId("search_web")).toBe("webSearch");
    expect(toAgentToolId("calculator")).toBeUndefined();
    expect(toChatToolId("outil_agent_inconnu")).toBeUndefined();
  });

  it("normalise les déclarations des skills sans perdre d'identifiant", () => {
    const normalized = normalizeToolIds([
      "webSearch",
      "read_url",
      MCP_TOOL_SENTINEL,
      "  ",
    ]);
    expect(normalized.chat).toEqual(["webSearch", "readUrl"]);
    expect(normalized.agent).toEqual(["search_web", "read_url"]);
    expect(normalized.usesMcp).toBe(true);
    expect(normalized.unknown).toEqual([]);
  });

  it("signale les identifiants inconnus des deux registres", () => {
    const normalized = normalizeToolIds(["webSearch", "outilInvente"]);
    expect(normalized.unknown).toEqual(["outilInvente"]);
  });
});
