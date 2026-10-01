import { describe, expect, it } from "vitest";
import {
  nextOccurrenceFromRule,
  timezoneOffsetMs,
  zonedTimeToUtc,
} from "@/lib/agent/scheduler/occurrence";
import { resolveOnceDueAt } from "@/lib/agent/scheduler/once";

describe("Calcul des occurrences (règle + fuseau IANA)", () => {
  it("résout une heure locale en UTC correctement", () => {
    // 09:00 Europe/Paris en hiver = 08:00 UTC ; en été = 07:00 UTC.
    const winter = zonedTimeToUtc(
      { day: 15, hour: 9, minute: 0, month: 1, year: 2026 },
      "Europe/Paris"
    );
    expect(winter.toISOString()).toBe("2026-01-15T08:00:00.000Z");
    const summer = zonedTimeToUtc(
      { day: 15, hour: 9, minute: 0, month: 7, year: 2026 },
      "Europe/Paris"
    );
    expect(summer.toISOString()).toBe("2026-07-15T07:00:00.000Z");
  });

  it("gère le temps inexistant (ressort d'heure) en bornant au réel", () => {
    // 2026-03-29 : passage à l'heure d'été à Paris — 02:30 n'existe pas.
    const nonexistent = zonedTimeToUtc(
      { day: 29, hour: 2, minute: 30, month: 3, year: 2026 },
      "Europe/Paris"
    );
    // La résolution ne doit jamais produire une heure locale < 03:00 ce
    // jour-là (le temps inexistant est projeté après le saut).
    const offset = timezoneOffsetMs("Europe/Paris", nonexistent);
    const localHour = new Date(nonexistent.getTime() + offset).getUTCHours();
    expect(localHour).toBeGreaterThanOrEqual(3);
  });

  it("avance d'un jour pour une récurrence daily", () => {
    const from = new Date("2026-09-14T07:00:00.000Z"); // lundi 09:00 Paris
    const next = nextOccurrenceFromRule(
      { frequency: "daily", kind: "recurring", time: "09:00" },
      "Europe/Paris",
      from
    );
    expect(next?.toISOString()).toBe("2026-09-15T07:00:00.000Z");
  });

  it("garde l'heure locale à travers un changement d'heure", () => {
    // À J-1 du changement d'heure (octobre 2026, Paris bascule le 25) : une
    // règle 09:00 doit produire 08:00 UTC avant la bascule et 07:00 UTC
    // après — pas 24 h fixes.
    const before = zonedTimeToUtc(
      { day: 24, hour: 9, minute: 0, month: 10, year: 2026 },
      "Europe/Paris"
    );
    const after = zonedTimeToUtc(
      { day: 26, hour: 9, minute: 0, month: 10, year: 2026 },
      "Europe/Paris"
    );
    expect(before.toISOString()).toBe("2026-10-24T07:00:00.000Z");
    expect(after.toISOString()).toBe("2026-10-26T08:00:00.000Z");
    expect(after.getTime() - before.getTime()).not.toBe(48 * 60 * 60 * 1000);
  });

  it("cible le bon jour de semaine pour une récurrence weekly", () => {
    // Mercredi 16/09/2026 07:00 UTC → prochaine récurrence friday 09:00 Paris
    const from = new Date("2026-09-16T07:00:00.000Z");
    const next = nextOccurrenceFromRule(
      {
        frequency: "weekly",
        kind: "recurring",
        time: "09:00",
        weekday: "friday",
      },
      "Europe/Paris",
      from
    );
    expect(next?.toISOString()).toBe("2026-09-18T07:00:00.000Z");
  });

  it("borne le jour du mois au dernier jour réel (mensuel)", () => {
    // Règle le 31 : après le 31 janvier, prochaine occurrence = 28 février.
    const from = new Date("2026-01-31T07:30:00.000Z");
    const next = nextOccurrenceFromRule(
      {
        dayOfMonth: 31,
        frequency: "monthly",
        kind: "recurring",
        time: "08:00",
      },
      "Europe/Paris",
      from
    );
    expect(next?.toISOString()).toBe("2026-02-28T07:00:00.000Z");
  });

  it("reprogramme une règle one-shot avec sa date locale", () => {
    const resolution = resolveOnceDueAt({
      rule: { kind: "once", runAt: "2026-10-01T09:30" },
      timezone: "Europe/Paris",
    });
    expect(resolution.ok).toBe(true);
    if (resolution.ok) {
      expect(resolution.dueAt.toISOString()).toBe("2026-10-01T07:30:00.000Z");
    }
  });

  it("retourne null pour une règle one-shot (date unique portée par la ligne)", () => {
    const next = nextOccurrenceFromRule(
      { kind: "once" },
      "Europe/Paris",
      new Date("2026-09-14T07:00:00.000Z")
    );
    expect(next).toBeNull();
  });
});
