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

type Db = ReturnType<typeof getDb>;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

async function lockPageTree(tx: Tx, userId: string): Promise<void> {
  // Sérialise créations et déplacements d'un même compte : le quota global,
  // la vérification de parenté et la détection de cycle ne peuvent pas être
  // contournés par deux écritures simultanées.
  await tx.execute(
    sql`SELECT pg_advisory_xact_lock(hashtext(${`wakies-pages:${userId}`}))`
  );
}

async function createPageInTransaction(
  tx: Tx,
  userId: string,
  spaceId: string,
  input: { title: string; content?: string; parentId?: string | null },
  sourceConversationId: string | null,
  quota: number | null
): Promise<WakiePageRow> {
  await lockPageTree(tx, userId);

  const [space] = await tx
    .select({ id: wakiesSpace.id })
    .from(wakiesSpace)
    .where(and(eq(wakiesSpace.id, spaceId), eq(wakiesSpace.userId, userId)))
    .limit(1);
  if (!space) {
    throw new Error("Espace introuvable.");
  }

  if (input.parentId) {
    const [parent] = await tx
      .select({ id: wakiesPage.id, spaceId: wakiesPage.spaceId })
      .from(wakiesPage)
      .where(
        and(eq(wakiesPage.id, input.parentId), eq(wakiesPage.userId, userId))
      )
      .limit(1);
    if (!parent || parent.spaceId !== spaceId) {
      // Un parent d'un autre Espace (ou disparu) rendrait la hiérarchie
      // incohérente : refus explicite, jamais de rattachement silencieux.
      throw new Error(
        "Page parente introuvable dans cet espace ou accès refusé."
      );
    }
  }

  // Quota GLOBAL du compte, tous Espaces confondus.
  if (quota !== null) {
    const [row] = await tx
      .select({ value: count() })
      .from(wakiesPage)
      .where(eq(wakiesPage.userId, userId));
    const used = Number(row?.value ?? 0);
    if (used >= quota) {
      throw new WakiesQuotaError("pages", quota, used);
    }
  }

  const [created] = await tx
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
  return created;
}

/**
 * Crée une page sous quota ATOMIQUE (verrou par compte + comptage global).
 * Tous les chemins de création passent par ici : création manuelle, conversion
 * de conversation, message enregistré en page, revue approuvée.
 */
export async function createPage(
  userId: string,
  spaceId: string,
  input: { title: string; content?: string; parentId?: string | null },
  options: { quota: number | null; sourceConversationId?: string | null }
): Promise<WakiePageRow> {
  await dbReady();
  return getDb().transaction((tx) =>
    createPageInTransaction(
      tx,
      userId,
      spaceId,
      input,
      options.sourceConversationId ?? null,
      options.quota
    )
  );
}

/**
 * Mise à jour sous contrôle de révision : une écriture concurrente (deux
 * onglets, ou l'éditeur pendant une régénération) est refusée en 409 plutôt que
 * d'écraser la version la plus récente. C'est le même contrat que le gabarit.
 *
 * Hiérarchie : le parent doit appartenir au même compte ET au même Espace que
 * l'enfant. Le verrou `FOR UPDATE` et le verrou d'arbre sérialisent deux
 * déplacements concurrents ; un cycle (ou l'auto-parentage) est refusé.
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
  return getDb().transaction(async (tx) => {
    await lockPageTree(tx, userId);
    const [page] = await tx
      .select()
      .from(wakiesPage)
      .where(and(eq(wakiesPage.id, pageId), eq(wakiesPage.userId, userId)))
      .for("update");
    if (!page) {
      return null;
    }
    if (page.revision !== patch.expectedRevision) {
      return null;
    }
    const parentId =
      patch.parentId === undefined ? page.parentId : patch.parentId;

    if (parentId) {
      if (parentId === pageId) {
        throw new Error("Une page ne peut pas être sa propre parente.");
      }
      const [parent] = await tx
        .select({ id: wakiesPage.id, spaceId: wakiesPage.spaceId })
        .from(wakiesPage)
        .where(and(eq(wakiesPage.id, parentId), eq(wakiesPage.userId, userId)))
        .limit(1);
      if (!parent || parent.spaceId !== page.spaceId) {
        throw new Error(
          "Page parente introuvable dans cet espace ou accès refusé."
        );
      }
      // Remonter la chaîne : le nouveau parent ne doit pas être un descendant
      // de la page déplacée.
      let cursor: string | null = parentId;
      const visited = new Set<string>();
      while (cursor && !visited.has(cursor)) {
        if (cursor === pageId) {
          throw new Error(
            "Déplacement impossible : le parent choisi est un descendant de cette page."
          );
        }
        visited.add(cursor);
        const [ancestor] = await tx
          .select({ parentId: wakiesPage.parentId })
          .from(wakiesPage)
          .where(and(eq(wakiesPage.id, cursor), eq(wakiesPage.userId, userId)))
          .limit(1);
        cursor = ancestor?.parentId ?? null;
      }
    }

    const [row] = await tx
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
  });
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
  return getDb().transaction(async (tx) => {
    await lockPageTree(tx, userId);
    const [page] = await tx
      .select()
      .from(wakiesPage)
      .where(and(eq(wakiesPage.id, pageId), eq(wakiesPage.userId, userId)))
      .limit(1);
    if (!page) return false;
    const pages = await tx
      .select({ id: wakiesPage.id, parentId: wakiesPage.parentId })
      .from(wakiesPage)
      .where(
        and(eq(wakiesPage.userId, userId), eq(wakiesPage.spaceId, page.spaceId))
      );
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
    await tx
      .delete(wakiesPage)
      .where(
        and(
          eq(wakiesPage.userId, userId),
          inArray(wakiesPage.id, [...descendants])
        )
      );
    return true;
  });
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
  },
  options: { quota: number | null }
): Promise<{ page: WakiePageRow; created: boolean }> {
  await dbReady();
  return getDb().transaction(async (tx) => {
    // Deux approbations simultanées du même appel d'outil se sérialisent :
    // une seule crée la page, l'autre relit le reçu et ne consomme AUCUNE
    // place de quota supplémentaire.
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${`wakies-review:${input.conversationId}:${input.toolCallId}`}))`
    );
    const [recu] = await tx
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
      const [page] = await tx
        .select()
        .from(wakiesPage)
        .where(
          and(eq(wakiesPage.id, recu.pageId), eq(wakiesPage.userId, userId))
        )
        .limit(1);
      if (!page) {
        throw new Error("Page enregistrée introuvable.");
      }
      return { created: false, page };
    }

    const page = await createPageInTransaction(
      tx,
      userId,
      input.spaceId,
      {
        content: input.content,
        parentId: input.parentId,
        title: input.title,
      },
      input.conversationId,
      options.quota
    );
    await tx
      .insert(wakiesPageReview)
      .values({
        conversationId: input.conversationId,
        pageId: page.id,
        spaceId: input.spaceId,
        toolCallId: input.toolCallId,
      })
      .onConflictDoNothing();
    return { created: true, page };
  });
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
