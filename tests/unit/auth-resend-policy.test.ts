import { describe, expect, it } from "vitest";
import { decideResend, normalizeResendAction } from "../../auth-resend-policy";

describe("Politique de renvoi des codes de vérification", () => {
  const now = Date.UTC(2026, 9, 28, 12, 0, 0);

  it("n'autorise que les actions de connexion et d'inscription", () => {
    expect(normalizeResendAction("login")).toBe("login");
    expect(normalizeResendAction(" REGISTER ")).toBe("register");
    expect(normalizeResendAction("delete_account")).toBeNull();
    expect(normalizeResendAction("verify_new_email")).toBeNull();
    expect(normalizeResendAction("")).toBeNull();
    expect(normalizeResendAction(null)).toBeNull();
  });

  it("refuse un renvoi sans demande initiale : aucun code arbitraire n'est créé", () => {
    expect(decideResend(null, 5, now)).toEqual({
      allowed: false,
      reason: "no_pending_request",
    });
  });

  it("refuse une demande expirée", () => {
    expect(decideResend({ attempts: 0, expiresAt: now - 1 }, 5, now)).toEqual({
      allowed: false,
      reason: "no_pending_request",
    });
  });

  it("refuse une demande déjà verrouillée par trop d'essais", () => {
    expect(
      decideResend({ attempts: 5, expiresAt: now + 60_000 }, 5, now)
    ).toEqual({ allowed: false, reason: "too_many_attempts" });
  });

  it("autorise le renvoi d'une demande vivante sans remettre les essais à zéro", () => {
    expect(
      decideResend({ attempts: 3, expiresAt: now + 60_000 }, 5, now)
    ).toEqual({ allowed: true, nextAttempts: 3 });
  });
});
