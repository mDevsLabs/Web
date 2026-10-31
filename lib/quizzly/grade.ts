/**
 * Correction déterministe d'un quiz.
 *
 * Même principe que l'outil de chat : la note est une comparaison
 * d'ensembles, pas un jugement du modèle. Une question sans réponse est
 * fausse.
 */

import { QUESTIONS_PER_QUIZ, quizReussi } from "@/lib/quizzly/rules";
import type { QuizQuestion, SubmittedAnswer } from "@/lib/quizzly/schema";

export type GradeRow = {
  correct: boolean;
  expectedIndexes: number[];
  explanation: string;
  givenIndexes: number[];
  questionId: string;
};

export type GradeOutcome = {
  correctCount: number;
  passed: boolean;
  results: GradeRow[];
  totalCount: number;
  wrongCount: number;
};

function memeEnsemble(gauche: number[], droite: number[]): boolean {
  if (gauche.length !== droite.length) {
    return false;
  }
  return gauche.every((valeur, index) => valeur === droite[index]);
}

export function corrigerQuiz(
  questions: readonly QuizQuestion[],
  reponses: readonly SubmittedAnswer[]
): GradeOutcome {
  const parQuestion = new Map<string, SubmittedAnswer>();
  for (const reponse of reponses) {
    parQuestion.set(reponse.questionId, reponse);
  }
  const results = questions.map((question) => {
    const donnee = parQuestion.get(question.id);
    const givenIndexes = [
      ...new Set(
        (donnee?.selectedIndexes ?? []).filter(
          (index) => index >= 0 && index < question.options.length
        )
      ),
    ].sort((a, b) => a - b);
    const expectedIndexes = [...question.correctAnswers].sort((a, b) => a - b);
    const correct = memeEnsemble(givenIndexes, expectedIndexes);
    return {
      correct,
      expectedIndexes,
      explanation: question.explanation,
      givenIndexes,
      questionId: question.id,
    };
  });
  const correctCount = results.filter((ligne) => ligne.correct).length;
  return {
    correctCount,
    passed: quizReussi(correctCount),
    results,
    totalCount: questions.length || QUESTIONS_PER_QUIZ,
    wrongCount: results.length - correctCount,
  };
}
