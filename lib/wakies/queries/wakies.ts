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
export function hashCompte(userId: string): bigint {
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
