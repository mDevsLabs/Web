/** Contrat des paramètres de GET /api/history (validation Zod). */
import { describe, expect, it } from "vitest";
import { parseHistoryQuery } from "@/lib/chat/history-query";

const PROJET = "11111111-1111-4111-8111-111111111111";
const CURSEUR = "22222222-2222-4222-8222-222222222222";

const parse = (query: string) => parseHistoryQuery(new URLSearchParams(query));

describe("parseHistoryQuery", () => {
  it("applique les valeurs par défaut", () => {
    expect(parse("")).toEqual({
      data: {
        endingBefore: null,
        includeArchived: false,
        isArchived: null,
        limit: 20,
        pinned: null,
        project: { kind: "all" },
        search: null,
        startingAfter: null,
        tag: null,
      },
      success: true,
    });
  });

  it("refuse une limite non entière au lieu de transmettre NaN", () => {
    for (const limit of ["abc", "12.5", "-3", ""]) {
      expect(parse(`limit=${limit}`).success).toBe(false);
    }
  });

  it("borne une limite entière hors intervalle (compatibilité)", () => {
    const haut = parse("limit=500");
    const bas = parse("limit=0");
    expect(haut.success && haut.data.limit).toBe(50);
    expect(bas.success && bas.data.limit).toBe(1);
  });

  it("interprète projectId=null comme « sans projet »", () => {
    const result = parse("projectId=null");
    expect(result.success && result.data.project).toEqual({ kind: "none" });
  });

  it("accepte un projectId UUID et refuse un identifiant arbitraire", () => {
    const ok = parse(`projectId=${PROJET}`);
    expect(ok.success && ok.data.project).toEqual({
      id: PROJET,
      kind: "project",
    });
    expect(parse("projectId=../admin").success).toBe(false);
  });

  it("refuse deux curseurs simultanés et un curseur mal formé", () => {
    expect(
      parse(`starting_after=${CURSEUR}&ending_before=${CURSEUR}`).success
    ).toBe(false);
    expect(parse("ending_before=pas-un-uuid").success).toBe(false);
  });

  it("refuse un filtre booléen inconnu au lieu de l'ignorer", () => {
    expect(parse("isArchived=peut-etre").success).toBe(false);
    expect(parse("pinned=1").success).toBe(false);
  });

  it("normalise recherche et étiquette vides", () => {
    const result = parse("search=%20%20&tag=");
    expect(result.success && result.data.search).toBeNull();
    expect(result.success && result.data.tag).toBeNull();
  });
});
