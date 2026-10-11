import "server-only";

/**
 * Accès aux données de l'application Wakies.
 *
 * Le gabarit (`apps/wakies`) stockait tout dans deux bases SQLite : `Store`
 * (réglages, tâches, exécutions, événements, mémoires) et `WorkspaceStore`
 * (espaces, Wakies, conversations, appels, pages, ordinateurs). Le port les
 * réunit dans PostgreSQL : une seule base, une seule migration, et des
 * transactions réelles là où SQLite empilait des `BEGIN IMMEDIATE`.
 *
 * RÈGLE ABSOLUE : `userId` est le compte mAI, et AUCUNE fonction ne lit une
 * ligne sans lui. Le gabarit s'appuyait sur un `OWNER_TOKEN` unique et un
 * `ownerId` constant ; ici, l'isolation entre comptes est la seule chose qui
 * empêche un utilisateur de lire les espaces ou les conversations d'un autre.
 * C'est pourquoi le `userId` est un premier paramètre partout, jamais une
 * option : une fonction sans `userId` ne peut pas forgets de filtrer, elle n'a
 * pas d'existence.
 */

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

// ─── Réglages ───────────────────────────────────────────────────────────────

const REGLAGES_PAR_DEFAUT = {
  memoryAllowed: true,
  name: "Wakie",
  paused: false,
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

export async function createSpace(
  userId: string,
  input: { name: string; description?: string }
): Promise<WakieSpaceRow> {
  await dbReady();
  const [row] = await getDb()
    .insert(wakiesSpace)
    .values({
      description: input.description ?? "",
      name: input.name,
      userId,
    })
    .returning();
  return row;
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

// ─── Wakies ─────────────────────────────────────────────────────────────────

export async function listWakies(userId: string): Promise<WakieWithSpaces[]> {
  await dbReady();
  const db = getDb();
  const rows = await db
    .select()
    .from(wakiesWakie)
    .where(eq(wakiesWakie.userId, userId))
    .orderBy(asc(wakiesWakie.createdAt));
  if (rows.length === 0) {
    return [];
  }
  const grants = await db
    .select()
    .from(wakiesWakieSpace)
    .where(
      inArray(
        wakiesWakieSpace.wakieId,
        rows.map((row) => row.id)
      )
    )
    .orderBy(asc(wakiesWakieSpace.spaceId));
  const parWakie = new Map<string, string[]>();
  for (const grant of grants) {
    const liste = parWakie.get(grant.wakieId) ?? [];
    liste.push(grant.spaceId);
    parWakie.set(grant.wakieId, liste);
  }
  return rows.map((row) => ({
    ...row,
    spaceIds: parWakie.get(row.id) ?? [],
  }));
}

export async function findWakie(
  userId: string,
  wakieId: string
): Promise<WakieWithSpaces | null> {
  const [wakie] = await listWakies(userId).then((rows) =>
    rows.filter((row) => row.id === wakieId)
  );
  return wakie ?? null;
}

/**
 * Erreur de quota levée par `createWakie`. Type distincte d'un `Error` simple
 * pour que l'appelant sache qu'il doit répondre 429 et non 400 : refuser un
 * quota et refuser une saisie invalide sont deux échecs différents.
 */
export class WakiesQuotaError extends Error {
  readonly limite: number;
  readonly utilise: number;
  constructor(limite: number, utilise: number) {
    super("Limite de Wakies atteinte pour ce forfait.");
    this.name = "WakiesQuotaError";
    this.limite = limite;
    this.utilise = utilise;
  }
}

/**
 * Verrou consultatif de transaction, dérivé du compte.
 *
 * `hashtext` n'existe pas côté JavaScript ; on fait donc le hachage ici. Une
 * collision entre deux comptes ne coûte qu'un bref blocage mutuel à la
 * création — bien moins cher qu'un quota dépassé, et la propriété d'un compte
 * ne dépend d'aucun index unique sur le nombre de lignes.
 *
 * Le verrou est pris dans la transaction et relâché à la fin : `pg_advisory_xact_lock`
 * est justement le variante transactionnelle, rien à libérer à la main.
 */
function hashCompte(userId: string): bigint {
  let hash = 2_166_136_261;
  for (let i = 0; i < userId.length; i++) {
    hash ^= userId.charCodeAt(i);
    hash = Math.imul(hash, 16_777_619);
  }
  return BigInt(hash >>> 0);
}

/**
 * Crée un Wakie en respectant le quota du forfait, TOUT EN UN SEUL passage.
 *
 * AVANT, le quota était vérifié par la route (`COUNT` puis `INSERT` dans deux
 * transactions distinctes). Deux créations simultanées sur un compte à
 * `quota - 1` lisaient le même compte et passaient toutes deux : le forfait
 * Plus (6 Wakies) pouvait en créer 7.
 *
 * MAINTENANT, le verrou est pris AVANT le comptage et tenu jusqu'à la fin de
 * l'insertion. La seconde requête concurrente attend, puis recompte et voit
 * la ligne de la première. Un `SERIALIZABLE` ferait la même chose mais
 * exigerait de renvoyer l'appelant sur une erreur `40001` à rejouer — un
 * quota dépassé deviendrait une panne intermittente.
 *
 * `quota: null` = illimité (forfait Max) : on court-circuite le comptage, qui
 * coûterait un aller-retour pour rien.
 */
export async function createWakie(
  userId: string,
  input: {
    spaceId: string;
    spaceIds?: string[];
    name: string;
    instructions: string;
    researchAllowed: boolean;
    memoryAllowed: boolean;
    accent?: string | null;
    avatar?: string | null;
    clonedFromWakieId?: string | null;
    model?: string | null;
    learningContainerId?: string | null;
    skillDeliveryEnabled?: boolean;
    mcpServerIds?: string[] | null;
    pluginIds?: string[] | null;
    skillIds?: string[] | null;
    skillParams?: Record<string, Record<string, string>> | null;
    toolIds?: string[] | null;
  },
  quota: number | null = null
): Promise<WakieWithSpaces> {
  await dbReady();
  const db = getDb();
  const spaceIds = [...new Set(input.spaceIds ?? [input.spaceId])].sort();
  if (
    !spaceIds.includes(input.spaceId) ||
    !(await spaceExists(userId, input.spaceId))
  ) {
    throw new Error("L'espace de destination doit exister sur ce compte.");
  }
  for (const spaceId of spaceIds) {
    if (!(await spaceExists(userId, spaceId))) {
      throw new Error("Espace inconnu sur ce compte.");
    }
  }
  return db.transaction(async (tx) => {
    if (quota !== null) {
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(${hashCompte(userId)})`
      );
      const [{ total }] = await tx
        .select({ total: sql<number>`count(*)::int` })
        .from(wakiesWakie)
        .where(eq(wakiesWakie.userId, userId));
      const utilise = Number(total ?? 0);
      if (utilise >= quota) {
        throw new WakiesQuotaError(quota, utilise);
      }
    }
    const [insere] = await tx
      .insert(wakiesWakie)
      .values({
        accent: input.accent ?? null,
        avatar: input.avatar ?? null,
        clonedFromWakieId: input.clonedFromWakieId ?? null,
        instructions: input.instructions,
        learningContainerId: input.learningContainerId ?? null,
        mcpServerIds: input.mcpServerIds ?? null,
        memoryAllowed: input.memoryAllowed,
        model: input.model ?? null,
        name: input.name,
        pluginIds: input.pluginIds ?? null,
        researchAllowed: input.researchAllowed,
        skillDeliveryEnabled: input.skillDeliveryEnabled ?? false,
        skillIds: input.skillIds ?? null,
        skillParams: input.skillParams ?? null,
        spaceId: input.spaceId,
        toolIds: input.toolIds ?? null,
        userId,
      })
      .returning();
    await tx
      .insert(wakiesWakieSpace)
      .values(spaceIds.map((spaceId) => ({ spaceId, wakieId: insere.id })));
    return { ...insere, spaceIds };
  });
}

/**
 * Colonnes de sélection d'outils à écrire, pour un Wakie comme pour une
 * conversation.
 *
 * Seule la sémantique compte ici : un champ ABSENT du patch (`undefined`) ne
 * doit produire aucune écriture. C'est ce qui distingue un `PUT` qui ne change
 * que le nom d'un `PATCH` qui vide la sélection — les deux appellent pourtant
 * la même fonction.
 */
function selectionPatch(
  actuel: Record<string, unknown>,
  patch: Record<string, unknown>
): Record<string, string[] | null | Record<string, Record<string, string>>> {
  const ecrit: Record<
    string,
    string[] | null | Record<string, Record<string, string>>
  > = {};
  for (const champ of [
    "mcpServerIds",
    "pluginIds",
    "skillIds",
    "skillParams",
    "toolIds",
  ] as const) {
    const valeur = patch[champ];
    if (valeur !== undefined) {
      ecrit[champ] = valeur as string[] | null;
    } else if (actuel[champ] !== undefined) {
      // La colonne existe déjà : on la réécrit à l'identique pour ne pas
      // dépendre du comportement par défaut de Drizzle sur un INSERT partial.
      ecrit[champ] = actuel[champ] as string[] | null;
    }
  }
  return ecrit;
}

export async function updateWakie(
  userId: string,
  wakieId: string,
  patch: {
    name: string;
    instructions: string;
    researchAllowed: boolean;
    memoryAllowed: boolean;
    avatar?: string | null;
    model?: string | null;
    spaceId?: string;
    spaceIds?: string[];
    learningContainerId?: string | null;
    skillDeliveryEnabled?: boolean;
    // Sélection d'outils. `undefined` = conserver la valeur actuelle,
    // `null` = effacer le réglage, `[]` = choix explicite de ne rien utiliser.
    mcpServerIds?: string[] | null;
    pluginIds?: string[] | null;
    skillIds?: string[] | null;
    skillParams?: Record<string, Record<string, string>> | null;
    toolIds?: string[] | null;
  }
): Promise<WakieWithSpaces> {
  await dbReady();
  const db = getDb();
  const actuel = await findWakie(userId, wakieId);
  if (!actuel) {
    throw new Error("Wakie introuvable.");
  }
  const spaceParDefaut = patch.spaceId ?? actuel.spaceId;
  if (!spaceParDefaut) {
    throw new Error("Un Wakie doit garder une destination de page.");
  }
  const spaceIds = [...new Set(patch.spaceIds ?? actuel.spaceIds)].sort();
  if (!spaceIds.includes(spaceParDefaut)) {
    throw new Error("L'accès doit inclure la destination de page.");
  }
  for (const spaceId of spaceIds) {
    if (!(await spaceExists(userId, spaceId))) {
      throw new Error("Espace inconnu sur ce compte.");
    }
  }
  const [row] = await db.transaction(async (tx) => {
    const [misAJour] = await tx
      .update(wakiesWakie)
      .set({
        avatar: patch.avatar === undefined ? actuel.avatar : patch.avatar,
        instructions: patch.instructions,
        learningContainerId:
          patch.learningContainerId === undefined
            ? actuel.learningContainerId
            : patch.learningContainerId,
        memoryAllowed: patch.memoryAllowed,
        model: patch.model === undefined ? actuel.model : patch.model,
        name: patch.name,
        researchAllowed: patch.researchAllowed,
        skillDeliveryEnabled:
          patch.skillDeliveryEnabled ?? actuel.skillDeliveryEnabled,
        spaceId: spaceParDefaut,
        // Même règle que sur une conversation : absent = conserver, `null` =
        // effacer le réglage. Un PATCH qui ne porte que le nom ne doit pas
        // vider le plateau d'outils du Wakie.
        ...selectionPatch(actuel, patch),
      })
      .where(and(eq(wakiesWakie.id, wakieId), eq(wakiesWakie.userId, userId)))
      .returning();
    await tx
      .delete(wakiesWakieSpace)
      .where(eq(wakiesWakieSpace.wakieId, wakieId));
    await tx
      .insert(wakiesWakieSpace)
      .values(spaceIds.map((spaceId) => ({ spaceId, wakieId })));
    return [misAJour];
  });
  return { ...row, spaceIds };
}

/**
 * Supprime un Wakie du compte. Conversations, messages, appels, captures et
 * accès aux espaces partent en cascade (clés étrangères `on delete cascade`) :
 * rien à nettoyer à la main, et un identifiant d'un autre compte n'efface rien.
 *
 * Le DERNIER Wakie peut être supprimé : l'interface affiche alors l'écran
 * « aucun Wakie » et propose d'en créer un, plutôt que de ressusciter un
 * Wakie de départ que l'utilisateur vient de retirer.
 */
export async function deleteWakie(
  userId: string,
  wakieId: string
): Promise<boolean> {
  await dbReady();
  const rows = await getDb()
    .delete(wakiesWakie)
    .where(and(eq(wakiesWakie.id, wakieId), eq(wakiesWakie.userId, userId)))
    .returning({ id: wakiesWakie.id });
  return rows.length > 0;
}

/** Le Wakie a-t-il le droit d'écrire dans cet espace ? */
export async function wakieCanAccessSpace(
  userId: string,
  wakieId: string,
  spaceId: string
): Promise<boolean> {
  await dbReady();
  const [row] = await getDb()
    .select({ spaceId: wakiesWakieSpace.spaceId })
    .from(wakiesWakieSpace)
    .innerJoin(wakiesWakie, eq(wakiesWakie.id, wakiesWakieSpace.wakieId))
    .where(
      and(
        eq(wakiesWakieSpace.wakieId, wakieId),
        eq(wakiesWakieSpace.spaceId, spaceId),
        eq(wakiesWakie.userId, userId)
      )
    )
    .limit(1);
  return Boolean(row);
}

// ─── Conversations ──────────────────────────────────────────────────────────

/** Une première relève fixe la borne sans notifier l'historique déjà présent. */
export async function releverNotifications(userId: string, after?: number) {
  await dbReady();
  const db = getDb();
  if (after === undefined) {
    const [borne] = await db
      .select({
        seq: sql<number>`coalesce(max(${wakiesNotification.seq}), 0)::int`,
      })
      .from(wakiesNotification)
      .where(eq(wakiesNotification.userId, userId));
    return { cursor: borne?.seq ?? 0, notifications: [] };
  }
  const rows = await db
    .select({
      conversationId: wakiesMessage.conversationId,
      id: wakiesMessage.id,
      muted: wakiesConversation.muted,
      parts: wakiesMessage.parts,
      seq: wakiesNotification.seq,
      title: wakiesConversation.title,
    })
    .from(wakiesNotification)
    .innerJoin(
      wakiesMessage,
      eq(wakiesMessage.id, wakiesNotification.messageId)
    )
    .innerJoin(
      wakiesConversation,
      eq(wakiesConversation.id, wakiesMessage.conversationId)
    )
    .where(
      and(
        eq(wakiesConversation.userId, userId),
        eq(wakiesNotification.userId, userId),
        eq(wakiesMessage.role, "assistant"),
        gt(wakiesNotification.seq, after)
      )
    )
    .orderBy(asc(wakiesNotification.seq))
    .limit(100);
  return {
    cursor: rows.at(-1)?.seq ?? after,
    notifications: rows.map(({ parts, ...row }) => ({
      ...row,
      preview: apercuMessage(parts),
    })),
  };
}

/**
 * Conversation telle que la LISTE la sert : la ligne, plus ce qu'une liste de
 * messagerie doit montrer — aperçu du dernier message, horodatage, compteur de
 * non-lus et participants.
 *
 * Pourquoi ces champs sont calculés ICI et pas dans l'interface : la page ne
 * doit pas ouvrir chaque conversation pour afficher son aperçu, et le compteur
 * de non-lus se déduit du curseur `lastReadSeq` côté serveur (le client ne
 * recalcule jamais une limite ou un état de lecture).
 */
export type WakieConversationListee = WakieConversationRow & {
  apercuDernierMessage: string;
  auteurDernierWakieId: string | null;
  dernierMessageAt: Date | null;
  dernierMessageId: string | null;
  dernierRole: string | null;
  nonLus: number;
};

export async function listConversations(
  userId: string
): Promise<WakieConversationListee[]> {
  await dbReady();
  const db = getDb();
  const conversations = await db
    .select()
    .from(wakiesConversation)
    .where(
      and(
        eq(wakiesConversation.userId, userId),
        // Les fils de groupe sont retirés du produit, pas de la base : leurs
        // lignes restent (migrations additives). Sans ce filtre, ils
        // reparaîtraient comme des conversations fantômes dans le rail.
        ne(wakiesConversation.isGroup, true)
      )
    )
    .orderBy(desc(wakiesConversation.createdAt));
  if (conversations.length === 0) return [];
  const ids = conversations.map((row) => row.id);
  // `sql.join` compose une liste de paramètres : les identifiants restent des
  // valeurs liées, jamais du SQL concaténé.
  const liste = sql.join(
    ids.map((id) => sql`${id}::uuid`),
    sql`, `
  );
  // DISTINCT ON : un seul aller-retour pour le DERNIER message de chaque fil.
  const derniers = (await db.execute(sql`
    SELECT DISTINCT ON ("conversationId")
      "conversationId", "id", "role", "authorWakieId", "parts", "createdAt"
    FROM "WakiesMessage"
    WHERE "conversationId" IN (${liste})
    ORDER BY "conversationId", "seq" DESC
  `)) as unknown as Array<{
    authorWakieId: string | null;
    conversationId: string;
    createdAt: Date;
    id: string;
    parts: unknown;
    role: string;
  }>;
  const nonLus = await db
    .select({
      conversationId: wakiesMessage.conversationId,
      total: sql<number>`count(*)::int`,
    })
    .from(wakiesMessage)
    .innerJoin(
      wakiesConversation,
      eq(wakiesConversation.id, wakiesMessage.conversationId)
    )
    .where(
      and(
        eq(wakiesConversation.userId, userId),
        gt(wakiesMessage.seq, wakiesConversation.lastReadSeq),
        // Mes propres messages ne sont jamais « non lus ».
        sql`${wakiesMessage.role} <> 'user'`
      )
    )
    .groupBy(wakiesMessage.conversationId);
  const parDernier = new Map(derniers.map((row) => [row.conversationId, row]));
  const parNonLus = new Map(
    nonLus.map((row) => [row.conversationId, row.total])
  );
  return conversations.map((row) => {
    const dernier = parDernier.get(row.id);
    return {
      ...row,
      apercuDernierMessage: dernier ? apercuMessage(dernier.parts) : "",
      auteurDernierWakieId: dernier?.authorWakieId ?? null,
      dernierMessageAt: dernier?.createdAt ?? null,
      dernierMessageId: dernier?.id ?? null,
      dernierRole: dernier?.role ?? null,
      nonLus: parNonLus.get(row.id) ?? 0,
    };
  });
}

export async function createConversation(
  userId: string,
  input: { wakieId: string; title: string; model?: string | null }
): Promise<WakieConversationRow> {
  await dbReady();
  const wakie = await findWakie(userId, input.wakieId);
  if (!wakie) {
    throw new Error("Wakie introuvable.");
  }
  const [row] = await getDb()
    .insert(wakiesConversation)
    .values({
      learningContainerId: wakie.learningContainerId ?? null,
      // Le modèle du Wakie est le DÉFAUT de ses nouvelles conversations ; la
      // conversation en garde une copie, donc changer le Wakie ne réécrit pas
      // le modèle des fils existants (et donc leur facturation).
      model: input.model ?? wakie.model ?? null,
      // À CONTRAIRE des colonnes de sélection d'outils, qui restent à NULL.
      // Ce n'est pas un oubli : le modèle est FIGÉ à la création parce qu'il
      // détermine ce qui a été facturé aux tours déjà joués, alors qu'un outil
      // ne coûte qu'au tour où il est appelé. NULL y signifie « suit le
      // Wakie », donc corriger la sélection d'un Wakie corrige aussi ses
      // conversations qui n'ont jamais rien choisi — comportement voulu, et le
      // seul qui rende `null` et `[]` distinguables.
      title: input.title,
      userId,
      wakieId: input.wakieId,
    })
    .returning();
  return row;
}

/**
 * Met à jour une conversation du compte.
 *
 * Les champs absents ne sont pas touchés : le renommage et le choix du modèle
 * sont deux gestes indépendants, et un PATCH qui n'en porte qu'un ne doit pas
 * écraser l'autre. `model: null` revient au modèle du Wakie (puis au défaut) :
 * c'est un choix explicite, pas une absence de valeur.
 *
 * Il en va de même pour la sélection d'outils : `undefined` = conserver,
 * `null` = revenir au réglage du Wakie, `[]` = ne rien utiliser. Le formulaire
 * et son adaptateur doivent distinguer ces trois intentions — les confondre
 * fait qu'un simple renommage vide le plateau d'outils de la conversation.
 */
export async function updateConversation(
  userId: string,
  conversationId: string,
  patch: {
    favorite?: boolean;
    muted?: boolean;
    title?: string;
    model?: string | null;
    mcpServerIds?: string[] | null;
    pluginIds?: string[] | null;
    skillIds?: string[] | null;
    skillParams?: Record<string, Record<string, string>> | null;
    toolIds?: string[] | null;
    /** Contexte durable réglé par `@@` (migration 0053). */
    contextPageIds?: string[] | null;
    contextSpaceIds?: string[] | null;
    contextWakieIds?: string[] | null;
  }
): Promise<WakieConversationRow | null> {
  await dbReady();
  const changes: Partial<typeof wakiesConversation.$inferInsert> & {
    updatedAt: Date;
  } = {
    updatedAt: new Date(),
  };
  if (patch.title !== undefined) {
    changes.title = patch.title;
  }
  if (patch.favorite !== undefined) changes.favorite = patch.favorite;
  if (patch.muted !== undefined) changes.muted = patch.muted;
  if (patch.model !== undefined) {
    changes.model = patch.model;
  }
  // Chaque colonne est traitée séparément : `undefined` (absent du PATCH) et
  // `null` (« reviens au Wakie ») doivent produire deux écritures différentes.
  for (const champ of [
    "contextPageIds",
    "contextSpaceIds",
    "contextWakieIds",
    "mcpServerIds",
    "pluginIds",
    "skillIds",
    "skillParams",
    "toolIds",
  ] as const) {
    const valeur = patch[champ];
    if (valeur !== undefined) {
      changes[champ] = valeur as never;
    }
  }
  const [row] = await getDb()
    .update(wakiesConversation)
    .set(changes)
    .where(
      and(
        eq(wakiesConversation.id, conversationId),
        eq(wakiesConversation.userId, userId)
      )
    )
    .returning();
  return row ?? null;
}

/** Conversation du compte, ou `null` — le garde-fou d'isolation du port. */
export async function findConversation(
  userId: string,
  conversationId: string
): Promise<WakieConversationRow | null> {
  await dbReady();
  const [row] = await getDb()
    .select()
    .from(wakiesConversation)
    .where(
      and(
        eq(wakiesConversation.id, conversationId),
        eq(wakiesConversation.userId, userId)
      )
    )
    .limit(1);
  return row ?? null;
}

/**
 * Marque la conversation comme modifiée. Prend `userId` comme les autres : un
 * `UPDATE` sans filtre de propriété peut toucher la conversation d'un autre
 * compte, et rien dans la signature ne l'interdisait.
 */
export async function touchConversation(
  userId: string,
  conversationId: string
): Promise<void> {
  await dbReady();
  await getDb()
    .update(wakiesConversation)
    .set({ updatedAt: new Date() })
    .where(
      and(
        eq(wakiesConversation.id, conversationId),
        eq(wakiesConversation.userId, userId)
      )
    );
}

export async function deleteConversation(
  userId: string,
  conversationId: string
): Promise<boolean> {
  await dbReady();
  const rows = await getDb()
    .delete(wakiesConversation)
    .where(
      and(
        eq(wakiesConversation.id, conversationId),
        eq(wakiesConversation.userId, userId)
      )
    )
    .returning({ id: wakiesConversation.id });
  return rows.length > 0;
}

// ─── Messages ───────────────────────────────────────────────────────────────

export type WakieMessageInput = {
  id: string;
  conversationId: string;
  role: string;
  parts: unknown;
  /** Auteur d'une réponse de groupe ; NULL = organisateur du fil. */
  authorWakieId?: string | null;
  /** Message auquel celui-ci répond (citation structurée). */
  replyToId?: string | null;
};

/**
 * PROPRIÉTÉ DES MESSAGES
 *
 * `WakiesMessage` ne porte volontairement PAS de colonne `userId` : un message
 * appartient à une conversation, qui appartient à un compte, et dupliquer la
 * propriété sur chaque ligne serait une seconde vérité à désynchroniser. La
 * propriété se vérifie donc par jointure sur `WakiesConversation.userId`.
 *
 * Les quatre fonctions de messages prenaient auparavant un identifiant seul.
 * C'était une frontière absente : l'appelant devait avoir vérifié la propriété
 * en amont, et rien dans la signature ne le rappelait. Un forget supprimait
 * silencieusement le filtre. Elles prennent maintenant toutes `userId` en
 * premier paramètre, comme le reste du fichier.
 */

/** Les conversations du compte parmi celles du lot. Toute autre est rejetée. */
async function ownedConversationIds(
  userId: string,
  conversationIds: readonly string[]
): Promise<Set<string>> {
  const uniques = [...new Set(conversationIds)];
  if (uniques.length === 0) {
    return new Set();
  }
  await dbReady();
  const rows = await getDb()
    .select({ id: wakiesConversation.id })
    .from(wakiesConversation)
    .where(
      and(
        eq(wakiesConversation.userId, userId),
        inArray(wakiesConversation.id, uniques)
      )
    );
  return new Set(rows.map((row) => row.id));
}

/**
 * Écrit un lot de messages. `onConflictDoNothing` sur l'identifiant rend
 * l'opération sûre à rejouer : un flux interrompu puis renvoyé ne duplique
 * pas les messages déjà persistés.
 *
 * Le lot est EN ATTENDANT vérifié : un `conversationId` qui n'appartient pas
 * au compte fait échouer l'écriture entière plutôt que d'en insérer une
 * partie. Écrire ne doit jamais être partiel sous le doute.
 */
export async function appendMessages(
  userId: string,
  messages: WakieMessageInput[]
): Promise<void> {
  if (messages.length === 0) {
    return;
  }
  const autorisees = await ownedConversationIds(
    userId,
    messages.map((message) => message.conversationId)
  );
  const intruses = messages.filter(
    (message) => !autorisees.has(message.conversationId)
  );
  if (intruses.length > 0) {
    throw new Error("Conversation introuvable sur ce compte.");
  }
  await dbReady();
  await getDb()
    .insert(wakiesMessage)
    .values(messages)
    .onConflictDoNothing({ target: wakiesMessage.id });
}

/**
 * Historique d'une conversation, dans l'ordre d'écriture (`seq`).
 *
 * `seq` est un `serial` : c'est l'ordre d'INSERTION, pas l'horodatage. Deux
 * messages écrits dans la même milliseconde restent donc dans le bon ordre,
 * ce que `createdAt` ne garantit pas.
 *
 * PAGINATION — le curseur est `seq`, pas `createdAt`, et il est STRICTEMENT
 * décroissant. Deux pages successives ne peuvent donc jamais se chevaucher ni
 * sauter un message, même quand plusieurs messages partagent le même
 * horodatage. `limite` est bornée : une conversation longue ne se charge
 * jamais entière en mémoire.
 */
export async function listMessages(
  userId: string,
  conversationId: string,
  options: { avantSeq?: number; apresSeq?: number; limite?: number } = {}
): Promise<(typeof wakiesMessage.$inferSelect)[]> {
  await dbReady();
  const conditions = [
    eq(wakiesMessage.conversationId, conversationId),
    eq(wakiesConversation.userId, userId),
  ];
  if (options.avantSeq !== undefined) {
    conditions.push(lt(wakiesMessage.seq, options.avantSeq));
  }
  if (options.apresSeq !== undefined) {
    conditions.push(gt(wakiesMessage.seq, options.apresSeq));
  }
  const rows = await getDb()
    .select({ message: wakiesMessage })
    .from(wakiesMessage)
    .innerJoin(
      wakiesConversation,
      eq(wakiesMessage.conversationId, wakiesConversation.id)
    )
    .where(and(...conditions))
    .orderBy(
      options.apresSeq === undefined
        ? desc(wakiesMessage.seq)
        : asc(wakiesMessage.seq)
    )
    .limit(Math.min(Math.max(options.limite ?? 200, 1), 501));
  const messages = rows.map((row) => row.message);
  return options.apresSeq === undefined ? messages.reverse() : messages;
}

/** Message déjà écrit ? Utilisé par le flux pour ne pas le réinsérer. */
export async function messageExists(
  userId: string,
  messageId: string
): Promise<boolean> {
  await dbReady();
  const [row] = await getDb()
    .select({ id: wakiesMessage.id })
    .from(wakiesMessage)
    .innerJoin(
      wakiesConversation,
      eq(wakiesMessage.conversationId, wakiesConversation.id)
    )
    .where(
      and(
        eq(wakiesMessage.id, messageId),
        eq(wakiesConversation.userId, userId)
      )
    )
    .limit(1);
  return Boolean(row);
}

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

// ─── Mémoires ───────────────────────────────────────────────────────────────

export async function listMemories(userId: string): Promise<WakieMemoryRow[]> {
  await dbReady();
  return getDb()
    .select()
    .from(wakiesMemory)
    .where(eq(wakiesMemory.userId, userId))
    .orderBy(desc(wakiesMemory.createdAt));
}

export async function saveMemory(
  userId: string,
  text: string,
  id?: string
): Promise<WakieMemoryRow | null> {
  await dbReady();
  const db = getDb();
  if (id) {
    const [row] = await db
      .update(wakiesMemory)
      .set({ text })
      .where(and(eq(wakiesMemory.id, id), eq(wakiesMemory.userId, userId)))
      .returning();
    return row ?? null;
  }
  const [row] = await db
    .insert(wakiesMemory)
    .values({ text, userId })
    .returning();
  return row;
}

export async function deleteMemory(
  userId: string,
  id: string
): Promise<boolean> {
  await dbReady();
  const rows = await getDb()
    .delete(wakiesMemory)
    .where(and(eq(wakiesMemory.id, id), eq(wakiesMemory.userId, userId)))
    .returning({ id: wakiesMemory.id });
  return rows.length > 0;
}

// ─── Appels vocaux ──────────────────────────────────────────────────────────

export async function listCalls(userId: string): Promise<WakieCallRow[]> {
  await dbReady();
  return getDb()
    .select()
    .from(wakiesCall)
    .where(eq(wakiesCall.userId, userId))
    .orderBy(desc(wakiesCall.startedAt));
}

export async function createCall(
  userId: string,
  conversationId: string
): Promise<WakieCallRow | null> {
  await dbReady();
  if (!(await findConversation(userId, conversationId))) {
    return null;
  }
  const [row] = await getDb()
    .insert(wakiesCall)
    .values({ conversationId, userId })
    .returning();
  return row;
}

export async function findCall(
  userId: string,
  callId: string
): Promise<WakieCallRow | null> {
  await dbReady();
  const [row] = await getDb()
    .select()
    .from(wakiesCall)
    .where(and(eq(wakiesCall.id, callId), eq(wakiesCall.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function updateCall(
  userId: string,
  callId: string,
  patch: {
    status?: WakieCallRow["status"];
    transcript?: string;
    error?: string | null;
    anchorMessageId?: string | null;
    endedAt?: Date | null;
  }
): Promise<WakieCallRow | null> {
  await dbReady();
  const [row] = await getDb()
    .update(wakiesCall)
    .set(patch)
    .where(and(eq(wakiesCall.id, callId), eq(wakiesCall.userId, userId)))
    .returning();
  return row ?? null;
}

// ─── Captures ───────────────────────────────────────────────────────────────

export async function getCapture(
  userId: string,
  conversationId: string
): Promise<unknown> {
  await dbReady();
  if (!(await findConversation(userId, conversationId))) {
    return null;
  }
  const [row] = await getDb()
    .select()
    .from(wakiesCapture)
    .where(eq(wakiesCapture.conversationId, conversationId))
    .limit(1);
  return row?.value ?? null;
}

export async function saveCapture(
  userId: string,
  conversationId: string,
  value: unknown
): Promise<void> {
  await dbReady();
  if (!(await findConversation(userId, conversationId))) {
    throw new Error("Conversation introuvable sur ce compte.");
  }
  await getDb()
    .insert(wakiesCapture)
    .values({ conversationId, value })
    .onConflictDoUpdate({
      set: { updatedAt: new Date(), value },
      target: wakiesCapture.conversationId,
    });
}

/**
 * Réservation transactionnelle : le serveur possède l'historique et la clé
 * d'idempotence.
 *
 * `wakieId` est le participant qui répond (lot messagerie) : un tour est
 * réservé par (conversation, message, Wakie), donc N Wakies répondent au même
 * message utilisateur sans se bloquer, mais un rejeu du même Wakie reste un
 * conflit. Le verrou consultatif suit la même granularité : deux Wakies
 * génèrent en parallèle, deux réservations du même Wakie se sérialisent.
 * Absent, il retombe sur l'organisateur du fil (compatibilité 1:1).
 */
export async function reserveChatTurn(
  userId: string,
  conversationId: string,
  messageId: string,
  wakieId?: string
): Promise<
  { conflict: "busy" | "replayed" } | { id: string; responseId: string }
> {
  const conversation = await findConversation(userId, conversationId);
  if (!conversation) throw new Error("Conversation introuvable.");
  const repondant = wakieId ?? conversation.wakieId;
  await dbReady();
  return getDb().transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(${hashCompte(`${userId}:${conversationId}:${repondant}`)})`
    );
    const [replayed] = await tx
      .select()
      .from(wakiesChatTurn)
      .where(
        and(
          eq(wakiesChatTurn.userId, userId),
          eq(wakiesChatTurn.conversationId, conversationId),
          eq(wakiesChatTurn.messageId, messageId),
          eq(wakiesChatTurn.wakieId, repondant)
        )
      )
      .limit(1);
    if (replayed) return { conflict: "replayed" as const };
    const [running] = await tx
      .select()
      .from(wakiesChatTurn)
      .where(
        and(
          eq(wakiesChatTurn.userId, userId),
          eq(wakiesChatTurn.conversationId, conversationId),
          eq(wakiesChatTurn.wakieId, repondant),
          eq(wakiesChatTurn.status, "running"),
          gt(wakiesChatTurn.expiresAt, new Date())
        )
      )
      .limit(1);
    if (running) return { conflict: "busy" as const };
    await tx
      .update(wakiesChatTurn)
      .set({ status: "interrupted" })
      .where(
        and(
          eq(wakiesChatTurn.userId, userId),
          eq(wakiesChatTurn.conversationId, conversationId),
          eq(wakiesChatTurn.wakieId, repondant),
          eq(wakiesChatTurn.status, "running")
        )
      );
    const [turn] = await tx
      .insert(wakiesChatTurn)
      .values({
        conversationId,
        expiresAt: new Date(Date.now() + 360_000),
        messageId,
        userId,
        wakieId: repondant,
      })
      .returning();
    return { id: turn.id, responseId: turn.responseId };
  });
}
export async function finishChatTurn(
  userId: string,
  turnId: string,
  status: "completed" | "interrupted" | "failed"
): Promise<void> {
  await dbReady();
  await getDb().transaction(async (tx) => {
    const [termine] = await tx
      .update(wakiesChatTurn)
      .set({ status })
      .where(
        and(
          eq(wakiesChatTurn.id, turnId),
          eq(wakiesChatTurn.userId, userId),
          eq(wakiesChatTurn.status, "running")
        )
      )
      .returning();
    if (!termine || status !== "completed") return;
    // Les événements d'un même compte sont alloués dans l'ordre des commits :
    // une relève ne peut pas dépasser un événement encore non validé.
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${`wakies-notifications:${userId}`}))`
    );
    const [entree] = await tx
      .select({ seq: wakiesMessage.seq })
      .from(wakiesMessage)
      .where(
        and(
          eq(wakiesMessage.id, termine.messageId),
          eq(wakiesMessage.conversationId, termine.conversationId)
        )
      )
      .limit(1);
    if (!entree) return;
    const reponses = await tx
      .select({ id: wakiesMessage.id })
      .from(wakiesMessage)
      .where(
        and(
          eq(wakiesMessage.conversationId, termine.conversationId),
          gt(wakiesMessage.seq, entree.seq),
          eq(wakiesMessage.role, "assistant")
        )
      );
    if (reponses.length > 0)
      await tx
        .insert(wakiesNotification)
        .values(
          reponses.map((message) => ({
            conversationId: termine.conversationId,
            messageId: message.id,
            userId,
          }))
        )
        .onConflictDoNothing();
  });
}

// ─── Profils sociaux, galerie et amis ─────────────────────────────────────────

/**
 * Pseudo public d'un Wakie (`@pseudo`).
 * Minuscules, chiffres, `_`, `-` et `.`, 3 à 30 caractères : même règle que
 * les pseudos Vibe, pour une recherche globale prévisible.
 */
export function normaliserHandle(handle?: string | null): string | null {
  if (!handle) return null;
  const nettoye = handle.trim().toLowerCase().replace(/^@/, "");
  if (!/^[a-z0-9_.-]{3,30}$/.test(nettoye)) return null;
  return nettoye;
}

export type WakieProfilRow = typeof wakiesWakieProfile.$inferSelect;
export type WakieImageRow = typeof wakiesWakieImage.$inferSelect;
export type WakieAmiRow = typeof wakiesFriend.$inferSelect;

/**
 * Extrait affichable d'une persona PUBLIÉE. Ne lit JAMAIS `instructions`.
 *
 * Repli assumé sur la bio : un propriétaire qui a rempli sa bio mais pas sa
 * persona publie quand même quelque chose de volontaire — l'ordre est donc
 * persona publiée, puis bio, jamais le prompt privé. Vide est un résultat
 * légitime : un Wakie public peut n'avoir rien publié.
 */
export function extraitPersonaPublique(
  source: { bio?: string | null; publicPersona?: string | null },
  max = 600
): string {
  const publiee = (source.publicPersona ?? "").trim();
  if (publiee) return publiee.slice(0, max);
  return (source.bio ?? "").trim().slice(0, max);
}

/**
 * Extrait de contexte pour une mention `@`.
 *
 * L'extrait d'un Wakie POSSÉDÉ peut être ses instructions : c'est le même
 * compte, il n'y a rien à protéger. L'extrait d'un Wakie d'un AUTRE compte
 * (ami) passe par la persona publiée, sans exception — c'est exactement la
 * fuite que cette fonction rend impossible à réintroduire par inadvertance.
 */
export function extraitContexteMention(source: {
  bio?: string | null;
  instructions?: string | null;
  mien: boolean;
  publicPersona?: string | null;
}): string {
  if (source.mien) return (source.instructions ?? "").trim().slice(0, 600);
  return extraitPersonaPublique(source);
}

/** Profil social, créé à la lecture : un Wakie a toujours une fiche affichable. */
export async function ensureProfilWakie(
  userIdOrWakieId: string,
  maybeWakieId?: string
): Promise<WakieProfilRow> {
  const wakieId = maybeWakieId ?? userIdOrWakieId;
  await dbReady();
  const db = getDb();
  const [row] = await db
    .insert(wakiesWakieProfile)
    .values({ wakieId })
    .onConflictDoNothing({ target: wakiesWakieProfile.wakieId })
    .returning();
  if (row) return row;
  const [existant] = await db
    .select()
    .from(wakiesWakieProfile)
    .where(eq(wakiesWakieProfile.wakieId, wakieId))
    .limit(1);
  return existant!;
}

/** Profil public d'un Wakie (annuaire et fiche) : jamais de `userId` en sortie. */
export async function lireProfilPublic(
  wakieId: string
): Promise<WakieProfilRow | null> {
  await dbReady();
  const [row] = await getDb()
    .select()
    .from(wakiesWakieProfile)
    .where(eq(wakiesWakieProfile.wakieId, wakieId))
    .limit(1);
  return row ?? null;
}

export async function mettreAJourProfilWakie(
  userId: string,
  wakieId: string,
  patch: {
    avatarPath?: string | null;
    bannerPath?: string | null;
    bio?: string;
    handle?: string | null;
    isPublic?: boolean;
    links?: string[];
    /** Persona PUBLIÉE : le seul texte exposé aux autres comptes. */
    publicPersona?: string;
  }
): Promise<WakieRow> {
  await dbReady();
  const db = getDb();
  const [wakieExistant] = await db
    .select()
    .from(wakiesWakie)
    .where(and(eq(wakiesWakie.id, wakieId), eq(wakiesWakie.userId, userId)))
    .limit(1);
  if (!wakieExistant) {
    throw new Error("Wakie introuvable sur ce compte.");
  }

  let wakieMaj = wakieExistant;
  if (
    patch.handle !== undefined ||
    patch.isPublic !== undefined ||
    patch.publicPersona !== undefined
  ) {
    const handleVal =
      patch.handle === undefined
        ? wakieExistant.handle
        : patch.handle === null
          ? null
          : normaliserHandle(patch.handle);
    const [maj] = await db
      .update(wakiesWakie)
      .set({
        ...(patch.handle === undefined ? {} : { handle: handleVal }),
        ...(patch.isPublic === undefined ? {} : { isPublic: patch.isPublic }),
        ...(patch.publicPersona === undefined
          ? {}
          : { publicPersona: patch.publicPersona.slice(0, 2000) }),
      })
      .where(and(eq(wakiesWakie.id, wakieId), eq(wakiesWakie.userId, userId)))
      .returning();
    if (maj) wakieMaj = maj;
  }

  if (
    patch.bio !== undefined ||
    patch.avatarPath !== undefined ||
    patch.bannerPath !== undefined ||
    patch.links !== undefined
  ) {
    await ensureProfilWakie(userId, wakieId);
    await db
      .update(wakiesWakieProfile)
      .set({
        ...(patch.bio === undefined ? {} : { bio: patch.bio }),
        ...(patch.avatarPath === undefined
          ? {}
          : { avatarPath: patch.avatarPath }),
        ...(patch.bannerPath === undefined
          ? {}
          : { bannerPath: patch.bannerPath }),
        ...(patch.links === undefined ? {} : { links: patch.links }),
        updatedAt: new Date(),
      })
      .where(eq(wakiesWakieProfile.wakieId, wakieId));
  }
  return wakieMaj;
}

/** Images de la galerie, dans l'ordre d'affichage (`position`, puis création). */
export async function listerImagesWakie(
  wakieId: string,
  options?: { userId?: string; publicSeulement?: boolean }
): Promise<WakieImageRow[]> {
  await dbReady();
  if (options?.publicSeulement) {
    const pub = await trouverWakiePublic(wakieId);
    if (!pub) return [];
  } else if (options?.userId) {
    const mien = await findWakie(options.userId, wakieId);
    if (!mien) return [];
  }
  return getDb()
    .select()
    .from(wakiesWakieImage)
    .where(eq(wakiesWakieImage.wakieId, wakieId))
    .orderBy(asc(wakiesWakieImage.position), asc(wakiesWakieImage.createdAt));
}

export class WakiesImageQuotaError extends Error {
  readonly limite: number;
  readonly utilise: number;
  constructor(limite: number, utilise: number) {
    super(`Limite d'images de profil atteinte (${utilise}/${limite}).`);
    this.name = "WakiesImageQuotaError";
    this.limite = limite;
    this.utilise = utilise;
  }
}

/**
 * Ajoute une image à la galerie en respectant le quota du forfait, sous verrou.
 * Même patron que `createWakie` : le comptage et l'insertion sont atomiques.
 */
export async function ajouterImageWakie(
  userId: string,
  wakieId: string,
  dataOrBlobPathname: string | { blobPathname: string; alt?: string },
  altOrLimite?: string | number | null,
  maybeLimite?: number | null
): Promise<WakieImageRow> {
  let blobPathname: string;
  let alt = "";
  let limite: number | null = null;
  if (typeof dataOrBlobPathname === "object") {
    blobPathname = dataOrBlobPathname.blobPathname;
    alt = dataOrBlobPathname.alt ?? "";
    limite =
      typeof altOrLimite === "number" || altOrLimite === null
        ? altOrLimite
        : null;
  } else {
    blobPathname = dataOrBlobPathname;
    alt = typeof altOrLimite === "string" ? altOrLimite : "";
    limite = maybeLimite === undefined ? null : maybeLimite;
  }
  if (limite === 0) throw new WakiesImageQuotaError(0, 0);
  await dbReady();
  return getDb().transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(${hashCompte(`${userId}:${wakieId}`)})`
    );
    const compte = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(wakiesWakieImage)
      .where(eq(wakiesWakieImage.wakieId, wakieId));
    const utilise = compte[0]?.n ?? 0;
    if (limite !== null && utilise >= limite) {
      throw new WakiesImageQuotaError(limite, utilise);
    }
    const [row] = await tx
      .insert(wakiesWakieImage)
      .values({ alt, blobPathname, wakieId })
      .returning();
    return row;
  });
}

export async function supprimerImageWakie(
  userId: string,
  imageIdOrWakieId: string,
  maybeImageId?: string
): Promise<boolean> {
  const imageId = maybeImageId ?? imageIdOrWakieId;
  const wakieId = maybeImageId ? imageIdOrWakieId : undefined;
  await dbReady();
  const conditions = [eq(wakiesWakieImage.id, imageId)];
  if (wakieId) {
    conditions.push(eq(wakiesWakieImage.wakieId, wakieId));
  }
  const [row] = await getDb()
    .delete(wakiesWakieImage)
    .where(and(...conditions))
    .returning({ id: wakiesWakieImage.id });
  return Boolean(row);
}

/** Wakie public par identifiant, sans exposer le propriétaire ni son prompt. */
export async function trouverWakiePublic(wakieId: string) {
  await dbReady();
  const [row] = await getDb()
    .select({
      accent: wakiesWakie.accent,
      avatar: wakiesWakie.avatar,
      bio: wakiesWakieProfile.bio,
      handle: wakiesWakie.handle,
      name: wakiesWakie.name,
      publicPersona: wakiesWakie.publicPersona,
      wakieId: wakiesWakie.id,
    })
    .from(wakiesWakie)
    .leftJoin(
      wakiesWakieProfile,
      eq(wakiesWakieProfile.wakieId, wakiesWakie.id)
    )
    .where(and(eq(wakiesWakie.id, wakieId), eq(wakiesWakie.isPublic, true)))
    .limit(1);
  return row ?? null;
}

/**
 * Recherche globale des Wakies publics (annuaire d'amis).
 * ILIKE borné à 20 lignes, triée par nouveauté : pas de recherche plein texte
 * en V1, un index partiel suffit. Ne sélectionne QUE du contenu publié :
 * `publicPersona` et la bio, jamais `instructions`.
 */
export async function chercherWakiesPublics(q: string, limite = 20) {
  const nettoye = q.trim().toLowerCase().replace(/^@/, "").slice(0, 40);
  if (!nettoye) return [];
  await dbReady();
  return getDb()
    .select({
      accent: wakiesWakie.accent,
      avatar: wakiesWakie.avatar,
      bio: wakiesWakieProfile.bio,
      handle: wakiesWakie.handle,
      name: wakiesWakie.name,
      publicPersona: wakiesWakie.publicPersona,
      wakieId: wakiesWakie.id,
    })
    .from(wakiesWakie)
    .leftJoin(
      wakiesWakieProfile,
      eq(wakiesWakieProfile.wakieId, wakiesWakie.id)
    )
    .where(
      and(
        eq(wakiesWakie.isPublic, true),
        or(
          ilike(wakiesWakie.handle, `%${nettoye}%`),
          ilike(wakiesWakie.name, `%${nettoye}%`),
          ilike(wakiesWakieProfile.bio, `%${nettoye}%`)
        )
      )
    )
    .orderBy(desc(wakiesWakie.createdAt))
    .limit(Math.min(Math.max(limite, 1), 50));
}

export async function estAmi(
  userId: string,
  wakieId: string
): Promise<boolean> {
  await dbReady();
  const [row] = await getDb()
    .select({ wakieId: wakiesFriend.wakieId })
    .from(wakiesFriend)
    .where(
      and(
        eq(wakiesFriend.subscriberUserId, userId),
        eq(wakiesFriend.wakieId, wakieId)
      )
    )
    .limit(1);
  return Boolean(row);
}

/**
 * Wakies suivis par compte, avec ce qu'une liste d'amis doit afficher :
 * mascotte, accent, bio publiée et persona — jamais les instructions.
 * Un ami retiré de l'annuaire (redevenu privé) reste suivi : la liste est un
 * fait du compte, pas une conséquence de la visibilité de la cible.
 */
export async function listerAmis(userId: string) {
  await dbReady();
  const lignes = await getDb()
    .select({
      accent: wakiesWakie.accent,
      amiDepuis: wakiesFriend.createdAt,
      avatar: wakiesWakie.avatar,
      bio: wakiesWakieProfile.bio,
      handle: wakiesWakie.handle,
      id: wakiesWakie.id,
      name: wakiesWakie.name,
      publicPersona: wakiesWakie.publicPersona,
    })
    .from(wakiesFriend)
    .innerJoin(wakiesWakie, eq(wakiesWakie.id, wakiesFriend.wakieId))
    .leftJoin(
      wakiesWakieProfile,
      eq(wakiesWakieProfile.wakieId, wakiesWakie.id)
    )
    .where(eq(wakiesFriend.subscriberUserId, userId))
    .orderBy(asc(wakiesWakie.name));
  return lignes.map((ligne) => ({
    accent: ligne.accent,
    amiDepuis: ligne.amiDepuis,
    avatar: ligne.avatar,
    bio: (ligne.bio ?? "").trim().slice(0, 280),
    handle: ligne.handle,
    id: ligne.id,
    name: ligne.name,
    personaPubliee: extraitPersonaPublique(ligne, 280),
  }));
}

export async function ajouterAmi(
  userId: string,
  wakieId: string
): Promise<boolean> {
  await dbReady();
  const [row] = await getDb()
    .insert(wakiesFriend)
    .values({ ownerUserId: userId, subscriberUserId: userId, wakieId })
    .onConflictDoNothing({
      target: [wakiesFriend.subscriberUserId, wakiesFriend.wakieId],
    })
    .returning({ wakieId: wakiesFriend.wakieId });
  return Boolean(row);
}

export async function retirerAmi(
  userId: string,
  wakieId: string
): Promise<boolean> {
  await dbReady();
  const [row] = await getDb()
    .delete(wakiesFriend)
    .where(
      and(
        eq(wakiesFriend.subscriberUserId, userId),
        eq(wakiesFriend.wakieId, wakieId)
      )
    )
    .returning({ wakieId: wakiesFriend.wakieId });
  return Boolean(row);
}

/**
 * Clone un Wakie PUBLIC dans le compte courant.
 *
 * L'AMI EST UNE VITRINE : le clone est un Wakie qui M'APPARTIENT — il
 * consomme mon quota et mes jetons, et je peux le modifier sans jamais
 * toucher au profil de son auteur.
 *
 * CE QUI EST COPIÉ : la persona PUBLIÉE (jamais `instructions`, que ce
 * module ne lit même pas ici), le nom, la mascotte et l'accent — des clés de
 * catalogue, pas des fichiers —, puis la bio et les liens du profil social.
 *
 * CE QUI N'EST PAS COPIÉ, ET POURQUOI :
 *   - les images (galerie, avatar, bannière) : ce sont des blobs du compte
 *     de l'auteur ; un clone ne peut pas en devenir propriétaire, et
 *     dupliquer le fichier serait un autre produit ;
 *   - les capacités (MCP, skills, plugins, outils, modèle) : elles sont
 *     accordées par le compte de l'auteur, sous son quota et sa
 *     responsabilité. Le clone part des valeurs par défaut de l'hôte.
 *
 * Lève une erreur lisible quand la source n'est pas publique, ou quand elle
 * n'a rien publié : un clone vide serait un Wakie muet, pas un clone.
 */
export async function clonerWakiePublic(
  userId: string,
  sourceWakieId: string,
  input: { name?: string; spaceId: string },
  quota: number | null = null
): Promise<WakieWithSpaces> {
  const source = await trouverWakiePublic(sourceWakieId);
  if (!source) {
    throw new Error("Ce Wakie n'est pas public.");
  }
  const profil = await lireProfilPublic(sourceWakieId);
  const persona = extraitPersonaPublique(
    { bio: profil?.bio, publicPersona: source.publicPersona },
    2000
  );
  if (!persona) {
    throw new Error(
      "Ce Wakie n'a rien publié : il n'y a pas de persona à cloner."
    );
  }
  const nom = (input.name ?? source.name).trim().slice(0, 40) || "Wakie";
  const wakie = await createWakie(
    userId,
    {
      accent: source.accent ?? null,
      avatar: source.avatar ?? null,
      clonedFromWakieId: sourceWakieId,
      instructions: persona,
      memoryAllowed: true,
      name: nom,
      researchAllowed: true,
      spaceId: input.spaceId,
    },
    quota
  );
  if (profil) {
    await ensureProfilWakie(userId, wakie.id);
    await getDb()
      .update(wakiesWakieProfile)
      .set({ bio: profil.bio, links: profil.links, updatedAt: new Date() })
      .where(eq(wakiesWakieProfile.wakieId, wakie.id));
  }
  return wakie;
}

/**
 * Propriétaire d'un Wakie PUBLIC. USAGE SERVEUR UNIQUEMENT.
 *
 * Ne sort jamais d'une réponse : il sert à signer les blobs publics (le
 * préfixe `uploads/<propriétaire>/` est la seule façon de les lire) sans
 * pour autant rendre l'identifiant du compte lisible côté client.
 */
export async function proprietaireWakiePublic(
  wakieId: string
): Promise<string | null> {
  await dbReady();
  const [row] = await getDb()
    .select({ ownerUserId: wakiesWakie.userId })
    .from(wakiesWakie)
    .where(and(eq(wakiesWakie.id, wakieId), eq(wakiesWakie.isPublic, true)))
    .limit(1);
  return row?.ownerUserId ?? null;
}

/**
 * Annuaire : résultats publics enrichis pour UN compte.
 *
 * `estMien` évite de proposer « Ajouter » sur son propre Wakie, `estAmi`
 * affiche l'état réel, et `nombreImages` alimente la carte sans requête par
 * ligne. Aucun `userId` ne sort.
 */
export async function listerAnnuaire(
  userId: string,
  q: string,
  limite = 20
): Promise<
  Array<{
    accent: string | null;
    avatar: string | null;
    bio: string;
    estAmi: boolean;
    estMien: boolean;
    handle: string | null;
    name: string;
    nombreImages: number;
    personaPubliee: string;
    wakieId: string;
  }>
> {
  const bruts = await chercherWakiesPublics(q, limite);
  if (bruts.length === 0) return [];
  await dbReady();
  const db = getDb();
  const ids = bruts.map((row) => row.wakieId);
  const [miens, amis, comptes] = await Promise.all([
    db
      .select({ wakieId: wakiesWakie.id })
      .from(wakiesWakie)
      .where(and(eq(wakiesWakie.userId, userId), inArray(wakiesWakie.id, ids))),
    db
      .select({ wakieId: wakiesFriend.wakieId })
      .from(wakiesFriend)
      .where(
        and(
          eq(wakiesFriend.subscriberUserId, userId),
          inArray(wakiesFriend.wakieId, ids)
        )
      ),
    db
      .select({
        n: sql<number>`count(*)::int`,
        wakieId: wakiesWakieImage.wakieId,
      })
      .from(wakiesWakieImage)
      .where(inArray(wakiesWakieImage.wakieId, ids))
      .groupBy(wakiesWakieImage.wakieId),
  ]);
  const mesIds = new Set(miens.map((row) => row.wakieId));
  const idsAmis = new Set(amis.map((row) => row.wakieId));
  const images = new Map(comptes.map((row) => [row.wakieId, row.n]));
  return bruts.map((row) => ({
    accent: row.accent,
    avatar: row.avatar,
    bio: (row.bio ?? "").trim().slice(0, 280),
    estAmi: idsAmis.has(row.wakieId),
    estMien: mesIds.has(row.wakieId),
    handle: row.handle,
    name: row.name,
    nombreImages: images.get(row.wakieId) ?? 0,
    personaPubliee: extraitPersonaPublique(row, 280),
    wakieId: row.wakieId,
  }));
}

/**
 * Résout des mentions `@pseudo` / `@Nom` vers des Wakies accessibles :
 * possédés + amis publics. Lecture seule, 5 maximum, sans exposer de
 * `userId`.
 *
 * L'extrait d'un Wakie AMI est sa persona PUBLIÉE (repli : bio) : les
 * instructions privées d'un autre compte ne traversent jamais cette
 * frontière. Ceux sans rien de publié sont écartés — une mention qui
 * n'apporterait aucun contexte vaut mieux absente qu'annoncée vide.
 */
export async function resoudreMentions(
  userId: string,
  noms: readonly string[]
): Promise<Array<{ name: string; extrait: string }>> {
  const demandes = [
    ...new Set(
      noms
        .map((nom) => nom.trim().toLowerCase().replace(/^@/, ""))
        .filter(Boolean)
    ),
  ].slice(0, 5);
  if (demandes.length === 0) return [];
  await dbReady();
  const lignes = await getDb()
    .select({
      bio: wakiesWakieProfile.bio,
      instructions: wakiesWakie.instructions,
      name: wakiesWakie.name,
      ownerUserId: wakiesWakie.userId,
      publicPersona: wakiesWakie.publicPersona,
      wakieId: wakiesWakie.id,
    })
    .from(wakiesWakie)
    .leftJoin(
      wakiesWakieProfile,
      eq(wakiesWakieProfile.wakieId, wakiesWakie.id)
    )
    .where(
      and(
        or(
          eq(wakiesWakie.userId, userId),
          inArray(
            wakiesWakie.id,
            getDb()
              .select({ wakieId: wakiesFriend.wakieId })
              .from(wakiesFriend)
              .where(eq(wakiesFriend.subscriberUserId, userId))
          )
        ),
        demandes.length === 1
          ? or(
              ilike(wakiesWakie.handle, `%${demandes[0]}%`),
              ilike(wakiesWakie.name, `%${demandes[0]}%`)
            )
          : or(
              ...demandes.flatMap((d) => [
                ilike(wakiesWakie.handle, `%${d}%`),
                ilike(wakiesWakie.name, `%${d}%`),
              ])
            )
      )
    )
    .limit(5);
  return lignes
    .map((ligne) => ({
      extrait: extraitContexteMention({
        bio: ligne.bio,
        instructions: ligne.instructions,
        mien: ligne.ownerUserId === userId,
        publicPersona: ligne.publicPersona,
      }),
      name: ligne.name,
    }))
    .filter((mention) => mention.extrait.length > 0);
}

export async function listerEpingles(
  userId: string,
  conversationId: string,
  limite = 20
) {
  await dbReady();
  return getDb()
    .select({
      conversationId: wakiesMessage.conversationId,
      createdAt: wakiesMessage.createdAt,
      id: wakiesMessage.id,
      parts: wakiesMessage.parts,
      pinned: wakiesMessage.pinned,
      pinnedAt: wakiesMessage.pinnedAt,
      role: wakiesMessage.role,
      seq: wakiesMessage.seq,
    })
    .from(wakiesMessage)
    .innerJoin(
      wakiesConversation,
      eq(wakiesMessage.conversationId, wakiesConversation.id)
    )
    .where(
      and(
        eq(wakiesMessage.conversationId, conversationId),
        eq(wakiesMessage.pinned, true),
        eq(wakiesConversation.userId, userId)
      )
    )
    .orderBy(desc(wakiesMessage.pinnedAt))
    .limit(Math.min(Math.max(limite, 1), 50));
}

/** Épingle ou désépingle un message après contrôle de propriété. */
export async function definirEpingle(
  userId: string,
  messageId: string,
  pinned: boolean
): Promise<{ id: string; pinned: boolean } | null> {
  await dbReady();
  const db = getDb();
  const [msg] = await db
    .select({ id: wakiesMessage.id })
    .from(wakiesMessage)
    .innerJoin(
      wakiesConversation,
      eq(wakiesMessage.conversationId, wakiesConversation.id)
    )
    .where(
      and(
        eq(wakiesMessage.id, messageId),
        eq(wakiesConversation.userId, userId)
      )
    )
    .limit(1);

  if (!msg) return null;

  const [maj] = await db
    .update(wakiesMessage)
    .set({
      pinned,
      pinnedAt: pinned ? new Date() : null,
    })
    .where(eq(wakiesMessage.id, messageId))
    .returning({ id: wakiesMessage.id, pinned: wakiesMessage.pinned });

  return maj ?? null;
}

// ─── Réactions ───────────────────────────────────────────────────────────────

/** Palette FIXE : le serveur la valide, jamais le client. */
export const PALETTE_REACTIONS = ["👍", "❤️", "💡", "🔥", "😂", "😮"] as const;

export function estReactionValide(emoji: unknown): emoji is string {
  return (
    typeof emoji === "string" &&
    (PALETTE_REACTIONS as readonly string[]).includes(emoji)
  );
}

/**
 * Pose une réaction. La clé (message, émoji, auteur) rend l'opération
 * idempotente : poser deux fois ne crée qu'une ligne.
 * `byWakieId` = NULL quand c'est le compte qui réagit depuis l'interface.
 */
export async function poserReaction(
  userId: string,
  messageId: string,
  emoji: string,
  byWakieId: string | null
): Promise<boolean> {
  if (!estReactionValide(emoji)) return false;
  if (byWakieId !== null && !(await findWakie(userId, byWakieId))) return false;
  await dbReady();
  const [message] = await getDb()
    .select({ conversationId: wakiesMessage.conversationId })
    .from(wakiesMessage)
    .where(eq(wakiesMessage.id, messageId))
    .limit(1);
  if (!message) return false;
  const autorise = await ownedConversationIds(userId, [message.conversationId]);
  if (!autorise.has(message.conversationId)) return false;
  const [row] = await getDb()
    .insert(wakiesMessageReaction)
    .values({ byWakieId, emoji, messageId })
    .onConflictDoNothing({
      target: [
        wakiesMessageReaction.messageId,
        wakiesMessageReaction.emoji,
        wakiesMessageReaction.actorKey,
      ],
    })
    .returning({ messageId: wakiesMessageReaction.messageId });
  return Boolean(row);
}

export async function retirerReaction(
  userId: string,
  messageId: string,
  emoji: string,
  byWakieId: string | null
): Promise<boolean> {
  await dbReady();
  const [message] = await getDb()
    .select({ conversationId: wakiesMessage.conversationId })
    .from(wakiesMessage)
    .where(eq(wakiesMessage.id, messageId))
    .limit(1);
  if (!message) return false;
  const autorise = await ownedConversationIds(userId, [message.conversationId]);
  if (!autorise.has(message.conversationId)) return false;
  const [row] = await getDb()
    .delete(wakiesMessageReaction)
    .where(
      and(
        eq(wakiesMessageReaction.messageId, messageId),
        eq(wakiesMessageReaction.emoji, emoji),
        byWakieId === null
          ? isNull(wakiesMessageReaction.byWakieId)
          : eq(wakiesMessageReaction.byWakieId, byWakieId)
      )
    )
    .returning({ messageId: wakiesMessageReaction.messageId });
  return Boolean(row);
}

/** Réactions indexées par message, pour l'affichage du fil. */
export async function listerReactions(
  userId: string,
  messageIds: readonly string[]
): Promise<
  Map<
    string,
    Array<{ byWakieId: string | null; createdAt: Date; emoji: string }>
  >
> {
  const ids = [...new Set(messageIds)].slice(0, 200);
  const sortie = new Map<
    string,
    Array<{ byWakieId: string | null; createdAt: Date; emoji: string }>
  >();
  if (ids.length === 0) return sortie;
  await dbReady();
  const lignes = await getDb()
    .select({
      byWakieId: wakiesMessageReaction.byWakieId,
      createdAt: wakiesMessageReaction.createdAt,
      emoji: wakiesMessageReaction.emoji,
      messageId: wakiesMessageReaction.messageId,
    })
    .from(wakiesMessageReaction)
    .innerJoin(
      wakiesMessage,
      eq(wakiesMessage.id, wakiesMessageReaction.messageId)
    )
    .innerJoin(
      wakiesConversation,
      eq(wakiesMessage.conversationId, wakiesConversation.id)
    )
    .where(
      and(
        eq(wakiesConversation.userId, userId),
        inArray(wakiesMessageReaction.messageId, ids)
      )
    )
    .orderBy(asc(wakiesMessageReaction.createdAt));
  for (const ligne of lignes) {
    const groupe = sortie.get(ligne.messageId) ?? [];
    groupe.push({
      byWakieId: ligne.byWakieId,
      createdAt: ligne.createdAt,
      emoji: ligne.emoji,
    });
    sortie.set(ligne.messageId, groupe);
  }
  return sortie;
}

export const listerWakies = listWakies;

// ─── Messagerie : lecture, citations, transferts, recherche ────────────────

/**
 * Marque une conversation lue jusqu'au `seq` donné.
 *
 * Le curseur NE RECULE JAMAIS (`greatest`) : deux onglets ouverts, dont l'un
 * affiche une page ancienne, ne doivent pas faire réapparaître des non-lus
 * déjà vus. La valeur retournée est celle réellement écrite, donc l'interface
 * n'affiche pas un état qu'elle a inventé.
 */
export async function marquerConversationLue(
  userId: string,
  conversationId: string,
  seq: number
): Promise<number> {
  await dbReady();
  const borne = Math.max(0, Math.floor(Number.isFinite(seq) ? seq : 0));
  const [row] = await getDb()
    .update(wakiesConversation)
    .set({
      lastReadSeq: sql`greatest(${wakiesConversation.lastReadSeq}, ${borne})`,
    })
    .where(
      and(
        eq(wakiesConversation.id, conversationId),
        eq(wakiesConversation.userId, userId)
      )
    )
    .returning({ lastReadSeq: wakiesConversation.lastReadSeq });
  return row?.lastReadSeq ?? 0;
}

/**
 * Message CITÉ par une réponse, tel que le prompt peut le présenter.
 *
 * La requête exige la conversation ET le compte : citer le message d'un autre
 * compte n'est pas une erreur d'affichage, c'est une fuite, et `null` est le
 * seul résultat acceptable. Le texte est borné (600 caractères) : une citation
 * n'est pas un second historique.
 */
export async function messageCite(
  userId: string,
  conversationId: string,
  messageId: string
): Promise<{
  authorWakieId: string | null;
  extrait: string;
  id: string;
  role: string;
} | null> {
  await dbReady();
  const [row] = await getDb()
    .select({
      authorWakieId: wakiesMessage.authorWakieId,
      id: wakiesMessage.id,
      parts: wakiesMessage.parts,
      role: wakiesMessage.role,
    })
    .from(wakiesMessage)
    .innerJoin(
      wakiesConversation,
      eq(wakiesConversation.id, wakiesMessage.conversationId)
    )
    .where(
      and(
        eq(wakiesMessage.id, messageId),
        eq(wakiesMessage.conversationId, conversationId),
        eq(wakiesConversation.userId, userId)
      )
    )
    .limit(1);
  if (!row) return null;
  return {
    authorWakieId: row.authorWakieId,
    extrait: apercuMessage(row.parts, 600),
    id: row.id,
    role: row.role,
  };
}

/**
 * Message du compte, avec sa conversation — pour l'ENREGISTRER en page.
 *
 * Différent de `messageCite` sur deux points, et c'est voulu : la recherche se
 * fait par identifiant de message SEUL (une action de l'interface part de la
 * bulle, pas du fil), et l'extrait est borné plus haut (4 000 caractères) : le
 * texte sauvé devient un document, pas une citation.
 */
export async function messageDuCompte(
  userId: string,
  messageId: string,
  max = 4000
): Promise<{
  conversationId: string;
  conversationTitre: string;
  createdAt: Date;
  extrait: string;
  id: string;
  role: string;
} | null> {
  await dbReady();
  const [row] = await getDb()
    .select({
      conversationId: wakiesConversation.id,
      conversationTitre: wakiesConversation.title,
      createdAt: wakiesMessage.createdAt,
      id: wakiesMessage.id,
      parts: wakiesMessage.parts,
      role: wakiesMessage.role,
    })
    .from(wakiesMessage)
    .innerJoin(
      wakiesConversation,
      eq(wakiesConversation.id, wakiesMessage.conversationId)
    )
    .where(
      and(
        eq(wakiesMessage.id, messageId),
        eq(wakiesConversation.userId, userId)
      )
    )
    .limit(1);
  if (!row) return null;
  return {
    conversationId: row.conversationId,
    conversationTitre: row.conversationTitre,
    createdAt: row.createdAt,
    extrait: apercuMessage(row.parts, max),
    id: row.id,
    role: row.role,
  };
}

/**
 * Transfère un message vers une AUTRE conversation du même compte.
 *
 * Le transfert COPIE le message : l'original ne bouge pas, et la copie porte
 * une part de provenance (`data-wakies-forward`) plutôt qu'un texte inventé —
 * la mention « Transféré de … » est un fait du message, pas une phrase que le
 * modèle aurait pu écrire. Les parts sont copiées À L'IDENTIQUE (aucune
 * réécriture, aucune re-signature : les pièces jointes restent des
 * `pathname`, signés à la lecture pour le compte, qui est le même).
 *
 * Source et cible doivent appartenir au compte, sinon `null` : on ne transfère
 * ni depuis ni vers une conversation étrangère, et l'appelant ne distingue pas
 * « inexistante » de « pas à moi ».
 */
export async function transfererMessage(
  userId: string,
  messageId: string,
  conversationCibleId: string
): Promise<{ conversationId: string; id: string } | null> {
  await dbReady();
  const [source] = await getDb()
    .select({
      authorWakieId: wakiesMessage.authorWakieId,
      conversationId: wakiesMessage.conversationId,
      parts: wakiesMessage.parts,
      role: wakiesMessage.role,
    })
    .from(wakiesMessage)
    .innerJoin(
      wakiesConversation,
      eq(wakiesConversation.id, wakiesMessage.conversationId)
    )
    .where(
      and(
        eq(wakiesMessage.id, messageId),
        eq(wakiesConversation.userId, userId)
      )
    )
    .limit(1);
  if (!source) return null;
  const [cible] = await getDb()
    .select({ id: wakiesConversation.id, title: wakiesConversation.title })
    .from(wakiesConversation)
    .where(
      and(
        eq(wakiesConversation.id, conversationCibleId),
        eq(wakiesConversation.userId, userId)
      )
    )
    .limit(1);
  if (!cible) return null;
  const [origine] = await getDb()
    .select({ title: wakiesConversation.title })
    .from(wakiesConversation)
    .where(eq(wakiesConversation.id, source.conversationId))
    .limit(1);
  const parts = [
    ...(Array.isArray(source.parts) ? (source.parts as unknown[]) : []),
    {
      data: {
        conversationId: source.conversationId,
        conversationTitre: origine?.title ?? "",
        messageId,
        role: source.role,
      },
      type: "data-wakies-forward",
    },
  ];
  const id = `forward-${crypto.randomUUID()}`;
  await appendMessages(userId, [
    {
      authorWakieId: source.authorWakieId,
      conversationId: cible.id,
      id,
      parts,
      role: source.role,
    },
  ]);
  await touchConversation(userId, cible.id);
  return { conversationId: cible.id, id };
}

/**
 * Recherche dans les conversations et les messages du compte.
 *
 * BORNÉ, ET DIT : les titres sont cherchés en `ILIKE`, les messages dans les
 * 100 derniers de chaque conversation (au plus 200 lignes scannées). Une
 * recherche exhaustive demanderait un index plein-texte et une migration de
 * contenu — hors périmètre V1, et l'alternative « tout scanner » coûterait un
 * parcours complet de l'historique à chaque frappe.
 */
export async function chercherDansWakies(
  userId: string,
  q: string
): Promise<{
  conversations: Array<{
    id: string;
    isGroup: boolean;
    title: string;
    updatedAt: Date;
  }>;
  messages: Array<{
    conversationId: string;
    createdAt: Date;
    extrait: string;
    id: string;
    role: string;
  }>;
}> {
  const terme = q.trim().slice(0, 80);
  if (terme.length < 2) return { conversations: [], messages: [] };
  await dbReady();
  const db = getDb();
  const conversations = await db
    .select({
      id: wakiesConversation.id,
      isGroup: wakiesConversation.isGroup,
      title: wakiesConversation.title,
      updatedAt: wakiesConversation.updatedAt,
    })
    .from(wakiesConversation)
    .where(
      and(
        eq(wakiesConversation.userId, userId),
        ilike(wakiesConversation.title, `%${terme}%`)
      )
    )
    .orderBy(desc(wakiesConversation.updatedAt))
    .limit(20);
  const lignes = (await db.execute(sql`
    SELECT "conversationId", "id", "role", "createdAt", "parts"
    FROM (
      SELECT
        "conversationId", "id", "role", "createdAt", "parts",
        row_number() OVER (
          PARTITION BY "conversationId" ORDER BY "seq" DESC
        ) AS rang
      FROM "WakiesMessage"
      WHERE "conversationId" IN (
        SELECT "id" FROM "WakiesConversation" WHERE "userId" = ${userId}
      )
    ) AS recents
    WHERE rang <= 100
    ORDER BY "createdAt" DESC
    LIMIT 200
  `)) as unknown as Array<{
    conversationId: string;
    createdAt: Date;
    id: string;
    parts: unknown;
    role: string;
  }>;
  const aiguille = terme.toLocaleLowerCase("fr");
  const messages = lignes
    .map((row) => ({ ...row, extrait: apercuMessage(row.parts, 160) }))
    .filter((row) => row.extrait.toLocaleLowerCase("fr").includes(aiguille))
    .slice(0, 20)
    .map((row) => ({
      conversationId: row.conversationId,
      createdAt: row.createdAt,
      extrait: row.extrait,
      id: row.id,
      role: row.role,
    }));
  return { conversations, messages };
}
