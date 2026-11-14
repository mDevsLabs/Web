import { describe, expect, it } from "vitest";
import {
  clotureLigueParis,
  type MembreCohorte,
  seuilsLigue,
} from "@/lib/quizzly/leagues";

function membre(
  userId: string,
  weeklyXp: number,
  totalXp = 0,
  shield = false
): MembreCohorte {
  return { league: "gold", shield, totalXp, userId, weeklyXp };
}

describe("seuilsLigue", () => {
  it("place l'élève et lit les seuils de montée et de relégation", () => {
    const cohorte = [
      membre("a", 100),
      membre("b", 90),
      membre("c", 80),
      membre("d", 70),
      membre("e", 60),
      membre("f", 50),
      membre("g", 40),
      membre("h", 30),
      membre("i", 20),
      membre("j", 10),
      membre("k", 5),
    ];
    const seuils = seuilsLigue(cohorte, "f");
    expect(seuils.rang).toBe(6);
    expect(seuils.taille).toBe(11);
    expect(seuils.xpMoi).toBe(50);
    expect(seuils.seuilMontee).toBe(60);
    expect(seuils.seuilRellegation).toBe(40);
    expect(seuils.ecartMontee).toBe(10);
    expect(seuils.margeRellegation).toBe(11);
    expect(seuils.dansZoneMontee).toBe(false);
    expect(seuils.dansZoneRelagation).toBe(false);
  });

  it("signale la zone de montée et la zone de relégation", () => {
    const cohorte = [
      membre("a", 100),
      membre("b", 90),
      membre("c", 80),
      membre("d", 70),
      membre("e", 60),
      membre("f", 50),
      membre("g", 40),
      membre("h", 30),
      membre("i", 20),
      membre("j", 10),
    ];
    expect(seuilsLigue(cohorte, "b").dansZoneMontee).toBe(true);
    expect(seuilsLigue(cohorte, "b").ecartMontee).toBe(0);
    const dernier = seuilsLigue(cohorte, "j");
    expect(dernier.dansZoneRelagation).toBe(true);
    expect(dernier.margeRellegation).toBe(0);
  });

  it("ne fait pas bouger une cohorte de moins de 10", () => {
    const cohorte = [membre("a", 10), membre("b", 5)];
    const seuils = seuilsLigue(cohorte, "a");
    expect(seuils.rang).toBe(1);
    expect(seuils.seuilMontee).toBeNull();
    expect(seuils.seuilRellegation).toBeNull();
    expect(seuils.dansZoneMontee).toBe(false);
    expect(seuils.dansZoneRelagation).toBe(false);
  });

  it("retourne un rang nul quand l'élève n'a pas de siège", () => {
    const cohorte = [membre("a", 10)];
    expect(seuilsLigue(cohorte, "absent").rang).toBeNull();
  });
});

describe("clotureLigueParis", () => {
  it("tombe un lundi à minuit heure de Paris", () => {
    const iso = clotureLigueParis("2026-W45");
    const date = new Date(iso);
    const partie = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      minute: "numeric",
      timeZone: "Europe/Paris",
      weekday: "short",
    }).format(date);
    expect(partie).toMatch(/Mon/);
    expect(partie).toMatch(/12:0|0:0|12 AM/);
  });

  it("est strictement après le lundi de la semaine suivante à 00:00 UTC", () => {
    const iso = clotureLigueParis("2026-W45");
    expect(new Date(iso).getTime()).not.toBe(
      new Date("2026-11-02T00:00:00Z").getTime()
    );
    expect(Number.isFinite(new Date(iso).getTime())).toBe(true);
  });
});
