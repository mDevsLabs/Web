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
import { spaceExists } from "./spaces";
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

// ─── Pages ──────────────────────────────────────────────────────────────────

export async function listPages(
  userId: string,
  spaceId: string
): Promise<WakiePageRow[]> {
  await dbReady();
  return (
    getDb()
      .select()
      .from(wakiesPage)
      .where(
        and(eq(wakiesPage.spaceId, spaceId), eq(wakiesPage.userId, userId))
      )
      // Les pages épinglées passent en tête, comme les Espaces du rail : l'ordre
      // est décidé ici, pas recomposé par la bibliothèque.
      .orderBy(
        desc(wakiesPage.pinned),
        asc(wakiesPage.createdAt),
        asc(wakiesPage.id)
      )
  );
}

/**
 * Pages du compte dont le titre porte le terme, bornée.
 *
 * Recherche de TITRE, pas plein-texte : une mention `@page` doit nommer ce
 * qu'on invoque, pas interroger le contenu de tout l'atelier. La limite est
 * serveur — le composer n'a que huit lignes à montrer.
 */
export async function rechercherPagesParTitre(
  userId: string,
  terme: string,
  limite = 8
): Promise<WakiePageRow[]> {
  const nettoye = terme.trim().toLowerCase();
  if (!nettoye) return [];
  await dbReady();
  return getDb()
    .select()
    .from(wakiesPage)
    .where(
      and(
        eq(wakiesPage.userId, userId),
        ilike(wakiesPage.title, `%${nettoye}%`)
      )
    )
    .orderBy(asc(wakiesPage.createdAt), asc(wakiesPage.id))
    .limit(Math.min(Math.max(limite, 1), 20));
}

export async function findPage(
  userId: string,
  pageId: string
): Promise<WakiePageRow | null> {
  await dbReady();
  const [row] = await getDb()
    .select()
    .from(wakiesPage)
    .where(and(eq(wakiesPage.id, pageId), eq(wakiesPage.userId, userId)))
    .limit(1);
  return row ?? null;
}

/** Page d'un espace du compte : la lecture.Combine les deux gardes. */
export async function findPageInSpace(
  userId: string,
  spaceId: string,
  pageId: string
): Promise<WakiePageRow | null> {
  await dbReady();
  const [row] = await getDb()
    .select()
    .from(wakiesPage)
    .where(
      and(
        eq(wakiesPage.id, pageId),
        eq(wakiesPage.spaceId, spaceId),
        eq(wakiesPage.userId, userId)
      )
    )
    .limit(1);
  return row ?? null;
}

export async function createPage(
  userId: string,
  spaceId: string,
  input: { title: string; content?: string; parentId?: string | null },
  sourceConversationId: string | null = null
): Promise<WakiePageRow> {
  await dbReady();
  if (!(await spaceExists(userId, spaceId))) {
    throw new Error("Espace introuvable.");
  }
  if (input.parentId) {
    const parent = await findPage(userId, input.parentId);
    if (!parent) {
      throw new Error("Page parente introuvable.");
    }
  }
  const [row] = await getDb()
    .insert(wakiesPage)
    .values({
      content: input.content ?? "",
      parentId: input.parentId ?? null,
      sourceConversationId,
      spaceId,
      title: input.title,
      userId,
    })
    .returning();
  return row;
}

/**
 * Mise à jour sous contrôle de révision : une écriture concurrent (deux
 * onglets, ou l'éditeur pendant une régénération) est refusée en 409 plutôt que
 * d'écraser la version la plus récente. C'est le même contrat que le gabarit.
 */
export async function updatePage(
  userId: string,
  pageId: string,
  patch: {
    title?: string;
    content?: string;
    parentId?: string | null;
    expectedRevision: number;
  }
): Promise<WakiePageRow | null> {
  await dbReady();
  const page = await findPage(userId, pageId);
  if (!page) {
    return null;
  }
  if (page.revision !== patch.expectedRevision) {
    return null;
  }
  const parentId =
    patch.parentId === undefined ? page.parentId : patch.parentId;
  if (parentId) {
    const parent = await findPage(userId, parentId);
    if (!parent) {
      throw new Error("Page parente introuvable.");
    }
  }
  const [row] = await getDb()
    .update(wakiesPage)
    .set({
      ...(patch.title === undefined ? {} : { title: patch.title }),
      ...(patch.content === undefined
        ? {}
        : { content: preserveGoalMarker(page.content, patch.content) }),
      parentId,
      revision: page.revision + 1,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(wakiesPage.id, pageId),
        eq(wakiesPage.userId, userId),
        eq(wakiesPage.revision, patch.expectedRevision)
      )
    )
    .returning();
  return row ?? null;
}

/**
 * Épingle une page sans toucher à sa révision.
 *
 * Épingler n'est pas éditer : faire varier `revision` ferait perdre à un autre
 * onglet ouvert sur la page sa sauvegarde au prochain enregistrement (409).
 */
export async function togglePagePin(
  userId: string,
  pageId: string,
  pinned: boolean
): Promise<boolean> {
  await dbReady();
  const [row] = await getDb()
    .update(wakiesPage)
    .set({ pinned, updatedAt: new Date() })
    .where(and(eq(wakiesPage.id, pageId), eq(wakiesPage.userId, userId)))
    .returning({ id: wakiesPage.id });
  return Boolean(row);
}

/**
 * Règle la lecture d'une page, sans toucher à sa révision : même argument que
 * pour l'épingle. Un réglage d'affichage écrit par le menu ne doit pas faire
 * échouer l'onglet qui est en train d'écrire le contenu.
 */
export async function setPageSettings(
  userId: string,
  pageId: string,
  settings: PageSettings | null
): Promise<boolean> {
  await dbReady();
  const [row] = await getDb()
    .update(wakiesPage)
    .set({ settings, updatedAt: new Date() })
    .where(and(eq(wakiesPage.id, pageId), eq(wakiesPage.userId, userId)))
    .returning({ id: wakiesPage.id });
  return Boolean(row);
}

/** Supprime une page et ses sous-pages, après vérification de propriété. */
export async function deletePage(
  userId: string,
  pageId: string
): Promise<boolean> {
  await dbReady();
  const page = await findPage(userId, pageId);
  if (!page) return false;
  const pages = await listPages(userId, page.spaceId);
  const descendants = new Set([page.id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const candidate of pages) {
      if (
        candidate.parentId &&
        descendants.has(candidate.parentId) &&
        !descendants.has(candidate.id)
      ) {
        descendants.add(candidate.id);
        changed = true;
      }
    }
  }
  await getDb()
    .delete(wakiesPage)
    .where(
      and(
        eq(wakiesPage.userId, userId),
        inArray(wakiesPage.id, [...descendants])
      )
    );
  return true;
}

/**
 * Enregistrement issu d'une revue « Approuver et enregistrer » : la clé
 * (conversation, appel d'outil) rend l'opération idempotente, donc un
 * double-clic ne crée pas deux pages.
 */
export async function createReviewedPage(
  userId: string,
  input: {
    conversationId: string;
    toolCallId: string;
    spaceId: string;
    title: string;
    content?: string;
    parentId?: string | null;
  }
): Promise<{ page: WakiePageRow; created: boolean }> {
  await dbReady();
  const [recu] = await getDb()
    .select()
    .from(wakiesPageReview)
    .where(
      and(
        eq(wakiesPageReview.conversationId, input.conversationId),
        eq(wakiesPageReview.toolCallId, input.toolCallId)
      )
    )
    .limit(1);
  if (recu) {
    if (recu.spaceId !== input.spaceId) {
      throw new Error(
        "Cette revue a déjà été enregistrée dans un autre espace."
      );
    }
    const page = await findPage(userId, recu.pageId);
    if (!page) {
      throw new Error("Page enregistrée introuvable.");
    }
    return { created: false, page };
  }
  const page = await createPage(
    userId,
    input.spaceId,
    {
      content: input.content,
      parentId: input.parentId,
      title: input.title,
    },
    input.conversationId
  );
  await getDb()
    .insert(wakiesPageReview)
    .values({
      conversationId: input.conversationId,
      pageId: page.id,
      spaceId: input.spaceId,
      toolCallId: input.toolCallId,
    })
    .onConflictDoNothing();
  return { created: true, page };
}

export async function reviewReceipt(
  conversationId: string,
  toolCallId: string
): Promise<{ pageId: string; spaceId: string } | null> {
  await dbReady();
  const [row] = await getDb()
    .select()
    .from(wakiesPageReview)
    .where(
      and(
        eq(wakiesPageReview.conversationId, conversationId),
        eq(wakiesPageReview.toolCallId, toolCallId)
      )
    )
    .limit(1);
  return row ? { pageId: row.pageId, spaceId: row.spaceId } : null;
}

// ─── Conversations de page ──────────────────────────────────────────────────

export async function pageConversation(
  pageId: string,
  wakieId: string
): Promise<{ conversationId: string; ready: boolean } | null> {
  await dbReady();
  const [row] = await getDb()
    .select()
    .from(wakiesPageConversation)
    .where(
      and(
        eq(wakiesPageConversation.pageId, pageId),
        eq(wakiesPageConversation.wakieId, wakieId)
      )
    )
    .limit(1);
  return row ? { conversationId: row.conversationId, ready: row.ready } : null;
}

/**
 * Réserve la création d'une conversation de page pendant une minute : deux
 * onglets ouverts sur la même page ne lancent pas deux conversations.
 */
export async function reservePageConversation(
  pageId: string,
  wakieId: string,
  conversationId: string
): Promise<boolean> {
  await dbReady();
  const db = getDb();
  await db
    .insert(wakiesPageConversation)
    .values({ conversationId, leaseUntil: new Date(), pageId, wakieId })
    .onConflictDoNothing();
  const reservees = await db
    .update(wakiesPageConversation)
    .set({ leaseUntil: new Date(Date.now() + 60_000) })
    .where(
      and(
        eq(wakiesPageConversation.pageId, pageId),
        eq(wakiesPageConversation.wakieId, wakieId),
        eq(wakiesPageConversation.ready, false),
        lte(wakiesPageConversation.leaseUntil, new Date())
      )
    )
    .returning({ conversationId: wakiesPageConversation.conversationId });
  return reservees.length > 0;
}

export async function finishPageConversation(
  pageId: string,
  wakieId: string
): Promise<void> {
  await dbReady();
  await getDb()
    .update(wakiesPageConversation)
    .set({ ready: true })
    .where(
      and(
        eq(wakiesPageConversation.pageId, pageId),
        eq(wakiesPageConversation.wakieId, wakieId)
      )
    );
}

export async function releasePageConversation(
  pageId: string,
  wakieId: string
): Promise<void> {
  await dbReady();
  await getDb()
    .update(wakiesPageConversation)
    .set({ leaseUntil: new Date(0) })
    .where(
      and(
        eq(wakiesPageConversation.pageId, pageId),
        eq(wakiesPageConversation.wakieId, wakieId),
        eq(wakiesPageConversation.ready, false)
      )
    );
}

/** Page « chauffée » pour cette conversation (c'est elle qu'elle éditionne). */
export async function pageForConversation(
  userId: string,
  conversationId: string
): Promise<WakiePageRow | null> {
  await dbReady();
  const [row] = await getDb()
    .select({ pageId: wakiesPageConversation.pageId })
    .from(wakiesPageConversation)
    .where(
      and(
        eq(wakiesPageConversation.conversationId, conversationId),
        eq(wakiesPageConversation.ready, true)
      )
    )
    .limit(1);
  return row ? findPage(userId, row.pageId) : null;
}
