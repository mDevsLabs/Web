import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { dedupeAgentTemplatesByName } from "@/lib/agent-templates/dedupe";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import {
  DEFAULT_SCHEDULE_TOOL_MODE,
  deriveScheduleToolMode,
  normalizeScheduleToolMode,
  SCHEDULE_TOOL_MODE_META,
  SCHEDULE_TOOL_MODES,
} from "@/lib/planning/tool-mode";
import {
  agentQuotaMessage,
  getTierAgentLimit,
  isAgentLimitUnlimited,
  isAgentQuotaExceeded,
} from "@/lib/plans/tier-limits";

const ROOT = path.resolve(import.meta.dirname, "..", "..");

function source(file: string): string {
  return readFileSync(path.join(ROOT, file), "utf8");
}

describe("Quota d'agents par forfait", () => {
  it("accorde 15 agents en Plus, 25 en Pro, aucun quota en Free", () => {
    expect(getTierAgentLimit("plus")).toBe(15);
    expect(getTierAgentLimit("pro")).toBe(25);
    expect(getTierAgentLimit("free")).toBe(0);
  });

  it("traite Max comme un quota illimité", () => {
    expect(getTierAgentLimit("max")).toBeNull();
    expect(isAgentLimitUnlimited("max")).toBe(true);
    expect(isAgentLimitUnlimited("pro")).toBe(false);
  });

  it("ne signale le quota dépassé que pour un quota fini", () => {
    expect(isAgentQuotaExceeded("plus", 14)).toBe(false);
    expect(isAgentQuotaExceeded("plus", 15)).toBe(true);
    expect(isAgentQuotaExceeded("pro", 25)).toBe(true);
    // Max : jamais bloqué, quel que soit le nombre d'agents.
    expect(isAgentQuotaExceeded("max", 15)).toBe(false);
    expect(isAgentQuotaExceeded("max", 10_000)).toBe(false);
  });

  it("normalise un forfait inconnu ou absent sur Free", () => {
    expect(getTierAgentLimit(null)).toBe(0);
    expect(getTierAgentLimit("inconnu")).toBe(0);
  });

  it("garde le miroir backend (config.ts) aligné sur lib/plans/tier-limits.ts", () => {
    const config = source("config.ts");
    expect(config).toContain("Plus: 15");
    expect(config).toContain("Pro: 25");
    expect(config).toContain("Max: null");
  });

  it("n'a plus aucun plafond codé en dur dans l'API des agents", () => {
    const route = source("app/(chat)/api/agents/route.ts");
    const duplicate = source("app/(chat)/api/agents/[id]/duplicate/route.ts");
    for (const file of [route, duplicate]) {
      expect(file).toContain("getTierAgentLimit");
      expect(file).not.toMatch(/length\s*>=\s*10/);
    }
  });

  it("expose la limite du forfait dans GET /api/agents", () => {
    const route = source("app/(chat)/api/agents/route.ts");
    expect(route).toMatch(/Response\.json\(\{\s*agents,\s*limit:/);
  });

  it("formule un message de quota qui cite la limite effective", () => {
    expect(agentQuotaMessage(15)).toContain("15");
    expect(agentQuotaMessage(25)).toContain("25");
  });
});

describe("Modèle par défaut", () => {
  it("est défini en un seul point et vaut gemini/gemini-3.8-flash", () => {
    expect(DEFAULT_CHAT_MODEL).toBe("gemini/gemini-3.8-flash");
  });

  it("n'est plus codé en dur ailleurs que dans la constante et la migration", () => {
    // Le littéral ne doit subsister que dans lib/ai/models.ts (la constante)
    // et dans la migration 0029 (alignement des données existantes).
    for (const file of [
      "lib/db/queries.ts",
      "lib/db/schema.ts",
      "lib/planning/executor.ts",
      "app/(chat)/api/planning/route.ts",
    ]) {
      expect(source(file)).not.toContain('"google/gemini-2.5-flash"');
    }
  });

  it("aligne les valeurs existantes et les DEFAULT des colonnes", () => {
    const migration = source(
      "lib/db/migrations/0029_agent_templates_icons_and_tool_modes.sql"
    );
    expect(migration).toContain("gemini/gemini-3.8-flash");
    // AgentTemplate, Agent puis ScheduledMessage.
    expect(
      migration.match(/SET DEFAULT 'gemini\/gemini-3\.8-flash'/g)
    ).toHaveLength(3);
  });
});

describe("Modèles d'agents : pas de doublon", () => {
  it("ne renvoie qu'une ligne par nom même si la table en contient deux", () => {
    // Régression du symptôme « chaque modèle apparaît deux fois » : le seed de
    // 0007_agents.sql réinsérait 12 lignes à chaque rejeu (pas d'index UNIQUE
    // sur "name", donc son ON CONFLICT DO NOTHING ne pouvait pas se déclencher)
    // et getAgentTemplates renvoyait toutes les lignes. On rejoue la table
    // sale : une seule ligne par nom doit ressortir, la plus ancienne étant
    // conservée (ordre de tri par nom en SQL).
    const dirty = [
      { id: "a1", name: "Assistant Général" },
      { id: "a2", name: "Assistant Général" },
      { id: "b1", name: "Data Analyst" },
      { id: "b2", name: "Data Analyst" },
      { id: "c1", name: "Juridique FR" },
    ];
    const rows = dedupeAgentTemplatesByName(dirty);
    expect(rows.map((row) => row.name)).toEqual([
      "Assistant Général",
      "Data Analyst",
      "Juridique FR",
    ]);
    expect(rows[0]?.id).toBe("a1");
  });

  it("laisse une table propre inchangée", () => {
    const clean = [
      { id: "a1", name: "Assistant Général" },
      { id: "b1", name: "Data Analyst" },
    ];
    expect(dedupeAgentTemplatesByName(clean)).toEqual(clean);
    expect(dedupeAgentTemplatesByName([])).toEqual([]);
  });

  it("applique la déduplication dans la lecture des modèles", () => {
    const queries = source("lib/db/queries.ts");
    const start = queries.indexOf("export async function getAgentTemplates");
    const body = queries.slice(start, start + 600);
    expect(body).toContain("dedupeAgentTemplatesByName(rows)");
  });

  it("pose un index UNIQUE sur le nom des modèles", () => {
    expect(source("lib/db/schema.ts")).toContain(
      'uniqueIndex("AgentTemplate_name_key")'
    );
    expect(source("lib/db/queries.ts")).toContain(
      'CREATE UNIQUE INDEX IF NOT EXISTS "AgentTemplate_name_key"'
    );
  });

  it("supprime les doublons avant de créer l'index UNIQUE (migration 0029)", () => {
    const migration = source(
      "lib/db/migrations/0029_agent_templates_icons_and_tool_modes.sql"
    );
    const deleteIndex = migration.indexOf('DELETE FROM "AgentTemplate"');
    const uniqueIndex = migration.indexOf(
      'CREATE UNIQUE INDEX IF NOT EXISTS "AgentTemplate_name_key"'
    );
    expect(deleteIndex).toBeGreaterThan(-1);
    expect(uniqueIndex).toBeGreaterThan(deleteIndex);
  });

  it("enregistre la migration 0029 dans le journal", () => {
    const journal = JSON.parse(
      source("lib/db/migrations/meta/_journal.json")
    ) as { entries: Array<{ idx: number; tag: string }> };
    const entry = journal.entries.find((e) => e.idx === 28);
    expect(entry?.tag).toBe("0029_agent_templates_icons_and_tool_modes");
  });
});

describe("Suppression du système emoji", () => {
  it("retire la colonne emoji des deux tables", () => {
    const migration = source(
      "lib/db/migrations/0029_agent_templates_icons_and_tool_modes.sql"
    );
    expect(migration).toContain(
      'ALTER TABLE "Agent" DROP COLUMN IF EXISTS "emoji"'
    );
    expect(migration).toContain(
      'ALTER TABLE "AgentTemplate" DROP COLUMN IF EXISTS "emoji"'
    );
    expect(source("lib/db/schema.ts")).not.toContain('emoji: varchar("emoji"');
  });

  it("ne garde plus ni preset emoji ni prop emoji sur AgentIcon", () => {
    const icon = source("components/agents/agent-icon.tsx");
    expect(icon).not.toContain("EMOJI_PRESETS");
    expect(icon).not.toContain("isEmoji");
    expect(icon).not.toContain("emoji?:");
  });

  it("n'expose plus l'emoji dans les schémas de validation de l'API", () => {
    expect(source("app/(chat)/api/agents/route.ts")).not.toContain("emoji");
    expect(source("app/(chat)/api/agents/[id]/route.ts")).not.toContain(
      "emoji"
    );
  });

  it("conserve un AgentIcon par icône lucide pour chaque modèle", () => {
    // Les 12 modèles historiques (0007_agents.sql) ont chacun une icône
    // lucide distincte : plus aucun emoji n'est nécessaire pour les distinguer.
    const seed = source("lib/db/migrations/0007_agents.sql");
    // Colonnes du INSERT : (..., "icon","emoji","color", ...) → on extrait
    // l'icône lucide de chaque ligne semée.
    const iconIds = [
      ...seed.matchAll(/,\s*'([a-z-]+)','[^']*','#[0-9a-f]{6}'/g),
    ].map((match) => match[1]);
    expect(iconIds.length).toBeGreaterThanOrEqual(12);
    expect(new Set(iconIds).size).toBe(iconIds.length);
  });
});

describe("Palette de badges", () => {
  it("propose 10 couleurs classiques, tous des hex valides", () => {
    const presets = source("components/agents/agent-presets.ts");
    const block = presets.slice(
      presets.indexOf("AGENT_COLORS"),
      presets.indexOf("DEFAULT_AGENT_COLOR")
    );
    const colors = [...block.matchAll(/"(#[0-9a-f]{6})"/g)].map((m) => m[1]);
    expect(colors).toHaveLength(10);
    expect(new Set(colors).size).toBe(10);
  });

  it("conserve les hex de l'ancienne palette de 16 (aucun agent ne perd sa couleur)", () => {
    const presets = source("components/agents/agent-presets.ts");
    for (const legacy of [
      "#6366f1",
      "#0ea5e9",
      "#eab308",
      "#22c55e",
      "#14b8a6",
      "#ec4899",
      "#64748b",
      "#ef4444",
      "#f97316",
      "#8b5cf6",
    ]) {
      expect(presets).toContain(legacy);
    }
  });

  it("a un composant partagé avec couleur libre, utilisé par les 3 écrans", () => {
    const picker = source("components/common/color-picker.tsx");
    expect(picker).toContain('type="color"');
    expect(picker).toContain("grid-cols-5");
    for (const file of [
      "app/(chat)/agents/agents-client.tsx",
      "app/(chat)/skills/skills-client.tsx",
      "components/settings/configuration-client.tsx",
    ]) {
      expect(source(file)).toContain("<ColorPicker");
    }
  });
});

describe("Onglet Modèles", () => {
  it("expose trois onglets dont un dédié aux modèles", () => {
    const client = source("app/(chat)/agents/agents-client.tsx");
    expect(client).toContain('"agents" | "templates" | "stats"');
    expect(client).toContain("Modèles ({templates.length})");
    expect(client).toContain("Rechercher un modèle...");
  });

  it("filtre les modèles par tag et par modèle", () => {
    const client = source("app/(chat)/agents/agents-client.tsx");
    expect(client).toContain("templateTag");
    expect(client).toContain("templateModel");
    expect(client).toContain("Filtrer par modèle");
  });
});

describe("Icônes uniques", () => {
  it("donne une icône distincte à chacun des 16 plugins", () => {
    const manifests = readFileSync("lib/plugins/index.json", "utf8");
    expect(manifests).toContain("catalogVersion");
    const dirs = [
      "air-quality",
      "crossref",
      "eurostat",
      "fr-holidays",
      "github-public",
      "gitlab-public",
      "json-toolbox",
      "mobilite-fr",
      "open-food-facts",
      "open-library",
      "openalex",
      "quizzly",
      "tvmaze",
      "weather",
      "wikidata",
      "world-bank",
    ];
    const icons = dirs.map((dir) => {
      const manifest = JSON.parse(source(`lib/plugins/${dir}/index.json`)) as {
        icon: { name: string; type: string };
      };
      return manifest.icon.name;
    });
    expect(icons).toHaveLength(16);
    expect(new Set(icons).size).toBe(16);
  });

  it("déclare dans l'allowlist chaque icône utilisée par un manifeste", () => {
    const allowlist = source("lib/plugins/icon-allowlist.ts");
    const used = [
      "Banknote",
      "GitBranch",
      "Github",
      "Gitlab",
      "Landmark",
      "Library",
      "Mail",
      "NotebookPen",
      "Salad",
      "Wind",
    ];
    for (const name of used) {
      expect(allowlist).toContain(`"${name}"`);
      // Le Record<LucideIconName, …> de icon.tsx rend l'implémentation obligatoire.
      expect(source("lib/plugins/icon.tsx")).toContain(`${name}: ${name} as`);
    }
  });

  it("donne une icône déclarée à chaque modèle de skill", () => {
    const skills = source("lib/skill-templates/index.ts");
    const icons = [
      ...skills.matchAll(/icon: \{ name: "(\w+)", type: "lucide" \}/g),
    ].map((m) => m[1]);
    expect(icons.length).toBeGreaterThanOrEqual(18);
    // Objectif : plus aucun doublon (FileText×2 et Code×2 Historically).
    expect(new Set(icons).size).toBe(icons.length);
  });

  it("rend l'icône du manifeste dans la liste des skills (plus de glyphe générique)", () => {
    const panel = source("app/(chat)/tools/skills-panel.tsx");
    expect(panel).toContain(
      '<SkillTemplateIcon className="size-3.5" icon={icon} />'
    );
    expect(panel).toContain("icon={template.icon}");
    expect(panel).not.toContain("<SkillGlyph color={template.color} />");
  });
});

describe("Planification : modes d'outils", () => {
  it("propose exactement trois modes étiquetés", () => {
    expect(SCHEDULE_TOOL_MODES).toEqual(["auto", "plugins", "none"]);
    expect(SCHEDULE_TOOL_MODE_META.auto.label).toBe("Automatique");
    expect(SCHEDULE_TOOL_MODE_META.plugins.label).toBe(
      "Plugins / MCP et Skills"
    );
    expect(SCHEDULE_TOOL_MODE_META.none.label).toBe("Aucun");
    for (const mode of SCHEDULE_TOOL_MODES) {
      expect(SCHEDULE_TOOL_MODE_META[mode].description.length).toBeGreaterThan(
        20
      );
    }
  });

  it("vaut Automatique par défaut", () => {
    expect(DEFAULT_SCHEDULE_TOOL_MODE).toBe("auto");
    expect(normalizeScheduleToolMode(undefined)).toBe("auto");
    expect(normalizeScheduleToolMode("n'importe quoi")).toBe("auto");
    expect(normalizeScheduleToolMode("none")).toBe("none");
  });

  it("déduit le mode des tâches antérieures à la colonne toolMode", () => {
    // 0029 n'a pas de toolMode sur les lignes créées avant : une sélection
    // vide d'outils signifiait « aucun outil ».
    expect(
      deriveScheduleToolMode({ enabledTools: [], storedMode: undefined })
    ).toBe("none");
    expect(
      deriveScheduleToolMode({ enabledTools: ["webSearch"], storedMode: null })
    ).toBe("auto");
    // Un mode explicite l'emporte toujours sur l'ancien champ.
    expect(
      deriveScheduleToolMode({
        enabledTools: ["webSearch"],
        storedMode: "none",
      })
    ).toBe("none");
  });

  it("valide toolMode dans les deux routes de l'API", () => {
    for (const file of [
      "app/(chat)/api/planning/route.ts",
      "app/(chat)/api/planning/[id]/route.ts",
    ]) {
      expect(source(file)).toContain("z.enum(SCHEDULE_TOOL_MODES)");
    }
  });

  it("n'expose plus la grille d'outils unitaires dans le dialogue", () => {
    const dialog = source("components/planning/schedule-dialog.tsx");
    expect(dialog).toContain("Outils disponibles pour l'exécution");
    expect(dialog).not.toContain("toggleTool");
    expect(dialog).not.toContain("Outils activés pour l'exécution");
  });

  it("conditionne les outils natifs au seul mode Automatique", () => {
    const executor = source("lib/planning/executor.ts");
    expect(executor).toContain('const wantsNativeTools = toolMode === "auto";');
    expect(executor).toContain("...(wantsNativeTools ? nativeTools : {})");
  });

  it("charge le contexte MCP dans les deux modes qui l'annoncent", () => {
    const executor = source("lib/planning/executor.ts");
    // « Plugins / MCP et Skills » doit réellement livrer les serveurs MCP de
    // l'utilisateur, pas seulement ceux configurés sur l'agent.
    expect(executor).toContain('const wantsMcp = toolMode !== "none";');
  });

  it("n'instancie aucun outil de plugin en mode Aucun", () => {
    const executor = source("lib/planning/executor.ts");
    expect(executor).toContain('toolMode === "none"\n        ? []');
  });

  it("ajoute toolMode à la table ScheduledMessage avec une contrainte", () => {
    expect(source("lib/db/schema.ts")).toContain("toolMode");
    const migration = source(
      "lib/db/migrations/0029_agent_templates_icons_and_tool_modes.sql"
    );
    expect(migration).toContain(
      "ADD COLUMN IF NOT EXISTS \"toolMode\" varchar(16) NOT NULL DEFAULT 'auto'"
    );
    expect(migration).toContain("ScheduledMessage_toolMode_check");
  });
});

describe("Designer d'agent", () => {
  it("n'a plus d'onglet de test en direct ni de playground", () => {
    const client = source("app/(chat)/agents/agents-client.tsx");
    expect(client).not.toContain("Test en direct (Chat)");
    expect(client).not.toContain("handleSendPlaygroundMessage");
    expect(client).not.toContain("playgroundMessages");
    expect(client).not.toContain("setEditorTab");
  });

  it("réserve la place du bouton de fermeture du dialogue", () => {
    const client = source("app/(chat)/agents/agents-client.tsx");
    // DialogContent positionne la croix en `absolute top-4 right-4` :
    // l'en-tête doit réservée la place, sinon elle chevauche le contenu.
    expect(client).toContain('<DialogHeader className="pr-12">');
  });

  it("n'affiche que le sélecteur d'icône, sans toggle emoji", () => {
    const client = source("app/(chat)/agents/agents-client.tsx");
    expect(client).toContain("Icône — affichée partout");
    expect(client).not.toContain("formIconType");
    expect(client).not.toContain("Emoji Unicode");
  });
});
