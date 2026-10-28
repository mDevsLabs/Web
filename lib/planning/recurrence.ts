/**
 * Moteur de récurrence calendaire de la planification.
 *
 * Pourquoi ce module existe : l'ancien `computeNextOccurrence` (executor.ts)
 * avançait l'occurrence par `setDate(+1)` / `setMonth(+1)` sur un `Date` UTC —
 * une durée UTC figée, calculée dans le fuseau *local du serveur*. Un plan
 * « le 10 du mois à 9 h à Paris » dérivait donc vers 8 h lors du passage à
 * l'heure d'été, se déplaçait avec le fuseau du host (prod ≠ dev), et le
 * 31 du mois débordait sur le mois suivant (31 janv. → 3 mars → 3 avril),
 * perdant le jour visé à jamais.
 *
 * Ici la vérité est **calendaire** : récurrence = { fuseau IANA, jour du mois,
 * heure, minute, politique mensuelle }. L'instant UTC n'est qu'une
 * *conséquence* recalculée, jamais une source de vérité.
 *
 * Le module est volontairement **pur et sans `server-only`** : il est
 * consommé par l'exécuteur (serveur) ET par l'aperçu interactif des dix
 * prochaines exécutions (client), une seule implémentation pour éviter toute
 * divergence entre ce que l'utilisateur prévoit et ce qui s'exécute.
 *
 * Piège TZDate connu (déjà payé) : le dernier argument du constructeur à
 * composants DOIT être la **chaîne** du fuseau. Y passer un objet TZDate le
 * fait retomber silencieusement sur le fuseau du host.
 */

import { TZDate } from "@date-fns/tz";

export type PlanningRecurrence = "none" | "daily" | "weekly" | "monthly";

/**
 * Politique des jours inexistants pour la récurrence mensuelle :
 * - `clamp`  : ramener au dernier jour du mois (31 janv. → 28/29 févr.)
 * - `skip`   : sauter l'occurrence du mois qui n'a pas ce jour
 * - `report` : compenser au mois suivant (31 janv. → 3 mars, puis 31 mars)
 */
export type MonthlyPolicy = "clamp" | "report" | "skip";

/**
 * Règle calendaire d'une tâche planifiée. `dayOfMonth` n'a de sens que pour
 * `monthly` ; il est ignoré (et peut rester null) pour daily/weekly, qui
 * reprennent le jour de l'occurrence précédente dans le fuseau de la tâche.
 */
export interface RecurrenceSchedule {
  dayOfMonth: number | null;
  hour: number;
  minute: number;
  monthlyPolicy: MonthlyPolicy;
  recurrence: PlanningRecurrence;
  timezone: string;
}

/** Politique par défaut : 31 janv. → 28 févr., le calendrier ne dérive pas. */
export const DEFAULT_MONTHLY_POLICY: MonthlyPolicy = "clamp";

/**
 * Fuseau par défaut des tâches existantes (migration 0046) : l'application est
 * francophone, l'Europe/Paris couvre le socle historique de la base.
 */
export const DEFAULT_PLANNING_TIMEZONE = "Europe/Paris";

/**
 * Valide un nom de fuseau IANA selon `Intl` de l'environnement d'exécution.
 * Un fuseau inconnu chez le serveur mais valide chez le client (ou inverse)
 * serait une source de divergence : la même fonction, donc le même référentiel.
 */
export function isValidIANATimezone(tz: string | null | undefined): boolean {
  if (!tz || typeof tz !== "string" || tz.trim().length === 0) return false;
  try {
    const probe = new Intl.DateTimeFormat("en", { timeZone: tz });
    return probe.resolvedOptions().timeZone !== undefined;
  } catch {
    return false;
  }
}

/**
 * Liste des fuseaux IANA supportés par le moteur (liste canonique quand
 * disponible, repli minimal sinon). Utilisée par l'UI du formulaire.
 */
export function listIANATimezones(): string[] {
  if (typeof Intl.supportedValuesOf === "function") {
    try {
      return Intl.supportedValuesOf("timeZone");
    } catch {
      // environnement incomplet : repli ci-dessous
    }
  }
  return [DEFAULT_PLANNING_TIMEZONE, "America/New_York", "Asia/Tokyo", "UTC"];
}

/**
 * Extrait le contrat récurrence d'une ligne brute de la base
 * (`ScheduledMessage`), tolérant aux lignes créées avant la migration 0046
 * (champs calendaires NULL). Un champ illisible retombe dans la valeur sûre
 * par défaut — jamais un privilège : timezone inconnue → Europe/Paris,
 * politique inconnue → clamp.
 */
export function buildScheduleFromRecord(
  record: {
    dayOfMonth?: number | null;
    hour?: number | null;
    minute?: number | null;
    monthlyPolicy?: string | null;
    recurrence?: PlanningRecurrence | string | null;
    timezone?: string | null;
  },
  fallback: { scheduledAt: Date }
): RecurrenceSchedule {
  const recurrence = (["none", "daily", "weekly", "monthly"] as const).includes(
    record.recurrence as never
  )
    ? (record.recurrence as PlanningRecurrence)
    : "none";
  const tz = safeTz(record.timezone);
  const fromTz = new TZDate(new Date(fallback.scheduledAt).getTime(), tz);
  return {
    dayOfMonth:
      typeof record.dayOfMonth === "number" &&
      record.dayOfMonth >= 1 &&
      record.dayOfMonth <= 31
        ? record.dayOfMonth
        : fromTz.getDate(),
    hour:
      typeof record.hour === "number" && record.hour >= 0 && record.hour <= 23
        ? record.hour
        : fromTz.getHours(),
    minute:
      typeof record.minute === "number" &&
      record.minute >= 0 &&
      record.minute <= 59
        ? record.minute
        : fromTz.getMinutes(),
    monthlyPolicy: isMonthlyPolicy(record.monthlyPolicy)
      ? record.monthlyPolicy
      : DEFAULT_MONTHLY_POLICY,
    recurrence,
    timezone: tz,
  };
}

function isMonthlyPolicy(value: unknown): value is MonthlyPolicy {
  return value === "clamp" || value === "report" || value === "skip";
}

function safeTz(tz: string | null | undefined): string {
  return isValidIANATimezone(tz) ? (tz as string) : DEFAULT_PLANNING_TIMEZONE;
}

/** Résolution d'une heure murale ambiguë ou inexistante ( transitions DST). */
export interface LocalTimeResolution {
  /**
   * Heure murale corrigée quand la demandée n'existe pas (gap) : 02:30 un
   * jour de passage à l'heure d'été devient 03:30. `null` si rien à corriger.
   */
  adjustedHour: number | null;
  /**
   * `gap` = heure inexistante (passage à l'heure d'été) ; `duplicate` = heure
   * existant deux fois (retour à l'heure d'hiver) ; le moteur choisit alors
   * le second instant (UTC+1 rétabli), le plus tardif et déterministe.
   */
  ambiguity: "duplicate" | "gap" | null;
  /** Nombre d'instants UTC compatibles (1 ou 2). */
  candidateCount: number;
}

/**
 * Construit l'instant UTC exact d'une heure murale {y, m, d, h, min} dans un
 * fuseau IANA, en résolvant les anomalies DST par ÉNUMÉRATION DES CANDIDATS :
 * - heure ordinaire : un seul instant, `candidateCount = 1` ;
 * - **duplicate** (retour à l'heure d'hiver) : deux instants, on choisit le
 *   SECOND (UTC+1 rétabli), le plus tardif et déterministe ;
 * - **gap** (heure inexistante au passage à l'heure d'été) : aucun instant.
 *   On applique la politique « remonter de la taille du saut » : 02:30 →
 *   03:30. Le résultat est ensuite résolu comme une heure ordinaire.
 *
 * La projection directe `new TZDate(...)` ne suffit pas : selon la plateforme
 * elle ramène l'heure du gap en arrière (00:30Z au lieu de 01:30Z). Les
 * candidats sont calculés avec les offsets réels du fuseau et revalidés.
 */
export function resolveLocalInstant(
  tz: string,
  y: number,
  m: number, // 1-12
  d: number,
  h: number,
  min: number
): { at: Date; resolution: LocalTimeResolution } {
  const candidates = wallTimeCandidates(tz, y, m, d, h, min);
  if (candidates.length > 0) {
    const at = candidates.at(-1) as number;
    return {
      at: new Date(at),
      resolution: {
        adjustedHour: null,
        ambiguity: candidates.length === 2 ? "duplicate" : null,
        candidateCount: candidates.length,
      },
    };
  }

  // Aucun candidat : l'heure n'existe pas. La taille du saut est la
  // différence entre les offsets du début et de la fin de la journée locale
  // (60 min à Paris, 30 min dans les zones à transition de 30 min).
  const dayStart = new TZDate(y, m - 1, d, 0, 0, 0, 0, tz);
  const dayEnd = new TZDate(y, m - 1, d, 23, 59, 59, 0, tz);
  const offsetBefore = getTimeZoneOffsetMinutes(tz, dayStart);
  const offsetAfter = getTimeZoneOffsetMinutes(tz, dayEnd);
  const gapMinutes = Math.max(0, offsetAfter - offsetBefore);

  if (gapMinutes > 0) {
    const corrected = new Date(
      Date.UTC(y, m - 1, d, h, min) + gapMinutes * 60_000
    );
    const cy = corrected.getUTCFullYear();
    const cm = corrected.getUTCMonth() + 1;
    const cd = corrected.getUTCDate();
    const ch = corrected.getUTCHours();
    const cmin = corrected.getUTCMinutes();
    const adjusted = wallTimeCandidates(tz, cy, cm, cd, ch, cmin);
    if (adjusted.length > 0) {
      return {
        at: new Date(adjusted.at(-1) as number),
        resolution: {
          adjustedHour: ch,
          ambiguity: "gap",
          candidateCount: adjusted.length,
        },
      };
    }
  }

  // Repli défensif (fuseau exotique) : la projection TZDate reste un instant
  // déterministe, mais l'anomalie est signalée.
  const fallback = new TZDate(y, m - 1, d, h, min, 0, 0, tz);
  return {
    at: new Date(fallback.getTime()),
    resolution: {
      adjustedHour: fallback.getHours(),
      ambiguity: "gap",
      candidateCount: 0,
    },
  };
}

/**
 * Tous les instants UTC qui, formatés dans `tz`, donnent exactement
 * {y, m, d, h, min}. L'algorithme sonde les offsets avant, pendant et après
 * l'heure visée (la transition peut être dans la journée), convertit chaque
 * offset en candidat, puis ne garde que ceux dont la relecture est exacte.
 */
function wallTimeCandidates(
  tz: string,
  y: number,
  m: number,
  d: number,
  h: number,
  min: number
): number[] {
  const naive = Date.UTC(y, m - 1, d, h, min);
  const offsets = new Set<number>();
  for (const deltaHours of [-48, -24, -6, 0, 6, 24, 48]) {
    offsets.add(
      getTimeZoneOffsetMinutes(tz, new Date(naive + deltaHours * 3_600_000))
    );
  }
  const instants = new Set<number>();
  for (const offset of offsets) {
    const instant = naive - offset * 60_000;
    const local = new TZDate(instant, tz);
    if (
      local.getFullYear() === y &&
      local.getMonth() + 1 === m &&
      local.getDate() === d &&
      local.getHours() === h &&
      local.getMinutes() === min
    ) {
      instants.add(instant);
    }
  }
  return [...instants].sort((a, b) => a - b);
}

function getTimeZoneOffsetMinutes(tz: string, at: Date): number {
  const local = new TZDate(at.getTime(), tz);
  const asUtc = Date.UTC(
    local.getFullYear(),
    local.getMonth(),
    local.getDate(),
    local.getHours(),
    local.getMinutes(),
    local.getSeconds()
  );
  return (asUtc - at.getTime()) / 60_000;
}

/** Prochaine occurrence (inclusivement après `from`), ou null. */
export function computeNextOccurrence(
  schedule: RecurrenceSchedule,
  from: Date
): Date | null {
  if (schedule.recurrence === "none") return null;
  const tz = safeTz(schedule.timezone);
  const localFrom = new TZDate(from.getTime(), tz);
  const y = localFrom.getFullYear();
  const m = localFrom.getMonth() + 1; // 1-12
  const d = localFrom.getDate();

  if (schedule.recurrence === "daily") {
    // Le lendemain calendaire dans le fuseau de la tâche — pas +24 h, qui
    // décalerait l'heure murale aux transitions été/hiver.
    return nextAtOrAfter(schedule, localFrom, y, m, d + 1);
  }
  if (schedule.recurrence === "weekly") {
    return nextAtOrAfter(schedule, localFrom, y, m, d + 7);
  }
  // monthly
  return nextMonthlyOccurrence(schedule, localFrom, y, m);
}

/**
 * Récurrence mensuelle : jour du mois demandé avec politique sur les mois
 * courts (clamp / skip / report), correcte pour février et les années
 * bissextiles (29 févr. 2028 existe, 29 févr. 2027 non).
 */
function nextMonthlyOccurrence(
  schedule: RecurrenceSchedule,
  localFrom: TZDate,
  y: number,
  m: number
): Date | null {
  const day = schedule.dayOfMonth ?? localFrom.getDate();
  const tz = safeTz(schedule.timezone);

  // Candidats dans les 26 mois prochains (largement assez pour tout report).
  for (let offset = 0; offset < 26; offset++) {
    // Échéances construites en début de mois : évite le piège du
    // « 31 janv. + 1 mois » qui donne le 3 mars.
    const monthStart = new TZDate(y, m - 1 + offset, 1, 0, 0, 0, 0, tz);
    const my = monthStart.getFullYear();
    const mm = monthStart.getMonth() + 1; // 1-12
    const daysInMonth = getDaysIn(my, mm);

    // Le jour existe dans ce mois : occurrence naturelle.
    if (day <= daysInMonth) {
      const candidate = resolveLocalInstant(
        tz,
        my,
        mm,
        day,
        schedule.hour,
        schedule.minute
      );
      if (candidate.at.getTime() > localFrom.getTime()) {
        return candidate.at;
      }
      // Occurrence passée ce mois : mois suivant, SANS appliquer la
      // politique (elle ne concerne que les jours manquants).
      continue;
    }

    // Le jour manque au mois : appliquer la politique.
    switch (schedule.monthlyPolicy) {
      case "clamp": {
        const candidate = resolveLocalInstant(
          tz,
          my,
          mm,
          daysInMonth,
          schedule.hour,
          schedule.minute
        );
        if (candidate.at.getTime() > localFrom.getTime()) return candidate.at;
        continue;
      }
      case "skip": {
        // Aucune occurrence ce mois-là.
        continue;
      }
      case "report": {
        // Le jour manquant est reporté au mois suivant, à écart constant :
        // 31 janv. (3 jours manquants) → 3 mars, puis 31 mars. Le spill est
        // borné à 1–3 (jour ≤ 31, mois ≥ 28) : le mois récepteur contient
        // toujours ce jour.
        const spill = day - daysInMonth; // 1..3
        const nextMonth = new TZDate(y, m - 1 + offset + 1, 1, 0, 0, 0, 0, tz);
        const candidate = resolveLocalInstant(
          tz,
          nextMonth.getFullYear(),
          nextMonth.getMonth() + 1,
          spill,
          schedule.hour,
          schedule.minute
        );
        if (candidate.at.getTime() > localFrom.getTime()) return candidate.at;
        continue;
      }
    }
  }
  return null;
}

/** Nombre de jours du mois (bissextile compris) — jour 0 du mois suivant. */
function getDaysIn(y: number, m: number): number {
  return new TZDate(y, m, 0, 0, 0, 0, 0, "UTC").getDate();
}

/**
 * Moteur daily/weekly : occurrence au jour calendaire visé, à l'heure murale
 * de la planification ; si elle est déjà passée au moment `from` (exécution
 * en retard), avance d'un cycle supplémentaire dans le même fuseau.
 */
function nextAtOrAfter(
  schedule: RecurrenceSchedule,
  localFrom: TZDate,
  y: number,
  m: number,
  d: number
): Date | null {
  const tz = safeTz(schedule.timezone);
  // Même résolveur que le mensuel : une heure murale de gap (02:30 le jour du
  // passage à l'heure d'été) est corrigée en 03:30 au lieu de retomber une
  // heure en arrière via la projection TZDate.
  const target = resolveLocalInstant(
    tz,
    y,
    m,
    d,
    schedule.hour,
    schedule.minute
  ).at;
  if (target.getTime() > localFrom.getTime()) {
    return target;
  }
  // Jour suivant / semaine suivante : l'ancre à MIDI évite qu'un ajout de jour
  // tombe dans un gap ; l'heure murale est ensuite résolue par le même chemin.
  const anchor = new TZDate(y, m - 1, d, 12, 0, 0, 0, tz);
  const step = schedule.recurrence === "weekly" ? 7 : 1;
  const nextDay = new TZDate(
    anchor.getFullYear(),
    anchor.getMonth(),
    anchor.getDate() + step,
    12,
    0,
    0,
    0,
    tz
  );
  return resolveLocalInstant(
    tz,
    nextDay.getFullYear(),
    nextDay.getMonth() + 1,
    nextDay.getDate(),
    schedule.hour,
    schedule.minute
  ).at;
}

/**
 * Les `count` prochaines occurrences à partir de `from` (exclusive). Utilisé
 * par l'aperçu interactif des dix prochaines exécutions côté client, et pour
 * l'audit d'une planification côté serveur.
 */
export function computeUpcomingOccurrences(
  schedule: RecurrenceSchedule,
  from: Date,
  count = 10
): Date[] {
  const out: Date[] = [];
  let cursor = from;
  while (out.length < count) {
    const next = computeNextOccurrence(schedule, cursor);
    if (!next || next.getTime() <= cursor.getTime()) break; // garde anti-boucle
    out.push(next);
    cursor = next;
  }
  return out;
}

/** Format court local dans un fuseau (détails techniques). */
export function formatInZone(tz: string, at: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: tz,
  }).format(at);
}
