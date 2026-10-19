import { describe, expect, it } from "vitest";
import {
  ACCENTS_WAKIE,
  accentPourWakie,
  estAccentValide,
} from "@/lib/wakies/shared/accent";

describe("accent couleur des Wakies", () => {
  it("valide la palette fermée", () => {
    expect(estAccentValide("bleu")).toBe(true);
    expect(estAccentValide("corail")).toBe(true);
    expect(estAccentValide("vert-fluo")).toBe(false);
    expect(estAccentValide(null)).toBe(false);
    expect(estAccentValide(42)).toBe(false);
  });

  it("sert l'accent explicite quand il est valide", () => {
    expect(
      accentPourWakie({ accent: "menthe", avatar: "goutte", id: "x" })
    ).toEqual({ hex: "#0e9f8a", nom: "menthe" });
  });

  it("dérive un accent stable quand rien n'est renseigné", () => {
    const premier = accentPourWakie({
      accent: null,
      avatar: "goutte",
      id: "abc",
    });
    const second = accentPourWakie({
      accent: null,
      avatar: "goutte",
      id: "abc",
    });
    expect(premier).toEqual(second);
    expect(ACCENTS_WAKIE.map((a) => a.hex)).toContain(premier.hex);
  });

  it("retombe sur la dérivation quand le stocké est hors palette", () => {
    const derive = accentPourWakie({ accent: null, avatar: null, id: "abc" });
    expect(
      accentPourWakie({ accent: "inconnu", avatar: null, id: "abc" })
    ).toEqual(derive);
  });

  it("répartit les Wakies sur la palette", () => {
    const utilises = new Set(
      Array.from(
        { length: 16 },
        (_, index) =>
          accentPourWakie({ accent: null, avatar: null, id: `wakie-${index}` })
            .nom
      )
    );
    expect(utilises.size).toBeGreaterThan(2);
  });
});
