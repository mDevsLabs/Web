"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { poseDuScore, Quizzy } from "@/components/quizzly/quizzy";
import { useResumeQuizzly } from "@/components/quizzly/shell";
import { FormulaireSignalement } from "@/components/quizzly/signalement";
import { PASS_CORRECT } from "@/lib/quizzly/rules";
import type { PublicQuiz } from "@/lib/quizzly/schema";
import { cn } from "@/lib/utils";

type Correction = {
  correct: boolean;
  expectedIndexes: number[];
  explanation: string;
  givenIndexes: number[];
  questionId: string;
};

type Bilan = {
  correctCount: number;
  gemsAwarded: number;
  hearts: number;
  nextQuizId: string | null;
  passed: boolean;
  results: Correction[];
  streakCount: number;
  streakExtended?: boolean;
  streakFreezeUsed?: boolean;
  totalCount: number;
  xpAwarded: number;
};

async function envoyer(url: string, body: unknown): Promise<Bilan> {
  const reponse = await fetch(url, {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const corps = (await reponse.json().catch(() => null)) as
    | (Bilan & { message?: string })
    | null;
  if (!reponse.ok) {
    throw new Error(corps?.message || "La correction a échoué.");
  }
  if (!corps) {
    throw new Error("Réponse vide.");
  }
  return corps;
}

export function QuizPlayer({ quizId }: { quizId: string }) {
  const resume = useResumeQuizzly();
  const [quiz, setQuiz] = useState<PublicQuiz | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [choix, setChoix] = useState<Record<string, number[]>>({});
  const [envoi, setEnvoi] = useState(false);
  const [bilan, setBilan] = useState<Bilan | null>(null);
  const [revue, setRevue] = useState(0);

  useEffect(() => {
    let ignore = false;
    fetch(`/api/quizzly/quiz/${quizId}`)
      .then(async (reponse) => {
        const corps = (await reponse.json().catch(() => null)) as
          | (PublicQuiz & { message?: string })
          | null;
        if (!reponse.ok) {
          throw new Error(corps?.message || "Ce quiz est indisponible.");
        }
        if (!ignore && corps) {
          setQuiz(corps);
        }
      })
      .catch((raison: unknown) => {
        if (!ignore) {
          setErreur(
            raison instanceof Error
              ? raison.message
              : "Ce quiz est indisponible."
          );
        }
      })
      .finally(() => {
        if (!ignore) {
          setChargement(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [quizId]);

  if (chargement || resume.isLoading) {
    return (
      <p className="p-8 text-sm text-muted-foreground">Chargement du quiz…</p>
    );
  }

  if (erreur || !quiz) {
    return (
      <section className="mx-auto max-w-lg p-6">
        <div className="surface-card flex flex-col gap-3">
          <p className="text-sm">{erreur || "Ce quiz est indisponible."}</p>
          <Link className="chip w-fit" href="/quizzly">
            Retour au parcours
          </Link>
        </div>
      </section>
    );
  }

  if ((resume.data?.hearts ?? 0) <= 0 && !bilan) {
    return (
      <section className="mx-auto max-w-lg p-6">
        <div className="surface-card relative flex flex-col gap-3 pb-16">
          <h1 className="text-lg font-semibold">Plus de cœurs</h1>
          <p className="text-sm text-muted-foreground">
            Un cœur revient toutes les 30 minutes. La boutique peut aussi les
            recharger.
          </p>
          <Link className="chip relative z-10 w-fit" href="/quizzly/boutique">
            Ouvrir la boutique
          </Link>
          <Quizzy plan="avant" pose="hearts" />
        </div>
      </section>
    );
  }

  if (bilan) {
    const ligne = bilan.results[revue];
    if (ligne && revue < bilan.results.length) {
      const question = quiz.questions.find(
        (entree) => entree.id === ligne.questionId
      );
      return (
        <section className="mx-auto flex max-w-lg flex-col gap-4 p-6 pb-10">
          <p className="text-xs text-muted-foreground">
            Correction {revue + 1} / {bilan.results.length}
          </p>
          <div
            className={cn(
              "surface-card relative flex flex-col gap-3 pb-16",
              ligne.correct
                ? "ring-1 ring-success/40"
                : "ring-1 ring-destructive/40"
            )}
          >
            <p className="text-sm font-medium">{question?.question}</p>
            <ul className="flex flex-col gap-2">
              {question?.options.map((option, position) => {
                const attendue = ligne.expectedIndexes.includes(position);
                const donnee = ligne.givenIndexes.includes(position);
                return (
                  <li
                    className={cn(
                      "rounded-xl border px-3 py-2 text-sm",
                      attendue && "border-success bg-success/10",
                      donnee &&
                        !attendue &&
                        "border-destructive bg-destructive/10"
                    )}
                    key={option}
                  >
                    {option}
                  </li>
                );
              })}
            </ul>
            <p className="text-sm text-muted-foreground">{ligne.explanation}</p>
            <Quizzy plan="avant" pose={ligne.correct ? "good" : "bad"} />
          </div>
          <FormulaireSignalement
            questionId={ligne.questionId}
            questionNumber={revue + 1}
            quizId={quiz.id}
            subjectLabel={quiz.subjectLabel}
          />
          {ligne.correct ? null : (
            <Link
              className="chip w-fit"
              href={`/quizzly/coach?quiz=${encodeURIComponent(quiz.id)}&question=${encodeURIComponent(ligne.questionId)}`}
            >
              Expliquer mon erreur
            </Link>
          )}
          <button
            className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background"
            onClick={() => setRevue((valeur) => valeur + 1)}
            type="button"
          >
            {revue + 1 === bilan.results.length ? "Voir le score" : "Continuer"}
          </button>
        </section>
      );
    }
    return (
      <section className="relative mx-auto flex max-w-lg flex-col gap-4 p-6 pt-24">
        <div className="pointer-events-none absolute inset-x-0 top-2 z-0 flex justify-center">
          <Quizzy plan="arriere" pose={poseDuScore(bilan)} />
        </div>
        <div className="surface-card relative z-10 flex flex-col gap-2">
          <h1 className="text-lg font-semibold">
            {bilan.passed ? "Quiz validé" : "Quiz à reprendre"}
          </h1>
          <p className="text-sm">
            {bilan.correctCount} / {bilan.totalCount} bonnes réponses. Il en
            faut {PASS_CORRECT} pour valider.
          </p>
          <p className="text-sm text-muted-foreground">
            +{bilan.xpAwarded} XP · +{bilan.gemsAwarded} gemmes · série{" "}
            {bilan.streakCount}
          </p>
        </div>
        <div className="relative z-10 flex flex-wrap gap-2">
          <Link className="chip" href="/quizzly">
            Parcours
          </Link>
          {bilan.nextQuizId ? (
            <Link
              className="chip"
              data-active="true"
              href={`/quizzly/quiz/${bilan.nextQuizId}`}
            >
              Quiz suivant
            </Link>
          ) : null}
        </div>
      </section>
    );
  }

  const question = quiz.questions[index];
  if (!question) {
    return null;
  }
  const selection = choix[question.id] ?? [];
  const derniere = index === quiz.questions.length - 1;

  function basculer(position: number) {
    setChoix((precedent) => {
      const actuel = precedent[question.id] ?? [];
      const suivant =
        question.type === "single_choice"
          ? [position]
          : actuel.includes(position)
            ? actuel.filter((valeur) => valeur !== position)
            : [...actuel, position];
      return { ...precedent, [question.id]: suivant };
    });
  }

  async function continuer() {
    if (!quiz || selection.length === 0) {
      return;
    }
    if (!derniere) {
      setIndex((valeur) => valeur + 1);
      return;
    }
    setEnvoi(true);
    setErreur(null);
    try {
      const answers = quiz.questions.map((entree) => ({
        questionId: entree.id,
        selectedIndexes: choix[entree.id] ?? [],
      }));
      const recu = await envoyer(`/api/quizzly/quiz/${quizId}`, { answers });
      setBilan(recu);
      setRevue(0);
      await resume.mutate();
    } catch (raison) {
      setErreur(
        raison instanceof Error ? raison.message : "La correction a échoué."
      );
    } finally {
      setEnvoi(false);
    }
  }

  let libelleBouton = "Continuer";
  if (envoi) {
    libelleBouton = "Correction…";
  } else if (derniere) {
    libelleBouton = "Corriger";
  }

  return (
    <section className="mx-auto flex max-w-lg flex-col gap-4 p-6 pb-10">
      <p className="text-xs text-muted-foreground">
        {quiz.subjectLabel} · {quiz.chapterTitle} · {quiz.unitTitle}
      </p>
      <h1 className="text-base font-semibold">{quiz.title}</h1>
      <p className="text-xs text-muted-foreground">
        Question {index + 1} / {quiz.questions.length}
        {question.type === "multiple_choice" ? " · plusieurs réponses" : ""}
      </p>
      <div className="surface-card relative flex flex-col gap-3 pb-16">
        <p className="text-sm font-medium">{question.question}</p>
        <div className="flex flex-col gap-2">
          {question.options.map((option, position) => {
            const actif = selection.includes(position);
            return (
              <button
                className={cn(
                  "rounded-xl border px-3 py-2 text-left text-sm",
                  actif
                    ? "border-foreground bg-foreground text-background"
                    : "border-border"
                )}
                key={option}
                onClick={() => basculer(position)}
                type="button"
              >
                {option}
              </button>
            );
          })}
        </div>
        <Quizzy plan="avant" pose="think" />
      </div>
      {erreur ? <p className="text-sm text-destructive">{erreur}</p> : null}
      <FormulaireSignalement
        questionId={question.id}
        questionNumber={index + 1}
        quizId={quiz.id}
        subjectLabel={quiz.subjectLabel}
      />
      <button
        className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:opacity-40"
        disabled={selection.length === 0 || envoi}
        onClick={continuer}
        type="button"
      >
        {libelleBouton}
      </button>
    </section>
  );
}
