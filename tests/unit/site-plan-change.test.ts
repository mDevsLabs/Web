import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const sendVerificationEmailMock = vi.fn().mockResolvedValue(true);
vi.mock("@/lib/site/email", () => ({
  sendVerificationEmail: (...args: unknown[]) =>
    sendVerificationEmailMock(...args),
}));

vi.mock("@/lib/auth/verification", () => ({
  generateVerificationCode: vi.fn(),
  regenerateVerificationCode: vi.fn(),
  verifyVerificationCode: vi.fn(),
}));

const queries: string[] = [];
let nextRows: unknown[][] = [];

vi.mock("@/lib/db/queries/connection", () => ({
  dbReady: vi.fn().mockResolvedValue(undefined),
  getRawClient: () => (strings: TemplateStringsArray) => {
    queries.push(strings.join("?"));
    return Promise.resolve(nextRows.shift() ?? []);
  },
}));

import {
  downgradeUserToFree,
  redeemUpgradeCodeForUser,
} from "@/lib/auth/server-auth";

describe("changements de forfait Neon (redeemUpgradeCodeForUser & downgradeUserToFree)", () => {
  const prevPlus = process.env.MAI_PLUS_CODE;
  const prevPro = process.env.MAI_PRO_CODE;
  const prevMax = process.env.MAI_MAX_CODE;

  beforeEach(() => {
    queries.length = 0;
    nextRows = [];
    sendVerificationEmailMock.mockClear();
    process.env.MAI_JWT_SECRET = "test-secret-test-secret-test-secret-32";
    process.env.MAI_PLUS_CODE = "";
    process.env.MAI_PRO_CODE = "";
    process.env.MAI_MAX_CODE = "";
  });

  afterEach(() => {
    process.env.MAI_PLUS_CODE = prevPlus;
    process.env.MAI_PRO_CODE = prevPro;
    process.env.MAI_MAX_CODE = prevMax;
    vi.restoreAllMocks();
  });

  it("active un code depuis subscription_codes et met à jour users.tier atomiquement", async () => {
    nextRows = [
      // 1. SELECT subscription_codes
      [
        {
          code: "MAI-PRO-ABC123",
          expires_at: null,
          id: 7,
          is_active: true,
          max_uses: 5,
          tier: "Pro",
          uses_count: 1,
        },
      ],
      // 2. SELECT subscription_code_redemptions
      [],
      // 3. UPDATE subscription_codes RETURNING id
      [{ id: 7 }],
      // 4. UPDATE users RETURNING id, email, username, phone, avatar_url
      [
        {
          avatar_url: null,
          email: "alice@example.com",
          id: "42",
          phone: "",
          username: "alice",
        },
      ],
      // 5. INSERT subscription_code_redemptions
      [],
      // 6. UPDATE mprojects_api_keys
      [],
    ];

    const res = await redeemUpgradeCodeForUser({
      code: "mai-pro-abc123",
      email: "alice@example.com",
      userId: "42",
    });

    expect(res.success).toBe(true);
    if (!res.success) {
      throw new Error(res.error);
    }
    expect(res.tier).toBe("Pro");
    expect(res.token).toBeTruthy();
    expect(queries.some((q) => q.includes("UPDATE subscription_codes"))).toBe(
      true
    );
    expect(queries.some((q) => q.includes("UPDATE users"))).toBe(true);
    expect(
      queries.some((q) =>
        q.includes("INSERT INTO subscription_code_redemptions")
      )
    ).toBe(true);
    expect(sendVerificationEmailMock).toHaveBeenCalledWith(
      "alice@example.com",
      "",
      "subscription_unlocked",
      { tier: "Pro", username: "alice" }
    );
  });

  it("refuse un code expiré, désactivé ou déjà utilisé par le compte", async () => {
    nextRows = [
      [
        {
          code: "OLD-CODE",
          expires_at: "2020-01-01T00:00:00.000Z",
          id: 9,
          is_active: true,
          max_uses: 1,
          tier: "Plus",
          uses_count: 0,
        },
      ],
    ];
    const expired = await redeemUpgradeCodeForUser({
      code: "OLD-CODE",
      userId: "42",
    });
    expect(expired.success).toBe(false);
    if (expired.success) {
      throw new Error("échec attendu");
    }
    expect(expired.error).toContain("expiré");

    nextRows = [
      [
        {
          code: "USED-CODE",
          expires_at: null,
          id: 10,
          is_active: true,
          max_uses: 5,
          tier: "Max",
          uses_count: 1,
        },
      ],
      [{ id: 1 }],
    ];
    const alreadyUsed = await redeemUpgradeCodeForUser({
      code: "USED-CODE",
      userId: "42",
    });
    expect(alreadyUsed.success).toBe(false);
    if (alreadyUsed.success) {
      throw new Error("échec attendu");
    }
    expect(alreadyUsed.error).toContain("déjà débloqué");
  });

  it("bascule sur les codes d'environnement si absent de subscription_codes", async () => {
    process.env.MAI_PRO_CODE = "ENV-PRO-999";
    nextRows = [
      // 1. SELECT subscription_codes -> vide
      [],
      // 2. UPDATE users
      [
        {
          avatar_url: null,
          email: "bob@example.com",
          id: "99",
          phone: "",
          username: "bob",
        },
      ],
      // 3. UPDATE mprojects_api_keys
      [],
    ];

    const res = await redeemUpgradeCodeForUser({
      code: "env-pro-999",
      email: "bob@example.com",
      userId: "99",
    });

    expect(res.success).toBe(true);
    if (!res.success) {
      throw new Error(res.error);
    }
    expect(res.tier).toBe("Pro");
    expect(res.token).toBeTruthy();
  });

  it("repasse au forfait Free sans code et rafraîchit le jeton JWT", async () => {
    nextRows = [
      [
        {
          avatar_url: null,
          email: "alice@example.com",
          id: "42",
          phone: "",
          username: "alice",
        },
      ],
      [],
    ];

    const res = await downgradeUserToFree({
      email: "alice@example.com",
      userId: "42",
    });

    expect(res.success).toBe(true);
    if (!res.success) {
      throw new Error(res.error);
    }
    expect(res.tier).toBe("Free");
    expect(res.token).toBeTruthy();
    expect(queries.some((q) => q.includes("UPDATE users"))).toBe(true);
    expect(sendVerificationEmailMock).not.toHaveBeenCalled();
  });
});
