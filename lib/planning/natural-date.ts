/**
 * ============================================================================
 * DATES EN LANGAGE NATUREL — « demain 9h », « dans 2 heures », « lundi prochain »
 * ============================================================================
 *
 * POURQUOI CE MODULE
 *
 * Créer une planification demandait de remplir un champ `datetime-local` :
 * deux sélecteurs natifs, une heure à recopier, et un formulaire qu'on ne peut
 * pas relire. C'est justement le moment où l'on abandonne.
 *
 * Ce module transforme une phrase française courte en instant précis. Il est
 * PUR et client-safe : l'interface l'appelle à chaque frappe pour proposer un
 * aperçu, et le formulaire n'envoie que le résultat (un `Date`), jamais la
 * phrase. Deux implémentations divergeraient — il n'y en a qu'une, et elle est
 * testée (`tests/unit/planning-natural-date.test.ts`).
 *
 * CE QU'IL NE FAIT PAS
 *
 * Il ne devine PAS un fuseau : les calculs sont faits dans le fuseau du
 * navigateur, celui dans lequel l'utilisateur lit l'heure qu'il a tapée. Le
 * fuseau de la tâche (`timezone`) est une décision distincte, prise dans le
 * formulaire.
 *
 * Il ne comprend pas les phrases longues, et il l'assume : `parseNaturalDate`
 * renvoie `null` plutôt qu'une date plausible — une date fausse est bien plus
 * coûteuse qu'une absence de proposition.
 */

/** Résultat d'une analyse : l'instant retenu et une étiquette lisible. */
export interface ParsedNaturalDate {
  /** Instant absolu calculé dans le fuseau du navigateur. */
  at: Date;
  /**
   * Étiquette française courte décrivant ce qui a été compris
   * (« demain 09:00 », « dans 2 heures »). Elle sert l'aperçu du formulaire.
   */
  label: string;
}

const JOURS = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
] as const;

const MOIS = [
  "janvier",
  "fevrier",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "aout",
  "septembre",
  "octobre",
  "novembre",
  "decembre",
] as const;

/** Retire accents et casse : « Après-demain » → « apres-demain ». */
function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("fr")
    .replace(/[’']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Met une heure/minutes sur une copie d'un jour donné. */
function atTime(day: Date, hours: number, minutes: number): Date {
  const out = new Date(day);
  out.setHours(hours, minutes, 0, 0);
  return out;
}

function startOfDay(day: Date): Date {
  const out = new Date(day);
  out.setHours(0, 0, 0, 0);
  return out;
}

function addDays(day: Date, count: number): Date {
  const out = new Date(day);
  out.setDate(out.getDate() + count);
  return out;
}

interface TimeGuess {
  hours: number;
  label: string;
  minutes: number;
}

/**
 * Cherche une heure dans la phrase.
 *
 * L'ordre des essais compte : « 18h30 » doit être lu avant « 18h », et le mot
 * « midi » avant le nombre nu (sinon `12` d'une date serait pris pour l'heure).
 */
function extractTime(text: string): TimeGuess | null {
  const withMinutes = /(\d{1,2})\s*(?:h|:)\s*(\d{2})\b/.exec(text);
  if (withMinutes) {
    const hours = Number(withMinutes[1]);
    const minutes = Number(withMinutes[2]);
    if (hours <= 23 && minutes <= 59) {
      return { hours, label: "heure précise", minutes };
    }
  }
  const withHour = /\b(\d{1,2})\s*(?:h\b|heures?\b|hr\b)/.exec(text);
  if (withHour) {
    const hours = Number(withHour[1]);
    if (hours <= 23) {
      return { hours, label: "heure précise", minutes: 0 };
    }
  }
  const colon = /\b(\d{1,2}):(\d{2})\b/.exec(text);
  if (colon) {
    const hours = Number(colon[1]);
    const minutes = Number(colon[2]);
    if (hours <= 23 && minutes <= 59) {
      return { hours, label: "heure précise", minutes };
    }
  }
  // Moments de la journée : la valeur est un choix assumé, affiché tel quel.
  const moments: [RegExp, number, string][] = [
    [/\bce matin\b|\bdu matin\b|\bmatin\b/, 8, "matin (08:00)"],
    [/\bmidi\b/, 12, "midi (12:00)"],
    [/\bapres-midi\b|\bapres midi\b/, 14, "après-midi (14:00)"],
    [/\bce soir\b|\bdu soir\b|\bsoir\b/, 19, "soir (19:00)"],
    [/\bcette nuit\b|\bnuit\b/, 22, "nuit (22:00)"],
  ];
  for (const [re, hours, label] of moments) {
    if (re.test(text)) {
      return { hours, label, minutes: 0 };
    }
  }
  return null;
}

interface DayGuess {
  day: Date;
  explicit: boolean;
}

/** Cherche un jour dans la phrase (jour nommé, date numérique ou littérale). */
function extractDay(text: string, now: Date): DayGuess | null {
  if (/\baujourd hui\b|\baujourdhui\b|\bce jour\b/.test(text)) {
    return { day: startOfDay(now), explicit: true };
  }
  if (/\bapres demain\b|\bapres-demain\b/.test(text)) {
    return { day: startOfDay(addDays(now, 2)), explicit: true };
  }
  if (/\bdemain\b/.test(text)) {
    return { day: startOfDay(addDays(now, 1)), explicit: true };
  }

  // « lundi », « lundi prochain », « ce lundi »
  const weekday = JOURS.findIndex((jour) => {
    const short = jour.slice(0, 4);
    return new RegExp(`\\b(${jour}|${short})\\b`).test(text);
  });
  if (weekday >= 0) {
    const today = now.getDay();
    let delta = weekday - today;
    // « lundi » un lundi veut dire le lundi SUIVANT, pas « aujourd'hui dans
    // une heure » : c'est ainsi qu'on le dit.
    if (delta <= 0) {
      delta += 7;
    }
    return { day: startOfDay(addDays(now, delta)), explicit: true };
  }

  // Date littérale : « 12 mars », « 12 mars 2026 »
  const literal = new RegExp(
    `\\b(\\d{1,2})\\s+(${MOIS.join("|")})\\b(?:\\s+(\\d{4}))?`
  ).exec(text);
  if (literal) {
    const dayOfMonth = Number(literal[1]);
    const month = MOIS.indexOf(literal[2] as (typeof MOIS)[number]);
    const year = literal[3] ? Number(literal[3]) : now.getFullYear();
    if (month >= 0 && dayOfMonth >= 1 && dayOfMonth <= 31) {
      const guess = new Date(year, month, dayOfMonth, 0, 0, 0, 0);
      if (!literal[3] && guess.getTime() < startOfDay(now).getTime()) {
        // Sans année, une date passée désigne l'année suivante.
        guess.setFullYear(guess.getFullYear() + 1);
      }
      return { day: guess, explicit: true };
    }
  }

  // Date numérique : 12/03, 12-03-2026
  const numeric = /\b(\d{1,2})[/.](\d{1,2})(?:[/.](\d{2,4}))?\b/.exec(text);
  if (numeric) {
    const dayOfMonth = Number(numeric[1]);
    const month = Number(numeric[2]) - 1;
    let year = numeric[3] ? Number(numeric[3]) : now.getFullYear();
    if (year < 100) {
      year += 2000;
    }
    if (month >= 0 && month <= 11 && dayOfMonth >= 1 && dayOfMonth <= 31) {
      const guess = new Date(year, month, dayOfMonth, 0, 0, 0, 0);
      if (!numeric[3] && guess.getTime() < startOfDay(now).getTime()) {
        guess.setFullYear(guess.getFullYear() + 1);
      }
      return { day: guess, explicit: true };
    }
  }

  // « le 12 » : jour du mois courant, ou du suivant s'il est passé.
  const bare = /\ble\s+(\d{1,2})\b/.exec(text);
  if (bare) {
    const dayOfMonth = Number(bare[1]);
    if (dayOfMonth >= 1 && dayOfMonth <= 31) {
      const current = new Date(
        now.getFullYear(),
        now.getMonth(),
        dayOfMonth,
        0,
        0,
        0,
        0
      );
      if (current.getTime() < startOfDay(now).getTime()) {
        return {
          day: new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            dayOfMonth,
            0,
            0,
            0,
            0
          ),
          explicit: true,
        };
      }
      return { day: current, explicit: true };
    }
  }

  return null;
}

interface RelativeGuess {
  label: string;
  ms: number;
}

/** Cherche une durée relative : « dans 20 minutes », « dans 1 jour ». */
function extractRelative(text: string): RelativeGuess | null {
  if (/\bdans une demi-heure\b|\bdans 30 min\b/.test(text)) {
    return { label: "dans 30 minutes", ms: 30 * 60_000 };
  }
  if (/\bdans une heure\b|\bdans 1 heure\b/.test(text)) {
    return { label: "dans 1 heure", ms: 60 * 60_000 };
  }
  const match =
    /\bdans\s+(\d{1,3})\s*(minutes?|min|mn|heures?|heure|h|jours?|jour|j|semaines?|semaine)\b/.exec(
      text
    );
  if (!match) {
    return null;
  }
  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }
  const unit = match[2];
  if (unit.startsWith("min") || unit === "mn") {
    return { label: `dans ${amount} minute(s)`, ms: amount * 60_000 };
  }
  if (unit.startsWith("h")) {
    return { label: `dans ${amount} heure(s)`, ms: amount * 3_600_000 };
  }
  if (unit.startsWith("j")) {
    return { label: `dans ${amount} jour(s)`, ms: amount * 86_400_000 };
  }
  return { label: `dans ${amount} semaine(s)`, ms: amount * 7 * 86_400_000 };
}

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

/** Étiquette courte « 12 mars 09:00 ». */
export function formatNaturalLabel(at: Date): string {
  return `${at.getDate()} ${MOIS[at.getMonth()]} ${pad(at.getHours())}:${pad(at.getMinutes())}`;
}

/**
 * Analyse une phrase et renvoie l'instant correspondant, ou `null`.
 *
 * `now` est injectable : les tests ne dépendent pas de l'horloge réelle.
 */
export function parseNaturalDate(
  input: string,
  now: Date = new Date()
): ParsedNaturalDate | null {
  const text = normalize(input);
  if (text.length < 2) {
    return null;
  }

  // 1. Les durées relatives n'ont pas de date : elles partent de « maintenant »
  //    et ne peuvent pas être « dans le passé ».
  const relative = extractRelative(text);
  if (relative) {
    return {
      at: new Date(now.getTime() + relative.ms),
      label: relative.label,
    };
  }

  // 2. Jour puis heure. Une heure seule (« 9h ») sans jour nommé désigne la
  //    prochaine occurrence de cette heure.
  const dayGuess = extractDay(text, now);
  const timeGuess = extractTime(text);

  if (!(dayGuess || timeGuess)) {
    return null;
  }

  let day = dayGuess?.day ?? startOfDay(now);
  let at = timeGuess ? atTime(day, timeGuess.hours, timeGuess.minutes) : day;

  if (!timeGuess) {
    // Jour seul : une date passée sans heure n'a pas de sens pour un rappel,
    // on retient alors la même heure que maintenant.
    at = atTime(day, now.getHours(), now.getMinutes());
    if (at.getTime() <= now.getTime()) {
      day = addDays(day, 1);
      at = atTime(day, now.getHours(), now.getMinutes());
    }
  } else if (!dayGuess?.explicit && at.getTime() <= now.getTime()) {
    // « 9h » alors qu'il est 10h → demain 9h.
    day = addDays(day, 1);
    at = atTime(day, timeGuess.hours, timeGuess.minutes);
  }

  if (at.getTime() <= now.getTime()) {
    return null;
  }

  return { at, label: formatNaturalLabel(at) };
}
