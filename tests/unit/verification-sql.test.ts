import { beforeEach, describe, expect, it, vi } from "vitest";

// Non-régression : le client `postgres` retourné par `getRawClient()` est
// partagé avec `drizzle(client)`, qui altère la sérialisation des objets
// `Date`. Passer une instance `Date` brute dans un gabarit SQL lève
// `TypeError [ERR_INVALID_ARG_TYPE]` au runtime et fait échouer la connexion.

vi.mock("server-only", () => ({}));

const recordedParams: unknown[][] = [];
let nextRows: unknown[][] = [];

vi.mock("@/lib/db/queries/connection", () => ({
  dbReady: vi.fn().mockResolvedValue(undefined),
  getRawClient:
    () =>
    (_strings: TemplateStringsArray, ...values: unknown[]) => {
      recordedParams.push(values);
      return Promise.resolve(nextRows.shift() ?? []);
    },
}));

import {
  generateVerificationCode,
  regenerateVerificationCode,
  verifyVerificationCode,
} from "@/lib/auth/verification";

function assertNoRawDateParam() {
  for (const params of recordedParams) {
    for (const value of params) {
      expect(value).not.toBeInstanceOf(Date);
    }
  }
}

describe("verification : pas d'instance Date brute dans getRawClient()", () => {
  beforeEach(() => {
    recordedParams.length = 0;
    nextRows = [];
  });

  it("generateVerificationCode sérialise expires_at en chaîne ISO", async () => {
    const code = await generateVerificationCode("a@b.fr", "login");
    expect(code).toMatch(/^\d{6}$/);
    expect(recordedParams.length).toBe(1);
    assertNoRawDateParam();
  });

  it("regenerateVerificationCode sérialise expires_at en chaîne ISO", async () => {
    nextRows = [
      [{ attempts: 0, expires_at: new Date(Date.now() + 300_000) }],
      [{ email: "a@b.fr" }],
    ];
    const res = await regenerateVerificationCode("a@b.fr", "login");
    expect(res?.code).toMatch(/^\d{6}$/);
    assertNoRawDateParam();
  });

  it("verifyVerificationCode sérialise now en chaîne ISO", async () => {
    nextRows = [[], [{ attempts: 1 }]];
    const ok = await verifyVerificationCode("a@b.fr", "000000", "login");
    expect(ok).toBe(false);
    assertNoRawDateParam();
  });
});
