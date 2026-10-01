import { describe, expect, it } from "vitest";
import {
  type ReasoningModelLike,
  resolveReasoningOptions,
} from "@/lib/agent/reasoning-options";

// Ce que voit l'utilisateur dans le sélecteur doit venir du catalogue, jamais
// d'une liste écrite dans le composant. Ces tests vérifient que la liste
// affichée suit les capacités du modèle, y compris quand le catalogue change.

function model(
  id: string,
  levels: string[] = [],
  extra: {
    reasoning?: boolean;
    default?: string | null;
    mandatory?: boolean;
  } = {}
): ReasoningModelLike {
  return {
    capabilities: {
      reasoning: extra.reasoning ?? levels.length > 0,
      reasoningDefault: (extra.default ?? null) as never,
      reasoningLevels: levels as never,
      reasoningMandatory: extra.mandatory ?? false,
    },
    id,
  };
}

const SPACE_BUNNY = model(
  "stealth/space-bunny-alpha",
  ["max", "xhigh", "high", "medium", "low"],
  { default: "max", mandatory: true }
);

const MAI_2 = model("mai-2", ["max", "high", "low"], { default: "high" });
const MAI_2_MINI = model("mai-2-mini", [], { reasoning: true });
const PLAIN = model("google/gemini-2.5-flash:free");

describe("Avec un modèle de repli choisi", () => {
  it("n'affiche que les niveaux que ce modèle accepte", () => {
    const options = resolveReasoningOptions({
      models: [SPACE_BUNNY, MAI_2, MAI_2_MINI],
      selectedModelId: "mai-2",
    });
    expect(options.levels).toEqual(["max", "high", "low"]);
    expect(options.isAutomatic).toBe(false);
    expect(options.modelId).toBe("mai-2");
  });

  it("ne propose pas « max » pour un modèle sans « minimal » ni « none »", () => {
    // Le piège : proposer un niveau que le modèle refuse enverrait une requête
    // rejetée à chaque tour.
    const options = resolveReasoningOptions({
      models: [MAI_2],
      selectedModelId: "mai-2",
    });
    expect(options.levels).not.toContain("minimal");
    expect(options.levels).not.toContain("none");
    expect(options.levels).not.toContain("xhigh");
  });

  it("remonte le caractère obligatoire et le défaut du fournisseur", () => {
    const options = resolveReasoningOptions({
      models: [SPACE_BUNNY],
      selectedModelId: SPACE_BUNNY.id,
    });
    expect(options.mandatory).toBe(true);
    expect(options.defaultLevel).toBe("max");
  });

  it("retombe sur l'union si le modèle choisi a disparu du catalogue", () => {
    const options = resolveReasoningOptions({
      models: [SPACE_BUNNY],
      selectedModelId: "modele-supprime",
    });
    expect(options.isAutomatic).toBe(true);
    expect(options.levels).toContain("xhigh");
  });
});

describe("Sans modèle de repli (« Automatique »)", () => {
  it("propose l'union des niveaux du catalogue, dans l'ordre canonique", () => {
    const options = resolveReasoningOptions({
      models: [MAI_2, SPACE_BUNNY],
      selectedModelId: null,
    });
    // Union {max, high, low} ∪ {max, xhigh, high, medium, low}, réordonnée
    // du plus intense au plus faible — l'ordre du catalogue, respecté.
    expect(options.levels).toEqual(["max", "xhigh", "high", "medium", "low"]);
    expect(options.isAutomatic).toBe(true);
  });

  it("ignore les modèles sans réflexion", () => {
    const options = resolveReasoningOptions({
      models: [PLAIN, MAI_2_MINI, PLAIN],
      selectedModelId: null,
    });
    expect(options.levels).toEqual([]);
    expect(options.isEmpty).toBe(true);
  });

  it("ne déclare aucun niveau quand personne n'en propose", () => {
    const options = resolveReasoningOptions({ models: [PLAIN] });
    expect(options.isEmpty).toBe(true);
    expect(options.levels).toEqual([]);
  });

  it("reste gérable quand un seul modèle est disponible", () => {
    const options = resolveReasoningOptions({ models: [MAI_2] });
    expect(options.levels).toEqual(["max", "high", "low"]);
    expect(options.isEmpty).toBe(false);
  });

  it("tolère un catalogue vide", () => {
    const options = resolveReasoningOptions({ models: [] });
    expect(options.levels).toEqual([]);
    expect(options.isEmpty).toBe(true);
  });
});

describe("Un niveau hors nomenclature ne peut pas fuiter", () => {
  it("filtre les valeurs que le vocabulaire partagé ne connaît pas", () => {
    // Si un fournisseur ajoute « turbo », il ne doit pas apparaître dans le
    // sélecteur : le provider AI SDK refuserait la requête.
    const options = resolveReasoningOptions({
      models: [model("vendor/x", ["high", "turbo", "low"])],
      selectedModelId: "vendor/x",
    });
    expect(options.levels).toEqual(["high", "low"]);
  });
});
