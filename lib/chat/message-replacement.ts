import type { ChatMessage } from "@/lib/types";

// Remplacement d'un message utilisateur ÉDITÉ (comportement mAI attendu :
// aucune branche, aucun arbre de versions, aucun fork). Le message édité
// remplace l'ancien dans la conversation existante, et tout ce qui le suit
// (anciennes réponses incluses) est retiré : l'IA régénère une réponse
// unique au message édité.
//
// Cette fonction pure décide ; les requêtes DB exécutent (voir
// buildChatContext + upsertMessage). Le flux d'approbation d'outils
// (isToolApprovalFlow, message complet transmis par le client) n'est PAS
// concerné : il ne passe jamais par ce remplacement.
export type MessageReplacementPlan = {
  /** id du message remplacé (existant en DB) ou du nouveau message. */
  replacedMessageId: string;
  /** Messages DB à supprimer (id du message édité inclus). */
  messageIdsToDelete: string[];
  /** true si le message entrant écrase un message existant. */
  isReplacement: boolean;
};

export function planMessageReplacement(params: {
  dbMessages: Pick<ChatMessage, "id">[];
  incomingMessageId: string;
  /** Flux d'approbation d'outils : aucun remplacement dans ce cas. */
  isToolApprovalFlow?: boolean;
}): MessageReplacementPlan {
  const { dbMessages, incomingMessageId, isToolApprovalFlow } = params;

  if (isToolApprovalFlow || !incomingMessageId) {
    return {
      isReplacement: false,
      messageIdsToDelete: [],
      replacedMessageId: incomingMessageId,
    };
  }

  const existingIds = new Set(
    dbMessages
      .map((message) => message.id)
      .filter((id): id is string => typeof id === "string" && id.length > 0)
  );

  if (!existingIds.has(incomingMessageId)) {
    // Nouveau message : aucun troncage, aucun remplacement.
    return {
      isReplacement: false,
      messageIdsToDelete: [],
      replacedMessageId: incomingMessageId,
    };
  }

  // Le message édité existe déjà : on le retire (puis le remplace via upsert)
  // ainsi que tout ce qui le suit en DB.
  return {
    isReplacement: true,
    messageIdsToDelete: [incomingMessageId],
    replacedMessageId: incomingMessageId,
  };
}
