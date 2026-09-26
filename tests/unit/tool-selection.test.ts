import { describe, expect, it } from "vitest";
import { TASKS_TOOL_ID } from "@/lib/agent/tools/catalog";
import { parseStructuredSelection } from "@/lib/agent/tools/selector/model-select";
import {
  availableTools,
  selectToolsByRules,
  type ToolSelectionContext,
} from "@/lib/agent/tools/selector/rules";
import type { RegisteredAgentTool } from "@/lib/agent/types";

function makeTool(
  id: string,
  category: RegisteredAgentTool["category"],
  optIn = false
): RegisteredAgentTool {
  return {
    availability: { categories: [category], ...(optIn ? { optIn: true } : {}) },
    category,
    description: "",
    execute: async () => ({ data: null, success: true }),
    id,
    name: id,
    permissions: { default: "auto", readOnly: true },
    schema: {} as RegisteredAgentTool["schema"],
    source: "internal",
  };
}

describe("Sélection d'outils structurée", () => {
  const available = ["web", "files", "internal"] as const;

  it("accepte une sortie modèle valide et borne les familles", () => {
    const result = parseStructuredSelection(
      { families: ["web", "files", "internal", "mcp"] },
      [...available]
    );
    expect(result).toEqual({
      families: ["web", "files", "internal"],
      kind: "ok",
    });
  });

  it("compte les doublons dans la borne maximale puis déduplique", () => {
    const result = parseStructuredSelection(
      { families: ["web", "files", "web", "files", "internal", "mcp"] },
      [...available]
    );
    expect(result).toEqual({ families: ["web", "files"], kind: "ok" });
  });

  it("rejette une sortie non conforme (fallback déterministe)", () => {
    expect(parseStructuredSelection("pas du json", [...available])).toEqual({
      kind: "unavailable",
    });
    expect(parseStructuredSelection({ families: 42 }, [...available])).toEqual({
      kind: "unavailable",
    });
  });

  it("filtre les familles indisponibles et vide => unavailable", () => {
    const result = parseStructuredSelection({ families: ["plugins", "mcp"] }, [
      ...available,
    ]);
    expect(result).toEqual({ kind: "unavailable" });
  });

  it("retombe sur la baseline déterministe quand le modèle est muet", () => {
    const context: ToolSelectionContext = {
      capabilities: { files: true, tools: true },
      enabledCategories: null,
      mode: "auto",
      task: "Fais quelque chose de complètement neutre",
      tools: [
        makeTool("search_web", "web"),
        makeTool("create_artifact", "artifact"),
        makeTool("ask_user", "internal"),
        makeTool("read_project", "project"),
        makeTool("read_library", "library"),
      ],
      userTier: "pro",
    };
    const result = selectToolsByRules(context);
    expect(result.families.length).toBeGreaterThan(0);
    expect(result.uncertain).toBe(true);
  });
});

// Un « Salut » ne doit pas produire de plan de tâches. L'outil engageant
// n'entre dans le plateau que sur demande explicite du menu « + » — quel que
// soit le mode de sélection, et y compris quand sa catégorie est active.
describe("Outils engageants (opt-in)", () => {
  const tools = [
    makeTool("search_web", "web"),
    makeTool("create_artifact", "artifact"),
    makeTool("ask_user", "internal"),
    makeTool(TASKS_TOOL_ID, "internal", true),
  ];

  const base: ToolSelectionContext = {
    capabilities: { files: true, tools: true },
    enabledCategories: null,
    mode: "auto",
    task: "Salut",
    tools,
    userTier: "pro",
  };

  it("existe bien dans le plateau de départ (l'opt-in n'est pas un filtre d'implémentation)", () => {
    expect(tools.map((tool) => tool.id)).toContain(TASKS_TOOL_ID);
  });

  it("est absent d'auto, d'all et de categories quand il n'est pas activé", () => {
    for (const mode of ["auto", "all", "categories"] as const) {
      const result = selectToolsByRules({ ...base, mode });
      expect(
        result.tools.map((tool) => tool.id),
        `mode ${mode}`
      ).not.toContain(TASKS_TOOL_ID);
    }
  });

  it("reste absent même si l'utilisateur a coché sa catégorie", () => {
    const result = selectToolsByRules({
      ...base,
      enabledCategories: ["internal"],
      mode: "categories",
    });
    expect(result.tools.map((tool) => tool.id)).not.toContain(TASKS_TOOL_ID);
  });

  it("reste absent même quand le routeur LLM réclame la famille internal", () => {
    expect(
      availableTools({ ...base, mode: "all" }).map((t) => t.id)
    ).not.toContain(TASKS_TOOL_ID);
  });

  it("entre dans le plateau dès que l'utilisateur l'a activé", () => {
    for (const mode of ["auto", "all", "categories"] as const) {
      const result = selectToolsByRules({
        ...base,
        mode,
        optInToolIds: [TASKS_TOOL_ID],
      });
      expect(
        result.tools.map((tool) => tool.id),
        `mode ${mode}`
      ).toContain(TASKS_TOOL_ID);
    }
  });

  it("n'exclut pas les autres outils de la même catégorie", () => {
    const result = selectToolsByRules({ ...base, mode: "all" });
    const ids = result.tools.map((tool) => tool.id);
    expect(ids).toContain("ask_user");
    expect(ids).toContain("search_web");
  });
});
