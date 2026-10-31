/**
 * Conversation dont le flux vient de partir.
 *
 * L'envoi écrit `/chat/<id>` dans l'adresse. Ce changement d'identifiant ne
 * doit pas appeler `stop()` : ce serait couper la réponse au milieu d'un mot.
 * Le repère est effacé quand le flux se termine, pour qu'un vrai changement
 * de conversation coupe encore le flux précédent.
 */
let inFlightChatId: string | null = null;

export function markInFlightChat(id: string) {
  inFlightChatId = id;
}

export function clearInFlightChat(id: string) {
  if (inFlightChatId === id) {
    inFlightChatId = null;
  }
}

export function isInFlightChat(id: string) {
  return inFlightChatId === id;
}
