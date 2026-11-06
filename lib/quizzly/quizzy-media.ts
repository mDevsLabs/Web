/**
 * Choix de fichier de Quizzy.
 *
 * Le GIF n'est demandé que lorsqu'une animation a un spectateur. Le mode
 * économie, l'onglet caché et `prefers-reduced-motion` passent `anime` à
 * false : le navigateur ne décode alors plus une boucle de plusieurs mégaoctets.
 * Les PNG de pose n'existent pas ; le seul secours est le repos.
 */

export const QUIZZY_REPOS = "/quizzly/quizzy.png";

const POSES_ANIMEES = new Set([
  "bad",
  "cheer",
  "freeze",
  "good",
  "hearts",
  "perfect",
  "streak",
  "think",
]);

export function sourcesQuizzy(pose: string, anime: boolean): readonly string[] {
  if (!anime || !POSES_ANIMEES.has(pose)) {
    return [QUIZZY_REPOS];
  }
  return [`/quizzly/quizzy-${pose}.gif`, QUIZZY_REPOS];
}
