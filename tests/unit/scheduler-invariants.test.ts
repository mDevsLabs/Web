import { describe, expect, it } from "vitest";
import { SCHEDULE_MAX_ATTEMPTS, isWaitingRequestExpired } from "@/lib/agent/scheduler/engine";
import { nextOccurrenceFromRule } from "@/lib/agent/scheduler/occurrence";

// Invariants du scheduler testables SANS base : le calcul de la prochaine
// échéance (règle + fuseau IANA) et les bornes applicatives. Les invariants
// transactionnels (claim atomique, lien occurrence → run) restent couverts
// par les tests d'intégration conditionnels (AGENT_IT_DATABASE_URL).

describe("Scheduler — règle one-shot et bornes", () => {
  it("une règle « once » n'a pas de suite : l'exécution désactive le schedule", () => {
    const next = nextOccurrenceFromRule(
      { kind: "once" },
      "Europe/Paris",
      new Date("2026-09-14T10:00:00Z")
    );
    // null = pas de nextDueAt : le moteur appelle alors deactivateScheduleAfterRun
    // (status paused) au lieu de réécrire une échéance passée inchangée.
    expect(next).toBeNull();
  });

  it("une règle daily calcule la prochaine occurrence dans le fuseau IANA", () => {
    const next = nextOccurrenceFromRule(
      { frequency: "daily", kind: "recurring", time: "09:00" },
      "Europe/Paris",
      new Date("2026-09-14T10:00:00Z")
    );
    expect(next).not.toBeNull();
    expect(next!.getTime()).toBeGreaterThan(
      new Date("2026-09-14T10:00:00Z").getTime()
    );
  });

  it("SCHEDULE_MAX_ATTEMPTS borne les tentatives (claim incrémenté en base)", () => {
    expect(SCHEDULE_MAX_ATTEMPTS).toBeGreaterThan(0);
  });

  it("ne réévalue pas une attente de cinq minutes et expire la demande à 24 heures", () => {
    const started = new Date("2026-09-20T10:00:00Z");
    const expiresAt = new Date(started.getTime() + 24 * 60 * 60 * 1000);
    expect(isWaitingRequestExpired({ runStatus: "waiting_for_user", expiresAt, now: new Date(started.getTime() + 6 * 60 * 1000) })).toBe(false);
    expect(isWaitingRequestExpired({ runStatus: "waiting_for_user", expiresAt, now: expiresAt })).toBe(true);
    expect(isWaitingRequestExpired({ runStatus: "running", expiresAt, now: expiresAt })).toBe(false);
  });
});
