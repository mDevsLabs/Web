import { describe, expect, it } from "vitest";
import type { FormQuestion } from "@/lib/forms/types";
import {
  FORM_ANSWER_TEXT_MAX,
  validateFormAnswers,
} from "@/lib/forms/validation";

const questions: FormQuestion[] = [
  { id: "q1", required: true, title: "Avis", type: "text" },
  {
    id: "q2",
    options: ["oui", "non"],
    required: true,
    title: "Recommandation",
    type: "single_choice",
  },
  {
    id: "q3",
    options: ["a", "b", "c"],
    title: "Thèmes",
    type: "multi_choice",
  },
  { id: "q4", title: "Note", type: "rating" },
];

describe("Validation serveur des réponses de formulaire", () => {
  it("refuse answers: {} quand une question est requise", () => {
    const result = validateFormAnswers(questions, {});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("obligatoire");
    }
  });

  it("accepte answers: {} pour un formulaire sans question requise", () => {
    const optional: FormQuestion[] = [
      { id: "q1", title: "Commentaire", type: "text" },
      { id: "q2", options: ["a"], title: "Choix", type: "single_choice" },
    ];
    expect(validateFormAnswers(optional, {})).toEqual({
      ok: true,
      value: {},
    });
  });

  it("refuse une réponse requise vide, blanche ou nulle", () => {
    expect(validateFormAnswers(questions, { q1: "   ", q2: "oui" }).ok).toBe(
      false
    );
    expect(validateFormAnswers(questions, { q1: null, q2: "oui" }).ok).toBe(
      false
    );
    expect(validateFormAnswers(questions, { q1: "ok", q2: "" }).ok).toBe(false);
  });

  it("refuse un mauvais type de valeur", () => {
    expect(validateFormAnswers(questions, { q1: 42, q2: "oui" }).ok).toBe(
      false
    );
    expect(
      validateFormAnswers(questions, {
        q1: "ok",
        q2: "oui",
        q3: "a",
      }).ok
    ).toBe(false);
    expect(
      validateFormAnswers(questions, {
        q1: "ok",
        q2: "oui",
        q4: "5",
      }).ok
    ).toBe(false);
  });

  it("refuse un choix inexistant et déduplique les choix valides", () => {
    expect(
      validateFormAnswers(questions, {
        q1: "ok",
        q2: "peut-être",
      }).ok
    ).toBe(false);
    expect(
      validateFormAnswers(questions, {
        q1: "ok",
        q2: "oui",
        q3: ["a", "a", "b"],
      })
    ).toEqual({
      ok: true,
      value: { q1: "ok", q2: "oui", q3: ["a", "b"] },
    });
  });

  it("borne les notes entre 1 et 5 (entier)", () => {
    for (const invalid of [0, 6, 2.5, -1, 99]) {
      expect(
        validateFormAnswers(questions, {
          q1: "ok",
          q2: "oui",
          q4: invalid,
        }).ok,
        String(invalid)
      ).toBe(false);
    }
    expect(
      validateFormAnswers(questions, { q1: "ok", q2: "oui", q4: 4 })
    ).toMatchObject({ ok: true });
  });

  it("refuse une question inconnue", () => {
    expect(
      validateFormAnswers(questions, {
        pirate: "valeur",
        q1: "ok",
        q2: "oui",
      })
    ).toEqual({
      error: "Réponse fournie pour une question inconnue (pirate).",
      ok: false,
    });
  });

  it("borne la taille d'un texte", () => {
    expect(
      validateFormAnswers(questions, {
        q1: "x".repeat(FORM_ANSWER_TEXT_MAX + 1),
        q2: "oui",
      }).ok
    ).toBe(false);
  });

  it("accepte une réponse complète et normalise les champs optionnels", () => {
    expect(
      validateFormAnswers(questions, {
        q1: "Très utile",
        q2: "oui",
        q3: ["c", "a"],
        q4: 5,
      })
    ).toEqual({
      ok: true,
      value: {
        q1: "Très utile",
        q2: "oui",
        q3: ["c", "a"],
        q4: 5,
      },
    });
  });
});
