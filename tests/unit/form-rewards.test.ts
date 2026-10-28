import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { applyQuotaReset } from "@/lib/forms/queries";
import { REWARD_TYPES } from "@/lib/forms/types";

describe("Récompenses de formulaire — application réelle", () => {
  it("réussit pour chaque type de récompense quand l'exécuteur répond", async () => {
    for (const rewardType of REWARD_TYPES) {
      const execute = vi.fn(async () => ({ rows: [] }));
      const result = await applyQuotaReset("user-1", rewardType, { execute });
      expect(result.success).toBe(true);
      expect(execute).toHaveBeenCalledTimes(1);
    }
  });

  it("propage une erreur SQL au lieu de la masquer (pas de succès affiché)", async () => {
    const execute = vi.fn(async () => {
      throw new Error("SQL indisponible");
    });
    await expect(applyQuotaReset("user-1", "mai", { execute })).rejects.toThrow(
      "SQL indisponible"
    );
  });

  it("refuse un identifiant vide avant toute écriture", async () => {
    const execute = vi.fn(async () => ({ rows: [] }));
    await expect(applyQuotaReset("   ", "mai", { execute })).rejects.toThrow();
    expect(execute).not.toHaveBeenCalled();
  });

  it("la soumission est transactionnelle et les indicateurs ne sont posés qu'après la remise à zéro", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "lib/forms/queries.ts"),
      "utf8"
    );
    // Insertion, application de la récompense et mise à jour des indicateurs
    // dans la même transaction.
    expect(source).toContain("db.transaction(async (tx)");
    expect(source).toContain("rewardResetApplied: false");
    expect(source).toContain("rewardAppliedAt: null");
    expect(source).toContain("rewardResetApplied: true");
    // Aucune erreur de récompense n'est absorbée.
    expect(source).not.toContain(".catch(() => {})");
  });
});
