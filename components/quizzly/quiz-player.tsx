"use client";

import Link from "next/link";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ConfettisBonneReponse } from "@/components/quizzly/confetti";
import {
  poseDuScore,
  Quizzy,
  type QuizzyPose,
} from "@/components/quizzly/quizzy";
import { useResumeQuizzly } from "@/components/quizzly/shell";
import { FormulaireSignalement } from "@/components/quizzly/signalement";
import { PASS_CORRECT } from "@/lib/quizzly/rules";
import type { PublicQuiz } from "@/lib/quizzly/schema";
import { cn } from "@/lib/utils";

type Correction = {
  correct: boolean;
  expectedIndexes: number[];
  explanation: string;
  gameOver?: boolean;
  givenIndexes: number[];
  hearts?: number;
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

const LETTRES = ["A", "B", "C", "D"] as const;

async function poster<T>(url: string, body: unknown): Promise<T> {
  const reponse = await fetch(url, {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const corps = (await reponse.json().catch(() => null)) as
    | (T & { message?: string })
    | null;
  if (!reponse.ok) {
    throw new Error(corps?.message || "La correction a échoué.");
  }
  if (!corps) {
    throw new Error("Réponse vide.");
  }
  return corps;
}

function Rangee({
  children,
  pose,
  taille = "compact",
}: {
  children: ReactNode;
  pose: QuizzyPose;
  taille?: "compact" | "score";
}) {
  return (
    <div className="flex items-end gap-3">
      <div className="min-w-0 flex-1">{children}</div>
      <Quizzy pose={pose} taille={taille} />
    </div>
  );
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
  const [revelation, setRevelation] = useState<Correction | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const correctionsCacheRef = useRef<
    Map<string, Correction | Promise<Correction>>
  >(new Map());

  const prechargerCorrection = useCallback(
    (qId: string, selectionIndexes: number[]) => {
      if (selectionIndexes.length === 0) return;
      const cle = `${qId}:${selectionIndexes.slice().sort().join(",")}`;
      if (correctionsCacheRef.current.has(cle)) return;

      const promise = poster<Correction>(`/api/quizzly/quiz/${quizId}`, {
        phase: "reveal",
        preview: true,
        questionId: qId,
        selectedIndexes: selectionIndexes,
      })
        .then((res) => {
          correctionsCacheRef.current.set(cle, res);
          return res;
        })
        .catch(() => {
          correctionsCacheRef.current.delete(cle);
          return null;
        });

      correctionsCacheRef.current.set(cle, promise as Promise<Correction>);
    },
    [quizId]
  );

  useEffect(() => {
    if (!quiz) return;
    const qActuelle = quiz.questions[index];
    if (qActuelle && qActuelle.type === "single_choice") {
      for (let pos = 0; pos < qActuelle.options.length; pos++) {
        prechargerCorrection(qActuelle.id, [pos]);
      }
    }
    const qSuivante = quiz.questions[index + 1];
    if (qSuivante && qSuivante.type === "single_choice") {
      for (let pos = 0; pos < qSuivante.options.length; pos++) {
        prechargerCorrection(qSuivante.id, [pos]);
      }
    }
  }, [quiz, index, prechargerCorrection]);

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

  if (erreur && !quiz) {
    return (
      <section className="mx-auto max-w-lg p-6">
        <div className="surface-card flex flex-col gap-3">
          <p className="text-sm">{erreur}</p>
          <Link className="chip w-fit" href="/quizzly">
            Retour au parcours
          </Link>
        </div>
      </section>
    );
  }

  if (!quiz) {
    return (
      <section className="mx-auto max-w-lg p-6">
        <div className="surface-card flex flex-col gap-3">
          <p className="text-sm">Ce quiz est indisponible.</p>
          <Link className="chip w-fit" href="/quizzly">
            Retour au parcours
          </Link>
        </div>
      </section>
    );
  }

  if (((resume.data?.hearts ?? 0) <= 0 && !revelation && !bilan) || gameOver) {
    return (
      <section className="mx-auto max-w-xl p-6">
        <Rangee pose="hearts">
          <div className="surface-card flex flex-col gap-3">
            <h1 className="text-lg font-semibold">Plus de cœurs</h1>
            <p className="text-sm text-muted-foreground">
              Un cœur revient toutes les 30 minutes. La boutique peut aussi les
              recharger.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link className="chip w-fit" href="/quizzly/boutique">
                Ouvrir la boutique
              </Link>
              <Link className="chip w-fit" href="/quizzly">
                Retour au parcours
              </Link>
              {quiz ? (
                <Link
                  className="chip w-fit"
                  href={`/quizzly/coach?quiz=${encodeURIComponent(quiz.id)}`}
                >
                  Débriefer avec le Coach
                </Link>
              ) : null}
            </div>
          </div>
        </Rangee>
      </section>
    );
  }

  if (bilan) {
    const jours = bilan.streakCount > 1 ? "jours" : "jour";
    const fautes = bilan.results.filter((ligne) => !ligne.correct);
    return (
      <section className="mx-auto flex max-w-xl flex-col gap-4 p-6">
        <Rangee pose={poseDuScore(bilan)} taille="score">
          <div className="surface-card flex flex-col gap-3">
            <h1 className="text-lg font-semibold">
              {bilan.passed ? "Quiz validé" : "Quiz à reprendre"}
            </h1>
            <p className="text-3xl font-semibold">{bilan.correctCount}/10</p>
            <p className="text-sm">
              Série : {bilan.streakCount} {jours}
            </p>
            <p className="text-sm font-semibold text-q-xp">
              XP : +{bilan.xpAwarded}
            </p>
            <p className="text-sm text-muted-foreground">
              {bilan.streakExtended
                ? "La série avance d'un jour."
                : bilan.streakFreezeUsed
                  ? "Un gel a maintenu la série."
                  : "La série du jour est déjà comptée."}{" "}
              Il en faut {PASS_CORRECT} pour valider.
              {bilan.gemsAwarded > 0 ? (
                <span className="font-semibold text-q-gem">
                  {" "}
                  +{bilan.gemsAwarded} gemmes.
                </span>
              ) : null}
            </p>
          </div>
        </Rangee>
        {fautes.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {fautes.map((ligne) => {
              const question = quiz.questions.find(
                (entree) => entree.id === ligne.questionId
              );
              return (
                <li key={ligne.questionId}>
                  <Link
                    className="chip"
                    href={`/quizzly/coach?quiz=${encodeURIComponent(quiz.id)}&question=${encodeURIComponent(ligne.questionId)}`}
                  >
                    Expliquer : {question?.question ?? "cette erreur"}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            className="rounded-xl bg-black px-6 py-3 text-base font-bold text-white shadow-md transition-all hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
            href="/quizzly"
          >
            Parcours
          </Link>
          <Link className="chip" href="/quizzly/synthese">
            Fiches de synthèse
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
  const pose: QuizzyPose = revelation
    ? revelation.correct
      ? "good"
      : "bad"
    : "think";

  function basculer(position: number) {
    if (revelation) {
      return;
    }
    const actuel = choix[question.id] ?? [];
    const suivant =
      question.type === "single_choice"
        ? [position]
        : actuel.includes(position)
          ? actuel.filter((valeur) => valeur !== position)
          : [...actuel, position];

    setChoix((precedent) => ({ ...precedent, [question.id]: suivant }));
    if (suivant.length > 0) {
      prechargerCorrection(question.id, suivant);
    }
  }

  async function continuer() {
    if (!quiz) {
      return;
    }
    if (!revelation) {
      if (selection.length === 0) {
        return;
      }
      setErreur(null);
      const cle = `${question.id}:${selection.slice().sort().join(",")}`;
      const precharge = correctionsCacheRef.current.get(cle);

      const synchroniserReponse = async (reponseCorr: Correction) => {
        setRevelation(reponseCorr);
        if (!reponseCorr.correct) {
          const toutesReponses = quiz.questions
            .slice(0, index + 1)
            .map((entree) => ({
              questionId: entree.id,
              selectedIndexes:
                entree.id === question.id
                  ? selection
                  : (choix[entree.id] ?? []),
            }));
          try {
            const commitRes = await poster<Correction>(
              `/api/quizzly/quiz/${quizId}`,
              {
                answers: toutesReponses,
                phase: "reveal",
                questionId: question.id,
                selectedIndexes: selection,
              }
            );
            if (typeof commitRes.hearts === "number") {
              await resume.mutate();
            }
            if (
              commitRes.gameOver ||
              (commitRes.hearts !== undefined && commitRes.hearts <= 0)
            ) {
              setRevelation((actuel) =>
                actuel
                  ? {
                      ...actuel,
                      gameOver: true,
                      hearts: commitRes.hearts,
                    }
                  : actuel
              );
            }
          } catch (e) {
            console.error("Échec de synchronisation de la réponse", e);
          }
        }
      };

      if (precharge && !(precharge instanceof Promise)) {
        await synchroniserReponse(precharge);
        return;
      }

      setEnvoi(true);
      try {
        let ligne: Correction | null = null;
        if (precharge instanceof Promise) {
          ligne = await precharge;
        }
        if (ligne) {
          await synchroniserReponse(ligne);
          return;
        }
        const toutesReponses = quiz.questions
          .slice(0, index + 1)
          .map((entree) => ({
            questionId: entree.id,
            selectedIndexes:
              entree.id === question.id ? selection : (choix[entree.id] ?? []),
          }));
        const directe = await poster<Correction>(
          `/api/quizzly/quiz/${quizId}`,
          {
            answers: toutesReponses,
            phase: "reveal",
            questionId: question.id,
            selectedIndexes: selection,
          }
        );
        setRevelation(directe);
        if (typeof directe.hearts === "number") {
          await resume.mutate();
        }
      } catch (raison) {
        setErreur(
          raison instanceof Error ? raison.message : "La correction a échoué."
        );
      } finally {
        setEnvoi(false);
      }
      return;
    }
    if (
      revelation.gameOver ||
      (revelation.hearts !== undefined && revelation.hearts <= 0)
    ) {
      setGameOver(true);
      setRevelation(null);
      await resume.mutate();
      return;
    }
    if (!derniere) {
      setRevelation(null);
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
      const recu = await poster<Bilan>(`/api/quizzly/quiz/${quizId}`, {
        answers,
        phase: "finish",
      });
      setBilan(recu);
      if (recu.nextQuizId) {
        void fetch(`/api/quizzly/quiz/${recu.nextQuizId}`);
      }
      await resume.mutate();
    } catch (raison) {
      setErreur(
        raison instanceof Error ? raison.message : "La correction a échoué."
      );
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <section className="mx-auto flex max-w-xl flex-col gap-4 p-6 pb-10">
      <ConfettisBonneReponse actif={Boolean(revelation?.correct)} />
      <p className="text-xs text-muted-foreground">
        {quiz.subjectLabel} · {quiz.chapterTitle} · {quiz.unitTitle}
      </p>
      <h1 className="text-base font-semibold">{quiz.title}</h1>
      <p className="text-xs text-muted-foreground">
        Question {index + 1} / {quiz.questions.length}
        {question.type === "multiple_choice" ? " · plusieurs réponses" : ""}
      </p>
      <div
        aria-hidden
        className="h-1.5 overflow-hidden rounded-full bg-q-level/15"
      >
        <div
          className="h-full rounded-full bg-q-level"
          style={{
            width: `${((index + 1) / quiz.questions.length) * 100}%`,
          }}
        />
      </div>
      <Rangee pose={pose}>
        <div
          className={cn(
            "surface-card flex flex-col gap-3",
            revelation?.correct && "bg-success/10 ring-1 ring-success/40",
            revelation &&
              !revelation.correct &&
              "bg-destructive/10 ring-1 ring-destructive/40",
            revelation && "motion-safe:quizzy-pop"
          )}
          key={`${question.id}-${revelation ? "vu" : "choix"}`}
        >
          <p className="text-sm font-medium">{question.question}</p>
          <div className="flex flex-col gap-2">
            {question.options.map((option, position) => {
              const actif = selection.includes(position);
              const attendue = revelation?.expectedIndexes.includes(position);
              const donnee = revelation?.givenIndexes.includes(position);
              return (
                <button
                  className={cn(
                    "flex items-start gap-2 rounded-xl border px-3 py-2 text-left text-sm",
                    !revelation &&
                      actif &&
                      "border-foreground bg-foreground text-background",
                    !revelation && !actif && "border-border",
                    attendue && "border-success bg-success/10",
                    donnee &&
                      !attendue &&
                      "border-destructive bg-destructive/10"
                  )}
                  disabled={Boolean(revelation)}
                  key={option}
                  onClick={() => basculer(position)}
                  type="button"
                >
                  <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-current text-xs font-semibold">
                    {LETTRES[position] ?? position + 1}
                  </span>
                  <span>{option}</span>
                </button>
              );
            })}
          </div>
          {revelation ? (
            <p className="surface-muted px-3 py-2 text-sm">
              {revelation.explanation}
            </p>
          ) : null}
        </div>
      </Rangee>
      {erreur ? <p className="text-sm text-destructive">{erreur}</p> : null}
      <FormulaireSignalement
        questionId={question.id}
        questionNumber={index + 1}
        quizId={quiz.id}
        subjectLabel={quiz.subjectLabel}
      />
      <button
        className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:opacity-40"
        disabled={(!revelation && selection.length === 0) || envoi}
        onClick={() => {
          void continuer();
        }}
        type="button"
      >
        {envoi
          ? "Correction…"
          : revelation?.gameOver
            ? "Terminer (plus de cœurs)"
            : "Continuer"}
      </button>
    </section>
  );
}
