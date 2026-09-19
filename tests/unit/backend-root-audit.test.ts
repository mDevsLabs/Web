import { readFileSync } from "node:fs";
import path from "node:path";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { describe, expect, it, vi } from "vitest";

const ROOT = path.resolve(import.meta.dirname, "..", "..");

function source(file: string) {
  return readFileSync(path.join(ROOT, file), "utf8");
}

function loadIsolated(file: string, stubs: Record<string, unknown> = {}) {
  let text = source(file);
  if (file === "config.ts") {
    const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
    text = ast.statements
      .filter((node) => {
        if (ts.isFunctionDeclaration(node)) {
          return ["rateLimit", "clientIp"].includes(node.name?.text ?? "");
        }
        return (
          ts.isVariableStatement(node) &&
          node.declarationList.declarations.some(
            (declaration) => declaration.name.getText(ast) === "__rateBuckets"
          )
        );
      })
      .map((node) => node.getText(ast))
      .join("\n");
  }
  const { outputText, diagnostics } = ts.transpileModule(text, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: file,
    reportDiagnostics: true,
  });
  expect(diagnostics).toEqual([]);
  const exports: Record<string, any> = {};
  runInNewContext(outputText, {
    console: { error: vi.fn(), warn: vi.fn() },
    Date,
    exports,
    require: (name: string) => {
      if (!Object.hasOwn(stubs, name)) {
        throw new Error(`Unstubbed dependency: ${name}`);
      }
      return stubs[name];
    },
  });
  return exports;
}

const D = (expr: string) => `\${${expr}}`;
const T = (label: string, expr: string) => `\`${label}:${D(expr)}\``;

const CALLS = [
  [
    "auth.ts",
    [
      `${T("register", "clientIp(c)")}, 5, 15 * 60_000`,
      `${T("login", "clientIp(c)")}, 10, 5 * 60_000`,
    ],
  ],
  ["vibe-posts-crud.ts", [`${T("post", "userId")}, 10, 5 * 60_000`]],
  ["vibe-posts-engage.ts", [`${T("mai-cmd", "userId")}, 5, 60_000`]],
  ["vibe-mai-execute.ts", [`${T("mai-execute", "userId")}, 30, 60_000`]],
  [
    "vibe-ai.ts",
    [
      `${T("ai-text", "userId")}, action === "complete" ? 40 : 20, 60_000`,
      `${T("ai-translate", "userId")}, 20, 60_000`,
    ],
  ],
  ["vibe-users.ts", [`${T("pv", "viewerId}:${targetId".slice(0, 0) + "viewerId}:${targetId")}, 1, 60_000`]],
] as const;

function context(pathname: string, headers: Record<string, string> = {}) {
  return {
    json: (body: unknown, status = 200) => ({ body, status }),
    req: {
      header: (name: string) => headers[name.toLowerCase()],
      method: "POST",
      path: pathname,
      query: () => undefined,
    },
    res: { status: 200 },
    set: vi.fn(),
  };
}

describe("bounded root backend audit", () => {
  it.each(CALLS)("%s awaits every limiter with its original key and window", (file, expected) => {
    const ast = ts.createSourceFile(file, source(file), ts.ScriptTarget.Latest, true);
    const calls: string[] = [];
    function visit(node: ts.Node) {
      if (ts.isCallExpression(node) && node.expression.getText(ast) === "rateLimit") {
        expect(ts.isAwaitExpression(node.parent)).toBe(true);
        calls.push(node.arguments.map((arg) => arg.getText(ast)).join(", "));
      }
      ts.forEachChild(node, visit);
    }
    visit(ast);
    expect(calls).toEqual(expected);
  });

  it.each([60_000, 5 * 60_000, 15 * 60_000])("enforces limits and expires at %i ms", async (windowMs) => {
    const clock = vi.spyOn(Date, "now").mockReturnValue(1000);
    try {
      const { rateLimit } = loadIsolated("config.ts");
      expect(await rateLimit("post:1", 2, windowMs)).toBe(true);
      expect(await rateLimit("post:1", 2, windowMs)).toBe(true);
      expect(await rateLimit("post:1", 2, windowMs)).toBe(false);
      expect(await rateLimit("post:2", 2, windowMs)).toBe(true);
      expect(await rateLimit("ai-text:1", 2, windowMs)).toBe(true);
      clock.mockReturnValue(1000 + windowMs - 1);
      expect(await rateLimit("post:1", 2, windowMs)).toBe(false);
      clock.mockReturnValue(1000 + windowMs);
      expect(await rateLimit("post:1", 2, windowMs)).toBe(true);
    } finally {
      clock.mockRestore();
    }
  });

  it("separates IPs and viewer-target pairs", async () => {
    const { clientIp, rateLimit } = loadIsolated("config.ts");
    const ip = clientIp(context("/login", { "x-forwarded-for": "192.0.2.1, 192.0.2.2" }));
    expect(ip).toBe("192.0.2.1");
    expect(await rateLimit(`login:${ip}`, 1, 60_000)).toBe(true);
    expect(await rateLimit(`login:${ip}`, 1, 60_000)).toBe(false);
    expect(await rateLimit("login:192.0.2.2", 1, 60_000)).toBe(true);
    expect(await rateLimit("pv:1:2", 1, 60_000)).toBe(true);
    expect(await rateLimit("pv:1:2", 1, 60_000)).toBe(false);
    expect(await rateLimit("pv:1:3", 1, 60_000)).toBe(true);
    expect(await rateLimit("pv:2:3", 1, 60_000)).toBe(true);
  });

  it("registers every alias for all five supported methods", () => {
    const { createRegisterMulti } = loadIsolated("vibe-common.ts", { "./config.ts": {} });
    const app = { delete: vi.fn(), get: vi.fn(), patch: vi.fn(), post: vi.fn(), put: vi.fn() };
    const register = createRegisterMulti(app);
    const handler = vi.fn();
    for (const method of ["get", "post", "delete", "patch", "put"] as const) {
      register(method, ["/first", "/second"], handler);
      expect(app[method].mock.calls).toEqual([["/first", handler], ["/second", handler]]);
    }
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, -1, "10", null, true])("rejects invalid usage %s before accessing DB", async (tokens) => {
    const sql = vi.fn().mockResolvedValue([]);
    const getDb = vi.fn(() => sql);
    const { registerVibeSettingsRoutes } = loadIsolated("vibe-settings.ts", {
      "./config.ts": {
        extractToken: () => "stub-token",
        getDb,
        getWeekData: () => ({ weekStartStr: "2026-09-14" }),
        verifyToken: async () => ({ sub: "1" }),
      },
      "./vibe-tools.ts": {},
    });
    const register = vi.fn();
    registerVibeSettingsRoutes({}, register);
    const handler = register.mock.calls.find((call) => call[1].includes("/usage/log"))?.[2];
    expect(handler).toBeTypeOf("function");
    const c = context("/usage/log");
    const result = await handler({ ...c, req: { ...c.req, json: async () => ({ tokens }) } });
    expect(result.status).toBe(400);
    expect(result.body.success).toBe(false);
    expect(getDb).not.toHaveBeenCalled();
    expect(sql).not.toHaveBeenCalled();
  });

  it.each([0, 10, undefined])("preserves valid/default usage %s with stubbed persistence", async (tokens) => {
    const sql = vi.fn().mockResolvedValue([]);
    const { registerVibeSettingsRoutes } = loadIsolated("vibe-settings.ts", {
      "./config.ts": {
        extractToken: () => "stub-token",
        getDb: () => sql,
        getWeekData: () => ({ weekStartStr: "2026-09-14" }),
        verifyToken: async () => ({ sub: "1" }),
      },
      "./vibe-tools.ts": {},
    });
    const register = vi.fn();
    registerVibeSettingsRoutes({}, register);
    const handler = register.mock.calls.find((call) => call[1].includes("/usage/log"))?.[2];
    const c = context("/usage/log");
    expect(await handler({ ...c, req: { ...c.req, json: async () => ({ tokens }) } })).toEqual({
      body: { logged: true, success: true }, status: 200,
    });
    expect(sql).toHaveBeenCalledTimes(2);
    expect(sql.mock.calls[0][3]).toBe(tokens ?? 10);
  });

  it.each(["initial-query", "db-init", "jwt-user-query"])("returns 503 without next on %s failure", async (failure) => {
    const sql = vi.fn();
    if (failure === "jwt-user-query") sql.mockResolvedValueOnce([]);
    sql.mockRejectedValue(new Error("stub DB failure"));
    const getDb = () => {
      if (failure === "db-init") throw new Error("stub init failure");
      return sql;
    };
    const { registerMiddleware } = loadIsolated("api-middleware.ts", {
      "./config.ts": {
        extractTierFromApiKey: () => null,
        getDb,
        getEnv: () => undefined,
        verifyToken: async () => ({ sub: "1", tier: "Plus" }),
      },
    });
    const use = vi.fn();
    registerMiddleware({ use });
    const middleware = use.mock.calls[0][1];
    for (const pathname of ["/v1/chat/completions", "/v1/models"]) {
      const next = vi.fn();
      const c = context(pathname, { authorization: "Bearer stub-token" });
      expect(await middleware(c, next)).toEqual({
        body: { error: "Authentication service unavailable." }, status: 503,
      });
      expect(next).not.toHaveBeenCalled();
      expect(c.set).not.toHaveBeenCalled();
    }
  });

  it("keeps invalid credentials at 403 and public anonymous access working", async () => {
    const { registerMiddleware } = loadIsolated("api-middleware.ts", {
      "./config.ts": {
        extractTierFromApiKey: () => null,
        getDb: () => vi.fn().mockResolvedValue([]),
        getEnv: () => undefined,
        verifyToken: vi.fn().mockRejectedValue(new Error("stub invalid token")),
      },
    });
    const use = vi.fn();
    registerMiddleware({ use });
    const middleware = use.mock.calls[0][1];
    const next = vi.fn();
    expect((await middleware(context("/v1/chat/completions", { authorization: "Bearer stub-token" }), next)).status).toBe(403);
    expect(next).not.toHaveBeenCalled();
    await middleware(context("/v1/models"), next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
