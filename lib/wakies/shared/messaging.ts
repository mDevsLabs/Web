/** La fusion conserve les pages anciennes et laisse le streaming sous l'autorité du chat. */
import type { UIMessage } from "ai";
import type { Conversation } from "./types";

export function fusionnerHistorique(
  actuels: UIMessage[],
  recus: UIMessage[]
): UIMessage[] {
  const parId = new Map(actuels.map((message) => [message.id, message]));
  for (const message of recus) parId.set(message.id, message);
  return [...parId.values()].sort((a, b) => {
    const seqA = (a.metadata as { seq?: number } | undefined)?.seq;
    const seqB = (b.metadata as { seq?: number } | undefined)?.seq;
    return seqA !== undefined && seqB !== undefined ? seqA - seqB : 0;
  });
}

export function trierConversations(
  conversations: Conversation[]
): Conversation[] {
  return [...conversations].sort(
    (a, b) =>
      Number(Boolean(b.favorite)) - Number(Boolean(a.favorite)) ||
      (b.dernierMessageAt ?? b.createdAt) -
        (a.dernierMessageAt ?? a.createdAt) ||
      a.id.localeCompare(b.id)
  );
}
