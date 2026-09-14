import { describe, expect, it } from "vitest";
import {
  ASK_USER_MAX_QUESTIONS,
  type AskUserQuestion,
  askUserQuestionSchema,
  askUserRequestSchema,
  userInputSubmissionSchema,
  validateUserInputAnswers,
} from "@/lib/agent/contracts";

// Le questionnaire Agent est un CONTRAT : le serveur refuse une structure
// incohérente au lieu de la deviner ou de la corriger. Ces tests verrouillent
// les refus — un identifiant dupliqué, une question à choix sans choix, un
// curseur sans bornes, un questionnaire entièrement facultatif — et la
// validation des réponses contre les questions persistées.

function question(overrides: Partial<AskUserQuestion> = {}): AskUserQuestion {
  return {
    allowCustomInput: false,
    id: "format",
    options: ["PDF", "Markdown"],
    question: "Quel format souhaitez-vous ?",
    required: true,
    type: "single_choice",
    ...overrides,
  } as AskUserQuestion;
}

function questionnaire(questions: AskUserQuestion[]) {
  return { questions, title: "Précisions" };
}

describe("Contrat ask_user — structure du questionnaire", () => {
  it("accepte un questionnaire cohérent", () => {
    const result = askUserRequestSchema.safeParse(
      questionnaire([
        question(),
        question({
          id: "budget",
          max: 100,
          min: 0,
          options: undefined,
          type: "slider",
        }),
      ])
    );
    expect(result.success).toBe(true);
  });

  it("refuse deux questions portant le même identifiant", () => {
    const result = askUserRequestSchema.safeParse(
      questionnaire([question(), question()])
    );
    expect(result.success).toBe(false);
  });

  it("refuse une question à choix sans options", () => {
    const result = askUserQuestionSchema.safeParse(
      question({ options: undefined })
    );
    expect(result.success).toBe(false);
  });

  it("refuse des options dupliquées (comparaison insensible à la casse)", () => {
    const result = askUserQuestionSchema.safeParse(
      question({ options: ["PDF", "pdf"] })
    );
    expect(result.success).toBe(false);
  });

  it("refuse des options pour un type qui n'en accepte pas", () => {
    const result = askUserQuestionSchema.safeParse(
      question({ options: ["a", "b"], type: "text" })
    );
    expect(result.success).toBe(false);
  });

  it("refuse la saisie libre sur un type qui n'est pas à choix", () => {
    const result = askUserQuestionSchema.safeParse(
      question({ allowCustomInput: true, options: undefined, type: "text" })
    );
    expect(result.success).toBe(false);
  });

  it("refuse un curseur sans bornes ou avec des bornes incohérentes", () => {
    expect(
      askUserQuestionSchema.safeParse(
        question({ options: undefined, type: "slider" })
      ).success
    ).toBe(false);
    expect(
      askUserQuestionSchema.safeParse(
        question({ max: 10, min: 10, options: undefined, type: "slider" })
      ).success
    ).toBe(false);
  });

  it("refuse un questionnaire entièrement facultatif", () => {
    const result = askUserRequestSchema.safeParse(
      questionnaire([question({ required: false })])
    );
    expect(result.success).toBe(false);
  });

  it("refuse un questionnaire trop long", () => {
    const questions = Array.from(
      { length: ASK_USER_MAX_QUESTIONS + 1 },
      (_, index) => question({ id: `q${index}` })
    );
    expect(
      askUserRequestSchema.safeParse(questionnaire(questions)).success
    ).toBe(false);
  });

  it("refuse une valeur par défaut étrangère aux choix proposés", () => {
    const result = askUserQuestionSchema.safeParse(
      question({ defaultValue: "DOCX" })
    );
    expect(result.success).toBe(false);
  });

  it("refuse une valeur par défaut du mauvais type", () => {
    const result = askUserQuestionSchema.safeParse(
      question({ defaultValue: "oui", options: undefined, type: "boolean" })
    );
    expect(result.success).toBe(false);
  });

  it("refuse un identifiant de question non exploitable comme clé stable", () => {
    expect(
      askUserQuestionSchema.safeParse(question({ id: "1 budget" })).success
    ).toBe(false);
  });
});

describe("Contrat ask_user — soumission de la réponse", () => {
  const requestId = "6f1a5b0e-1d4f-4f04-9a5c-7a0c4f5f9c11";

  it("accepte une soumission bien formée", () => {
    const result = userInputSubmissionSchema.safeParse({
      answers: [{ questionId: "format", value: "PDF" }],
      requestId,
      revision: 0,
    });
    expect(result.success).toBe(true);
  });

  it("refuse une soumission sans identifiant de question persistée", () => {
    expect(
      userInputSubmissionSchema.safeParse({
        answers: [{ questionId: "format", value: "PDF" }],
        revision: 0,
      }).success
    ).toBe(false);
  });

  it("refuse une révision non entière ou négative", () => {
    expect(
      userInputSubmissionSchema.safeParse({
        answers: [{ questionId: "format", value: "PDF" }],
        requestId,
        revision: -1,
      }).success
    ).toBe(false);
  });

  it("refuse une soumission vide", () => {
    expect(
      userInputSubmissionSchema.safeParse({
        answers: [],
        requestId,
        revision: 0,
      }).success
    ).toBe(false);
  });
});

describe("Validation des réponses contre les questions persistées", () => {
  const optionalSources = question({
    id: "sources",
    options: ["Agence", "Presse"],
    required: false,
    type: "multiple_choice",
  });
  const customDelay = question({
    allowCustomInput: true,
    id: "delai",
    options: ["1 jour", "1 semaine"],
    type: "single_choice",
  });
  const slider = question({
    id: "pages",
    max: 20,
    min: 1,
    options: undefined,
    type: "slider",
  });
  const freeText = question({ id: "long", options: undefined, type: "text" });

  const questions = [
    question(),
    optionalSources,
    customDelay,
    slider,
    freeText,
  ];

  it("accepte une réponse de chaque type prévu", () => {
    const result = validateUserInputAnswers({
      answers: [
        { questionId: "format", value: "PDF" },
        { questionId: "sources", value: ["Agence"] },
        { questionId: "delai", value: "2 jours" },
        { questionId: "pages", value: 12 },
        { questionId: "long", value: "note" },
      ],
      questions,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.answers).toHaveLength(5);
    }
  });

  it("refuse une réponse portant sur une question inconnue", () => {
    const result = validateUserInputAnswers({
      answers: [{ questionId: "inconnue", value: "x" }],
      questions,
    });
    expect(result).toMatchObject({ ok: false, reason: "unknown_question" });
  });

  it("refuse deux réponses pour la même question", () => {
    const result = validateUserInputAnswers({
      answers: [
        { questionId: "format", value: "PDF" },
        { questionId: "format", value: "Markdown" },
      ],
      questions,
    });
    expect(result).toMatchObject({ ok: false, reason: "duplicate_answer" });
  });

  it("refuse l'absence de réponse à une question obligatoire", () => {
    const result = validateUserInputAnswers({
      answers: [{ questionId: "long", value: "note" }],
      questions,
    });
    expect(result).toMatchObject({ ok: false, reason: "missing_required" });
  });

  it("refuse une valeur qui ne correspond pas au type attendu", () => {
    const result = validateUserInputAnswers({
      answers: [{ questionId: "format", value: 3 }],
      questions,
    });
    expect(result).toMatchObject({ ok: false, reason: "invalid_type" });
  });

  it("refuse une valeur absente des choix lorsque la saisie libre est fermée", () => {
    const result = validateUserInputAnswers({
      answers: [{ questionId: "format", value: "DOCX" }],
      questions,
    });
    expect(result).toMatchObject({ ok: false, reason: "not_in_options" });
  });

  it("accepte une saisie libre sur une question qui l'autorise", () => {
    const result = validateUserInputAnswers({
      answers: [{ questionId: "delai", value: "3 semaines" }],
      questions: [customDelay],
    });
    expect(result.ok).toBe(true);
  });

  it("refuse une valeur de curseur hors bornes", () => {
    const result = validateUserInputAnswers({
      answers: [{ questionId: "pages", value: 500 }],
      questions,
    });
    expect(result).toMatchObject({ ok: false, reason: "out_of_range" });
  });

  it("refuse un texte trop long", () => {
    const result = validateUserInputAnswers({
      answers: [{ questionId: "long", value: "a".repeat(400) }],
      questions: [freeText],
    });
    expect(result).toMatchObject({ ok: false, reason: "too_long" });
  });

  it("ignore une question facultative laissée vide sans l'inventer", () => {
    const result = validateUserInputAnswers({
      answers: [
        { questionId: "format", value: "PDF" },
        { questionId: "sources", value: "" },
      ],
      questions: [question(), optionalSources],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.answers.map((answer) => answer.questionId)).toEqual([
        "format",
      ]);
    }
  });
});
