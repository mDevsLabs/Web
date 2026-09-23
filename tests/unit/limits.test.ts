import { describe, expect, it } from "vitest";
import {
  type DurationCheckpoint,
  emptyDurationCheckpoint,
  evaluateDurationLimit,
  systemClock,
} from "@/lib/agent/limits";
import { tierRunLimit } from "@/lib/plans/tier-capabilities";

describe("Limites de durée par forfait", () => {
  it("applique 1 h à Plus, 3 h à Pro, aucune limite à Max", () => {
    expect(tierRunLimit("plus").limitMs).toBe(60 * 60 * 1000);
    expect(tierRunLimit("pro").limitMs).toBe(3 * 60 * 60 * 1000);
    expect(tierRunLimit("max").limitMs).toBeNull();
    expect(tierRunLimit("free").limitMs).not.toBeNull();
  });

  it("déclare la limite atteinte quand l'activité cumulée dépasse le plafond", () => {
    let now = 1_000_000;
    const clock = { now: () => now };
    const checkpoint: DurationCheckpoint = {
      activeMs: 59 * 60 * 1000,
      activeSince: now,
    };
    now += 2 * 60 * 1000;
    const decision = evaluateDurationLimit({
      checkpoint,
      clock,
      tier: "plus",
    });
    expect(decision.exceeded).toBe(true);
    expect(decision.remainingMs).toBe(0);
  });

  it("laisse du budget quand l'activité reste sous la limite", () => {
    const checkpoint: DurationCheckpoint = {
      activeMs: 30 * 60 * 1000,
      activeSince: null,
    };
    const decision = evaluateDurationLimit({
      checkpoint,
      clock: systemClock(),
      tier: "plus",
    });
    expect(decision.exceeded).toBe(false);
    expect(decision.remainingMs).toBe(30 * 60 * 1000);
  });

  it("ne dépasse jamais pour Max (limite nulle)", () => {
    const decision = evaluateDurationLimit({
      checkpoint: emptyDurationCheckpoint(),
      clock: { now: () => Number.MAX_SAFE_INTEGER },
      tier: "max",
    });
    expect(decision.exceeded).toBe(false);
    expect(decision.limitMs).toBeNull();
    expect(decision.remainingMs).toBeNull();
  });

  it("ne compte pas le temps d'inactivité entre deux tranches actives", () => {
    // 45 min actives hier, tranche fermée (activeSince=null), 45 min actives
    // aujourd'hui : 1 h 30 > 1 h → dépassé ; mais 30 min + 20 min non.
    const first: DurationCheckpoint = {
      activeMs: 30 * 60 * 1000,
      activeSince: null,
    };
    const decision = evaluateDurationLimit({ checkpoint: first, tier: "plus" });
    expect(decision.exceeded).toBe(false);
    const second: DurationCheckpoint = {
      activeMs: 20 * 60 * 1000,
      activeSince: null,
    };
    const decision2 = evaluateDurationLimit({
      checkpoint: second,
      tier: "plus",
    });
    expect(decision2.exceeded).toBe(false);
  });
});
