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
 * visite suivante.
 */

import { createSpace, createWakie, listSpaces, listWakies } from "./queries";

const ESPACE_PAR_DEFAUT = {
  description: "Un espace pour la journée.",
  name: "Quotidien",
};

const WAKIE_PAR_DEFAUT = {
  instructions:
    "Sois attentive, pratique et concis. Aide à réfléchir clairement et à aller au bout des choses.",
  memoryAllowed: true,
  name: "Wakie",
  researchAllowed: true,
};

export async function ensureStarterWorkspace(userId: string): Promise<void> {
  const [espaces, wakies] = await Promise.all([
    listSpaces(userId),
    listWakies(userId),
  ]);
  if (espaces.length || wakies.length) {
    return;
  }
  const espace = await createSpace(userId, ESPACE_PAR_DEFAUT);
  await createWakie(userId, {
    ...WAKIE_PAR_DEFAUT,
    spaceId: espace.id,
    spaceIds: [espace.id],
  });
}
