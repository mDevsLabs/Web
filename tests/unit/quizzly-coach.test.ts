import { describe, expect, it } from "vitest";
import {
  assemblerTentatives,
  type ContexteCoach,
  construireTentative,
  modeleCoachEnregistrable,
  preparerEchangeCoach,
  type QuizTente,
  resoudreModeleCoach,
  scoreRetenu,
  validerSuivi,
} from "@/lib/quizzly/coach";

const questions = [
  {
    explanation: "Le carré de 3 est 9.",
    id: "q1",
    options: ["6", "9", "12", "3"],
    question: "Combien font 3 au carré ?",
  },
  {
    explanation: "Deux droites parallèles ne se coupent pas.",
    id: "q2",
    options: [
      "elles se coupent",
      "elles sont parallèles",
      "elles sont égales",
      "elles sont sécantes",
    ],
    question: "Deux droites qui ne se rencontrent pas sont…",
  },
] as const;

function contexte(tentatives: QuizTente[]): ContexteCoach {
  return {
    passedCount: 2,
    streakCount: 3,
    tentatives,
    xp: 40,
    yearLabel: "4e",
  };
}

describe("dernière tentative Quizzly", () => {
  it("ne garde que les erreurs, et le meilleur score ne baisse pas", () => {
    const tentative = construireTentative(
      questions,
      {
        correctCount: 1,
        passed: false,
        results: [
          {
            correct: false,
            expectedIndexes: [1],
            givenIndexes: [0],
            questionId: "q1",
          },
          {
            correct: true,
            expectedIndexes: [1],
            givenIndexes: [1],
            questionId: "q2",
          },
        ],
        totalCount: 2,
      },
      new Date("2026-10-31T08:00:00.000Z")
    );
    expect(tentative.correctCount).toBe(1);
    expect(tentative.misses).toHaveLength(1);
    expect(tentative.misses[0]?.questionId).toBe("q1");
    expect(tentative.misses[0]?.question).toBe("Combien font 3 au carré ?");
    expect(tentative.misses.some((erreur) => erreur.questionId === "q2")).toBe(
      false
    );

    const retenu = scoreRetenu(
      { correctCount: 8, passed: true },
      { correctCount: tentative.correctCount, passed: tentative.passed }
    );
    expect(retenu).toEqual({ correctCount: 8, passed: true });
  });
});

describe("échange du Coach", () => {
  const tente: QuizTente = {
    answeredAt: "2026-10-31T08:00:00.000Z",
    chapterTitle: "Nombres",
    correctCount: 1,
    misses: [
      {
        expectedIndexes: [1],
        explanation: "Le carré de 3 est 9.",
        givenIndexes: [0],
        options: ["6", "9", "12", "3"],
        question: "Combien font 3 au carré ?",
        questionId: "q1",
      },
    ],
    passed: false,
    quizId: "4e/maths/01/u1/q01",
    quizTitle: "Carrés",
    subjectLabel: "Maths",
    totalCount: 2,
  };

  it("refuse une question absente des erreurs", () => {
    const autre = preparerEchangeCoach({
      contexte: contexte([tente]),
      intent: "explain",
      questionId: "q2",
      quizId: tente.quizId,
    });
    expect(autre).toEqual({ code: "unknown_question", ok: false });

    const inconnu = preparerEchangeCoach({
      contexte: contexte([tente]),
      intent: "explain",
      questionId: "q1",
      quizId: "4e/maths/01/u1/q02",
    });
    expect(inconnu).toEqual({ code: "unknown_question", ok: false });
  });

  it("ancre l'explication sur le cours et ignore une question juste", () => {
    const echange = preparerEchangeCoach({
      contexte: contexte([tente]),
      intent: "explain",
      questionId: "q1",
      quizId: tente.quizId,
    });
    expect(echange.ok).toBe(true);
    if (!echange.ok) {
      return;
    }
    expect(echange.ouverture).toContain("Le carré de 3 est 9.");
    expect(echange.ouverture).toContain("choix de l'élève");
    expect(echange.ouverture).not.toContain("Deux droites parallèles");
    expect(echange.system).toContain("4e");
  });

  it("encourage sans redonner l'explication du cours", () => {
    const echange = preparerEchangeCoach({
      contexte: contexte([tente]),
      intent: "encourage",
    });
    expect(echange.ok).toBe(true);
    if (!echange.ok) {
      return;
    }
    expect(echange.ouverture).toContain("40");
    expect(echange.ouverture).not.toContain("Le carré de 3 est 9.");
  });

  it("ne détaille que vingt erreurs dans le bilan", () => {
    const base = tente.misses[0];
    if (!base) {
      throw new Error("La fixture doit contenir une erreur.");
    }
    const tentatives = [0, 1, 2].map((quiz) => ({
      ...tente,
      misses: Array.from({ length: 10 }, (_, index) => ({
        ...base,
        explanation: `explication-${quiz}-${index}`,
        question: `Question ${quiz}-${index}`,
        questionId: `q${index + 1}`,
      })),
      quizId: `4e/maths/01/u1/q0${quiz + 1}`,
    }));
    const echange = preparerEchangeCoach({
      contexte: contexte(tentatives),
      intent: "summary",
    });
    expect(echange.ok).toBe(true);
    if (!echange.ok) {
      return;
    }
    expect(echange.ouverture).toContain("explication-0-0");
    expect(echange.ouverture).toContain("explication-1-9");
    expect(echange.ouverture).not.toContain("explication-2-0");
  });

  it("rejette un suivi qui ne vient pas de l'élève", () => {
    expect(
      validerSuivi([{ role: "assistant", text: "Voici pourquoi." }])
    ).toMatchObject({ ok: false });
    expect(
      validerSuivi([
        { role: "assistant", text: "Voici pourquoi." },
        { role: "user", text: "Je n'ai pas compris le carré." },
      ]).ok
    ).toBe(true);
  });
});

describe("modèle du Coach", () => {
  const catalogue = ["mai-2-mini", "gros-modele"];

  it("retombe sur le modèle du compte si le modèle enregistré n'est plus autorisé", () => {
    expect(
      resoudreModeleCoach({
        autorise: (id) => id !== "gros-modele",
        catalogueIds: catalogue,
        fallback: "mai-2-mini",
        preferred: "mai-2-mini",
        stored: "gros-modele",
      })
    ).toBe("mai-2-mini");
  });

  it("utilise le modèle du compte quand Quizzly n'en a pas choisi", () => {
    expect(
      resoudreModeleCoach({
        autorise: () => true,
        catalogueIds: catalogue,
        fallback: "mai-2-mini",
        preferred: "compte-modele",
        stored: null,
      })
    ).toBe("compte-modele");
  });

  it("retombe sur le repli si le modèle du compte est refusé", () => {
    expect(
      resoudreModeleCoach({
        autorise: (id) => id === "mai-2-mini",
        catalogueIds: catalogue,
        fallback: "mai-2-mini",
        preferred: "compte-modele",
        stored: null,
      })
    ).toBe("mai-2-mini");
  });

  it("n'enregistre pas un modèle hors catalogue ou hors forfait", () => {
    expect(
      modeleCoachEnregistrable({
        autorise: (id) => id !== "gros-modele",
        catalogueIds: catalogue,
        modelId: "gros-modele",
      })
    ).toBe(false);
    expect(
      modeleCoachEnregistrable({
        autorise: () => true,
        catalogueIds: catalogue,
        modelId: "inconnu",
      })
    ).toBe(false);
    expect(
      modeleCoachEnregistrable({
        autorise: () => true,
        catalogueIds: catalogue,
        modelId: "mai-2-mini",
      })
    ).toBe(true);
  });
});

describe("lecture d'une tentative illisible", () => {
  it("ignore un instantané qui n'a pas la forme attendue", () => {
    expect(
      assemblerTentatives(
        [{ lastAttempt: { misses: "non" }, quizId: "4e/maths/01/u1/q01" }],
        () => null
      )
    ).toEqual([]);
  });
});
