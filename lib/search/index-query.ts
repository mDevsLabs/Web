import "server-only";

import { and, desc, eq, inArray, type SQL, sql } from "drizzle-orm";
import { normalizeModelDisplayName } from "@/lib/ai/models";
import { fetchUserModels } from "@/lib/ai/models.server";
import { isPaidTier } from "@/lib/auth/plan";
import { getMaiSessionToken } from "@/lib/auth/session";
import { MAI_API_URL } from "@/lib/constants";
import { getDb } from "@/lib/db/queries";
import {
  agent,
  agentRun,
  agentStep,
  chat,
  customCommand,
  mcpServer,
  message,
  mprojectsImageGenerations,
  mprojectsSpeechGenerations,
  pluginInstallation,
  project,
  projectFile,
  scheduledMessage,
  skill,
  usageEvent,
  userMemory,
} from "@/lib/db/schema";
import { PLUGIN_MANIFEST_LIST } from "@/lib/plugins/catalog";
import { getAccessibleProjectIds } from "@/lib/projects/access";
import {
  PAID_ONLY_SOURCES,
  type SearchHit,
  type SearchIndexResponse,
  type SearchSourceKey,
  type SourceResult,
  type SourceSearchContext,
} from "@/lib/search/types";

// Moteur de l'index de recherche interne : une source = un endroit du compte
// où l'on sait chercher, et qui sait dire combien de lignes il contient.
//
// ── Trois règles que toutes les sources respectent ──────────────────────────
//
// 1. `count(*) OVER ()` dans la MÊME requête que les lignes. Une source coûte
//    donc une requête, pas deux, et le total reste exact même quand on ne
//    renvoie que `limit` lignes. Sans cela, la pastille « Skills (34) » serait
//    soit fausse, soit le prix d'une seconde requête par source.
//
// 2. Chaque token doit être trouvé (ET logique), et l'ordre de pertinence
//    commence par un titre qui COMMENCE par le terme : « migration » doit
//    remonter « Migration Postgres » avant une discussion qui en parle trois
//    fois au milieu d'un paragraphe.
//
// 3. Le périmètre d'identité est une liste de variantes liées paramètre par
//    paramètre. `userId` est un `text` libre : la même personne a écrit des
//    lignes sous son identifiant, sous son email, et parfois sous son pseudo.
//    `= ANY(${userIds})` est INTERDIT ici — Drizzle sérialise un tableau en
//    constructeur de ligne et Postgres répond `22P02 malformed array literal`.
//
// ── Ce qui n'est délibérément pas indexé ────────────────────────────────────
//
// Les journaux d'appels MCP (`McpLog.inputPayload` / `outputPayload`). Indexés
// en clair, ils réintroduiraient dans une page de recherche les secrets que
// `lib/mcp/dto.ts` retire à la lecture. Un index doit être filtré à L'ENTRÉE ;
// ce n'est pas fait, donc la source n'existe pas.

/** Un terme de recherche : un motif SQL, un motif de pertinence, son texte. */
export type SearchTerm = {
  like: string;
  prefix: string;
  raw: string;
};

/**
 * Découpe une saisie en termes.
 *
 * Les jokers saisis par l'utilisateur (`%`, `_`) sont échappés : sans cela,
 * « 50% » chercherait « 50 suivi de n'importe quoi » et ramènerait un compte
 * entier. Les doublons sont écartés, et l'ordre est conservé : c'est lui qui
 * départage les résultats de pertinence égale.
 */
export function toSearchTerms(query: string): SearchTerm[] {
  const seen = new Set<string>();
  const terms: SearchTerm[] = [];

  for (const raw of query.split(/\s+/u)) {
    const token = raw.trim();
    if (!token) {
      continue;
    }
    const key = token.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    const escaped = token.replace(/[%_\\]/gu, (char) => `\\${char}`);
    terms.push({ like: `%${escaped}%`, prefix: `${escaped}%`, raw: token });
  }

  return terms;
}

/** Colonne comptant les lignes de la sélection courante, en un seul passage. */
function totalColumn() {
  return sql<number>`count(*) OVER ()::int`;
}

/**
 * Tous les termes doivent être trouvés (ET logique), chacun sur ses colonnes.
 *
 * `sql.join` est utilisé SANS parenthèses autour de ses éléments : Drizzle les
 * rend côte à côte, et c'est `and()` qui pose les parenthèses de grouping. Or
 * un `OR` nu change la portée du `AND` : sans elles, la clause devient
 *
 *   userId IN (…) AND titre ILIKE $4 OR tags ILIKE $5 AND titre ILIKE $6
 *
 * qui se lit comme `(userId AND titre OU tags) AND titre` — donc une ligne dont
 * seul un TAG contient le second terme passerait le filtre, alors qu'elle ne
 * contient pas le premier. C'est un contournement du périmètre d'identité : il
 * suffit d'avoir un tag forgé. Chaque groupe est donc parenthesé.
 */
function matchAllTerms(
  terms: SearchTerm[],
  columnsFor: (term: SearchTerm) => SQL[]
): SQL | undefined {
  if (terms.length === 0) {
    return;
  }
  const perTerm = terms.map(
    (term) => sql`(${sql.join(columnsFor(term), sql` OR `)})`
  );
  return sql.join(perTerm, sql` AND `);
}

/**
 * Ordre de pertinence : préfixe d'abord, puis n'importe où, puis le plus
 * récent.
 *
 * Un `CASE` sur la colonne principale suffit ; les autres colonnes ne rendent
 * la ligne éligible, elle ne la classent pas. Compter les correspondances
 * (`regexp_count` par colonne) coûterait un calcul par terme pour un ordre
 * réel à peine meilleur.
 */
function relevance(column: SQL, terms: SearchTerm[]) {
  const rank = sql.join(
    terms.map(
      (term, index) =>
        sql`CASE WHEN ${column} ILIKE ${term.prefix} THEN ${index} ELSE ${terms.length} END`
    ),
    sql` + `
  );
  return [sql`${rank}`, desc(column)];
}

/** Une date en ISO, ou `undefined` quand elle est absente ou illisible. */
function toDate(value: Date | string | null | undefined): string | undefined {
  if (!value) {
    return;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function toNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function excerpt(value: string, length = 140): string {
  const text = value.replace(/\s+/gu, " ").trim();
  if (text.length <= length) {
    return text;
  }
  const cut = text.slice(0, length);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > length * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

const EMPTY: SourceResult = { capped: false, hits: [], total: 0 };

/** Concatène les variantes d'identité en liste liée : `IN ($1, $2, $3)`. */
function identityList(userIds: string[]): SQL {
  return sql.join(
    userIds.map((userId) => sql`${userId}`),
    sql`, `
  );
}

type SourceResolver = {
  key: SearchSourceKey;
  search: (
    ctx: SourceSearchContext,
    terms: SearchTerm[]
  ) => Promise<SourceResult>;
};

// ── Discussions ────────────────────────────────────────────────────────────

const chatSource: SourceResolver = {
  key: "chat",
  search: async (ctx, terms) => {
    const database = getDb();
    // Les archives sont comprises, et signalées dans la ligne secondaire : les
    // cacher laisserait un trou muet dans l'historique, alors qu'une
    // conversation archivée reste une conversation.
    const rows = await database
      .select({
        createdAt: chat.createdAt,
        id: chat.id,
        isArchived: chat.isArchived,
        tags: chat.tags,
        title: chat.title,
        total: totalColumn(),
      })
      .from(chat)
      .where(
        and(
          inArray(chat.userId, ctx.userIds),
          matchAllTerms(terms, (term) => [
            sql`${chat.title} ILIKE ${term.like}`,
            sql`EXISTS (SELECT 1 FROM unnest(${chat.tags}) tag WHERE tag ILIKE ${term.like})`,
          ])
        )
      )
      .orderBy(...relevance(sql`${chat.title}`, terms))
      .limit(ctx.limit)
      .offset(ctx.offset);

    return {
      capped: rows.length === ctx.limit,
      hits: rows.map((row) => ({
        href: `/chat/${row.id}`,
        id: row.id,
        meta: toDate(row.createdAt),
        source: "chat" as const,
        subtitle: row.isArchived
          ? "Archivée"
          : (row.tags ?? []).map((tag) => `#${tag}`).join(" "),
        title: row.title || "Sans titre",
      })),
      total: toNumber(rows[0]?.total),
    };
  },
};

// ── Messages ───────────────────────────────────────────────────────────────

/** Premier contenu textuel d'un message, sans supposer la forme du `json`. */
function messageText(parts: unknown): string {
  if (!Array.isArray(parts)) {
    return "";
  }
  for (const part of parts as Array<{ text?: unknown }>) {
    if (part && typeof part.text === "string" && part.text.length > 0) {
      return part.text;
    }
  }
  return "";
}

const messageSource: SourceResolver = {
  key: "message",
  search: async (ctx, terms) => {
    const database = getDb();
    // `Message_v2` ne porte aucun `userId` : le propriétaire passe par la
    // discussion. Sans cette jointure, la recherche lirait les conversations
    // d'autrui — le pire bug possible ici.
    const rows = await database
      .select({
        chatId: message.chatId,
        chatTitle: chat.title,
        createdAt: message.createdAt,
        id: message.id,
        parts: message.parts,
        total: totalColumn(),
      })
      .from(message)
      .innerJoin(chat, sql`${message.chatId}::text = ${chat.id}::text`)
      .where(
        and(
          inArray(chat.userId, ctx.userIds),
          matchAllTerms(terms, (term) => [
            sql`${message.parts}::text ILIKE ${term.like}`,
            sql`${chat.title} ILIKE ${term.like}`,
          ])
        )
      )
      .orderBy(desc(message.createdAt))
      .limit(ctx.limit)
      .offset(ctx.offset);

    return {
      capped: rows.length === ctx.limit,
      hits: rows.map((row) => ({
        href: `/chat/${row.chatId}`,
        id: row.id,
        meta: toDate(row.createdAt),
        source: "message" as const,
        // Un message n'a pas de titre : on montre son extrait, puis la
        // discussion à laquelle il appartient.
        subtitle: excerpt(messageText(row.parts)),
        title: `Dans « ${row.chatTitle || "Sans titre"} »`,
      })),
      total: toNumber(rows[0]?.total),
    };
  },
};

// ── Projets ────────────────────────────────────────────────────────────────

const projectSource: SourceResolver = {
  key: "project",
  search: async (ctx, terms) => {
    const database = getDb();
    const identity = identityList(ctx.userIds);
    // Possédé OU partagé : un projet partagé passe par `ProjectMember`, sinon la
    // recherche ne verrait que la moitié de ce que l'utilisateur voit dans la
    // barre latérale.
    const owned = sql`${project.userId}::text IN (${identity})`;
    const shared = sql`EXISTS (SELECT 1 FROM "ProjectMember" pm WHERE pm."projectId" = ${project.id} AND pm."userId"::text IN (${identity}))`;

    const rows = await database
      .select({
        description: project.description,
        id: project.id,
        name: project.name,
        total: totalColumn(),
        updatedAt: project.updatedAt,
      })
      .from(project)
      .where(
        and(
          sql`(${owned} OR ${shared})`,
          matchAllTerms(terms, (term) => [
            sql`${project.name} ILIKE ${term.like}`,
            sql`${project.description} ILIKE ${term.like}`,
          ])
        )
      )
      .orderBy(...relevance(sql`${project.name}`, terms))
      .limit(ctx.limit)
      .offset(ctx.offset);

    return {
      capped: rows.length === ctx.limit,
      hits: rows.map((row) => ({
        href: `/projects/${row.id}`,
        id: row.id,
        meta: toDate(row.updatedAt),
        source: "project" as const,
        subtitle: excerpt(row.description ?? "") || "Projet",
        title: row.name,
      })),
      total: toNumber(rows[0]?.total),
    };
  },
};

// ── Fichiers de projet (texte extrait) ──────────────────────────────────────

const docSource: SourceResolver = {
  key: "doc",
  search: async (ctx, terms) => {
    // `ProjectFile` n'a aucun `userId` : l'accès passe par les projets dont
    // l'utilisateur est propriétaire ou membre. Sans cette liste, un fichier
    // indexé serait visible par tout le monde.
    const projectIds = await getAccessibleProjectIds({
      userEmail: ctx.user.email,
      userId: ctx.user.id ?? "",
    });
    if (projectIds.length === 0) {
      return EMPTY;
    }

    const database = getDb();
    const rows = await database
      .select({
        contentType: projectFile.contentType,
        extractedText: projectFile.extractedText,
        fileName: projectFile.fileName,
        id: projectFile.id,
        projectId: projectFile.projectId,
        total: totalColumn(),
      })
      .from(projectFile)
      .where(
        and(
          inArray(projectFile.projectId, projectIds),
          matchAllTerms(terms, (term) => [
            sql`${projectFile.fileName} ILIKE ${term.like}`,
            sql`${projectFile.extractedText} ILIKE ${term.like}`,
          ])
        )
      )
      .orderBy(...relevance(sql`${projectFile.fileName}`, terms))
      .limit(ctx.limit)
      .offset(ctx.offset);

    return {
      capped: rows.length === ctx.limit,
      hits: rows.map((row) => ({
        // Aucune route par fichier : on mène au projet, qui est la seule page
        // où le contenu extrait est consultable.
        href: `/projects/${row.projectId}`,
        id: row.id,
        source: "doc" as const,
        subtitle: excerpt(row.extractedText ?? "") || row.contentType,
        title: row.fileName,
      })),
      total: toNumber(rows[0]?.total),
    };
  },
};

// ── Skills ─────────────────────────────────────────────────────────────────

const skillSource: SourceResolver = {
  key: "skill",
  search: async (ctx, terms) => {
    const database = getDb();
    const rows = await database
      .select({
        description: skill.description,
        id: skill.id,
        instructions: skill.instructions,
        name: skill.name,
        total: totalColumn(),
        updatedAt: skill.updatedAt,
      })
      .from(skill)
      .where(
        and(
          inArray(skill.userId, ctx.userIds),
          matchAllTerms(terms, (term) => [
            sql`${skill.name} ILIKE ${term.like}`,
            sql`${skill.description} ILIKE ${term.like}`,
            sql`${skill.instructions} ILIKE ${term.like}`,
          ])
        )
      )
      .orderBy(...relevance(sql`${skill.name}`, terms))
      .limit(ctx.limit)
      .offset(ctx.offset);

    return {
      capped: rows.length === ctx.limit,
      hits: rows.map((row) => ({
        // La page Skills vit sous Applications : c'est `/tools?tab=skills` qui
        // l'ouvre, et non l'ancienne route `/skills`. Le détail d'une skill a
        // sa propre route, `/tools/skills/[skillId]`.
        href: `/tools/skills/${row.id}`,
        id: row.id,
        meta: toDate(row.updatedAt),
        source: "skill" as const,
        // Les instructions sont ce que l'on cherche (« comment je génère le
        // rapport »), pas la description d'une ligne de catalogue.
        subtitle: excerpt(row.instructions) || row.description || "Skill",
        title: row.name,
      })),
      total: toNumber(rows[0]?.total),
    };
  },
};

// ── Serveurs MCP ───────────────────────────────────────────────────────────

const mcpSource: SourceResolver = {
  key: "mcp",
  search: async (ctx, terms) => {
    const database = getDb();
    const rows = await database
      .select({
        description: mcpServer.description,
        id: mcpServer.id,
        name: mcpServer.name,
        total: totalColumn(),
      })
      .from(mcpServer)
      .where(
        and(
          inArray(mcpServer.userId, ctx.userIds),
          matchAllTerms(terms, (term) => [
            sql`${mcpServer.name} ILIKE ${term.like}`,
            sql`${mcpServer.description} ILIKE ${term.like}`,
          ])
        )
      )
      .orderBy(...relevance(sql`${mcpServer.name}`, terms))
      .limit(ctx.limit)
      .offset(ctx.offset);

    return {
      capped: rows.length === ctx.limit,
      hits: rows.map((row) => ({
        href: "/mcp",
        id: row.id,
        source: "mcp" as const,
        subtitle: row.description || "Serveur MCP",
        title: row.name,
      })),
      total: toNumber(rows[0]?.total),
    };
  },
};

// ── Bots ───────────────────────────────────────────────────────────────────

const botSource: SourceResolver = {
  key: "bot",
  search: async (ctx, terms) => {
    const database = getDb();
    const rows = await database
      .select({
        description: agent.description,
        id: agent.id,
        instructions: agent.instructions,
        name: agent.name,
        total: totalColumn(),
      })
      .from(agent)
      .where(
        and(
          inArray(agent.userId, ctx.userIds),
          matchAllTerms(terms, (term) => [
            sql`${agent.name} ILIKE ${term.like}`,
            sql`${agent.description} ILIKE ${term.like}`,
            sql`${agent.instructions} ILIKE ${term.like}`,
          ])
        )
      )
      .orderBy(...relevance(sql`${agent.name}`, terms))
      .limit(ctx.limit)
      .offset(ctx.offset);

    return {
      capped: rows.length === ctx.limit,
      hits: rows.map((row) => ({
        href: "/agents",
        id: row.id,
        source: "bot" as const,
        subtitle: excerpt(row.instructions) || row.description || "Bot",
        title: row.name,
      })),
      total: toNumber(rows[0]?.total),
    };
  },
};

// ── Mémoire ────────────────────────────────────────────────────────────────

const memorySource: SourceResolver = {
  key: "memory",
  search: async (ctx, terms) => {
    const database = getDb();
    // Aucune restriction de portée : `searchMemories` (lib/db/queries.ts) ne
    // lit que la mémoire globale, alors qu'un compte peut avoir des souvenirs
    // liés à un bot ou à un projet — qui sont les siens aussi.
    const rows = await database
      .select({
        content: userMemory.content,
        createdAt: userMemory.createdAt,
        id: userMemory.id,
        isImportant: userMemory.isImportant,
        total: totalColumn(),
      })
      .from(userMemory)
      .where(
        and(
          inArray(userMemory.userId, ctx.userIds),
          matchAllTerms(terms, (term) => [
            sql`${userMemory.content} ILIKE ${term.like}`,
          ])
        )
      )
      .orderBy(desc(userMemory.isImportant), desc(userMemory.createdAt))
      .limit(ctx.limit)
      .offset(ctx.offset);

    return {
      capped: rows.length === ctx.limit,
      hits: rows.map((row) => ({
        href: "/settings?tab=memory",
        id: row.id,
        meta: toDate(row.createdAt),
        source: "memory" as const,
        subtitle: "Mémoire",
        title: excerpt(row.content, 90),
      })),
      total: toNumber(rows[0]?.total),
    };
  },
};

// ── Commandes enregistrées ─────────────────────────────────────────────────

/** Texte lisible d'une commande, quel que soit son `actionType`. */
function commandBody(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "Commande";
  }
  const record = payload as Record<string, unknown>;
  for (const key of [
    "prompt",
    "text",
    "content",
    "url",
    "skillId",
    "agentId",
  ]) {
    const value = record[key];
    if (typeof value === "string" && value.length > 0) {
      return excerpt(value, 90);
    }
  }
  return "Commande";
}

const commandSource: SourceResolver = {
  key: "command",
  search: async (ctx, terms) => {
    const database = getDb();
    const rows = await database
      .select({
        description: customCommand.description,
        id: customCommand.id,
        name: customCommand.name,
        payload: customCommand.payload,
        total: totalColumn(),
        trigger: customCommand.trigger,
        usageCount: customCommand.usageCount,
      })
      .from(customCommand)
      .where(
        and(
          inArray(customCommand.userId, ctx.userIds),
          matchAllTerms(terms, (term) => [
            sql`${customCommand.name} ILIKE ${term.like}`,
            sql`${customCommand.trigger} ILIKE ${term.like}`,
            sql`${customCommand.description} ILIKE ${term.like}`,
            // Le corps d'une commande de type `prompt` vit dans le `json` : sans
            // cette recherche, « synthèse du rapport » ne ramènerait que les
            // commandes dont le NOM contient le mot.
            sql`${customCommand.payload}::text ILIKE ${term.like}`,
          ])
        )
      )
      .orderBy(
        desc(customCommand.usageCount),
        ...relevance(sql`${customCommand.name}`, terms)
      )
      .limit(ctx.limit)
      .offset(ctx.offset);

    return {
      capped: rows.length === ctx.limit,
      hits: rows.map((row) => ({
        // Une commande ne se visite pas : elle s'emploie. Le client laisse le
        // déclencheur dans la boîte de saisie du Chat et l'utilisateur
        // valide — rien n'est envoyé tout seul.
        href: "/",
        id: row.id,
        meta: `${row.usageCount} usage${row.usageCount > 1 ? "s" : ""}`,
        pendingPrompt: `/${row.trigger}`,
        source: "command" as const,
        subtitle: row.description || commandBody(row.payload),
        title: `/${row.trigger} — ${row.name}`,
      })),
      total: toNumber(rows[0]?.total),
    };
  },
};

// ── Planification ───────────────────────────────────────────────────────────

const planningSource: SourceResolver = {
  key: "planning",
  search: async (ctx, terms) => {
    const database = getDb();
    const rows = await database
      .select({
        id: scheduledMessage.id,
        prompt: scheduledMessage.prompt,
        recurrence: scheduledMessage.recurrence,
        status: scheduledMessage.status,
        title: scheduledMessage.title,
        total: totalColumn(),
      })
      .from(scheduledMessage)
      .where(
        and(
          inArray(scheduledMessage.userId, ctx.userIds),
          matchAllTerms(terms, (term) => [
            sql`${scheduledMessage.title} ILIKE ${term.like}`,
            sql`${scheduledMessage.prompt} ILIKE ${term.like}`,
            sql`${scheduledMessage.lastError} ILIKE ${term.like}`,
          ])
        )
      )
      .orderBy(...relevance(sql`${scheduledMessage.title}`, terms))
      .limit(ctx.limit)
      .offset(ctx.offset);

    return {
      capped: rows.length === ctx.limit,
      hits: rows.map((row) => ({
        href: "/planning",
        id: row.id,
        meta: row.recurrence === "none" ? "Unique" : row.recurrence,
        source: "planning" as const,
        subtitle: excerpt(row.prompt),
        title: row.title,
      })),
      total: toNumber(rows[0]?.total),
    };
  },
};

// ── Étapes d'agent ──────────────────────────────────────────────────────────

const runSource: SourceResolver = {
  key: "run",
  search: async (ctx, terms) => {
    const database = getDb();
    // `AgentStep` n'a pas de `userId` : on remonte au run, puis à son
    // propriétaire. `AgentRun.chatId` est une FK non nulle, donc chaque étape a
    // une conversation vers laquelle pointer.
    const rows = await database
      .select({
        chatId: agentRun.chatId,
        model: agentRun.model,
        runId: agentStep.runId,
        status: agentRun.status,
        summary: agentStep.summary,
        title: agentStep.title,
        total: totalColumn(),
      })
      .from(agentStep)
      .innerJoin(agentRun, sql`${agentStep.runId}::text = ${agentRun.id}::text`)
      .where(
        and(
          inArray(agentRun.userId, ctx.userIds),
          matchAllTerms(terms, (term) => [
            sql`${agentStep.title} ILIKE ${term.like}`,
            sql`${agentStep.summary} ILIKE ${term.like}`,
            sql`${agentRun.model} ILIKE ${term.like}`,
          ])
        )
      )
      .orderBy(...relevance(sql`${agentStep.title}`, terms))
      .limit(ctx.limit)
      .offset(ctx.offset);

    return {
      capped: rows.length === ctx.limit,
      hits: rows.map((row) => ({
        href: `/chat/${row.chatId}`,
        id: `${row.runId}-${row.title}`,
        meta: row.status,
        source: "run" as const,
        subtitle: excerpt(row.summary ?? "") || row.model,
        title: row.title,
      })),
      total: toNumber(rows[0]?.total),
    };
  },
};

// ── Modèles utilisés (statistiques) ─────────────────────────────────────────

const statsSource: SourceResolver = {
  key: "stats",
  search: async (ctx, terms) => {
    const database = getDb();
    // Agrégat : un modèle est un HIT, pas une ligne. `count(*) OVER ()` est donc
    // posé APRÈS le regroupement — il compte les groupes, c'est-à-dire les
    // modèles distincts qui correspondent.
    const rows = await database
      .select({
        model: usageEvent.model,
        tokens: sql<string>`sum(${usageEvent.totalTokens})::text`,
        total: totalColumn(),
      })
      .from(usageEvent)
      .where(
        and(
          inArray(usageEvent.userId, ctx.userIds),
          eq(usageEvent.isGhostMode, false),
          matchAllTerms(terms, (term) => [
            sql`${usageEvent.model} ILIKE ${term.like}`,
          ])
        )
      )
      .groupBy(usageEvent.model)
      .orderBy(sql`sum(${usageEvent.totalTokens}) DESC`)
      .limit(ctx.limit)
      .offset(ctx.offset);

    return {
      capped: rows.length === ctx.limit,
      hits: rows.map((row) => ({
        href: "/settings/statistiques",
        id: row.model ?? "inconnu",
        meta: `${toNumber(row.tokens).toLocaleString("fr-FR")} tokens`,
        source: "stats" as const,
        subtitle: "Consommation cumulée",
        title: row.model ?? "inconnu",
      })),
      total: toNumber(rows[0]?.total),
    };
  },
};

// ── Générations d'images ───────────────────────────────────────────────────

const imageSource: SourceResolver = {
  key: "image",
  search: async (ctx, terms) => {
    const database = getDb();
    const rows = await database
      .select({
        createdAt: mprojectsImageGenerations.createdAt,
        id: mprojectsImageGenerations.id,
        model: mprojectsImageGenerations.model,
        prompt: mprojectsImageGenerations.prompt,
        title: mprojectsImageGenerations.title,
        total: totalColumn(),
      })
      .from(mprojectsImageGenerations)
      .where(
        and(
          inArray(mprojectsImageGenerations.userId, ctx.userIds),
          matchAllTerms(terms, (term) => [
            sql`${mprojectsImageGenerations.prompt} ILIKE ${term.like}`,
            sql`${mprojectsImageGenerations.title} ILIKE ${term.like}`,
            sql`${mprojectsImageGenerations.model} ILIKE ${term.like}`,
          ])
        )
      )
      .orderBy(desc(mprojectsImageGenerations.createdAt))
      .limit(ctx.limit)
      .offset(ctx.offset);

    return {
      capped: rows.length === ctx.limit,
      hits: rows.map((row) => ({
        href: "/images",
        id: row.id,
        meta: toDate(row.createdAt),
        source: "image" as const,
        subtitle: row.model,
        title: row.title || excerpt(row.prompt, 80),
      })),
      total: toNumber(rows[0]?.total),
    };
  },
};

// ── Générations audio ──────────────────────────────────────────────────────

const audioSource: SourceResolver = {
  key: "audio",
  search: async (ctx, terms) => {
    const database = getDb();
    const rows = await database
      .select({
        createdAt: mprojectsSpeechGenerations.createdAt,
        id: mprojectsSpeechGenerations.id,
        inputText: mprojectsSpeechGenerations.inputText,
        model: mprojectsSpeechGenerations.model,
        title: mprojectsSpeechGenerations.title,
        total: totalColumn(),
        voice: mprojectsSpeechGenerations.voice,
      })
      .from(mprojectsSpeechGenerations)
      .where(
        and(
          inArray(mprojectsSpeechGenerations.userId, ctx.userIds),
          matchAllTerms(terms, (term) => [
            sql`${mprojectsSpeechGenerations.inputText} ILIKE ${term.like}`,
            sql`${mprojectsSpeechGenerations.title} ILIKE ${term.like}`,
            sql`${mprojectsSpeechGenerations.model} ILIKE ${term.like}`,
          ])
        )
      )
      .orderBy(desc(mprojectsSpeechGenerations.createdAt))
      .limit(ctx.limit)
      .offset(ctx.offset);

    return {
      capped: rows.length === ctx.limit,
      hits: rows.map((row) => ({
        href: "/audio",
        id: row.id,
        meta: toDate(row.createdAt),
        source: "audio" as const,
        subtitle: [row.model, row.voice].filter(Boolean).join(" · "),
        title: row.title || excerpt(row.inputText, 80),
      })),
      total: toNumber(rows[0]?.total),
    };
  },
};

// ── Catalogues de modèles (amont) ──────────────────────────────────────────

type UpstreamModel = {
  description?: string;
  id: string;
  name?: string;
  owned_by?: string;
  provider?: string;
};

/** Liste de modèles au format OpenAI, telle que la renvoie l'amont. */
async function listUpstreamModels(
  path: string
): Promise<UpstreamModel[] | null> {
  try {
    const token = await getMaiSessionToken();
    if (!token) {
      return null;
    }
    const response = await fetch(`${MAI_API_URL}${path}`, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      return null;
    }
    const payload = (await response.json()) as { data?: unknown };
    if (!Array.isArray(payload?.data)) {
      return null;
    }
    return payload.data as UpstreamModel[];
  } catch {
    return null;
  }
}

const modelSource: SourceResolver = {
  key: "model",
  search: async (_ctx, terms) => {
    const lower = terms.map((term) => term.raw.toLowerCase());
    const matches = (model: UpstreamModel) => {
      const haystack =
        `${model.name ?? ""} ${model.id} ${model.description ?? ""} ${model.provider ?? ""}`.toLowerCase();
      return lower.every((token) => haystack.includes(token));
    };
    const toHit = (
      model: UpstreamModel & { name: string },
      href: string,
      kind: string
    ): SearchHit => ({
      href,
      id: `${kind}-${model.id}`,
      meta: model.provider ?? model.owned_by,
      source: "model" as const,
      subtitle: model.description || model.id,
      title: model.name,
    });

    // Le catalogue texte passe par la même fonction que le sélecteur de modèle,
    // et les deux autres par l'amont, avec le même jeton de session que leurs
    // routes BFF. Un catalogue est une liste, pas une base : le total est donc
    // EXACT, et « charger plus » n'a rien à apporter.
    const [textModels, imageModels, audioModels] = await Promise.all([
      fetchUserModels().catch(() => []),
      listUpstreamModels("/v1/models/images"),
      listUpstreamModels("/v1/models/speech"),
    ]);

    const hits: SearchHit[] = [
      ...textModels
        .filter(matches)
        .map((model) =>
          toHit(
            { ...model, name: model.name || model.id },
            "/settings",
            "texte"
          )
        ),
      ...(imageModels ?? []).filter(matches).map((model) =>
        toHit(
          {
            ...model,
            name: normalizeModelDisplayName(model.id, model.name || model.id),
          },
          "/images",
          "image"
        )
      ),
      ...(audioModels ?? []).filter(matches).map((model) =>
        toHit(
          {
            ...model,
            name: normalizeModelDisplayName(model.id, model.name || model.id),
          },
          "/audio",
          "audio"
        )
      ),
    ];

    return { capped: false, hits, total: hits.length };
  },
};

// ── Plugins ────────────────────────────────────────────────────────────────

const pluginSource: SourceResolver = {
  key: "plugin",
  search: async (ctx, terms) => {
    const database = getDb();
    const installed = await database
      .select({ pluginId: pluginInstallation.pluginId })
      .from(pluginInstallation)
      .where(inArray(pluginInstallation.userId, ctx.userIds));
    const owned = new Set(installed.map((row) => row.pluginId));
    if (owned.size === 0) {
      return EMPTY;
    }

    // Le texte d'un plugin vit dans le CATALOGUE versionné, pas en base : le
    // filtre se fait donc en mémoire, et l'appartenance vient de l'installation.
    const lower = terms.map((term) => term.raw.toLowerCase());
    const hits = PLUGIN_MANIFEST_LIST.filter(
      (plugin) =>
        owned.has(plugin.id) &&
        lower.every((token) =>
          `${plugin.name} ${plugin.description} ${plugin.tags.join(" ")}`
            .toLowerCase()
            .includes(token)
        )
    ).map((plugin) => ({
      href: `/tools/plugins/${plugin.id}`,
      id: plugin.id,
      meta: plugin.category,
      source: "plugin" as const,
      subtitle: plugin.description,
      title: plugin.name,
    }));

    return { capped: false, hits, total: hits.length };
  },
};

// ── Fichiers Cloud (amont) ─────────────────────────────────────────────────

type CloudFile = {
  id: string;
  mime_type: string;
  original_name: string;
  url: string;
};

/**
 * Fichiers Cloud : aucune ligne en base, le compte est chez l'amont.
 *
 * La liste est intégralement téléchargée puis filtrée ici : c'est le prix d'une
 * source non indexable, et la raison pour laquelle elle n'a pas de curseur —
 * son total est la longueur de la liste.
 */
async function listCloudFiles(): Promise<CloudFile[]> {
  try {
    const token = await getMaiSessionToken();
    if (!token) {
      return [];
    }
    const response = await fetch(`${MAI_API_URL}/cloud/files`, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      return [];
    }
    const payload = (await response.json()) as { files?: CloudFile[] };
    return payload.files ?? [];
  } catch {
    return [];
  }
}

const cloudFileSource: SourceResolver = {
  key: "file",
  search: async (_ctx, terms) => {
    const files = await listCloudFiles();
    const lower = terms.map((term) => term.raw.toLowerCase());
    const hits = files
      .filter((file) => {
        const haystack =
          `${file.original_name} ${file.mime_type}`.toLowerCase();
        return lower.every((token) => haystack.includes(token));
      })
      .map((file) => ({
        external: true,
        href: file.url,
        id: file.id,
        meta: file.mime_type,
        source: "file" as const,
        title: file.original_name,
      }));

    return { capped: false, hits, total: hits.length };
  },
};

/** Sources interrogées en base : une requête chacune, total compris. */
const SQL_SOURCES: SourceResolver[] = [
  chatSource,
  messageSource,
  projectSource,
  docSource,
  skillSource,
  mcpSource,
  botSource,
  memorySource,
  commandSource,
  planningSource,
  runSource,
  statsSource,
  imageSource,
  audioSource,
];

/**
 * Sources lues chez l'amont ou dans le catalogue : le total est la longueur du
 * tableau, donc il n'y a rien à paginer et `capped` reste `false`.
 */
const UPSTREAM_SOURCES: SourceResolver[] = [
  modelSource,
  pluginSource,
  cloudFileSource,
];

const ALL_SOURCES = [...SQL_SOURCES, ...UPSTREAM_SOURCES];

/**
 * Ordre d'affichage. Il suit l'usage plutôt que l'alphabet : ce qu'on cherche
 * en premier est une discussion, ce qu'on cherche en dernier est un fichier
 * Cloud. L'ordre des clés demandées ne change rien — les groupes sont
 * réordonnés ici, pas dans la réponse.
 */
export const SOURCE_ORDER: SearchSourceKey[] = [
  "chat",
  "message",
  "project",
  "doc",
  "skill",
  "command",
  "mcp",
  "bot",
  "memory",
  "planning",
  "run",
  "image",
  "audio",
  "model",
  "stats",
  "plugin",
  "file",
];

export type IndexQuery = {
  limit: number;
  offset: number;
  query: string;
  sources: SearchSourceKey[];
  user: {
    email?: string | null;
    id?: string | null;
    tier?: string | null;
    username?: string | null;
  };
};

/**
 * Interroge les sources demandées et renvoie une page.
 *
 * `Promise.allSettled` est délibéré : une source qui tombe (table absente sur un
 * environnement non migré, amont indisponible) ne doit pas faire échouer les
 * seize autres. Les sources en échec sont nommées dans `failed`, pour que la
 * page dise laquelle manque au lieu d'afficher un « aucun résultat » trompeur.
 */
export async function searchIndex(
  input: IndexQuery
): Promise<SearchIndexResponse> {
  const terms = toSearchTerms(input.query);
  const identity = [input.user.id, input.user.email, input.user.username]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter((value) => value.length > 0);
  const userIds = [...new Set(identity)];

  if (terms.length === 0 || userIds.length === 0) {
    return { counts: {}, failed: [], hits: [], nextOffset: null, total: 0 };
  }

  const isPaid = isPaidTier(input.user.tier);
  const ctx: SourceSearchContext = {
    isPaid,
    limit: input.limit,
    offset: input.offset,
    user: {
      email: input.user.email ?? null,
      id: input.user.id ?? null,
    },
    userIds,
  };

  const requested = new Set(input.sources);
  const resolvers = ALL_SOURCES.filter(
    (resolver) =>
      requested.has(resolver.key) &&
      (!PAID_ONLY_SOURCES.includes(resolver.key) || isPaid)
  );

  const settled = await Promise.allSettled(
    resolvers.map((resolver) => resolver.search(ctx, terms))
  );

  const counts: SearchIndexResponse["counts"] = {};
  const failed: SearchSourceKey[] = [];
  const hits: SearchHit[] = [];
  let total = 0;
  let cappedSources = 0;

  settled.forEach((outcome, position) => {
    const resolver = resolvers[position];
    if (outcome.status === "rejected") {
      failed.push(resolver.key);
      console.error(
        `[mAI] Index de recherche : source « ${resolver.key} » indisponible`,
        outcome.reason instanceof Error
          ? outcome.reason.message
          : outcome.reason
      );
      return;
    }
    const result = outcome.value;
    counts[resolver.key] = result.total;
    total += result.total;
    hits.push(...result.hits);
    if (result.capped) {
      cappedSources += 1;
    }
  });

  return {
    counts,
    failed,
    hits,
    // Une source plafonnée a forcément des résultats au-delà de la page : le
    // client peut donc proposer « charger plus ».
    nextOffset: cappedSources > 0 ? input.offset + input.limit : null,
    total,
  };
}
