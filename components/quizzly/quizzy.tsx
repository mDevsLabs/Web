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
 * `avant` recouvre la question et la réponse choisie.
 * `arriere` reste derrière la carte de score.
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
  if (bilan.passed && bilan.streakExtended) {
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
  plan,
  pose,
}: {
  plan: "arriere" | "avant";
  pose: QuizzyPose;
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

  return (
    <img
      alt={plan === "arriere" ? "" : LEGENDES[pose]}
      aria-hidden={plan === "arriere" ? true : undefined}
      className={cn(
        "pointer-events-none object-contain",
        plan === "avant"
          ? "absolute right-1 bottom-1 z-20 h-32 w-auto motion-safe:quizzy-pop"
          : "h-72 w-auto"
      )}
      decoding="async"
      fetchPriority={plan === "avant" ? "low" : "auto"}
      height={plan === "avant" ? 128 : 288}
      key={anime ? `${pose}-${secours}` : "fixe"}
      onError={() =>
        setSecours((indice) => Math.min(indice + 1, sources.length - 1))
      }
      src={sources[Math.min(secours, sources.length - 1)]}
      width={plan === "avant" ? 128 : 288}
    />
  );
}
