import "server-only";

import {
  and,
  desc,
  eq,
  gte,
  inArray,
  isNotNull,
  isNull,
  lte,
  sql,
} from "drizzle-orm";
import { REASONING_LEVEL_LABELS } from "@/lib/ai/registry/reasoning";
import { getDb } from "@/lib/db/queries";
import {
  agentRun,
  chat,
  mcpLog,
  message,
  mprojectsImageGenerations,
  mprojectsSpeechGenerations,
  skillUsage,
  toolExecution,
  usageEvent,
} from "@/lib/db/schema";
import { getPluginByToolId } from "@/lib/plugins/catalog";
import { toNumber } from "@/lib/stats/sql-helpers";
import {
  bucketKey,
  buildBucketAxis,
  HEATMAP_MONTHS,
  type StatsActivity,
  type StatsDailyActivity,
  type StatsStreaks,
  type StatsToolUsage,
} from "@/lib/stats/stats-types";

// Activité quotidienne : carte de chaleur, séries, et indicateurs annexes.
//
// Séparé de `usage-stats.ts` (consommation et conversations) parce que la
// fenêtre n'est pas la même : les graphiques suivent le filtre de période,
// alors que la carte de chaleur couvre TOUJOURS 12 mois — une grille de 7 jours
// n'a aucun intérêt en calendrier. Mélanger les deux fenêtres dans un seul
// module rendrait la règle impossible à lire.
//
// ── Ce que cette page sait et ne sait pas mesurer ─────────────────────────
//
// Deux limites de l'instrumentation imposent des libellés, elles ne se
// contournent pas :
//
// - Les appels d'OUTIL sont comptés sur les DEUX chemins, mais par deux tables
//   distinctes, et il faut savoir laquelle apporte quoi. `McpLog` ne reçoit que
//   les appels MCP du Chat ; `ToolExecution` reçoit les appels de l'Agent (mcp
//   ET plugins) et, depuis la migration 0036, les appels de PLUGIN du Chat
//   (`ToolExecution.userId` renseigné, `runId` nul). Le MCP du Chat reste dans
//   `McpLog` : y doublonner une ligne déjà présente n'apporterait rien.
// - Le chemin Chat ne mesure AUCUNE durée : `lib/chat/stream.ts` n'écrit que
//   des tokens. La « tâche la plus longue » est donc un indicateur Agent, et
//   l'interface le dit.
//
// ── Activité et conversations supprimées ─────────────────────────────────────
// `UsageEvent` survit à la suppression d'une conversation (aucune clé
// étrangère) ; `Chat` et `Message_v2` disparaissent. Compter les conversations
// et les messages sur `Chat` ferait donc disparaître retroactivement une
// journée d'activité dès que l'utilisateur range une conversation, et les
// séries « nombre de conversations » se réécriraient dans le passé.
//
// On distingue donc deux grandeurs, et on ne les mélange pas :
//
// - l'activité d'un JOUR (couleur de la carte de chaleur, séries de jours) est
//   portée par les TOKENS et les runs Agent, deux journaux sans clé étrangère :
//   elle ne bouge pas quand une conversation est supprimée ;
// - le nombre de CONVERSATIONS d'un jour est, lui, compté sur `Chat` PLUS les
//   conversations que seul `UsageEvent` connaît encore. C'est la seule
//   approximation possible : une conversation supprimée qui n'a jamais
//   consommé de token n'a laissé aucune trace nulle part, et personne ne peut
//   la retrouver. Le compteur est donc un PLANCHER, jamais un Excès — il ne peut
//   pas compter deux fois, la jointure d'exclusion étant stricte.

/** Début de la fenêtre de la carte : le 1er du mois, il y a 11 mois. */
export function resolveHeatmapStart(now: Date): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (HEATMAP_MONTHS - 1), 1)
  );
}

/**
 * Activité jour par jour, DENSE : un jour sans activité existe et vaut zéro.
 *
 * Six agrégats, une requête par table, fusionnés en JS sur la clé de jour —
 * 366 lignes au plus, ce qui reste triviale en mémoire et évite d'exécuter six
 * requêtes dépendantes l'une de l'autre. `index` sur le jour plutôt qu'un
 * `find` : la fusion serait sinon en 366² dans le pire cas.
 */
export async function getDailyActivity(
  userIds: string[],
  from: Date,
  to: Date
): Promise<StatsDailyActivity[]> {
  const database = getDb();

  const [textRows, audioRows, imageRows, deletedChatRows, chatRows, runRows] =
    await Promise.all([
      database
        .select({
          day: sql<string>`date_trunc('day', ${usageEvent.createdAt})::text`,
          tokens: sql<string>`coalesce(sum(${usageEvent.totalTokens}), 0)::text`,
        })
        .from(usageEvent)
        .where(
          and(
            inArray(usageEvent.userId, userIds),
            eq(usageEvent.isGhostMode, false),
            gte(usageEvent.createdAt, from),
            lte(usageEvent.createdAt, to)
          )
        )
        .groupBy(sql`date_trunc('day', ${usageEvent.createdAt})`),

      database
        .select({
          day: sql<string>`date_trunc('day', ${mprojectsSpeechGenerations.createdAt})::text`,
          tokens: sql<string>`coalesce(sum(${mprojectsSpeechGenerations.tokensCount}), 0)::text`,
        })
        .from(mprojectsSpeechGenerations)
        .where(
          and(
            inArray(mprojectsSpeechGenerations.userId, userIds),
            gte(mprojectsSpeechGenerations.createdAt, from),
            lte(mprojectsSpeechGenerations.createdAt, to)
          )
        )
        .groupBy(
          sql`date_trunc('day', ${mprojectsSpeechGenerations.createdAt})`
        ),

      database
        .select({
          count: sql<string>`count(*)::text`,
          day: sql<string>`date_trunc('day', ${mprojectsImageGenerations.createdAt})::text`,
        })
        .from(mprojectsImageGenerations)
        .where(
          and(
            inArray(mprojectsImageGenerations.userId, userIds),
            gte(mprojectsImageGenerations.createdAt, from),
            lte(mprojectsImageGenerations.createdAt, to)
          )
        )
        .groupBy(
          sql`date_trunc('day', ${mprojectsImageGenerations.createdAt})`
        ),

      // Conversations SUPPRIMÉES, connues par le seul journal de consommation.
      //
      // `count(DISTINCT "chatId")` et non `count(*)` : une conversation longue
      // génère plusieurs `UsageEvent`, et elle doit compter pour UN jour
      // d'activité. La jointure est une `LEFT JOIN` sur `Chat` + filtre
      // `IS NULL`, donc une conversation encore présente n'est PAS comptée ici :
      // elle l'est par la requête `Chat` ci-dessus. Sans ce terme, supprimer une
      // conversation effaçait rétroactivement sa journée de la carte de
      // chaleur et des séries.
      database
        .select({
          day: sql<string>`date_trunc('day', ${usageEvent.createdAt})::text`,
          total: sql<string>`count(DISTINCT ${usageEvent.chatId})::text`,
        })
        .from(usageEvent)
        .leftJoin(chat, eq(usageEvent.chatId, chat.id))
        .where(
          and(
            inArray(usageEvent.userId, userIds),
            eq(usageEvent.isGhostMode, false),
            gte(usageEvent.createdAt, from),
            lte(usageEvent.createdAt, to),
            isNotNull(usageEvent.chatId),
            isNull(chat.id)
          )
        )
        .groupBy(sql`date_trunc('day', ${usageEvent.createdAt})`),

      database
        .select({
          day: sql<string>`date_trunc('day', ${chat.createdAt})::text`,
          total: sql<string>`count(*)::text`,
        })
        .from(chat)
        .where(
          and(
            inArray(chat.userId, userIds),
            gte(chat.createdAt, from),
            lte(chat.createdAt, to)
          )
        )
        .groupBy(sql`date_trunc('day', ${chat.createdAt})`),

      database
        .select({
          day: sql<string>`date_trunc('day', ${agentRun.createdAt})::text`,
          total: sql<string>`count(*)::text`,
        })
        .from(agentRun)
        .where(
          and(
            inArray(agentRun.userId, userIds),
            gte(agentRun.createdAt, from),
            lte(agentRun.createdAt, to)
          )
        )
        .groupBy(sql`date_trunc('day', ${agentRun.createdAt})`),
    ]);

  const byDay = new Map<string, StatsDailyActivity>();
  const ensure = (key: string): StatsDailyActivity => {
    const existing = byDay.get(key);
    if (existing) {
      return existing;
    }
    const created: StatsDailyActivity = {
      agentRuns: 0,
      audioTokens: 0,
      conversations: 0,
      day: key,
      imageCount: 0,
      textTokens: 0,
      tokens: 0,
    };
    byDay.set(key, created);
    return created;
  };

  for (const row of textRows) {
    ensure(row.day.slice(0, 10)).textTokens = toNumber(row.tokens);
  }
  for (const row of audioRows) {
    ensure(row.day.slice(0, 10)).audioTokens = toNumber(row.tokens);
  }
  for (const row of imageRows) {
    ensure(row.day.slice(0, 10)).imageCount = toNumber(row.count);
  }
  for (const row of chatRows) {
    ensure(row.day.slice(0, 10)).conversations = toNumber(row.total);
  }
  // ADDITION, pas affectation : les deux requêtes sont disjointes par
  // construction (l'une ne compte que les conversations présentes, l'autre
  // seulement celles qui ne le sont plus), la somme ne peut donc pas doubler un
  // même jour. Sans ce terme, une conversation supprimée faisait disparaître
  // rétroactivement son jour des séries.
  for (const row of deletedChatRows) {
    ensure(row.day.slice(0, 10)).conversations += toNumber(row.total);
  }
  for (const row of runRows) {
    ensure(row.day.slice(0, 10)).agentRuns = toNumber(row.total);
  }

  return buildBucketAxis(from, to, "day").map((date) => {
    const entry = ensure(bucketKey(date));
    // `tokens` agrège texte + audio : c'est la valeur qui colore les cases.
    // Les images restent à part, mesurées en nombre et non en tokens.
    entry.tokens = entry.textTokens + entry.audioTokens;
    return entry;
  });
}

/**
 * Séries de jours consécutifs où au moins une conversation a été créée.
 *
 * Le seuil est « une conversation », pas « un token » : une série calculée sur
 * le moindre appel isolé serait optimiste — un jour de 200 tokens n'est pas une
 * journée d'usage, et un run nocturne automatisé suffirait à la prolonger.
 *
 * La série EN COURS ignore un jour vide qui est AUJOURD'HUI : l'utilisateur
 * n'a simplement pas encore utilisé l'application aujourd'hui, sa série n'est
 * pas perdue. Elle ne se rompt qu'à partir du jour précédent.
 */
export function computeStreaks(
  daily: StatsDailyActivity[],
  today: string
): StatsStreaks {
  let longest = 0;
  let run = 0;
  for (const entry of daily) {
    run = entry.conversations > 0 ? run + 1 : 0;
    if (run > longest) {
      longest = run;
    }
  }

  let current = 0;
  for (let index = daily.length - 1; index >= 0; index--) {
    const entry = daily[index];
    if (entry.conversations > 0) {
      current++;
      continue;
    }
    if (entry.day === today) {
      continue;
    }
    break;
  }

  return { current, longest };
}

/**
 * Pic de tokens sur la période, en semaine calendaire.
 *
 * Le pic est hebdo et non journalier : c'est l'unité qui correspond à la
 * période d'un quota (`weekly_usage`), donc à ce que l'utilisateur compare avec
 * sa jauge. Un pic journalier serait plus spectaculaire et sans lien avec rien
 * de ce que l'interface affiche ailleurs.
 */
async function getPeakWeek(
  userIds: string[],
  from: Date,
  to: Date
): Promise<{ tokens: number; weekStart: string | null }> {
  const database = getDb();
  const rows = await database
    .select({
      tokens: sql<string>`coalesce(sum(${usageEvent.totalTokens}), 0)::text`,
      week: sql<string>`date_trunc('week', ${usageEvent.createdAt})::text`,
    })
    .from(usageEvent)
    .where(
      and(
        inArray(usageEvent.userId, userIds),
        eq(usageEvent.isGhostMode, false),
        gte(usageEvent.createdAt, from),
        lte(usageEvent.createdAt, to)
      )
    )
    .groupBy(sql`date_trunc('week', ${usageEvent.createdAt})`)
    .orderBy(desc(sql`sum(${usageEvent.totalTokens})`))
    .limit(1);

  const row = rows.at(0);
  if (!row) {
    return { tokens: 0, weekStart: null };
  }
  return { tokens: toNumber(row.tokens), weekStart: row.week.slice(0, 10) };
}

/**
 * Durée de la plus longue tâche AGENT terminée.
 *
 * Deux sources de durée coexistent et l'une ment : `usage->>'durationMs'` est
 * ré-accumulé à chaque étape alors que chaque `onFinish` renvoie le temps
 * écoulé DEPUIS LE DÉBUT DU run — sur un run multi-étapes, la valeur est un
 * multiple de la durée réelle. On utilise donc `completedAt - startedAt`, comme
 * la route de résumé d'un run le fait déjà.
 *
 * Un `completedAt` nul exclut les runs en cours sans filtre supplémentaire :
 * on ne veut pas d'une « tâche » qui dure indéfiniment.
 */
async function getLongestAgentTaskMs(
  userIds: string[],
  from: Date,
  to: Date
): Promise<number> {
  const database = getDb();
  const rows = await database
    .select({
      durationMs: sql<string>`max(extract(epoch from (${agentRun.completedAt} - ${agentRun.startedAt})) * 1000)::text`,
    })
    .from(agentRun)
    .where(
      and(
        inArray(agentRun.userId, userIds),
        gte(agentRun.createdAt, from),
        lte(agentRun.createdAt, to),
        isNotNull(agentRun.completedAt),
        isNotNull(agentRun.startedAt)
      )
    );

  return Math.max(0, Math.round(toNumber(rows.at(0)?.durationMs)));
}

/**
 * Niveau de réflexion Agent le plus DEMANDÉ, et sa part.
 *
 * `AgentRun.reasoningLevel` stocke le niveau demandé, pas l'effectif : le
 * niveau réellement appliqué (que le modèle peut ramener à la baisse) n'est
 * émis que sur le flux SSE et n'est jamais persisté. L'indicateur est donc
 *.libellé « demandé » côté interface — la nuance compte, car « Moyenne » demandé
 * peut avoir été exécuté en « Faible ».
 */
async function getTopReasoning(
  userIds: string[],
  from: Date,
  to: Date
): Promise<StatsActivity["topReasoning"]> {
  const database = getDb();
  const rows = await database
    .select({
      level: agentRun.reasoningLevel,
      total: sql<string>`count(*)::text`,
    })
    .from(agentRun)
    .where(
      and(
        inArray(agentRun.userId, userIds),
        gte(agentRun.createdAt, from),
        lte(agentRun.createdAt, to)
      )
    )
    .groupBy(agentRun.reasoningLevel)
    .orderBy(desc(sql`count(*)`));

  const total = rows.reduce((sum, row) => sum + toNumber(row.total), 0);
  const top = rows.at(0);
  if (!top || total === 0) {
    return null;
  }
  // Un niveau illisible ne doit pas casser un KPI : on retombe sur l'identifiant
  // brut plutôt que d'afficher `undefined`.
  const label =
    REASONING_LEVEL_LABELS[top.level as keyof typeof REASONING_LEVEL_LABELS] ??
    top.level;

  return { label, level: top.level, share: toNumber(top.total) / total };
}

/**
 * Compteurs globaux : ils décrivent le COMPTE, pas la fenêtre.
 *
 * Deux de ces compteurs sont des plancherS et non des Measures, et la
 * différence est visible dans l'interface :
 *
 * - `totalChats` ajoute les conversations que seul `UsageEvent` connaît encore
 *   (supprimées). Sans ce terme, ranger une conversation faisait baisser
 *   rétroactivement un total qui décrit le compte et non une fenêtre : le
 *   chiffre se réécrivait dans le passé.
 * - `totalMessages` ne peut PAS être.render durable : `Message_v2` est supprimé
 *   avec la conversation et aucun journal ne compte les messages. Le compteur
 *   porte donc les messages des conversations ENCORE PRÉSENTES. L'interface
 *   l'annonce comme tel au lieu de laisser croire à un total complet.
 */
async function getTotals(userIds: string[]) {
  const database = getDb();
  const [chatCount, deletedChatCount, messageCount, skillRows] =
    await Promise.all([
      database
        .select({ count: sql<string>`count(*)::text` })
        .from(chat)
        .where(inArray(chat.userId, userIds)),
      // Conversations supprimées : `count(DISTINCT "chatId")` sur le journal de
      // consommation, jointure d'exclusion stricte — une conversation présente
      // est déjà comptée par la requête du dessus.
      database
        .select({
          count: sql<string>`count(DISTINCT ${usageEvent.chatId})::text`,
        })
        .from(usageEvent)
        .leftJoin(chat, eq(usageEvent.chatId, chat.id))
        .where(
          and(
            inArray(usageEvent.userId, userIds),
            eq(usageEvent.isGhostMode, false),
            isNotNull(usageEvent.chatId),
            isNull(chat.id)
          )
        ),
      // `Message_v2` n'a pas de `userId` : le total des messages impose une
      // jointure sur `Chat` — un parcours d'index par conversation, nettement plus
      // cher qu'un simple `count`. C'est pourquoi ce compteur n'est pas recalculé
      // par filtre de période mais une seule fois par réponse. Et comme les
      // messages partent avec la conversation, il ne compte que les
      // conversations vivantes — le libellé de l'interface le précise.
      database
        .select({ count: sql<string>`count(*)::text` })
        .from(message)
        .innerJoin(chat, eq(message.chatId, chat.id))
        .where(inArray(chat.userId, userIds)),
      // `SkillUsage` est UN compteur par (skill, utilisateur), pas un journal
      // d'événements : la somme donne le total d'invocations, le `count(distinct)`
      // le nombre de compétences réellement mobilisées. `Skill.usageCount` existe
      // en colonne mais n'est JAMAIS écrit — il serait toujours à zéro.
      database
        .select({
          distinct: sql<string>`count(DISTINCT ${skillUsage.skillId})::text`,
          invocations: sql<string>`coalesce(sum(${skillUsage.invocationCount}), 0)::text`,
        })
        .from(skillUsage)
        .where(inArray(skillUsage.userId, userIds)),
    ]);

  return {
    distinctSkillsUsed: toNumber(skillRows.at(0)?.distinct),
    // Somme des deux termes disjoints : conversations vivantes + conversations
    // supprimées mais encore connues du journal de consommation.
    totalChats:
      toNumber(chatCount.at(0)?.count) +
      toNumber(deletedChatCount.at(0)?.count),
    totalMessages: toNumber(messageCount.at(0)?.count),
    totalSkillInvocations: toNumber(skillRows.at(0)?.invocations),
  };
}

/**
 * Répartition Chat / Agent en pourcentage, sur la période.
 *
 * Comme les compteurs de conversations, la répartition additionne les
 * conversations SUPPRIMÉES, lues dans `UsageEvent.chatMode` (migration 0035) —
 * dénormalisé à l'écriture, donc disponible même quand la ligne `Chat` a
 * disparu. Sans ce terme, supprimer toutes ses conversations Agent faisait
 * tomber la part à 0 %, ce qui se lirait comme « je n'utilise plus l'Agent ».
 *
 * Le mode vient du JOUR DE CONSOMMATION de la conversation supprimée, pas de
 * sa date de création : c'est la seule date qui survive, et c'est celle qui
 * décide de la période affichée. Une conversation supprimée ne peut donc pas
 * apparaître dans une période où elle n'a rien consommé.
 */
async function getModeSplit(
  userIds: string[],
  from: Date,
  to: Date
): Promise<{ agentShare: number; chatShare: number }> {
  const database = getDb();
  const [rows, deletedRows] = await Promise.all([
    database
      .select({
        agent: sql<string>`count(*) FILTER (WHERE ${chat.mode} = 'agent')::text`,
        chat: sql<string>`count(*)::text`,
      })
      .from(chat)
      .where(
        and(
          inArray(chat.userId, userIds),
          gte(chat.createdAt, from),
          lte(chat.createdAt, to)
        )
      ),
    database
      .select({
        agent: sql<string>`count(DISTINCT ${usageEvent.chatId}) FILTER (WHERE ${usageEvent.chatMode} = 'agent')::text`,
        chat: sql<string>`count(DISTINCT ${usageEvent.chatId})::text`,
      })
      .from(usageEvent)
      .leftJoin(chat, eq(usageEvent.chatId, chat.id))
      .where(
        and(
          inArray(usageEvent.userId, userIds),
          eq(usageEvent.isGhostMode, false),
          gte(usageEvent.createdAt, from),
          lte(usageEvent.createdAt, to),
          isNotNull(usageEvent.chatId),
          isNull(chat.id)
        )
      ),
  ]);

  const row = rows.at(0);
  const deleted = deletedRows.at(0);
  const chatTotal = toNumber(row?.chat) + toNumber(deleted?.chat);
  const agentTotal = toNumber(row?.agent) + toNumber(deleted?.agent);
  if (chatTotal === 0) {
    return { agentShare: 0, chatShare: 0 };
  }
  return {
    agentShare: agentTotal / chatTotal,
    chatShare: (chatTotal - agentTotal) / chatTotal,
  };
}

/**
 * Outils les plus utilisés, en FUSIONNANT les trois sources d'événements qui
 * portent un compte d'exécution.
 *
 * - `ToolExecution` avec `runId` : les appels de l'Agent, MCP ET plugins, lus
 *   par jointure sur `AgentRun` (c'est le seul chemin d'identité avant la 0036).
 * - `ToolExecution` avec `runId` nul : les appels de PLUGIN du chemin Chat
 *   (migration 0036). La colonne `userId`, renseignée uniquement sur ces lignes,
 *   est la condition qui les distingue — pas `chatId`, qui peut être nul.
 * - `McpLog` : les appels MCP du Chat. Le MCP du Chat n'est PAS aussi écrit
 *   dans `ToolExecution` : le compter deux fois gonflerait le total. Les clés
 *   de fusion des deux côtés sont distinctes (`mcp:<serveur>`), donc un même
 *   serveur apparaît une seule ligne, somme des deux modes.
 *
 * Le classement est donc COMPLET pour les deux modes et pour les deux natures
 * d'outil, ce qui n'était pas le cas : un plugin utilisé en mode Chat
 * affichait 0 exécution, un chiffre absent et non un chiffre faible.
 */
async function getTopTools(
  userIds: string[],
  from: Date,
  to: Date
): Promise<{ tools: StatsToolUsage[] }> {
  const database = getDb();

  const [agentRows, chatPluginRows, chatMcpRows] = await Promise.all([
    // `ToolExecution` n'a de `userId` que pour le chemin Chat : l'identité d'un
    // appel Agent vient donc de son run, et la jointure est obligatoire.
    database
      .select({
        category: toolExecution.category,
        count: sql<string>`count(*)::text`,
        toolId: toolExecution.toolId,
      })
      .from(toolExecution)
      .innerJoin(agentRun, eq(toolExecution.runId, agentRun.id))
      .where(
        and(
          inArray(agentRun.userId, userIds),
          inArray(toolExecution.category, ["mcp", "plugins"]),
          gte(toolExecution.createdAt, from),
          lte(toolExecution.createdAt, to)
        )
      )
      .groupBy(toolExecution.category, toolExecution.toolId),

    // ChemIN CHAT : `runId` nul et `userId` renseigné. Seule la catégorie
    // `plugins` est lue ici, le MCP du Chat restant dans `McpLog` — l'écrire
    // aussi ici compterait chaque appel deux fois.
    database
      .select({
        count: sql<string>`count(*)::text`,
        toolId: toolExecution.toolId,
      })
      .from(toolExecution)
      .where(
        and(
          inArray(toolExecution.userId, userIds),
          isNull(toolExecution.runId),
          eq(toolExecution.category, "plugins"),
          gte(toolExecution.createdAt, from),
          lte(toolExecution.createdAt, to)
        )
      )
      .groupBy(toolExecution.toolId),

    // `serverName` est dénormalisé : le compte survit à la suppression du
    // serveur, ce qui est le comportement attendu d'un historique.
    database
      .select({
        count: sql<string>`count(*)::text`,
        serverId: mcpLog.serverId,
        serverName: mcpLog.serverName,
      })
      .from(mcpLog)
      .where(
        and(
          inArray(mcpLog.userId, userIds),
          gte(mcpLog.createdAt, from),
          lte(mcpLog.createdAt, to)
        )
      )
      .groupBy(mcpLog.serverId, mcpLog.serverName),
  ]);

  const totals = new Map<string, StatsToolUsage>();
  const bump = (
    key: string,
    label: string,
    scope: StatsToolUsage["scope"],
    field: "agentExecutions" | "chatExecutions",
    value: number
  ) => {
    const existing = totals.get(key);
    if (existing) {
      existing[field] += value;
      existing.total = existing.agentExecutions + existing.chatExecutions;
      return;
    }
    totals.set(key, {
      agentExecutions: field === "agentExecutions" ? value : 0,
      chatExecutions: field === "chatExecutions" ? value : 0,
      label,
      scope,
      total: value,
    });
  };

  /**
   * Clé et libellé d'un outil de plugin, résolus par le catalogue.
   *
   * La clé est l'identifiant du PLUGIN, pas celui de l'outil : les deux chemins
   * écrivent le même `toolId` et doivent donc tomber dans la même ligne, sans
   * quoi un plugin utilisé en Chat et en Agent apparaîtrait deux fois. Un
   * plugin retiré du catalogue reste compté sous son identifiant brut : le
   * masquer ferait disparaître une partie de l'usage réel.
   */
  const pluginIdentity = (toolId: string): { key: string; label: string } => {
    const manifest = getPluginByToolId(toolId);
    return manifest
      ? { key: `plugin:${manifest.id}`, label: manifest.name }
      : { key: `plugin:${toolId}`, label: toolId };
  };

  for (const row of agentRows) {
    if (row.category === "plugins") {
      // `toolId` est l'identifiant BRUT de l'outil du plugin, non préfixé : il
      // faut le catalogue pour remonter au plugin propriétaire.
      const { key, label } = pluginIdentity(row.toolId);
      bump(key, label, "plugin", "agentExecutions", toNumber(row.count));
      continue;
    }
    // MCP côté Agent : l'identifiant est préfixé `mcp_<slug>_<outil>`.
    bump(
      `mcp:agent:${row.toolId}`,
      row.toolId.replace(/^mcp_/, "").replace(/_/g, " "),
      "mcp",
      "agentExecutions",
      toNumber(row.count)
    );
  }

  // Plugins du chemin Chat : mêmes clés que ci-dessus, donc `bump` additionne
  // au total existant au lieu de créer une seconde ligne pour le même plugin.
  for (const row of chatPluginRows) {
    const { key, label } = pluginIdentity(row.toolId);
    bump(key, label, "plugin", "chatExecutions", toNumber(row.count));
  }

  for (const row of chatMcpRows) {
    bump(
      `mcp:${row.serverId ?? row.serverName}`,
      row.serverName,
      "mcp",
      "chatExecutions",
      toNumber(row.count)
    );
  }

  return {
    tools: [...totals.values()]
      .filter((entry) => entry.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5),
  };
}

/** Assemble le bloc `activity` de la réponse. */
export async function getActivity(
  userIds: string[],
  daily: StatsDailyActivity[],
  from: Date,
  to: Date,
  today: string
): Promise<StatsActivity> {
  const [peak, longest, reasoning, totals, tools, split] = await Promise.all([
    getPeakWeek(userIds, from, to),
    getLongestAgentTaskMs(userIds, from, to),
    getTopReasoning(userIds, from, to),
    getTotals(userIds),
    getTopTools(userIds, from, to),
    getModeSplit(userIds, from, to),
  ]);

  return {
    ...split,
    longestAgentTaskMs: longest,
    peakWeekStart: peak.weekStart,
    peakWeekTokens: peak.tokens,
    streaks: computeStreaks(daily, today),
    tools: tools.tools,
    topReasoning: reasoning,
    totals,
  };
}
