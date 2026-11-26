import { desc, type SQL, sql } from "drizzle-orm";
import { chat } from "../schema";

/**
 * Ordre total de l'historique : épinglées d'abord, puis dernier message,
 * création et enfin `id` pour départager les égalités. Sans ce dernier
 * critère, deux discussions au même `lastMessageAt` peuvent sauter ou se
 * répéter d'une page à l'autre.
 */
export const chatHistoryOrder = [
  desc(chat.pinned),
  desc(chat.lastMessageAt),
  desc(chat.createdAt),
  desc(chat.id),
] as const;

export interface ChatHistoryCursor {
  /** `before` : page suivante (plus ancienne) ; `after` : plus récente. */
  direction: "after" | "before";
  id: string;
}

/**
 * Condition de curseur calculée entièrement en SQL. Les horodatages Postgres
 * ont une précision à la microseconde alors qu'un `Date` JS s'arrête à la
 * milliseconde : relire le repère côté JS puis le réinjecter fausserait la
 * comparaison. Le repère est donc lu par sous-requête.
 */
export function chatHistoryCursorCondition({
  direction,
  id,
}: ChatHistoryCursor): SQL {
  const ligne = sql`(${chat.pinned}, ${chat.lastMessageAt}, ${chat.createdAt}, ${chat.id})`;
  const repere = sql`(SELECT c."pinned", c."lastMessageAt", c."createdAt", c."id" FROM "Chat" c WHERE c."id" = ${id}::uuid)`;
  return direction === "before"
    ? sql`${ligne} < ${repere}`
    : sql`${ligne} > ${repere}`;
}
