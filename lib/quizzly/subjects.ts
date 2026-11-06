/**
 * Matières suivies par l'élève.
 *
 * Un tableau vide veut dire « toutes celles de l'année » : un compte qui
 * n'a jamais choisi ne perd pas de parcours. Une sélection qui recouvre
 * toute l'année est rangée vide, pour la même raison.
 */

import { PROGRAM, type SchoolYear } from "@/lib/quizzly/program";

export function idsMatieres(annee: SchoolYear): string[] {
  return PROGRAM[annee].map((matiere) => matiere.id);
}

export function normaliserMatieres(
  annee: SchoolYear,
  valeur: unknown
): string[] {
  const connues = idsMatieres(annee);
  if (!Array.isArray(valeur) || valeur.length === 0) {
    return [];
  }
  const autorisees = new Set(connues);
  const gardes = [
    ...new Set(
      valeur.filter(
        (entree): entree is string =>
          typeof entree === "string" && autorisees.has(entree)
      )
    ),
  ];
  if (gardes.length === 0 || gardes.length >= connues.length) {
    return [];
  }
  return gardes;
}

/** Vide : la matière est suivie. Sinon, seulement si elle est dans la liste. */
export function matiereSuivie(
  selection: readonly string[],
  matiereId: string
): boolean {
  return selection.length === 0 || selection.includes(matiereId);
}
