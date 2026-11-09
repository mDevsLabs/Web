"use client";

import {
  ArrowLeftIcon,
  CheckIcon,
  FlameIcon,
  HeartIcon,
  Volume2Icon,
  VolumeXIcon,
  XIcon,
  ZapIcon,
} from "@mdevs/icons";
import { AnimatePresence, motion } from "framer-motion";
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
import {
  isSoundEnabled,
  playClickSound,
  playCorrectSound,
  playFanfareSound,
  playIncorrectSound,
  setSoundEnabled,
} from "@/lib/quizzly/sound-effects";
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
    <div className="flex items-end gap-4">
      <div className="min-w-0 flex-1">{children}</div>
      <div className="shrink-0 drop-shadow-md">
        <Quizzy pose={pose} taille={taille} />
      </div>
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
  const [sonActif, setSonActif] = useState(true);

  const correctionsCacheRef = useRef<
    Map<string, Correction | Promise<Correction>>
  >(new Map());

  useEffect(() => {
    setSonActif(isSoundEnabled());
  }, []);

  function basculerSon() {
    const nouveau = !sonActif;
    setSonActif(nouveau);
    setSoundEnabled(nouveau);
  }

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
      <div className="flex h-64 items-center justify-center p-8 text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <div className="size-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span>Chargement du quiz…</span>
        </div>
      </div>
    );
  }

  if (erreur && !quiz) {
    return (
      <section className="mx-auto max-w-lg p-6">
        <div className="surface-quizzly-card flex flex-col items-center gap-3 text-center">
          <p className="text-sm font-semibold text-destructive">{erreur}</p>
          <Link
            className="rounded-full bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-500"
            href="/quizzly/apprentissage"
          >
            Retour au parcours
          </Link>
        </div>
      </section>
    );
  }

  if (!quiz) {
    return (
      <section className="mx-auto max-w-lg p-6">
        <div className="surface-quizzly-card flex flex-col items-center gap-3 text-center">
          <p className="text-sm">Ce quiz est indisponible.</p>
          <Link
            className="rounded-full bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-500"
            href="/quizzly/apprentissage"
          >
            Retour au parcours
          </Link>
        </div>
      </section>
    );
  }

  // Écran plus de cœurs
  if (((resume.data?.hearts ?? 0) <= 0 && !revelation && !bilan) || gameOver) {
    return (
      <section className="mx-auto max-w-xl p-6">
        <Rangee pose="hearts">
          <div className="surface-quizzly-card flex flex-col gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-950/50">
                <HeartIcon className="size-5 fill-rose-500" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Plus de cœurs disponibles
              </h1>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Un cœur revient toutes les 30 minutes. Vous pouvez également
              recharger vos cœurs dans la boutique avec vos gemmes.
            </p>
            <div className="flex flex-wrap gap-2.5 pt-2">
              <Link
                className="rounded-full bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-500"
                href="/quizzly/boutique"
              >
                Ouvrir la boutique
              </Link>
              <Link
                className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                href="/quizzly/apprentissage"
              >
                Retour au parcours
              </Link>
              {quiz && (
                <Link
                  className="rounded-full border border-blue-200 bg-blue-50 px-5 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300"
                  href={`/quizzly/coach?quiz=${encodeURIComponent(quiz.id)}`}
                >
                  Débriefer avec le Coach mAI
                </Link>
              )}
            </div>
          </div>
        </Rangee>
      </section>
    );
  }

  // Écran bilan du quiz terminé
  if (bilan) {
    const jours = bilan.streakCount > 1 ? "jours" : "jour";
    const fautes = bilan.results.filter((ligne) => !ligne.correct);

    return (
      <section className="mx-auto flex max-w-xl flex-col gap-6 p-6 pb-12">
        <ConfettisBonneReponse actif={bilan.passed} />

        <Rangee pose={poseDuScore(bilan)} taille="score">
          <div className="surface-quizzly-card relative overflow-hidden flex flex-col gap-5 p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide",
                  bilan.passed
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                )}
              >
                {bilan.passed ? "Quiz Validé ! 🎉" : "À reprendre"}
              </span>

              <div className="flex items-center gap-1.5 text-sm font-bold text-amber-500">
                <ZapIcon className="size-4" />
                <span>+{bilan.xpAwarded} XP</span>
              </div>
            </div>

            {/* Gros score circulaire */}
            <div className="flex flex-col items-center justify-center py-2 text-center">
              <div className="text-5xl font-black text-slate-900 dark:text-white">
                {bilan.correctCount}
                <span className="text-2xl font-bold text-slate-400">/10</span>
              </div>
              <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {bilan.passed
                  ? "Bravo ! Vous avez franchi le palier de validation."
                  : `Il faut au moins ${PASS_CORRECT} bonnes réponses pour valider.`}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-3 text-center dark:bg-slate-800/60">
              <div className="flex flex-col items-center">
                <span className="text-[11px] font-semibold text-slate-400">
                  Série
                </span>
                <span className="flex items-center gap-1 text-sm font-bold text-orange-500">
                  <FlameIcon className="size-4" />
                  {bilan.streakCount} {jours}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[11px] font-semibold text-slate-400">
                  Gemmes
                </span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  +{bilan.gemsAwarded} 💎
                </span>
              </div>
            </div>

            {fautes.length > 0 && (
              <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                <span className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Erreurs à revoir :
                </span>
                <ul className="flex flex-col gap-2">
                  {fautes.map((ligne) => {
                    const question = quiz.questions.find(
                      (entree) => entree.id === ligne.questionId
                    );
                    return (
                      <li key={ligne.questionId}>
                        <Link
                          className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
                          href={`/quizzly/coach?quiz=${encodeURIComponent(quiz.id)}&question=${encodeURIComponent(ligne.questionId)}`}
                        >
                          <span className="truncate">
                            {question?.question ?? "Cette question"}
                          </span>
                          <span className="ml-2 shrink-0 font-bold text-blue-600 dark:text-blue-400">
                            &gt;
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {bilan.nextQuizId && (
                <Link
                  className="flex-1 rounded-full bg-blue-600 px-6 py-3 text-center text-sm font-bold text-white shadow-md shadow-blue-500/25 hover:bg-blue-500 active:scale-95"
                  href={`/quizzly/quiz/${bilan.nextQuizId}`}
                >
                  Quiz suivant &gt;
                </Link>
              )}
              <Link
                className="flex-1 rounded-full border border-slate-200 bg-white px-5 py-3 text-center text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                href="/quizzly/apprentissage"
              >
                Parcours
              </Link>
              <Link
                className="rounded-full border border-blue-200 bg-blue-50 px-4 py-3 text-center text-xs font-bold text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300"
                href="/quizzly/synthese"
              >
                Fiches
              </Link>
            </div>
          </div>
        </Rangee>
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
    if (revelation) return;
    playClickSound();

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
    if (!quiz) return;

    if (!revelation) {
      if (selection.length === 0) return;
      setErreur(null);
      const cle = `${question.id}:${selection.slice().sort().join(",")}`;
      const precharge = correctionsCacheRef.current.get(cle);

      const synchroniserReponse = async (reponseCorr: Correction) => {
        setRevelation(reponseCorr);
        if (reponseCorr.correct) {
          playCorrectSound();
        } else {
          playIncorrectSound();
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
        await synchroniserReponse(directe);
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
      if (recu.passed) {
        playFanfareSound();
      }
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
    <section className="mx-auto flex max-w-xl flex-col gap-5 p-4 sm:p-6 pb-12">
      <ConfettisBonneReponse actif={Boolean(revelation?.correct)} />

      {/* Barre supérieure avec retour, titre, jauge et toggle son */}
      <div className="flex items-center justify-between gap-3">
        <Link
          className="flex size-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          href="/quizzly/apprentissage"
          title="Retourner au parcours"
        >
          <ArrowLeftIcon className="size-4" />
        </Link>

        {/* Jauge de progression du quiz */}
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>
              Question {index + 1} sur {quiz.questions.length}
            </span>
            <span>
              {Math.round(((index + 1) / quiz.questions.length) * 100)}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-blue-100 dark:bg-blue-950">
            <motion.div
              animate={{
                width: `${((index + 1) / quiz.questions.length) * 100}%`,
              }}
              className="h-full rounded-full bg-blue-600"
              initial={false}
              transition={{ duration: 0.35, ease: "easeInOut" }}
            />
          </div>
        </div>

        {/* Bouton muet / son */}
        <button
          className={cn(
            "flex size-9 cursor-pointer items-center justify-center rounded-full border transition-all",
            sonActif
              ? "border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300"
              : "border-slate-200 bg-white text-slate-400 dark:border-slate-800 dark:bg-slate-900"
          )}
          onClick={basculerSon}
          title={sonActif ? "Couper le son" : "Activer le son"}
          type="button"
        >
          {sonActif ? (
            <Volume2Icon className="size-4" />
          ) : (
            <VolumeXIcon className="size-4" />
          )}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
          {quiz.subjectLabel} · {quiz.chapterTitle}
        </span>
        {question.type === "multiple_choice" && (
          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            Plusieurs réponses
          </span>
        )}
      </div>

      <Rangee pose={pose}>
        <div
          className={cn(
            "surface-quizzly-card flex flex-col gap-4 p-5 sm:p-6 transition-all",
            revelation?.correct &&
              "border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20",
            revelation &&
              !revelation.correct &&
              "border-rose-300 bg-rose-50/50 q-shake dark:border-rose-800 dark:bg-rose-950/20"
          )}
          key={`${question.id}-${revelation ? "vu" : "choix"}`}
        >
          <h2 className="text-base font-bold text-slate-900 sm:text-lg dark:text-white">
            {question.question}
          </h2>

          <div className="flex flex-col gap-2.5">
            {question.options.map((option, position) => {
              const actif = selection.includes(position);
              const attendue = revelation?.expectedIndexes.includes(position);
              const donnee = revelation?.givenIndexes.includes(position);

              return (
                <button
                  aria-pressed={actif}
                  className={cn(
                    "flex min-h-14 items-center gap-3 rounded-2xl border p-3.5 text-left text-sm font-semibold transition-all cursor-pointer touch-manipulation active:scale-[0.99] sm:text-sm",
                    !revelation &&
                      !actif &&
                      "border-slate-200/90 bg-white/90 text-slate-800 hover:border-blue-400 hover:bg-blue-50/60 shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800",
                    !revelation &&
                      actif &&
                      "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-[1.01]",
                    attendue &&
                      "border-emerald-500 bg-emerald-100/80 text-emerald-900 ring-2 ring-emerald-500/30 dark:bg-emerald-950 dark:text-emerald-200",
                    donnee &&
                      !attendue &&
                      "border-rose-500 bg-rose-100/80 text-rose-900 ring-2 ring-rose-500/30 dark:bg-rose-950 dark:text-rose-200"
                  )}
                  disabled={Boolean(revelation)}
                  key={option}
                  onClick={() => basculer(position)}
                  type="button"
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all",
                      !revelation &&
                        !actif &&
                        "border border-slate-300 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
                      !revelation &&
                        actif &&
                        "bg-white text-blue-600 font-black",
                      attendue && "bg-emerald-600 text-white font-black",
                      donnee && !attendue && "bg-rose-600 text-white font-black"
                    )}
                  >
                    {attendue ? (
                      <CheckIcon className="size-4 stroke-[3]" />
                    ) : donnee && !attendue ? (
                      <XIcon className="size-4 stroke-[3]" />
                    ) : (
                      (LETTRES[position] ?? position + 1)
                    )}
                  </span>
                  <span className="flex-1">{option}</span>
                </button>
              );
            })}
          </div>

          <AnimatePresence>
            {revelation && (
              <motion.div
                animate={{ height: "auto", opacity: 1 }}
                className={cn(
                  "rounded-2xl p-3.5 text-xs font-medium",
                  revelation.correct
                    ? "bg-emerald-100/70 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200"
                    : "bg-rose-100/70 text-rose-900 dark:bg-rose-950/50 dark:text-rose-200"
                )}
                exit={{ height: 0, opacity: 0 }}
                initial={{ height: 0, opacity: 0 }}
              >
                <p className="font-bold mb-1">
                  {revelation.correct
                    ? "Excellente réponse ! 👏"
                    : "Pas tout à fait… 💡"}
                </p>
                <p>{revelation.explanation}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Rangee>

      {erreur && (
        <p className="text-xs font-semibold text-destructive">{erreur}</p>
      )}

      <div className="flex items-center justify-between gap-3 pt-2">
        <FormulaireSignalement
          questionId={question.id}
          questionNumber={index + 1}
          quizId={quiz.id}
          subjectLabel={quiz.subjectLabel}
        />

        <button
          className={cn(
            "min-h-12 rounded-full px-7 py-3 text-sm font-bold text-white transition-all shadow-md touch-manipulation",
            (!revelation && selection.length === 0) || envoi
              ? "cursor-not-allowed bg-slate-300 text-slate-500 opacity-60 dark:bg-slate-800 dark:text-slate-400"
              : "cursor-pointer bg-blue-600 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/25 active:scale-95"
          )}
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
              : revelation
                ? derniere
                  ? "Terminer le quiz"
                  : "Continuer"
                : "Vérifier"}
        </button>
      </div>
    </section>
  );
}
