import { tool } from "ai";
import { z } from "zod";

const WEEKDAYS_FR = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
] as const;

const MONTHS_FR = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
] as const;

function parseDateInput(
  input: string | undefined,
  _timezone?: string
): Date | null {
  if (!input) {
    return new Date();
  }
  const trimmed = input.trim();
  if (!trimmed) {
    return new Date();
  }

  // ISO date only (YYYY-MM-DD) interpreted at UTC midnight
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const d = new Date(`${trimmed}T00:00:00Z`);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // Pure time HH:MM or HH:MM:SS - treated as today in given timezone
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(trimmed)) {
    const now = new Date();
    const [h, m, s] = trimmed.split(":").map((x) => Number(x));
    const baseDate = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        h,
        m,
        s || 0
      )
    );
    return baseDate;
  }

  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return d;
}

function getTimezoneOffsetMinutes(timeZone: string, date: Date): number {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "shortOffset",
    });
    const parts = formatter.formatToParts(date);
    const offsetPart =
      parts.find((p) => p.type === "timeZoneName")?.value || "GMT+0";
    const match = offsetPart.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/);
    if (!match) {
      return 0;
    }
    const sign = match[1] === "-" ? -1 : 1;
    const hours = Number(match[2]);
    const minutes = Number(match[3] || "0");
    return sign * (hours * 60 + minutes);
  } catch {
    return 0;
  }
}

function formatInTimezone(date: Date, timeZone: string, locale = "fr-FR") {
  try {
    const fmt = new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      hour: "2-digit",
      hour12: false,
      minute: "2-digit",
      month: "2-digit",
      second: "2-digit",
      timeZone,
      timeZoneName: "longOffset",
      weekday: "long",
      year: "numeric",
    });
    const parts = fmt.formatToParts(date);
    const get = (t: string) => parts.find((p) => p.type === t)?.value || "";
    const weekday = get("weekday");
    const day = get("day");
    const month = get("month");
    const year = get("year");
    const time = `${get("hour")}:${get("minute")}:${get("second")}`;
    const offset = get("timeZoneName");
    return {
      iso: date.toISOString(),
      offset,
      readable: `${weekday} ${day} ${month} ${year} à ${time} (${offset})`,
      time,
      weekday,
    };
  } catch {
    return { error: `Fuseau horaire invalide : ${timeZone}` };
  }
}

function diffBetween(a: Date, b: Date, _unit: string) {
  const ms = Math.abs(a.getTime() - b.getTime());
  const sign = a.getTime() >= b.getTime() ? 1 : -1;
  const result: Record<string, number> = {
    days: sign * (ms / 86_400_000),
    hours: sign * (ms / 3_600_000),
    milliseconds: ms,
    minutes: sign * (ms / 60_000),
    seconds: sign * (ms / 1000),
    weeks: sign * (ms / 604_800_000),
  };
  result.months = sign * (ms / (30.44 * 86_400_000));
  result.years = sign * (ms / (365.25 * 86_400_000));
  return result;
}

function addDuration(date: Date, amount: number, unit: string): Date {
  const d = new Date(date);
  switch (unit) {
    case "milliseconds":
      d.setMilliseconds(d.getMilliseconds() + amount);
      break;
    case "seconds":
      d.setSeconds(d.getSeconds() + amount);
      break;
    case "minutes":
      d.setMinutes(d.getMinutes() + amount);
      break;
    case "hours":
      d.setHours(d.getHours() + amount);
      break;
    case "days":
      d.setDate(d.getDate() + amount);
      break;
    case "weeks":
      d.setDate(d.getDate() + amount * 7);
      break;
    case "months":
      d.setMonth(d.getMonth() + amount);
      break;
    case "years":
      d.setFullYear(d.getFullYear() + amount);
      break;
  }
  return d;
}

function getPartsInZone(date: Date, timeZone: string) {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      day: "2-digit",
      hour: "2-digit",
      hour12: false,
      minute: "2-digit",
      month: "2-digit",
      second: "2-digit",
      timeZone,
      weekday: "short",
      year: "numeric",
    });
    const parts = fmt.formatToParts(date);
    const get = (t: string) =>
      Number(parts.find((p) => p.type === t)?.value || "0");
    return {
      day: get("day"),
      hour: get("hour"),
      minute: get("minute"),
      month: get("month"),
      second: get("second"),
      weekday: parts.find((p) => p.type === "weekday")?.value || "",
      year: get("year"),
    };
  } catch {
    return null;
  }
}

export const dateTime = tool({
  description:
    "Manipuler dates et heures : obtenir l'heure actuelle dans un fuseau horaire, calculer des différences entre deux dates, ajouter/soustraire des durées, convertir entre fuseaux horaires, calculer la date de Pâques, jours fériés, ou jour de la semaine. Supporte dates ISO (YYYY-MM-DD), dates complètes ISO 8601, ou expressions comme '2024-12-25T18:00'.",
  execute: async (input) => {
    const op = input.operation;

    if (op === "now") {
      const tz = input.timezone || "UTC";
      const now = new Date();
      const formatted = formatInTimezone(now, tz);
      if ((formatted as any).error) {
        return {
          availableTimezones: COMMON_TIMEZONES,
          error: (formatted as any).error,
        };
      }
      return {
        formatted: (formatted as any).readable,
        iso: (formatted as any).iso,
        offset: (formatted as any).offset,
        time: (formatted as any).time,
        timestamp: now.getTime(),
        timezone: tz,
        weekday: (formatted as any).weekday,
      };
    }

    if (op === "convert") {
      const date = parseDateInput(input.date, input.fromTimezone);
      if (!date) {
        return { error: "Date source invalide." };
      }
      const fromTz = input.fromTimezone || "UTC";
      const toTz = input.toTimezone || "UTC";
      const from = formatInTimezone(date, fromTz);
      if ((from as any).error) {
        return {
          availableTimezones: COMMON_TIMEZONES,
          error: (from as any).error,
        };
      }
      const to = formatInTimezone(date, toTz);
      if ((to as any).error) {
        return {
          availableTimezones: COMMON_TIMEZONES,
          error: (to as any).error,
        };
      }
      const fromOffset = getTimezoneOffsetMinutes(fromTz, date);
      const toOffset = getTimezoneOffsetMinutes(toTz, date);
      return {
        from: {
          offset: (from as any).offset,
          readable: (from as any).readable,
          timezone: fromTz,
        },
        iso: date.toISOString(),
        offsetDifferenceMinutes: toOffset - fromOffset,
        timestamp: date.getTime(),
        to: {
          offset: (to as any).offset,
          readable: (to as any).readable,
          timezone: toTz,
        },
      };
    }

    if (op === "diff") {
      const a = parseDateInput(input.startDate, input.timezone);
      const b = parseDateInput(input.endDate, input.timezone);
      if (!a || !b) {
        return { error: "startDate ou endDate invalide." };
      }
      const diff = diffBetween(a, b, input.unit || "days");
      return {
        end: b.toISOString(),
        start: a.toISOString(),
        unit: input.unit || "auto",
        values: diff,
      };
    }

    if (op === "add") {
      const base = parseDateInput(input.date, input.timezone);
      if (!base) {
        return { error: "Date de base invalide." };
      }
      const amount = Number(input.amount ?? 0);
      if (!Number.isFinite(amount)) {
        return { error: "Amount invalide." };
      }
      const result = addDuration(base, amount, input.unit || "days");
      const tz = input.timezone || "UTC";
      const formatted = formatInTimezone(result, tz);
      return {
        amount,
        formatted: (formatted as any).readable,
        iso: result.toISOString(),
        operation: amount >= 0 ? "add" : "subtract",
        timestamp: result.getTime(),
        unit: input.unit || "days",
      };
    }

    if (op === "weekday") {
      const date = parseDateInput(input.date, input.timezone);
      if (!date) {
        return { error: "Date invalide." };
      }
      const parts = getPartsInZone(date, input.timezone || "UTC");
      if (!parts) {
        return { error: "Fuseau horaire invalide." };
      }
      const idx = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
        parts.weekday
      );
      return {
        dayOfMonth: parts.day,
        iso: date.toISOString(),
        month: MONTHS_FR[parts.month - 1] || "",
        weekdayEn: parts.weekday,
        weekdayFr: WEEKDAYS_FR[idx] || "",
        weekdayIndex: idx,
        year: parts.year,
      };
    }

    if (op === "format") {
      const date = parseDateInput(input.date, input.timezone);
      if (!date) {
        return { error: "Date invalide." };
      }
      const tz = input.timezone || "UTC";
      const formatted = formatInTimezone(date, tz);
      if ((formatted as any).error) {
        return { error: (formatted as any).error };
      }
      return {
        formatted: (formatted as any).readable,
        iso: date.toISOString(),
        timestamp: date.getTime(),
        timezone: tz,
      };
    }

    if (op === "easter") {
      const year = Number(input.year);
      if (!Number.isInteger(year) || year < 1583 || year > 9999) {
        return { error: "Année invalide (1583-9999)." };
      }
      const a = year % 19;
      const b = Math.floor(year / 100);
      const c = year % 100;
      const d = Math.floor(b / 4);
      const e = b % 4;
      const f = Math.floor((b + 8) / 25);
      const g = Math.floor((b - f + 1) / 3);
      const h = (19 * a + b - d - g + 15) % 30;
      const i = Math.floor(c / 4);
      const k = c % 4;
      const l = (32 + 2 * e + 2 * i - h - k) % 7;
      const m = Math.floor((a + 11 * h + 22 * l) / 451);
      const month = Math.floor((h + l - 7 * m + 114) / 31);
      const day = ((h + l - 7 * m + 114) % 31) + 1;
      const easterDate = new Date(Date.UTC(year, month - 1, day));
      const formatted = formatInTimezone(easterDate, "UTC");
      return {
        date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        formatted: (formatted as any).readable,
        iso: easterDate.toISOString(),
        weekday: (formatted as any).weekday,
        year,
      };
    }

    if (op === "list_timezones") {
      return {
        sample: COMMON_TIMEZONES,
        timezones: ALL_IANA_TIMEZONES,
        total: ALL_IANA_TIMEZONES.length,
      };
    }

    return { error: `Opération inconnue : ${op}` };
  },
  inputSchema: z.object({
    amount: z
      .number()
      .optional()
      .describe(
        "Quantité (positif ou négatif) à ajouter/soustraire (operation='add')"
      ),
    date: z
      .string()
      .min(1)
      .max(100)
      .optional()
      .describe(
        "Date au format ISO YYYY-MM-DD ou ISO 8601 complet. Si vide = maintenant."
      ),
    endDate: z
      .string()
      .min(1)
      .max(100)
      .optional()
      .describe("Date de fin (operation='diff')"),
    fromTimezone: z
      .string()
      .min(1)
      .max(60)
      .optional()
      .describe(
        "Fuseau horaire source (IANA, ex: 'Europe/Paris', 'America/New_York')"
      ),
    operation: z
      .enum([
        "now",
        "convert",
        "diff",
        "add",
        "weekday",
        "format",
        "easter",
        "list_timezones",
      ])
      .describe("Opération à effectuer"),
    startDate: z
      .string()
      .min(1)
      .max(100)
      .optional()
      .describe("Date de début (operation='diff')"),
    timezone: z
      .string()
      .min(1)
      .max(60)
      .optional()
      .describe(
        "Fuseau horaire IANA (ex: 'Europe/Paris', 'America/Los_Angeles', 'UTC'). Défaut UTC."
      ),
    toTimezone: z
      .string()
      .min(1)
      .max(60)
      .optional()
      .describe("Fuseau horaire cible (operation='convert')"),
    unit: z
      .enum([
        "milliseconds",
        "seconds",
        "minutes",
        "hours",
        "days",
        "weeks",
        "months",
        "years",
      ])
      .optional()
      .describe("Unité de durée (operation='add' ou 'diff')"),
    year: z
      .number()
      .int()
      .min(1583)
      .max(9999)
      .optional()
      .describe("Année pour operation='easter' (1583-9999)"),
  }),
});

const ALL_IANA_TIMEZONES = [
  "Africa/Abidjan",
  "Africa/Algiers",
  "Africa/Cairo",
  "Africa/Casablanca",
  "Africa/Johannesburg",
  "Africa/Lagos",
  "Africa/Nairobi",
  "America/Anchorage",
  "America/Argentina/Buenos_Aires",
  "America/Bogota",
  "America/Chicago",
  "America/Denver",
  "America/Halifax",
  "America/Lima",
  "America/Los_Angeles",
  "America/Mexico_City",
  "America/New_York",
  "America/Phoenix",
  "America/Sao_Paulo",
  "America/Toronto",
  "America/Vancouver",
  "Asia/Bangkok",
  "Asia/Dubai",
  "Asia/Hong_Kong",
  "Asia/Jakarta",
  "Asia/Jerusalem",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Manila",
  "Asia/Seoul",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Taipei",
  "Asia/Tehran",
  "Asia/Tokyo",
  "Atlantic/Azores",
  "Atlantic/Canary",
  "Australia/Melbourne",
  "Australia/Perth",
  "Australia/Sydney",
  "Europe/Amsterdam",
  "Europe/Athens",
  "Europe/Berlin",
  "Europe/Brussels",
  "Europe/Bucharest",
  "Europe/Dublin",
  "Europe/Istanbul",
  "Europe/Kyiv",
  "Europe/Lisbon",
  "Europe/London",
  "Europe/Madrid",
  "Europe/Moscow",
  "Europe/Oslo",
  "Europe/Paris",
  "Europe/Prague",
  "Europe/Rome",
  "Europe/Stockholm",
  "Europe/Vienna",
  "Europe/Warsaw",
  "Europe/Zurich",
  "Indian/Maldives",
  "Pacific/Auckland",
  "Pacific/Fiji",
  "Pacific/Honolulu",
  "UTC",
];

const COMMON_TIMEZONES = [
  "UTC",
  "Europe/Paris",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Athens",
  "Europe/Istanbul",
  "Europe/Moscow",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Mexico_City",
  "America/Sao_Paulo",
  "America/Buenos_Aires",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Sydney",
  "Pacific/Auckland",
];
