import "server-only";
import {
  and,
  asc,
  desc,
  eq,
  gt,
  ilike,
  inArray,
  isNull,
  lt,
  lte,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { dbReady, getDb } from "@/lib/db/queries";
import {
  wakiesCall,
  wakiesCapture,
  wakiesChatTurn,
  wakiesConversation,
  wakiesFriend,
  wakiesMemory,
  wakiesMessage,
  wakiesMessageReaction,
  wakiesNotification,
  wakiesPage,
  wakiesPageConversation,
  wakiesPageReview,
  wakiesSettings,
  wakiesSpace,
  wakiesTask,
  wakiesTaskConversation,
  wakiesTaskEvent,
  wakiesTaskRun,
  wakiesWakie,
  wakiesWakieImage,
  wakiesWakieProfile,
  wakiesWakieSpace,
} from "@/lib/db/schema";
import type { PageSettings } from "@/lib/wakies/pages";
import { preserveGoalMarker } from "@/lib/wakies/shared/goals";
import { apercuMessage } from "@/lib/wakies/shared/messages";
import {
  prochaineExecution,
  STATUT_TACHE,
  TACHE_BAIL_MS,
  TACHE_MAX_TENTATIVES,
  tentativesEpuisees,
} from "@/lib/wakies/task-lease";
import type {
  SetupStatus,
  WakieCallRow,
  WakieConversationRow,
  WakieMemoryRow,
  WakiePageRow,
  WakieRow,
  WakieSettingsRow,
  WakieSpaceRow,
  WakieTaskEventRow,
  WakieTaskRow,
  WakieTaskRunRow,
  WakieWithSpaces,
} from "./types";

// ─── Réglages ───────────────────────────────────────────────────────────────

const REGLAGES_PAR_DEFAUT = {
  memoryAllowed: true,
  name: "Wakie",
  paused: false,
  replyAlertsEnabled: true,
  researchAllowed: true,
} as const;

/**
 * Les réglages sont créés à la lecture : un compte qui arrive sur /wakies doit
 * avoir une ligne même s'il n'a jamais ouvert les réglages.
 */
export async function ensureSettings(
  userId: string
): Promise<WakieSettingsRow> {
  await dbReady();
  const db = getDb();
  const [row] = await db
    .insert(wakiesSettings)
    .values({ userId, ...REGLAGES_PAR_DEFAUT })
    .onConflictDoNothing({ target: wakiesSettings.userId })
    .returning();
  if (row) {
    return row;
  }
  const [existant] = await db
    .select()
    .from(wakiesSettings)
    .where(eq(wakiesSettings.userId, userId))
    .limit(1);
  if (!existant) {
    throw new Error("Réglages Wakies illisibles.");
  }
  return existant;
}

export async function updateSettings(
  userId: string,
  patch: Partial<{
    name: string;
    paused: boolean;
    researchAllowed: boolean;
    memoryAllowed: boolean;
    /** Produire une alerte à la fin d'un tour terminé (migration 0065). */
    replyAlertsEnabled: boolean;
    /** Repère de parcours, écrit par l'assistant de configuration. */
    onboardingCompleted: boolean;
  }>
): Promise<WakieSettingsRow> {
  await ensureSettings(userId);
  await dbReady();
  const [row] = await getDb()
    .update(wakiesSettings)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(wakiesSettings.userId, userId))
    .returning();
  if (!row) {
    throw new Error("Réglages Wakies introuvables.");
  }
  return row;
}
