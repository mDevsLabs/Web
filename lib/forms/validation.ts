/**
 * Validation serveur des réponses de formulaire.
 *
 * Les questions enregistrées font foi : `answers: {}` ne contourne pas une
 * question requise, un choix inexistant est refusé, les tailles sont bornées.
 * Une question inconnue est refusée (le formulaire a pu changer ; le serveur
 * ne conserve pas de données qu'il ne sait plus interpréter).
 *
 * Module pur : testé sans base.
 */

import type { FormQuestion } from "./types";

export const FORM_ANSWER_TEXT_MAX = 5000;
export const FORM_ANSWER_TOTAL_MAX = 50_000;
export const FORM_RATING_MIN = 1;
export const FORM_RATING_MAX = 5;
export const FORM_MULTI_CHOICE_MAX = 50;

export type FormAnswersValidation =
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; error: string };

function isAbsent(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}

function validateQuestion(
  question: FormQuestion,
  value: unknown
): { ok: true; value: unknown } | { ok: false; error: string } {
  const label = question.title || question.id;
  if (isAbsent(value)) {
    if (question.required) {
      return { error: `La question « ${label} » est obligatoire.`, ok: false };
    }
    return { ok: true, value: null };
  }

  switch (question.type) {
    case "text": {
      if (typeof value !== "string") {
        return {
          error: `La question « ${label} » attend un texte.`,
          ok: false,
        };
      }
      // Un texte composé uniquement d'espaces n'est pas une réponse : il ne
      // doit pas satisfaire une question requise.
      if (!value.trim()) {
        if (question.required) {
          return {
            error: `La question « ${label} » est obligatoire.`,
            ok: false,
          };
        }
        return { ok: true, value: null };
      }
      if (value.length > FORM_ANSWER_TEXT_MAX) {
        return {
          error: `La réponse à « ${label} » dépasse ${FORM_ANSWER_TEXT_MAX} caractères.`,
          ok: false,
        };
      }
      return { ok: true, value };
    }
    case "single_choice": {
      const options = Array.isArray(question.options) ? question.options : [];
      if (typeof value !== "string" || !options.includes(value)) {
        return {
          error: `La réponse à « ${label} » n'est pas une option proposée.`,
          ok: false,
        };
      }
      return { ok: true, value };
    }
    case "multi_choice": {
      const options = Array.isArray(question.options) ? question.options : [];
      if (!Array.isArray(value)) {
        return {
          error: `La question « ${label} » attend une liste de choix.`,
          ok: false,
        };
      }
      if (value.length > FORM_MULTI_CHOICE_MAX) {
        return {
          error: `La question « ${label} » dépasse ${FORM_MULTI_CHOICE_MAX} choix.`,
          ok: false,
        };
      }
      const unique = Array.from(new Set(value));
      if (
        unique.some(
          (choice) => typeof choice !== "string" || !options.includes(choice)
        )
      ) {
        return {
          error: `La réponse à « ${label} » contient une option inconnue.`,
          ok: false,
        };
      }
      return { ok: true, value: unique };
    }
    case "rating": {
      if (
        typeof value !== "number" ||
        !Number.isInteger(value) ||
        value < FORM_RATING_MIN ||
        value > FORM_RATING_MAX
      ) {
        return {
          error: `La note de « ${label} » doit être un entier entre ${FORM_RATING_MIN} et ${FORM_RATING_MAX}.`,
          ok: false,
        };
      }
      return { ok: true, value };
    }
    default:
      return {
        error: `Le type de la question « ${label} » est inconnu.`,
        ok: false,
      };
  }
}

export function validateFormAnswers(
  questions: FormQuestion[],
  answers: Record<string, unknown>
): FormAnswersValidation {
  const knownIds = new Set(questions.map((question) => question.id));
  for (const key of Object.keys(answers)) {
    if (!knownIds.has(key)) {
      return {
        error: `Réponse fournie pour une question inconnue (${key}).`,
        ok: false,
      };
    }
  }

  const normalized: Record<string, unknown> = {};
  for (const question of questions) {
    const result = validateQuestion(question, answers[question.id]);
    if (!result.ok) {
      return result;
    }
    // Une valeur absente n'est pas stockée : elle se distingue d'une chaîne
    // vide ou d'un choix vide, qui ne sont jamais des réponses valides.
    if (result.value !== null) {
      normalized[question.id] = result.value;
    }
  }

  try {
    if (JSON.stringify(normalized).length > FORM_ANSWER_TOTAL_MAX) {
      return { error: "Réponses trop volumineuses.", ok: false };
    }
  } catch {
    return { error: "Réponses non sérialisables.", ok: false };
  }

  return { ok: true, value: normalized };
}
