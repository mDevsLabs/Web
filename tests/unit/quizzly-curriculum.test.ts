import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { corrigerQuiz } from "@/lib/quizzly/grade";
import { cheminsChapitresAttendus } from "@/lib/quizzly/program";
import {
  chapterSchema,
  type QuizQuestion,
  versQuizPublic,
} from "@/lib/quizzly/schema";

function question(index: number, multiple: boolean): QuizQuestion {
  return {
    correctAnswers: multiple ? [0, 1] : [0],
    explanation: `Explication ${index}.`,
    id: `q${index}`,
    options: ["A", "B", "C", "D"],
    question: `Question ${index} ?`,
    type: multiple ? "multiple_choice" : "single_choice",
  };
}

function chapitreValide() {
  const quizzes = Array.from({ length: 10 }, (_, indexQuiz) => ({
    id: `q${String(indexQuiz + 1).padStart(2, "0")}`,
    questions: Array.from({ length: 10 }, (_, indexQuestion) =>
      question(indexQuestion + 1, indexQuestion === 0)
    ),
    title: `Quiz ${indexQuiz + 1}`,
  }));
  return {
    id: "6e-francais-01",
    order: 1 as const,
    subject: "francais",
    title: "Le récit",
    units: [
      { id: "u1" as const, order: 1 as const, quizzes, title: "Unité 1" },
      {
        id: "u2" as const,
        order: 2 as const,
        quizzes: quizzes.map((quiz) => ({ ...quiz })),
        title: "Unité 2",
      },
    ],
    year: "6e" as const,
  };
}

describe("schéma d'un chapitre", () => {
  it("accepte 2 unités de 10 quiz de 10 questions", () => {
    expect(chapterSchema.safeParse(chapitreValide()).success).toBe(true);
  });

  it("refuse un quiz incomplet", () => {
    const chapitre = chapitreValide();
    chapitre.units[0].quizzes[0].questions.pop();
    expect(chapterSchema.safeParse(chapitre).success).toBe(false);
  });
});

describe("correction", () => {
  it("retire les bonnes réponses du quiz public et les rend après comparaison", () => {
    const questions = [question(1, false), question(2, true)];
    const publicQuiz = versQuizPublic({
      chapterTitle: "Chapitre",
      id: "6e/francais/01/u1/q01",
      questions,
      subjectLabel: "Français",
      title: "Quiz",
      unitTitle: "Unité",
    });
    expect(JSON.stringify(publicQuiz)).not.toContain("correctAnswers");
    expect(JSON.stringify(publicQuiz)).not.toContain("explanation");

    const note = corrigerQuiz(questions, [
      { questionId: "q1", selectedIndexes: [0] },
      { questionId: "q2", selectedIndexes: [0] },
    ]);
    expect(note.correctCount).toBe(1);
    expect(note.passed).toBe(false);
    expect(note.results[1]?.expectedIndexes).toEqual([0, 1]);
  });
});

describe("fichiers du programme", () => {
  it("valide les chapitres de référence du programme", () => {
    const racine = path.join(process.cwd(), "lib", "quizzly", "curriculum");
    const references = [
      "6e/francais/01.json",
      "6e/francais/02.json",
      "6e/francais/03.json",
    ];
    for (const relatif of references) {
      const complet = path.join(racine, relatif);
      expect(existsSync(complet)).toBe(true);
      const json = JSON.parse(readFileSync(complet, "utf8")) as unknown;
      const parsed = chapterSchema.safeParse(json);
      if (!parsed.success) {
        throw new Error(
          `${relatif} : ${parsed.error.issues
            .slice(0, 3)
            .map((issue) => `${issue.path.join(".")} ${issue.message}`)
            .join(" ; ")}`
        );
      }
      const [annee, matiere, fichier] = relatif.replace(".json", "").split("/");
      expect(parsed.data.year).toBe(annee);
      expect(parsed.data.subject).toBe(matiere);
      expect(parsed.data.order).toBe(Number(fichier));
    }
  });
});
