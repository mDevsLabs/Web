"use client";

import {
  AlertCircleIcon,
  AwardIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  HelpCircleIcon,
  RotateCcwIcon,
  SparklesIcon,
  TrophyIcon,
  XCircleIcon,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuizQuestion {
  correctAnswers: number[];
  explanation: string;
  id: string;
  options: string[];
  question: string;
  type: "single_choice" | "multiple_choice";
}

interface QuizCardProps {
  args?: {
    difficulty?: string;
    domain?: string;
    questions?: QuizQuestion[];
    theme?: string;
    title?: string;
  };
  output?: {
    difficulty?: string;
    domain?: string;
    questions?: QuizQuestion[];
    theme?: string;
    title?: string;
    totalQuestions?: number;
  };
}

export function QuizCard({ args, output }: QuizCardProps) {
  const quizData = output || args;
  const questions = quizData?.questions || [];
  const title = quizData?.title || "Quiz interactif";
  const theme = quizData?.theme || "";
  const domain = quizData?.domain;
  const difficulty = quizData?.difficulty;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number[]>>({});
  const [isAnswered, setIsAnswered] = useState<Record<number, boolean>>({});
  const [isFinished, setIsFinished] = useState(false);

  if (questions.length === 0) {
    return null;
  }

  const currentQ = questions[currentIndex];
  const currentSelections = selectedAnswers[currentIndex] || [];
  const isCurrentAnswered = Boolean(isAnswered[currentIndex]);
  const isMultiple = currentQ?.type === "multiple_choice";

  // Calcul du score global
  const calculateScore = () => {
    let score = 0;
    questions.forEach((q, idx) => {
      const userSel = selectedAnswers[idx] || [];
      const correct = q.correctAnswers || [];
      const isCorrect =
        userSel.length === correct.length &&
        userSel.every((val) => correct.includes(val));
      if (isCorrect) score += 1;
    });
    return score;
  };

  const handleSelectOption = (optionIndex: number) => {
    if (isCurrentAnswered) return;

    if (isMultiple) {
      setSelectedAnswers((prev) => {
        const current = prev[currentIndex] || [];
        const updated = current.includes(optionIndex)
          ? current.filter((i) => i !== optionIndex)
          : [...current, optionIndex];
        return { ...prev, [currentIndex]: updated };
      });
    } else {
      setSelectedAnswers((prev) => ({
        ...prev,
        [currentIndex]: [optionIndex],
      }));
      // En choix unique, on valide immédiatement
      setIsAnswered((prev) => ({
        ...prev,
        [currentIndex]: true,
      }));
    }
  };

  const handleValidateMultiple = () => {
    if (currentSelections.length === 0) return;
    setIsAnswered((prev) => ({
      ...prev,
      [currentIndex]: true,
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswers({});
    setIsAnswered({});
    setIsFinished(false);
  };

  const totalScore = calculateScore();
  const percentage = Math.round((totalScore / questions.length) * 100);

  return (
    <div className="my-3 overflow-hidden rounded-2xl border border-amber-500/30 bg-card/95 shadow-md backdrop-blur-xs transition">
      {/* Header */}
      <div className="border-b border-border/40 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <TrophyIcon className="size-4" />
            </span>
            <div>
              <h4 className="font-bold text-sm text-foreground">{title}</h4>
              <p className="text-[11px] text-muted-foreground">
                {theme ? `Thème : ${theme}` : ""} {domain ? `• ${domain}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {difficulty && (
              <span className="rounded-full border border-border/60 bg-background/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {difficulty}
              </span>
            )}
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
              Question {currentIndex + 1} / {questions.length}
            </span>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
            style={{
              width: `${((currentIndex + (isCurrentAnswered ? 1 : 0)) / questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Contenu principal du Quiz */}
      {!isFinished ? (
        <div className="space-y-4 p-4 sm:p-5">
          {/* Question */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <span>Question {currentIndex + 1}</span>
              {isMultiple && (
                <span className="text-[11px] font-normal text-amber-500">
                  (Plusieurs réponses possibles)
                </span>
              )}
            </div>
            <h5 className="font-semibold text-base leading-snug text-foreground">
              {currentQ.question}
            </h5>
          </div>

          {/* Options de réponse */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {currentQ.options.map((option, optIdx) => {
              const isSelected = currentSelections.includes(optIdx);
              const isCorrectAnswer = currentQ.correctAnswers.includes(optIdx);

              let optionStyle =
                "border-border/60 bg-background/60 text-foreground hover:bg-muted/70";
              let badge = null;

              if (isCurrentAnswered) {
                if (isCorrectAnswer) {
                  optionStyle =
                    "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-medium shadow-2xs";
                  badge = (
                    <CheckCircle2Icon className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  );
                } else if (isSelected && !isCorrectAnswer) {
                  optionStyle =
                    "border-destructive bg-destructive/15 text-destructive font-medium shadow-2xs";
                  badge = (
                    <XCircleIcon className="size-4 shrink-0 text-destructive" />
                  );
                } else {
                  optionStyle = "border-border/40 opacity-40";
                }
              } else if (isSelected) {
                optionStyle =
                  "border-primary bg-primary/10 text-primary font-medium shadow-2xs";
              }

              return (
                <button
                  className={cn(
                    "flex items-center justify-between rounded-xl border p-3 text-left text-xs transition sm:text-sm",
                    optionStyle,
                    isCurrentAnswered ? "cursor-default" : "cursor-pointer"
                  )}
                  disabled={isCurrentAnswered}
                  key={option}
                  onClick={() => handleSelectOption(optIdx)}
                  type="button"
                >
                  <span className="flex-1 pr-2">{option}</span>
                  {badge}
                </button>
              );
            })}
          </div>

          {/* Bouton de validation pour les choix multiples */}
          {isMultiple && !isCurrentAnswered && (
            <div className="pt-2 text-right">
              <Button
                className="gap-2 shadow-xs"
                disabled={currentSelections.length === 0}
                onClick={handleValidateMultiple}
                size="sm"
              >
                <span>Valider ma sélection</span>
              </Button>
            </div>
          )}

          {/* Explication après réponse */}
          {isCurrentAnswered && (
            <div className="space-y-3 pt-2">
              <div
                className={cn(
                  "rounded-xl border p-3 text-xs leading-relaxed transition",
                  currentSelections.length === currentQ.correctAnswers.length &&
                    currentSelections.every((val) =>
                      currentQ.correctAnswers.includes(val)
                    )
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                    : "border-destructive/30 bg-destructive/10 text-destructive dark:text-red-300"
                )}
              >
                <div className="font-semibold mb-1 flex items-center gap-1.5">
                  {currentSelections.length === currentQ.correctAnswers.length &&
                  currentSelections.every((val) =>
                    currentQ.correctAnswers.includes(val)
                  ) ? (
                    <>
                      <CheckCircle2Icon className="size-4 text-emerald-600" />
                      <span>Excellente réponse !</span>
                    </>
                  ) : (
                    <>
                      <AlertCircleIcon className="size-4 text-destructive" />
                      <span>Réponse incorrecte</span>
                    </>
                  )}
                </div>
                <p className="opacity-95">{currentQ.explanation}</p>
              </div>

              <div className="flex justify-end">
                <Button
                  className="gap-2 shadow-xs"
                  onClick={handleNext}
                  size="sm"
                >
                  <span>
                    {currentIndex < questions.length - 1
                      ? "Question suivante"
                      : "Voir les résultats"}
                  </span>
                  <ChevronRightIcon className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Écran récapitulatif de fin */
        <div className="space-y-5 p-6 text-center sm:p-8">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-lg">
            <AwardIcon className="size-8" />
          </div>

          <div>
            <h4 className="font-bold text-xl text-foreground">
              Quiz Terminé ! 🎉
            </h4>
            <p className="mt-1 text-xs text-muted-foreground">
              {percentage >= 80
                ? "Impressionnant ! Vous maîtrisez parfaitement le sujet !"
                : percentage >= 50
                ? "Beau travail ! Vos bases sont solides."
                : "Ne baissez pas les bras, réessayez pour vous perfectionner !"}
            </p>
          </div>

          <div className="mx-auto flex max-w-[200px] flex-col items-center justify-center rounded-2xl border border-border/60 bg-muted/30 p-4">
            <span className="text-3xl font-black text-foreground">
              {totalScore} / {questions.length}
            </span>
            <span className="mt-1 font-semibold text-xs text-primary">
              {percentage}% de réussite
            </span>
          </div>

          <div className="pt-2">
            <Button
              className="gap-2 shadow-xs"
              onClick={handleRestart}
              variant="outline"
            >
              <RotateCcwIcon className="size-4" />
              <span>Rejouer ce Quiz</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}