import { describe, expect, it } from "vitest";
import { parseNaturalDate } from "@/lib/planning/natural-date";
import {
  afterNotification,
  createReminder,
  currentOccurrence,
  formatCountdown,
  nextOccurrence,
  parseReminders,
  remindersToNotify,
  sortReminders,
} from "@/lib/planning/reminders";

/**
 * Les rappels et la saisie en langage naturel sont deux fonctions PURES :
 * elles doivent être vérifiables sans navigateur, sans base et sans horloge
 * réelle. D'où l'injection de `now` partout.
 *
 * Le cas qui compte le plus est celui de la date « dans le passé » : un
 * formulaire qui accepte silencieusement une heure déjà écoulée crée une tâche
 * morte, et l'utilisateur ne le découvre qu'en ne recevant rien.
 */

// Un mercredi, pour que « lundi prochain » ait un sens vérifiable.
const MERCREDI = new Date(2026, 2, 11, 10, 0, 0, 0); // 11 mars 2026, 10:00

describe("parseNaturalDate", () => {
  it("comprend les durées relatives", () => {
    const parsed = parseNaturalDate("dans 2 heures", MERCREDI);
    expect(parsed?.at.getTime()).toBe(MERCREDI.getTime() + 2 * 3_600_000);
    expect(parseNaturalDate("dans 20 minutes", MERCREDI)?.at.getMinutes()).toBe(
      20
    );
    expect(parseNaturalDate("dans 3 jours", MERCREDI)?.at.getDate()).toBe(14);
  });

  it("comprend « demain » avec une heure", () => {
    const parsed = parseNaturalDate("demain 9h30", MERCREDI);
    expect(parsed?.at.getDate()).toBe(12);
    expect(parsed?.at.getHours()).toBe(9);
    expect(parsed?.at.getMinutes()).toBe(30);
  });

  it("comprend un jour de la semaine et l'avance à la semaine suivante", () => {
    // Mercredi 11 mars → « lundi » = 16 mars.
    const parsed = parseNaturalDate("lundi 8h", MERCREDI);
    expect(parsed?.at.getDay()).toBe(1);
    expect(parsed?.at.getDate()).toBe(16);
    expect(parsed?.at.getHours()).toBe(8);
  });

  it("comprend une date littérale et une date numérique", () => {
    expect(parseNaturalDate("12 avril 14h", MERCREDI)?.at.getMonth()).toBe(3);
    expect(parseNaturalDate("20/03 18h", MERCREDI)?.at.getDate()).toBe(20);
  });

  it("reporte une heure seule au lendemain quand elle est déjà passée", () => {
    // Il est 10h : « 9h » ne peut pas être aujourd'hui.
    const parsed = parseNaturalDate("9h", MERCREDI);
    expect(parsed?.at.getDate()).toBe(12);
  });

  it("refuse une phrase qu'il ne comprend pas plutôt que d'inventer", () => {
    expect(parseNaturalDate("plus tard", MERCREDI)).toBeNull();
    expect(parseNaturalDate("", MERCREDI)).toBeNull();
    expect(parseNaturalDate("quand tu peux", MERCREDI)).toBeNull();
  });
});

describe("rappels d'appareil", () => {
  const now = new Date(2026, 2, 11, 9, 0, 0, 0);

  it("écarte une entrée illisible sans perdre les autres", () => {
    const liste = parseReminders(
      JSON.stringify([
        { at: "2026-03-11T10:00:00.000Z", id: "a", title: "Valide" },
        { id: "sans-date", title: "Cassé" },
        { at: "2026-03-11T10:00:00.000Z", id: "c", title: "" },
      ])
    );
    expect(liste).toHaveLength(1);
    expect(liste[0]?.id).toBe("a");
  });

  it("ne notifie qu'une fois la même occurrence", () => {
    const reminder = createReminder({
      at: new Date(2026, 2, 11, 8, 59, 0, 0),
      title: "Relancer la veille",
    });
    expect(remindersToNotify([reminder], now)).toHaveLength(1);
    const apres = afterNotification(reminder, now);
    expect(remindersToNotify([apres], now)).toHaveLength(0);
  });

  it("avance un rappel quotidien au lendemain après notification", () => {
    const reminder = createReminder({
      at: new Date(2026, 2, 11, 8, 0, 0, 0),
      recurrence: "daily",
      title: "Chaque matin",
    });
    const apres = afterNotification(reminder, now);
    expect(new Date(apres.at).getDate()).toBe(12);
    // L'occurrence du 11 est bien celle qui était en cours.
    expect(currentOccurrence(reminder, now)?.getDate()).toBe(11);
  });

  it("ne réveille pas un rappel oublié depuis plus d'un jour", () => {
    const ancien = createReminder({
      at: new Date(2026, 2, 1, 9, 0, 0, 0),
      title: "Vieux rappel",
    });
    expect(remindersToNotify([ancien], now)).toHaveLength(0);
  });

  it("trie par heure puis par création", () => {
    const tard = createReminder({
      at: new Date(2026, 2, 12, 9, 0, 0, 0),
      title: "B",
    });
    const tot = createReminder({
      at: new Date(2026, 2, 11, 9, 0, 0, 0),
      title: "A",
    });
    expect(sortReminders([tard, tot]).map((r) => r.title)).toEqual(["A", "B"]);
  });

  it("renvoie l'occurrence courante d'un rappel unique", () => {
    const reminder = createReminder({
      at: new Date(2026, 2, 20, 9, 0, 0, 0),
      title: "Futur",
    });
    expect(currentOccurrence(reminder, now)).toBeNull();
    expect(nextOccurrence(reminder, now).getDate()).toBe(20);
  });

  it("formate un compte à rebours lisible", () => {
    expect(formatCountdown(new Date(now.getTime() + 5 * 60_000), now)).toBe(
      "dans 5 min"
    );
    expect(formatCountdown(new Date(now.getTime() + 3 * 3_600_000), now)).toBe(
      "dans 3 h"
    );
    expect(formatCountdown(new Date(now.getTime() + 86_400_000), now)).toBe(
      "demain"
    );
  });
});
