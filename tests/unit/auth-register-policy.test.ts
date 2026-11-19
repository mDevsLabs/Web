// Issue #9 — la politique de mot de passe doit être appliquée par le handler
// Hono d'inscription (et ses alias), pas seulement par le parcours Next.
//
// Les fichiers racine tournent sur Val Town (imports `npm:`) : le test charge
// `auth.ts` par transpilation + bac à sable (même technique que
// `backend-root-audit.test.ts`) et appelle RÉELLEMENT les handlers enregistrés
// sur chaque alias, avec des stubs pour la base, l'e-mail et les jetons.
import { readFileSync } from "node:fs";
import path from "node:path";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { describe, expect, it, vi } from "vitest";
import {
  checkPasswordPolicy,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "@/auth-password-policy";

const ROOT = path.resolve(import.meta.dirname, "..", "..");

type Handler = (
  c: unknown
) => Promise<{ body: Record<string, unknown>; status: number }>;

type RegisterMulti = (
  method: string,
  paths: string[],
  handler: Handler
) => void;

function transpile(file: string): string {
  const text = readFileSync(path.join(ROOT, file), "utf8");
  const { outputText, diagnostics } = ts.transpileModule(text, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: file,
    reportDiagnostics: true,
  });
  expect(diagnostics).toEqual([]);
  return outputText;
}

function loadModule(
  file: string,
  stubs: Record<string, unknown>
): Record<string, unknown> {
  const exports: Record<string, unknown> = {};
  runInNewContext(transpile(file), {
    console: { error: vi.fn(), warn: vi.fn() },
    Date,
    exports,
    require: (name: string) => {
      if (name === "./auth-password-policy.ts") {
        const policyExports: Record<string, unknown> = {};
        runInNewContext(transpile("auth-password-policy.ts"), {
          exports: policyExports,
          require: () => {
            throw new Error("Aucune dépendance attendue.");
          },
        });
        return policyExports;
      }
      if (!Object.hasOwn(stubs, name)) {
        throw new Error(`Dépendance non stubée : ${name}`);
      }
      return stubs[name];
    },
  });
  return exports;
}

function makeContext(payload: unknown) {
  return {
    json: (body: Record<string, unknown>, status = 200) => ({ body, status }),
    req: {
      header: () => "",
      json: async () => payload,
    },
  };
}

const sql = async (strings: TemplateStringsArray, ...values: unknown[]) => {
  const text = strings.join("?");
  void values;
  if (text.includes("SELECT id, email, username, password_hash")) {
    return [
      {
        email: "testeur@x.fr",
        id: "u1",
        is_blocked: false,
        password_hash: "h",
        tier: "Free",
        username: "testeur",
      },
    ];
  }
  if (text.includes("require_login_verification")) {
    return [{ flag: false }];
  }
  if (text.includes("SELECT email, password_hash FROM users")) {
    return [{ email: "testeur@x.fr", password_hash: "h" }];
  }
  if (text.includes("INSERT INTO users")) {
    return [{ id: "u1", tier: "Free" }];
  }
  return [];
};

function buildHandlers() {
  const routes = new Map<string, Handler>();
  const sendVerificationEmail = vi.fn(async () => true);
  const registerMulti: RegisterMulti = (_method, paths, handler) => {
    for (const p of paths) routes.set(p, handler);
  };
  const app: Record<string, unknown> = {};
  for (const method of ["get", "post", "put", "delete", "patch"]) {
    app[method] = (p: string, handler: Handler) => routes.set(p, handler);
  }

  const mod = loadModule("auth.ts", {
    "./auth-resend-policy.ts": {
      decideResend: () => ({ ok: true }),
      normalizeResendAction: (action: string) => action,
    },
    "./config.ts": {
      BCRYPT_ROUNDS: 4,
      clientIp: () => "127.0.0.1",
      extractToken: () => "jeton-de-test",
      generateVerificationCode: async () => "123456",
      getDb: () => sql,
      parseUserAgent: () => ({
        device_model: "",
        device_name: "",
        device_version: "",
        os: "",
      }),
      rateLimit: async () => true,
      rateLimitShared: async () => true,
      regenerateVerificationCode: async () => "123456",
      signToken: async () => "jeton-signe",
      sqlite: {},
      verifyToken: async () => ({ sub: "u1", tier: "Free" }),
      verifyVerificationCode: async () => true,
    },
    "./email.ts": { sendVerificationEmail },
    "./vibe-common.ts": { createRegisterMulti: () => registerMulti },
    "npm:bcryptjs": {
      compare: async () => true,
      hash: async () => "hash",
    },
  });

  const registerAuthRoutes = mod.registerAuthRoutes;
  if (typeof registerAuthRoutes !== "function") {
    throw new Error("registerAuthRoutes introuvable dans auth.ts");
  }
  (registerAuthRoutes as (a: unknown) => void)(app);
  return { routes, sendVerificationEmail };
}

const REGISTER_ALIASES = [
  "/register",
  "/v1/register",
  "/api/register",
  "/api/vibe/register",
];
const VERIFY_ALIASES = [
  "/verify-register",
  "/v1/verify-register",
  "/api/verify-register",
  "/api/vibe/verify-register",
];

const LONG_PASSWORD = "x".repeat(PASSWORD_MAX_LENGTH + 1);

describe("politique de mot de passe partagée (auth-password-policy)", () => {
  it("borne la longueur minimale et maximale", () => {
    expect(PASSWORD_MIN_LENGTH).toBe(6);
    expect(checkPasswordPolicy("")).not.toBeNull();
    expect(checkPasswordPolicy("a")).not.toBeNull();
    expect(checkPasswordPolicy("12345")).not.toBeNull();
    expect(checkPasswordPolicy("123456")).toBeNull();
    expect(checkPasswordPolicy("x".repeat(PASSWORD_MAX_LENGTH))).toBeNull();
    expect(checkPasswordPolicy(LONG_PASSWORD)).not.toBeNull();
    expect(checkPasswordPolicy(42)).not.toBeNull();
  });
});

describe("inscription Hono — /register et alias", () => {
  it("refuse 0, 1 et 5 caractères AVANT l'envoi de l'OTP", async () => {
    const { routes, sendVerificationEmail } = buildHandlers();
    for (const alias of REGISTER_ALIASES) {
      const handler = routes.get(alias);
      expect(handler, `handler absent pour ${alias}`).toBeTruthy();
      for (const password of ["", "a", "12345", LONG_PASSWORD]) {
        const res = await (handler as Handler)(
          makeContext({ email: "nouveau@x.fr", password, username: "testeur" })
        );
        expect(res.status, `${alias} avec ${JSON.stringify(password)}`).toBe(
          400
        );
      }
    }
    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });

  it("accepte 6 caractères et poursuit vers l'OTP", async () => {
    const { routes, sendVerificationEmail } = buildHandlers();
    for (const alias of REGISTER_ALIASES) {
      const handler = routes.get(alias) as Handler;
      const res = await handler(
        makeContext({
          email: "nouveau@x.fr",
          password: "123456",
          username: "testeur",
        })
      );
      expect(res.status, alias).toBe(200);
      expect(res.body.status).toBe("verification_required");
    }
    expect(sendVerificationEmail).toHaveBeenCalledTimes(
      REGISTER_ALIASES.length
    );
  });
});

describe("validation Hono — /verify-register et alias", () => {
  it("refuse 0, 1 et 5 caractères", async () => {
    const { routes } = buildHandlers();
    for (const alias of VERIFY_ALIASES) {
      const handler = routes.get(alias) as Handler;
      for (const password of ["", "a", "12345", LONG_PASSWORD]) {
        const res = await handler(
          makeContext({
            code: "123456",
            email: "nouveau@x.fr",
            password,
            username: "testeur",
          })
        );
        expect(res.status, `${alias} avec ${JSON.stringify(password)}`).toBe(
          400
        );
      }
    }
  });

  it("accepte 6 caractères et crée le compte", async () => {
    const { routes } = buildHandlers();
    for (const alias of VERIFY_ALIASES) {
      const handler = routes.get(alias) as Handler;
      const res = await handler(
        makeContext({
          code: "123456",
          email: "nouveau@x.fr",
          password: "123456",
          username: "testeur",
        })
      );
      expect(res.status, alias).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.token).toBe("string");
    }
  });
});

describe("pas de régression connexion ni changement de mot de passe", () => {
  it("la connexion accepte toujours un mot de passe valide", async () => {
    const { routes } = buildHandlers();
    const handler = routes.get("/login") as Handler;
    const res = await handler(
      makeContext({ identifier: "testeur", password: "un-mot-de-passe" })
    );
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("le changement de mot de passe garde le minimum et gagne la borne maximale", async () => {
    const { routes } = buildHandlers();
    const handler = routes.get("/update-profile") as Handler;
    const tropCourt = await handler(
      makeContext({ currentPassword: "ancien-mdp", password: "12345" })
    );
    expect(tropCourt.status).toBe(400);
    const tropLong = await handler(
      makeContext({ currentPassword: "ancien-mdp", password: LONG_PASSWORD })
    );
    expect(tropLong.status).toBe(400);
    const valide = await handler(
      makeContext({ currentPassword: "ancien-mdp", password: "nouveau-mdp" })
    );
    expect(valide.status).toBe(200);
  });
});
