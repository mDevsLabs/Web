import { createHash, randomBytes } from "node:crypto";
import { tool } from "ai";
import { z } from "zod";
import { jwtDecode, jwtVerifyHmac } from "@/lib/ai/crypto-helpers";

const ALGORITHMS = ["sha256", "sha384", "sha512"] as const;

// Boîte à outils développeur sécurisée : hashage, bcrypt, JWT, secrets,
// test de regex et formatage SQL. Opérations locales (pas d'appel réseau).
export const cryptoTools = tool({
  description:
    "Boîte à outils développeur : hashage SHA-256/384/512, hachage et comparaison de mots de passe bcrypt, décodage et vérification de JWT, génération de secrets aléatoires (hex/base64), test d'expressions régulières avec matchs détaillés et formatage de requêtes SQL. Utiliser pour toute demande de hash, token, secret, regex ou SQL à formater.",
  execute: async (input) => {
    switch (input.operation) {
      case "hash": {
        if (!input.text) {
          return { error: "Paramètre 'text' requis pour un hash." };
        }
        const algo = input.algorithm ?? "sha256";
        const digest = createHash(algo)
          .update(input.text, "utf-8")
          .digest("hex");
        return {
          algorithm: algo,
          hash: digest,
          length: digest.length,
          note: "Hash unidirectionnel — impossible à inverser.",
        };
      }

      case "bcrypt_hash": {
        if (!input.text) {
          return { error: "Paramètre 'text' requis pour un hash bcrypt." };
        }
        const bcrypt = await import("bcryptjs");
        const rounds = Math.min(Math.max(input.rounds ?? 10, 4), 15);
        const hash = await bcrypt.hash(input.text, rounds);
        return {
          hash,
          rounds,
          verified: await bcrypt.compare(input.text, hash),
        };
      }

      case "bcrypt_compare": {
        if (!input.text || !input.hash) {
          return {
            error: "Paramètres 'text' et 'hash' requis pour bcrypt.compare.",
          };
        }
        const bcrypt = await import("bcryptjs");
        const match = await bcrypt.compare(input.text, input.hash);
        return { hash: `${input.hash.slice(0, 12)}…`, match };
      }

      case "jwt_decode": {
        if (!input.token) {
          return { error: "Paramètre 'token' (JWT) requis." };
        }
        const decoded = jwtDecode(input.token);
        if (!decoded) {
          return { error: "JWT invalide : en-tête ou charge utile illisible." };
        }
        return {
          expired: decoded.payload?.exp
            ? Date.now() / 1000 > Number(decoded.payload.exp)
            : null,
          header: decoded.header,
          payload: decoded.payload,
          signaturePresent: Boolean(input.token.split(".")[2]),
          warning:
            "Décodage sans vérification de signature — n'utilise jamais ces informations sans vérifier le token.",
        };
      }

      case "jwt_verify": {
        if (!input.token || !input.secret) {
          return {
            error:
              "Paramètres 'token' et 'secret' requis pour la vérification HMAC (HS256/384/512).",
          };
        }
        const result = await jwtVerifyHmac(input.token, input.secret);
        if (result.valid) {
          return { payload: result.payload, valid: true };
        }
        return { error: result.error, valid: false };
      }

      case "generate_secret": {
        const bytes = Math.min(Math.max(input.bytes ?? 32, 8), 128);
        const encoding = input.encoding ?? "hex";
        const raw = randomBytes(bytes);
        const secret =
          encoding === "base64"
            ? raw.toString("base64")
            : encoding === "base64url"
              ? raw.toString("base64url")
              : raw.toString("hex");
        return {
          bytes,
          encoding,
          entropyBits: bytes * 8,
          secret,
        };
      }

      case "regex_test": {
        if (!input.pattern) {
          return { error: "Paramètre 'pattern' requis." };
        }
        if (!input.text) {
          return { error: "Paramètre 'text' requis pour tester la regex." };
        }
        let regex: RegExp;
        try {
          regex = new RegExp(input.pattern, input.flags ?? "g");
        } catch (e: any) {
          return { error: `Regex invalide : ${e.message}` };
        }
        if (regex.global || regex.sticky) {
          regex.lastIndex = 0;
        }
        const matches: Array<
          | {
              end: number;
              groups: Record<string, string>;
              index: number;
              match: string;
            }
          | string
        > = [];
        let guard = 0;
        if (regex.global) {
          let m: RegExpExecArray | null;
          while ((m = regex.exec(input.text)) !== null) {
            matches.push({
              end: m.index + m[0].length,
              groups: (m.groups as Record<string, string>) ?? {},
              index: m.index,
              match: m[0],
            });
            if (m[0] === "") {
              regex.lastIndex += 1;
            }
            if (++guard > 500) {
              break;
            }
          }
        } else {
          const m = regex.exec(input.text);
          if (m) {
            matches.push({
              end: m.index + m[0].length,
              groups: (m.groups as Record<string, string>) ?? {},
              index: m.index,
              match: m[0],
            });
          }
        }
        return {
          flags: input.flags ?? "g",
          matchCount: matches.length,
          matches,
          pattern: input.pattern,
        };
      }

      case "sql_format": {
        if (!input.sql) {
          return { error: "Paramètre 'sql' requis." };
        }
        const { format } = await import("sql-formatter");
        const formatted = format(input.sql, {
          keywordCase: input.sqlKeywordCase ?? "upper",
          language: (input.sqlDialect as any) ?? "postgresql",
          tabWidth: 2,
        });
        return { formatted, language: input.sqlDialect ?? "postgresql" };
      }

      default:
        return { error: "Opération inconnue." };
    }
  },
  inputSchema: z.object({
    algorithm: z
      .enum(ALGORITHMS)
      .optional()
      .describe("Algorithme de hash (opération 'hash', défaut sha256)."),
    bytes: z
      .number()
      .int()
      .optional()
      .describe(
        "Taille en octets du secret (opération 'generate_secret', défaut 32)."
      ),
    encoding: z
      .enum(["hex", "base64", "base64url"])
      .optional()
      .describe("Encodage du secret (défaut hex)."),
    flags: z
      .string()
      .max(6)
      .optional()
      .describe("Flags de la regex (défaut 'g')."),
    hash: z
      .string()
      .max(200)
      .optional()
      .describe("Hash bcrypt à comparer (opération 'bcrypt_compare')."),
    operation: z
      .enum([
        "hash",
        "bcrypt_hash",
        "bcrypt_compare",
        "jwt_decode",
        "jwt_verify",
        "generate_secret",
        "regex_test",
        "sql_format",
      ])
      .describe("Opération à exécuter."),
    pattern: z
      .string()
      .max(2000)
      .optional()
      .describe("Expression régulière (opération 'regex_test')."),
    rounds: z
      .number()
      .int()
      .optional()
      .describe("Coût bcrypt entre 4 et 15 (défaut 10)."),
    secret: z
      .string()
      .max(500)
      .optional()
      .describe("Secret HMAC pour vérifier le JWT (opération 'jwt_verify')."),
    sql: z
      .string()
      .max(20_000)
      .optional()
      .describe("Requête SQL à formater (opération 'sql_format')."),
    sqlDialect: z
      .enum([
        "postgresql",
        "mysql",
        "sqlite",
        "mariadb",
        "bigquery",
        "transactsql",
      ])
      .optional()
      .describe("Dialecte SQL (défaut postgresql)."),
    sqlKeywordCase: z.enum(["upper", "lower", "preserve"]).optional(),
    text: z
      .string()
      .max(20_000)
      .optional()
      .describe(
        "Texte à hacher (hash/bcrypt) ou dans lequel chercher (regex_test)."
      ),
    token: z
      .string()
      .max(8000)
      .optional()
      .describe("JWT à décoder ou vérifier (opérations jwt_*)."),
  }),
});
