export type ChatHistoryGroupInput = {
  createdAt: Date | string;
  lastMessageAt?: Date | string | null;
  pinned?: boolean | null;
};

export type GroupedChats<T extends ChatHistoryGroupInput> = {
  lastMonth: T[];
  lastWeek: T[];
  older: T[];
  pinned: T[];
  today: T[];
  yesterday: T[];
};

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getActivityDate(chat: ChatHistoryGroupInput): Date {
  return new Date(chat.lastMessageAt ?? chat.createdAt);
}

/**
 * Regroupe l'historique des conversations pour la barre latérale :
 * - les conversations épinglées sont isolées dans `pinned` (la section n'est
 *   affichée que lorsqu'il en existe au moins une) ;
 * - les autres conversations sont triées et classées selon la date du dernier
 *   message envoyé (`lastMessageAt`, ou `createdAt` en repli).
 */
export function groupChatsByDate<T extends ChatHistoryGroupInput>(
  chats: T[],
  referenceNow: Date = new Date()
): GroupedChats<T> {
  const yesterday = new Date(referenceNow);
  yesterday.setDate(yesterday.getDate() - 1);

  const oneWeekAgo = new Date(referenceNow);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const oneMonthAgo = new Date(referenceNow);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const groups: GroupedChats<T> = {
    lastMonth: [],
    lastWeek: [],
    older: [],
    pinned: [],
    today: [],
    yesterday: [],
  };

  for (const item of chats) {
    if (item.pinned) {
      groups.pinned.push(item);
      continue;
    }

    const activityDate = getActivityDate(item);
    if (isSameCalendarDay(activityDate, referenceNow)) {
      groups.today.push(item);
    } else if (isSameCalendarDay(activityDate, yesterday)) {
      groups.yesterday.push(item);
    } else if (activityDate > oneWeekAgo) {
      groups.lastWeek.push(item);
    } else if (activityDate > oneMonthAgo) {
      groups.lastMonth.push(item);
    } else {
      groups.older.push(item);
    }
  }

  return groups;
}
