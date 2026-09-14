import { describe, expect, it } from "vitest";
import { parseStructuredSelection } from "@/lib/agent/tools/selector/model-select";
import {
  selectToolsByRules,
  type ToolSelectionContext,
} from "@/lib/agent/tools/selector/rules";
import type { RegisteredAgentTool } from "@/lib/agent/types";

function makeTool(
  id: string,
  category: RegisteredAgentTool["category"]
): RegisteredAgentTool {
  return {
    availability: { categories: [category] },
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
