import type { ScheduleRule, ScheduleWeekday } from "@/lib/agent/contracts";

// Calcul des occurrences : règle + fuseau IANA, JAMAIS une suite de dates UTC.
// Une heure locale exprimée dans la règle (ex. 09:00 Europe/Paris) reste à
// 09:00 locale après un passage à l'heure d'été ou d'hiver : on résout
// l'occurrence en construisant la date locale et en lisant l'offset réel du
// fuseau à cette instant (Intl.DateTimeFormat), avec gestion du « temps
// inexistant » (ressort de 02:30 → 03:30 au passage d'heure) et du « temps
// ambigu » (02:30 répété en fin d'heure d'été → première occurrence).

const WEEKDAY_INDEX: Record<ScheduleWeekday, number> = {
  friday: 5,
  monday: 1,
  saturday: 6,
  sunday: 0,
  thursday: 4,
  tuesday: 2,
  wednesday: 3,
};

// Offset (ms) du fuseau à cet instant UTC : différence entre l'heure locale
// formatée par Intl et l'heure UTC.
export function timezoneOffsetMs(timezone: string, at: Date): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone: timezone,
    year: "numeric",
  });
  const parts = formatter.formatToParts(at);
  const read = (type: string): number =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");
  const asUtc = Date.UTC(
    read("year"),
    read("month") - 1,
    read("day"),
    read("hour") % 24,
    read("minute"),
    read("second")
  );
  return asUtc - at.getTime();
}

// Interprétation d'une date locale (Y-M-D h:m) dans un fuseau : on part d'une
// hypothèse UTC puis on corrige avec l'offset réel du fuseau. Une seule
// correction suffit dans le cas général ; une seconde passe traite le saut
// d'une heure aux transitions (temps inexistant).
export function zonedTimeToUtc(
  params: {
    day: number;
    hour: number;
    minute: number;
    month: number; // 1-12
    year: number;
  },
  timezone: string
): Date {
  const naiveUtc = Date.UTC(
    params.year,
    params.month - 1,
    params.day,
    params.hour,
    params.minute
  );
  let guess = new Date(naiveUtc);
  for (let pass = 0; pass < 2; pass += 1) {
    const offset = timezoneOffsetMs(timezone, guess);
    guess = new Date(naiveUtc - offset);
  }
  return guess;
}

// Prochaine occurrence (UTC) STRICTEMENT postérieure à `from`, pour une règle
// et un fuseau donnés. `from` est le « maintenant » du worker.
export function nextOccurrenceFromRule(
  rule: ScheduleRule,
  timezone: string,
  from: Date
): Date | null {
  if (rule.kind === "once") {
    return null;
  }

  const [hour, minute] = rule.time.split(":").map(Number);
  const offset = timezoneOffsetMs(timezone, from);
  const local = new Date(from.getTime() + offset);

  // Candidat : aujourd'hui à l'heure de la règle (heure locale).
  const buildCandidate = (year: number, month: number, day: number): Date =>
    zonedTimeToUtc({ day, hour, minute, month, year }, timezone);

  const localYear = local.getUTCFullYear();
  const localMonth = local.getUTCMonth() + 1;
  const localDay = local.getUTCDate();

  const resolveAfter = (candidate: Date): Date | null => {
    if (candidate.getTime() > from.getTime()) {
      return candidate;
    }
    return null;
  };

  if (rule.frequency === "daily") {
    const today = buildCandidate(localYear, localMonth, localDay);
    const afterToday = resolveAfter(today);
    if (afterToday) {
      return afterToday;
    }
    const tomorrow = zonedTimeToUtc(
      {
        ...nextLocalDay({ day: localDay, month: localMonth, year: localYear }),
        hour,
        minute,
      },
      timezone
    );
    return tomorrow;
  }

  if (rule.frequency === "weekly") {
    const targetWeekday = rule.weekday ? WEEKDAY_INDEX[rule.weekday] : 1;
    const localWeekday = local.getUTCDay();
    let dayDelta = (targetWeekday - localWeekday + 7) % 7;
    const today = buildCandidate(localYear, localMonth, localDay);
    if (dayDelta === 0 && today.getTime() <= from.getTime()) {
      dayDelta = 7;
    }
    const shifted = addLocalDays(
      { day: localDay, month: localMonth, year: localYear },
      dayDelta
    );
    return zonedTimeToUtc({ ...shifted, hour, minute }, timezone);
  }

  // Mensuel : même jour du mois, à l'heure de la règle. Si le jour n'existe
  // pas dans le mois cible (31 février…), on borne au dernier jour du mois.
  const targetDay = rule.dayOfMonth ?? localDay;
  const candidateThisMonth = buildCandidate(
    localYear,
    localMonth,
    Math.min(targetDay, daysInMonth(localYear, localMonth))
  );
  const afterThisMonth = resolveAfter(candidateThisMonth);
  if (afterThisMonth) {
    return afterThisMonth;
  }
  const nextMonth = localMonth === 12 ? 1 : localMonth + 1;
  const nextMonthYear = localMonth === 12 ? localYear + 1 : localYear;
  return buildCandidate(
    nextMonthYear,
    nextMonth,
    Math.min(targetDay, daysInMonth(nextMonthYear, nextMonth))
  );
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function nextLocalDay(date: { day: number; month: number; year: number }): {
  day: number;
  month: number;
  year: number;
} {
  return addLocalDays(date, 1);
}

function addLocalDays(
  date: { day: number; month: number; year: number },
  days: number
): { day: number; month: number; year: number } {
  const shifted = new Date(
    Date.UTC(date.year, date.month - 1, date.day + days)
  );
  return {
    day: shifted.getUTCDate(),
    month: shifted.getUTCMonth() + 1,
    year: shifted.getUTCFullYear(),
  };
}
