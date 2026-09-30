import "server-only";

import {
  and,
  asc,
  eq,
  gte,
  inArray,
  isNotNull,
  isNull,
  lte,
  sql,
} from "drizzle-orm";
import { FALLBACK_MODELS, normalizeModelDisplayName } from "@/lib/ai/models";
import { dbReady, getDb } from "@/lib/db/queries";
import {
  chat,
  mprojectsImageGenerations,
  mprojectsSpeechGenerations,
  project,
  usageEvent,
} from "@/lib/db/schema";
import {
  getActivity,
  getDailyActivity,
  resolveHeatmapStart,
} from "@/lib/stats/activity-stats";
import { resolveUserIdScope, toNumber } from "@/lib/stats/sql-helpers";
import {
  bucketKey,
  buildBucketAxis,
  countBuckets,
  maxPointsFor,
  resolvePeriodStart,
  type StatsConsumptionPoint,
  type StatsConversationsPoint,
  type StatsFilterOptions,
  type StatsGranularity,
  type StatsModelUsage,
  type StatsQuery,
  type UsageStats,
} from "@/lib/stats/stats-types";

// Agrégations de la page Statistiques. Toute lecture de la consommation d'un
// utilisateur passe par ici : la route API et l'outil `getUsageStats` s'y
// rattachent, jamais en parallèle.
//
// ── Trois sources, trois unités, et ce qu'on peut leur demander ─────────────
//
// 1. `UsageEvent` — tokens TEXTE. Une ligne par appel modèle, alimentée par le
//    Chat (lib/chat/stream.ts), l'Agent (lib/agent/runtime.ts) et la
//    planification (lib/planning/executor.ts). Seule source portant un lien
//    vers la conversation (`chatId`, migration 0033), donc seule source
//    compatible avec les filtres « mode » et « projet ».
//
// 2. `mprojects_speech_generations` — tokens AUDIO via `tokensCount`. La seule
//    table média qui porte un compteur de tokens.
//
// 3. `mprojects_image_generations` — NOMBRE de générations d'images. Aucune
//    table ne compte les tokens d'une image : le quota image est un compteur de
//    requêtes côté backend et `estimateRunCost()` renvoie `null` par
//    conception. On ne fabrique donc pas d'unité — la série est un décompte, sur
//    un AXE SECONDAIRE. Poser des requêtes et des tokens sur un axe unique
//    serait un mensonge graphique ; le deuxième axe est la conséquence de la
//    donnée, pas une décoration.
//
// Deux limites assumées, remontées à l'utilisateur via `warnings` plutôt que
// laissées passer en silence :
//
// - les filtres « mode » et « projet » ne peuvent PAS s'appliquer aux séries
//   image et audio (ni `mprojects_*` ni `UsageEvent` ne portent de `chatId`) ;
// - le sélecteur de modèle, le routeur LLM et la compaction de l'Agent
//   dédupliquent leur comptage SANS clé d'idempotence, donc sans ligne
//   `UsageEvent` : leur consommation n'apparaît dans aucune série. Le débit de
//   quota, lui, les compte (voir lib/agent/accounting.ts).
//
// ── Conversations supprimées ────────────────────────────────────────────────
// Les filtres « mode » et « projet » lisent `UsageEvent.chatMode` et
// `UsageEvent.chatProjectId`, figés à l'écriture (migration 0035), et NON une
// jointure `Chat`. La différence n'est pas cosmétique : `deleteChatById` retire
// la ligne `Chat` alors que le journal de consommation, lui, survit (aucune clé
// étrangère). Avec la jointure, poser le filtre « Mode Chat » faisait chuter le
// total de tokens de toutes les conversations supprimées — et le révoquer ne
// rendait rien, puisque la ligne avait disparu de la requête. Même remarque
// pour le projet : `Chat.projectId` est en `ON DELETE SET NULL`, donc la
// jointure perdait aussi l'information à la suppression d'un projet.
//
// Une ligne sans attribution (conversation supprimée avant la migration 0035)
// reste comptée dans les totaux non filtrés — une consommation réalisée ne
// disparaît d'aucun chiffre global — mais ne peut pas être rattachée à un mode
// ou à un projet. La page le signale plutôt que de laisser croire à un trou
// inexistant : voir `countUnattributedTokens`.

/**
 * Sentinelle d'un `UsageEvent` sans modèle. Volontairement une constante et
 * non une chaîne en dur : elle sert à la fois de valeur de repli SQL
 * (`coalesce`) et de libellé affiché, et les deux ne doivent pas diverger.
 */
const UNKNOWN_MODEL = "inconnu";

/** Résolution interne du périmètre : dates, granularités, identité. */
type ResolvedScope = {
  consumptionGranularity: StatsGranularity;
  conversationsGranularity: StatsGranularity;
  from: Date;
  to: Date;
  userIds: string[];
  /** Vrai si la période demandée est « tout l'historique ». */
  unbounded: boolean;
};

/**
 * Granularité du graphique de consommation : hebdomadaire par défaut, repli
 * mensuel au-delà du plafond de points. Regrouper est préférable à tronquer,
 * parce que tronquer supprimerait la période la plus récente — celle que
 * l'utilisateur consulte.
 */
function resolveConsumptionGranularity(from: Date, to: Date): StatsGranularity {
  return countBuckets(from, to, "week") <= maxPointsFor("week")
    ? "week"
    : "month";
}

/**
 * Granularité du graphique de conversations.
 *
 * Mensuelle comme demandé, avec un repli en semaine sur les périodes trop
 * courtes : à 7 ou 30 jours, le mois ne produit qu'une colonne et ne dit rien
 * de l'évolution. L'axe est étiqueté avec la valeur réellement employée, donc
 * l'interface n'annonce jamais une échelle qu'elle n'utilise pas.
 */
function resolveConversationsGranularity(
  from: Date,
  to: Date
): StatsGranularity {
  if (countBuckets(from, to, "month") >= 2) {
    return "month";
  }
  return countBuckets(from, to, "week") <= maxPointsFor("week")
    ? "week"
    : "month";
}

/**
 * Nom affichable d'un modèle, résolu côté serveur.
 *
 * Trois|source, dans cet ordre : le catalogue connu de l'application, puis le
 * registre de discussion, puis une reconstruction depuis l'identifiant. Aucun
 * composant ne fait ce travail : « `space-bunny-alpha` » n'est pas un nom, et
 * l'identifiant brut reste dans le payload (`model`) pour qui doit le citer.
 *
 * Une valeur vide ou la sentinelle `inconnu` (ligne `UsageEvent` sans modèle)
 * sont rendues telles quelles : afficher « Inconnu » pour un compteur réellement
 * inconnu vaut mieux que d'inventer un nom de modèle.
 */
function resolveModelName(modelId: string): string {
  const trimmed = modelId.trim();
  if (!trimmed || trimmed === UNKNOWN_MODEL) {
    return trimmed || UNKNOWN_MODEL;
  }
  const known = FALLBACK_MODELS.find((entry) => entry.id === trimmed);
  if (known) {
    return normalizeModelDisplayName(known.id, known.name);
  }
  // Identifiant observé en base mais absent du catalogue (modèle retiré,
  // identifiant historique) : `normalizeModelDisplayName` le rend lisible
  // (« stealth/space-bunny-alpha » → « Space Bunny Alpha ») au lieu de laisser
  // un identifiant brut à l'écran.
  return normalizeModelDisplayName(trimmed);
}

/** Modèles classés par volume de tokens, avec part relative. */
function rankModels(
  rows: { model: string | null; tokens: string }[],
  limit: number
): StatsModelUsage[] {
  const total = rows.reduce((sum, row) => sum + toNumber(row.tokens), 0);
  return rows
    .map((row) => ({
      model: row.model ?? UNKNOWN_MODEL,
      name: resolveModelName(row.model ?? UNKNOWN_MODEL),
      share: total > 0 ? toNumber(row.tokens) / total : 0,
      tokens: toNumber(row.tokens),
    }))
    .sort((a, b) => b.tokens - a.tokens)
    .slice(0, limit);
}

/**
 * Agrégat `UsageEvent` par modèle, sur la fenêtre et les filtres donnés.
 *
 * Aucune jointure : les filtres « mode » et « projet » sont des comparaisons de
 * colonnes dénormalisées (migration 0035), donc la requête la plus fréquente de
 * la page — celle qui ne demande aucun filtre — se contente de
 * `UsageEvent_userId_createdAt_idx`, et les autres ne perdent rien quand une
 * conversation a été supprimée.
 */
async function aggregateModels(
  query: StatsQuery,
  scope: ResolvedScope
): Promise<{ models: StatsModelUsage[]; totalTokens: number }> {
  const database = getDb();

  const conditions = [
    inArray(usageEvent.userId, scope.userIds),
    eq(usageEvent.isGhostMode, false),
    gte(usageEvent.createdAt, scope.from),
    lte(usageEvent.createdAt, scope.to),
    query.model ? eq(usageEvent.model, query.model) : undefined,
    query.mode ? eq(usageEvent.chatMode, query.mode) : undefined,
    query.projectId ? eq(usageEvent.chatProjectId, query.projectId) : undefined,
  ];
  const model = sql<
    string | null
  >`coalesce(${usageEvent.model}, ${UNKNOWN_MODEL})`;
  const tokens = sql<string>`coalesce(sum(${usageEvent.totalTokens}), 0)::text`;

  const rows = await database
    .select({ model, tokens })
    .from(usageEvent)
    .where(and(...conditions))
    .groupBy(model);

  // Le total est calculé AVANT le plafonnement à 6 entrées : le KPI « Tokens
  // totaux » doit compter tous les modèles, y compris ceux qui n'entrent pas
  // dans le classement, sans quoi il sous-estimerait l'usage en silence. C'est
  // aussi ce qui laisse chaque modèle afficher une part exacte.
  return {
    models: rankModels(rows, 6),
    totalTokens: rows.reduce((sum, row) => sum + toNumber(row.tokens), 0),
  };
}

/**
 * Tokens de la fenêtre qui portent une conversation mais AUCUNE attribution
 * (migration 0035) : conversation supprimée avant le backfill, ou ligne de
 * planification écrite sans conversation persistée.
 *
 * N'est appelé que lorsqu'un filtre « mode » ou « projet » est actif, et
 * uniquement pour déclencher un `warning`. Sans cette mesure, un filtre
 * excluant ces lignes afficherait un total simplement plus petit, sans que
 * l'utilisateur puisse savoir pourquoi — l'écart serait lu comme une erreur de
 * calcul alors que c'est une information absente, donc non restituable.
 */
async function countUnattributedTokens(
  query: StatsQuery,
  scope: ResolvedScope
): Promise<number> {
  if (!query.mode && !query.projectId) {
    return 0;
  }
  const database = getDb();
  const rows = await database
    .select({
      tokens: sql<string>`coalesce(sum(${usageEvent.totalTokens}), 0)::text`,
    })
    .from(usageEvent)
    .where(
      and(
        inArray(usageEvent.userId, scope.userIds),
        eq(usageEvent.isGhostMode, false),
        gte(usageEvent.createdAt, scope.from),
        lte(usageEvent.createdAt, scope.to),
        // Conversation connue, attribution inconnue : c'est le seul cas qu'un
        // filtre par mode ou par projet ne peut pas trancher. Les lignes sans
        // conversation ne sont pas comptées ici — elles sont déjà hors de
        // tout filtre « conversation », ce que le warning.images/audio dit.
        isNotNull(usageEvent.chatId),
        isNull(usageEvent.chatMode)
      )
    );
  return toNumber(rows.at(0)?.tokens);
}

/**
 * Consommation et conversations, deux séries à deux granularités distinctes.
 *
 * Les buckets sans donnée sont matérialisés à zéro via `buildBucketAxis` : sans
 * eux, une semaine inactive disparaît de l'axe et se lit comme une rupture
 * d'activité qui n'a jamais eu lieu.
 */
async function aggregateSeries(
  query: StatsQuery,
  scope: ResolvedScope
): Promise<{
  consumption: StatsConsumptionPoint[];
  conversations: StatsConversationsPoint[];
}> {
  const database = getDb();
  const consumptionTrunc =
    scope.consumptionGranularity === "week"
      ? sql`date_trunc('week', ${usageEvent.createdAt})`
      : sql`date_trunc('month', ${usageEvent.createdAt})`;
  const conversationsTrunc =
    scope.conversationsGranularity === "week"
      ? sql`date_trunc('week', ${chat.createdAt})`
      : sql`date_trunc('month', ${chat.createdAt})`;

  // Les deux sources média partagent la granularité de la CONSOMMATION — elles
  // sont tracées sur le même graphique — mais chacune a sa propre colonne : les
  // trois tables n'ont pas les mêmes noms de colonnes, réutiliser l'expression
  // du texte y référencerait `"UsageEvent"."createdAt"` dans une requête portant
  // sur `mprojects_speech_generations`.
  const audioTrunc =
    scope.consumptionGranularity === "week"
      ? sql`date_trunc('week', ${mprojectsSpeechGenerations.createdAt})`
      : sql`date_trunc('month', ${mprojectsSpeechGenerations.createdAt})`;
  const imageTrunc =
    scope.consumptionGranularity === "week"
      ? sql`date_trunc('week', ${mprojectsImageGenerations.createdAt})`
      : sql`date_trunc('month', ${mprojectsImageGenerations.createdAt})`;

  const textConditions = [
    inArray(usageEvent.userId, scope.userIds),
    eq(usageEvent.isGhostMode, false),
    gte(usageEvent.createdAt, scope.from),
    lte(usageEvent.createdAt, scope.to),
    query.model ? eq(usageEvent.model, query.model) : undefined,
    // Colonnes dénormalisées (migration 0035) : la série de tokens reste
    // complète après la suppression d'une conversation, ce qu'une jointure
    // `Chat` ne permettait pas.
    query.mode ? eq(usageEvent.chatMode, query.mode) : undefined,
    query.projectId ? eq(usageEvent.chatProjectId, query.projectId) : undefined,
  ];
  const textTokens = sql<string>`coalesce(sum(${usageEvent.totalTokens}), 0)::text`;

  const textRows = await database
    .select({
      bucket: sql<string>`${consumptionTrunc}::text`,
      tokens: textTokens,
    })
    .from(usageEvent)
    .where(and(...textConditions))
    .groupBy(consumptionTrunc)
    .orderBy(asc(consumptionTrunc));

  const consumptionAxis = buildBucketAxis(
    scope.from,
    scope.to,
    scope.consumptionGranularity
  );
  const consumption = consumptionAxis.map((date) => {
    const key = bucketKey(date);
    const row = textRows.find((entry) => entry.bucket.slice(0, 10) === key);
    return {
      audioTokens: 0,
      bucket: key,
      imageCount: 0,
      textTokens: toNumber(row?.tokens),
    };
  });

  // Les deux séries média sont alignées sur l'axe de CONSOMMATION (donc sur sa
  // granularité hebdomadaire ou mensuelle), pas sur celui des conversations :
  // elles appartiennent au même graphique.
  const audioColumn = mprojectsSpeechGenerations.createdAt;
  const audioRows = await database
    .select({
      bucket: sql<string>`${audioTrunc}::text`,
      tokens: sql<string>`coalesce(sum(${mprojectsSpeechGenerations.tokensCount}), 0)::text`,
    })
    .from(mprojectsSpeechGenerations)
    .where(
      and(
        inArray(mprojectsSpeechGenerations.userId, scope.userIds),
        gte(audioColumn, scope.from),
        lte(audioColumn, scope.to)
      )
    )
    .groupBy(audioTrunc);

  const imageColumn = mprojectsImageGenerations.createdAt;
  const imageRows = await database
    .select({
      bucket: sql<string>`${imageTrunc}::text`,
      count: sql<string>`count(*)::text`,
    })
    .from(mprojectsImageGenerations)
    .where(
      and(
        inArray(mprojectsImageGenerations.userId, scope.userIds),
        gte(imageColumn, scope.from),
        lte(imageColumn, scope.to)
      )
    )
    .groupBy(imageTrunc);

  for (const point of consumption) {
    const audio = audioRows.find(
      (row) => row.bucket.slice(0, 10) === point.bucket
    );
    const image = imageRows.find(
      (row) => row.bucket.slice(0, 10) === point.bucket
    );
    point.audioTokens = toNumber(audio?.tokens);
    point.imageCount = toNumber(image?.count);
  }

  // Conversations créées dans la période, réparties par mode. `createdAt` et
  // non « activité sur la période » : c'est le sens demandé, et cela évite
  // une jointure `Message_v2` dont le coût n'apporterait rien de plus lisible.
  const chatRows = await database
    .select({
      agent: sql<string>`count(*) FILTER (WHERE ${chat.mode} = 'agent')::text`,
      bucket: sql<string>`${conversationsTrunc}::text`,
      chat: sql<string>`count(*) FILTER (WHERE ${chat.mode} = 'chat')::text`,
    })
    .from(chat)
    .where(
      and(
        inArray(chat.userId, scope.userIds),
        gte(chat.createdAt, scope.from),
        lte(chat.createdAt, scope.to),
        query.mode ? eq(chat.mode, query.mode) : undefined,
        query.projectId ? eq(chat.projectId, query.projectId) : undefined
      )
    )
    .groupBy(conversationsTrunc)
    .orderBy(asc(conversationsTrunc));

  const conversationsAxis = buildBucketAxis(
    scope.from,
    scope.to,
    scope.conversationsGranularity
  );
  const conversations = conversationsAxis.map((date) => {
    const key = bucketKey(date);
    const row = chatRows.find((entry) => entry.bucket.slice(0, 10) === key);
    return {
      agent: toNumber(row?.agent),
      bucket: key,
      chat: toNumber(row?.chat),
    };
  });

  return { consumption, conversations };
}

/** Listes d'options des deux filtres à liste, sur la fenêtre courante. */
async function getFilterOptions(
  scope: ResolvedScope
): Promise<StatsFilterOptions> {
  const database = getDb();

  const modelRows = await database
    .selectDistinct({ model: usageEvent.model })
    .from(usageEvent)
    .where(
      and(
        inArray(usageEvent.userId, scope.userIds),
        eq(usageEvent.isGhostMode, false),
        gte(usageEvent.createdAt, scope.from),
        lte(usageEvent.createdAt, scope.to)
      )
    )
    .orderBy(asc(usageEvent.model));

  const projectRows = await database
    .select({ id: project.id, name: project.name })
    .from(project)
    .where(
      and(inArray(project.userId, scope.userIds), eq(project.isArchived, false))
    )
    .orderBy(asc(project.name));

  return {
    // Le NOM est résolu ici, côté serveur : `resolveModelName` lit le
    // catalogue. L'interface affiche donc « Space Bunny Alpha » sans jamais
    // reconstruire un nom à partir d'un identifiant, et l'identifiant brut
    // reste disponible comme `id` — c'est lui que la requête attend.
    models: modelRows
      .map((row) => row.model)
      .filter((model): model is string => Boolean(model))
      .map((model) => ({ id: model, name: resolveModelName(model) })),
    projects: projectRows.map((row) => ({ id: row.id, name: row.name })),
  };
}

/**
 * Plus ancien `createdAt` visible du compte, toutes sources confondues.
 * Sans ce plancher, « tout l'historique » produirait des centaines de buckets
 * vides pour un compte créé il y a six ans. Une seule requête grâce à un
 * `UNION ALL` sur les trois tables.
 *
 * Le SQL est écrit à la main parce que le `UNION ALL` mélange trois tables aux
 * colonnes dénormalisées (`"userId"` contre `"user_id"`). La liste des
 * identifiants, elle, reste liée paramètre par paramètre comme partout ailleurs
 * dans ce fichier : `ANY(${userIds})` produirait `ANY(($1, $2))`, c'est-à-dire
 * un constructeur de ligne et non un `text[]`, et Postgres répondrait `22P02
 * malformed array literal` — c'est-à-dire la page entière en erreur, puisque
 * cette requête précède toutes les autres.
 */
async function getEarliestDate(userIds: string[]): Promise<Date | null> {
  if (userIds.length === 0) {
    return null;
  }
  const database = getDb();
  // `inArray` construit exactement cette liste, mais sur une colonne Drizzle ;
  // ici les colonnes sont citées en SQL brut, d'où le `sql.join` explicite.
  const userIdList = sql.join(
    userIds.map((userId) => sql`${userId}`),
    sql`, `
  );
  const rows = await database.execute<{ earliest: string | null }>(sql`
    SELECT min(earliest_at) AS earliest FROM (
      SELECT min("createdAt") AS earliest_at FROM "UsageEvent"
        WHERE "userId" IN (${userIdList}) AND "isGhostMode" = false
      UNION ALL
      SELECT min("created_at") FROM "mprojects_speech_generations"
        WHERE "user_id" IN (${userIdList})
      UNION ALL
      SELECT min("created_at") FROM "mprojects_image_generations"
        WHERE "user_id" IN (${userIdList})
    ) AS sources
  `);
  const value = rows[0]?.earliest;
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Vide analytique : aucun historique, aucun filtre possible. */
function emptyUsageStats(
  query: StatsQuery,
  now: Date,
  warnings: string[] = []
): UsageStats {
  const today = now.toISOString().slice(0, 10);
  return {
    activity: {
      agentShare: 0,
      chatShare: 0,
      longestAgentTaskMs: 0,
      peakWeekStart: null,
      peakWeekTokens: 0,
      streaks: { current: 0, longest: 0 },
      tools: [],
      topReasoning: null,
      totals: {
        distinctSkillsUsed: 0,
        totalChats: 0,
        totalMessages: 0,
        totalSkillInvocations: 0,
      },
    },
    consumption: [],
    consumptionGranularity: "week",
    conversations: [],
    conversationsGranularity: "week",
    daily: [],
    dailyFrom: today,
    filterOptions: { models: [], projects: [] },
    from: now.toISOString(),
    models: [],
    overview: {
      topModel: null,
      totalAudioTokens: 0,
      totalConversations: 0,
      totalImages: 0,
      totalTokens: 0,
    },
    period: query.period,
    to: now.toISOString(),
    warnings,
  };
}

/**
 * Point d'entrée unique : assemble la réponse complète de la page.
 *
 * Les KPI sont calculés par des requêtes de total, jamais par somme des buckets
 * : un chiffre d'« historique complet » ne doit pas dépendre de la granularité
 * choisie pour un graphique.
 */
export async function getUsageStats(
  user: { email?: string | null; id?: string | null },
  query: StatsQuery,
  now: Date = new Date()
): Promise<UsageStats> {
  await dbReady();

  const userIds = resolveUserIdScope(user);
  if (userIds.length === 0) {
    return emptyUsageStats(query, now);
  }

  const warnings: string[] = [];
  let from = resolvePeriodStart(query.period, now);

  if (from === null) {
    // « Tout l'historique » : on ancre la fenêtre sur la plus ancienne donnée
    // réellement présente plutôt que sur une date arbitraire.
    const earliest = await getEarliestDate(userIds);
    if (earliest === null) {
      return {
        ...emptyUsageStats(query, now),
        warnings: [
          "Aucun historique de consommation n'a été trouvé pour ce compte.",
        ],
      };
    }
    from = earliest;
  }

  const scope: ResolvedScope = {
    consumptionGranularity: resolveConsumptionGranularity(from, now),
    conversationsGranularity: resolveConversationsGranularity(from, now),
    from,
    to: now,
    unbounded: query.period === "all",
    userIds,
  };

  if (scope.consumptionGranularity === "month") {
    warnings.push(
      `L'historique dépasse ${maxPointsFor("week")} semaines : la consommation est regroupée par mois.`
    );
  }
  if (scope.conversationsGranularity === "week") {
    warnings.push(
      "Période trop courte pour un axe mensuel : les conversations sont regroupées par semaine."
    );
  }
  if (query.mode || query.projectId) {
    warnings.push(
      "Le filtre ne s'applique qu'aux conversations et aux tokens texte : les images et l'audio ne sont rattachés à aucune conversation en base."
    );
  }

  // Conversations supprimées AVANT la migration 0035 : leurs lignes de
  // consommation existent encore, sans mode ni projet. Elles sortent donc du
  // filtrage, et le total affiché serait plus petit que le total réel sans que
  // l'écart ait une cause visible. On le nomme, avec son poids en tokens.
  const unattributedTokens = await countUnattributedTokens(query, scope);
  if (unattributedTokens > 0) {
    warnings.push(
      `${Math.round(unattributedTokens).toLocaleString("fr-FR")} tokens de la période appartiennent à des conversations supprimées avant leur attribution : ils restent comptés dans le total global, mais ne peuvent être rattachés ni à un mode ni à un projet.`
    );
  }

  const database = getDb();
  const today = now.toISOString().slice(0, 10);
  // La carte de chaleur est ancrée sur une fenêtre FIXE de 12 mois finissant
  // aujourd'hui, indépendante de `from` : c'est ce qui permet de lire une série
  // d'usage même quand on filtre sur 7 jours.
  const heatmapFrom = resolveHeatmapStart(now);

  const [
    modelRanking,
    series,
    filterOptions,
    conversationCount,
    imageCount,
    audioTokens,
    daily,
  ] = await Promise.all([
    aggregateModels(query, scope),
    aggregateSeries(query, scope),
    getFilterOptions(scope),
    database
      .select({ count: sql<string>`count(*)::text` })
      .from(chat)
      .where(
        and(
          inArray(chat.userId, userIds),
          gte(chat.createdAt, from),
          lte(chat.createdAt, now),
          query.mode ? eq(chat.mode, query.mode) : undefined,
          query.projectId ? eq(chat.projectId, query.projectId) : undefined
        )
      ),
    database
      .select({ count: sql<string>`count(*)::text` })
      .from(mprojectsImageGenerations)
      .where(
        and(
          inArray(mprojectsImageGenerations.userId, userIds),
          gte(mprojectsImageGenerations.createdAt, from),
          lte(mprojectsImageGenerations.createdAt, now)
        )
      ),
    database
      .select({
        tokens: sql<string>`coalesce(sum(${mprojectsSpeechGenerations.tokensCount}), 0)::text`,
      })
      .from(mprojectsSpeechGenerations)
      .where(
        and(
          inArray(mprojectsSpeechGenerations.userId, userIds),
          gte(mprojectsSpeechGenerations.createdAt, from),
          lte(mprojectsSpeechGenerations.createdAt, now)
        )
      ),
    getDailyActivity(userIds, heatmapFrom, now),
  ]);

  // Le bloc activité dépend de la série quotidienne (pour les séries de jours),
  // donc il est assemblé après le `Promise.all` : les requêtes qu'il porte sont
  // indépendantes de celles ci-dessus, seule la LECTURE du résultat doit attendre.
  const activity = await getActivity(userIds, daily, from, now, today);

  return {
    activity,
    consumption: series.consumption,
    consumptionGranularity: scope.consumptionGranularity,
    conversations: series.conversations,
    conversationsGranularity: scope.conversationsGranularity,
    daily,
    dailyFrom: bucketKey(heatmapFrom),
    filterOptions,
    from: from.toISOString(),
    models: modelRanking.models,
    overview: {
      topModel: modelRanking.models[0] ?? null,
      totalAudioTokens: toNumber(audioTokens[0]?.tokens),
      totalConversations: toNumber(conversationCount[0]?.count),
      totalImages: toNumber(imageCount[0]?.count),
      totalTokens: modelRanking.totalTokens,
    },
    period: query.period,
    to: now.toISOString(),
    warnings,
  };
}
