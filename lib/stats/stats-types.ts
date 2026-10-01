// Vocabulaire et logique PURE de la page Statistiques. Aucun accès base, aucun
// import serveur : ce module est importé à la fois par la route API (côté
// serveur) et par la page (côté client) pour construire les mêmes clés de
// cache SWR. Tout ce qui touche à la base vit dans `lib/stats/usage-stats.ts`,
// qui est `server-only`.
//
// Découpage motivé par une contrainte Next.js : un composant client ne peut
// pas importer un module marqué `server-only`, même pour ses types. Extraire
// le contrat ici permet à la page de typer sa réponse sans franchir cette
// frontière.

/** Périodes proposées par le filtre de la page. `all` = tout l'historique. */
export const STATS_PERIODS = ["7d", "30d", "90d", "12m", "all"] as const;
export type StatsPeriod = (typeof STATS_PERIODS)[number];

export const STATS_PERIOD_LABELS: Record<StatsPeriod, string> = {
  "7d": "7 jours",
  "12m": "12 mois",
  "30d": "30 jours",
  "90d": "90 jours",
  all: "Tout",
};

/** Les deux modes de conversation persistés par `Chat.mode`. */
export const STATS_MODES = ["chat", "agent"] as const;
export type StatsMode = (typeof STATS_MODES)[number];

export const STATS_MODE_LABELS: Record<StatsMode, string> = {
  agent: "Agent",
  chat: "Chat",
};

/**
 * Types de contenu représentés sur la courbe de consommation. Ils n'ont PAS la
 * même unité et ne doivent jamais être comparés directement :
 *
 * - `text` et `audio` sont des TOKENS (mesurés) ;
 * - `image` est un NOMBRE de générations — aucune table ne porte de compteur de
 *   tokens pour les images, voir `usage-stats.ts`.
 *
 * D'où l'axe secondaire du graphique et l'avertissement affiché sous la courbe.
 */
export const STATS_KINDS = ["text", "image", "audio"] as const;
export type StatsKind = (typeof STATS_KINDS)[number];

export const STATS_KIND_LABELS: Record<StatsKind, string> = {
  audio: "Audio",
  image: "Image",
  text: "Texte",
};

/** Granularité effective d'une série temporelle. */
export type StatsGranularity = "day" | "month" | "week";

export const STATS_GRANULARITY_LABELS: Record<StatsGranularity, string> = {
  day: "par jour",
  month: "par mois",
  week: "par semaine",
};

/**
 * Plafond de points renvoyés par série, par granularité.
 *
 * Une carte de chaleur couvre 366 jours par définition, alors qu'une courbe
 * hebdomadaire au-delà de 104 points devient illisible. Un plafond unique ne
 * peut pas servir les deux : il faudrait le_mounted assez haut pour la carte, et
 * l'axe de la courbe deviendrait illisible. Le plafond suit donc la granularité.
 */
const MAX_SERIES_POINTS_BY_GRANULARITY: Record<StatsGranularity, number> = {
  day: 366,
  month: 120,
  week: 104,
};

/** Nombre de jours couverts par la carte de chaleur d'activité. */
export const HEATMAP_MONTHS = 12;

export function maxPointsFor(granularity: StatsGranularity): number {
  return MAX_SERIES_POINTS_BY_GRANULARITY[granularity];
}

export const MAX_SERIES_POINTS = maxPointsFor("week");

export function isStatsPeriod(value: unknown): value is StatsPeriod {
  return (STATS_PERIODS as readonly unknown[]).includes(value);
}

export function isStatsMode(value: unknown): value is StatsMode {
  return (STATS_MODES as readonly unknown[]).includes(value);
}

export function isStatsKind(value: unknown): value is StatsKind {
  return (STATS_KINDS as readonly unknown[]).includes(value);
}

/**
 * Début de la fenêtre observée, ou `null` pour « tout l'historique ».
 * `now` est injectable pour que les tests unitaires n'aient pas à figer
 * l'horloge système.
 */
export function resolvePeriodStart(
  period: StatsPeriod,
  now: Date = new Date()
): Date | null {
  const start = new Date(now.getTime());
  switch (period) {
    case "7d":
      start.setUTCDate(start.getUTCDate() - 7);
      return start;
    case "30d":
      start.setUTCDate(start.getUTCDate() - 30);
      return start;
    case "90d":
      start.setUTCDate(start.getUTCDate() - 90);
      return start;
    case "12m":
      // Douze mois en retranchant le mois, pas 365 jours : un mois calendaire
      // est la seule unité qui rende « 12 mois » et « année dernière »
      // équivalents, y compris en février.
      start.setUTCMonth(start.getUTCMonth() - 12);
      return start;
    case "all":
      return null;
    default:
      return start;
  }
}

/** Nombre de buckets que produirait `granularity` entre `from` et `now`. */
export function countBuckets(
  from: Date,
  to: Date,
  granularity: StatsGranularity
): number {
  if (to.getTime() <= from.getTime()) {
    return 1;
  }
  if (granularity === "day") {
    return Math.ceil((to.getTime() - from.getTime()) / 86_400_000);
  }
  if (granularity === "week") {
    return Math.ceil((to.getTime() - from.getTime()) / (7 * 86_400_000));
  }
  return (
    (to.getUTCFullYear() - from.getUTCFullYear()) * 12 +
    (to.getUTCMonth() - from.getUTCMonth()) +
    1
  );
}

/**
 * Choisit la granularité la plus fine qui reste sous `MAX_SERIES_POINTS`.
 * `requested` n'est respecté que si l'historique tient dans le plafond ; sinon
 * la série bascule en mois, seul niveau plus grossier possible. Il n'y a donc
 * qu'un repli possible — c'est `month` dans les deux cas, non par défaut
 * arbitraire mais parce que `week` est la granularité la plus fine qui existe.
 */
export function resolveGranularity(
  from: Date,
  to: Date,
  requested: StatsGranularity
): StatsGranularity {
  return countBuckets(from, to, requested) <= maxPointsFor(requested)
    ? requested
    : requested === "day"
      ? "week"
      : "month";
}

/**
 * Liste continue de buckets entre `from` et `to`, alignée sur le premier jour
 * de la période (lundi pour la semaine, 1er du mois pour le mois, le jour pour
 * le quotidien). Les séries vides doivent produire des zéros : un histogramme qui
 * saute une semaine sans donnée fait croire à une rupture d'activité.
 */
export function buildBucketAxis(
  from: Date,
  to: Date,
  granularity: StatsGranularity
): Date[] {
  const buckets: Date[] = [];
  const cursor = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())
  );
  if (granularity === "month") {
    cursor.setUTCDate(1);
  } else if (granularity === "week") {
    // Postgres `date_trunc('week', …)` ramène au lundi : on s'aligne dessus,
    // sinon les libellés de buckets ne correspondraient pas aux lignes SQL.
    const day = cursor.getUTCDay();
    cursor.setUTCDate(cursor.getUTCDate() - ((day + 6) % 7));
  }
  const endTime = to.getTime();
  // Garde-fou d'itération : une fenêtre mal formée ne doit pas boucler.
  const limit = maxPointsFor(granularity) * 4;
  for (let i = 0; i < limit; i++) {
    if (cursor.getTime() > endTime) {
      break;
    }
    buckets.push(new Date(cursor.getTime()));
    if (granularity === "month") {
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    } else if (granularity === "week") {
      cursor.setUTCDate(cursor.getUTCDate() + 7);
    } else {
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }
  return buckets;
}

/** Clé d'un bucket, telle que renvoyée par `date_trunc` en base. */
export function bucketKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Graduations « rondes » (1, 2, 5 × 10ⁿ) pour l'axe des deux graphiques.
 *
 * Les deux séries comptent des ENTIERS (conversations, tokens, générations) :
 * le pas ne peut donc pas descendre sous 1. Sans cette borne, un maximum de 1
 * produisait un pas de 0,5, et les graduations arrondies se confondaient — deux
 * « 1 » dans la même grille, donc deux clés React identiques et une ligne
 * d'axe dessinée deux fois au même endroit. Le pas étant entier et la boucle
 * bornée, la graduation retournée est strictement croissante : chaque valeur
 * peut servir de clé.
 */
export function niceTicks(max: number, count = 3): number[] {
  // `Number.isFinite` plutôt que `max <= 0` : un `max` non fini (NaN, Infinity)
  // produirait un pas `NaN` et une boucle infinie, ce qu'aucun compteur ne peut
  // faire mais qu'aucun appelant ne mérite non plus. Repli : une seule
  // graduation à zéro, que les graphiques bornent déjà à 1.
  if (!Number.isFinite(max) || max <= 0) {
    return [0];
  }
  const rough = max / count;
  // `Math.max(1, …)` est la borne qui garantit des graduations distinctes.
  const magnitude = Math.max(1, 10 ** Math.floor(Math.log10(rough)));
  const normalized = rough / magnitude;
  const step =
    (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10) *
    magnitude;
  const ticks: number[] = [];
  // Multiplication plutôt qu'une accumulation `value += step` : `index * step`
  // ne dérive pas en flottant là où l'accumulation dérive. La borne est
  // redondante (la boucle s'arrête vers `count`), elle garantit surtout qu'un
  // `step` dégénéré ne fasse pas tourner la boucle indéfiniment.
  for (let index = 0; index <= count * 2; index++) {
    const value = index * step;
    if (value > max + step / 2) {
      break;
    }
    ticks.push(Math.round(value));
  }
  return ticks;
}

/** Un point de la courbe de consommation. */
export type StatsConsumptionPoint = {
  /** Premier jour du bucket, format `AAAA-MM-JJ`. */
  bucket: string;
  /** Tokens mesurés sur les appels texte (Chat, Agent, planification). */
  textTokens: number;
  /** Tokens mesurés par la synthèse vocale. */
  audioTokens: number;
  /** Nombre de générations d'images — PAS des tokens, voir STATS_KINDS. */
  imageCount: number;
};

/** Une colonne du graphique de conversations : une par mode. */
export type StatsConversationsPoint = {
  bucket: string;
  chat: number;
  agent: number;
};

export type StatsModelUsage = {
  /**
   * Identifiant brut, tel qu'écrit dans `UsageEvent.model` — c'est la valeur
   * que la requête attend, et la seule forme non ambiguë d'un modèle.
   */
  model: string;
  /**
   * Nom affichable, résolu côté serveur à partir du catalogue (« Space Bunny
   * Alpha » pour `stealth/space-bunny-alpha`). L'interface n'affiche que
   * celui-là : un identifiant n'est pas un nom, et le reconstruire côté client
   * reviendrait à inventer un libellé que le serveur n'a pas validé.
   */
  name: string;
  tokens: number;
  /** Part de `tokens` dans le total de la période, entre 0 et 1. */
  share: number;
};

export type StatsOverview = {
  totalConversations: number;
  totalTokens: number;
  totalImages: number;
  totalAudioTokens: number;
  topModel: StatsModelUsage | null;
};

export type StatsFilterOptions = {
  /**
   * Modèles observés sur la période. `id` est la valeur à renvoyer dans la
   * requête, `name` le libellé à afficher — même couple que
   * `StatsModelUsage`, pour que les deux listes de la page ne puissent pas
   * diverger.
   */
  models: { id: string; name: string }[];
  projects: { id: string; name: string }[];
};

/**
 * Un jour d'activité, pour la carte de chaleur et les séries.
 *
 * `agentRuns` compte les runs Agent démarrés le jour : c'est ce qui permet de
 * distinguer visuellement un jour « Chat seulement » d'un jour « Agent », deux
 * usages de nature très différente.
 */
export type StatsDailyActivity = {
  agentRuns: number;
  audioTokens: number;
  /** `AAAA-MM-JJ`. */
  day: string;
  imageCount: number;
  /** Nombre de conversations CRÉÉES ce jour — base des séries. */
  conversations: number;
  textTokens: number;
  tokens: number;
};

/** Séries consécutives de jours actifs. */
export type StatsStreaks = {
  current: number;
  longest: number;
};

/** Un outil classé par nombre d'exécutions. */
export type StatsToolUsage = {
  /** Exécutions tracées sur le chemin Agent (`ToolExecution`). */
  agentExecutions: number;
  /** Exécutions tracées sur le chemin Chat (`McpLog`) — 0 pour un plugin. */
  chatExecutions: number;
  /** Nom affiché, résolu via le catalogue de plugins. */
  label: string;
  /** `mcp:<id>` ou `plugin:<id>`. */
  scope: "mcp" | "plugin";
  total: number;
};

/** Compteurs globaux hors période, complétés par les compteurs de période. */
export type StatsTotals = {
  totalChats: number;
  totalMessages: number;
  totalSkillInvocations: number;
  distinctSkillsUsed: number;
};

export type StatsActivity = {
  /** Répartition Chat / Agent en pourcentage, sur la période. */
  chatShare: number;
  agentShare: number;
  /** Niveau de réflexion Agent le plus demandé, et sa part. */
  topReasoning: { label: string; level: string; share: number } | null;
  /** Durée de la plus longue tâche Agent terminée, en millisecondes. */
  longestAgentTaskMs: number;
  /** Total de tokens de la semaine calendaire la plus forte de la période. */
  peakWeekTokens: number;
  /** Semaine du pic, `AAAA-MM-JJ` (lundi). */
  peakWeekStart: string | null;
  streaks: StatsStreaks;
  tools: StatsToolUsage[];
  totals: StatsTotals;
};

export type UsageStats = {
  /** `null` quand la période demandée est « tout l'historique ». */
  from: string | null;
  to: string;
  period: StatsPeriod;
  /**
   * Les deux graphiques n'ont PAS la même granularité demandée : la
   * consommation est hebdomadaire, les conversations mensuelles. On expose donc
   * deux champs distincts — l'interface étiquette chaque axe avec la valeur
   * réellement employée, ce qui évite d'annoncer « par mois » sur un axe
   * hebdomadaire (périodes de 7 et 30 jours, où le mois ne donnerait qu'une
   * seule colonne, inexploitable).
   */
  consumptionGranularity: StatsGranularity;
  conversationsGranularity: StatsGranularity;
  /**
   * Activité quotidienne des `HEATMAP_MONTHS` derniers mois, TOUJOURS
   * indépendante du filtre de période : une grille de 7 jours n'a aucun
   * intérêt en calendrier. Les lignes sont denses (un jour sans activité vaut
   * zéro) pour que la carte n'ait pas de trous, et le composant ne fait aucune
   * hypothèse sur la présence d'une ligne.
   */
  daily: StatsDailyActivity[];
  /** Premier jour couvert par `daily`, `AAAA-MM-JJ`. */
  dailyFrom: string;
  activity: StatsActivity;
  consumption: StatsConsumptionPoint[];
  conversations: StatsConversationsPoint[];
  models: StatsModelUsage[];
  overview: StatsOverview;
  filterOptions: StatsFilterOptions;
  /**
   * Limites de la restitution, en clair pour l'utilisateur. Non vide quand
   * un filtre ne s'applique pas à une partie des données (voir
   * `usage-stats.ts`) ou quand la granularité a été abaissée.
   */
  warnings: string[];
};

/** Query params de la route, déjà validés et normalisés. */
export type StatsQuery = {
  period: StatsPeriod;
  mode: StatsMode | null;
  model: string | null;
  projectId: string | null;
  kinds: StatsKind[];
};

/** Construit la query string SWR de la page. */
export function buildStatsQueryString(query: StatsQuery): string {
  const params = new URLSearchParams();
  params.set("period", query.period);
  if (query.mode) {
    params.set("mode", query.mode);
  }
  if (query.model) {
    params.set("model", query.model);
  }
  if (query.projectId) {
    params.set("projectId", query.projectId);
  }
  for (const kind of query.kinds) {
    params.append("kind", kind);
  }
  return params.toString();
}

/** Valeur par défaut des filtres : période 30 jours, aucun affinement. */
export const DEFAULT_STATS_QUERY: StatsQuery = {
  kinds: [...STATS_KINDS],
  mode: null,
  model: null,
  period: "30d",
  projectId: null,
};
