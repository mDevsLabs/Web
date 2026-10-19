import type {
  wakiesCall,
  wakiesConversation,
  wakiesMemory,
  wakiesPage,
  wakiesSettings,
  wakiesSpace,
  wakiesTask,
  wakiesTaskEvent,
  wakiesTaskRun,
  wakiesWakie,
} from "@/lib/db/schema";

export type WakieSpaceRow = typeof wakiesSpace.$inferSelect;
export type WakieRow = typeof wakiesWakie.$inferSelect;
export type WakieConversationRow = typeof wakiesConversation.$inferSelect;
export type WakiePageRow = typeof wakiesPage.$inferSelect;
export type WakieTaskRow = typeof wakiesTask.$inferSelect;
export type WakieTaskRunRow = typeof wakiesTaskRun.$inferSelect;
export type WakieTaskEventRow = typeof wakiesTaskEvent.$inferSelect;
export type WakieMemoryRow = typeof wakiesMemory.$inferSelect;
export type WakieCallRow = typeof wakiesCall.$inferSelect;
export type WakieSettingsRow = typeof wakiesSettings.$inferSelect;

/** Wakie + la liste des espaces auxquels il a accès (jointure explicite). */
export type WakieWithSpaces = WakieRow & { spaceIds: string[] };

/** Vue « setup » exposée à l'interface (l'ancien `setupStatus` du gabarit). */
export type SetupStatus = {
  intelligence: boolean;
  model: boolean;
  browser: boolean;
  voice: boolean;
  slack: string;
  missing: string[];
};
