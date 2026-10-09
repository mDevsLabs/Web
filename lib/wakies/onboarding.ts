import "server-only";

/**
 * Espace de départ d'un compte.
 *
 * Le gabarit créait son espace et son Dot au CONSTRUCTEUR du `WorkspaceStore` :
 * `if (!this.spaces().length) { … }`. C'est impossible ici — la base est
 * partagée, et « pas de lignes pour moi » ne veut pas dire « pas de lignes ».
 * La création est donc explicite, à la première lecture de l'espace de travail,
 * et idempotente.
 *
 * Elle ne se déclenche que si le compte n'a NI espace NI Wakie : un compte qui a
 * supprimé son dernier espace ne doit pas récupérer un espace surprise à la
 * visite suivante. C'est aussi ce qui garantit qu'après la suppression du
 * DERNIER Wakie, l'interface affiche « aucun Wakie » au lieu de ressusciter
 * un profil de départ que l'utilisateur vient de retirer.
 *
 * LE REPÈRE `onboardingCompleted`
 *
 * Créer l'espace de départ, c'est aussi décider que le compte n'a pas encore
 * choisi son profil : la ligne passe alors à `false`, et l'assistant de
 * configuration se propose. Le défaut de la colonne est `true` — les comptes
 * qui existaient avant cette migration ne repassent donc pas par l'assistant,
 * et leurs Wakies restent reconnaissables.
 *
 * L'assistant ÉDITE ce Wakie de départ plutôt que d'en créer un deuxième :
 * pas de quota consommé, pas d'espace dupliqué, et « quitter puis reprendre »
 * fonctionne sans état supplémentaire côté navigateur.
 */

import {
  createSpace,
  createWakie,
  ensureSettings,
  listSpaces,
  listWakies,
  updateSettings,
} from "./queries";

export const ESPACE_PAR_DEFAUT = {
  description: "Un espace pour la journée.",
  name: "Quotidien",
};

/**
 * Profil de départ. Ces valeurs sont exportées parce que l'assistant s'en sert
 * pour construedre une charge utile COMPLÈTE : `PUT /api/wakies/wakies/:id`
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

export async function ensureStarterWorkspace(userId: string): Promise<void> {
  const [espaces, wakies] = await Promise.all([
    listSpaces(userId),
    listWakies(userId),
  ]);
  if (espaces.length || wakies.length) {
    return;
  }
  const espace = await createSpace(userId, ESPACE_PAR_DEFAUT);
  // Pas de quota passé ici : c'est la création interne du parcours de départ,
  // elle ne doit pas pouvoir échouer sur la limite du forfait.
  await createWakie(userId, {
    ...WAKIE_PAR_DEFAUT,
    spaceId: espace.id,
    spaceIds: [espace.id],
  });
  await updateSettings(userId, { onboardingCompleted: false });
}
