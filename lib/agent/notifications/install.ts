import "server-only";

import { eq } from "drizzle-orm";
import {
  installAgentNotificationListener,
  setAgentInAppNotificationWriter,
} from "@/lib/agent/notifications/service";
import {
  createNotification,
  dbReady,
  getUserNotificationPrefs,
} from "@/lib/db/queries";
import { agentRun } from "@/lib/db/schema";

// Branchement des notifications Agent : le service ne dépend d'aucun provider,
// l'application lui fournit la résolution de la cible (run → utilisateur et
// préférences) et l'écriture in-app (table Notification). L'installation est
// idempotente et paresseuse : elle a lieu au premier run Agent, sans dépendre
// d'un ordre d'importation fragile.

let installed = false;

// Lecture défensive d'une préférence : une ligne partielle (ancienne version de
// la table) ne doit jamais empêcher une notification par défaut.
function readPreference(source: unknown, key: string, fallback: boolean) {
  if (!source || typeof source !== "object") {
    return fallback;
  }
  const value = (source as Record<string, unknown>)[key];
  return typeof value === "boolean" ? value : fallback;
}

export function ensureAgentNotificationsInstalled(): void {
  if (installed) {
    return;
  }
  installed = true;

  setAgentInAppNotificationWriter(async ({ dedupeKey, payload, userId }) => {
    await createNotification({
      body: payload.body,
      dedupeKey,
      link: payload.link,
      title: payload.title,
      type: payload.type,
      userId,
    });
  });

  installAgentNotificationListener({
    resolveTarget: async (runId) => {
      const db = await dbReady();
      const [run] = await db
        .select({ chatId: agentRun.chatId, userId: agentRun.userId })
        .from(agentRun)
        .where(eq(agentRun.id, runId))
        .limit(1);
      if (!run) {
        return null;
      }
      const prefs = await getUserNotificationPrefs(run.userId).catch(
        () => null
      );
      // Le run vient-il d'une tâche planifiée ? (occurrence liée)
      const { getOccurrenceByRunId } = await import(
        "@/lib/db/agent-foundation-queries"
      );
      const occurrence = await getOccurrenceByRunId({ runId }).catch(
        () => null
      );
      return {
        // Conversation réelle du run : le lien de notification mène à la
        // discussion où le run est visible (jamais à une page inexistante).
        chatId: run.chatId,
        // Aucune adresse n'est devinée ici : si le canal email n'est pas activé
        // (défaut), seules les notifications in-app sont créées.
        email: "",
        isScheduledResult: Boolean(occurrence),
        prefs: {
          agentApprovalRequired: readPreference(
            prefs,
            "agentApprovalRequired",
            true
          ),
          agentEmailEnabled: readPreference(prefs, "agentEmailEnabled", false),
          agentPushEnabled: readPreference(prefs, "agentPushEnabled", false),
          agentRunFailed: readPreference(prefs, "agentRunFailed", true),
          agentRunFinished: readPreference(prefs, "agentRunFinished", true),
          agentUserInputRequired: readPreference(
            prefs,
            "agentUserInputRequired",
            true
          ),
        },
        userId: run.userId,
      };
    },
  });
}
