import "server-only";

import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { dbReady, getDb } from "@/lib/db/queries";
import {
  wakiesConversation,
  wakiesMemory,
  wakiesMessage,
  wakiesPage,
  wakiesSpace,
  wakiesTask,
  wakiesWakie,
} from "@/lib/db/schema";
import { apercuMessage } from "@/lib/wakies/shared/messages";

/**
 * ============================================================================
 * RECHERCHE UNIFIÉE WAKIES — `lib/wakies/queries/search.ts`
 * ============================================================================
 *
 * CE QUE LA RECHERCHE REMPLACE
 *
 * La recherche du rail était une RECONSTITUTION côté navigateur :
 *
 * - les conversations, les Espaces et les Wakies étaient filtrés en JavaScript,
 *   sur les tableaux déjà chargés par le rail ;
 * - les PAGES, elles, exigeaient un appel réseau PAR ESPACE, à chaque frappe
 *   (`workspace-app.tsx` faisait `Promise.all(spaces.map(api))`). Un compte
 *   avec huit Espaces déclenchait huit requêtes pour une recherche.
 *
 * Elle est désormais Une seule requête, qui interroge la base. Le client ne
 * reçoit que des résultats, et le coût ne dépend plus du nombre d'Espaces.
 *
 * CE QUE LA RECHERCHE COUVRE
 *
 * Cinq surfaces, parce qu'on ne cherche pas la même chose :
 *
 * - `conversation` : un fil, par son TITRE ;
 * - `message` : un EXTRAIT de ce qui a été dit ;
 * - `page` : une page de l'atelier, par son titre ;
 * - `space` : un Espace, par son nom ;
 * - `wakie` : un agent, par son nom ou son pseudo.
 *
 * LES MESSAGES : CE QUI EST VRAIMENT CHERCHÉ
 *
 * La version précédente lisait les CENT DERNIERS messages de chaque
 * conversation, puis filtrait en JavaScript. Deux conséquences :
 *
 * 1. Le FILTRE ÉTAIT FAUX. « I love » ne trouvait rien, alors que le message
 *    contenait exactement ces mots : le filtre cherchait la chaîne entière
 *    dans un extrait tronqué.
 * 2. La RECHERCHE ÉTAIT INCOMPLÈTE. Un message écrit il y a six mois
 *    n'était pas dans les cent derniers : il existait, et la recherche
 *    disait qu'il n'existait pas.
 *
 * Ici, le filtre est fait PAR POSTGRES, sur la colonne qui porte réellement
 * le texte, et la borne porte sur les RÉSULTATS — pas sur ce qui est
 * candidat. On cherche dans tout l'historique du compte, et on en rend
 * vingt.
 *
 * L'ACCENT : LA RECHERCHE RESTE EXACTE
 *
 * PostgreSQL ne replie pas les accents (`ILIKE '%ete%'` ne trouve pas
 * « été »). On ne triche pas : un index `unaccent` exigerait une extension,
 * donc une migration et une décision de déploiement. La recherche est donc
 * accentuée comme elle est écrite, et l'interface le dit.
 */

/** Longueur minimale d'une recherche : en dessous, ce n'est pas une recherche. */
export const WAKIES_SEARCH_MIN_LENGTH = 2;

/** Nombre de résultats rendus PAR TYPE. */
export const WAKIES_SEARCH_LIMIT_PER_TYPE = 8;

/**
 * Borne la saisie.
 *
 * La longueur est bornée parce que la requête part en base : une saisie de
 * dix mille caractères ne rendrait pas plus de résultats, elle coûterait
 * plus de temps à lire.
 */
const MAX_QUERY_LENGTH = 80;

/** Échappe les jokers `ILIKE` d'une saisie utilisateur. */
function escapeLike(value: string): string {
  return value.replace(/[%_\\]/gu, (char) => `\\${char}`);
}

/** Un terme de recherche : son motif SQL et son texte. */
type Term = {
  like: string;
  raw: string;
};

/**
 * Découpe une saisie en termes.
 *
 * Les doublons sont écartés et l'ordre conservé : c'est lui qui départage
 * des résultats de pertinence égale. Le terme brut est conservé pour les
 * comparaisons en mémoire (l'aperçu d'un message).
 */
function toTerms(query: string): Term[] {
  const vus = new Set<string>();
  const termes: Term[] = [];
  for (const brut of query.split(/\s+/u)) {
    const terme = brut.trim();
    if (!terme) {
      continue;
    }
    const cle = terme.toLowerCase();
    if (vus.has(cle)) {
      continue;
    }
    vus.add(cle);
    termes.push({ like: `%${escapeLike(terme)}%`, raw: terme });
  }
  return termes;
}

/** Un résultat de recherche Wakies, tel que l'interface le consomme. */
export type WakieSearchHit = {
  /** Le texte affiché, déjà mis en forme par le serveur. */
  title: string;
  /** La ligne secondaire : extrait, description, pseudo. */
  subtitle?: string;
  /** Ce sur quoi cliquer : une route interne, ou un identifiant. */
  href: string;
  /** Identifiant stable, pour la clé React. */
  id: string;
  /** Le type de surface, pour l'icône et le regroupement. */
  kind: "conversation" | "message" | "page" | "space" | "wakie";
  /** Horodatage ou précision d'affichage. */
  meta?: string;
  /**
   * Les identifiants bruts, pour que le rail navigue SANS ré-analyser un
   * identifiant composé.
   *
   * Le rail connaît déjà ses conversations, ses Espaces et ses Wakies : il
   * lui faut l'identifiant, pas une chaîne à découper. `conversationId` sert
   * aux messages (le fil qui les contient), `messageId` au message visé,
   * `spaceId` et `pageId` aux pages, `wakieId` aux agents.
   */
  conversationId?: string;
  messageId?: string;
  pageId?: string;
  spaceId?: string;
  wakieId?: string;
};

/** Le résultat complet d'une recherche Wakies. */
export type WakieSearchResult = {
  hits: WakieSearchHit[];
  /** Nombre de résultats par type : l'interface peut afficher « Pages (3) ». */
  counts: {
    conversation: number;
    message: number;
    page: number;
    space: number;
    wakie: number;
  };
};

/**
 * Un message trouvé dans l'historique.
 *
 * Le message est rendu par le SERVEUR : le navigateur ne reçoit ni les
 * `parts` brutes (qui peuvent contenir des résultats d'outil et des
 * métadonnées) ni un extrait qu'il faudrait recalculer.
 */
type MessageRow = {
  conversationId: string;
  conversationTitre: string;
  createdAt: Date;
  id: string;
  parts: unknown;
  role: string;
  seq: number;
};

/**
 * Cherche dans TOUT l'espace de travail du compte.
 *
 * Les quatre sources en base (conversations, messages, pages, Espaces,
 * Wakies) sont interrogées EN PARALLÈLE : le délai total est celui de la
 * source la plus lente, pas leur somme.
 */
export async function searchWakiesWorkspace(
  userId: string,
  query: string
): Promise<WakieSearchResult> {
  const vide: WakieSearchResult = {
    counts: { conversation: 0, message: 0, page: 0, space: 0, wakie: 0 },
    hits: [],
  };
  const saisie = query.trim().slice(0, MAX_QUERY_LENGTH);
  if (saisie.length < WAKIES_SEARCH_MIN_LENGTH) {
    return vide;
  }
  const termes = toTerms(saisie);
  if (termes.length === 0) {
    return vide;
  }

  await dbReady();
  const db = getDb();

  /**
   * Les quatre recherches, en parallèle.
   *
   * Chacune est bornée à `WAKIES_SEARCH_LIMIT_PER_TYPE` LIGNES RENDUES, pas
   * à autant de lignes candidates : c'est la différence entre une recherche
   * qui balaie un historique et une recherche qui le parcourt.
   */
  const [conversations, messages, pages, spaces, wakies] = await Promise.all([
    db
      .select({
        id: wakiesConversation.id,
        title: wakiesConversation.title,
        updatedAt: wakiesConversation.updatedAt,
      })
      .from(wakiesConversation)
      .where(
        and(
          eq(wakiesConversation.userId, userId),
          // Les fils de groupe sont retirés du produit : les chercher
          // afficherait des conversations fantômes, absentes du rail.
          sql`${wakiesConversation.isGroup} = false`,
          ...termes.map((terme) => ilike(wakiesConversation.title, terme.like))
        )
      )
      .orderBy(desc(wakiesConversation.updatedAt))
      .limit(WAKIES_SEARCH_LIMIT_PER_TYPE),

    /**
     * Les MESSAGES.
     *
     * Le filtre porte sur `parts::text`, la colonne qui contient réellement
     * le texte, et non sur un aperçu calculé en mémoire. C'est ce qui
     * permet de trouver « love » dans « I love this » : le filtre SQL voit
     * les mots, l'ancien filtre JavaScript cherchait une phrase entière
     * dans une chaîne tronquée.
     *
     * Tous les termes doivent être présents (ET logique) : « rapport Ada »
     * ne ramène pas les messages qui ne parlent que d'Ada.
     */
    db.execute(sql`
      SELECT m."conversationId", m."id", m."role", m."createdAt", m."seq", m."parts",
             c."title" AS "conversationTitre"
      FROM "WakiesMessage" m
      JOIN "WakiesConversation" c ON c."id" = m."conversationId"
      WHERE c."userId" = ${userId}
        AND c."isGroup" = false
        AND ${sql.join(
          termes.map((terme) => sql`m."parts"::text ILIKE ${terme.like}`),
          sql` AND `
        )}
      ORDER BY m."seq" DESC
      LIMIT ${WAKIES_SEARCH_LIMIT_PER_TYPE}
    `) as Promise<MessageRow[]>,

    db
      .select({
        id: wakiesPage.id,
        spaceId: wakiesPage.spaceId,
        title: wakiesPage.title,
        updatedAt: wakiesPage.updatedAt,
      })
      .from(wakiesPage)
      .where(
        and(
          eq(wakiesPage.userId, userId),
          ...termes.map((terme) => ilike(wakiesPage.title, terme.like))
        )
      )
      .orderBy(desc(wakiesPage.updatedAt))
      .limit(WAKIES_SEARCH_LIMIT_PER_TYPE),

    db
      .select({
        description: wakiesSpace.description,
        id: wakiesSpace.id,
        name: wakiesSpace.name,
      })
      .from(wakiesSpace)
      .where(
        and(
          eq(wakiesSpace.userId, userId),
          ...termes.map((terme) =>
            or(
              ilike(wakiesSpace.name, terme.like),
              ilike(wakiesSpace.description, terme.like)
            )
          )
        )
      )
      .orderBy(desc(wakiesSpace.pinned), asc(wakiesSpace.createdAt))
      .limit(WAKIES_SEARCH_LIMIT_PER_TYPE),

    db
      .select({
        handle: wakiesWakie.handle,
        id: wakiesWakie.id,
        name: wakiesWakie.name,
      })
      .from(wakiesWakie)
      .where(
        and(
          eq(wakiesWakie.userId, userId),
          ...termes.map((terme) =>
            or(
              ilike(wakiesWakie.name, terme.like),
              ilike(wakiesWakie.handle, terme.like)
            )
          )
        )
      )
      .orderBy(asc(wakiesWakie.createdAt))
      .limit(WAKIES_SEARCH_LIMIT_PER_TYPE),
  ]);

  const hits: WakieSearchHit[] = [];

  for (const conversation of conversations) {
    hits.push({
      conversationId: conversation.id,
      href: `/wakies/c/${conversation.id}`,
      id: `conversation-${conversation.id}`,
      kind: "conversation",
      meta: conversation.updatedAt.toISOString(),
      title: conversation.title || "Conversation sans titre",
    });
  }

  for (const message of messages ?? []) {
    const extrait = apercuMessage(message.parts, 160);
    hits.push({
      conversationId: message.conversationId,
      href: `/wakies/c/${message.conversationId}`,
      id: `message-${message.id}`,
      kind: "message",
      messageId: message.id,
      meta: message.createdAt.toISOString(),
      subtitle: extrait || "Message sans texte",
      title: `Dans « ${message.conversationTitre || "Conversation"} »`,
    });
  }

  for (const page of pages) {
    hits.push({
      href: `/wakies/#/spaces/${page.spaceId}/pages/${page.id}`,
      id: `page-${page.id}`,
      kind: "page",
      meta: page.updatedAt.toISOString(),
      pageId: page.id,
      spaceId: page.spaceId,
      title: page.title,
    });
  }

  for (const space of spaces) {
    hits.push({
      href: `/wakies/#/spaces/${space.id}`,
      id: `space-${space.id}`,
      kind: "space",
      spaceId: space.id,
      subtitle: space.description || undefined,
      title: space.name,
    });
  }

  for (const wakie of wakies) {
    hits.push({
      href: `/wakies/#/wakies/${wakie.id}`,
      id: `wakie-${wakie.id}`,
      kind: "wakie",
      subtitle: wakie.handle ? `@${wakie.handle}` : undefined,
      title: wakie.name,
      wakieId: wakie.id,
    });
  }

  return {
    counts: {
      conversation: conversations.length,
      message: (messages ?? []).length,
      page: pages.length,
      space: spaces.length,
      wakie: wakies.length,
    },
    hits,
  };
}

/**
 * Recherche par l'HISTORIQUE — l'historique des conversations, en SQL.
 *
 * Conservée pour la route `/api/wakies/search`, qui a déjà son contrat et
 * ses appelants. Elle gagne une seule chose : le filtre des messages passe
 * en base, donc un terme de deux mots trouve enfin « I love » dans
 * « I love this ».
 */
export async function chercherDansWakiesMessages(
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
  const terme = q.trim().slice(0, MAX_QUERY_LENGTH);
  if (terme.length < WAKIES_SEARCH_MIN_LENGTH) {
    return { conversations: [], messages: [] };
  }
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
        sql`${wakiesConversation.isGroup} = false`,
        ilike(wakiesConversation.title, `%${escapeLike(terme)}%`)
      )
    )
    .orderBy(desc(wakiesConversation.updatedAt))
    .limit(20);

  /**
   * Les messages, filtrés en BASE.
   *
   * L'ancienne version lisait les cent derniers messages de chaque
   * conversation et filtrait en JavaScript — donc elle manquait tout ce qui
   * n'était pas récent, et elle ne trouvait pas un terme de deux mots dans
   * une phrase. Le filtre SQL porte sur `parts::text`, la colonne qui
   * contient le texte, et la borne porte sur les RÉSULTATS.
   */
  const lignes = (await db.execute(sql`
    SELECT m."conversationId", m."id", m."role", m."createdAt", m."parts"
    FROM "WakiesMessage" m
    JOIN "WakiesConversation" c ON c."id" = m."conversationId"
    WHERE c."userId" = ${userId}
      AND c."isGroup" = false
      AND m."parts"::text ILIKE ${`%${escapeLike(terme)}%`}
    ORDER BY m."seq" DESC
    LIMIT 200
  `)) as unknown as Array<{
    conversationId: string;
    createdAt: Date;
    id: string;
    parts: unknown;
    role: string;
  }>;

  const messages = lignes
    .map((row) => ({ ...row, extrait: apercuMessage(row.parts, 160) }))
    .filter((row) => row.extrait.length > 0)
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

/**
 * Les MÉMOIRES du compte, comme surface de recherche.
 *
 * Une mémoire est un fait retenu par l'utilisateur : la chercher fait
 * partie du même geste que chercher une page. Elle n'est pas dans la
 * recherche unifiée ci-dessus pour une raison simple : la route historique
 * ne l'a jamais portée, et ajouter une surface change son contrat. Elle est
 * donc lue à part, par la route qui l'expose.
 */ export async function searchWakiesMemories(
  userId: string,
  q: string
): Promise<Array<{ id: string; text: string; createdAt: Date }>> {
  const terme = q.trim().slice(0, MAX_QUERY_LENGTH);
  if (terme.length < WAKIES_SEARCH_MIN_LENGTH) {
    return [];
  }
  await dbReady();
  return getDb()
    .select({
      createdAt: wakiesMemory.createdAt,
      id: wakiesMemory.id,
      text: wakiesMemory.text,
    })
    .from(wakiesMemory)
    .where(
      and(
        eq(wakiesMemory.userId, userId),
        ilike(wakiesMemory.text, `%${escapeLike(terme)}%`)
      )
    )
    .orderBy(desc(wakiesMemory.createdAt))
    .limit(WAKIES_SEARCH_LIMIT_PER_TYPE);
}

/**
 * Les TÂCHES planifiées, comme surface de recherche.
 *
 * Une tâche est un rendez-vous : la retrouver par son texte est le geste
 * naturel. `WakiesTask` ne porte pas de `title` — l'intitulé d'une tâche
 * EST son `prompt` — donc c'est cette colonne qui est cherchée. Elle n'est
 * pas dans la recherche unifiée, pour la même raison que les mémoires : la
 * route historique ne l'a jamais portée.
 */
export async function searchWakiesTasks(
  userId: string,
  q: string
): Promise<
  Array<{ id: string; prompt: string; status: string; nextRunAt: Date | null }>
> {
  const terme = q.trim().slice(0, MAX_QUERY_LENGTH);
  if (terme.length < WAKIES_SEARCH_MIN_LENGTH) {
    return [];
  }
  await dbReady();
  return getDb()
    .select({
      id: wakiesTask.id,
      nextRunAt: wakiesTask.nextRunAt,
      prompt: wakiesTask.prompt,
      status: wakiesTask.status,
    })
    .from(wakiesTask)
    .where(
      and(
        eq(wakiesTask.userId, userId),
        ilike(wakiesTask.prompt, `%${escapeLike(terme)}%`)
      )
    )
    .orderBy(asc(wakiesTask.nextRunAt))
    .limit(WAKIES_SEARCH_LIMIT_PER_TYPE);
}
