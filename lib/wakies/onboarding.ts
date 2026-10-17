import "server-only";

/**
 * Le repère d'onboarding est conservé pour les comptes historiques. Les
 * lectures de Wakies ne créent plus de données : un compte neuf commence avec
 * zéro Espace et zéro Wakie, et les créations passent par les formulaires.
 */

import { ensureSettings, updateSettings } from "./queries";

/**
 * Profil de départ. Ces valeurs sont exportées parce que l'assistant s'en sert
 * pour construire une charge utile COMPLÈTE : `PUT /api/wakies/wakies/:id`
 * exige `name`, `instructions`, `memoryAllowed` et `researchAllowed`, donc une
 * étape qui ne touche qu'un champ doit quand même renvoyer les trois autres.
 */
export const WAKIE_PAR_DEFAUT = {
  instructions:
    "Sois attentive, pratique et concis. Aide à réfléchir clairement et à aller au bout des choses.",
  memoryAllowed: true,
  name: "Wakie",
  researchAllowed: true,
};

/**
 * L'espace de départ existe-t-il déjà pour ce compte ? Un compte qui en a
 * déjà un n'est jamais renvoyé vers l'assistant.
 */
export async function needsOnboarding(userId: string): Promise<boolean> {
  const reglage = await ensureSettings(userId);
  return !reglage.onboardingCompleted;
}

/** Marque la configuration de départ comme achevée. */
export async function completeOnboarding(userId: string): Promise<void> {
  await updateSettings(userId, { onboardingCompleted: true });
}
