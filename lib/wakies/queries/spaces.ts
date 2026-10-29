import "server-only";
import {
  and,
  asc,
  count,
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
import { WakiesQuotaError } from "@/lib/wakies/quota-error";
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

// ─── Espaces ────────────────────────────────────────────────────────────────

export async function listSpaces(userId: string): Promise<WakieSpaceRow[]> {
  await dbReady();
  return (
    getDb()
      .select()
      .from(wakiesSpace)
      .where(eq(wakiesSpace.userId, userId))
      // Les épinglés d'abord, puis l'ordre de création. Le tri est décidé ici et
      // non dans le rail : deux onglets qui re-trieraient chacun de leur côté
      // n'afficheraient pas le même espace de travail.
      .orderBy(desc(wakiesSpace.pinned), asc(wakiesSpace.createdAt))
  );
}

/**
 * Création d'un Espace sous quota, ATOMIQUE.
 *
 * Le quota était vérifié en lecture puis l'insertion suivie : à 7 Espaces sur
 * une limite de 8, deux requêtes simultanées passaient toutes les deux. Le
 * verrou consultatif PostgreSQL sérialise les créations DU MÊME COMPTE ; une
 * insertion échouée ne réserve aucune place (tout est dans la transaction).
 */
export async function createSpaceWithinQuota(
  userId: string,
  input: { name: string; description?: string },
  quota: number | null
): Promise<WakieSpaceRow> {
  await dbReady();
  return getDb().transaction(async (tx) => {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${`wakies-spaces:${userId}`}))`
    );
    if (quota !== null) {
      const [row] = await tx
        .select({ value: count() })
        .from(wakiesSpace)
        .where(eq(wakiesSpace.userId, userId));
      const used = Number(row?.value ?? 0);
      if (used >= quota) {
        throw new WakiesQuotaError("spaces", quota, used);
      }
    }
    const [created] = await tx
      .insert(wakiesSpace)
      .values({
        description: input.description ?? "",
        name: input.name,
        userId,
      })
      .returning();
    return created;
  });
}

/** Espace du compte, ou `null` : jamais d'espace lu par simple identifiant. */
export async function findSpace(
  userId: string,
  spaceId: string
): Promise<WakieSpaceRow | null> {
  await dbReady();
  const [row] = await getDb()
    .select()
    .from(wakiesSpace)
    .where(and(eq(wakiesSpace.id, spaceId), eq(wakiesSpace.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function spaceExists(
  userId: string,
  spaceId: string
): Promise<boolean> {
  return (await findSpace(userId, spaceId)) !== null;
}

/**
 * Renommage (ou description) d'un Espace du compte.
 *
 * `null` = cet Espace n'existe pas pour ce compte. Une ressource d'un autre
 * compte répond comme une ressource absente : l'existence d'un Espace est une
 * information privée.
 */
export async function renommerEspace(
  userId: string,
  spaceId: string,
  input: { description?: string; name?: string }
): Promise<WakieSpaceRow | null> {
  await dbReady();
  const [row] = await getDb()
    .update(wakiesSpace)
    .set({
      ...(input.name === undefined ? {} : { name: input.name }),
      ...(input.description === undefined
        ? {}
        : { description: input.description }),
      updatedAt: new Date(),
    })
    .where(and(eq(wakiesSpace.id, spaceId), eq(wakiesSpace.userId, userId)))
    .returning();
  return row ?? null;
}

/** Épingle d'un Espace : même contrat `{ id, pinned }` que `definirEpingle`. */
export async function definirEspaceEpingle(
  userId: string,
  spaceId: string,
  pinned: boolean
): Promise<{ id: string; pinned: boolean } | null> {
  await dbReady();
  const db = getDb();
  const [espace] = await db
    .select({ id: wakiesSpace.id })
    .from(wakiesSpace)
    .where(and(eq(wakiesSpace.id, spaceId), eq(wakiesSpace.userId, userId)))
    .limit(1);
  if (!espace) {
    return null;
  }
  const [maj] = await db
    .update(wakiesSpace)
    .set({ pinned, updatedAt: new Date() })
    .where(eq(wakiesSpace.id, spaceId))
    .returning({ id: wakiesSpace.id, pinned: wakiesSpace.pinned });
  return maj ?? null;
}

/**
 * Nombre de pages d'un Espace, lu côté serveur.
 *
 * Le `ConfirmDialog` de suppression doit annoncer ce qui va disparaître. Le
 * rail ne charge les pages que quand sa disclosure est ouverte : recompter
 * depuis ce que l'interface a sous la main annoncerait « 0 page » pour un
 * Espace plein, et supprimerait quand même.
 */
export async function compterPagesEspace(
  userId: string,
  spaceId: string
): Promise<number | null> {
  if (!(await spaceExists(userId, spaceId))) {
    return null;
  }
  await dbReady();
  const [compte] = await getDb()
    .select({ n: sql<number>`count(*)::int` })
    .from(wakiesPage)
    .where(and(eq(wakiesPage.spaceId, spaceId), eq(wakiesPage.userId, userId)));
  return compte?.n ?? 0;
}

/**
 * Suppression d'un Espace et de ses pages.
 *
 * LE POINT DUR : `WakiesWakie.spaceId` est une clé étrangère
 * `ON DELETE CASCADE` (lib/db/schema.ts). Supprimer l'Espace sans détacher les
 * Wakies qui en ont fait leur espace par défaut les détruirait PHYSIQUEMENT —
 * donc leurs conversations, et leurs messages. La cascade reste en base comme
 * filet de sécurité ; le chemin applicatif, lui, détache avant de supprimer,
 * dans la même transaction, et le teste.
 *
 * Les pages sont supprimées explicitement plutôt que laissées à la cascade :
 * c'est le seul moyen de rendre le compte annoncé au dialogue vrai.
 */
export async function supprimerEspace(
  userId: string,
  spaceId: string
): Promise<{ pagesSupprimees: number; wakiesDetaches: number } | null> {
  await dbReady();
  return getDb().transaction(async (tx) => {
    // Verrou : deux onglets ouverts sur le même Espace ne doivent pas
    // détacher et compter deux fois.
    const [espace] = await tx
      .select({ id: wakiesSpace.id })
      .from(wakiesSpace)
      .where(and(eq(wakiesSpace.id, spaceId), eq(wakiesSpace.userId, userId)))
      .limit(1)
      .for("update");
    if (!espace) {
      return null;
    }

    const detaches = await tx
      .update(wakiesWakie)
      .set({ spaceId: null })
      .where(
        and(eq(wakiesWakie.spaceId, spaceId), eq(wakiesWakie.userId, userId))
      )
      .returning({ id: wakiesWakie.id });

    const [compte] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(wakiesPage)
      .where(
        and(eq(wakiesPage.spaceId, spaceId), eq(wakiesPage.userId, userId))
      );

    await tx
      .delete(wakiesPage)
      .where(
        and(eq(wakiesPage.spaceId, spaceId), eq(wakiesPage.userId, userId))
      );
    await tx
      .delete(wakiesSpace)
      .where(and(eq(wakiesSpace.id, spaceId), eq(wakiesSpace.userId, userId)));

    return { pagesSupprimees: compte?.n ?? 0, wakiesDetaches: detaches.length };
  });
}
