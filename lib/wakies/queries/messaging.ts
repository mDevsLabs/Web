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
import { touchConversation } from "./conversations";

import { appendMessages, messageExists } from "./messages";
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
