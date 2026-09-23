import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  redactArgument,
  sanitizeUrlForClient,
  toMcpServerDto,
} from "@/lib/mcp/dto";
import {
  decrypt,
  encrypt,
  isEncrypted,
  isEncryptionConfigured,
  reencrypt,
} from "@/lib/mcp/encryption";

const ENV_KEYS = [
  "MCP_ENCRYPTION_KEY",
  "MCP_ENCRYPTION_KEY_ID",
  "MCP_ENCRYPTION_PREVIOUS_KEYS",
  "MCP_ENCRYPTION_ALLOW_LEGACY_DERIVED_KEY",
  "DATABASE_URL",
  "POSTGRES_URL",
] as const;

let saved: Record<string, string | undefined> = {};

beforeEach(() => {
  saved = {};
  for (const key of ENV_KEYS) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = saved[key];
    }
  }
});

/** Reproduit le chiffrement « legacy » (base64 nu, clé = SHA-256 de DATABASE_URL). */
function legacyEncrypt(plain: string, material: string): string {
  const key = createHash("sha256").update(material, "utf8").digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), enc]).toString("base64");
}

describe("Chiffrement MCP — clé dédiée obligatoire", () => {
  it("chiffre et déchiffre en format versionné (keyId inclus)", () => {
    process.env.MCP_ENCRYPTION_KEY = "clé-de-test-1";
    const stored = encrypt("s3cr3t-token");
    expect(stored.startsWith("mai1.")).toBe(true);
    expect(stored.split(".")[1].length).toBeGreaterThan(0);
    expect(stored).not.toContain("s3cr3t-token");
    expect(decrypt(stored)).toBe("s3cr3t-token");
    expect(isEncrypted(stored)).toBe(true);
  });

  it("refuse de chiffrer SANS clé dédiée au lieu de dériver de DATABASE_URL", () => {
    // L'ancienne implémentation dérivait la clé de DATABASE_URL puis, à défaut,
    // d'une constante de développement codée en dur : les secrets étaient
    // déchiffrables par quiconque connaissait l'URL de la base.
    process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/mai";
    process.env.POSTGRES_URL = "postgres://user:pass@localhost:5432/mai";
    expect(isEncryptionConfigured()).toBe(false);
    expect(() => encrypt("secret")).toThrow(/MCP_ENCRYPTION_KEY/);
  });

  it("ne déchiffre plus une valeur legacy sans opt-in explicite", () => {
    const legacy = legacyEncrypt("ancien-secret", "postgres://prod:5432/mai");
    process.env.DATABASE_URL = "postgres://prod:5432/mai";
    process.env.MCP_ENCRYPTION_KEY = "clé-de-test-1";
    expect(decrypt(legacy)).toBe("");

    process.env.MCP_ENCRYPTION_ALLOW_LEGACY_DERIVED_KEY = "true";
    expect(decrypt(legacy)).toBe("ancien-secret");
  });

  it("ne déchiffre jamais une valeur avec la mauvaise clé", () => {
    process.env.MCP_ENCRYPTION_KEY = "clé-A";
    const stored = encrypt("valeur");
    process.env.MCP_ENCRYPTION_KEY = "clé-B";
    expect(decrypt(stored)).toBe("");
  });

  it("gère la rotation via le trousseau de clés précédentes", () => {
    process.env.MCP_ENCRYPTION_KEY = "clé-v1";
    process.env.MCP_ENCRYPTION_KEY_ID = "v1";
    const ancien = encrypt("jeton-à-migrer");
    expect(ancien.split(".")[1]).toBe("v1");

    // Rotation : nouvelle clé courante, ancienne clé conservée pour déchiffrer.
    process.env.MCP_ENCRYPTION_KEY = "clé-v2";
    process.env.MCP_ENCRYPTION_KEY_ID = "v2";
    process.env.MCP_ENCRYPTION_PREVIOUS_KEYS = JSON.stringify({ v1: "clé-v1" });

    expect(decrypt(ancien)).toBe("jeton-à-migrer");

    const migrated = reencrypt(ancien);
    expect(migrated.status).toBe("reencrypted");
    expect(migrated.value.split(".")[1]).toBe("v2");
    expect(decrypt(migrated.value)).toBe("jeton-à-migrer");
    expect(reencrypt(migrated.value).status).toBe("already_current");
  });

  it("signale une valeur indéchiffrable sans la remplacer", () => {
    process.env.MCP_ENCRYPTION_KEY = "clé-A";
    const legacy = legacyEncrypt("orphelin", "postgres://autre");
    expect(reencrypt(legacy)).toEqual({
      status: "undecryptable",
      value: legacy,
    });
  });
});

describe("DTO MCP — aucun secret ne sort de l'API", () => {
  const SECRET = "ghp_SUPER_SECRET_TOKEN_VALUE_1234567890";

  const row = {
    args: ["--token=" + SECRET, "--verbose"],
    authConfig: { token: SECRET, username: "bot" },
    authType: "bearer",
    avgLatencyMs: 12,
    callCount: 3,
    command: "npx",
    createdAt: new Date("2026-01-01T00:00:00Z"),
    description: "serveur de test",
    env: { GITHUB_TOKEN: SECRET, PLAIN: "ok" },
    headers: { Accept: "application/json", "X-Api-Key": SECRET },
    icon: "server",
    id: "6f1f2a3c-0000-4000-8000-000000000000",
    isEnabled: true,
    lastCallAt: null,
    lastSyncAt: null,
    name: "github",
    rateLimitPerMin: 60,
    requireApproval: "write_only",
    templateId: "github",
    timeoutMs: 15_000,
    toolOverrides: {},
    toolsCache: [],
    transport: "http",
    updatedAt: null,
    uptimeStatus: "online",
    url: `https://user:${SECRET}@mcp.example.com/rpc?token=${SECRET}&mode=json#access_token=${SECRET}`,
  };

  it("ne laisse passer aucune valeur secrète dans la sérialisation", () => {
    const dto = toMcpServerDto(row);
    const serialized = JSON.stringify(dto);
    expect(serialized).not.toContain(SECRET);
    expect(serialized).not.toContain("SUPER_SECRET");
    expect(serialized).not.toContain("ghp_");
    // Les valeurs utiles à l'UI restent présentes.
    expect(dto.name).toBe("github");
    expect(dto.transport).toBe("http");
    expect(dto.timeoutMs).toBe(15_000);
    expect(dto.toolOverrides).toEqual({});
    // Les colonnes sensibles sont présentes mais toujours vides.
    expect(dto.env).toEqual({});
    expect(dto.headers).toEqual({});
    expect(dto.authConfig).toEqual({});
  });

  it("expose seulement les NOMS de clés configurées", () => {
    const dto = toMcpServerDto(row);
    expect(dto.secretKeys).toEqual({
      auth: ["token", "username"],
      env: ["GITHUB_TOKEN", "PLAIN"],
      header: ["Accept", "X-Api-Key"],
    });
    expect(JSON.stringify(dto.secretKeys)).not.toContain(SECRET);
  });

  it("nettoie l'URL (identifiants et paramètres sensibles) et les arguments", () => {
    const dto = toMcpServerDto(row);
    expect(dto.url).not.toContain(SECRET);
    expect(dto.url).not.toContain("user:");
    expect(dto.url).toContain("token=***");
    expect(dto.args).toEqual(["--token=***", "--verbose"]);
    expect(redactArgument("--api-key=abcd1234")).toBe("--api-key=***");
    expect(redactArgument("Authorization:abcd1234")).toBe("Authorization:***");
    expect(redactArgument("--verbose")).toBe("--verbose");
  });

  it("écarte les entrées non conformes au lieu de les renvoyer brutes", () => {
    expect(toMcpServerDto({ env: "pas-un-objet", name: 42 }).env).toEqual({});
    expect(toMcpServerDto({ args: [1, null, "ok"] }).args).toEqual(["ok"]);
    expect(sanitizeUrlForClient("pas une url")).toBeNull();
    expect(sanitizeUrlForClient(null)).toBeNull();
  });
});
