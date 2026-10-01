import { describe, expect, it } from "vitest";
import {
  buildCustomInstructionsSchema,
  buildNullableCustomInstructionsSchema,
  customInstructionsCounterLabel,
  customInstructionsHint,
  customInstructionsLimitPayload,
} from "@/lib/plans/custom-instructions";
import {
  CUSTOM_INSTRUCTIONS_HARD_CAP,
  getCustomInstructionsEffectiveMax,
  getTierCustomInstructionsMax,
} from "@/lib/plans/tier-limits";

// Non-régression du passage de « 4000 en dur » à un plafond par forfait.
//
// Le risque principal n'est pas la valeur choisie mais l'oubli d'un site :
// avant, la limite était répétée dans 7 schémas Zod et 2 éléments d'UI. Ces
// tests verrouillent la table pour qu'une retouche future soit consciente.

describe("limites des instructions personnalisées par forfait", () => {
  it("produit le plafond produit attendu pour chaque forfait", () => {
    expect(getTierCustomInstructionsMax("free")).toBe(2000);
    expect(getTierCustomInstructionsMax("plus")).toBe(3000);
    expect(getTierCustomInstructionsMax("pro")).toBe(5000);
    expect(getTierCustomInstructionsMax("max")).toBeNull();
  });

  it("traite « gratuit » (alias backend) comme Free", () => {
    expect(getTierCustomInstructionsMax("gratuit")).toBe(2000);
  });

  it("retombe sur Free pour un forfait inconnu ou absent", () => {
    // Fail-safe : un tier illisible ne doit jamais accorder le plafond Max.
    expect(getTierCustomInstructionsMax(undefined)).toBe(2000);
    expect(getTierCustomInstructionsMax("enterprise")).toBe(2000);
    expect(getTierCustomInstructionsMax("MAX")).toBeNull();
  });

  it("borne Max par le garde-fou technique de 100 000 caractères", () => {
    // « Illimité » côté produit, jamais illimité côté validation.
    expect(getTierCustomInstructionsMax("max")).toBeNull();
    expect(CUSTOM_INSTRUCTIONS_HARD_CAP).toBe(100_000);
    expect(getCustomInstructionsEffectiveMax("max")).toBe(100_000);
  });

  it("expose un plafond effectif toujours borné", () => {
    for (const tier of ["free", "plus", "pro", "max", undefined]) {
      expect(typeof getCustomInstructionsEffectiveMax(tier)).toBe("number");
      expect(getCustomInstructionsEffectiveMax(tier)).toBeGreaterThan(0);
    }
  });
});

describe("buildCustomInstructionsSchema", () => {
  const text = (n: number) => "x".repeat(n);

  it("accepte la limite exacte de chaque forfait", () => {
    expect(
      buildCustomInstructionsSchema("free").safeParse(text(2000)).success
    ).toBe(true);
    expect(
      buildCustomInstructionsSchema("plus").safeParse(text(3000)).success
    ).toBe(true);
    expect(
      buildCustomInstructionsSchema("pro").safeParse(text(5000)).success
    ).toBe(true);
  });

  it("refuse d'un caractère au-delà de la limite", () => {
    expect(
      buildCustomInstructionsSchema("free").safeParse(text(2001)).success
    ).toBe(false);
    expect(
      buildCustomInstructionsSchema("pro").safeParse(text(5001)).success
    ).toBe(false);
  });

  it("laisse passer un large texte sur Pro mais pas sur Free", () => {
    const long = text(4000);
    expect(buildCustomInstructionsSchema("pro").safeParse(long).success).toBe(
      true
    );
    expect(buildCustomInstructionsSchema("free").safeParse(long).success).toBe(
      false
    );
  });

  it("accepte jusqu'au garde-fou technique sur Max, et pas au-delà", () => {
    expect(
      buildCustomInstructionsSchema("max").safeParse(text(100_000)).success
    ).toBe(true);
    expect(
      buildCustomInstructionsSchema("max").safeParse(text(100_001)).success
    ).toBe(false);
  });

  it("accepte undefined (champ absent = ne rien modifier)", () => {
    expect(
      buildCustomInstructionsSchema("free").safeParse(undefined).success
    ).toBe(true);
    expect(
      buildNullableCustomInstructionsSchema("free").safeParse(undefined).success
    ).toBe(true);
  });

  it("accepte null uniquement dans la variante nullable (PATCH)", () => {
    // `null` = effacer la valeur : comportement réservé aux routes PATCH.
    expect(
      buildNullableCustomInstructionsSchema("free").safeParse(null).success
    ).toBe(true);
    // La variante de création ne doit PAS accepter null : cela reviendrait à
    // autoriser un effacement sur un POST.
    expect(buildCustomInstructionsSchema("free").safeParse(null).success).toBe(
      false
    );
  });
});

describe("customInstructionsLimitPayload", () => {
  it("propose une mise à niveau quand le forfait est trop petit", () => {
    const payload = customInstructionsLimitPayload("free", 2500);
    expect(payload?.details.reason).toBe("plan_limit");
    expect(payload?.details.limit).toBe(2000);
    expect(payload?.details.upgradeUrl).toBeTruthy();
    expect(payload?.message).toContain("Free");
  });

  it("ne propose PAS de mise à niveau sur le garde-fou technique (Max)", () => {
    // Aucun upgrade nechangerait rien : en proposer serait trompeur.
    const payload = customInstructionsLimitPayload("max", 100_001);
    expect(payload?.details.reason).toBe("hard_cap");
    expect(payload?.details.upgradeUrl).toBeUndefined();
    expect(payload?.details.hardCap).toBe(100_000);
  });

  it("retourne null quand la longueur est acceptable", () => {
    expect(customInstructionsLimitPayload("free", 2000)).toBeNull();
    expect(customInstructionsLimitPayload("max", 100_000)).toBeNull();
  });
});

describe("libellés d'interface", () => {
  // Le séparateur de milliers est une espace fine insécable (U+202F) : le
  // compteur ne doit jamais se couper en fin de ligne dans un champ étroit.
  const NNBSP = " ";

  it("affiche le plafond produit dans le compteur", () => {
    expect(customInstructionsCounterLabel("free", 1200)).toBe(
      `1${NNBSP}200 / 2${NNBSP}000`
    );
    expect(customInstructionsCounterLabel("pro", 1200)).toBe(
      `1${NNBSP}200 / 5${NNBSP}000`
    );
  });

  it("affiche l'infini pour Max et le rappelle dans la mention", () => {
    expect(customInstructionsCounterLabel("max", 1200)).toBe(
      `1${NNBSP}200 / ∞`
    );
    expect(customInstructionsHint("max")).toContain(`100${NNBSP}000`);
  });

  it("n'affiche aucune mention d'illimité pour les forfaits plafonnés", () => {
    expect(customInstructionsHint("free")).toBe("");
    expect(customInstructionsHint("plus")).toBe("");
  });
});
