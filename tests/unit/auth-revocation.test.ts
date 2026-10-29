import { describe, expect, it } from "vitest";
import {
  decideRevocationState,
  evaluateRevocationProbes,
} from "../../auth-revocation";

describe("Révocation JWT backend — décision entre deux autorités", () => {
  it("refuse dès qu'une autorité dit « révoqué », même si l'autre est muette", () => {
    expect(decideRevocationState(["revoked", "active"])).toBe("revoked");
    expect(decideRevocationState(["active", "revoked"])).toBe("revoked");
    expect(decideRevocationState(["revoked", "unavailable"])).toBe("revoked");
    expect(decideRevocationState(["unavailable", "revoked"])).toBe("revoked");
  });

  it("considère l'état inconnu si une seule autorité est indisponible", () => {
    expect(decideRevocationState(["active", "unavailable"])).toBe("unknown");
    expect(decideRevocationState(["unavailable", "active"])).toBe("unknown");
  });

  it("refuse temporairement si les deux autorités sont indisponibles", () => {
    expect(decideRevocationState(["unavailable", "unavailable"])).toBe(
      "unknown"
    );
  });

  it("confirme le jeton actif seulement si toutes les autorités ont répondu", () => {
    expect(decideRevocationState(["active", "active"])).toBe("active");
  });

  it("une exception de sonde compte comme indisponibilité, jamais comme « actif »", async () => {
    const state = await evaluateRevocationProbes([
      async () => "active",
      async () => {
        throw new Error("SQL indisponible");
      },
    ]);
    expect(state).toBe("unknown");
  });

  it("revient à « actif » quand le service répond de nouveau", async () => {
    let sqliteUp = false;
    const probe = async (up: () => boolean) =>
      up() ? ("active" as const) : Promise.reject(new Error("down"));

    expect(await evaluateRevocationProbes([() => probe(() => sqliteUp)])).toBe(
      "unknown"
    );
    sqliteUp = true;
    expect(await evaluateRevocationProbes([() => probe(() => sqliteUp)])).toBe(
      "active"
    );
  });

  it("un jeton explicitement révoqué le reste si l'autre source tombe", async () => {
    const state = await evaluateRevocationProbes([
      async () => "revoked",
      async () => {
        throw new Error("down");
      },
    ]);
    expect(state).toBe("revoked");
  });
});
