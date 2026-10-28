import { describe, expect, it } from "vitest";
import {
  buildScheduleFromRecord,
  computeNextOccurrence,
  computeUpcomingOccurrences,
  isValidIANATimezone,
  type RecurrenceSchedule,
  resolveLocalInstant,
} from "@/lib/planning/recurrence";

/**
 * Le moteur est calendaire : la vérité est l'heure murale { fuseau IANA,
 * jour, heure, minute, politique } — l'instant UTC n'est qu'une conséquence
 * recalculée. Tous les tests épinglent donc le fuseau explicitement : aucun
 * ne dépend du host (Windows, CI ou prod peuvent avoir des fuseaux opposés).
 */

function mkSchedule(partial: Partial<RecurrenceSchedule>): RecurrenceSchedule {
  return {
    dayOfMonth: null,
    hour: 9,
    minute: 0,
    monthlyPolicy: "clamp",
    recurrence: "daily",
    timezone: "Europe/Paris",
    ...partial,
  };
}

describe("Validation des fuseaux IANA", () => {
  it("accepte les noms IANA connus", () => {
    expect(isValidIANATimezone("Europe/Paris")).toBe(true);
    expect(isValidIANATimezone("America/New_York")).toBe(true);
    expect(isValidIANATimezone("UTC")).toBe(true);
    expect(isValidIANATimezone("Asia/Tokyo")).toBe(true);
  });

  it("refuse les noms inventés, vides ou mal typés", () => {
    expect(isValidIANATimezone("Mars/Toto")).toBe(false);
    expect(isValidIANATimezone("")).toBe(false);
    expect(isValidIANATimezone(null)).toBe(false);
    expect(isValidIANATimezone(undefined)).toBe(false);
    expect(isValidIANATimezone("  ")).toBe(false);
  });
});

describe("Résolution des heures locales ambiguës ou inexistantes (DST)", () => {
  it("projette une heure murale ordinaire sur l'instant UTC exact — Paris", () => {
    // 9 h Paris en hiver = UTC+1 → 08:00Z ; en été = UTC+2 → 07:00Z.
    expect(
      resolveLocalInstant("Europe/Paris", 2026, 1, 15, 9, 0).at.toISOString()
    ).toBe("2026-01-15T08:00:00.000Z");
    expect(
      resolveLocalInstant("Europe/Paris", 2026, 7, 15, 9, 0).at.toISOString()
    ).toBe("2026-07-15T07:00:00.000Z");
    // Heure ordinaire : UN seul instant compatible, pas deux.
    expect(
      resolveLocalInstant("Europe/Paris", 2026, 1, 15, 9, 0).resolution
    ).toEqual({
      adjustedHour: null,
      ambiguity: null,
      candidateCount: 1,
    });
  });

  it("projette une heure murale ordinaire sur l'instant UTC exact — New York", () => {
    // 9 h New York en hiver = UTC-5 → 14:00Z ; en été = UTC-4 → 13:00Z.
    expect(
      resolveLocalInstant(
        "America/New_York",
        2026,
        1,
        15,
        9,
        0
      ).at.toISOString()
    ).toBe("2026-01-15T14:00:00.000Z");
    expect(
      resolveLocalInstant(
        "America/New_York",
        2026,
        7,
        15,
        9,
        0
      ).at.toISOString()
    ).toBe("2026-07-15T13:00:00.000Z");
  });

  it("ramonte une heure inexistante (concept de gap) à l'heure valide suivante", () => {
    // Le 29 mars 2026 à 02:00 Paris, il passe à 03:00 (UTC+2). 02:30 n'existe
    // pas : la convention est de remonter à l'heure murale réelle suivante
    // (ici 03:30, même minutes conservées) plutôt que de repartir en vacation.
    const r = resolveLocalInstant("Europe/Paris", 2026, 3, 29, 2, 30);
    expect(r.resolution.ambiguity).toBe("gap");
    expect(r.resolution.adjustedHour).toBe(3);
    expect(r.at.toISOString()).toBe("2026-03-29T01:30:00.000Z"); // = 03:30+02:00
  });

  it("détecte l'heure répétée du retour à l'heure d'hiver et choisit la seconde", () => {
    // Fin de l'heure d'été Paris : 26 oct. 2026, 03:00 → 02:00 (UTC+2→+1).
    // 02:30 existe DEUX fois : le moteur signale l'ambiguïté et choisit
    // l'instant le plus tardif (UTC+1).
    const r = resolveLocalInstant("Europe/Paris", 2026, 10, 25, 2, 30);
    expect(r.resolution.ambiguity).toBe("duplicate");
    expect(r.resolution.candidateCount).toBe(2);
    expect(r.at.toISOString()).toBe("2026-10-25T01:30:00.000Z");
  });

  it("ne marque PAS toute la journée du retour à l'heure d'hiver comme ambiguë", () => {
    // 09:30 le 25 octobre n'existe qu'une fois (UTC+1, après la transition).
    const r = resolveLocalInstant("Europe/Paris", 2026, 10, 25, 9, 30);
    expect(r.resolution.ambiguity).toBeNull();
    expect(r.resolution.candidateCount).toBe(1);
    expect(r.at.toISOString()).toBe("2026-10-25T08:30:00.000Z");
  });

  it("reste déterministe sur le pompage inter-fuseaux", () => {
    // La même heure murale donnée le même jour dans deux fuseaux d'offsets
    // opposés produit exactement deux instants — pas de dépendance au host.
    const a = resolveLocalInstant("Europe/Paris", 2026, 6, 15, 12, 0).at;
    const b = resolveLocalInstant("America/New_York", 2026, 6, 15, 12, 0).at;
    expect(a.getTime()).not.toBe(b.getTime());
    expect(b.getTime() - a.getTime()).toBe(6 * 60 * 60 * 1000); // UTC+2 vs UTC-4
  });
});

describe("Récurrence quotidienne calendaire (pas de +24 h brut)", () => {
  it("conserve l'heure locale à travers le passage à l'heure d'été — Paris", () => {
    // Le 29 mars 2026, Europe/Paris passe à l'heure d'été. Un plan « chaque
    // jour à 9 h » doit rester à 9 h locales, donc passer de 08:00Z à 07:00Z.
    const schedule = mkSchedule({ recurrence: "daily" });
    const next = computeNextOccurrence(
      schedule,
      new Date("2026-03-28T08:00:00.000Z") // 28 mars 09:00 Paris (UTC+1)
    );
    expect(next?.toISOString()).toBe("2026-03-29T07:00:00.000Z"); // 09:00+02:00
  });

  it("conserve l'heure locale à travers le retour à l'heure d'hiver — Paris", () => {
    const schedule = mkSchedule({ recurrence: "daily" });
    const next = computeNextOccurrence(
      schedule,
      new Date("2026-10-24T07:00:00.000Z") // 24 oct. 09:00 Paris (UTC+2)
    );
    // Le 25 oct. 2026 à 03:00, retour à UTC+1 : 9 h locales = 08:00Z.
    expect(next?.toISOString()).toBe("2026-10-25T08:00:00.000Z");
  });

  it("conserve l'heure locale à travers le passage EST→EDT — New York", () => {
    // Le 8 mars 2026, America/New_York passe à l'heure d'été (UTC-5 → UTC-4).
    const schedule = mkSchedule({
      recurrence: "daily",
      timezone: "America/New_York",
    });
    const next = computeNextOccurrence(
      schedule,
      new Date("2026-03-07T14:00:00.000Z") // 7 mars 09:00 NY (UTC-5)
    );
    expect(next?.toISOString()).toBe("2026-03-08T13:00:00.000Z"); // 09:00-04:00
  });

  it("conserve l'heure locale à travers le retour EDT→EST — New York", () => {
    // 1er nov. 2026 : retour à UTC-5.
    const schedule = mkSchedule({
      recurrence: "daily",
      timezone: "America/New_York",
    });
    const next = computeNextOccurrence(
      schedule,
      new Date("2026-10-31T13:00:00.000Z") // 31 oct. 09:00 NY (UTC-4)
    );
    expect(next?.toISOString()).toBe("2026-11-01T14:00:00.000Z"); // 09:00-05:00
  });

  it("avance d'un jour calendaire depuis la même heure murale du mois", () => {
    const schedule = mkSchedule({ hour: 14, minute: 30, recurrence: "daily" });
    const next = computeNextOccurrence(
      schedule,
      new Date("2026-06-15T12:30:00.000Z") // 14:30 Europe/Paris
    );
    expect(next?.toISOString()).toBe("2026-06-16T12:30:00.000Z");
  });

  it("le chemin daily corrige aussi une heure de gap (02:30 → 03:30)", () => {
    const schedule = mkSchedule({ hour: 2, minute: 30, recurrence: "daily" });
    const next = computeNextOccurrence(
      schedule,
      new Date("2026-03-28T01:30:00.000Z") // 28 mars 02:30 Paris (UTC+1)
    );
    // Le 29 mars 02:30 n'existe pas : 03:30 locales = 01:30Z (UTC+2).
    expect(next?.toISOString()).toBe("2026-03-29T01:30:00.000Z");
  });
});

describe("Récurrence hebdomadaire calendaire", () => {
  it("avance de sept jours calendaires dans le fuseau de la tâche", () => {
    const schedule = mkSchedule({ recurrence: "weekly" });
    const next = computeNextOccurrence(
      schedule,
      new Date("2026-03-17T08:00:00.000Z")
    );
    expect(next?.toISOString()).toBe("2026-03-24T08:00:00.000Z"); // pas de DST en jeu ici
  });

  it("encaisse un DST entre deux exécutions hebdomadaires", () => {
    // 26 mars (09:00 Paris = 08:00Z, UTC+1) → 2 avril (09:00 Paris = 07:00Z,
    // UTC+2 depuis le 29 mars) : la durée UTC entre les deux est de 167 h,
    // PAS 168 : la semaine calendaire est préservée dans le fuseau de la tâche.
    const schedule = mkSchedule({ recurrence: "weekly" });
    const next = computeNextOccurrence(
      schedule,
      new Date("2026-03-26T08:00:00.000Z")
    );
    expect(next?.toISOString()).toBe("2026-04-02T07:00:00.000Z");
  });
});

describe("Récurrence mensuelle : politiques des jours inexistants", () => {
  const base = { hour: 9, minute: 0, recurrence: "monthly" as const };

  it("clamp (défaut) : 31 janv. → 28 févr. → 31 mars", () => {
    const schedule = mkSchedule({
      ...base,
      dayOfMonth: 31,
      monthlyPolicy: "clamp",
    });
    const series = computeUpcomingOccurrences(
      schedule,
      new Date("2026-01-15T08:00:00.000Z"),
      4
    ).map((d) => d.toISOString().slice(0, 10));
    expect(series).toEqual([
      "2026-01-31",
      "2026-02-28",
      "2026-03-31",
      "2026-04-30",
    ]);
  });

  it("skip : février n'a pas de 31e jour, aucune exécution ce mois-là", () => {
    const schedule = mkSchedule({
      ...base,
      dayOfMonth: 31,
      monthlyPolicy: "skip",
    });
    const series = computeUpcomingOccurrences(
      schedule,
      new Date("2026-01-31T08:00:00.000Z"), // juste après l'occurrence de janvier
      3
    ).map((d) => d.toISOString().slice(0, 10));
    expect(series).toEqual(["2026-03-31", "2026-05-31", "2026-07-31"]);
  });

  it("report : 31 janv. → 3 mars puis 31 mars (débordement à écart constant)", () => {
    const schedule = mkSchedule({
      ...base,
      dayOfMonth: 31,
      monthlyPolicy: "report",
    });
    const series = computeUpcomingOccurrences(
      schedule,
      new Date("2026-01-31T08:00:00.000Z"),
      3
    ).map((d) => d.toISOString().slice(0, 10));
    expect(series).toEqual(["2026-03-03", "2026-03-31", "2026-05-01"]);
  });

  it("bissextile : le 29 du mois existe en février 2028, clamp au 28 en 2029", () => {
    const schedule = mkSchedule({
      ...base,
      dayOfMonth: 29,
      monthlyPolicy: "clamp",
    });
    const series = computeUpcomingOccurrences(
      schedule,
      new Date("2028-01-01T08:00:00.000Z"),
      14
    ).map((d) => d.toISOString().slice(0, 10));
    expect(series).toContain("2028-02-29"); // 2028 est bissextile
    expect(series.at(-1)).toBe("2029-02-28"); // 2029 ne l'est pas
  });

  it("jour 30 : 30 janv. → 28 févr. (clamp) → 30 mars", () => {
    const schedule = mkSchedule({
      ...base,
      dayOfMonth: 30,
      monthlyPolicy: "clamp",
    });
    const series = computeUpcomingOccurrences(
      schedule,
      new Date("2026-01-15T08:00:00.000Z"),
      3
    ).map((d) => d.toISOString().slice(0, 10));
    expect(series).toEqual(["2026-01-30", "2026-02-28", "2026-03-30"]);
  });

  it("ne clamp PAS quand le jour existe mais est simplement passé", () => {
    // Du 31 mars 10 h (occurrence déjà passée) : le prochain 29 du mois est
    // le 29 avril, PAS le 28 avril — le clamp ne concerne que les mois courts.
    const schedule = mkSchedule({
      ...base,
      dayOfMonth: 29,
      monthlyPolicy: "skip",
    });
    const next = computeNextOccurrence(
      schedule,
      new Date("2026-03-31T09:00:00.000Z") // 31 mars 10h Paris, occurrence passée
    );
    expect(next?.toISOString()).toBe("2026-04-29T07:00:00.000Z");
  });

  it("consomme l'heure murale à travers le DST — Paris (fixe les 2 échecs signalés)", () => {
    // Test historiquement cassé avec setMonth (durée UTC) : un plan « le 10 du
    // mois à 9 h Paris » créé le 10 mars (08:00Z, UTC+1) doit donner le
    // 10 avril à 9 h LOCALES (07:00Z, UTC+2 depuis le 29 mars) et non 08:00Z.
    const schedule = mkSchedule({
      ...base,
      dayOfMonth: 10,
      monthlyPolicy: "clamp",
    });
    const next = computeNextOccurrence(
      schedule,
      new Date("2026-03-10T08:00:00.000Z")
    );
    expect(next?.toISOString()).toBe("2026-04-10T07:00:00.000Z");
  });
});

describe("Reprise des enregistrements existants (tolérance migration 0046)", () => {
  it("reconstruit l'heure murale depuis scheduledAt quand les champs manquent", () => {
    const schedule = buildScheduleFromRecord(
      {
        dayOfMonth: null,
        hour: null,
        minute: null,
        recurrence: "monthly",
        timezone: null,
      },
      { scheduledAt: new Date("2026-01-10T08:00:00.000Z") }
    );
    expect(schedule.timezone).toBe("Europe/Paris");
    expect(schedule.hour).toBe(9); // 08:00Z = 09:00 Paris en hiver
    expect(schedule.minute).toBe(0);
    expect(schedule.dayOfMonth).toBe(10);
  });

  it("retombe en mode sûr sur un fuseau ou une politique illisible", () => {
    const schedule = buildScheduleFromRecord(
      { monthlyPolicy: "inconnu", recurrence: "daily", timezone: "Mars/Toto" },
      { scheduledAt: new Date("2026-06-15T07:00:00.000Z") }
    );
    expect(schedule.timezone).toBe("Europe/Paris");
    expect(schedule.monthlyPolicy).toBe("clamp");
  });

  it("avance daily/weekly après une occurrence passée (exécution en retard)", () => {
    const schedule = mkSchedule({ hour: 9, recurrence: "daily" });
    const next = computeNextOccurrence(
      schedule,
      new Date("2026-06-16T11:00:00.000Z")
    );
    // 9 h Paris du 16 juin est déjà passée (à 07:00Z) : la suivante est le 17.
    expect(next?.toISOString()).toBe("2026-06-17T07:00:00.000Z");
  });
});

describe("Absence de récurrence", () => {
  it("ne programme rien pour « none »", () => {
    expect(
      computeNextOccurrence(mkSchedule({ recurrence: "none" }), new Date())
    ).toBeNull();
  });
});
