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

import { findConversation } from "./conversations";
import { ensureSettings } from "./settings";

// ─── Tâches planifiées ──────────────────────────────────────────────────────

export async function listTasks(userId: string): Promise<WakieTaskRow[]> {
  await dbReady();
  return getDb()
    .select()
    .from(wakiesTask)
    .where(eq(wakiesTask.userId, userId))
    .orderBy(desc(wakiesTask.createdAt));
}

export async function findTask(
  userId: string,
  taskId: string
): Promise<WakieTaskRow | null> {
  await dbReady();
  const [row] = await getDb()
    .select()
    .from(wakiesTask)
    .where(and(eq(wakiesTask.id, taskId), eq(wakiesTask.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function createTask(
  userId: string,
  input: {
    prompt: string;
    intervalSeconds: number | null;
    conversationId?: string;
  }
): Promise<WakieTaskRow> {
  await dbReady();
  const db = getDb();
  const [row] = await db
    .insert(wakiesTask)
    .values({
      intervalSeconds: input.intervalSeconds ?? null,
      prompt: input.prompt,
      status: "queued",
      userId,
    })
    .returning();
  await db.insert(wakiesTaskEvent).values({
    runId: null,
    taskId: row.id,
    text: "Tâche ajoutée à la file de recherche.",
  });
  if (input.conversationId) {
    const conversation = await findConversation(userId, input.conversationId);
    if (!conversation) {
      throw new Error("Conversation introuvable sur ce compte.");
    }
    await db.insert(wakiesTaskConversation).values({
      conversationId: input.conversationId,
      taskId: row.id,
    });
  }
  return row;
}

export async function taskDetail(userId: string, taskId: string) {
  await dbReady();
  const task = await findTask(userId, taskId);
  if (!task) {
    return null;
  }
  const db = getDb();
  const runs = await db
    .select()
    .from(wakiesTaskRun)
    .where(eq(wakiesTaskRun.taskId, taskId))
    .orderBy(desc(wakiesTaskRun.startedAt));
  const events = await db
    .select()
    .from(wakiesTaskEvent)
    .where(eq(wakiesTaskEvent.taskId, taskId))
    .orderBy(asc(wakiesTaskEvent.id));
  return { events, runs, task };
}

export async function addTaskEvent(
  taskId: string,
  text: string,
  runId: string | null = null
): Promise<void> {
  await dbReady();
  await getDb().insert(wakiesTaskEvent).values({ runId, taskId, text });
}

export async function actionTask(
  userId: string,
  taskId: string,
  action: "run" | "pause" | "cancel"
): Promise<WakieTaskRow | null> {
  await dbReady();
  const task = await findTask(userId, taskId);
  if (!task) {
    return null;
  }
  if (action === "run" && task.status === "running") {
    return task;
  }
  const status =
    action === "run" ? "queued" : action === "pause" ? "paused" : "cancelled";
  if (task.lease) {
    await getDb()
      .update(wakiesTaskRun)
      .set({
        error: "Exécution interrompue : réglages ou action modifiés.",
        finishedAt: new Date(),
        status: "interrupted",
      })
      .where(
        and(
          eq(wakiesTaskRun.id, task.lease),
          eq(wakiesTaskRun.status, "running")
        )
      );
  }
  const liberation = {
    claimedBy: null,
    error: null,
    lease: null,
    leaseUntil: null,
    nextRunAt: null,
    status,
    updatedAt: new Date(),
  };
  const [row] = await getDb()
    .update(wakiesTask)
    .set(
      action === "run"
        ? // Une relance manuelle rend son droit à la tâche : sans remise à zéro,
          // une tâche abandonnée après trois tentatives le serait de nouveau dès
          // son premier claim, et le bouton « Exécuter » ne servirait plus rien.
          { ...liberation, attempt: 0 }
        : liberation
    )
    .where(and(eq(wakiesTask.id, taskId), eq(wakiesTask.userId, userId)))
    .returning();
  await addTaskEvent(
    taskId,
    action === "run"
      ? "Tâche mise en file pour une nouvelle exécution."
      : `Tâche ${status}.`,
    task.lease
  );
  return row ?? null;
}

export async function scheduleTask(
  userId: string,
  taskId: string,
  intervalSeconds: number | null
): Promise<WakieTaskRow | null> {
  await dbReady();
  const task = await findTask(userId, taskId);
  if (!task) {
    return null;
  }
  // Une re-planification ne pose `nextRunAt` qu'à partir d'une exécution TERMINÉE
  // : une tâche en file ou en cours partira à sa propre échéance, puis répétera
  // d'après le nouvel intervalle (`finishTask`). Le calcul de la date est unique
  // (lib/wakies/task-lease), sinon les deux chemins divergeraient sur `0`.
  const nextRunAt =
    task.status === STATUT_TACHE.complete
      ? prochaineExecution(intervalSeconds, new Date())
      : null;
  const [row] = await getDb()
    .update(wakiesTask)
    .set({ intervalSeconds, nextRunAt, updatedAt: new Date() })
    .where(and(eq(wakiesTask.id, taskId), eq(wakiesTask.userId, userId)))
    .returning();
  await addTaskEvent(
    taskId,
    intervalSeconds
      ? `Répétition toutes les ${Math.round(intervalSeconds / 60)} minutes après une exécution réussie.`
      : "Répétition supprimée."
  );
  return row ?? null;
}

export async function taskConversation(taskId: string): Promise<string | null> {
  await dbReady();
  const [row] = await getDb()
    .select()
    .from(wakiesTaskConversation)
    .where(eq(wakiesTaskConversation.taskId, taskId))
    .limit(1);
  return row?.conversationId ?? null;
}

/**
 * Réserve la prochaine tâche due pour un compte donné. Le gabarit faisait la même
 * chose dans un `setInterval` local ; ici la réservation est transactionnelle :
 * le `UPDATE … WHERE <est due>` réévalue le prédicat sur la nouvelle version de la
 * ligne, donc deux ticks concurrents ne peuvent pas revendiquer la même occurrence
 * (le second ne reçoit aucune ligne et rend `null`).
 *
 * « Due » couvre trois états qui doivent être exécutés :
 *  1. une tâche en file (`queued`) ;
 *  2. une tâche RÉUSSIE dont la prochaine exécution est atteinte (`completed` avec `nextRunAt` passé) ;
 *  3. une tâche EN COURS dont le bail a expiré (`running` avec `leaseUntil` passé — reprise après crash ou timeout du worker).
 *
 * `workerId` est l'identité de l'invocation qui revendique. Elle est écrite avec
 * le bail et recontrôlée à la finalisation : sans elle, un worker qui a perdu la
 * tâche puis la récupérée pourrait écrire par-dessus la progression d'un autre.
 */
export async function claimDueTask(
  userId: string,
  workerId: string
): Promise<{
  task: WakieTaskRow;
  lease: string;
} | null> {
  await dbReady();
  const db = getDb();
  const settings = await ensureSettings(userId);
  // Un compte suspendu ou dont la recherche est coupée ne consomme ni quota
  // d'appels ni conversation : la reprise des baux expirés s'arrête donc aussi,
  // volontairement. Les tâches restent `running` le temps du gel et sont reprises
  // au dégel — un compte gelé ne doit pas voir ses tâches s'exécuter en secret.
  if (settings.paused || !settings.researchAllowed) {
    return null;
  }
  const maintenant = new Date();
  return db.transaction(async (tx) => {
    const isDueCondition = or(
      eq(wakiesTask.status, STATUT_TACHE.file),
      and(
        eq(wakiesTask.status, STATUT_TACHE.complete),
        lte(wakiesTask.nextRunAt, maintenant)
      ),
      and(
        eq(wakiesTask.status, STATUT_TACHE.enCours),
        lt(wakiesTask.leaseUntil, maintenant)
      )
    );

    const [due] = await tx
      .select()
      .from(wakiesTask)
      .where(and(eq(wakiesTask.userId, userId), isDueCondition))
      .orderBy(asc(wakiesTask.createdAt))
      .limit(1);
    if (!due) {
      return null;
    }

    const reprise = due.status === STATUT_TACHE.enCours;

    const [claimed] = await tx
      .update(wakiesTask)
      .set({
        // Coût de la reprise, porté par la base : une occurrence dont
        // l'exécution meurt sans jamais appeler `finishTask` ni `failTask`
        // rebondirait `running` → bail expiré → `running` sans fin.
        attempt: sql`${wakiesTask.attempt} + 1`,
        claimedBy: workerId,
        lease: sql`gen_random_uuid()::text`,
        leaseUntil: new Date(Date.now() + TACHE_BAIL_MS),
        // L'erreur précédente reste lisible jusqu'à une finalisation réussie :
        // l'effacer au claim supprimait la seule trace d'un échec antérieur,
        // alors que l'historique est déjà porté par les runs et les événements.
        nextRunAt: null,
        status: STATUT_TACHE.enCours,
        updatedAt: maintenant,
      })
      .where(and(eq(wakiesTask.id, due.id), isDueCondition))
      .returning();
    if (!claimed) {
      return null;
    }

    // Si la tâche était en cours d'exécution avec un bail expiré, clore l'ancien run
    if (reprise && due.lease) {
      await tx
        .update(wakiesTaskRun)
        .set({
          error: "Bail d'exécution expiré (interrompu).",
          finishedAt: maintenant,
          status: "interrupted",
        })
        .where(
          and(
            eq(wakiesTaskRun.id, due.lease),
            eq(wakiesTaskRun.status, "running")
          )
        );
    }

    // Troisième revendication passée, en situation de reprise : la tâche est
    // abandonnée ICI, dans la même transaction, avant même d'ouvrir un run. Elle
    // passe hors du prédicat de revendication, donc le tick suivant ne la relance
    // plus ; une relance manuelle (`actionTask`) lui rendra son droit.
    if (reprise && tentativesEpuisees(claimed.attempt)) {
      const message = `Tâche abandonnée après ${TACHE_MAX_TENTATIVES} tentatives sans exécution terminée. Relancez-la depuis la conversation.`;
      await tx
        .update(wakiesTask)
        .set({
          claimedBy: null,
          error: message,
          lease: null,
          leaseUntil: null,
          nextRunAt: null,
          status: STATUT_TACHE.echoue,
          updatedAt: maintenant,
        })
        .where(eq(wakiesTask.id, claimed.id));
      await tx.insert(wakiesTaskEvent).values({
        // `runId` à null : aucun run n'a été ouvert pour cette revendication
        // avortée. Y inscrire le bail fraichement généré pointerait une exécution
        // que personne n'a jamais vue démarrer.
        runId: null,
        taskId: claimed.id,
        text: message,
      });
      return null;
    }

    await tx.insert(wakiesTaskRun).values({
      id: claimed.lease ?? "",
      startedAt: maintenant,
      status: "running",
      taskId: claimed.id,
    });
    await tx.insert(wakiesTaskEvent).values({
      runId: claimed.lease,
      taskId: claimed.id,
      text: reprise
        ? "Reprise de la tâche après expiration du bail."
        : "Exécution de la tâche démarrée.",
    });
    return { lease: claimed.lease ?? "", task: claimed };
  });
}

/**
 * Comptes ayant au moins une tâche : le cron ne connaît pas les utilisateurs,
 * il découvre ceux qui ont quelque chose à faire. Le nom vient de
 * `WakiesWakie` et non de `users` : un compte sans Wakie n'a pas de tâche, et
 * `users.id` est une colonne texte libre dont on ne peut pas garantir la forme.
 */
export async function listUsersWithWakies(): Promise<string[]> {
  await dbReady();
  const lignes = await getDb()
    .selectDistinct({ userId: wakiesWakie.userId })
    .from(wakiesWakie);
  return lignes.map((ligne) => ligne.userId);
}

/**
 * Clôt une exécution réussie et programme l'occurrence suivante.
 *
 * Le verrou est un `SELECT … FOR UPDATE` conditionnel (même forme que
 * `lib/db/agent-queries.ts:368`) : la ligne est relue SOUS verrou, filtrée par le
 * bail et par le porteur. Un simple `SELECT` en isolation `read committed` ne
 * verrouille rien — deux finalisations simultanées pouvaient toutes deux lire
 * `running` et passer la garde, puis écrire lune après lautre.
 *
 * Rend `false` quand la tâche ne lui appartient plus : le tick appelant doit le
 * journaliser, car lintervention a alors écrit un message dans la conversation
 * sans que la tâche le sache — lautre possibilité étant une nouvelle revendication
 * de la même occurrence.
 */
export async function finishTask(
  taskId: string,
  lease: string,
  result: unknown,
  workerId: string
): Promise<boolean> {
  await dbReady();
  const db = getDb();
  return db.transaction(async (tx) => {
    const [tache] = await tx
      .select()
      .from(wakiesTask)
      .where(
        and(
          eq(wakiesTask.id, taskId),
          eq(wakiesTask.lease, lease),
          eq(wakiesTask.claimedBy, workerId),
          eq(wakiesTask.status, STATUT_TACHE.enCours)
        )
      )
      .for("update")
      .limit(1);
    if (!tache) {
      // Bail repris, tâche annulée ou déjà finalisée : rien n'est écrit, et rien
      // ne doit l'être — lautre porteur poursuit.
      return false;
    }

    const maintenant = new Date();
    // Le run est clôt par sa clef, sa tâche ET son statut : un run déjà passé à
    // `interrupted` par une reprise ne peut pas être ressuscité en `completed`.
    await tx
      .update(wakiesTaskRun)
      .set({
        finishedAt: maintenant,
        result,
        status: "completed",
      })
      .where(
        and(
          eq(wakiesTaskRun.id, lease),
          eq(wakiesTaskRun.taskId, taskId),
          eq(wakiesTaskRun.status, "running")
        )
      );
    await tx
      .update(wakiesTask)
      .set({
        attempt: 0,
        claimedBy: null,
        error: null,
        lease: null,
        leaseUntil: null,
        nextRunAt: prochaineExecution(tache.intervalSeconds, maintenant),
        status: STATUT_TACHE.complete,
        updatedAt: maintenant,
      })
      .where(eq(wakiesTask.id, taskId));
    await tx.insert(wakiesTaskEvent).values({
      runId: lease,
      taskId,
      text: "Brief de recherche prêt.",
    });
    return true;
  });
}

/**
 * Enregistre un échec d'exécution. Transactionnel et fence de la même façon que
 * `finishTask` : un worker qui a perdu son bail ne doit plus pouvoir écrire dans
 * une tâche quil ne possède plus, ni y ajouter un événement.
 *
 * L'ancien ordre (run, puis tâche, puis événement, sans transaction) laissait, si
 * l'invocation mourait entre les deux premières écritures, un run `running`
 * orphelin sous une tâche `failed`.
 */
export async function failTask(
  taskId: string,
  lease: string,
  error: string,
  workerId: string
): Promise<boolean> {
  await dbReady();
  const db = getDb();
  return db.transaction(async (tx) => {
    const [tache] = await tx
      .select({ id: wakiesTask.id })
      .from(wakiesTask)
      .where(
        and(
          eq(wakiesTask.id, taskId),
          eq(wakiesTask.lease, lease),
          eq(wakiesTask.claimedBy, workerId),
          eq(wakiesTask.status, STATUT_TACHE.enCours)
        )
      )
      .for("update")
      .limit(1);
    if (!tache) {
      return false;
    }

    const maintenant = new Date();
    await tx
      .update(wakiesTaskRun)
      .set({ error, finishedAt: maintenant, status: "failed" })
      .where(
        and(
          eq(wakiesTaskRun.id, lease),
          eq(wakiesTaskRun.taskId, taskId),
          eq(wakiesTaskRun.status, "running")
        )
      );
    await tx
      .update(wakiesTask)
      .set({
        claimedBy: null,
        error,
        lease: null,
        leaseUntil: null,
        nextRunAt: null,
        status: STATUT_TACHE.echoue,
        updatedAt: maintenant,
      })
      .where(eq(wakiesTask.id, taskId));
    await tx
      .insert(wakiesTaskEvent)
      .values({ runId: lease, taskId, text: error });
    return true;
  });
}
