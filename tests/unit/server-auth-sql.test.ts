import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Non-régression : la table `users` porte `password_hash` (pas `password`) et
// n'a pas de colonne `updated_at`. Une requête qui s'y réfère échoue en 42703
// et se traduisait par « Impossible d'effectuer la connexion. ».

vi.mock("server-only", () => ({}));
vi.mock("@/lib/site/email", () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(true),
}));
vi.mock("@/lib/auth/verification", () => ({
  generateVerificationCode: vi.fn().mockResolvedValue("123456"),
  regenerateVerificationCode: vi.fn(),
  verifyVerificationCode: vi.fn().mockResolvedValue(true),
}));

const queries: string[] = [];
let nextRows: unknown[][] = [];

vi.mock("@/lib/db/queries/connection", () => ({
  dbReady: vi.fn().mockResolvedValue(undefined),
  getRawClient:
    () =>
    // Tag de gabarit : on reconstitue le SQL pour l'inspecter.
    (strings: TemplateStringsArray) => {
      queries.push(strings.join("?"));
      return Promise.resolve(nextRows.shift() ?? []);
    },
}));

import { loginUser, verifyRegisterUser } from "@/lib/auth/server-auth";

describe("server-auth : colonnes SQL de la table users", () => {
  beforeEach(() => {
    queries.length = 0;
    nextRows = [];
    process.env.MAI_JWT_SECRET = "test-secret-test-secret-test-secret-32";
  });

  it("loginUser lit password_hash et accepte le bon mot de passe", async () => {
    const hash = await bcrypt.hash("Secret123!", 4);
    nextRows = [
      [
        {
          email: "a@b.fr",
          id: "1",
          is_blocked: false,
          password_hash: hash,
          tier: "Free",
          username: "a",
        },
      ],
    ];
    const res = await loginUser({
      identifier: "a@b.fr",
      password: "Secret123!",
    });
    expect(res.success).toBe(true);
    const select = queries[0];
    expect(select).toContain("password_hash");
    expect(select).not.toMatch(/\bpassword\b(?!_hash)/);
  });

  it("loginUser refuse proprement un compte sans hash local", async () => {
    nextRows = [
      [{ email: "a@b.fr", id: "1", password_hash: null, username: "a" }],
    ];
    const res = await loginUser({ identifier: "a@b.fr", password: "x" });
    expect(res).toMatchObject({ code: "invalid_credentials", success: false });
  });

  it("l'inscription n'utilise ni `password` ni `updated_at`", async () => {
    nextRows = [[], [{ id: "42" }], []];
    const res = await verifyRegisterUser({
      code: "123456",
      email: "n@b.fr",
      password: "Secret123!Secret",
      username: "nouveau",
    });
    expect(res.success).toBe(true);
    const insert = queries.find((q) => q.includes("INSERT INTO users"));
    expect(insert).toBeDefined();
    expect(insert).toContain("password_hash");
    expect(insert).not.toContain("updated_at");
    expect(insert).not.toMatch(/\bpassword\b(?!_hash)/);
  });
});
