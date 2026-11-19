import { describe, expect, it } from "vitest";

// Ciblage de l'occurrence sélectionnée dans l'assistant Pages (issue #52) :
// avec deux occurrences identiques, SEULE la sélection est modifiée ; un patch
// ambigu sans sélection n'est jamais appliqué silencieusement. Le remplacement
// manuel (recherche/remplacement de l'éditeur) n'utilise pas ce module et
// n'est pas concerné.

import { hashContent } from "@/lib/artifacts/hash";
import {
  anchorOpsToSelection,
  applyDocumentPatch,
  type DocumentPatch,
  type DocumentPatchOp,
} from "@/lib/artifacts/patch";
import { countTextOccurrences, findSelectionAnchor } from "@/lib/pages/text";
import { buildPageSystemPrompt } from "@/lib/prompts/pages";

const BASE = "ALPHA beta ALPHA";
const ALPHA_GAUCHE = { end: 5, start: 0 };
const ALPHA_DROITE = { end: 16, start: 11 };

function patchOf(ops: DocumentPatchOp[]): DocumentPatch {
  return { baseHash: hashContent(BASE), ops };
}

function replaceOp(
  overrides: Partial<Extract<DocumentPatchOp, { type: "replace_text" }>> = {}
): DocumentPatchOp {
  return {
    find: "ALPHA",
    replaceWith: "OMEGA",
    type: "replace_text",
    ...overrides,
  };
}

describe("applyDocumentPatch — deux occurrences identiques (issue #52)", () => {
  it("modifie SEULEMENT l'occurrence sélectionnée (ancrage de la seconde)", () => {
    const result = applyDocumentPatch(
      BASE,
      patchOf([replaceOp({ anchor: ALPHA_DROITE })])
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.content).toBe("ALPHA beta OMEGA");
    }
  });

  it("modifie la première quand elle est sélectionnée", () => {
    const result = applyDocumentPatch(
      BASE,
      patchOf([replaceOp({ anchor: ALPHA_GAUCHE })])
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.content).toBe("OMEGA beta ALPHA");
    }
  });

  it("refuse un patch ambigu sans sélection au lieu de prendre la première occurrence", () => {
    const result = applyDocumentPatch(BASE, patchOf([replaceOp()]));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0].reason).toBe("ambiguous");
      expect(result.errors[0].message).toContain("2 fois");
    }
  });

  it("refuse un ancrage qui ne correspond plus au texte (jamais de repli)", () => {
    // L'ancre pointe « beta » mais l'op cherche « ALPHA » : le patch est
    // refusé — la première occurrence ne sera pas remplacée à la place.
    const result = applyDocumentPatch(
      BASE,
      patchOf([replaceOp({ anchor: { end: 10, start: 6 } })])
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0].reason).toBe("invalid");
    }
  });

  it("reste déterministe avec une occurrence explicite ou replaceAll", () => {
    const occurrence2 = applyDocumentPatch(
      BASE,
      patchOf([replaceOp({ occurrence: 2 })])
    );
    expect(occurrence2.ok).toBe(true);
    if (occurrence2.ok) {
      expect(occurrence2.content).toBe("ALPHA beta OMEGA");
    }

    const tous = applyDocumentPatch(
      BASE,
      patchOf([replaceOp({ replaceAll: true })])
    );
    expect(tous.ok).toBe(true);
    if (tous.ok) {
      expect(tous.content).toBe("OMEGA beta OMEGA");
    }
  });

  it("demeure atomique : une op ambiguë invalide tout le patch", () => {
    const result = applyDocumentPatch(
      BASE,
      patchOf([
        { content: "TITRE", line: 0, position: "before", type: "insert" },
        replaceOp(),
      ])
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].opIndex).toBe(1);
    }
  });

  it("garde le contrôle de fraîcheur baseHash", () => {
    const result = applyDocumentPatch("ALPHA beta GAMMA", patchOf([]));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0].reason).toBe("stale_base");
    }
  });
});

describe("anchorOpsToSelection — ancrage des ops qui ciblent la sélection", () => {
  it("ancre un replace_text dont le find est exactement la sélection", () => {
    const ops = anchorOpsToSelection(BASE, [replaceOp()], {
      anchor: ALPHA_DROITE,
      text: "ALPHA",
    });

    expect(ops[0]).toMatchObject({ anchor: ALPHA_DROITE });
  });

  it("laisse intacte une op qui ne cible pas la sélection", () => {
    const ops = anchorOpsToSelection(BASE, [replaceOp({ find: "beta" })], {
      anchor: ALPHA_DROITE,
      text: "ALPHA",
    });

    expect((ops[0] as { anchor?: unknown }).anchor).toBeUndefined();
  });

  it("laisse intactes les ops sans sélection ancrable", () => {
    const ops = anchorOpsToSelection(BASE, [replaceOp()], {
      anchor: null,
      text: "ALPHA",
    });

    expect((ops[0] as { anchor?: unknown }).anchor).toBeUndefined();
  });

  it("n'ancre rien quand l'ancre ne pointe plus la sélection dans le contenu", () => {
    const ops = anchorOpsToSelection("GAMMA beta ALPHA", [replaceOp()], {
      anchor: { end: 5, start: 0 },
      text: "ALPHA",
    });

    expect((ops[0] as { anchor?: unknown }).anchor).toBeUndefined();
  });
});

describe("findSelectionAnchor — ancrage de la sélection dans le Markdown", () => {
  it("localise la seconde occurrence identique", () => {
    expect(countTextOccurrences(BASE, "ALPHA")).toBe(2);
    expect(findSelectionAnchor(BASE, "ALPHA", 1)).toEqual(ALPHA_DROITE);
    expect(findSelectionAnchor(BASE, "ALPHA", 0)).toEqual(ALPHA_GAUCHE);
  });

  it("retourne null quand le texte sélectionné n'est pas dans le contenu", () => {
    expect(findSelectionAnchor(BASE, "sélection traversant **gras**", 0)).toBe(
      null
    );
  });

  it("retourne null hors des occurrences disponibles", () => {
    expect(findSelectionAnchor(BASE, "ALPHA", 5)).toBe(null);
    expect(findSelectionAnchor(BASE, "", 0)).toBe(null);
  });
});

describe("Prompt Pages — la sélection est transmise avec son ancrage", () => {
  it("donne les offsets quand la sélection est ancrable", () => {
    const prompt = buildPageSystemPrompt({
      accountEnabled: false,
      accountInstructions: null,
      intent: "edit",
      pagePrompt: null,
      projectInstructions: null,
      selection: "ALPHA",
      selectionAnchor: ALPHA_DROITE,
    });

    expect(prompt).toContain("[11, 16)");
    expect(prompt).toContain("anchor");
  });

  it("avertit de l'ambiguïté quand la sélection n'est pas ancrable", () => {
    const prompt = buildPageSystemPrompt({
      accountEnabled: false,
      accountInstructions: null,
      intent: "propose",
      pagePrompt: null,
      projectInstructions: null,
      selection: "ALPHA",
      selectionAnchor: null,
    });

    expect(prompt).toContain("REFUSÉ");
    expect(prompt).toContain("pas d'ancrage résoluble");
  });
});
