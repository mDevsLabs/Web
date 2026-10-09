import { readFileSync } from "node:fs";
import path from "node:path";
import { SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import { timingSafeCompare } from "@/lib/security/timing";
import { verifyMaiSessionToken } from "@/lib/site/session-auth";

const ROOT = path.resolve(import.meta.dirname, "..", "..");

function source(file: string): string {
  return readFileSync(path.join(ROOT, file), "utf8");
}

function codeOnly(file: string): string {
  return source(file)
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|\s)\/\/[^\n]*/g, " ");
}

describe("Sécurité — timingSafeCompare", () => {
  it("valide les chaînes strictement identiques", () => {
    expect(timingSafeCompare("mon_secret_123", "mon_secret_123")).toBe(true);
    expect(timingSafeCompare("", "")).toBe(true);
  });

  it("rejette les chaînes différentes de même longueur", () => {
    expect(timingSafeCompare("mon_secret_123", "mon_secret_124")).toBe(false);
  });

  it("rejette les chaînes de longueurs différentes sans lever d'exception", () => {
    expect(timingSafeCompare("court", "très_long_secret")).toBe(false);
    expect(timingSafeCompare("très_long_secret", "court")).toBe(false);
  });

  it("rejette les entrées nulles ou indéfinies sans planter", () => {
    expect(timingSafeCompare(null, "secret")).toBe(false);
    expect(timingSafeCompare("secret", null)).toBe(false);
    expect(timingSafeCompare(undefined, "secret")).toBe(false);
    expect(timingSafeCompare("secret", undefined)).toBe(false);
    expect(timingSafeCompare(null, null)).toBe(false);
    expect(timingSafeCompare(undefined, undefined)).toBe(false);
  });
});

describe("Sécurité — Expiration stricte des tokens JWT (session-auth)", () => {
  const secretKey = "test_super_secret_mai_jwt_32_bytes_len!";

  it("rejette un token dépourvu de claim d'expiration (exp)", async () => {
    process.env.MAI_JWT_SECRET = secretKey;
    const secret = new TextEncoder().encode(secretKey);

    // Token signé SANS exp
    const tokenWithoutExp = await new SignJWT({ sub: "user_123", tier: "Pro" })
      .setProtectedHeader({ alg: "HS256" })
      .sign(secret);

    const result = await verifyMaiSessionToken(tokenWithoutExp);
    expect(result).toBeNull();
  });

  it("rejette un token avec une date d'expiration passée", async () => {
    process.env.MAI_JWT_SECRET = secretKey;
    const secret = new TextEncoder().encode(secretKey);

    const expiredToken = await new SignJWT({ sub: "user_123", tier: "Pro" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(Math.floor(Date.now() / 1000) - 3600) // expiré depuis 1h
      .sign(secret);

    const result = await verifyMaiSessionToken(expiredToken);
    expect(result).toBeNull();
  });

  it("accepte un token valide avec expiration future", async () => {
    process.env.MAI_JWT_SECRET = secretKey;
    const secret = new TextEncoder().encode(secretKey);

    const validToken = await new SignJWT({ sub: "user_123", tier: "Plus" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(Math.floor(Date.now() / 1000) + 3600) // valide 1h
      .sign(secret);

    const result = await verifyMaiSessionToken(validToken);
    expect(result).not.toBeNull();
    expect(result?.userId).toBe("user_123");
    expect(result?.tier).toBe("Plus");
  });
});

describe("Sécurité — Isolation Proxy et contrôle d'accès", () => {
  it("ne déclare plus /mcp/ ni /coder/ dans isStaticRoute", () => {
    const proxyContent = codeOnly("proxy.ts");
    // Ne doit pas contenir de préfixes ouvrant les routes applicatives dynamiques
    expect(proxyContent).not.toContain('pathname.startsWith("/mcp/")');
    expect(proxyContent).not.toContain('pathname.startsWith("/coder/")');
  });

  it("autorise les crons et agents externes sans cookie de session", () => {
    const proxyContent = codeOnly("proxy.ts");
    expect(proxyContent).toContain('pathname.startsWith("/api/cron/")');
    expect(proxyContent).toContain('pathname.startsWith("/api/site/v1/")');
  });
});

describe("Sécurité — Paramétrage SQL (lib/projects/access.ts)", () => {
  it("n'utilise aucun sql.raw pour injecter les variantes d'identité", () => {
    const accessContent = codeOnly("lib/projects/access.ts");
    expect(accessContent).not.toContain("sql.raw");
  });
});

describe("Sécurité — Endpoint csp-report anti-DoS", () => {
  it("impose une limite de taille stricte sur le corps de requête", () => {
    const cspContent = codeOnly("app/api/security/csp-report/route.ts");
    expect(cspContent).toContain("MAX_CSP_REPORT_BYTES");
    expect(cspContent).toContain("413");
  });
});
