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

import { and, asc, desc, eq, gt, inArray, lt, lte, or, sql } from "drizzle-orm";
import { dbReady, getDb } from "@/lib/db/queries";
import {
  wakiesCall,
  wakiesCapture,
  wakiesChatTurn,
  wakiesConversation,
  wakiesMemory,
  wakiesMessage,
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
  wakiesWakieSpace,
} from "@/lib/db/schema";
import { preserveGoalMarker } from "@/lib/wakies/shared/goals";

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
  return getDb()
    .select()
    .from(wakiesSpace)
    .where(eq(wakiesSpace.userId, userId))
    .orderBy(asc(wakiesSpace.createdAt));
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
    avatar?: string | null;
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
        avatar: input.avatar ?? null,
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

export async function listConversations(
  userId: string
): Promise<WakieConversationRow[]> {
  await dbReady();
  return getDb()
    .select()
    .from(wakiesConversation)
    .where(eq(wakiesConversation.userId, userId))
    .orderBy(desc(wakiesConversation.createdAt));
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
    title?: string;
    model?: string | null;
    mcpServerIds?: string[] | null;
    pluginIds?: string[] | null;
    skillIds?: string[] | null;
    skillParams?: Record<string, Record<string, string>> | null;
    toolIds?: string[] | null;
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
  if (patch.model !== undefined) {
    changes.model = patch.model;
  }
  // Chaque colonne est traitée séparément : `undefined` (absent du PATCH) et
  // `null` (« reviens au Wakie ») doivent produire deux écritures différentes.
  for (const champ of [
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
  options: { avantSeq?: number; limite?: number } = {}
): Promise<(typeof wakiesMessage.$inferSelect)[]> {
  await dbReady();
  const conditions = [
    eq(wakiesMessage.conversationId, conversationId),
    eq(wakiesConversation.userId, userId),
  ];
  if (options.avantSeq !== undefined) {
    conditions.push(lt(wakiesMessage.seq, options.avantSeq));
  }
  const rows = await getDb()
    .select({ message: wakiesMessage })
    .from(wakiesMessage)
    .innerJoin(
      wakiesConversation,
      eq(wakiesMessage.conversationId, wakiesConversation.id)
    )
    .where(and(...conditions))
    .orderBy(desc(wakiesMessage.seq))
    .limit(Math.min(Math.max(options.limite ?? 200, 1), 501));
  return rows.map((row) => row.message).reverse();
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
  return getDb()
    .select()
    .from(wakiesPage)
    .where(and(eq(wakiesPage.spaceId, spaceId), eq(wakiesPage.userId, userId)))
    .orderBy(asc(wakiesPage.createdAt), asc(wakiesPage.id));
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
  const [row] = await getDb()
    .update(wakiesTask)
    .set({
      error: null,
      lease: null,
      leaseUntil: null,
      nextRunAt: null,
      status,
      updatedAt: new Date(),
    })
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
  const nextRunAt =
    intervalSeconds && task.status === "completed"
      ? new Date(Date.now() + intervalSeconds * 1000)
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
 * Réserve la prochaine tâche due pour un compte donné, avec un bail de trois
 * minutes. Le gabarit faisait la même chose dans un `setInterval` local ; ici la
 * réservation est transactionnelle, donc deux ticks de cron concurrents ne
 * peuvent pas exécuter la même tâche.
 *
 * « Due » couvre trois états qui doivent être exécutés :
 *  1. une tâche en file (`queued`) ;
 *  2. une tâche RÉUSSIE dont la prochaine exécution est atteinte (`completed` avec `nextRunAt` passé) ;
 *  3. une tâche EN COURS dont le bail a expiré (`running` avec `leaseUntil` passé — reprise après crash ou timeout du worker).
 */
export async function claimDueTask(userId: string): Promise<{
  task: WakieTaskRow;
  lease: string;
} | null> {
  await dbReady();
  const db = getDb();
  const settings = await ensureSettings(userId);
  if (settings.paused || !settings.researchAllowed) {
    return null;
  }
  const maintenant = new Date();
  return db.transaction(async (tx) => {
    const isDueCondition = or(
      eq(wakiesTask.status, "queued"),
      and(
        eq(wakiesTask.status, "completed"),
        lte(wakiesTask.nextRunAt, maintenant)
      ),
      and(
        eq(wakiesTask.status, "running"),
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

    const [claimed] = await tx
      .update(wakiesTask)
      .set({
        error: null,
        lease: sql`gen_random_uuid()::text`,
        leaseUntil: new Date(Date.now() + 180_000),
        nextRunAt: null,
        status: "running",
        updatedAt: maintenant,
      })
      .where(and(eq(wakiesTask.id, due.id), isDueCondition))
      .returning();
    if (!claimed) {
      return null;
    }

    // Si la tâche était en cours d'exécution avec un bail expiré, clore l'ancien run
    if (due.status === "running" && due.lease) {
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

    await tx.insert(wakiesTaskRun).values({
      id: claimed.lease ?? "",
      startedAt: maintenant,
      status: "running",
      taskId: claimed.id,
    });
    await tx.insert(wakiesTaskEvent).values({
      runId: claimed.lease,
      taskId: claimed.id,
      text:
        due.status === "running"
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

export async function finishTask(
  taskId: string,
  lease: string,
  result: unknown
): Promise<boolean> {
  await dbReady();
  const db = getDb();
  return db.transaction(async (tx) => {
    const [task] = await tx
      .select()
      .from(wakiesTask)
      .where(and(eq(wakiesTask.id, taskId), eq(wakiesTask.lease, lease)))
      .limit(1);
    if (task?.status !== "running") {
      return false;
    }
    await tx
      .update(wakiesTaskRun)
      .set({
        finishedAt: new Date(),
        result,
        status: "completed",
      })
      .where(eq(wakiesTaskRun.id, lease));
    await tx
      .update(wakiesTask)
      .set({
        lease: null,
        leaseUntil: null,
        nextRunAt: task.intervalSeconds
          ? new Date(Date.now() + task.intervalSeconds * 1000)
          : null,
        status: "completed",
        updatedAt: new Date(),
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

export async function failTask(
  taskId: string,
  lease: string,
  error: string
): Promise<void> {
  await dbReady();
  const db = getDb();
  await db
    .update(wakiesTaskRun)
    .set({ error, finishedAt: new Date(), status: "failed" })
    .where(eq(wakiesTaskRun.id, lease));
  await db
    .update(wakiesTask)
    .set({
      error,
      lease: null,
      leaseUntil: null,
      status: "failed",
      updatedAt: new Date(),
    })
    .where(and(eq(wakiesTask.id, taskId), eq(wakiesTask.lease, lease)));
  await addTaskEvent(taskId, error, lease);
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

/** Réservation transactionnelle : le serveur possède l'historique et la clé d'idempotence. */
export async function reserveChatTurn(
  userId: string,
  conversationId: string,
  messageId: string
): Promise<
  { conflict: "busy" | "replayed" } | { id: string; responseId: string }
> {
  if (!(await findConversation(userId, conversationId)))
    throw new Error("Conversation introuvable.");
  await dbReady();
  return getDb().transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(${hashCompte(`${userId}:${conversationId}`)})`
    );
    const [replayed] = await tx
      .select()
      .from(wakiesChatTurn)
      .where(
        and(
          eq(wakiesChatTurn.userId, userId),
          eq(wakiesChatTurn.conversationId, conversationId),
          eq(wakiesChatTurn.messageId, messageId)
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
  await getDb()
    .update(wakiesChatTurn)
    .set({ status })
    .where(
      and(
        eq(wakiesChatTurn.id, turnId),
        eq(wakiesChatTurn.userId, userId),
        eq(wakiesChatTurn.status, "running")
      )
    );
}
