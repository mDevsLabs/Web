import { beforeEach, describe, expect, it, vi } from "vitest";
import { isWakiesEligible } from "@/lib/auth/plan";
import {
  canAccessWakies,
  getWakiesQuota,
  getWakiesQuotas,
} from "@/lib/plans/tier-limits";

vi.mock("@/lib/auth/session", () => ({
  getMaiUser: vi.fn(),
}));

describe("contrôle d'accès à Wakies", { timeout: 20_000 }, () => {
  describe("fonctions de forfait (isWakiesEligible / canAccessWakies)", () => {
    it("refuse le forfait Free et ses alias", () => {
      expect(isWakiesEligible("free")).toBe(false);
      expect(isWakiesEligible("gratuit")).toBe(false);
      expect(isWakiesEligible("Free")).toBe(false);
      expect(isWakiesEligible(null)).toBe(false);
      expect(isWakiesEligible(undefined)).toBe(false);

      expect(canAccessWakies("free")).toBe(false);
      expect(canAccessWakies("gratuit")).toBe(false);
      expect(canAccessWakies("Free")).toBe(false);
      expect(canAccessWakies(null)).toBe(false);
      expect(canAccessWakies(undefined)).toBe(false);
    });

    it("autorise les forfaits payants Plus, Pro et Max", () => {
      expect(isWakiesEligible("plus")).toBe(true);
      expect(isWakiesEligible("Plus")).toBe(true);
      expect(isWakiesEligible("pro")).toBe(true);
      expect(isWakiesEligible("Pro")).toBe(true);
      expect(isWakiesEligible("max")).toBe(true);
      expect(isWakiesEligible("Max")).toBe(true);

      expect(canAccessWakies("plus")).toBe(true);
      expect(canAccessWakies("pro")).toBe(true);
      expect(canAccessWakies("max")).toBe(true);
    });
  });

  describe("quotas Wakies par forfait", () => {
    it("met tous les quotas Wakies à zéro pour Free", () => {
      const quotas = getWakiesQuotas("free");
      expect(quotas.conversations).toBe(0);
      expect(quotas.memories).toBe(0);
      expect(quotas.pages).toBe(0);
      expect(quotas.spaces).toBe(0);
      expect(quotas.tasks).toBe(0);
      expect(quotas.wakies).toBe(0);
    });

    it("accorde des quotas non nuls aux forfaits payants", () => {
      const plusQuotas = getWakiesQuotas("plus");
      expect(plusQuotas.spaces).toBe(8);
      expect(plusQuotas.wakies).toBe(6);

      const proQuotas = getWakiesQuotas("pro");
      expect(proQuotas.spaces).toBe(20);
      expect(proQuotas.wakies).toBe(12);

      const maxQuotas = getWakiesQuotas("max");
      expect(maxQuotas.spaces).toBeNull();
      expect(maxQuotas.wakies).toBeNull();
    });
  });

  describe("requireWakiesUser", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("renvoie une erreur 401 si aucun utilisateur n'est connecté", async () => {
      const { getMaiUser } = await import("@/lib/auth/session");
      (getMaiUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const { requireWakiesUser } = await import("@/lib/wakies/http");
      const res = await requireWakiesUser();

      expect(res instanceof Response).toBe(true);
      if (res instanceof Response) {
        expect(res.status).toBe(401);
        const data = await res.json();
        expect(data.code).toBe("auth_required");
      }
    });

    it("renvoie une erreur 403 plan_required si l'utilisateur est sur le forfait Free", async () => {
      const { getMaiUser } = await import("@/lib/auth/session");
      (getMaiUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        email: "free@example.com",
        id: "u-free",
        tier: "Free",
      });

      const { requireWakiesUser } = await import("@/lib/wakies/http");
      const res = await requireWakiesUser();

      expect(res instanceof Response).toBe(true);
      if (res instanceof Response) {
        expect(res.status).toBe(403);
        const data = await res.json();
        expect(data.code).toBe("plan_required");
        expect(data.details?.upgradeUrl).toBeDefined();
      }
    });

    it("permet l'accès pour un utilisateur Plus", async () => {
      const { getMaiUser } = await import("@/lib/auth/session");
      (getMaiUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        email: "plus@example.com",
        id: "u-plus",
        tier: "Plus",
      });

      const { requireWakiesUser } = await import("@/lib/wakies/http");
      const identite = await requireWakiesUser();

      expect(identite instanceof Response).toBe(false);
      if (!(identite instanceof Response)) {
        expect(identite.tier).toBe("plus");
        expect(identite.userId).toBe("u-plus");
      }
    });

    it("permet l'accès pour un utilisateur Pro et Max", async () => {
      const { getMaiUser } = await import("@/lib/auth/session");
      const { requireWakiesUser } = await import("@/lib/wakies/http");

      (getMaiUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        email: "pro@example.com",
        id: "u-pro",
        tier: "Pro",
      });
      const proIdentite = await requireWakiesUser();
      expect(proIdentite instanceof Response).toBe(false);
      if (!(proIdentite instanceof Response)) {
        expect(proIdentite.tier).toBe("pro");
      }

      (getMaiUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        email: "max@example.com",
        id: "u-max",
        tier: "Max",
      });
      const maxIdentite = await requireWakiesUser();
      expect(maxIdentite instanceof Response).toBe(false);
      if (!(maxIdentite instanceof Response)) {
        expect(maxIdentite.tier).toBe("max");
      }
    });
  });
});
