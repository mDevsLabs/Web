"use client";

import { useEffect, useState } from "react";
import { sourcesQuizzy } from "@/lib/quizzly/quizzy-media";
import { useEconomy } from "@/lib/resources/economy";
import { cn } from "@/lib/utils";

/**
 * Quizzy change de dessin selon la pose. Le GIF n'est chargé que si
 * quelqu'un le regarde : mode économie, onglet caché ou mouvement réduit
 * affichent le repos, sans décodeur d'animation.
 *
 * Le GIF est un voisin de la carte, jamais posé par-dessus.
 */

const POSES = [
  "bad",
  "cheer",
  "freeze",
  "good",
  "hearts",
  "idle",
  "perfect",
  "streak",
  "think",
] as const;

export type QuizzyPose = (typeof POSES)[number];

const LEGENDES: Record<QuizzyPose, string> = {
  bad: "Quizzy, mauvaise réponse",
  cheer: "Quizzy, quiz validé",
  freeze: "Quizzy, gel de série",
  good: "Quizzy, bonne réponse",
  hearts: "Quizzy, plus de cœurs",
  idle: "Quizzy",
  perfect: "Quizzy, sans-faute",
  streak: "Quizzy, série",
  think: "Quizzy réfléchit",
};

/** Pose du score : le gel et le sans-faute priment sur la série. */
export function poseDuScore(bilan: {
  correctCount: number;
  passed: boolean;
  streakExtended?: boolean;
  streakFreezeUsed?: boolean;
  totalCount: number;
}): QuizzyPose {
  if (bilan.streakFreezeUsed) {
    return "freeze";
  }
  if (bilan.totalCount > 0 && bilan.correctCount === bilan.totalCount) {
    return "perfect";
  }
  if (bilan.streakExtended) {
    return "streak";
  }
  if (bilan.passed) {
    return "cheer";
  }
  return "bad";
}

function useMouvementReduit(): boolean {
  const [reduit, setReduit] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const appliquer = () => setReduit(media.matches);
    appliquer();
    media.addEventListener("change", appliquer);
    return () => media.removeEventListener("change", appliquer);
  }, []);
  return reduit;
}

export function Quizzy({
  pose,
  taille = "compact",
}: {
  pose: QuizzyPose;
  taille?: "compact" | "score";
}) {
  const { isEconomy } = useEconomy();
  const mouvementReduit = useMouvementReduit();
  const anime = !(isEconomy || mouvementReduit);
  const [signature, setSignature] = useState(`${pose}:${anime}`);
  const [secours, setSecours] = useState(0);
  const suivante = `${pose}:${anime}`;

  if (signature !== suivante) {
    setSignature(suivante);
    setSecours(0);
  }

  const sources = sourcesQuizzy(pose, anime);

  const compact = taille === "compact";
  return (
    <img
      alt={LEGENDES[pose]}
      className={cn(
        "pointer-events-none shrink-0 object-contain motion-safe:quizzy-pop",
        compact ? "h-24 w-24 sm:h-32 sm:w-32" : "h-32 w-32 sm:h-40 sm:w-40"
      )}
      decoding="async"
      fetchPriority={compact ? "low" : "auto"}
      height={compact ? 128 : 160}
      key={anime ? `${pose}-${secours}` : "fixe"}
      onError={() =>
        setSecours((indice) => Math.min(indice + 1, sources.length - 1))
      }
      src={sources[Math.min(secours, sources.length - 1)]}
      width={compact ? 128 : 160}
    />
  );
}
