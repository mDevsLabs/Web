/**
 * ============================================================================
 * RAPPELS DE PLANIFICATION — une alarme d'appareil, pas une tâche serveur
 * ============================================================================
 *
 * POURQUOI LOCAL, ET PAS EN BASE
 *
 * Une planification est une tâche du COMPTE : elle s'exécute côté serveur, à
 * l'heure dite, même application fermée. Un RAPPEL est l'inverse : il n'a de
 * sens que si quelqu'un est devant l'écran pour le recevoir. Le stocker en base
 * laisserait croire qu'il sonnera sur un poste éteint — il ne sonnerait pas.
 *
 * Les rappels vivent donc dans le `localStorage`, comme le mode économie et le
 * thème Vibe mobile : ce sont des réglages d'APPAREIL. Un rappel créé sur le
 * portable ne prétend pas exister sur le poste fixe, et personne n'a besoin
 * d'une migration pour cela.
 *
 * DEUX CHOSES DIFFÉRENTES, DANS LE MÊME MODULE
 *
 * 1. Les RAPPELS LIBRES : « penser à relancer la veille », avec une heure, une
 *    note et une répétition simple (quotidienne ou hebdomadaire).
 * 2. L'ALERTE D'EXÉCUTION : un délai, en minutes, avant chaque planification
 *    du compte. Un seul réglage, appliqué à toutes les lignes `pending`.
 *
 * Un réglage illisible ne casse rien : il retombe sur sa valeur par défaut, et
 * les rappels illisibles sont écartés un par un — une entrée abîmée ne doit pas
 * emporter les autres, exactement comme pour les réglages Blackline.
 */

export const PLANNING_REMINDERS_STORAGE_KEY = "mai.planning.reminders.v1";
export const PLANNING_ALERT_LEAD_STORAGE_KEY = "mai.planning.alert-lead.v1";

export type ReminderRecurrence = "none" | "daily" | "weekly";

export interface PlanningReminder {
  /** Prochaine occurrence, en ISO 8601 (fuseau du navigateur). */
  at: string;
  /** Date de création (epoch ms) — sert au tri secondaire. */
  createdAt: number;
  /** Identifiant local stable (crypto.randomUUID ou repli temporel). */
  id: string;
  /** Note libre, optionnelle. */
  note: string;
  /** Dernière notification envoyée (epoch ms), pour ne pas sonner deux fois. */
  notifiedAt: number | null;
  /** Répétition simple : unique, chaque jour, chaque semaine. */
  recurrence: ReminderRecurrence;
  /** Titre affiché et envoyé dans la notification. */
  title: string;
}

/** Délais proposés pour l'alerte d'exécution, en minutes. `0` = désactivée. */
export const ALERT_LEAD_OPTIONS = [0, 5, 10, 15, 30, 60] as const;
export type AlertLeadMinutes = (typeof ALERT_LEAD_OPTIONS)[number];
export const DEFAULT_ALERT_LEAD_MINUTES: AlertLeadMinutes = 10;

/** Horizon d'affichage : au-delà, un rappel n'est pas « à venir ». */
export const REMINDER_HORIZON_DAYS = 30;

export const REMINDER_RECURRENCE_LABELS: Record<ReminderRecurrence, string> = {
  daily: "Chaque jour",
  none: "Une seule fois",
  weekly: "Chaque semaine",
};

const MAX_TITLE = 120;
const MAX_NOTE = 500;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function safeString(value: unknown, max: number): string {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim().slice(0, max);
}

function normalizeRecurrence(value: unknown): ReminderRecurrence {
  return value === "daily" || value === "weekly" ? value : "none";
}

/** Identifiant local. `crypto.randomUUID` n'existe pas partout (http). */
export function createReminderId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Valide une entrée lue du stockage. Une entrée illisible renvoie `null` et
 * sera écartée : on ne répare pas un rappel en devinant son heure.
 */
export function parseReminder(value: unknown): PlanningReminder | null {
  if (!isRecord(value)) {
    return null;
  }
  const at = typeof value.at === "string" ? new Date(value.at) : null;
  if (!(at && Number.isFinite(at.getTime()))) {
    return null;
  }
  const title = safeString(value.title, MAX_TITLE);
  if (!title) {
    return null;
  }
  const id = safeString(value.id, 80) || createReminderId();
  return {
    at: at.toISOString(),
    createdAt: Number.isFinite(Number(value.createdAt))
      ? Number(value.createdAt)
      : Date.now(),
    id,
    note: safeString(value.note, MAX_NOTE),
    notifiedAt:
      value.notifiedAt !== null && Number.isFinite(Number(value.notifiedAt))
        ? Number(value.notifiedAt)
        : null,
    recurrence: normalizeRecurrence(value.recurrence),
    title,
  };
}

/** Décode la liste stockée. Une valeur non-tableau vaut liste vide. */
export function parseReminders(raw: string | null): PlanningReminder[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    const out: PlanningReminder[] = [];
    for (const entry of parsed) {
      const reminder = parseReminder(entry);
      if (reminder) {
        out.push(reminder);
      }
    }
    return sortReminders(out);
  } catch {
    return [];
  }
}

/** Sérialise la liste ; l'écriture échoue silencieusement (navigation privée). */
export function serializeReminders(reminders: PlanningReminder[]): string {
  return JSON.stringify(reminders);
}

export function sortReminders(
  reminders: PlanningReminder[]
): PlanningReminder[] {
  return [...reminders].sort((a, b) => {
    const delta = new Date(a.at).getTime() - new Date(b.at).getTime();
    return delta === 0 ? a.createdAt - b.createdAt : delta;
  });
}

/**
 * Clé de stockage effective.
 *
 * Les rappels sont propres à l'appareil, mais un même navigateur peut servir
 * deux comptes : sans portée, les rappels de l'un sonneraient chez l'autre.
 * La portée est donc le compte, et reste vide pour un appelant qui n'en a pas.
 */
export function remindersStorageKey(scope?: string | null): string {
  return scope
    ? `${PLANNING_REMINDERS_STORAGE_KEY}.${scope}`
    : PLANNING_REMINDERS_STORAGE_KEY;
}

/** Lit les rappels de l'appareil (pour ce compte, si `scope` est fourni). */
export function readReminders(scope?: string | null): PlanningReminder[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    return parseReminders(
      window.localStorage.getItem(remindersStorageKey(scope))
    );
  } catch {
    return [];
  }
}

/** Écrit les rappels de l'appareil. */
export function writeReminders(
  reminders: PlanningReminder[],
  scope?: string | null
): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(
      remindersStorageKey(scope),
      serializeReminders(sortReminders(reminders))
    );
  } catch {
    // Quota ou navigation privée : le rappel est perdu, comme avant.
  }
}

/** Crée un rappel prêt à être stocké. */
export function createReminder(input: {
  title: string;
  at: Date;
  note?: string;
  recurrence?: ReminderRecurrence;
}): PlanningReminder {
  return {
    at: input.at.toISOString(),
    createdAt: Date.now(),
    id: createReminderId(),
    note: safeString(input.note, MAX_NOTE),
    notifiedAt: null,
    recurrence: normalizeRecurrence(input.recurrence),
    title: safeString(input.title, MAX_TITLE) || "Rappel",
  };
}

/**
 * Prochaine occurrence d'un rappel récurrent, à partir de `from`.
 *
 * Une occurrence passée depuis moins d'une période reste celle qui compte :
 * on ne saute pas un rappel qui vient de sonner. Au-delà, on avance par pas
 * de 24 h / 7 jours jusqu'à repasser devant l'horloge — sans boucle non bornée,
 * une récurrence quotidienne et une date de 1970 ne doivent pas figer l'onglet.
 */
export function nextOccurrence(
  reminder: PlanningReminder,
  from: Date = new Date()
): Date {
  const at = new Date(reminder.at);
  if (reminder.recurrence === "none") {
    return at;
  }
  const stepMs = reminder.recurrence === "daily" ? 86_400_000 : 7 * 86_400_000;
  if (at.getTime() >= from.getTime()) {
    return at;
  }
  const steps = Math.ceil((from.getTime() - at.getTime()) / stepMs);
  return new Date(at.getTime() + steps * stepMs);
}

/** Un rappel est-il à venir (dans l'horizon) ? */
export function isUpcoming(
  reminder: PlanningReminder,
  now: Date = new Date(),
  horizonDays = REMINDER_HORIZON_DAYS
): boolean {
  const next = nextOccurrence(reminder, now).getTime();
  return next - now.getTime() <= horizonDays * 86_400_000;
}

/**
 * Occurrence EN COURS d'un rappel : la dernière qui est déjà passée.
 *
 * C'est la seule qui puisse être notifiée — `nextOccurrence` renvoie déjà la
 * suivante dès que celle du jour a sonné, et l'on ne veut pas annoncer deux
 * fois la même échéance.
 */
export function currentOccurrence(
  reminder: PlanningReminder,
  now: Date = new Date()
): Date | null {
  const at = new Date(reminder.at);
  if (at.getTime() > now.getTime()) {
    return null;
  }
  if (reminder.recurrence === "none") {
    return at;
  }
  const stepMs = reminder.recurrence === "daily" ? 86_400_000 : 7 * 86_400_000;
  const steps = Math.floor((now.getTime() - at.getTime()) / stepMs);
  return new Date(at.getTime() + steps * stepMs);
}

/**
 * Rappels à notifier : leur occurrence est passée, et elle n'a pas encore été
 * annoncée. La fenêtre d'un jour évite de sonner pour un rappel oublié depuis
 * trois semaines à l'ouverture de l'application.
 */
export function remindersToNotify(
  reminders: PlanningReminder[],
  now: Date = new Date(),
  graceMs = 86_400_000
): PlanningReminder[] {
  return reminders.filter((reminder) => {
    const due = currentOccurrence(reminder, now);
    if (!due) {
      return false;
    }
    const delta = now.getTime() - due.getTime();
    if (delta > graceMs) {
      return false;
    }
    // `notifiedAt` d'une occurrence antérieure ne compte pas : un rappel
    // quotidien doit sonner chaque jour, pas une fois pour toutes.
    return (
      reminder.notifiedAt === null || reminder.notifiedAt < due.getTime() - 1000
    );
  });
}

/** Applique la répétition après une notification : avance ou marque comme lu. */
export function afterNotification(
  reminder: PlanningReminder,
  now: Date = new Date()
): PlanningReminder {
  if (reminder.recurrence === "none") {
    return { ...reminder, notifiedAt: now.getTime() };
  }
  return {
    ...reminder,
    at: nextOccurrence(reminder, now).toISOString(),
    notifiedAt: now.getTime(),
  };
}

/** Libellé de compte à rebours, arrondi à la minute. */
export function formatCountdown(target: Date, now: Date = new Date()): string {
  const delta = target.getTime() - now.getTime();
  if (delta <= 0) {
    return "maintenant";
  }
  const minutes = Math.round(delta / 60_000);
  if (minutes < 60) {
    return `dans ${minutes} min`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `dans ${hours} h`;
  }
  const days = Math.round(hours / 24);
  return days === 1 ? "demain" : `dans ${days} jours`;
}

/** Lit le délai d'alerte d'exécution. Une valeur inconnue vaut la valeur par défaut. */
export function readAlertLeadMinutes(): AlertLeadMinutes {
  if (typeof window === "undefined") {
    return DEFAULT_ALERT_LEAD_MINUTES;
  }
  try {
    const raw = window.localStorage.getItem(PLANNING_ALERT_LEAD_STORAGE_KEY);
    if (raw === null) {
      return DEFAULT_ALERT_LEAD_MINUTES;
    }
    const parsed = Number(raw);
    return (ALERT_LEAD_OPTIONS as readonly number[]).includes(parsed)
      ? (parsed as AlertLeadMinutes)
      : DEFAULT_ALERT_LEAD_MINUTES;
  } catch {
    return DEFAULT_ALERT_LEAD_MINUTES;
  }
}

/** Écrit le délai d'alerte d'exécution. */
export function writeAlertLeadMinutes(value: AlertLeadMinutes): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(PLANNING_ALERT_LEAD_STORAGE_KEY, String(value));
  } catch {
    // Écriture refusée : le réglage reste celui de la session.
  }
}
