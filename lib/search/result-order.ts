/**
 * Tri et filtre de période des résultats mAI Search.
 *
 * Le moteur renvoie un ordre de pertinence. L'interface peut le réordonner
 * ou le restreindre dans le temps sans relancer la recherche : les dates
 * sont déjà sur les résultats (`page_age`). Un résultat sans date reste
 * visible — le retirer ferait croire qu'il n'existe pas.
 */

export type ResultSort = "relevance" | "date" | "title";
export type ResultPeriod = "all" | "day" | "week" | "month" | "year";

const PERIOD_MS: Record<Exclude<ResultPeriod, "all">, number> = {
  day: 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  year: 365 * 24 * 60 * 60 * 1000,
};

const RELATIVE_AGE =
  /(\d+)\s*(minutes?|mins?|heures?|hours?|jours?|days?|semaines?|weeks?|mois|months?|ans?|années|years?)\b/i;

const RELATIVE_UNIT_MS: [RegExp, number][] = [
  [/minute|^min/, 60 * 1000],
  [/heure|^hour/, 60 * 60 * 1000],
  [/jour|^day/, 24 * 60 * 60 * 1000],
  [/semaine|^week/, 7 * 24 * 60 * 60 * 1000],
  [/mois|^month/, 30 * 24 * 60 * 60 * 1000],
  [/an|^year/, 365 * 24 * 60 * 60 * 1000],
];

/** Instant du résultat, ou `null` si la date est absente ou illisible. */
export function parsePageAge(
  value: string | undefined,
  now = Date.now()
): number | null {
  const raw = value?.trim();
  if (!raw) {
    return null;
  }
  const relative = RELATIVE_AGE.exec(raw);
  if (relative) {
    const amount = Number(relative[1]);
    const unit = relative[2].toLowerCase();
    const scale = RELATIVE_UNIT_MS.find(([pattern]) => pattern.test(unit));
    if (scale && Number.isFinite(amount)) {
      return now - amount * scale[1];
    }
  }
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function orderResults<T extends { page_age?: string; title: string }>(
  items: readonly T[],
  sort: ResultSort,
  period: ResultPeriod,
  now = Date.now()
): T[] {
  const filtered =
    period === "all"
      ? [...items]
      : items.filter((item) => {
          const timestamp = parsePageAge(item.page_age, now);
          if (timestamp === null) {
            return true;
          }
          return now - timestamp <= PERIOD_MS[period];
        });

  if (sort === "title") {
    filtered.sort((a, b) =>
      a.title.localeCompare(b.title, "fr", { sensitivity: "base" })
    );
  } else if (sort === "date") {
    filtered.sort((a, b) => {
      const left = parsePageAge(a.page_age, now);
      const right = parsePageAge(b.page_age, now);
      if (left === null && right === null) {
        return 0;
      }
      if (left === null) {
        return 1;
      }
      if (right === null) {
        return -1;
      }
      return right - left;
    });
  }

  return filtered;
}
