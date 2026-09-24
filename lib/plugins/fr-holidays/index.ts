import { tool } from "ai";
import { z } from "zod";
import { fetchPublicJson, sourceRef } from "../shared/public-api";
import type { PluginDefinition, PluginManifest } from "../types";
import manifest from "./index.json";

// Calcul 100 % local et déterministe : aucune API, aucune clé, aucune donnée
// utilisateur. Les dates sont manipulées en UTC pour ne pas dépendre du fuseau
// du serveur.

const MIN_YEAR = 1970;
const MAX_YEAR = 2100;

const WEEKDAYS_FR = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
] as const;

const FIXED_HOLIDAYS: Array<{ day: number; label: string; month: number }> = [
  { day: 1, label: "Jour de l'an", month: 1 },
  { day: 1, label: "Fête du Travail", month: 5 },
  { day: 8, label: "Victoire 1945", month: 5 },
  { day: 14, label: "Fête nationale", month: 7 },
  { day: 15, label: "Assomption", month: 8 },
  { day: 1, label: "Toussaint", month: 11 },
  { day: 11, label: "Armistice 1918", month: 11 },
  { day: 25, label: "Noël", month: 12 },
];

// Fêtes mobiles exprimées en jours après Pâques.
const EASTER_OFFSETS: Array<{ days: number; label: string }> = [
  { days: 1, label: "Lundi de Pâques" },
  { days: 39, label: "Ascension" },
  { days: 50, label: "Lundi de Pentecôte" },
];

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

// Algorithme grégorien de Meeus/Jones/Butcher : Pâques en calendrier grégorien.
function easterSunday(year: number): Date {
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
  return utcDate(year, month, day);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

export type HolidayEntry = {
  date: string;
  label: string;
  weekday: string;
};

export type BridgeEntry = {
  date: string;
  reason: string;
  weekday: string;
};

function buildHolidays(year: number): HolidayEntry[] {
  const easter = easterSunday(year);
  const dates: Array<{ date: string; label: string }> = [
    ...FIXED_HOLIDAYS.map((holiday) => ({
      date: toIso(utcDate(year, holiday.month, holiday.day)),
      label: holiday.label,
    })),
    ...EASTER_OFFSETS.map((offset) => ({
      date: toIso(addDays(easter, offset.days)),
      label: offset.label,
    })),
  ].sort((left, right) => left.date.localeCompare(right.date));

  return dates.map((entry) => ({
    date: entry.date,
    label: entry.label,
    weekday: WEEKDAYS_FR[new Date(`${entry.date}T00:00:00Z`).getUTCDay()]!,
  }));
}

function buildBridges(holidays: HolidayEntry[]): BridgeEntry[] {
  const holidayDates = new Set(holidays.map((holiday) => holiday.date));
  const bridges: BridgeEntry[] = [];
  for (const holiday of holidays) {
    const date = new Date(`${holiday.date}T00:00:00Z`);
    const weekday = date.getUTCDay();
    if (weekday !== 2 && weekday !== 4) {
      continue;
    }
    const bridgeDate = toIso(addDays(date, weekday === 2 ? -1 : 1));
    if (holidayDates.has(bridgeDate)) {
      continue;
    }
    bridges.push({
      date: bridgeDate,
      reason: `${holiday.label} tombe un ${holiday.weekday} : poser le ${
        WEEKDAYS_FR[new Date(`${bridgeDate}T00:00:00Z`).getUTCDay()]
      } offre un week-end de 4 jours.`,
      weekday: WEEKDAYS_FR[new Date(`${bridgeDate}T00:00:00Z`).getUTCDay()]!,
    });
  }
  return bridges.sort((left, right) => left.date.localeCompare(right.date));
}

function countWorkdays(
  from: Date,
  to: Date,
  holidayDates: ReadonlySet<string>
): number {
  let count = 0;
  for (
    let cursor = new Date(from.getTime());
    cursor.getTime() <= to.getTime();
    cursor = addDays(cursor, 1)
  ) {
    const weekday = cursor.getUTCDay();
    if (weekday === 0 || weekday === 6) {
      continue;
    }
    if (holidayDates.has(toIso(cursor))) {
      continue;
    }
    count += 1;
  }
  return count;
}

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format attendu : AAAA-MM-JJ")
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return (
      !Number.isNaN(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === value
    );
  }, "Date grégorienne invalide.");

export const frHolidays = tool({
  description:
    "Lister les jours fériés légaux français d'une année (avec jour de la semaine), identifier les ponts à poser et compter les jours ouvrés entre deux dates. Calcul local, aucune donnée externe.",
  execute: async (input) => {
    const holidays = buildHolidays(input.year);
    const holidayDates = new Set(holidays.map((holiday) => holiday.date));
    const bridges =
      input.includeBridges === false ? [] : buildBridges(holidays);

    const result: {
      bridges: BridgeEntry[];
      holidays: HolidayEntry[];
      range?: { from: string; to: string; workdays: number; totalDays: number };
      year: number;
    } = {
      bridges,
      holidays,
      year: input.year,
    };

    if ((input.from && !input.to) || (!input.from && input.to)) {
      return { error: "« from » et « to » doivent être fournis ensemble." };
    }

    if (input.from && input.to) {
      const from = new Date(`${input.from}T00:00:00Z`);
      const to = new Date(`${input.to}T00:00:00Z`);
      if (
        Number.isNaN(from.getTime()) ||
        Number.isNaN(to.getTime()) ||
        from.toISOString().slice(0, 10) !== input.from ||
        to.toISOString().slice(0, 10) !== input.to
      ) {
        return {
          error:
            "Dates invalides : utilisez le format AAAA-MM-JJ pour « from » et « to ».",
        };
      }
      if (from.getTime() > to.getTime()) {
        return { error: "« from » doit précéder « to »." };
      }
      const fromYear = from.getUTCFullYear();
      const toYear = to.getUTCFullYear();
      if (fromYear < MIN_YEAR || toYear > MAX_YEAR) {
        return { error: `Années hors plage (${MIN_YEAR}–${MAX_YEAR}).` };
      }
      const totalDays =
        Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
      if (totalDays > 3660) {
        return {
          error:
            "Intervalle trop large : 10 ans maximum entre « from » et « to ».",
        };
      }
      for (let year = fromYear; year <= toYear; year += 1) {
        for (const holiday of buildHolidays(year)) {
          holidayDates.add(holiday.date);
        }
      }
      result.range = {
        from: input.from,
        to: input.to,
        totalDays,
        workdays: countWorkdays(from, to, holidayDates),
      };
    }

    return result;
  },
  inputSchema: z.object({
    from: isoDateSchema
      .optional()
      .describe(
        "Date de début (AAAA-MM-JJ) pour compter les jours ouvrés, avec « to »"
      ),
    includeBridges: z
      .boolean()
      .optional()
      .describe("Détecter les ponts possibles (défaut true)"),
    to: isoDateSchema
      .optional()
      .describe(
        "Date de fin (AAAA-MM-JJ) pour compter les jours ouvrés, avec « from »"
      ),
    year: z
      .number()
      .int()
      .min(MIN_YEAR)
      .max(MAX_YEAR)
      .describe(`Année civile (${MIN_YEAR}-${MAX_YEAR})`),
  }),
});

const NAGER_V3 = "https://nagerholidays.com/api/v3";
const NAGER_V4 = "https://nagerholidays.com/api/v4";
const countrySchema = z
  .string()
  .length(2)
  .regex(/^[A-Za-z]{2}$/)
  .transform((value) => value.toUpperCase());
const yearSchema = z.number().int().min(1970).max(2100);
type ApiHoliday = {
  date: string;
  localName?: string;
  name?: string;
  countryCode?: string;
  types?: string[];
  holidayTypes?: string[];
  global?: boolean;
  nationalHoliday?: boolean;
  counties?: string[] | null;
  subdivisionCodes?: string[] | null;
};

export const internationalHolidays = tool({
  description:
    "Liste les jours fériés publics d'un pays pour une année avec noms locaux et types.",
  execute: async ({ country, year }) => {
    const countryCode = country.toUpperCase();
    const url = `${NAGER_V4}/Holidays/${countryCode}/${year}`;
    const result = await fetchPublicJson<ApiHoliday[]>(url);
    if (!result.ok) return { error: result.error };
    return {
      country: countryCode,
      holidays: result.data
        .filter((holiday) =>
          (holiday.holidayTypes ?? holiday.types ?? []).includes("Public")
        )
        .slice(0, 50)
        .map((holiday) => ({
          date: holiday.date,
          localName: holiday.localName ?? holiday.name ?? null,
          name: holiday.name ?? null,
          national: holiday.nationalHoliday ?? holiday.global ?? null,
          regions: holiday.subdivisionCodes ?? holiday.counties ?? null,
          types: holiday.holidayTypes ?? holiday.types ?? [],
        })),
      source: sourceRef(url, "Nager.Date — jours fériés"),
      year,
    };
  },
  inputSchema: z.object({ country: countrySchema, year: yearSchema }),
});

export const isPublicHoliday = tool({
  description:
    "Vérifie si une date exacte est un jour férié national ou régional dans un pays.",
  execute: async ({ country, date }) => {
    const countryCode = country.toUpperCase();
    const year = Number(date.slice(0, 4));
    if (year < 1970 || year > 2100)
      return { error: "Année hors plage (1970–2100)." };
    const parsed = new Date(`${date}T00:00:00Z`);
    if (
      Number.isNaN(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== date
    ) {
      return {
        error:
          "Date invalide. Utilisez une date grégorienne réelle au format AAAA-MM-JJ.",
      };
    }
    const url = `${NAGER_V4}/Holidays/${countryCode}/${year}`;
    const result = await fetchPublicJson<ApiHoliday[]>(url);
    if (!result.ok) return { error: result.error };
    const holidays = result.data
      .filter(
        (holiday) =>
          holiday.date === date &&
          (holiday.holidayTypes ?? holiday.types ?? []).includes("Public")
      )
      .slice(0, 10);
    return {
      country: countryCode,
      date,
      holidays: holidays.map((holiday) => ({
        localName: holiday.localName ?? holiday.name ?? null,
        name: holiday.name ?? null,
        national: holiday.nationalHoliday ?? holiday.global ?? null,
        regions: holiday.subdivisionCodes ?? holiday.counties ?? null,
      })),
      isPublicHoliday: holidays.length > 0,
      source: sourceRef(url, "Nager.Date — vérification"),
    };
  },
  inputSchema: z.object({ country: countrySchema, date: isoDateSchema }),
});

export const getHolidayLongWeekends = tool({
  description:
    "Recherche les week-ends prolongés détectés par Nager.Date pour un pays et une année.",
  execute: async ({ country, year }) => {
    const countryCode = country.toUpperCase();
    const url = `${NAGER_V3}/LongWeekend/${year}/${countryCode}`;
    const result =
      await fetchPublicJson<
        Array<{
          startDate: string;
          endDate: string;
          dayCount: number;
          needBridgeDay: boolean;
        }>
      >(url);
    if (!result.ok) return { error: result.error };
    return {
      country: countryCode,
      longWeekends: result.data.slice(0, 20),
      source: sourceRef(url, "Nager.Date — week-ends prolongés"),
      year,
    };
  },
  inputSchema: z.object({ country: countrySchema, year: yearSchema }),
});

export const listHolidayCountries = tool({
  description: "Liste les codes pays disponibles dans le service Nager.Date.",
  execute: async () => {
    const url = `${NAGER_V3}/AvailableCountries`;
    const result =
      await fetchPublicJson<Array<{ countryCode: string; name: string }>>(url);
    if (!result.ok) return { error: result.error };
    return {
      countries: result.data
        .slice(0, 250)
        .map(({ countryCode, name }) => ({ code: countryCode, name })),
      source: sourceRef(url, "Nager.Date — pays"),
    };
  },
  inputSchema: z.object({}),
});

export const frHolidaysPlugin: PluginDefinition = {
  createTools: () => ({
    frHolidays,
    getHolidayLongWeekends,
    internationalHolidays,
    isPublicHoliday,
    listHolidayCountries,
  }),
  manifest: manifest as PluginManifest,
};
