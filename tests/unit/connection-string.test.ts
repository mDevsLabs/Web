import { describe, expect, it } from "vitest";

import {
  resolveDatabaseUrl,
  sanitizeConnectionString,
} from "@/lib/db/connection-string";

describe("sanitizeConnectionString", () => {
  it("laisse une URL propre inchangée", () => {
    const url = "postgresql://user:pass@host.example/db?sslmode=require";
    expect(sanitizeConnectionString(url)).toBe(url);
  });

  it("retire les guillemets doubles englobants (cas dashboard Vercel)", () => {
    expect(
      sanitizeConnectionString(
        '"postgresql://user:pass@host.example/db?sslmode=require"'
      )
    ).toBe("postgresql://user:pass@host.example/db?sslmode=require");
  });

  it("retire les guillemets simples englobants", () => {
    expect(
      sanitizeConnectionString("'postgresql://user:pass@host.example/db'")
    ).toBe("postgresql://user:pass@host.example/db");
  });

  it("retire des guillemets doublés et les espaces autour", () => {
    expect(
      sanitizeConnectionString(
        '  ""postgresql://user:pass@host/db""  '
      )
    ).toBe("postgresql://user:pass@host/db");
  });

  it("ne touche pas aux guillemets internes (mots de passe encadrés)", () => {
    // Un mot de passe contenant un guillemet au milieu n'est pas altéré :
    // seules les paires englobantes début/fin sont retirées.
    expect(sanitizeConnectionString('postgres://us"er@host/db')).toBe(
      'postgres://us"er@host/db'
    );
  });
});

describe("resolveDatabaseUrl", () => {
  it("résout DATABASE_URL propre", () => {
    expect(
      resolveDatabaseUrl({ DATABASE_URL: "postgres://a@b/c" })
    ).toBe("postgres://a@b/c");
  });

  it("nettoie DATABASE_URL avec guillemets (cas Vercel des logs)", () => {
    expect(
      resolveDatabaseUrl({
        DATABASE_URL:
          '"postgresql://neondb_owner:secret@ep-old-fog-pooler.aws.neon.tech/neondb?sslmode=require"',
      })
    ).toBe(
      "postgresql://neondb_owner:secret@ep-old-fog-pooler.aws.neon.tech/neondb?sslmode=require"
    );
  });

  it("retombe sur POSTGRES_URL puis POSTGRES_PRISMA_URL", () => {
    expect(resolveDatabaseUrl({ POSTGRES_URL: "postgres://x@y/z" })).toBe(
      "postgres://x@y/z"
    );
    expect(
      resolveDatabaseUrl({ POSTGRES_PRISMA_URL: "postgres://p@q/r" })
    ).toBe("postgres://p@q/r");
  });

  it("renvoie null si aucune variable ou vide/guillemets seuls", () => {
    expect(resolveDatabaseUrl({})).toBeNull();
    expect(resolveDatabaseUrl({ DATABASE_URL: '""' })).toBeNull();
    expect(resolveDatabaseUrl({ DATABASE_URL: "   " })).toBeNull();
  });
});
