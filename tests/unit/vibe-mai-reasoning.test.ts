import { describe, expect, it } from "vitest";
import { extractMaiReasoning } from "../../vibe-mai-reasoning";

describe("réflexion Vibe", () => {
  it("lit le champ reasoning direct", () => {
    expect(extractMaiReasoning({ reasoning: "Je vérifie les sources." })).toBe(
      "Je vérifie les sources."
    );
  });

  it("lit reasoning_content et préfère les blocs structurés", () => {
    expect(
      extractMaiReasoning({ reasoning_content: "contenu de secours" })
    ).toBe("contenu de secours");
    expect(
      extractMaiReasoning({
        reasoning: "ignoré",
        reasoning_details: [{ text: "bloc un" }, { text: "bloc deux" }],
      })
    ).toBe("bloc un\n\nbloc deux");
  });

  it("déduplique les snapshots répétés", () => {
    expect(
      extractMaiReasoning({
        reasoning_details: [
          { text: "même" },
          { text: "même" },
          { text: "suite" },
        ],
      })
    ).toBe("même\n\nsuite");
  });

  it("ignore une réponse absente ou malformée", () => {
    expect(extractMaiReasoning(null)).toBe("");
    expect(extractMaiReasoning({ reasoning: 42 })).toBe("");
    expect(extractMaiReasoning({ reasoning_details: "pas un tableau" })).toBe(
      ""
    );
  });
});
